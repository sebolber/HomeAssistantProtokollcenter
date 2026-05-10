"""Iter A1: KNX-Listener-Batching ueber Worker-Queue.

Hot-Path-Performance: Pro Telegramm soll der Listener nicht mehr zwei
einzelne SQL-Statements (insert_raw + increment_counter) feuern, sondern
in eine asyncio-Queue droppen. Ein Worker batched mehrere Telegramme
und schreibt sie mit `executemany()` in einem Commit.

Tests verifizieren:
1. Telegramme werden in der Queue gepuffert.
2. Worker flusht bei Queue-Voll oder nach Flush-Intervall.
3. Bus-Analyse-Disable-Flag stoppt das Befuellen der Queue.
4. Crash beim Worker bricht den Hot-Path nicht ab (Resilienz).
5. Queue-Hard-Cap wirkt — bei DoS werden aelteste Eintraege verworfen.
"""

from __future__ import annotations

import asyncio
from typing import Any

import pytest

from custom_components.messagehub.const import DOMAIN, HASS_KEY_KNX_BUS_ANALYSIS
from custom_components.messagehub.listeners.knx import KnxTelegramData


class _FakeHass:
    def __init__(self, bus_analysis: bool = True) -> None:
        self.data: dict[str, Any] = {DOMAIN: {HASS_KEY_KNX_BUS_ANALYSIS: bus_analysis}}


class _RecordingRepo:
    def __init__(self) -> None:
        self.batches: list[list[dict[str, Any]]] = []
        self.counter_batches: list[list[tuple[str, str]]] = []

    async def insert_raw_batch(self, rows: list[dict[str, Any]]) -> None:
        self.batches.append(list(rows))

    async def increment_counter_batch(self, items: list[tuple[str, str]]) -> None:
        self.counter_batches.append(list(items))


def _make_telegram(ga: str = "1/2/3", value: object = 1) -> KnxTelegramData:
    return KnxTelegramData(
        source="1.1.5",
        destination=ga,
        telegramtype="GroupValueWrite",
        value=value,
        raw=None,
        repeated=False,
    )


@pytest.mark.asyncio
async def test_worker_flushes_batched_telegrams_to_repo() -> None:
    from custom_components.messagehub.listeners.knx import KnxIngestWorker

    repo = _RecordingRepo()
    worker = KnxIngestWorker(repo, max_batch_size=10, flush_interval_sec=0.05)
    await worker.start()
    try:
        for i in range(5):
            worker.enqueue(_FakeHass(), _make_telegram(ga=f"1/2/{i}"))
        await asyncio.sleep(0.15)
    finally:
        await worker.stop()

    flushed = [row for batch in repo.batches for row in batch]
    assert len(flushed) == 5
    assert {r["destination"] for r in flushed} == {f"1/2/{i}" for i in range(5)}
    counters = [item for batch in repo.counter_batches for item in batch]
    assert len(counters) == 5


@pytest.mark.asyncio
async def test_worker_flushes_when_batch_size_reached() -> None:
    from custom_components.messagehub.listeners.knx import KnxIngestWorker

    repo = _RecordingRepo()
    worker = KnxIngestWorker(repo, max_batch_size=3, flush_interval_sec=10.0)
    await worker.start()
    try:
        for i in range(3):
            worker.enqueue(_FakeHass(), _make_telegram(ga=f"1/2/{i}"))
        await asyncio.sleep(0.1)
        assert len(repo.batches) == 1
        assert len(repo.batches[0]) == 3
    finally:
        await worker.stop()


@pytest.mark.asyncio
async def test_disabled_flag_drops_telegram_silently() -> None:
    from custom_components.messagehub.listeners.knx import KnxIngestWorker

    repo = _RecordingRepo()
    worker = KnxIngestWorker(repo, max_batch_size=10, flush_interval_sec=0.05)
    await worker.start()
    try:
        worker.enqueue(_FakeHass(bus_analysis=False), _make_telegram())
        await asyncio.sleep(0.1)
    finally:
        await worker.stop()

    assert repo.batches == []
    assert repo.counter_batches == []


@pytest.mark.asyncio
async def test_repo_crash_does_not_propagate() -> None:
    from custom_components.messagehub.listeners.knx import KnxIngestWorker

    class _CrashingRepo:
        async def insert_raw_batch(self, rows: list[dict[str, Any]]) -> None:
            raise RuntimeError("simulated DB lock")

        async def increment_counter_batch(self, items: list[tuple[str, str]]) -> None:
            pass

    worker = KnxIngestWorker(_CrashingRepo(), max_batch_size=10, flush_interval_sec=0.05)
    await worker.start()
    try:
        worker.enqueue(_FakeHass(), _make_telegram())
        await asyncio.sleep(0.1)
    finally:
        await worker.stop()


@pytest.mark.asyncio
async def test_queue_overflow_drops_oldest() -> None:
    """DoS-Schutz: Bei Queue-Voll werden aelteste Eintraege verworfen,
    damit der Hot-Path nie blockiert."""
    from custom_components.messagehub.listeners.knx import KnxIngestWorker

    repo = _RecordingRepo()
    worker = KnxIngestWorker(
        repo,
        max_batch_size=10,
        flush_interval_sec=10.0,
        max_queue_size=5,
    )
    # Worker NICHT starten — wir wollen Queue manuell fuellen.
    for i in range(20):
        worker.enqueue(_FakeHass(), _make_telegram(ga=f"1/2/{i}"))
    # Queue darf nicht ueber max_queue_size wachsen.
    assert worker.qsize() <= 5
    # Dropped-Counter zeigt, dass DoS-Schutz griff.
    assert worker.dropped_count >= 15


@pytest.mark.asyncio
async def test_external_cancel_results_in_cancelled_task_state() -> None:
    """Externer ``task.cancel()`` muss den Worker als CANCELLED beenden,
    nicht als FINISHED. Sonar S7497 / async-best-practice: ein gefangenes
    ``CancelledError`` muss re-raised werden, sonst bricht die Cancel-
    Propagation an Task-Grenzen ab."""
    from custom_components.messagehub.listeners.knx import KnxIngestWorker

    worker = KnxIngestWorker(_RecordingRepo(), max_batch_size=10, flush_interval_sec=10.0)
    await worker.start()
    task = worker._task
    assert task is not None
    # Task in den await-Point von _run() laufen lassen, sonst trifft das
    # cancel() einen PENDING-Task und der Body wird nie betreten.
    await asyncio.sleep(0.05)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    assert task.cancelled(), (
        "Worker-Task muss CANCELLED-Status haben, nicht FINISHED — "
        "sonst hat _run() das CancelledError verschluckt."
    )


@pytest.mark.asyncio
async def test_stop_flushes_pending_telegrams() -> None:
    """Beim Shutdown muessen pending Telegramme noch raus, damit kein
    Datenverlust beim HA-Reload entsteht."""
    from custom_components.messagehub.listeners.knx import KnxIngestWorker

    repo = _RecordingRepo()
    worker = KnxIngestWorker(repo, max_batch_size=100, flush_interval_sec=10.0)
    await worker.start()
    for i in range(7):
        worker.enqueue(_FakeHass(), _make_telegram(ga=f"1/2/{i}"))
    # Stop muss flushen.
    await worker.stop()
    flushed = [row for batch in repo.batches for row in batch]
    assert len(flushed) == 7
