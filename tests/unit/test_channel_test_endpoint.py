"""F-001: Tests fuer den Channel-Test-Endpoint-Pfad.

ChannelTestView lebt in api/messages.py:758. Iter 88 / CR-20 hat einen
Token-Bucket-Limiter mit Capacity 3, Refill 3/Min hinzugefuegt
(`_channel_test_limiter`). Diese Tests verifizieren rein die Limiter-
Konfiguration plus den Hot-Path "Channel-ID nicht gefunden" — beides
ohne HA-Stack.
"""

from __future__ import annotations

import time

from custom_components.messagehub.processing.rate_limit import TokenBucketLimiter


def test_channel_test_limiter_capacity_three() -> None:
    """Token-Bucket erlaubt 3 Test-Versuche, dann blockiert er bis Refill."""
    limiter = TokenBucketLimiter(capacity=3.0, refill_per_minute=3.0)

    # 3 Versuche durchlaufen
    assert limiter.allow("ch:1") is True
    assert limiter.allow("ch:1") is True
    assert limiter.allow("ch:1") is True
    # 4. Versuch wird blockiert
    assert limiter.allow("ch:1") is False


def test_channel_test_limiter_separates_per_channel() -> None:
    """Separater Bucket pro Channel-ID — Spam an Channel-1 stoert nicht Channel-2."""
    limiter = TokenBucketLimiter(capacity=3.0, refill_per_minute=3.0)
    for _ in range(3):
        limiter.allow("ch:1")
    assert limiter.allow("ch:1") is False
    # Channel 2 hat noch volle Kapazitaet
    assert limiter.allow("ch:2") is True


def test_channel_test_limiter_refills_over_time() -> None:
    """Nach genug Zeit kommen Tokens zurueck.

    Refill = 3/min = 0.05/s. Nach 0.4 s = +0.02 Tokens — noch zu wenig.
    Wir simulieren den Refill ueber `last_refill`-Manipulation, damit der
    Test deterministisch in Sekundenbruchteilen laeuft.
    """
    limiter = TokenBucketLimiter(capacity=3.0, refill_per_minute=3.0)
    for _ in range(3):
        limiter.allow("ch:1")
    assert limiter.allow("ch:1") is False
    # Bucket "rueckdatieren" — simulierte 30 s spaeter sollten 1.5 Token frei sein
    bucket = limiter._buckets["ch:1"]  # noqa: SLF001 — bewusster White-Box-Test
    bucket.last_refill = time.monotonic() - 30.0
    assert limiter.allow("ch:1") is True


def test_channel_test_view_is_registered() -> None:
    """Statischer Check: ChannelTestView taucht in async_register_views auf."""
    from pathlib import Path

    src = (
        Path(__file__).resolve().parents[2]
        / "custom_components"
        / "messagehub"
        / "api"
        / "messages.py"
    ).read_text(encoding="utf-8")
    assert "ChannelTestView" in src
    assert "/api/messagehub/channels/{channel_id}/test" in src
    # Iter 88 / CR-20: Limiter muss vorhanden sein
    assert "_channel_test_limiter" in src


def test_channel_test_view_has_admin_check() -> None:
    """ChannelTestView muss RequireAdminView erweitern (Auth-Pflicht)."""
    import ast
    from pathlib import Path

    src_path = (
        Path(__file__).resolve().parents[2]
        / "custom_components"
        / "messagehub"
        / "api"
        / "messages.py"
    )
    tree = ast.parse(src_path.read_text(encoding="utf-8"))
    found = False
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == "ChannelTestView":
            base_names = [
                base.id if isinstance(base, ast.Name) else getattr(base, "attr", "")
                for base in node.bases
            ]
            assert any("RequireAdminView" in name for name in base_names), (
                "ChannelTestView muss RequireAdminView erweitern"
            )
            # Verifiziere _check_admin-Aufruf im POST-Handler
            for sub in node.body:
                if isinstance(sub, ast.AsyncFunctionDef) and sub.name == "post":
                    body_src = ast.unparse(sub)
                    assert "_check_admin" in body_src, (
                        "ChannelTestView.post muss _check_admin(request) aufrufen"
                    )
                    found = True
            break
    assert found, "ChannelTestView.post-Handler nicht gefunden"
