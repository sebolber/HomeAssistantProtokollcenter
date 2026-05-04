# KNX-Recommendation-Engine — User-Doku

**Verfuegbar ab v0.25.0.**

Pro KNX-Geraet (`dev_source`, IA wie `1.1.220`) zeigt der Source-
Detail-Drawer im KNX-Stats-Tab eine **Recommendation-Card** mit
zwei Aussagen:

1. **Aktueller Sende-Modus** des Geraets (zyklisch / bei Aenderung /
   hybrid / stumm), berechnet aus den Telegramm-Intervallen der
   letzten Beobachtungsperiode.
2. **Empfohlener Sende-Modus** + Zyklusdauer + Hysterese, je nach
   DPT, Modell, aktueller Buslast und bekannten Findings.

Default ist **deterministisch und offline-faehig** — kein LLM, kein
externer Service. Optional kann Layer 4 (KI-Empfehlungen) ueber die
Settings-UI aktiviert werden.

---

## Schnellstart

1. Im KNX-Stats-Tab ein Geraet aus der Top-Geraete-Tabelle anklicken.
2. Im aufpoppenden Drawer die **"Sende-Modus & Empfehlung"**-Card
   aufklappen (Toggle-Pfeil neben dem Titel).
3. Die Card laedt die Empfehlung asynchron — Headline + GA-Detail-
   Tabelle erscheinen nach 1-2 s.

Headline-Beispiel:
> Aktuell **cyclic** (Median ~1 Min/Telegramm) — empfohlen: **hybrid**
> (1 von 1 GAs abweichend).

GA-Detail-Tabelle pro Gruppenadresse:

| GA | DPT | aktuell | empfohlen | Hysterese | Severity |
|---|---|---|---|---|---|
| 5/2/14 | 9.004 | zyklisch | hybrid (5–15 Min) | ≥ 50 lux | abweichend |

---

## 4-Layer-Pipeline

Die Empfehlung wird in vier Schichten berechnet, in fester Reihenfolge:

### Layer 1 — DPT-Standard (`processing/knx_dpt_recommendations.py`)

Kuratierte Tabelle mit ~20 KNX-Datapoint-Types und Familien-Defaults
(`1.x`, `9.x`, `13.x`). Quelle: KNX-DPT-Spec, KNX-Forum, ETS-Manuals
vieler Hersteller.

Beispiele:
- DPT 1.001 (Schalten): `on_change`, keine Hysterese, Trigger-only.
- DPT 9.001 (Temperatur): `hybrid`, 5-15 Min Heartbeat, Hysterese
  ≥ 0.2 K.
- DPT 9.004 (Helligkeit): `hybrid`, 5-15 Min, Hysterese ≥ 50 Lux.
- DPT 13.013 (Energiezaehler kWh): `cyclic`, 10-60 Min.

### Layer 2 — Modell-Override (`processing/knx_device_model_recommendations.py`)

Modell-spezifische Empfehlungen werden auf Basis von **Hersteller + Modell**
nachgeschlagen. Quellen-Reihenfolge:

1. **User-Override** aus `knx_devices`-Tabelle (manuell gepflegt — hat
   immer Vorrang). Optional, nur fuer Edge-Cases.
2. **ETS-Discovery** (`discover_knx_devices`) — liefert Hersteller +
   Produkt direkt aus dem KNX-Projekt. **Keine User-Pflege noetig.**
3. Sonst: kein Layer-2-Override.

Ca. 10 Modelle aus Hoermann, MDT, Hager, Gira, ABB, Theben, Busch-Jaeger,
Zennio, Elsner sind hinterlegt. Glob-Pattern auf das Modell
(z. B. `garage*` matcht `garage-control`, `garage-pro`, …).

Beispiel: Hoermann-Garage-Gateway → DPT 9.001 (Klima-Temp) wird auf
`on_change` mit `max_rate 0.5/Min` ueberschrieben (Default-0-Spam
ohne reale Sensorik vermeiden).

### Layer 3 — Live-Anomalie

- **Buslast-Override**: bei avg-Buslast ≥ 30 % wird der empfohlene
  Zyklus-Korridor um Faktor 1.5 verlaengert. Reasoning-Eintrag
  `"Bus-Avg-Last X.X % >= 30 % → empfohlene Zyklen um Faktor 1.5
  verlaengert."`
- **Findings-Override**: aktive (unacked) Findings auf einer GA mit
  Code `SEND_CYCLE_DRIFT`, `REPEAT_APPROXIMATION`, `TOGGLE_LOOP` oder
  `MULTI_RESPONDER` setzen die Severity der Empfehlung auf
  `deviation` und fuegen ein Reasoning hinzu.

### Layer 4 — LLM-Fallback (optional, default deaktiviert)

Wenn Layer 1+2 keinen Treffer haben (z. B. exotischer DPT,
unbekanntes Modell), kann ein LLM-Provider angefragt werden. Default
**deaktiviert** — Du musst es explizit in den Settings aktivieren.

Antworten werden in der `knx_recommendation_cache`-Tabelle gespeichert
(30 Tage TTL). Wiederholte Aufrufe mit identischen Inputs treffen den
Cache und kosten nichts.

---

## Geraete-Profil — Standard ist zero-config

In den meisten Faellen **musst Du nichts pflegen**. Im Drawer der
Recommendation-Card zeigt der Block **"Geraet"** den Hersteller +
Modell direkt aus dem ETS-Projekt:

```
Geraet: hoermann / garage-control (aus ETS-Projekt)  [Override anlegen]
```

### Wann brauche ich einen Override?

Nur in Edge-Cases:

- **ETS-Bezeichnung trifft den Modell-Glob nicht** (z. B. ETS sagt
  `Hoermann KNX-Tormodul-Plus`, der Override-Glob ist `garage*` —
  → `manufacturer=hoermann, model=garage-pro` als Override pflegen).
- **ETS-Projekt nicht geladen** (kein xknx-Setup oder leere
  Projektdatei).
- **Eigene Notes** (gibt es in ETS nicht).

### Override anlegen

Klick auf **„Override anlegen"** oeffnet ein Inline-Form mit:

- **Hersteller** (z. B. `hoermann`, `mdt`, `hager`)
- **Modell** (z. B. `garage-control`, `dali-gateway`)
- **Notiz** (optional)

Speichern triggert automatisch:
- Persistenten Recommendation-Cache fuer dieses Geraet leeren
- Recommendation-Card neu laden mit User-Override-Werten

API-Endpoints (alle `RequireAdminView`):
- `GET /api/messagehub/knx-devices` — Liste aller User-Overrides
- `GET /api/messagehub/knx-devices/{dev_source}` — Einzeleintrag mit
  zusaetzlichem `ets`-Block fuer ETS-Default-Anzeige
- `PUT /api/messagehub/knx-devices/{dev_source}`
  body `{manufacturer?, model?, notes?}`
- `DELETE /api/messagehub/knx-devices/{dev_source}` — idempotent
  (entfernt den Override; ETS-Default greift dann wieder)

---

## KI-Empfehlungen aktivieren (optional)

> **Default: deaktiviert.** Aktivieren nur, wenn:
> - Du einen LLM-Provider hast (eigenes Konto bei OpenAI/Groq/...
>   oder eine lokale Ollama-Instanz)
> - Datenschutz-/Cost-Risiko bewusst ist (Hersteller- und Modell-
>   Strings werden zum Provider gesendet)
> - Du die Empfehlungen *trotzdem* manuell pruefst — der `[KI]`-Marker
>   im Reasoning kennzeichnet sie

### Settings-UI

Settings-Tab → **"KI-Empfehlungen"**. Felder:

| Feld | Beschreibung |
|---|---|
| **Aktivieren** | Master-Toggle. Default off. |
| **Voreinstellung** | OpenAI / Azure / Ollama / Groq — fuellt URL+Modell-Defaults. |
| **Base URL** | Endpoint OHNE `/chat/completions`-Suffix. Whitelist `http://` und `https://`. |
| **Modell** | Provider-spezifischer Modellname. |
| **API-Key** | Bearer-Token. `type=password`, default Read-only-Anzeige; Klick auf "Aendern" macht ihn editierbar. Speichern ohne Edit lasst den bestehenden Schluessel unangetastet. |
| **Timeout (s)** | Default 15 s. Lokale LLMs brauchen u. U. mehr. |
| **Max Tokens** | Default 800. Cost-Schutz. |
| **System-Prompt-Override** | Optional. Antwort-Schema bleibt zwingend (siehe unten). |

### Kompatibilitaet

Sprich `/v1/chat/completions` mit JSON-Mode. Damit funktioniert die
gleiche UI fuer:

| Anbieter | Base URL | Hinweis |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | Direkt |
| Azure-OpenAI | `https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT` | Pro Deployment eine URL |
| Ollama | `http://localhost:11434/v1` | Lokal, kostenlos |
| Groq | `https://api.groq.com/openai/v1` | Schnell + guenstig |
| LiteLLM | URL Deines Gateways | Adapter fuer Anthropic/Cohere/... |
| LM Studio | `http://localhost:1234/v1` | Lokal |
| Together / Fireworks / Replicate | Anbieter-URL | Cloud-Aggregatoren |

### Antwort-Schema des Providers

Der Provider MUSS strukturierten JSON liefern:

```json
{
  "mode": "on_change" | "cyclic" | "hybrid",
  "cycle_minutes_min": null | int,
  "cycle_minutes_max": null | int,
  "hysteresis": null | string,
  "max_rate_per_min": float,
  "rationale": string
}
```

`response_format = json_object` ist im Request-Body gesetzt — die
meisten OpenAI-kompatiblen Provider respektieren das. Bei Ollama
brauchst Du u. U. ein Modell, das JSON-Mode unterstuetzt.

### Sicherheits-Pyramide

Pruefe vor Aktivierung:

- **API-Key-Schutz**: niemals im Audit-Log, nie in Antwort-DTOs, nie
  in Frontend-Console — nur im Authorization-Header.
- **Prompt-Injection-Schutz**: Whitelist-Filter
  (`a-zA-Z0-9._\-/+ space`) auf Hersteller/Modell-Strings vor dem
  Provider-Aufruf.
- **Rate-Limit**: 5 LLM-Aufrufe pro Minute global — schuetzt vor
  Drawer-Open-Loop-Cost-Spikes.
- **Cache**: 30 Tage TTL pro `(provider, model, dpt, manufacturer,
  device_model)`-Tupel. Provider-Wechsel oder Modell-Wechsel flusht
  den Cache.
- **URL-Whitelist**: `http://` + `https://` only. `file://`,
  `ftp://`, `javascript:` werden mit 400 abgewiesen.
- **Audit-Log**: jede Settings-Aenderung schreibt einen Eintrag,
  inkl. `api_key_set: bool` (NIEMALS Klartext).

### Kosten / Privacy

Was wird an den Provider gesendet?
- DPT (z. B. `9.001`) — KNX-Standard, oeffentlich.
- Hersteller + Modell (falls gepflegt) — User-Eingabe.
- Kontext: aktueller Modus, Median-Intervall, Sample-Count — keine
  Wertinhalte, keine GA-Adressen, keine Telegramm-Payloads.

Pro Drawer-Open mit unbekanntem DPT/Modell: 1 Provider-Call
(< 1000 Tokens). Bei Cache-Hit: 0 Calls.

---

## Backend-API

`GET /api/messagehub/knx-stats/source/{dev_source}/recommendation`

Response:
```json
{
  "dev_source": "1.1.220",
  "headline_mode": "cyclic",
  "headline_recommendation": "Aktuell cyclic (Median ~1 Min/Telegramm) — empfohlen: hybrid",
  "confidence": "high",
  "reasoning": [
    "Layer 1 (dpt_standard) — DPT-Standard-Empfehlung je GA aus knx_dpt_recommendations.",
    "1 GA(s) zeigen klare Abweichung vom DPT-Default — siehe Detail-Tabelle."
  ],
  "generated_at": "2026-05-03T08:00:00",
  "ga_recommendations": [
    {
      "ga": "5/2/14",
      "label": "Wetter Lux",
      "dpt": "9.004",
      "observed": {
        "mode": "cyclic",
        "confidence": "high",
        "sample_count": 60,
        "value_changes": 5,
        "median_interval_s": 60.0,
        "median_interval_minutes": 1.0,
        "stdev_interval_s": 1.5
      },
      "recommended_mode": "hybrid",
      "recommended_cycle_minutes": [5, 15],
      "recommended_hysteresis": ">= 50 lux",
      "severity": "warn",
      "rationale": "Helligkeit (Lux): natuerliches Licht aendert sich kontinuierlich."
    }
  ]
}
```

Sicherheit:
- `RequireAdminView` + `_check_admin`
- `validate_knx_individual_address` auf `dev_source`
- `parse_iso_period` mit `max_days=365` (Counter-Retention)
- `TokenBucketLimiter`: 10 Aufrufe/Min/Geraet
- 5 Min In-Memory-Cache pro `(dev_source, period_hash)`

---

## FAQ

**Q: Warum sehe ich `insufficient`?**
Weil weniger als 10 Telegramme pro GA in der Beobachtungsperiode
vorlagen. Eine laengere Periode waehlen (1 h → 24 h) hilft.

**Q: Warum gibt es manchmal `[KI]` im Begruendungstext?**
Layer 4 hat geantwortet — bedeutet, dass weder Layer 1 (DPT-
Standard) noch Layer 2 (Modell) eine Empfehlung kannten und der
LLM gefragt wurde. Solche Empfehlungen sind weniger verlaesslich,
manuell pruefen.

**Q: Wie kann ich eine Empfehlung temporaer ignorieren?**
Findings-Tab → Finding mit Code `SEND_CYCLE_DRIFT` (etc.) acken.
Das entfernt die Severity-Boost-Wirkung im Layer 3.

**Q: Wie haeufig wird die Empfehlung neu berechnet?**
Pro Drawer-Open. Cache-TTL 5 Min, danach erneuter Compute.

**Q: Wo sind die Schwellwerte dokumentiert?**
- `BUSLOAD_OVERRIDE_THRESHOLD_PCT = 30.0`
  (`processing/knx_recommend_service.py`)
- `BUSLOAD_OVERRIDE_FACTOR = 1.5`
- `SEND_MODE_INSUFFICIENT_THRESHOLD = 10`
- `SEND_MODE_HIGH_CONFIDENCE_THRESHOLD = 30`
- `CYCLIC_REGULARITY_MAX_RATIO = 0.3`
- `ON_CHANGE_GAP_RATIO = 10.0`
- `ON_CHANGE_VALUE_CHANGE_THRESHOLD = 0.7`

**Q: Wie kann ich die DPT-Tabelle erweitern?**
PR auf `processing/knx_dpt_recommendations.py` mit einem neuen
Eintrag in `KNX_DPT_RECOMMENDATIONS`. Die Konsistenz-Tests
(`tests/unit/test_knx_dpt_recommendations.py`) verlangen
`max_rate_per_min ≤ KNX_RECOMMENDED_RATES_PER_MIN[dpt]` aus der
alten Tabelle.

**Q: Wie kann ich Modell-Empfehlungen erweitern?**
PR auf `processing/knx_device_model_recommendations.py` mit
einem neuen `ModelRecommendation`-Eintrag. Glob-Pattern eng halten
(z. B. `garage*` statt `*`).

---

## Out-of-scope / Future

- **Direkter Anthropic-Provider** (statt OpenAI-Schema): Iter L4.x.
  Workaround: LiteLLM-Gateway davor.
- **ETS-Topologie-Import** fuer automatische `manufacturer/model`-
  Population aus dem ETS-Projekt.
- **Bulk-Recommendation-Export** (CSV mit allen Geraeten).
- **Auto-Apply-via-MQTT-Bridge** (Empfehlungen automatisch im
  Geraet setzen) — sicherheitskritisch, eigenes Feature-Konzept.
