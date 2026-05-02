"""Iter 69 / K2: Prometheus-Text-Exporter."""

from __future__ import annotations

from custom_components.messagehub.processing.prometheus import (
    format_prometheus_metrics,
)


def test_emits_help_and_type_for_each_metric_family() -> None:
    out = format_prometheus_metrics(
        total=5,
        severity_total={"error": 1, "info": 4},
        severity_24h={},
    )
    assert "# HELP messagehub_total" in out
    assert "# TYPE messagehub_total counter" in out
    assert "# HELP messagehub_messages_total" in out
    assert "# TYPE messagehub_messages_total counter" in out
    assert "# HELP messagehub_messages_24h" in out
    assert "# TYPE messagehub_messages_24h gauge" in out


def test_total_metric() -> None:
    out = format_prometheus_metrics(
        total=42,
        severity_total={},
        severity_24h={},
    )
    assert "messagehub_total 42" in out


def test_severity_labels_quoted_and_escaped() -> None:
    out = format_prometheus_metrics(
        total=3,
        severity_total={"error": 2, "warning": 1, "info": 0, "debug": 0},
        severity_24h={},
    )
    # Severity-Werte sind aus const.py kein User-Input, daher braucht's
    # kein Escape — aber das Format-Pattern muss exakt stimmen.
    assert 'messagehub_messages_total{severity="error"} 2' in out
    assert 'messagehub_messages_total{severity="warning"} 1' in out
    assert 'messagehub_messages_total{severity="info"} 0' in out
    assert 'messagehub_messages_total{severity="debug"} 0' in out


def test_missing_severity_defaults_to_zero() -> None:
    out = format_prometheus_metrics(
        total=0,
        severity_total={},
        severity_24h={},
    )
    # Alle vier Severities erscheinen mit 0 — Prometheus mag konstante
    # Label-Sets ueber Scrapes hinweg.
    for sev in ("debug", "info", "warning", "error"):
        assert f'messagehub_messages_total{{severity="{sev}"}} 0' in out
        assert f'messagehub_messages_24h{{severity="{sev}"}} 0' in out


def test_knx_and_webhook_metrics() -> None:
    out = format_prometheus_metrics(
        total=10,
        severity_total={},
        severity_24h={},
        knx_total=1234,
        webhook_total=7,
    )
    assert "messagehub_knx_telegrams_total 1234" in out
    assert "messagehub_webhooks_total 7" in out


def test_output_ends_with_newline() -> None:
    # Prometheus-Spec verlangt trailing newline.
    out = format_prometheus_metrics(
        total=0,
        severity_total={},
        severity_24h={},
    )
    assert out.endswith("\n")


def test_output_is_text_not_json() -> None:
    out = format_prometheus_metrics(
        total=1,
        severity_total={"info": 1},
        severity_24h={},
    )
    assert not out.startswith("{")
    assert "\n" in out
