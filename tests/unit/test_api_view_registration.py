"""Regression: alle KNX-Stats-Views muessen tatsaechlich registriert werden.

Hintergrund: bei einer frueheren Erweiterung wurden neue View-Klassen in
``api/knx_stats.py`` ergaenzt (Burst-Detector, Buslast-KPI, Bus-Health-Score,
Sicherheits-Audit, Long-Term, Bus-Analysis-State, Sensitive-Set), aber die
zentrale Registrierung in ``api/messages.async_register_views`` wurde nicht
mitgezogen. Das Frontend ruft diese Endpunkte und bekommt 404 zurueck.

Dieser Test garantiert, dass jede in ``knx_stats.py`` definierte
``KnxStats*View``-Klasse beim Setup tatsaechlich beim HA-HTTP-Layer
registriert wird, sodass kein neuer View-Endpunkt mehr unbemerkt aus der
Registrierung fallen kann.

Wir parsen die Source mit ``ast``, damit der Test ohne installierten
Home-Assistant-Stack laeuft (die View-Klassen erben von
``HomeAssistantView``, welches HA voraussetzt).
"""

from __future__ import annotations

import ast
from pathlib import Path

_API_DIR = Path(__file__).resolve().parents[2] / "custom_components" / "messagehub" / "api"


def _knx_stats_view_classes() -> dict[str, str]:
    """Extrahiert alle ``KnxStats*View``-Klassen aus knx_stats.py samt URL.

    Returns: dict {ClassName: url-string}
    """
    src = (_API_DIR / "knx_stats.py").read_text(encoding="utf-8")
    tree = ast.parse(src)
    result: dict[str, str] = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue
        if not (node.name.startswith("KnxStats") and node.name.endswith("View")):
            continue
        url = ""
        for stmt in node.body:
            if (
                isinstance(stmt, ast.Assign)
                and len(stmt.targets) == 1
                and isinstance(stmt.targets[0], ast.Name)
                and stmt.targets[0].id == "url"
                and isinstance(stmt.value, ast.Constant)
                and isinstance(stmt.value.value, str)
            ):
                url = stmt.value.value
                break
        result[node.name] = url
    return result


def _registered_view_class_names() -> set[str]:
    """Extrahiert alle Klassen-Namen aus dem for-Tuple in
    ``async_register_views`` von messages.py.
    """
    src = (_API_DIR / "messages.py").read_text(encoding="utf-8")
    tree = ast.parse(src)
    for node in ast.walk(tree):
        if not (isinstance(node, ast.FunctionDef) and node.name == "async_register_views"):
            continue
        for stmt in ast.walk(node):
            if not isinstance(stmt, ast.For):
                continue
            iter_node = stmt.iter
            if isinstance(iter_node, ast.Tuple):
                return {elt.id for elt in iter_node.elts if isinstance(elt, ast.Name)}
    return set()


class TestKnxStatsViewRegistration:
    def test_all_knx_stats_views_are_registered(self) -> None:
        """Jede KnxStats*View aus knx_stats.py muss in messages.async_register_views auftauchen."""
        registered = _registered_view_class_names()
        defined = set(_knx_stats_view_classes().keys())
        missing = defined - registered
        assert not missing, (
            f"KnxStats-Views ohne Registrierung -> 404 im Panel: {sorted(missing)}"
        )

    def test_known_endpoints_have_registered_view(self) -> None:
        """Spezifische, vom Panel benoetigte Endpunkte muessen registriert sein.

        Spiegelt die im Bug-Report erwaehnten 404-Routen wider.
        """
        registered = _registered_view_class_names()
        defined = _knx_stats_view_classes()
        registered_urls = {
            url for cls_name, url in defined.items() if cls_name in registered and url
        }
        required = {
            "/api/messagehub/knx-stats/busload",
            "/api/messagehub/knx-stats/health-score",
            "/api/messagehub/knx-stats/bursts",
            "/api/messagehub/knx-stats/sensitive-log",
            "/api/messagehub/knx-stats/long-term",
            "/api/messagehub/knx-stats/bus-analysis-state",
            "/api/messagehub/knx-stats/sensitive/{ga}",
        }
        missing = required - registered_urls
        assert not missing, f"Fehlende Endpunkte in async_register_views: {sorted(missing)}"

    def test_registered_classes_are_imported_in_messages(self) -> None:
        """Im for-Tuple verwendete KnxStats-Namen muessen in messages.py importiert sein."""
        src = (_API_DIR / "messages.py").read_text(encoding="utf-8")
        registered = _registered_view_class_names()
        knx_names = {n for n in registered if n.startswith("KnxStats")}
        for name in knx_names:
            assert name in src.split("def async_register_views")[0], (
                f"{name} im Registrierungs-Tuple, aber nicht oben importiert"
            )
