# Konzept: Statistik-Tabs + KNX-Telegrammanalyse

**Status:** Konzept (noch nicht implementiert)
**Datum:** 2026-05-02
**Iteration:** geplant ab Release 0.11.0

---

## 1. Ziel

1. Den bestehenden „Statistik"-Tab in **Sub-Tabs** aufteilen, damit
   verschiedene Auswertungen sauber getrennt sind:
   - **Tab 1 — Live-Status:** alles, was heute schon unter Statistik ist
     (KPIs, Severity-Verteilung, aktive Quellen, Heatmap, Top-Sources).
   - **Tab 2 — KNX-Bus-Analyse:** neue Auswertung der KNX-Telegramme aus
     dem messagehub-Protokoll, mit dem Ziel, **überaktive
     Gruppenadressen** zu identifizieren und konkrete Vorschläge zur
     **Buslast-Reduktion** zu liefern.
2. Den Anwender soll am Ende eine **Empfehlungsliste** abholen können:
   _„GA 5/2/14 (Wetterstation Lux) sendet 142 Tel/Min. Empfohlen wären
   <2 Tel/Min — passe in der ETS Hysterese auf ≥50 Lux und Sendezyklus
   auf ≥5 Min an."_

---

## 2. Hintergrund — KNX-Bus-Grundlagen

Damit Schwellwerte und Empfehlungen nachvollziehbar sind, hier die
relevanten Eckdaten des Bussystems (für TP1, das mit Abstand
verbreitetste Medium).

### 2.1 Physikalische Limits (TP1)

| Eigenschaft | Wert | Quelle |
|---|---|---|
| Übertragungsrate | 9 600 bit/s, half-duplex | KNX-Spec, [Wikipedia](https://en.wikipedia.org/wiki/KNX_(standard)) |
| Buszugriff | CSMA/CA (Carrier-Sense, Collision-Avoidance) | KNX-Spec |
| Theoretisches Max. | ~50 Telegramme/s pro Linie | [Ivory Egg KNX-IP-Guide](https://ivoryegg.co.uk/essential_guides/a-guide-to-using-knx-over-ip) |
| Praktisch nutzbar | ~30–40 Telegramme/s pro Linie | Erfahrungswert |

Ein typisches Standardtelegramm (Schalten, 1-bit) ist 16–22 Byte lang,
ein längeres (Float, 2 Byte Nutz­last) ~24 Byte. Bei einer
**durchschnittlichen Telegrammlänge von ~22 Byte (176 Bit)** entspricht
**1 Telegramm/s ≈ 1,83 % Buslast**.

### 2.2 Bus-Last-Bewertung (Faustregel der Branche)

| Last | Bewertung | Empfehlung |
|---|---|---|
| < 5 % | gesund | nichts zu tun |
| 5–10 % | normal | beobachten |
| 10–20 % | erhöht | Top-Sender prüfen, optimieren |
| 20–30 % | grenzwertig | Sendeparameter dringend anpassen |
| > 30 % | problematisch | Telegrammverluste/Wiederholungen, Linienteilung erwägen |

(Quellen: KNX-Anwender-Foren, [voltimum.de KNX-Bussystem](https://www.voltimum.de/news/knx-grundlagenwissen-teil-2-knx-bussystem),
[knx-user-forum.de](https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/1797345-buslast-auslesen-und-weiterverwerten))

### 2.3 Häufige Spam-Quellen (anekdotisch konsolidiert)

Aus der Auswertung von KNX-Foren und Hersteller-Manuals lassen sich
folgende „üblichen Verdächtigen" für Buslast-Spitzen identifizieren:

1. **Wetterstationen** mit zu kurzem Sendezyklus oder ohne Hysterese
   (Helligkeit, Wind, Temperatur).
2. **Helligkeitssensoren / Präsenzmelder** im Lux-Modus ohne
   ausreichende Hysterese — kleinste Wolkenbewegung erzeugt
   Telegrammflut.
3. **Bewegungsmelder** mit zu kurzer Nachtriggerzeit (Sperrzeit).
4. **Heizungsstellgrößen** ohne Min-Änderungs-Filter.
5. **Statusrückmeldungen** von Aktoren, die zyklisch alle Werte senden,
   statt nur bei Änderung.
6. **Lebenszeichen / Heartbeats** mit Sub-Minuten-Frequenz.
7. **Falsch konfigurierte Logiken** (z. B. Schaltschleifen, Toggle-
   Telegramme, die sich gegenseitig triggern).

---

## 3. Empfehlungstabelle: Soll-Telegrammraten pro Geräteklasse

Diese Tabelle ist die **Wissensbasis** der Empfehlungs-Engine. Sie
ordnet jeder typischen DPT- und Geräteklasse einen plausiblen
Erwartungsbereich zu. Werte stützen sich auf Hersteller-Defaults
(ABB, Theben, Gira, Zennio, B.E.G., Elsner, Busch-Jaeger), die in
ETS-Manuals dokumentiert sind, sowie auf KNX-Foren-Konsens.

| Geräteklasse | Typische DPT | Empfohlene Senderate (Soll) | Bemerkung |
|---|---|---|---|
| **Schaltbefehl** (Licht, Steckdose) | 1.001 | nur bei Änderung; 0 zyklisch | Toggle/Status — Spam = Schleife |
| **Schaltstatus-Rückmeldung** | 1.001 | nur bei Änderung | zyklisch nicht nötig |
| **Bewegungs-/Präsenz-Erkennung** | 1.001/1.018 | ≤ 1 Wechsel/Min | Nachtriggerzeit ≥ 30 s |
| **Dimmwert** (relativ, Start/Stopp) | 3.007 | nur bei Bedienung | nicht zyklisch |
| **Dimmwert** (absolut) | 5.001 | nur bei Änderung | zyklisch ≥ 10 Min als Heartbeat |
| **Stellgröße Heizung** | 5.001 | nur bei Δ ≥ 1–2 %, zyklisch ≥ 10–15 Min | Manche Aktoren brauchen Heartbeat sonst Notlauf |
| **Temperatur-Istwert** | 9.001 | bei Δ ≥ 0,2–0,5 K, zyklisch ≥ 5–10 Min | _„Alle 30 s ist übertrieben"_ ([Voltimum](https://www.voltimum.de/news/knx-grundlagenwissen-teil-2-knx-bussystem)) |
| **Temperatur-Sollwert** | 9.001 | nur bei Änderung | zyklisch unnötig |
| **Helligkeit (Lux)** | 9.004 | bei Δ ≥ 50–100 Lux + Hysterese, zyklisch ≥ 5 Min | Wetter-Wolken → Spam ohne Hysterese |
| **Windgeschwindigkeit** | 9.005 | bei Δ ≥ 1 m/s, zyklisch ≥ 5 Min | Sturm-Schwellen separat |
| **Luftfeuchte** | 9.007 | bei Δ ≥ 2–5 %, zyklisch ≥ 10 Min | träges Signal, niedrige Rate ok |
| **CO₂** | 9.008 | bei Δ ≥ 25–50 ppm, zyklisch ≥ 5–10 Min | |
| **Energie / Zähler** | 13.010/13.013 | zyklisch ≥ 5–15 Min, bei Schwellüberschreitung | |
| **Datum / Uhrzeit** | 10.001/11.001 | 1× pro Min Zeit, 1×/d Datum | Master-Time-Server |
| **Szenenaufruf** | 17.001/18.001 | nur bei Bedienung | |
| **Wetterstation aggregiert** | divers | siehe Einzel-DPTs | typisch 50–100 GAs, in Summe gerne >50 % der Buslast |

### 3.1 Klassifizierung von Auffälligkeiten

Bezugsgröße ist **Telegramme/Minute**, gemittelt über den
Auswertezeitraum. Pro GA wird die Ist-Rate gegen die obere Soll-Grenze
verglichen:

| Verhältnis Ist/Soll | Ampel | Etikett |
|---|---|---|
| ≤ 1.0 | 🟢 grün | im erwarteten Bereich |
| 1.0–2.0 | 🟡 gelb | leicht erhöht — beobachten |
| 2.0–5.0 | 🟠 orange | auffällig — Konfiguration prüfen |
| > 5.0 | 🔴 rot | kritisch — wahrscheinlich Fehlkonfiguration |

GAs ohne hinterlegtes DPT bzw. ohne Match in der Tabelle bekommen den
generischen Default **„≤ 5 Tel/Min"** und werden mit Etikett
„unbekannte Klasse" markiert.

---

## 4. UI-Konzept

### 4.1 Struktur

```
[Nachrichten] [Statistik] [Einstellungen] [Audit]
                  │
                  ├── Sub-Tab: Live-Status      (= heutiger Inhalt)
                  └── Sub-Tab: KNX-Bus-Analyse  (NEU)
```

Die Sub-Tabs werden **innerhalb** der `stats-view` als horizontale
Pill-Buttons gerendert (gleicher Style wie die Top-Tabs in
`messagehub-panel.ts:600-633`, nur eine Größe kleiner). Persistenz des
gewählten Sub-Tabs in `localStorage` unter
`messagehub.stats.subtab`.

### 4.2 Layout Sub-Tab „KNX-Bus-Analyse"

```
┌───────────────────────────────────────────────────────────────────┐
│ [Live-Status] [● KNX-Bus-Analyse]                                 │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─Konfiguration────────────────────────────────────────────────┐ │
│  │ Zeitraum:  [● 1h] [24h] [7d] [30d] [Custom…]                 │ │
│  │ Top-N:     [10] [25] [● 50] [100] [Alle]                     │ │
│  │ Quelle:    [▼ Alle Linien]      DPT: [▼ Alle]                │ │
│  │ Mindest-Rate:  [≥ 1 Tel/Min ⇄]   Filter: [▢ nur 🟠/🔴]       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─KPIs─────────────────────────────────────────────────────────┐ │
│  │ Telegramme/Zeitraum: 184.213    Aktive GAs: 312              │ │
│  │ Geschätzte Ø-Buslast: 6,4 %     Max-1min-Spitze: 47 Tel/s    │ │
│  │ 🔴 4 kritisch    🟠 11 auffällig    🟡 23 erhöht             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─Top-Sender (Tabelle)─────────────────────────────────────────┐ │
│  │ # │ GA       │ Label              │ DPT  │ Tel/Min │ Soll │📊│ │
│  │ 1 │ 5/2/14   │ Wetter Lux         │ 9.004│  142,3  │ ≤2   │🔴│ │
│  │ 2 │ 3/0/12   │ Wind Geschw.       │ 9.005│   38,1  │ ≤4   │🔴│ │
│  │ 3 │ 0/0/1    │ Zentral An/Aus     │ 1.001│   29,7  │ ≤1   │🟠│ │
│  │ 4 │ 1/3/5    │ Temp Wohnzimmer    │ 9.001│   12,4  │ ≤2   │🟠│ │
│  │ … │ …        │ …                  │ …    │   …     │ …    │..│ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─Empfehlungen für 5/2/14────────────────────────────────[click]┐│
│  │ Wetter Lux (DPT 9.004) sendet 142 Tel/Min — empfohlen ≤ 2.    ││
│  │ Wahrscheinliche Ursache: Hysterese zu klein, Sendezyklus zu   ││
│  │ kurz, oder beides.                                            ││
│  │ Empfehlung in der ETS:                                        ││
│  │   • Hysterese auf ≥ 50 Lux setzen                             ││
│  │   • „Bei Änderung senden" mit Mindeständerung 10 %            ││
│  │   • Sendezyklus auf ≥ 5 Min                                   ││
│  │ Erwartete Reduktion: 142 → ~2 Tel/Min (−98 %)                 ││
│  │                                                               ││
│  │ [Als „bekannt" markieren]   [In Whitelist deaktivieren]       ││
│  └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─Tagesverlauf (Telegramme/Min, Top-5 als Linien)──────────────┐ │
│  │  (Sparkline-Chart, gestackt nach GA, 144 Datenpunkte = 10min)│ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### 4.3 Vorgeschlagene Filterkriterien

Der User will explizit Vorschläge — hier die Auswahl, geordnet nach
Nutzen-pro-Komplexität:

| # | Kriterium | Default | Begründung |
|---|---|---|---|
| 1 | **Zeitraum** (1h/24h/7d/30d/Custom) | 24h | Wichtigster Filter — kurze Spitzen ≠ Daueraktivität |
| 2 | **Top-N** (10/25/50/100/Alle) | 50 | Performance + Lesbarkeit |
| 3 | **Mindest-Rate** (Tel/Min, einstellbar) | ≥ 1 | Filtert „normale" GAs raus |
| 4 | **DPT-Filter** (Multi-Select) | alle | „nur 9.x ansehen" o.ä. |
| 5 | **Source-Address-Filter** (Linie/Bereich) | alle | „Welche Linie ist überlastet?" |
| 6 | **Schweregrad** (nur 🟠/🔴) | aus | Quick-Win-Liste |
| 7 | **Sortierung** (Tel/Min, Verhältnis Ist/Soll, Label A-Z) | Tel/Min ↓ | |
| 8 | **Gruppierung** (pro GA / pro Hauptgruppe / pro Geräte­quelle) | pro GA | Hauptgruppen-Sicht zeigt Aggregations-Hotspots |
| 9 | **„Versteckte" GAs ausblenden** (Toggle) | aus | User kann GAs als „bekannt/akzeptiert" markieren |
| 10 | **Telegramm-Typ** (Read/Response/Write) | alle | Reads/Responses separat sichtbar machen — Read-Burst-Erkennung |
| 11 | **Anti-Pattern-Filter** (nur Findings anzeigen) | aus | Quick-Sicht „was ist eindeutig kaputt" |

### 4.4 Empfehlungs-Detail-Pane

Klick auf eine Tabellenzeile öffnet einen Detail-Bereich (kein Modal —
inline darunter, wie HA-Style):

- **Zusammenfassung:** Ist-Rate, Soll-Rate, Verhältnis, Verteilung
  über den Zeitraum (kleine Sparkline).
- **Wertehistogramm:** zeigt, ob die Werte „springen" (Hinweis auf
  fehlende Hysterese) oder sich kontinuierlich ändern (Hinweis auf
  zu kurzen Sendezyklus).
- **Empfehlung:** generierter Text aus DPT-Klasse + erkanntem Muster
  (siehe §5.3).
- **Aktionen:**
  - „Als bekannt markieren" → GA bekommt Flag
    `acknowledged_overactive=1`, taucht nicht mehr in der Top-Liste
    auf, bis User es zurücksetzt.
  - „Logging deaktivieren" → setzt
    `knx_group_addresses.log_enabled = 0` (entlastet sofort die
    messagehub-DB, nicht den Bus, aber das ist ehrlich kommuniziert).
  - „In ETS dokumentiert" → Notiz-Feld, Freitext für eigene Erinnerung.

---

## 5. Algorithmus & Wissensbasis

### 5.1 Datenquelle

Die Auswertung erfolgt **ausschließlich auf der bestehenden
messagehub-Tabelle `messages`**, gefiltert auf `source = 'knx-bus'`.
Wir lesen `metadata.knx_ga`, `metadata.knx_dpt`,
`metadata.knx_source`, `metadata.knx_value` aus dem JSON-Feld.

**Kein** zweiter Persistenz-Pfad. Damit haben wir automatisch:
- Retention identisch zum Rest des Hubs.
- Keine Schema-Migration für Mass-Daten.
- Kein doppeltes Aggregations-Reasoning.

**Konsequenz für die Aussagekraft:** wir sehen nur GAs, die in der
Whitelist `log_enabled=1` haben. Das ist für die User-Story OK — der
User pflegt die Whitelist sowieso (knx-addresses-view), und die
Statistik motiviert ihn, mehr GAs aufzunehmen, sobald er weiß, dass es
kostenlos ist (siehe §10 Performance).

**Optional Phase 2** (nicht in Iteration 1): Schatten-Counter pro GA,
auch ohne Logging, in einer schmalen Zähler-Tabelle, die nur Aggregate
hält. Dazu separates Konzept-Update.

### 5.2 Hauptberechnung

```python
# Pseudo-Code
def compute_stats(period_from, period_to, filters):
    duration_min = (period_to - period_from).total_seconds() / 60
    rows = sql_select_grouped(
        "SELECT json_extract(metadata, '$.knx_ga') AS ga, "
        "       json_extract(metadata, '$.knx_dpt') AS dpt, "
        "       COUNT(*) AS n, "
        "       MIN(timestamp), MAX(timestamp) "
        "FROM messages WHERE source='knx-bus' "
        "  AND timestamp BETWEEN ? AND ? "
        "GROUP BY ga ORDER BY n DESC "
    )
    for row in rows:
        rate = row.n / duration_min                    # Tel/Min
        soll = recommend_for(row.dpt, row.ga)          # ≤ X Tel/Min
        ratio = rate / soll if soll > 0 else float("inf")
        row.severity = classify(ratio)                 # green/yellow/orange/red
        row.recommendation = build_recommendation(row.dpt, rate, soll)
        row.bus_load_pct = (rate / 60) * 22 * 8 / 9600 * 100
    return rows
```

### 5.3 Empfehlungstexte

Die Empfehlungs-Engine ist **regelbasiert**, kein ML, keine externe
API. Als Text-Templates, parametrisiert nach DPT-Klasse:

```python
RECOMMENDATIONS = {
  "9.001": "Temperatur-Istwert: empfohlen Hysterese ≥ 0,2 K, "
           "Sendezyklus ≥ 5 Min. Ist-Rate {rate} Tel/Min "
           "deutet auf zu enge Hysterese hin.",
  "9.004": "Helligkeit: empfohlen Hysterese ≥ 50 Lux, "
           "Sendezyklus ≥ 5 Min. Bei Wetterstationen häufig die "
           "größte Buslast-Quelle.",
  "1.001": "Schaltbefehl: nur Änderungen senden, kein Zyklus. "
           "Hohe Rate hier deutet auf Schalt-Schleife oder "
           "redundante Toggle-Telegramme hin.",
  # ...
  "_default":
    "Unbekannte DPT-Klasse — erwarteter Bereich ≤ 5 Tel/Min. "
    "Prüfe in der ETS Sendeparameter und Hysterese.",
}
```

Bei Schwellüberschreitung wird zusätzlich eine **konkrete Reduktions-
Schätzung** angehängt, basierend auf einer naiven Annahme: wenn die
Soll-Rate erreicht würde, wäre das die neue Last.

### 5.4 Buslast-Schätzung

Für die KPI „Geschätzte Ø-Buslast" rechnen wir konservativ:

```
Buslast ≈ (Σ_GAs Tel/s) × 22 Byte × 8 Bit/Byte / 9600 Bit/s
```

Mit dem Hinweis im UI: _„Geschätzt — ETS-Bus-Activity-Monitor liefert
exaktere Werte. Diese Anzeige basiert auf den geloggten Telegrammen,
also nur GAs in der Whitelist."_

### 5.5 Heuristik „springende Werte vs Sendezyklus"

Bei DPT 9.x (Float) bestimmen wir aus der Werte-Historie zwei
Indikatoren:

- **σ(Δwert) / mean(|Δwert|)**: hohe Streuung mit kleinen Mittel-Δ
  → Hysterese-Problem.
- **Median(Δt) konstant ≈ z. B. 30 s**: → fester Zyklus zu kurz.

Damit kann die Empfehlung präziser werden („Hysterese erhöhen" vs
„Sendezyklus verlängern").

### 5.6 Anti-Pattern-Detector (orthogonal zur Rate)

Aus dem Realdaten-Sample (§15) abgeleitet — Muster, die **nicht** über
die reine Telegrammrate erkannt werden, aber genauso buslast-relevant
sind. Werden zusätzlich zur Rate-Klassifizierung als „Findings"
ausgegeben.

| Anti-Pattern | Erkennung | Empfehlung |
|---|---|---|
| **Konstant-Wert-Spam** | Var(value) = 0 über N≥10 Telegramme bei DPT 9.x/5.x | Sensor sendet konstanten Wert — meist Default 0, weil keine reale Sensorik dran ist. ETS-App-Konfig prüfen, zyklisches Senden deaktivieren. |
| **Read-Burst** | ≥ 10 GroupValueRead-Telegramme einer Source-Adresse innerhalb < 5 s | Reading-Pattern (typisch HA-`sync_state`). `every <intervall>` reduzieren oder auf `init`/`expire` umstellen. |
| **Mehrfach-Response** | Pro `(GA, Read-Telegramm)` mehr als 1 Response innerhalb < 200 ms | Mehrere Aktoren auf gleicher GA oder Aktor antwortet redundant. ETS-Topologie und Status-Objekt-Konfig prüfen. |
| **Status-Schleife** | Sehr hohe Rate auf DPT 1.001 + Werte alternieren mit fester Frequenz | Toggle-Schleife zwischen zwei Geräten/Logiken. Logik-Bausteine in der ETS prüfen. |
| **Heartbeat-Spam** | Identische Telegramme mit konstantem Δt < 60 s, Wert immer gleich | Lebenszeichen zu kurz konfiguriert. Auf ≥ 5 Min anheben. |

Implementierung: pro Top-Sender wird zusätzlich zur Rate-Auswertung
eine kleine Folge-Analyse über Werte/Δt/Telegramtype gefahren. Output:
Liste von Findings (Strings + Severity), die im Detail-Pane unter der
Rate-Empfehlung erscheinen.

### 5.7 Source-Address-Sicht (zweite Aggregation)

Eine reine GA-Sicht verfehlt Geräte, die **viele GAs gleichzeitig**
spammen — typisch Wetterstationen, Multi-Sensoren, KNX-IP-Gateways.
Daher zweite Pivot-Sicht: gruppiert nach `metadata.knx_source` (1.1.x).

```sql
SELECT json_extract(metadata, '$.knx_source') AS dev_source,
       COUNT(*) AS n,
       COUNT(DISTINCT json_extract(metadata, '$.knx_ga')) AS ga_count
FROM messages WHERE source='knx-bus' ...
GROUP BY dev_source ORDER BY n DESC
```

UI als zusätzliche Aggregations-Option neben „pro GA"/„pro
Hauptgruppe" (siehe §4.3 Punkt 8).

---

## 6. Backend-API

Neue Endpoints unter `/api/messagehub/knx-stats`:

| Methode | Endpoint | Zweck |
|---|---|---|
| `GET` | `/knx-stats/summary?from=…&to=…` | KPIs (Total, aktive GAs, geschätzte Buslast, Ampel-Counts) |
| `GET` | `/knx-stats/top?from=…&to=…&limit=50&min_rate=1&dpt=…&severity=…` | Top-Sender mit Rate, Soll, Klassifizierung |
| `GET` | `/knx-stats/ga/{ga}?from=…&to=…` | Detail einer GA: Histogram, Sparkline, Empfehlung |
| `GET` | `/knx-stats/timeline?from=…&to=…&bucket=10m&top=5` | Linien-Daten für Chart |
| `POST` | `/knx-stats/acknowledge` body `{ga, note?}` | Markiere GA als bekannt |
| `DELETE` | `/knx-stats/acknowledge/{ga}` | Acknowledge entfernen |

### 6.1 Pagination & Limits

- `limit` Default 50, Hard-Cap 500 (UI fragt nicht mehr an).
- `min_rate` Default 0.0 (= alles), UI setzt 1.0.
- Alle Listen-Endpoints liefern `{items: [...], total: N, period_min: M}`.

### 6.2 Caching

- Aggregat-Queries auf `messages` mit `json_extract` sind teuer auf
  großen Tabellen. Wir cachen pro `(from, to, filterhash)` für 60 s
  in `hass.data[DOMAIN]['_knx_stats_cache']` (TTL-Cache, kein DB).
- Live-Refresh (Button) bypasst den Cache.

---

## 7. Datenmodell

### 7.1 Neue Tabelle `knx_ga_acknowledgements`

```sql
CREATE TABLE knx_ga_acknowledgements (
  ga TEXT PRIMARY KEY,
  note TEXT,
  acknowledged_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
```

Klein, einfach, kein Index nötig (PK reicht).

### 7.2 Wissensbasis: `const.py`

DPT-Soll-Werte als unveränderlicher dict in `const.py`. **Keine
DB-Tabelle**, weil:
- Die Werte ändern sich nur mit Code-Releases.
- User-Override pro GA wird über die acknowledgement-Tabelle abgebildet
  („dieses Verhalten ist für mich ok").
- Spart Migration und UI für Werte-Pflege.

```python
# const.py (Auszug)
KNX_RECOMMENDED_RATES_PER_MIN: dict[str, float] = {
    "1.001":   1.0,    # Schalten — nur Änderung
    "1.018":   1.0,    # Bewegung
    "5.001":   2.0,    # Dimmwert / Stellgröße
    "9.001":   2.0,    # Temperatur
    "9.004":   2.0,    # Helligkeit
    "9.005":   4.0,    # Wind
    "9.007":   1.0,    # Feuchte
    "9.008":   2.0,    # CO2
    "13.010":  0.5,    # Energiezähler
    "_default": 5.0,
}
```

---

## 8. Frontend-Komponenten

### 8.1 Neue Dateien

```
frontend/src/components/
  ├── stats-view.ts              (umgebaut → Sub-Tab-Container)
  ├── stats-live-view.ts         (NEU, ehemaliger Inhalt)
  └── stats-knx-view.ts          (NEU)
```

### 8.2 stats-view.ts — neue Aufgabe

Reduziert sich auf:
- Sub-Tab-Bar rendern.
- Aktiven Sub-Tab-State halten (mit `localStorage`-Persistenz).
- Den jeweiligen Sub-View einbetten und die `api`-Property
  durchreichen.

### 8.3 stats-knx-view.ts — Skizze

```typescript
@customElement("stats-knx-view")
export class StatsKnxView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _filters: KnxStatsFilters = loadFilters();
  @state() private _summary?: KnxStatsSummary;
  @state() private _top?: KnxStatsRow[];
  @state() private _selectedGa?: string;
  @state() private _gaDetail?: KnxStatsGaDetail;
  @state() private _timeline?: KnxStatsTimeline;
  @state() private _loading = false;

  // …Filter-Bar, KPI-Cards, Top-Tabelle, Detail-Pane, Sparkline-Chart
}
```

### 8.4 Wiederverwendung

- `mh-pill`-Klassen für Severity-Ampel.
- KPI-Card-Style aus `stats-live-view.ts` 1:1 übernehmen.
- Tabellen-Style aus `knx-addresses-view.ts:797-869` übernehmen.

### 8.5 Sparkline / Timeline-Chart

Inline-SVG, kein Chart-Lib. Wir haben das schon mit der Heatmap
gezeigt, dass eigenes SVG reicht. Lib wie ChartJS würde das HACS-
Bundle aufblähen.

---

## 9. API-Client-Erweiterung (TypeScript)

```typescript
// api-client.ts (neu)
export interface KnxStatsFilters {
  from: string;       // ISO
  to: string;
  topN: number;
  minRate: number;    // Tel/Min
  dpt?: string[];
  severity?: Array<"green"|"yellow"|"orange"|"red">;
}

export interface KnxStatsRow {
  ga: string;
  dpt: string | null;
  label: string;
  count: number;
  rate_per_min: number;
  recommended_rate: number;
  ratio: number;
  severity: "green"|"yellow"|"orange"|"red";
  recommendation: string;
}

export interface KnxStatsSummary {
  total_telegrams: number;
  active_gas: number;
  estimated_busload_pct: number;
  peak_telegrams_per_sec: number;
  counts_by_severity: Record<string, number>;
}

// Methoden auf ApiClient:
getKnxStatsSummary(f: KnxStatsFilters): Promise<KnxStatsSummary>;
getKnxStatsTop(f: KnxStatsFilters): Promise<{items: KnxStatsRow[]; total: number}>;
getKnxStatsGa(ga: string, f: KnxStatsFilters): Promise<KnxStatsGaDetail>;
getKnxStatsTimeline(f: KnxStatsFilters & {bucketMin: number}): Promise<KnxStatsTimeline>;
acknowledgeKnxGa(ga: string, note?: string): Promise<void>;
unacknowledgeKnxGa(ga: string): Promise<void>;
```

---

## 10. Performance-Überlegungen

Der Hot-Path-Aspekt ist die Aggregation auf `messages` mit
`json_extract`. Bei 100.000+ Zeilen wird das ohne Index-Hilfe spürbar.

### 10.1 Geplante Optimierungen

1. **Zusätzlicher Index** auf
   `messages(source, timestamp DESC) WHERE source='knx-bus'`
   (partieller Index, hält den Index klein).
2. **Generierte Spalten**, falls SQLite ≥ 3.31:
   ```sql
   ALTER TABLE messages ADD COLUMN knx_ga_idx TEXT
     GENERATED ALWAYS AS (json_extract(metadata, '$.knx_ga')) VIRTUAL;
   CREATE INDEX idx_messages_knx_ga ON messages(knx_ga_idx)
     WHERE source='knx-bus';
   ```
   So wird `GROUP BY` auf GA über den Index bedient.
3. **TTL-Cache** in `hass.data` (60 s) für Summary + Top-Listen.

### 10.2 Ehrlicher Trade-off

Wer 30 Tage Auswertung über mehrere Mio. Telegramme will, soll **erst
einmal Phase 2 abwarten** (Schatten-Counter pro GA). Iteration 1
deckt 1h/24h/7d gut ab, 30d wird langsamer (~5–10 s) — das ist OK für
einen On-Demand-Tab.

---

## 11. Phasen-Plan (Iterationen)

CLAUDE.md-konform: jede Iteration ≤ 60 min, TDD, alle Quality Gates
grün vor Commit.

| Iter | Inhalt | Test-zuerst-Artefakt |
|---|---|---|
| **1** | const.py: KNX_RECOMMENDED_RATES_PER_MIN + classify-Helper | `test_classify_returns_severity_label` |
| **2** | Recommendation-Engine (regelbasiert, Templates) | `test_recommend_for_dpt_9001_high_rate_returns_hysterese_hint` |
| **3** | SQL-Queries in storage/queries.py: top-GAs, summary | `test_knx_top_query_groups_by_ga_and_orders_by_count` |
| **4** | Acknowledge-Repository + DB-Migration | `test_acknowledge_persists_and_filters_top_query` |
| **5** | API-View `/knx-stats/summary` + `/top` mit Auth | `test_summary_endpoint_returns_kpis_for_period` |
| **6** | API-View `/ga/{ga}` mit Histogramm + Empfehlung | `test_ga_detail_returns_recommendation_text` |
| **7** | API-View `/timeline` mit Bucketing | `test_timeline_buckets_10min_returns_correct_count` |
| **8** | Frontend: stats-view.ts → Sub-Tab-Container | `frontend/tests/stats-view.test.ts` |
| **9** | Frontend: stats-live-view.ts (Refactor) | bestehende Tests bleiben grün |
| **10** | Frontend: stats-knx-view.ts — Filter + KPIs | `stats-knx-view.test.ts` |
| **11** | Frontend: Top-Tabelle + Detail-Pane | UI-Test für Acknowledge-Flow |
| **12** | Frontend: Sparkline-Timeline + Buslast-Visualisierung | Render-Test mit Mock-Daten |
| **13** | Translations (de/en/es/fr/it/nl), README-Update | manueller Smoketest |
| **14** | CHANGELOG, manifest.json bump → 0.11.0, Tag | Quality-Gates-Pass |

---

## 12. Quality Gates pro Iteration (Erinnerung)

1. Backend: `pytest -q` grün, `mypy --strict` clean, `ruff` clean
2. Frontend: `npm run typecheck`, `npm test`, `npm run build` grün
3. HACS-Bundle (`custom_components/messagehub/frontend_dist/`) im Commit
4. Conventional Commits, Footer `Iteration: N`

---

## 13. Risiken & offene Fragen

| Risiko | Mitigation |
|---|---|
| Aggregat-Queries auf großer `messages`-Tabelle zu langsam | partieller Index + TTL-Cache, ggf. Phase-2-Schatten-Counter |
| User hat wenig GAs in der Whitelist → Statistik ist inkomplett | UI-Hinweis: „Statistik zeigt nur GAs mit aktiviertem Logging — XX von YY Projekt-GAs" + Quick-Action „Alle aus Projekt aktivieren" |
| Empfehlungen unpassend für ungewöhnliche Geräte | Acknowledge-Mechanismus + Note-Feld; Default-Bucket „unbekannt" |
| Buslast-Schätzung weicht vom ETS-Wert ab | UI kennzeichnet als „geschätzt" und erklärt warum |
| DPT-Wissensbasis altert | versionsweise pflegen, in CHANGELOG dokumentieren |

### Offene Fragen (an User)

1. **Persistenz der Filter-Konfig:** pro Browser (LocalStorage) wie
   aktuell, oder pro HA-Account (Server-Side)? Empfehlung:
   LocalStorage, konsistent mit `messagehub.filters`.
2. **Default-Zeitraum:** 24h sinnvoll? Oder lieber 7d, weil damit
   tageszeitliche Spitzen sichtbar werden?
3. **Acknowledge sticky:** soll ein „Bekannt"-Flag automatisch
   ablaufen (z. B. nach 30 Tagen), damit man neu auftretende
   Probleme nicht übersieht?
4. **Schatten-Counter (Phase 2) jetzt schon vorbereiten** (Backend-
   Pfad), auch wenn UI erst später kommt? Kostet ~1 Iteration mehr
   in Phase 1, spart Schema-Migration in Phase 2.

---

## 14. Beispiel-Output (Mock)

So liest sich die Empfehlungs-Detail-Seite für eine kritische GA aus
einer typischen Wetterstation:

> **5/2/14 — „Wetter Lux" (DPT 9.004)**
>
> 🔴 142 Tel/Min — 71-fach über Empfehlung
>
> Im Zeitraum der letzten 24 h wurden 204.480 Telegramme von dieser
> Gruppenadresse aufgezeichnet. Der erwartete Bereich liegt bei
> ≤ 2 Tel/Min.
>
> **Wahrscheinliche Ursache:** Hysterese der Wetterstation zu eng
> oder Sendezyklus zu kurz. Die Werte schwanken im Mittel um
> 4 Lux mit σ = 8 Lux — typisches Bild für „bei jeder
> Mini-Wolkenbewegung wird gesendet".
>
> **Empfehlung in der ETS:**
> 1. Hysterese auf ≥ 50 Lux setzen
> 2. „Bei Änderung senden" mit Mindeständerung auf 10 % aktivieren
> 3. Sendezyklus auf ≥ 5 Min
>
> **Erwartete Reduktion:** 142 → ~2 Tel/Min (−98 %).
> Geschätzte Buslast-Entlastung: 4,3 Prozentpunkte.

---

## 15. Validierung am realen Log-Sample (User-Anlage, 2026-05-02)

Vom User wurde ein Auszug aus dem ETS-Gruppenmonitor seiner Anlage
geliefert. 38 Telegramme im Zeitfenster `16:02:01 … 16:02:05,403`
(4,4 s) → ~8,6 Tel/s ≈ **17 % Buslast** in diesem Snapshot. Das ist
nur ein Schnappschuss, aber er enthält bereits **drei klar erkennbare
Anti-Patterns**, die das Konzept abdecken können soll:

### 15.1 Anti-Pattern A — HA-Read-Burst (Source 1.1.6)

In 3 s feuert `1.1.6 (Home Assistant)` 16 `GroupValueRead`-Telegramme
gegen Schalt-GAs (`6/1/1` … `12/1/2`). Jeder Read erzeugt mindestens
eine Response → **32 Telegramme allein durch Polling**.

- **Auslöser:** typisch `sync_state: every <kurz>` in der HA-KNX-
  Konfiguration oder ein Reconnect-Storm.
- **Engine-Erkennung:** Source-Address-Sicht (§5.7) zeigt 1.1.6 als
  Top-Sender, kombiniert mit Read-Burst-Detector (§5.6).
- **Konkrete Empfehlung:** in `configuration.yaml` der HA-KNX-
  Integration `sync_state` auf `init` oder `expire 30` umstellen,
  oder pro Entity differenzieren.

### 15.2 Anti-Pattern B — Hörmann-Gateway (1.1.220) sendet Default-0

`22/3/43` Tor-Temperatur, `22/3/44` Tor-Feuchte, `22/3/45` Tor-Taupunkt
— alle drei mit Wert `0x0000` (= 0 °C / 0 % / 0 °C). Drei Telegramme
binnen 320 ms. Ein Tor-Antrieb liefert in der Regel keine reale
Klima-Sensorik — diese Werte sind **Default-0**, weil das Gateway
diese Group-Objects einfach „zur Sicherheit" zyklisch sendet.

- **Engine-Erkennung:** Konstant-Wert-Spam-Detector (§5.6) — Var(value)
  = 0 über alle Samples.
- **Konkrete Empfehlung:** in der ETS-App des Hörmann-Gateways die
  Klima-Group-Objects deaktivieren oder zumindest „nur bei Änderung
  und mit Hysterese" konfigurieren.

### 15.3 Anti-Pattern C — Mehrfach-Response (8/1/1)

`GA 8/1/1` (R008 Kinderzimmer Mia Deckenlicht) erhält **vier
Responses** binnen 130 ms (`16:02:03,215`, `,256`, `,295`, `,345`)
nach einem einzigen Read. Quelle ist jedes Mal `1.1.11`.

- **Mögliche Ursachen:** der Aktor hat das Status-Group-Object mehrfach
  parametriert, oder mehrere HA-Reads sind zeitnah gefolgt, oder ein
  KNX-Repeater dupliziert.
- **Engine-Erkennung:** Mehrfach-Response-Detector (§5.6) — pro
  `(GA, kurzes Zeitfenster)` mehr als 1 Response.

Daneben sehe ich noch zwei „normale, aber nennenswerte" Muster:

- **Doppel-Response 7/1/1 / 6/1/4:** zwei verschiedene Aktoren
  (`1.1.11` Hager + `1.1.20` MDT-DALI) antworten parallel — typisch,
  wenn beide die gleiche Last schalten. Ist nicht falsch, aber
  verdoppelt die Last bei jedem Read.
- **Gira S1 Zentralfunktion:** `0/0/1` Datum, `0/0/2` Uhrzeit, `0/0/4`
  Datum+Uhrzeit kombiniert werden parallel gesendet. Wenn alle
  Empfänger die kombinierte `0/0/4` lesen können, lassen sich `0/0/1`
  und `0/0/2` einsparen — das hängt von den anderen KNX-Geräten ab.

### 15.4 Was das für die Engine konkret bedeutet

Aus dem Sample folgen drei zwingende Engine-Features:

1. **Telegramm-Typ als first-class Filter** (`GroupValueRead`,
   `GroupValueResponse`, `GroupValueWrite`). Reads und Responses
   müssen separat zählbar sein. → §4.3 Filter Punkt 10 (neu).
2. **Source-Sicht** als gleichberechtigte zweite Pivot-Achse, nicht
   nur als Bonus-Feature. → §5.7.
3. **Anti-Pattern-Detector** — Konstant-Wert, Read-Burst, Mehrfach-
   Response — als zusätzliche Findings neben der Rate-Klassifizierung.
   → §5.6.

### 15.5 Erfasster vs. ungeloggter Anteil

Wichtige Einschränkung: das Konzept stützt sich auf
`messages.source = 'knx-bus'`. Die GAs aus dem Sample (`6/1/x`,
`7/1/x`, `8/1/1` …) müssen in der messagehub-Whitelist
(`knx_group_addresses.log_enabled = 1`) sein, sonst sehen wir sie
nicht. Wenn der User das Feature wirksam nutzen will, sollte er den
**„Aus HA-KNX-Projekt übernehmen"-Button** in der KNX-Adressen-View
verwenden und **danach** in der UI sein gesamtes Projekt
log-aktivieren — Tabellen-View hat dafür schon den Toggle, ein Bulk-
Toggle fehlt aber noch und sollte als kleine Begleit-Verbesserung
mitgenommen werden (Iteration 8a, 15 min).

---

**Ende des Konzepts.**
