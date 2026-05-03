# Phase 5 — Findings & priorisierte Aufgabenliste

**Stand:** 2026-05-03
**Quellen:** Phase 1-4

---

## 5.0 Findings-Übersicht

| ID | Titel | Schweregrad | Aufwand | Kategorie |
|---|---|---|---|---|
| **F-001** | Channel-Test-Knopf fehlt im UI | hoch | S | nicht-angebunden |
| **F-002** | MQTT-Topic-Edit fehlt im UI | hoch | S | nicht-angebunden |
| **F-003** | MTTR-Endpoint ungenutzt — entweder UI ergänzen oder löschen | niedrig | S | tote-route |
| **F-004** | Findings-Ack zurücknehmen unmöglich (UI-Knopf fehlt) | mittel | S | nicht-angebunden |
| **F-005** | Heartbeat-Quellen können nicht gelöscht/deaktiviert werden | mittel | M | fehlende-funktion |
| **F-006** | Auto-Remediation-Hooks können nicht editiert/getoggelt werden | mittel | M | fehlende-funktion |
| **F-007** | Webhook-Single-GET-Endpoint ungenutzt | niedrig | S | tote-route |
| **F-008** | Message-Single-GET-Endpoint ungenutzt | niedrig | S | tote-route |
| **F-009** | `websocket_api`-Dependency tot — Manifest deklariert, kein Code | niedrig | S | sonstiges |
| **F-010** | Settings-/Stats-Sub-Tabs ohne Deep-Link (außer #findings) | niedrig | M | fehlende-navigation |
| **F-011** | KNX-GA-Export per Anchor-URL — kein Test-Coverage | niedrig | S | sonstiges |
| **F-012** | Channel-Konfiguration kann nicht in der UI verifiziert werden (ohne F-001) | hoch | — | abhängig F-001 |

---

## 5.1 Detail-Findings

### [F-001] Channel-Test-Knopf fehlt im UI

- **Schweregrad:** hoch
- **Kategorie:** nicht-angebunden
- **Betroffener UseCase / Endpoint:** `POST /api/messagehub/channels/{channel_id}/test` (E030, ChannelTestView)
- **Fundort Backend:** `custom_components/messagehub/api/messages.py:758-821`
- **Fundort Frontend:** kein Aufruf gefunden — `frontend/src/api-client.ts` hat **keine** `testChannel()`-Methode; `frontend/src/components/channels-view.ts` hat **keinen** „Test"-Button.
- **User-Symptom:** Nutzer kann eine neu konfigurierte Notification (Telegram-Token, Pushover-User-Key, ntfy-URL, Signal-notify-Service) **nicht verifizieren**, ohne eine echte Trigger-Nachricht im System zu erzeugen. Das ist die häufigste Fehlerquelle bei Channel-Setup (falscher Token, falscher Bot-Chat-ID, etc.). Der Backend-Code hat extra einen Rate-Limiter (3 Tests/min, api/messages.py:755) genau für diesen UI-Knopf vorbereitet — der Knopf selbst existiert nie.
- **Reproduktion:**
  1. Settings → Channels → „+" → Telegram-Channel mit fehlerhaftem Token speichern
  2. Eine echte Test-Nachricht per `messagehub.add_message`-Service senden (ggf. mit `severity=warning`, sonst durch Threshold gefiltert)
  3. Beobachten, dass nichts im Telegram ankommt — aber kein klares Feedback im UI
- **Empfohlener Fix:**
  1. `api-client.ts`: neue Methode `async testChannel(id: number): Promise<{delivered: boolean; channel: string}>`
  2. `channels-view.ts`: pro Zeile einen „Test"-Button neben „Edit/Löschen"; bei Klick `testChannel(id)` aufrufen, Result als Toast anzeigen (`delivered=true → "Testnachricht zugestellt an X"`, sonst `"Test fehlgeschlagen — Provider-Fehler X"`).
  3. Rate-Limit-Antwort (HTTP 429 + `Retry-After`) in der UI als sanfte Warnung anzeigen.
- **Aufwand:** S (≤ 30 min Code + Test)
- **Akzeptanzkriterium:** Im Settings → Channels-Tab existiert pro Channel ein „Test"-Knopf. Klick löst genau einen `POST /channels/{id}/test`-Request aus. Das Ergebnis ist als Toast sichtbar. Playwright-Test `e2e/audit/03-settings-tab.spec.ts → F-001` (aktuell `test.fixme`) wird grün.

---

### [F-002] MQTT-Topic-Edit fehlt im UI

- **Schweregrad:** hoch
- **Kategorie:** nicht-angebunden
- **Betroffener UseCase / Endpoint:** `PUT /api/messagehub/mqtt-topics/{topic_id}` (E033, MqttTopicDetailView)
- **Fundort Backend:** `custom_components/messagehub/api/messages.py:975-1021` — **Backend-Kommentar** (Zeile 976-979) sagt explizit: „Iter 83 / CR-4: PUT-Handler für MQTT-Topic-Edit. Vorher fehlte er — Frontend musste DELETE+POST simulieren, was die ID unkonservativ veränderte und die ID-Stabilität nicht garantierte." Der Backend-Fix wurde gemacht, der Frontend-Teil nie nachgezogen.
- **Fundort Frontend:** kein Aufruf — `api-client.ts` hat **keine** `updateMqttTopic()`-Methode. `simple-list-view.ts:212-237` rendert nur eine Tabelle mit „Löschen"-Button.
- **User-Symptom:** Wenn ein Topic-Pattern angepasst werden soll (z. B. Tippfehler in `zigbee2mqtt/+/availability`), muss der User aktuell „Löschen + neu anlegen". Dabei verliert der Eintrag seine numerische ID — zukünftig migrierte Audit-Logs / Findings verlieren ihren Bezug.
- **Reproduktion:**
  1. Settings → MQTT → Topic mit Pattern `zigbee2mqtt/+/availabilty` (Tippfehler) anlegen
  2. Versuch: Pattern auf `zigbee2mqtt/+/availability` korrigieren
  3. Stelle fest, dass kein Edit-Button existiert — nur „Löschen + neu anlegen"
- **Empfohlener Fix:**
  1. `api-client.ts`: neue Methode `async updateMqttTopic(id: number, payload: Partial<MqttTopicDto>): Promise<void>`
  2. `simple-list-view.ts → MqttTopicsView`: Tabellenzeilen um „Edit"-Button erweitern, Inline-Form analog zu `webhook-form.ts` für Edit-Modus
  3. Optional: Toggle-Pattern wie bei Webhooks für `enabled`-Flag
- **Aufwand:** S–M (≤ 60 min)
- **Akzeptanzkriterium:** Settings → MQTT-Tab erlaubt In-Place-Bearbeitung jedes Topics, die ID bleibt stabil, Audit-Log zeigt `mqtt_topic_update`-Eintrag. Playwright-Test `F-002` wird grün.

---

### [F-003] MTTR-Endpoint ungenutzt

- **Schweregrad:** niedrig
- **Kategorie:** tote-route (oder fehlende UI)
- **Betroffener UseCase / Endpoint:** `GET /api/messagehub/mttr` (E013, MttrView)
- **Fundort Backend:** `custom_components/messagehub/api/messages.py:1164-1187`
- **Fundort Frontend:** kein Aufruf — Daten werden bereits über `getStatsExtended()` geliefert (M32 → E012, dort als `mttr_per_source`), der dedizierte Endpoint hat keinen Caller.
- **User-Symptom:** Keiner. Aber: Dead Code im Backend → unnötige Wartung, ggf. Verwirrung bei späterer Refactoring-Arbeit.
- **Reproduktion:** Nicht reproduzierbar (kein User-Symptom).
- **Empfohlener Fix:** Entscheidung treffen:
  - **Option A (DRY):** Endpoint löschen (api/messages.py:1164-1187), Eintrag in `async_register_views` raus.
  - **Option B (separate UI):** Eigene MTTR-Tabelle im Stats → Live-Tab anbieten, die diesen Endpoint nutzt (z. B. wenn man MTTR alleine schneller laden will, ohne Heatmap+Top-Sources). Dann `getMttr(days)` in api-client.ts ergänzen.
- **Aufwand:** S
- **Akzeptanzkriterium:** Entweder Endpoint ist gelöscht (Phase-1-Inventar reduziert), oder eine UI nutzt ihn explizit (in Mapping-Matrix als ✅ ANGEBUNDEN markiert).

---

### [F-004] Findings-Ack zurücknehmen unmöglich

- **Schweregrad:** mittel
- **Kategorie:** nicht-angebunden
- **Betroffener UseCase / Endpoint:** `DELETE /api/messagehub/findings/ack/{ga}/{code}` (E074, FindingsAckDetailView)
- **Fundort Backend:** `custom_components/messagehub/api/findings.py:139-156`
- **Fundort Frontend:** ApiClient-Methode `unacknowledgeFinding` definiert in `api-client.ts:1313`, aber **nirgendwo aufgerufen** (`grep -n unacknowledgeFinding frontend/src/components/` → 0 Treffer).
- **User-Symptom:** Wenn ein User einen Finding versehentlich akzeptiert hat (oder das Problem doch wieder auftritt), gibt es **keinen UI-Pfad**, den Ack zurückzunehmen. Workaround: SQL-Konsole, REST-Aufruf manuell.
- **Reproduktion:**
  1. Stats → Konfigurations-Check → einen Finding auswählen → „Ack" klicken
  2. Versuch: Ack rückgängig machen → kein Knopf vorhanden
- **Empfohlener Fix:**
  1. In `findings-view.ts`: pro acked-Finding einen kleinen „Ack zurücknehmen"-Button (oder Toggle „Acked ✓ × ungesehen machen") rendern.
  2. Bei Klick → `api.unacknowledgeFinding(ga, code)` → Liste reload.
- **Aufwand:** S
- **Akzeptanzkriterium:** Acked-Findings haben einen sichtbaren „Unack"-Button. Klick löst genau einen `DELETE /findings/ack/{ga}/{code}` aus. Test `F-004` wird grün.

---

### [F-005] Heartbeat-Quellen können nicht gelöscht/deaktiviert werden

- **Schweregrad:** mittel
- **Kategorie:** fehlende-funktion (Backend & Frontend)
- **Betroffener UseCase:** Heartbeat-Lifecycle-Management
- **Fundort Backend:** `HeartbeatsView` (E023, E024) hat nur `GET` und `POST` (api/messages.py:630-675). **Es gibt keinen `DELETE`-Endpoint** und kein `PUT` zum Deaktivieren. Datenmodell hat ein `enabled`-Flag, aber kein API-Pfad zum Toggle.
- **Fundort Frontend:** `simple-list-view.ts:243-325 (HeartbeatsView)` rendert nur Anzeige + Add — keine Action-Spalte.
- **User-Symptom:** Wenn ein Heartbeat-Source-Eintrag obsolet ist (Gerät abgemeldet), sammelt das System dauerhaft `messagehub.heartbeat`-Warnings, die der User nicht stoppen kann ohne SQL.
- **Reproduktion:**
  1. Settings → Heartbeats → „raspi-keller" mit Intervall 3600 anlegen
  2. Raspi geht außer Betrieb
  3. System feuert alle 1.5 h eine Warning „source 'raspi-keller' silent" → flutet die Liste
  4. User hat keinen UI-Weg, den Heartbeat-Eintrag zu entfernen
- **Empfohlener Fix:**
  1. **Backend:** Neue View `HeartbeatDetailView` mit `DELETE /api/messagehub/heartbeats/{source}` und optional `PATCH` mit `{enabled: bool}`.
  2. **Backend:** Repository-Methoden `delete(source)` und `set_enabled(source, bool)` in `processing/heartbeat.py`.
  3. **API-Client:** `deleteHeartbeat(source: string)` und `toggleHeartbeat(source, enabled)`.
  4. **Frontend:** `simple-list-view.ts → HeartbeatsView`: Action-Spalte mit „Pause"-Toggle und „Löschen"-Button (Confirm).
- **Aufwand:** M (Backend + Frontend + Tests)
- **Akzeptanzkriterium:** Settings → Heartbeats erlaubt das Deaktivieren und Löschen pro Eintrag. Audit-Log zeigt `heartbeat_delete` / `heartbeat_disable`. Test `F-005` wird grün.

---

### [F-006] Auto-Remediation-Hooks können nicht editiert/getoggelt werden

- **Schweregrad:** mittel
- **Kategorie:** fehlende-funktion
- **Betroffener UseCase:** Hook-Lifecycle (Edit + Toggle)
- **Fundort Backend:** `RemediationHookDetailView` (E037, api/messages.py:1113-1138) hat nur `DELETE`. **Kein `PUT`** zum Ändern oder Toggle.
- **Fundort Frontend:** `simple-list-view.ts:327-449 (RemediationView)` hat nur Add + Delete.
- **User-Symptom:** Hook-Konfiguration ist „write-once". Wenn die Source-Pattern oder Automation-ID falsch eingegeben wurde, muss komplett gelöscht und neu angelegt werden — dabei verliert die Audit-Spur den Bezug.
- **Reproduktion:**
  1. Settings → Auto-Remediation → Hook „AP-Restart" mit Source-Pattern `unifi-ap%` und `script.restart_ap`, Modus „Vorschlag"
  2. Stelle fest, Skript-Name war eigentlich `script.unifi_restart`
  3. Kein Edit-Knopf — nur „Löschen + Neu anlegen"
- **Empfohlener Fix:**
  1. **Backend:** `RemediationHookDetailView.put` ergänzen, das alle Felder aktualisiert. Optional: dedizierter Toggle-Endpoint.
  2. **API-Client:** `updateRemediationHook(id, payload)`.
  3. **Frontend:** Action-Spalte um „Edit" + „Pause/Aktiv"-Toggle erweitern.
- **Aufwand:** M
- **Akzeptanzkriterium:** Hooks können in-place editiert werden, ID bleibt stabil. Audit-Log zeigt `remediation_update`. Test `F-006` wird grün.

---

### [F-007] Webhook-Single-GET-Endpoint ungenutzt

- **Schweregrad:** niedrig
- **Kategorie:** tote-route
- **Endpoint:** `GET /api/messagehub/webhooks/{webhook_id}` (E017, WebhookDetailView)
- **Fundort:** Backend api/messages.py:286-300; Frontend nutzt nur `listWebhooks()` und arbeitet auf der gefetched-Liste.
- **User-Symptom:** keiner.
- **Empfohlener Fix:** Beibehalten (die View liefert vollen DTO inkl. `field_map` — könnte später für Tiefenansicht/Details genutzt werden). Alternativ löschen (Phase-1-Inventar reduziert).
- **Aufwand:** S
- **Akzeptanzkriterium:** Bewusste Entscheidung dokumentiert (CHANGELOG-Eintrag oder Inline-Kommentar im Code).

---

### [F-008] Message-Single-GET-Endpoint ungenutzt

- **Schweregrad:** niedrig
- **Kategorie:** tote-route
- **Endpoint:** `GET /api/messagehub/messages/{message_id}` (E003, MessageDetailView)
- **Fundort:** Backend api/messages.py:170-187; Frontend `getMessage` (api-client.ts:567) wird nicht aufgerufen — Detail-Pane bekommt das Item-Objekt direkt aus der gefetched-Liste.
- **User-Symptom:** keiner. Aber: Tiefen-Refresh nach Status-/Severity-Edit lädt aktuell die GANZE Liste neu. Mit `getMessage` könnte gezielter nur das eine Item aktualisiert werden.
- **Empfohlener Fix:** Entweder
  - **Option A (DRY):** Beide löschen.
  - **Option B (Optimierung):** `detail-pane` so anpassen, dass es nach `setMessageStatus`/`setMessageSeverity` ein gezieltes `getMessage(id)` ausführt statt `_reload()` (das die ganze Liste re-fetched). Spart Bandbreite bei großen Listen.
- **Aufwand:** S
- **Akzeptanzkriterium:** Code ist konsistent: entweder Endpoint genutzt oder gelöscht.

---

### [F-009] `websocket_api`-Dependency tot

- **Schweregrad:** niedrig
- **Kategorie:** sonstiges (Manifest-Hygiene)
- **Fundort:** `manifest.json:7` deklariert `"dependencies": [..., "websocket_api"]`. Codebase hat **keine** `@websocket_api.websocket_command`-Dekoratoren oder `async_register_command`-Aufrufe.
- **User-Symptom:** Keiner. HA lädt die Dependency unnötig.
- **Empfohlener Fix:** Entweder
  - **Option A:** WS-Commands tatsächlich implementieren (z. B. Live-Update der Liste statt Polling/`_reload()`). Dann lohnt sich die Dependency.
  - **Option B:** Dependency aus Manifest entfernen.
- **Aufwand:** S (Option B), L (Option A)
- **Akzeptanzkriterium:** Entweder Dependency wird genutzt oder ist entfernt. `pytest -q` und HACS-Validation grün.

---

### [F-010] Settings-/Stats-Sub-Tabs ohne Deep-Link

- **Schweregrad:** niedrig
- **Kategorie:** fehlende-navigation
- **Fundort:** `stats-view.ts:71-85` unterstützt `#findings?source=…`, aber **keine** anderen Sub-Tabs (`#live`, `#knx`, `#webhooks`, `#mqtt`, …). `settings-view.ts` hat **gar kein** Hash-Routing.
- **User-Symptom:** User kann keine direkten URLs für Settings → MQTT, Settings → Channels usw. teilen / bookmarken. Beim Reload landet er auf dem zuletzt gewählten Sub-Tab (LocalStorage), aber nicht zwingend dem gewünschten.
- **Empfohlener Fix:**
  1. `settings-view.ts`: Hash-Routing analog zu `stats-view.ts` ergänzen — `#settings/mqtt`, `#settings/channels`, etc.
  2. `stats-view.ts`: `#stats/live`, `#stats/knx` ergänzen (Backward-Compat: `#findings` weiter unterstützen).
  3. Sidebar-Routing in HA respektiert URL-Hash, Browser-Back/Forward funktioniert.
- **Aufwand:** M
- **Akzeptanzkriterium:** Direkter URL-Aufruf eines Sub-Tabs öffnet ihn. Browser-History funktioniert.

---

### [F-011] KNX-GA-Export per Anchor-URL — kein Test-Coverage

- **Schweregrad:** niedrig
- **Kategorie:** sonstiges (Test-Hygiene)
- **Fundort:** `stats-knx-view.ts:1803-1807` baut eine Download-URL und rendert sie als `<a href="…">`. Das ist funktional korrekt (E053 ANGEBUNDEN), aber nicht über den `ApiClient` typisiert und es gibt keinen Vitest/Playwright-Test, der prüft, dass die URL korrekt assembled wird (insbesondere bei `from`/`to`-Filtern).
- **User-Symptom:** Bei einer falschen URL-Konstruktion (z. B. unencodierte GA-Adressen mit `/`) bekommt der User einen 404.
- **Empfohlener Fix:**
  1. URL-Bauer in eine kleine Helfer-Funktion in `api-client.ts` extrahieren (`exportKnxGaUrl(ga, format, filters)`), analog zu `exportUrl(filters)`.
  2. Vitest-Test, der die korrekte URL prüft.
- **Aufwand:** S
- **Akzeptanzkriterium:** GA-Export-URL wird über typisierte Helfer-Funktion erzeugt. Vitest prüft Encoding (insbesondere `/`-encoding in GA wie `1/2/3`).

---

### [F-012] Channel-Konfiguration ist UI-seitig nicht verifizierbar

- **Schweregrad:** hoch (Auswirkung), aber abhängig von F-001
- **Kategorie:** nicht-angebunden (verkettet)
- **Fundort:** dito F-001
- **Beschreibung:** Wird automatisch durch F-001 mit erledigt — gilt als „Doppel-Eintrag" für die Sichtbarkeit der Auswirkung.

---

## 5.2 Statistik

| Kategorie | Anzahl Findings |
|---|---:|
| nicht-angebunden | 3 (F-001, F-002, F-004) |
| tote-route | 3 (F-003, F-007, F-008) |
| fehlende-funktion (Frontend+Backend) | 2 (F-005, F-006) |
| fehlende-navigation | 1 (F-010) |
| sonstiges | 2 (F-009, F-011) |
| verkettet | 1 (F-012) |

| Schweregrad | Anzahl |
|---|---:|
| hoch | 3 (F-001, F-002, F-012) |
| mittel | 3 (F-004, F-005, F-006) |
| niedrig | 6 (F-003, F-007, F-008, F-009, F-010, F-011) |

| Aufwand | Anzahl |
|---|---:|
| S (≤ 30 min) | 7 |
| M (30-120 min) | 4 |
| L (> 2 h) | 0 (außer Option-A bei F-009) |

---

## 5.3 Empfohlene Bearbeitungsreihenfolge

### Sprint 1 — Quick-Wins (Sichtbar für User in 1 Iteration)
1. **F-001** Channel-Test-Knopf (S, hoch)
2. **F-002** MQTT-Topic-Edit (S, hoch)
3. **F-004** Findings-Unack (S, mittel)

→ Schließt 3 von 3 echten UI-Lücken, die der User direkt merkt.

### Sprint 2 — Erweiterung der Lifecycle-Verwaltung (Backend+Frontend)
4. **F-005** Heartbeat-Delete/Toggle (M, mittel)
5. **F-006** Remediation-Hook-Edit/Toggle (M, mittel)

→ Macht aus „Add-only" eine vollständige CRUD-UI.

### Sprint 3 — Code-Hygiene
6. **F-003** MTTR-Entscheidung (S)
7. **F-007** Webhook-Single-GET Entscheidung (S)
8. **F-008** Message-Single-GET Entscheidung (S)
9. **F-009** websocket_api-Dependency (S oder L je nach Option)
10. **F-011** KNX-GA-Export-URL-Helfer (S)

### Sprint 4 — UX-Erweiterung
11. **F-010** Deep-Linking für alle Sub-Tabs (M)

---

## 5.4 Test-Pflicht-Checkliste pro Finding

Pro Fix MUSS:
1. ✅ Vitest-Test im Frontend (für API-Client-Methode + Komponente)
2. ✅ pytest-Test im Backend (für neuen Endpoint)
3. ✅ Playwright-Test in `e2e/audit/` (`test.fixme` → `test` umstellen)
4. ✅ Eintrag in `CHANGELOG.md` (Conventional-Commit-Footer mit Iteration: N + Finding-ID)
5. ✅ Akzeptanzkriterium (oben dokumentiert) erfüllt

---

## 5.5 Nicht-Findings (zur Klarstellung)

Folgende Punkte sind **kein** Finding, weil als „designintendiert" verifiziert:

- `GET /api/messagehub/metrics` (E014): Prometheus-Scraper, bewusst kein UI.
- HA-Sensoren (EN001-EN012): zugängig über HA-Standard-Pfade (Geräte & Dienste).
- HA-Repair-Issues (R001-R002): HA-Reparaturen-Bereich.
- Eingehende Webhooks (`/api/webhook/<id>`): externe Sender, UI zeigt nur die URL-Liste.
- HA-Bus-Events (EV001/EV002): backend-internes Event-System, UI re-fetched explizit.
- Sub-Tab-Persistenz via LocalStorage statt URL: bewusste Design-Entscheidung (HA-Standard wäre Hash-Routing — siehe F-010 für Deep-Link-Lücke).
