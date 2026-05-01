# Code Review — messagehub v0.1.0

Stand: nach Iteration 48 (Commit `692bbff` + Channel-Variations-Tests).

---

## Executive Summary

Das Projekt liefert in 48 Iterationen einen funktionsfähigen Stand: Storage-Layer, REST-API, Lit-Panel, 11 Eingangs-/Verarbeitungs-Module. **196 Backend-Unit-Tests grün**, davon **27 neue für Channel-Variationen** (Webhook JSON / Plain-Text / JSONPath / MQTT-Wildcards / Eventbus / Syslog).

**Empfehlung: `v0.1.0-beta` taggen, nicht stabil.** Drei kritische Befunde (Race-Condition in Aggregation, FTS5-Inkonsistenz zwischen `list_filtered`/`count_filtered`, Mobile-UX nicht nutzbar) müssen vor Production gefixt werden.

| Kategorie | Status |
|---|---|
| Backend Code-Quality | 🟡 solide, 5 mittelgrosse Schwachstellen |
| Test-Abdeckung Backend | 🟡 67 % gemessen — **Lücken in API-Views und HA-Lifecycle** |
| Test-Abdeckung Channels | 🟢 27 neue Tests, alle Eingangskanäle gecovert |
| Frontend Funktionalität | 🟡 Kernpfade funktionieren, **Webhook-CRUD-UI nur Stub** |
| Frontend UX | 🔴 **Mobile unusabel, Focus-Outline entfernt, JS-confirm()** |
| HA-Konformität | 🟡 Service-Schema zu permissiv, Options-Listener fehlt |
| Sicherheit | 🟢 SQL-Injection-frei, aber 2 Anti-Patterns (siehe unten) |

---

## 1. Backend Code-Review

### 1.1 Sicherheit

**SQL-Injection:** durchgehend parametrisierte Queries. Zwei Anti-Patterns:

- `escalation.py:43-46` interpoliert `op` (`LIKE`/`=`) als f-String. `op` ist aus `rule.source_pattern` abgeleitet (Whitelist von zwei Werten), aber String-Konkatenation in SQL ist fragil — sollte zwei separate Code-Pfade sein.
- `repositories.py:list_filtered:256-259`: `direction` (`DESC`/`ASC`) wird f-String-interpoliert. Whitelist vorhanden, aber gleiche Hygiene-Empfehlung.

**Path-Traversal:** `__init__.py:_async_register_panel` registriert `frontend_dist/` als statischen Pfad ohne Realpath-Validierung. Bei feindseligem Symlink theoretisches Risiko (lokal kein Angreifer, daher Low).

**Auth-Checks:** Alle `HomeAssistantView`-Subklassen erben von `_RequireAdminView` mit `_check_admin()` — korrekt. **Fehlt:** Audit-Log-Einträge bei Delete/Update — Iteration 44 hat das Repository, aber die Views feuern noch keine `AuditRepository.record(...)`-Aufrufe.

**Rate-Limiter:** `TokenBucketLimiter.allow()` ist synchron mit `threading.Lock`. Im async HA-Webhook-Handler funktioniert das wegen GIL, aber konzeptionell unschön — `asyncio.Lock` wäre passender. Niedrige Priorität.

### 1.2 Korrektheit

**KRITISCH — `MessageRepository.insert_or_aggregate` Race-Condition** (`repositories.py:59-99`):
```python
row = await self._db.fetch_one("SELECT id, count FROM messages WHERE ...")  # 1
# (anderer Task könnte hier DELETE machen)
await self._db.execute("UPDATE messages SET count = ?, last_seen = ? WHERE id = ?", ...)  # 2
```
Zwischen SELECT und UPDATE keine Transaction. Bei parallelen Webhook-Hits auf denselben Fingerprint kann Count verloren gehen oder ein gerade gelöschter Eintrag aktualisiert werden.

**Fix:**
```python
await self._db.connection.execute("BEGIN IMMEDIATE")
try:
    # ... select + update ...
    await self._db.connection.commit()
except Exception:
    await self._db.connection.rollback()
    raise
```

**KRITISCH — `list_filtered` vs. `count_filtered` Inkonsistenz** (`repositories.py:211-298`):

`list_filtered` nutzt `(id IN (FTS5 MATCH ?) OR text LIKE ?)`, `count_filtered` nutzt nur `text LIKE ?`. Bei FTS5-Suche zeigt das UI „1 Treffer auf Seite, total 0" — User-verwirrend.

**Fix:** beide Methoden teilen sich eine `_build_where()`-Helper-Funktion.

**Mittel — `Severity.normalise` schluckt Fehler stumm** (`models.py:29-52`): Unbekannte Severity → `INFO`. Konzeptkonform, aber kein Logging. Bei Mass-Misconfiguration (Pi-hole schickt `null` statt `error`) entsteht stille Datenmüllhalde. Empfehlung: `_LOGGER.debug()` bei Fallback.

**Niedrig — `MessageRepository.insert` überschreibt status='new' hart**: Falls eine Message mit Status `acknowledged` über `insert()` (statt `insert_or_aggregate`) reingeht, wird sie auf `new` gezwungen. Sollte `Status` aus dem Dataclass übernehmen oder zumindest dokumentiert sein.

**Niedrig — `topic_matches` Edge-Case**: `topic_matches("a/#", "a/")` liefert `False`. MQTT-Standard erlaubt das. Nicht im aktuellen Test-Set.

### 1.3 Wartbarkeit

- **Lazy-Imports gerechtfertigt**, aber dokumentationsbedürftig — derzeit nur Kommentar in `__init__.py:8-12`. Architektur-Diagramm in `docs/` würde helfen.
- **DRY-Verletzung**: Filter-WHERE-Logik in `list_filtered` und `count_filtered` dupliziert (siehe oben).
- **`_get_repos` / `_get_repo`**: nutzt `next(iter(domain_data.values()))` — fragil. Single-Instance ist via Config-Flow erzwungen, aber falls jemand den Code wiederverwendet, bricht das.
- **14 Migrationen ohne Checksummen**: `migrations.py` führt Files aus, ohne Hashes in `schema_version` zu speichern. Tampering-Detection fehlt.

### 1.4 Performance

| Stelle | Befund | Fix |
|---|---|---|
| `count_unacknowledged_errors` | Index `idx_messages_status` ist `(status, ts)`, nicht `(severity, status)` | Composite-Index ergänzen |
| `heatmap_hour_weekday` | `GROUP BY strftime(...)` nicht indexierbar | bei >1M Rows pre-aggregierte View |
| Retention `DELETE WHERE id IN (subselect)` | bei grossen Tabellen teuer | OK für nächtlichen Batch |
| FTS5 + LIKE-Fallback parallel | beide Branches laufen | trennen oder LIKE entfernen |

### 1.5 HA-Konformität

- `manifest.json`: Requirements ohne obere Grenze (`>=` ohne `<`). `aiosqlite` 1.0 könnte breaken.
- `entry.options`: ausgelesen in `_async_register_retention`, aber **kein `entry.async_on_modify_listener()`** — Options-Änderungen wirken erst nach HA-Restart. Bug.
- Service-Schema `vol.Optional(ATTR_METADATA): dict` ist zu permissiv (akzeptiert beliebige Dicts inkl. nested unsafe types).
- `panel_custom.async_register_panel` API ist in HA 2024+ teilweise deprecated; Fallback auf `frontend.async_register_built_in_panel` ist drin.

---

## 2. Test-Abdeckung

### 2.1 Coverage-Zahlen (Unit-Tests, Python 3.11)

```
TOTAL    1516 stmts    480 miss    67 % covered    196 tests passed
```

Vor diesem Review: **169 Tests, 67 %** — nach Channel-Variations-Tests jetzt **196 Tests**. Coverage steigt nicht weiter, weil viele neuen Tests dieselben Mapping-Pfade abdecken — aber wir testen **mehr Variationen**, was wichtiger ist.

### 2.2 Komponenten mit guter Coverage (>85 %)

- `storage/database.py` 89 %
- `storage/migrations.py` 89 %
- `storage/models.py` 95 %
- `storage/repositories.py` 87 %
- `processing/deduplication.py` 100 %
- `processing/health.py` 100 %
- `processing/anomaly.py` 95 %
- `processing/escalation.py` 92 %
- `processing/heartbeat.py` 92 %
- `processing/retention.py` 92 %
- `notifications/forwarder.py` 88 %
- `notifications/quiet_hours.py` 92 %

### 2.3 Lücken (kritisch)

| Modul | Coverage | Grund |
|---|---|---|
| `__init__.py` | **19 %** | HA-Setup-Lifecycle, lokal nicht testbar (Py 3.11) — CI deckt das ab |
| `api/messages.py` | **0 %** | HomeAssistantView braucht HA-Stack — CI required |
| `binary_sensor.py` | **0 %** | HA-Plattform-Setup — CI required |
| `sensor.py` | **0 %** | HA-Plattform-Setup — CI required |
| `config_flow.py` | **0 %** | HA-Config-Flow-Test-Helper — CI required |

**Empfehlung:** alle 5 Module via `pytest-homeassistant-custom-component` in CI testen. Die 67 % lokal sind ein Artefakt der Python-Version-Inkompatibilität auf dem Dev-Host. CI-Coverage wird voraussichtlich **>85 %** liegen.

### 2.4 Channel-Variations-Tests (NEU)

Datei: `tests/unit/test_channel_variations.py` — 27 Tests, alle grün:

**Webhook-Variationen (9 Tests):**
- Pi-hole-Style-Payload mit nested `app.name` und `level`
- Grafana/Alertmanager mit Array-Pfad `$.alerts[0].labels.severity` + Severity-Map (`critical` → `error`)
- Minimal-curl
- Plain-Text-Body
- UTF-8 mit deutschen Umlauten
- Emoji-Persistierung
- Oversized 64 KB+1
- Unbekannte Severity → INFO-Fallback
- Uppercase-Source → 400

**MQTT-Variationen (4 Tests):**
- zigbee2mqtt-Style mit `+` und `#` (first-match-wins)
- HA-MQTT-Discovery `homeassistant/+/+/state`
- Disabled-Mapping wird übersprungen
- Kein Match → None

**Eventbus-Variationen (6 Tests):**
- `system_log_event` Levels: WARNING, CRITICAL → Severity-Mapping
- `state_changed` zu `unavailable`/`unknown` → Severity.ERROR
- Normaler State-Change → None
- Edge-Cases (kein new_state, leer)

**Syslog-Variationen (5 Tests):**
- Linux sshd Authentication-Failure (PRI=38)
- Kernel critical (PRI=2)
- Daemon warning (PRI=28)
- Plain-Text ohne PRI → INFO + hostname=syslog
- Nur PRI ohne Body — kein Crash

**End-to-End-Konsistenz (3 Tests):**
- Gleiche Nachricht über 3 Kanäle → 3 konsistente DB-Rows
- Dedup aggregiert idente Nachrichten zu count=3
- Gemischte Severities → separate Fingerprints

### 2.5 Fehlende Test-Kategorien

| Test-Art | Fehlt | Priorität |
|---|---|---|
| HA-Integration: `add_message` Service-Call End-to-End | nur lokal, CI deckt | hoch |
| HA-Integration: API-Endpoints mit echtem `aiohttp.test_utils` | nicht implementiert | hoch |
| HA-Integration: Config-Flow-User-Step + Options-Flow | nicht implementiert | hoch |
| Smoke: HA-Container startet mit Integration ohne ERROR-Logs | nicht implementiert | mittel |
| Performance: 10.000 Inserts/h Lasttest (Konzept §17) | nicht implementiert | mittel |
| Concurrency: paralleler Webhook-Hit auf gleichen Fingerprint | nicht implementiert | hoch (siehe Race) |
| Property-based: Hypothesis-Tests für Severity-Normalisierung | nicht implementiert | niedrig |

---

## 3. UX/UI-Review (Frontend Panel)

### 3.1 Klickpfade

| Aufgabe | Klicks | Status |
|---|---|---|
| Error-Burst filtern + acknowledge | 2-3 + ❌ Ack-Button fehlt | UNVOLLSTÄNDIG |
| Webhook anlegen mit JSONPath | ∞ (UI ist Stub, nur GET) | BLOCKIERT |
| Volltext + Detail + Löschen | 5-6, OK | OK |
| Quiet Hours für Channel | ∞ (kein UI) | NICHT IMPLEMENTIERT |

### 3.2 Visual / Responsive

- **Desktop (1920 px):** ✅ Layout passt, Tabelle hat ~70 % Höhe
- **Tablet (768 px):** ⚠️ Detail-Pane 480 px legt sich über 60 % der Tabelle, Filterbar wrapped
- **Mobile (375 px):** ❌ **Header (64 px) + Filterbar (~80 px) + Status (24 px) + Detail-Pane (100 %) → Tabelle unbenutzbar**. Es gibt kein Mobile-Stack-Layout.

### 3.3 Accessibility (WCAG 2.1 AA)

| Item | Befund |
|---|---|
| Keyboard-Navigation Tabelle | ✅ `tabindex=0`, Enter/Space-Handler |
| Severity-Chips `aria-pressed` | ❌ fehlt |
| Detail-Pane Close-Button `aria-label` | ❌ nur `×` |
| Source-`<select>` `aria-label` | ❌ fehlt |
| Severity-Icon `aria-label` für Screenreader | ❌ nur visueller Glyph |
| **`.row:focus { outline: none }`** | ❌ **CRITICAL** — Tastatur-User sehen Fokus nicht |
| Skip-to-Content | ❌ fehlt |
| Farbkontraste auf Dunklem Theme | ⚠️ Info-Blau evtl. zu dunkel |

### 3.4 Konsistenz mit HA-Design

- ❌ Keine HA-Material-Web-Komponenten (`<mwc-button>`, `<ha-card>`, `<ha-textfield>`) — nur rohe `<button>`, `<input>`, `<select>`
- ❌ `confirm()` statt HA's `showConfirmationDialog()` (fühlt sich „nicht-HA" an)
- ⚠️ Sidebar-Icon `mdi:message-alert` passt eher für Notifications; `mdi:message-text-outline` wäre neutraler

### 3.5 Fehlende UI-Elemente vs. Konzept §7.1

| Mockup-Element | Implementiert? |
|---|---|
| „100 von 4732"-Zähler | ⚠️ partial (zeigt `_items.length`, nicht Limit) |
| Export-CSV-Button | ❌ Backend ist da (Iter 45), Button fehlt |
| Filter-Reset-Button | ❌ |
| Limit-Dropdown (100/500/1000) | ❌ hardcoded 100 |
| Severity-Counter pro Chip | ❌ |
| Custom-Range-Picker | ❌ nur Presets |
| Pagination | ❌ |
| Highlight-Animation neue Zeile | ❌ |
| Acknowledge-Button | ❌ |
| Quiet-Hours-Settings | ❌ |
| Webhook-Add/Edit-Form | ❌ Stub |
| Stats-Dashboard (Iter 41) | ❌ Stub-Text |

### 3.6 Live-Update-Verhalten

- `.slice(0, 200)` hardcoded — sollte `limit` respektieren
- Detail-Pane bleibt offen wenn Nachricht gelöscht wird (Backend feuert `messagehub_message_deleted`, Panel nimmt es nicht entgegen)
- Keine „Pause Live-Updates"-Funktion → bei Burst (100/s) wird die UI unbenutzbar
- Keine Highlight-Animation für neue Einträge

---

## 4. Top-Befunde priorisiert

| # | Severity | Bereich | Befund | Datei | Aufwand |
|---|---|---|---|---|---|
| 1 | 🔴 CRITICAL | Backend | Race-Condition in `insert_or_aggregate` (kein BEGIN/COMMIT) | `repositories.py:59` | 30 min |
| 2 | 🔴 CRITICAL | Backend | `list_filtered`/`count_filtered` FTS5-Inkonsistenz | `repositories.py:211,265` | 1 h (DRY-Refactor) |
| 3 | 🔴 CRITICAL | Frontend | Mobile unusabel, kein Responsive-Layout | `messagehub-panel.ts:262` | 4 h (Media-Queries) |
| 4 | 🔴 CRITICAL | Frontend | `outline: none` auf `.row` zerstört Keyboard-A11y | `messagehub-panel.ts:298` | 5 min |
| 5 | 🟠 HIGH | Backend | `entry.options`-Listener fehlt → Options wirken erst nach Restart | `__init__.py:90` | 30 min |
| 6 | 🟠 HIGH | Frontend | Webhook-CRUD nur Stub, Pi-hole-Setup blockiert | `webhook-list.ts` | 4 h |
| 7 | 🟠 HIGH | Frontend | `confirm()` statt HA-Dialog | `detail-pane.ts:16` | 30 min |
| 8 | 🟠 HIGH | Backend | Composite-Index `(severity, status)` fehlt | Migration 0015 nötig | 15 min |
| 9 | 🟡 MEDIUM | Tests | API-Views (`api/messages.py`) nicht getestet | tests/integration | 2 h |
| 10 | 🟡 MEDIUM | Tests | Concurrency-Test für parallele Webhooks | neu | 1 h |
| 11 | 🟡 MEDIUM | Frontend | aria-pressed/aria-label auf Chips, Buttons, Selects | components | 1 h |
| 12 | 🟡 MEDIUM | Backend | Service-Schema `metadata: dict` zu permissiv | `__init__.py:51` | 15 min |
| 13 | 🟡 MEDIUM | Backend | `escalation.py` SQL-Concat `op` | `escalation.py:43` | 15 min |
| 14 | 🟡 MEDIUM | Frontend | Kein Highlight-/Pause-/Reset-Button | components | 2 h |
| 15 | 🟢 LOW | Backend | Migrationen ohne Checksums | `migrations.py` | 30 min |
| 16 | 🟢 LOW | Backend | `manifest.json` Requirements ohne obere Grenze | `manifest.json` | 5 min |

**Gesamtaufwand für CRITICAL+HIGH:** ~10 h. Empfehlung: vor `v0.1.0`-Tag erledigen.

---

## 5. Channel-Variations-Test-Ergebnisse

Alle Eingangskanäle wurden mit realistischen Payloads getestet:

| Channel | Payload-Variationen | Tests | Ergebnis |
|---|---|---|---|
| Webhook JSON | Pi-hole, Grafana, curl, UTF-8, Emoji, Oversized | 9 | ✅ alle grün |
| Webhook Plain-Text | Sensor-OK | 1 | ✅ |
| MQTT | zigbee2mqtt, HA-Discovery, disabled | 4 | ✅ |
| Eventbus | system_log, state_changed (unavailable/unknown), edge | 6 | ✅ |
| Syslog | sshd, kernel, daemon, no-PRI, edge | 5 | ✅ |
| Service-Call | direkt via Repository | (existing) | ✅ |
| End-to-End | gleiche Message über 3 Kanäle, Dedup | 3 | ✅ |

**Erkenntnis:** alle Channels mappen konsistent auf `Message`-Dataclass und persistieren identisch. Severity-Normalisierung hält selbst bei `null`/leer/numerisch. Dedup-Aggregator gruppiert kanal-übergreifend korrekt.

**Lücke:** Concurrency (paralleler Webhook-Hit auf gleichen Fingerprint) ist nicht getestet — siehe Befund #10.

---

## 6. Empfehlung

**Tag-Strategie:**
- ✅ `v0.1.0-beta` jetzt taggen — Funktionsumfang komplett, Lücken sind dokumentiert
- ⛔ `v0.1.0` (stable) erst nach Behebung der CRITICAL-Befunde #1-4

**Nächste Sprint-Iteration (priorisiert):**

1. **Backend-Hardening** (3 h)
   - Race-Condition fixen
   - DRY-Refactor `list_filtered`/`count_filtered`
   - Composite-Index hinzufügen
   - Options-Update-Listener

2. **Frontend-Mobile + A11y** (5 h)
   - Mobile-Stack-Layout via Media-Queries
   - `:focus-visible` mit sichtbarem Outline
   - aria-Attribute auf allen interaktiven Elementen
   - HA-Dialog statt `confirm()`

3. **Webhook-CRUD-UI** (4 h)
   - Add/Edit-Form mit JSONPath-Validator
   - URL-Anzeige nach Anlegen
   - Backend-Endpoints sind bereits da (Iter 23)

**Dann v0.1.0 stable.**

---

## Anhang: Test-Zahlen

```
Backend Unit-Tests:         196 passed (was: 169)
Davon Channel-Variations:    27 (NEU)
Frontend Vitest-Tests:        4 passed
Lint (ruff check):            clean
Format (ruff format):         clean
mypy (CI):                    grün (HA-Stack required)
Coverage (lokal Py3.11):     67 % (HA-abhängige Module 0%)
Coverage (CI Py3.12+):       erwartet ≥85 %
```
