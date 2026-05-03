# E2E-Audit-Tests (Playwright)

Vorbereitet im Rahmen des Anbindungs-Audits (Findings F-001..F-011, alle in
`CHANGELOG.md` ab v0.23.0). Die Tests sind **nicht ausgeführt** worden,
weil die Audit-Sandbox keinen Docker-Daemon und kein Playwright-Browser-
Bundle bereitstellt.

## Voraussetzungen

1. **HA-Dev-Container starten**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   # HA erreichbar unter http://localhost:8124
   ```
2. **Long-Lived Access Token** in HA erzeugen (Profil → Long-Lived Access Tokens)
3. **`.env` anlegen**
   ```bash
   echo "HA_TOKEN=eyJhbGc..." > e2e/audit/.env
   echo "HA_BASE_URL=http://localhost:8124" >> e2e/audit/.env
   ```
4. **Dependencies installieren**
   ```bash
   cd e2e/audit
   npm install
   npx playwright install chromium
   ```

## Tests laufen lassen

```bash
npx playwright test                     # alle Tests
npx playwright test 00-smoke            # nur Smoke-Test
npx playwright test --reporter=html     # mit HTML-Report
npx playwright show-report              # Report öffnen
```

## Test-Aufbau

| Datei | Zweck | Ausgewählte Tests |
|---|---|---|
| `00-smoke.spec.ts` | Panel lädt, alle 4 Top-Tabs erreichbar | Sidebar-Klick, Tab-Wechsel |
| `01-messages-tab.spec.ts` | Messages-Tab + Detail-Pane vollständig | Filter, Saved-Filter, Detail, Severity-Inline-Edit, Tags |
| `02-stats-tab.spec.ts` | Stats-Sub-Tabs + Hash-Routing | live/knx/findings, `#findings?source=…` |
| `03-settings-tab.spec.ts` | Alle 6 Settings-Sub-Tabs | Webhooks, KNX, Channels (mit `test.fixme` für F-001), MQTT (`test.fixme` F-002), Heartbeats (`test.fixme` F-005), Remediation (`test.fixme` F-006) |
| `04-audit-tab.spec.ts` | Audit-Tab | Liste, Clear |
| `fixtures/api-mock.ts` | Mock-Daten | Optional für Offline-Tests via `page.route` |

## Lücken (FINDING-Tests via `test.fixme`)

Diese Tests dokumentieren **bewusst die fehlenden UI-Anbindungen** als `test.fixme`,
sodass sie in der Pipeline rot werden, sobald die Lücke geschlossen wird:

- F-001 Channel-Test-Knopf
- F-002 MQTT-Topic-Edit
- F-004 Findings-Unack
- F-005 Heartbeat-Delete/Toggle
- F-006 Remediation-Edit/Toggle

> Sobald ein Fix gemerged ist: `test.fixme(...)` zu `test(...)` umstellen.
