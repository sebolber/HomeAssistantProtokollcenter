"""Iter B3: Repeat-Quote rebalanciert + als Approximation markiert.

Konzept-Schwaeche B3: Der Repeat-Quote-KPI im Bus-Health-Score nimmt
30% Gewicht ein, basiert aber auf ``knx_raw_telegrams.repeated`` —
ein Flag, das xknx selten/nie liefert (Cemi-Frame-Lage). In der
Praxis bleibt repeat_ratio_pct daher fast immer 0%, der KPI ist
unbenutzt aber zaehlt im Score voll mit.

Loesung in dieser Iter:
1. _WEIGHT_REPEAT runter auf 0.10 (war 0.30).
2. Komplementaer: _WEIGHT_BUSLOAD hoch auf 0.40, _WEIGHT_SILENCE auf
   0.25, _WEIGHT_ALARMS auf 0.25 — alle drei sind realistische
   Indikatoren mit echten Daten.
3. KPI-Output enthaelt eine ``approximate=True``-Markierung, damit
   Frontend dem User "Approximation" anzeigen kann.
4. Summe aller Gewichte = 1.0.
"""

from __future__ import annotations

from custom_components.messagehub.processing.knx_stats import (
    HealthScoreInput,
    compute_health_score,
)


def test_health_score_weights_sum_to_one() -> None:
    from custom_components.messagehub.processing.knx_stats import (
        _WEIGHT_ALARMS,
        _WEIGHT_BUSLOAD,
        _WEIGHT_REPEAT,
        _WEIGHT_SILENCE,
    )

    total = _WEIGHT_ALARMS + _WEIGHT_BUSLOAD + _WEIGHT_REPEAT + _WEIGHT_SILENCE
    assert abs(total - 1.0) < 0.001


def test_repeat_weight_is_low_after_rebalance() -> None:
    """Iter B3: _WEIGHT_REPEAT <= 0.15 (vorher 0.30)."""
    from custom_components.messagehub.processing.knx_stats import _WEIGHT_REPEAT

    assert _WEIGHT_REPEAT <= 0.15


def test_busload_weight_is_high_after_rebalance() -> None:
    """Iter B3: _WEIGHT_BUSLOAD >= 0.35 (vorher 0.30) — buslast ist
    der realistischste Indikator."""
    from custom_components.messagehub.processing.knx_stats import _WEIGHT_BUSLOAD

    assert _WEIGHT_BUSLOAD >= 0.35


def test_health_score_with_zero_repeat_still_high_under_normal_load() -> None:
    """Realistisches Szenario: Repeat=0% (xknx liefert es nicht), Busload
    moderat, kein silent device, keine Alarme → Score sollte hoch sein.

    Vorher konnte ein 0%-Repeat den Score auf ~70 ziehen (weil
    component=100, weight=0.3 → 30 Punkte allein, Rest dependent).
    Jetzt sollte der Score dicht bei 100 liegen."""
    result = compute_health_score(
        HealthScoreInput(
            repeat_ratio_pct=0.0,
            busload_max_pct=5.0,  # moderat
            silent_devices=0,
            open_alarms=0,
        )
    )
    assert result["score"] >= 95


def test_health_score_repeat_kpi_marked_as_approximate() -> None:
    """Frontend muss erkennen, dass der Repeat-KPI eine Approximation
    ist — ueber das ``components.repeat_approximate=True``-Flag."""
    result = compute_health_score(
        HealthScoreInput(
            repeat_ratio_pct=0.0,
            busload_max_pct=5.0,
            silent_devices=0,
            open_alarms=0,
        )
    )
    assert result.get("repeat_approximate") is True


def test_health_score_high_busload_dominates() -> None:
    """Wenn die Buslast ueber dem Limit ist, soll der Score eindeutig
    schlechter werden — die Buslast ist der wichtigste KPI."""
    result_low = compute_health_score(
        HealthScoreInput(
            repeat_ratio_pct=0.0,
            busload_max_pct=10.0,
            silent_devices=0,
            open_alarms=0,
        )
    )
    result_high = compute_health_score(
        HealthScoreInput(
            repeat_ratio_pct=0.0,
            busload_max_pct=45.0,  # nahe Limit
            silent_devices=0,
            open_alarms=0,
        )
    )
    assert result_high["score"] < result_low["score"]
    # Score-Drop bei hoher Buslast spuerbar (>= 25 Punkte Differenz).
    # 0.40*Δhealth — bei busload 10→45 sinkt component_health von 80
    # auf 10, gewichtet 0.40 = 28 Punkte Score-Drop.
    assert result_low["score"] - result_high["score"] >= 25
