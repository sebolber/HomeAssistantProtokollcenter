"""Iter L1.5: Schema-Contract zwischen Backend-DTO und Frontend-Interface.

Backend ``device_recommendation_to_dict`` (Python) und Frontend
``KnxStatsSourceRecommendationDto`` (TypeScript) muessen feldweise
synchron bleiben. Dieser Test parst das TS-Interface und vergleicht
es gegen die JSON-Keys, die das Backend tatsaechlich produziert.

Wir verlassen uns auf den Repository-Layer in einer In-Memory-SQLite
und rufen den Service direkt — kein HTTP-Stack noetig.
"""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_recommend_service import (
    compute_device_recommendation,
    device_recommendation_to_dict,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner


_FRONTEND_DTO_PATH = (
    Path(__file__).resolve().parents[2]
    / "frontend"
    / "src"
    / "api-client.ts"
)

_NOW = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)


# ---------------------------------------------------------------------------
# Frontend-DTO-Parser (regex-basiert — wir wollen keinen TS-Compiler-Bridge)
# ---------------------------------------------------------------------------


def _extract_interface_fields(
    src: str, interface_name: str
) -> set[str]:
    """Extrahiert Top-Level-Felder eines TS-Interface aus dem Source.

    Robust gegen Kommentare, optionale Felder (``?:``), Zeilen-Whitespace.
    Akzeptiert nur einfache Property-Definitionen — komplexe Generic-
    Signaturen sind hier nicht noetig.
    """
    pattern = re.compile(
        rf"export interface {re.escape(interface_name)}\s*\{{([^}}]+)\}}",
        re.DOTALL,
    )
    match = pattern.search(src)
    assert match, (
        f"Interface {interface_name} nicht in api-client.ts gefunden"
    )
    body = match.group(1)
    fields: set[str] = set()
    for raw_line in body.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("//") or line.startswith("/*"):
            continue
        # "name?: Type;" oder "name: Type;"
        prop = re.match(r"([A-Za-z_][A-Za-z0-9_]*)\??\s*:", line)
        if prop:
            fields.add(prop.group(1))
    return fields


# ---------------------------------------------------------------------------
# Pure-Schema-Tests — keine SQLite noetig
# ---------------------------------------------------------------------------


def test_top_level_dto_fields_match_frontend() -> None:
    src = _FRONTEND_DTO_PATH.read_text(encoding="utf-8")
    frontend_fields = _extract_interface_fields(
        src, "KnxStatsSourceRecommendationDto"
    )
    # ``from``/``to`` sind optional und werden vom View extra angefuegt
    # — Backend-Helper schreibt nur die Pflichtfelder.
    expected_required = {
        "dev_source",
        "headline_mode",
        "headline_recommendation",
        "confidence",
        "reasoning",
        "generated_at",
        "ga_recommendations",
    }
    missing = expected_required - frontend_fields
    assert not missing, (
        f"Frontend-DTO fehlen Pflichtfelder: {missing}"
    )


def test_ga_dto_fields_match_frontend() -> None:
    src = _FRONTEND_DTO_PATH.read_text(encoding="utf-8")
    fields = _extract_interface_fields(src, "KnxRecommendationGaDto")
    expected = {
        "ga", "label", "dpt", "observed", "recommended_mode",
        "recommended_cycle_minutes", "recommended_hysteresis",
        "severity", "rationale",
    }
    missing = expected - fields
    assert not missing, f"Frontend-GA-DTO fehlen Felder: {missing}"


def test_observed_dto_fields_match_frontend() -> None:
    src = _FRONTEND_DTO_PATH.read_text(encoding="utf-8")
    fields = _extract_interface_fields(src, "KnxRecommendationObservedDto")
    expected = {
        "mode", "confidence", "sample_count", "value_changes",
        "median_interval_s", "median_interval_minutes", "stdev_interval_s",
    }
    missing = expected - fields
    assert not missing, f"Frontend-Observed-DTO fehlen Felder: {missing}"


# ---------------------------------------------------------------------------
# Live-Roundtrip mit echter SQLite — Backend produziert ein DTO,
# das alle deklarierten Frontend-Felder enthaelt
# ---------------------------------------------------------------------------


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


def _ts(offset_s: float) -> str:
    return (_NOW + timedelta(seconds=offset_s)).isoformat(timespec="seconds")


async def _seed_recommendation_data(db: Database) -> None:
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        ("1/2/3", "Wohnzimmer Temperatur", "9.001", now, now),
    )
    for i in range(40):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-3600 + i * 60), "1/2/3", "1.1.10",
                "GroupValueWrite", json.dumps(21.5), 0,
            ),
        )


@pytest.mark.asyncio
async def test_backend_dto_keys_satisfy_frontend_contract(
    db: Database,
) -> None:
    """Backend-Service produziert ein DTO, das alle Pflichtfelder
    der Frontend-Interfaces enthaelt — JSON-encoded round-trip."""
    await _seed_recommendation_data(db)
    repo = KnxStatsRepository(db)
    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-3700), _ts(60)
    )
    assert reco is not None

    payload = device_recommendation_to_dict(reco)
    encoded = json.loads(json.dumps(payload))

    src = _FRONTEND_DTO_PATH.read_text(encoding="utf-8")
    top_required = {
        "dev_source", "headline_mode", "headline_recommendation",
        "confidence", "reasoning", "generated_at", "ga_recommendations",
    }
    assert top_required.issubset(encoded.keys())

    ga_fields = _extract_interface_fields(src, "KnxRecommendationGaDto")
    obs_fields = _extract_interface_fields(src, "KnxRecommendationObservedDto")
    assert encoded["ga_recommendations"], "GAs sollten im Test gefuellt sein"
    for ga in encoded["ga_recommendations"]:
        assert ga_fields.issubset(ga.keys()), (
            f"GA-Eintrag fehlen Felder: {ga_fields - ga.keys()}"
        )
        assert obs_fields.issubset(ga["observed"].keys()), (
            f"observed fehlen Felder: {obs_fields - ga['observed'].keys()}"
        )


@pytest.mark.asyncio
async def test_dto_roundtrip_through_json_does_not_lose_fields(
    db: Database,
) -> None:
    """Schaerferer Roundtrip: encode + decode + Felder-Vollzaehligkeit."""
    await _seed_recommendation_data(db)
    repo = KnxStatsRepository(db)
    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-3700), _ts(60)
    )
    assert reco is not None

    payload = device_recommendation_to_dict(reco)
    encoded = json.dumps(payload)
    decoded = json.loads(encoded)

    # Headline-Pflichtfelder: keine None unbeabsichtigt.
    assert decoded["dev_source"] == "1.1.10"
    assert isinstance(decoded["headline_recommendation"], str)
    assert decoded["headline_mode"] in (
        "cyclic", "on_change", "hybrid", "silent", "insufficient",
    )
    assert decoded["confidence"] in ("high", "medium", "low")
    assert isinstance(decoded["reasoning"], list)
    assert isinstance(decoded["ga_recommendations"], list)


# ---------------------------------------------------------------------------
# Bundle-Hygiene: Recommendation-Card-Code ist im Bundle (kein
# tree-shaking-Drop bei lazy-load Render).
# ---------------------------------------------------------------------------


def test_bundle_contains_recommendation_card_marker() -> None:
    """Smoke: das gebaute Bundle enthaelt unsere Card-CSS-Klasse +
    den API-Endpoint-Pfad. Verhindert ein versehentliches
    tree-shaking durch Vite."""
    bundle = (
        Path(__file__).resolve().parents[2]
        / "custom_components"
        / "messagehub"
        / "frontend_dist"
        / "messagehub-panel.js"
    )
    assert bundle.exists(), "Frontend-Bundle ist nicht im Repo committed"
    content = bundle.read_text(encoding="utf-8", errors="ignore")
    assert "recommendation-card" in content, (
        "Card-CSS-Marker fehlt im Bundle — Card-Render wuerde kein "
        "Styling bekommen."
    )
    assert "/recommendation" in content, (
        "API-Endpoint-Pfad fehlt im Bundle — Frontend kann den "
        "Endpoint nicht aufrufen."
    )
