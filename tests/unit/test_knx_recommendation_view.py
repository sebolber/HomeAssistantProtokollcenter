"""Iter L1.3: Tests fuer KnxStatsSourceRecommendationView.

Reine AST-/String-Tests, keine View-Instanziierung — der View-Modul-
Import benoetigt ``homeassistant``, das in der Test-Sandbox nicht
existiert. Cache-Verhaltens-Tests liegen in
``test_recommendation_cache.py`` (HA-frei).
"""

from __future__ import annotations

import ast
from pathlib import Path


_SRC = (
    Path(__file__).resolve().parents[2]
    / "custom_components"
    / "messagehub"
    / "api"
    / "knx_stats.py"
)


def _find_class(class_name: str) -> ast.ClassDef:
    tree = ast.parse(_SRC.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == class_name:
            return node
    raise AssertionError(f"Klasse {class_name} nicht gefunden")


def _get_method(cls: ast.ClassDef) -> ast.AsyncFunctionDef:
    return next(
        s for s in cls.body if isinstance(s, ast.AsyncFunctionDef) and s.name == "get"
    )


def test_view_class_exists_with_correct_url() -> None:
    cls = _find_class("KnxStatsSourceRecommendationView")
    assigns = {
        node.targets[0].id: ast.literal_eval(node.value)
        for node in cls.body
        if isinstance(node, ast.Assign)
        and len(node.targets) == 1
        and isinstance(node.targets[0], ast.Name)
        and isinstance(node.value, ast.Constant)
    }
    assert assigns.get("url") == (
        "/api/messagehub/knx-stats/source/{dev_source}/recommendation"
    )
    assert assigns.get("name") == "api:messagehub:knx-stats:source-recommendation"


def test_view_get_calls_check_admin() -> None:
    body_src = ast.unparse(_get_method(_find_class("KnxStatsSourceRecommendationView")))
    assert "_check_admin" in body_src


def test_view_get_validates_dev_source() -> None:
    body_src = ast.unparse(_get_method(_find_class("KnxStatsSourceRecommendationView")))
    assert "validate_knx_individual_address" in body_src


def test_view_get_uses_parse_iso_period_with_max_days() -> None:
    body_src = ast.unparse(_get_method(_find_class("KnxStatsSourceRecommendationView")))
    assert "parse_iso_period" in body_src
    assert "max_days=" in body_src


def test_view_get_uses_rate_limiter_with_dev_source_key() -> None:
    body_src = ast.unparse(_get_method(_find_class("KnxStatsSourceRecommendationView")))
    assert "_recommendation_limiter" in body_src
    assert ".allow(" in body_src
    # Limiter-Key muss dev_source enthalten — sonst greift die Limit-
    # Begruendung "pro Geraet" nicht.
    assert "dev_source" in body_src


def test_view_get_uses_cache_get_and_set() -> None:
    body_src = ast.unparse(_get_method(_find_class("KnxStatsSourceRecommendationView")))
    assert "_recommendation_cache" in body_src
    # Cache-Hit-Pfad: get vor compute-Aufruf
    assert "_recommendation_cache.get(" in body_src
    # Cache-Schreibpfad: set nach erfolgreichem compute
    assert "_recommendation_cache.set(" in body_src


def test_view_returns_404_for_none_recommendation() -> None:
    body_src = ast.unparse(_get_method(_find_class("KnxStatsSourceRecommendationView")))
    assert "ERR_NOT_FOUND" in body_src
    assert "status_code=404" in body_src


def test_view_no_audit_log_for_read_only() -> None:
    body_src = ast.unparse(_get_method(_find_class("KnxStatsSourceRecommendationView")))
    assert "audit(" not in body_src


def test_view_returns_429_on_rate_limit() -> None:
    body_src = ast.unparse(_get_method(_find_class("KnxStatsSourceRecommendationView")))
    assert "status=429" in body_src or "status_code=429" in body_src
    assert "Retry-After" in body_src


def test_view_is_imported_and_registered_in_async_register_views() -> None:
    """Die View muss in ``api/messages.py`` importiert UND im
    register-Tuple aufgefuehrt sein, sonst lebt sie tot."""
    messages_src = (_SRC.parent / "messages.py").read_text(encoding="utf-8")
    occurrences = messages_src.count("KnxStatsSourceRecommendationView")
    assert occurrences >= 2, (
        "Erwartet: 1x Import + 1x Register-Tuple-Eintrag in messages.py."
    )


def test_view_is_in_register_knx_stats_views() -> None:
    """Konsistenz: auch im legacy ``register_knx_stats_views``-Tuple."""
    src = _SRC.read_text(encoding="utf-8")
    register_section = src[src.index("def register_knx_stats_views"):]
    assert "KnxStatsSourceRecommendationView()" in register_section


def test_view_uses_counter_retention_for_max_days() -> None:
    """Counter-Retention erlaubt 365 Tage — Recommendation-Endpoint
    muss das durchreichen, damit User Long-Term-Trends abfragen
    koennen."""
    body_src = ast.unparse(_get_method(_find_class("KnxStatsSourceRecommendationView")))
    # Entweder als Konstante referenziert oder direkt 365.
    assert (
        "DEFAULT_KNX_COUNTER_RETENTION_DAYS" in body_src
        or "365" in body_src
    )
