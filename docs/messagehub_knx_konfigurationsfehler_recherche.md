# Webrecherche: KNX-Konfigurationsfehler im Group-Monitor erkennen

**Status:** Recherche / Konzept-Vorschlag
**Datum:** 2026-05-03
**Branch:** `claude/knx-config-error-detection-gVMw1`
**Bezug:** Erweiterung von `messagehub_knx_statistik.md` §5.6 (Anti-Pattern-
Detector) — neuer Schwerpunkt: Konfigurationsfehler, die rein aus dem
geloggten Telegrammverkehr (ohne ETS-Projekt-Zugriff) erkennbar sind.

---

## 1. Ziel der Recherche

Wir haben heute einen funktionierenden Anti-Pattern-Detector für vier
Muster (Konstant-Wert, Read-Burst, Mehrfach-Response, Heartbeat-Spam)
plus einen Bus-Health-Score. Die Frage: **Was sehen erfahrene
KNX-Anwender im ETS-Group-Monitor an Fehlern, das wir noch nicht
abdecken?** Ziel ist eine priorisierte Lückenliste mit konkreten
Erkennungsregeln, die sich aus `messages.source = 'knx-bus'` und den
vorhandenen `metadata`-Feldern (`knx_ga`, `knx_dpt`, `knx_source`,
`knx_value`, Telegram-Typ) ableiten lassen.

---

## 2. Bestandsaufnahme — was die App heute kann

| Feature | Modul | Status |
|---|---|---|
| Rate-Klassifizierung pro GA (grün/gelb/orange/rot) | `processing/knx_stats.py` | ✅ |
| Empfehlungs-Engine (Templates pro DPT) | `processing/knx_stats.py` | ✅ |
| **Konstant-Wert-Spam** | `_detect_constant_value` | ✅ |
| **Read-Burst** | `_detect_read_burst` | ✅ |
| **Mehrfach-Response** | `_detect_multiple_response` | ✅ |
| **Heartbeat-Spam** | `_detect_heartbeat_spam` | ✅ |
| Bus-Health-Score (4 KPIs) | `_build_health_findings` | ✅ |
| DPT-Auto-Erkennung (Heuristik aus Werten) | `infer_dpt_from_samples` | ✅ |
| Source-Address-Sicht (Pivot pro Gerät) | `knx_stats_service.py` | ✅ |
| Telegramm-Typ-Filter (Read/Response/Write) | API + Frontend | ✅ |
| Silence-Detection (Geräte ohne Lebenszeichen) | `knx_stats.py` | ✅ |
| Trend-Vergleich (24h vs. 7d) | WR-I | ✅ |
| Multi-byte-ASCII-Decoder | WR-V | ✅ |
| ACK/NAK-Statistik | xknx-Layer | ❌ **BL-D blocked** |
| Telegram-Tracer | xknx-Layer | ❌ **BL-E blocked** |

**Die Basis ist solide.** Was folgt, sind Erweiterungen, die mit den
heute verfügbaren Datenfeldern (kein xknx-Tieflevel-Zugriff nötig)
realisierbar sind.

---

## 3. Recherche-Befunde — was die KNX-Welt als typische Fehler nennt

Quellen sind die offizielle KNX-Association-Doku (support.knx.org),
die deutschen Foren (knx-user-forum.de, knx-blogger.de), Hersteller-
Wissensdatenbanken (1Home, Hager, Voltus) sowie Issue-Tracker von
HA/openHAB/ioBroker. Vollständige Linkliste in §7.

### 3.1 Häufige Fehlerklassen (konsolidiert aus 7 Quellen)

| # | Fehler | Symptom auf dem Bus | Quelle |
|---|---|---|---|
| **F1** | **DPT-Mismatch** — GA mit falschem Datentyp belegt (z. B. 4-Bit-Objekt auf 1-Bit-GA) | Werte werden falsch dekodiert (`85 A8` statt `−6 °C`) | KNX Association: [Group Addresses & Datapoint Types](https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types) |
| **F2** | **Multi-Responder** — mehrere Aktoren mit gesetztem L-Flag auf derselben GA | >1 Response auf 1 Read, oft millisekunden-versetzt | [knx-blogger Flags](https://knx-blogger.de/knx-flags-einfach-erklaert/), [KNX Flags](https://support.knx.org/hc/en-us/articles/115003188089-Flags) |
| **F3** | **Filter-Tabelle veraltet** — Linienkoppler routet Telegramme ungewollt durch / blockt | Viele GAs erscheinen auf falscher Linie, Repeat-Telegramme | [KNX Couplers & Filter Tables](https://support.knx.org/hc/en-us/articles/360007445460-Couplers-Filter-Tables) |
| **F4** | **Telegrammwiederholung (Repeat-Flag)** — fehlender ACK, NACK oder BUSY | Gleicher Frame mit Repeat-Bit binnen 50 ms | [KNX LL acknowledgement](https://support.knx.org/hc/en-us/articles/115003188269-LL-acknowledgement), [knx-user-forum: Unbestätigte Telegramme](https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/1611435-unbest%C3%A4tigte-telegramme-telegrammwiederholung) |
| **F5** | **Sendung ohne Empfänger** — GA hat kein Ziel-Group-Object | KNX wiederholt 3× wegen fehlendem ACK | [knx-user-forum: Telegrammverlust](https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/2058313-telegrammverlust-in-ips-problem-zu-viele-ger%C3%A4te-gruppenadressen) |
| **F6** | **Schaltschleife / Toggle-Loop** — gleiche GA wird sendend+hörend gleichzeitig genutzt | DPT 1.001 alterniert in fester Frequenz <2 s | [openHAB: Loops on KNX bus](https://community.openhab.org/t/loops-on-knx-bus/22185) |
| **F7** | **Buslast >50 %** — sporadische Fehlfunktionen | hohe Tel/s + viele Repeats | [KNX Bus Activity Monitor](https://support.knx.org/hc/en-us/articles/360018712880-Bus-Monitor-Group-Monitor-and-ETS-Bus-Activity-Monitor) |
| **F8** | **Read ohne Response** — GA wird gelesen, niemand antwortet | GroupValueRead ohne nachfolgenden Response binnen 3 s | [KNX Groups Diagnostics](https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics) |
| **F9** | **Hop-Counter-Erschöpfung** — Telegramm zirkuliert, Hop=0 | Telegramme verschwinden auf Linie X, obwohl gesendet | [KNX Couplers Topology](https://support.knx.org/hc/en-us/articles/360007457380-Couplers-Topology-Changes) |
| **F10** | **Adresskonflikt** — zwei Geräte mit identischer Phys.-Adresse | Programmiermodus zeigt mehrere Geräte | [KNX Individual Addresses](https://support.knx.org/hc/en-us/articles/360011844719-Individual-Addresses) |
| **F11** | **Default-0-Spam** — Gateway sendet Klima-Werte aus nicht-existenter Sensorik | DPT 9.x mit konstant `0x0000` (bereits abgedeckt durch _detect_constant_value) | User-Sample 2026-05-02 (Hörmann-Tor) |
| **F12** | **Wert-Range-Verletzung** — DPT-konforme GA bekommt Werte außerhalb des erlaubten Bereichs | DPT 5.001 (Prozent) bekommt 200 statt 0–100 | [XKNX Issue #137 (Percentage parsing)](https://github.com/XKNX/xknx/issues/137) |
| **F13** | **Reconnect-Storm** — nach Bus-Spannungsausfall fluten Geräte mit Reads/Writes | Spike auf einer Source-Adresse direkt nach Lücke | [HA-Issue #69328](https://github.com/home-assistant/core/issues/69328) |
| **F14** | **Mehrfache Time-Master** — zwei Geräte schreiben auf 0/0/1 (Datum)/0/0/2 (Uhrzeit) | DPT 10.001/11.001 von ≥2 verschiedenen `knx_source` | [User-Sample 2026-05-02 §15.3] |
| **F15** | **Sendezyklus-Drift** — Wetterstation/Sensor verkürzt Zyklus über Zeit | Median(Δt) sinkt über mehrere Tage | knx-blogger.de Bus-Lifecycle |

### 3.2 Was User in Foren am häufigsten fragen

Aus dem Sample der Top-Threads im KNX-User-Forum, KNX-Professionals,
loxforum, Timberwolf-Forum, Home-Assistant-Community und openHAB-
Community kristallisieren sich fünf Themenblöcke heraus:

1. **„Mein Bus ist überlastet — wer ist schuld?"**
   → Wetterstationen, Heizungsstellgrößen, Bewegungsmelder ohne
     Hysterese. **Heute schon abgedeckt** (Top-Sender-Tabelle + Empfehlung).
2. **„Das Ding tut einfach nicht — Telegramm geht raus, kommt nicht an."**
   → meist F2 (Multi-Responder), F3 (Filter veraltet), F4 (Repeat),
     F5 (Empfängerlos). **Teilweise abgedeckt** (Mehrfach-Response).
3. **„Status-LED stimmt nicht mit dem Aktor überein."**
   → meist F2 oder Schaltschleife (F6). Aktor-Rückmeldung wird nicht
     geschrieben oder nicht gelesen.
4. **„Home Assistant zeigt veraltete Werte / muss neu gestartet werden."**
   → typisch F13 (Reconnect-Storm) + zu kurzes `sync_state`-Intervall.
5. **„Warum sehe ich Werte, mit denen ich nichts anfangen kann?"**
   → F1 (DPT-Mismatch). **Teilweise mit DPT-Auto-Erkennung adressiert**,
     aber wir geben heute keine Warnung, wenn der vom Projekt
     gelieferte DPT widerspricht.

### 3.3 ETS-Bordmittel als Maßstab

Die ETS bietet zwei Diagnose-Wizards, die als Inspirationsquelle
dienen, ohne dass wir sie 1:1 nachbauen können (uns fehlt der
Telegram-Tracer-Zugriff):

- **Groups Diagnostics** ([Doku](https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics)):
  prüft pro GA, ob **kein Empfänger acknowledged**, **negativer ACK
  (NAK)** oder **BUSY** vorliegt — alle drei brauchen Layer-2-Frames
  und sind für uns blocked (BL-D/BL-E).
- **Project Check** ([Doku](https://support.knx.org/hc/en-us/articles/115001822790-Project-Check)):
  Offline-Check auf **Orphan-Devices** (kein Group-Object verlinkt)
  und **ungenutzte GAs** (kein Link). Das **können wir nachbilden**,
  wenn der User sein ETS-Projekt geladen hat (knx_group_addresses
  hat dann die Soll-Liste, und wir vergleichen mit `messages` →
  *„im Projekt, aber nie auf dem Bus gesehen"*).

---

## 4. Lücken-Analyse — was wir noch nicht haben

Aus §3 abgeleitet, mit Vergleich zur Implementierung in §2:

| Lücke | Quelle in §3 | Datenbasis ausreichend? |
|---|---|---|
| **L1** DPT-Mismatch-Warnung (Projekt-DPT vs. erkannter DPT) | F1 | ✅ — `knx_dpt` aus Projekt + `infer_dpt_from_samples` |
| **L2** Multi-Responder-Detector (≥2 verschiedene `knx_source` antworten auf gleichen Read) | F2 | ✅ — Telegram-Typ + `knx_source` |
| **L3** Read-ohne-Response (Read, dann 3 s lang nichts auf gleicher GA) | F8 | ✅ — Telegram-Typ + Zeit |
| **L4** Toggle-Loop-Detector (DPT 1.001, alterniert <2 s in mehreren Zyklen) | F6 | ✅ — Wert + Zeit |
| **L5** Wert-Range-Validator (DPT-spezifischer Min/Max) | F12 | ✅ — DPT + Wert |
| **L6** Reconnect-Storm-Detector (Spike auf Source-Adresse nach Bus-Lücke) | F13 | ✅ — `knx_source` + Zeit |
| **L7** Multi-Time-Master (≥2 `knx_source` schreiben 0/0/1 oder 10.001-DPT) | F14 | ✅ — `knx_source` + DPT |
| **L8** Sendezyklus-Drift (Median(Δt) sinkt über Tage) | F15 | ✅ — Trend-Vergleich-Infra ist da |
| **L9** Orphan-GA-Check (Projekt-GA, aber nie auf Bus) | Project Check | ✅ — Whitelist + COUNT(messages) |
| **L10** „Stille" GA (war aktiv, ist seit X Tagen tot) | erweiterte Silence-Detection | ✅ — Silence-Infra ist da, aber pro Gerät, nicht pro GA |
| **L11** Repeat-Pattern-Detector (gleicher Wert auf gleicher GA <50 ms später) | F4 | ⚠️ teilweise — wir sehen die Wiederholung, aber nicht das Repeat-Bit. **Approximation** möglich. |
| **L12** „Sendung ins Leere" (GA wird beschrieben, kein Group-Object lauscht) | F5 | ⚠️ braucht Projekt-Daten zur Empfänger-Liste |

**Nicht aufnehmen, weil ohne xknx-Frame-Layer nicht machbar:**
- Hop-Counter-Werte (F9)
- echte ACK/NAK/BUSY-Statistik (F4 vollständig, F7 vollständig)
- Adresskonflikt-Detektion (F10) — braucht Programmiermodus-Frames

---

## 5. Vorschlag — Erweiterungs-Roadmap (priorisiert)

Reihenfolge nach Nutzen-pro-Aufwand. Jede Iteration hält sich an
CLAUDE.md (≤ 60 Min, TDD, Quality-Gates grün).

### 5.1 Phase A — Quick-Wins aus vorhandenen Daten

| # | Feature | Aufwand | Nutzen | Iter |
|---|---|---|---|---|
| **E1** | **DPT-Mismatch-Warnung** (L1): wenn `infer_dpt_from_samples` ≠ Projekt-DPT, gelbes Finding *„Erkannter Datentyp X widerspricht Projekt-DPT Y — bitte ETS prüfen"* | S | hoch | 1 Iter |
| **E2** | **Multi-Responder-Finding** (L2): Erweiterung von `_detect_multiple_response`, das heute nur „mehr als 1 Response" erkennt — neu: separate Findings je `knx_source`-Set, listet die widersprüchlichen Geräte | S | hoch | 1 Iter |
| **E3** | **Read-ohne-Response-Finding** (L3): pro `(GA, Read-Telegramm)` prüfen, ob im 3-s-Fenster ein Response folgte; sonst Finding *„GA wird gelesen, aber niemand antwortet — ETS L-Flag fehlt"* | S | hoch | 1 Iter |
| **E4** | **Toggle-Loop-Detector** (L4): DPT 1.001 + Wert-Sequenz `0,1,0,1,...` mit Δt < 2 s ≥ 4×; Finding *„Schaltschleife — gleiche GA sendend und hörend?"* | M | hoch | 1 Iter |
| **E5** | **Wert-Range-Validator** (L5): pro DPT (5.001 0-100, 9.005 -67-+670, 5.005 0-360, ...) Min/Max in `const.py`; Wert außerhalb → Finding *„Wert X liegt außerhalb des DPT-Bereichs"* | M | mittel | 1 Iter |

### 5.2 Phase B — Verhaltensmuster über Zeit

| # | Feature | Aufwand | Nutzen | Iter |
|---|---|---|---|---|
| **E6** | **Reconnect-Storm-Detector** (L6): nach `silence_devices`-Lücke ≥ 60 s Spike-Erkennung pro `knx_source` (≥10× normaler Schnitt im 30-s-Fenster) | M | mittel | 1 Iter |
| **E7** | **Multi-Time-Master-Finding** (L7): Pivot auf DPT 10.001/11.001/19.001 nach `knx_source` — wenn ≥2 unterschiedliche Sources auf derselben GA schreiben: Finding | S | mittel | 1 Iter |
| **E8** | **Sendezyklus-Drift** (L8): Median(Δt) der letzten 24 h vs. letzten 7 Tagen — wenn ≤ 50 % gefallen: Trend-Finding *„Sendezyklus hat sich halbiert"* | M | mittel | 1 Iter |
| **E9** | **Repeat-Approximation** (L11): zwei identische Tel auf gleicher GA mit Δt < 100 ms → Repeat-Verdacht, in Tageszählung als KPI *„Vermutete Wiederholungen/Tag"* | M | mittel | 1 Iter |

### 5.3 Phase C — Projekt-Integration (braucht knx_group_addresses)

| # | Feature | Aufwand | Nutzen | Iter |
|---|---|---|---|---|
| **E10** | **Orphan-GA-Report** (L9): Liste aller Whitelist-GAs mit `count(messages) = 0` im Auswertezeitraum — *„im Projekt, aber stumm"* | S | mittel | 1 Iter |
| **E11** | **Silence-pro-GA** (L10): Erweiterung Silence-Detection von Geräte- auf GA-Ebene; *„GA war aktiv bis 2026-04-01, seit 32 Tagen tot"* | M | mittel | 1 Iter |
| **E12** | **„Sendung ins Leere"** (L12): Korrelation zwischen GroupValueWrite und nachgelagertem Status-Wechsel — wenn nie ein Status zurückkommt, vermutlich kein Empfänger | L | niedrig | 2 Iter |

### 5.4 Phase D — UX-Konsolidierung

| # | Feature | Aufwand | Nutzen | Iter |
|---|---|---|---|---|
| **E13** | **„Konfigurations-Check"-Tab** als dritter Sub-Tab neben Live-Status + KNX-Bus-Analyse: aggregierte Findings-Liste über alle Detektoren, sortiert nach Severity | M | hoch | 2 Iter |
| **E14** | **Finding-Whitelist** analog zur GA-Acknowledge-Tabelle: ein Finding-Typ pro GA als „bekannt/akzeptiert" markierbar | S | mittel | 1 Iter |
| **E15** | **Export der Findings als ETS-Notiz-Vorlage** (Markdown, copy-paste-ready in die ETS-Notiz-Spalte) | S | niedrig | 1 Iter |

### 5.5 Empfohlene Reihenfolge

1. **E1, E2, E3** (3 Iter) — die drei Klassiker aus den Foren (DPT-
   Mismatch, Multi-Responder, Read-ohne-Response). Dadurch deckt der
   Detector die häufigsten User-Schmerzpunkte ab.
2. **E13** (2 Iter) — *bevor* weitere Findings dazukommen, brauchen
   wir eine UI-Aggregation, sonst werden die Findings im Detail-Pane
   pro GA übersehen.
3. **E4, E5, E7** (3 Iter) — orthogonale Konfigurations-Probleme.
4. **E10, E11** (2 Iter) — Project-Integration-Quick-Wins.
5. **E6, E8, E9** (3 Iter) — Verhalten-über-Zeit, brauchen längere
   Datenbasis (mind. 7 Tage Logs).
6. **E14, E15** (2 Iter) — UX-Politur.
7. **E12** (2 Iter) — komplex, kleinster Nutzen, zuletzt.

**Gesamtaufwand:** ~17 Iterationen ≙ ~17 Stunden Entwicklungszeit
für die volle Roadmap. Phase A allein (E1-E5) wäre in **5 Iterationen
≙ 1 Arbeitstag** machbar und liefert bereits den größten Hub.

---

## 6. Architektur-Skizze

Die Erweiterungen passen in das bestehende `_run_detectors`-Pattern
(`processing/knx_stats.py:449-476`):

```python
detectors = (
    _detect_constant_value,        # bestehend
    _detect_read_burst,            # bestehend
    _detect_multiple_response,     # bestehend (E2 erweitert)
    _detect_heartbeat_spam,        # bestehend
    _detect_dpt_mismatch,          # NEU E1 (braucht project_dpt-Param)
    _detect_multi_responder,       # NEU E2 (Subtyp von Mehrfach-Response)
    _detect_read_without_response, # NEU E3
    _detect_toggle_loop,           # NEU E4 (DPT 1.001-spezifisch)
    _detect_value_out_of_range,    # NEU E5 (DPT-spezifisch)
    _detect_reconnect_storm,       # NEU E6 (braucht Source-Pivot)
    _detect_multi_time_master,     # NEU E7 (braucht GA-übergreifenden Pivot)
    _detect_send_cycle_drift,      # NEU E8 (braucht Trend-Vergleich)
    _detect_repeat_approximation,  # NEU E9
)
```

Detektoren mit GA-übergreifendem Scope (E2, E6, E7) brauchen eine
zweite Dispatch-Schicht im `knx_stats_service.py` — sie laufen pro
**Set von TelegramSamples**, nicht pro einzelne GA.

Die Wert-Range-Validator-Tabelle (E5) und die DPT-Min/Max-Tabelle
gehören in `const.py` neben `KNX_RECOMMENDED_RATES_PER_MIN`. Format:

```python
# const.py (Vorschlag)
KNX_DPT_VALUE_RANGES: Final[dict[str, tuple[float, float]]] = {
    "5.001": (0.0, 100.0),    # Prozent
    "5.003": (0.0, 360.0),    # Winkel
    "5.004": (0.0, 255.0),    # Counter pulses (8 bit)
    "9.001": (-273.0, 670760.96),  # Temperatur (DPT-Spec)
    "9.005": (0.0, 670760.96),     # Wind, nicht negativ
    "9.007": (0.0, 100.0),    # Feuchte
    "9.008": (0.0, 670760.96),     # CO2
    "13.010": (-2147483648, 2147483647),  # Energie int32
    # ... weitere nach Bedarf
}
```

---

## 7. Quellen

### KNX Association (offizielle Doku)
- [Group Addresses & Datapoint Types](https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types)
- [KNX Flags](https://support.knx.org/hc/en-us/articles/115003188089-Flags)
- [LL acknowledgement](https://support.knx.org/hc/en-us/articles/115003188269-LL-acknowledgement)
- [Online Error Diagnostics](https://support.knx.org/hc/en-us/articles/360011738780-Online-Error-Diagnostics)
- [Groups Diagnostics](https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics)
- [Groups Diagnostics (detailed)](https://support.knx.org/hc/en-us/articles/360019069020-Groups-Diagnostics-detailed)
- [Bus Monitor, Group Monitor and ETS Bus Activity Monitor](https://support.knx.org/hc/en-us/articles/360018712880-Bus-Monitor-Group-Monitor-and-ETS-Bus-Activity-Monitor)
- [Telegram tracer](https://support.knx.org/hc/en-us/articles/4417351727762-Telegram-tracer)
- [Couplers & Filter Tables](https://support.knx.org/hc/en-us/articles/360007445460-Couplers-Filter-Tables)
- [Couplers & Topology Changes](https://support.knx.org/hc/en-us/articles/360007457380-Couplers-Topology-Changes)
- [Filter tables](https://support.knx.org/hc/en-us/articles/115003363245-Filter-tables)
- [Project Check](https://support.knx.org/hc/en-us/articles/115001822790-Project-Check)
- [Project check (Offline)](https://support.knx.org/hc/en-us/articles/360019116959-Project-check-Offline)
- [Individual Addresses](https://support.knx.org/hc/en-us/articles/360011844719-Individual-Addresses)
- [Group Address & Ranges](https://support.knx.org/hc/en-us/articles/115001825304-Group-Address-Ranges)
- [Datapoint Type](https://support.knx.org/hc/en-us/articles/115001133744-Datapoint-Type)

### Deutsche KNX-Communities
- [knx-blogger: Flags einfach erklärt](https://knx-blogger.de/knx-flags-einfach-erklaert/)
- [knx-blogger: Was ist auf deinem KNX-Bus los?](https://knx-blogger.de/was-ist-auf-deinem-knx-bus-los/)
- [knx-blogger: KNX-Telegramm-Interna](https://knx-blogger.de/die-knx-telegramm-interna/)
- [knx-user-forum: Unbestätigte Telegramme / Wiederholung](https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/1611435-unbest%C3%A4tigte-telegramme-telegrammwiederholung)
- [knx-user-forum: Telegrammverlust IPS](https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/2058313-telegrammverlust-in-ips-problem-zu-viele-ger%C3%A4te-gruppenadressen)
- [knx-user-forum: Buslast was sind 100%?](https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/2336-buslast-was-sind-100)
- [Voltus: KNX Flags, Sperrfunktion und Objekt-Priorität](https://www.voltus.de/blog/knx-flags-sperrfunktion-und-objekt-prioritaet/)
- [Voltimum: KNX Bussystem-Grundlagen](https://www.voltimum.de/news/knx-grundlagenwissen-teil-2-knx-bussystem)
- [smarthomebau: ETS-Tipps & FAQs](https://smarthomebau.de/knx-ets-5-tipps-tricks-faqs-demo-lite-professional/)
- [Timberwolf-Forum: erhöhte Buslast durch unbekannten Fehler](https://forum.timberwolf.io/viewtopic.php?t=3808)

### Home Assistant / openHAB / ioBroker
- [HA Community: KNX Error in logs](https://community.home-assistant.io/t/knx-error-in-logs/272809)
- [HA Community: HomeAssistant becomes unresponsive (KNX)](https://community.home-assistant.io/t/homeassistant-becomes-unresponsive-knx-interface-errors-in-selectordatagramtransport/660601)
- [HA Community: Repeated telegrams (not acknowledged)](https://community.home-assistant.io/t/knx-repeated-telegrams-not-acknowledged/544138)
- [HA-Issue #69328: KNX tunneling connection loss](https://github.com/home-assistant/core/issues/69328)
- [HA-Issue #71342: 2022.5.0 communication failed](https://github.com/home-assistant/core/issues/71342)
- [openHAB: Loops on KNX bus](https://community.openhab.org/t/loops-on-knx-bus/22185)
- [openHAB: Steinel feedback loop](https://community.openhab.org/t/knx-dpt-5-005-endless-feedback-loop-when-changing-value-steinel-presence-detector-sensitivity/58071)
- [XKNX Issue #137: Percentage parsing](https://github.com/XKNX/xknx/issues/137)

### Sonstige
- [1Home: Häufige KNX-Probleme](https://www.1home.io/docs/en/server/knx/troubleshooting-knx)
- [Helge Klein: KNX Topology Troubleshooting with ETS Tools](https://helgeklein.com/blog/knx-topology-troubleshooting-with-ets-tools/)
- [knxhub: KNX Programming Troubleshooting Guide](https://www.knxhub.com/knx-programming-troubleshooting-steps-guide/)
- [eBook24-7: Troubleshooting & Diagnostics](https://www.ebook24-7.com/en/knx-programming/troubleshooting-diagnostics/)
- [Dear Devices: KNX Link-Layer Ack analysis](https://deardevices.com/2020/01/25/knx-link-layer-ack/)

---

## 8. Offene Fragen an den User

1. **Phase A reicht?** Reichen E1-E5 als nächster Schritt, oder soll
   E13 (Findings-Aggregation-Tab) zwischengezogen werden, weil die
   neuen Findings sonst im Detail-Pane verstreut sind?
2. **Projekt-DPT-Quelle:** Für E1 brauchen wir die *Soll-DPTs* aus
   dem ETS-Projekt. Heute haben wir die in `knx_group_addresses`
   bereits, oder? (Bitte verifizieren — falls nein, ist E1
   blockiert, bis das Schema erweitert wird.)
3. **Severity-Default für Konfig-Findings:** sollen DPT-Mismatch und
   Multi-Responder per Default `warning` (gelb) sein, oder direkt
   `error` (rot) — letztere sind eher *„echt kaputt"*-Signale.
4. **Whitelist-Granularität (E14):** ein Acknowledge pro `(GA,
   finding_code)` oder pro `(GA, *)`? Letzteres ist einfacher,
   ersteres präziser.

---

## 9. Empfehlungen für nachhaltige Umsetzung

Nachfolgend die Antworten auf §8, unter der Prämisse *„Aufwand und Zeit
sind egal, es soll gut sein"*. Leitidee: jede Entscheidung wird so
gewählt, dass sie a) das Datenmodell stabil lässt, b) keine späteren
Migrationen erzwingt, c) den Detector-Pool offen für weitere Findings
hält und d) die UX einer wachsenden Findings-Liste skaliert.

### 9.1 Reihenfolge: erst Schema + UI-Aggregation, dann Detektoren

**Empfehlung:** **E13 (Findings-Aggregation-Tab) und das Finding-Schema
zuerst, vor E1-E5.**

Begründung: Wenn wir mit E1 starten, hängt das DPT-Mismatch-Finding am
GA-Detail-Pane. Jeder weitere Detector wird dann durch denselben Pfad
gezogen, und am Ende haben wir eine Folge von Ad-hoc-Anbauten ohne
gemeinsamen Vertrag. Die richtige Reihenfolge ist:

1. **Iter A** — Finding-Schema definieren (Dataclass, JSON-Shape,
   DB-Tabelle). Code, Severity, GA, Source, First-Seen, Last-Seen,
   Evidence-Payload, Schema-Version. Backend + Frontend teilen sich
   genau diesen Vertrag. **Test-zuerst:** Round-Trip-Serialization.
2. **Iter B** — Persistenz: Tabelle `knx_findings` als
   Append-only-Log mit Dedup-Schlüssel `(ga, finding_code, evidence_hash)`.
3. **Iter C** — UI-Tab „Konfigurations-Check" (E13): leere Liste,
   Filter (Severity, Code, GA, Source), Sortierung, Akknowledge-
   Action. Ein einziger bestehender Detector wird dort eingeblendet
   (z. B. der schon vorhandene Konstant-Wert-Spam), damit der Pfad
   end-to-end testbar ist.
4. **Iter D-H** — E1-E5 Detektoren. Jeder neue Detector ist eine
   Datei + ein Test, das Frontend ändert sich nicht mehr.

Vorteil dieser Reihenfolge: ab Iter D ist die Schemafrage geklärt,
Backwards-Compat-Risiken sind weg, und neue Detektoren kosten ~1 Iter
statt ~3. Sustainability schlägt Time-to-First-Feature.

### 9.2 Projekt-DPT-Quelle — verifiziert vorhanden, aber unvollständig

**Befund:** `knx_group_addresses.dpt` existiert seit Migration
`0016_knx_addresses.sql`. E1 ist also nicht blockiert.

**Empfehlung für nachhaltige Umsetzung:** zwei orthogonale Felder
sauber trennen, statt das eine `dpt`-Feld zu überladen:

```sql
-- Migration 00xx_knx_dpt_inferred.sql (Vorschlag)
ALTER TABLE knx_group_addresses ADD COLUMN dpt_inferred TEXT;
ALTER TABLE knx_group_addresses ADD COLUMN dpt_inferred_confidence REAL;
ALTER TABLE knx_group_addresses ADD COLUMN dpt_inferred_at TEXT;
```

- `dpt` bleibt das **Soll** aus dem ETS-Projekt (User-gepflegt).
- `dpt_inferred` ist das **Ist**, gefüllt vom Auto-Erkenner aus
  Sample-Werten, mit Confidence + Timestamp.
- E1 vergleicht beide, erzeugt das Finding nur, wenn Confidence über
  einem Schwellwert liegt (z. B. 0.8).
- Spätere Features wie *„Soll-DPT fehlt — willst du den erkannten
  übernehmen?"* werden möglich, ohne das Schema nochmal anzufassen.

Zusätzlich: jede Änderung an `knx_group_addresses.dpt` kommt als Eintrag
in `audit_log` rein (Tabelle existiert, Migration `0013_audit.sql`).
Damit lässt sich Monate später beantworten *„warum sind hier plötzlich
zehn DPT-Mismatch-Findings entstanden?"* → meist *„weil das ETS-Projekt
re-importiert wurde und ein DPT manuell falsch gesetzt war"*.

### 9.3 Severity — kein Einheits-Default, sondern pro Finding-Code

**Empfehlung:** Severity ist **Eigenschaft der Finding-Definition**,
nicht des Aufrufers. Jeder Finding-Code bekommt in `const.py` einen
Default, basierend auf zwei Achsen: **diagnostische Sicherheit** und
**funktionaler Impact**.

| Finding-Code | Default-Severity | Begründung |
|---|---|---|
| `DPT_MISMATCH` | **`error`** | Werte werden falsch dekodiert; nahezu nie absichtlich. |
| `MULTI_RESPONDER` | **`warning`** | Kann beabsichtigt sein (z. B. parallele Aktoren). |
| `READ_NO_RESPONSE` | **`warning`** | Empfänger könnte temporär offline sein. |
| `TOGGLE_LOOP` | **`error`** | Schleifen sind nahezu nie gewollt und kosten Bus-Zeit. |
| `VALUE_OUT_OF_RANGE` | **`error`** | Wert ausserhalb DPT-Spec ist eindeutig falsch. |
| `RECONNECT_STORM` | **`warning`** | Symptom, kein Bug — kann normal nach Spannungsausfall sein. |
| `MULTI_TIME_MASTER` | **`error`** | Doppelte Zeitquellen erzeugen Drift. |
| `SEND_CYCLE_DRIFT` | **`info`** | Trend-Hinweis, nicht akut. |
| `REPEAT_APPROXIMATION` | **`warning`** | Approximation, nicht Wahrheit — entsprechend mild. |
| `ORPHAN_GA` | **`info`** | Aufräum-Hinweis, kein Bug. |
| `STALE_GA` | **`info`** | Beobachtungs-Hinweis. |

Ergänzend, weil eine Anlage individuell ist: **User-Override pro Code**
in einer schmalen Tabelle. Damit kann jemand für seine Anlage sagen
*„MULTI_RESPONDER ist bei mir Absicht — bitte nur `info`"*.

```sql
-- Migration 00xx_knx_finding_severity_overrides.sql
CREATE TABLE IF NOT EXISTS knx_finding_severity_overrides (
    finding_code TEXT PRIMARY KEY,
    severity     TEXT NOT NULL CHECK (severity IN ('debug','info','warning','error')),
    note         TEXT,
    created_at   TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
```

Vorteil: keine 0/1-Default-Diskussion und keine UI-Knöpfe für jedes
einzelne Finding. Einmal pro Anlage einstellen, fertig. Default kommt
aus dem Code, Override aus der DB.

### 9.4 Whitelist-Granularität — `(GA, finding_code)` mit eigener Tabelle

**Empfehlung:** **`(GA, finding_code)`-Granularität, in einer neuen
Tabelle, getrennt von der bestehenden Rate-Acknowledge-Tabelle.**

Begründung: `knx_ga_acknowledgements` hat heute eine klare Semantik
*„diese GA ist überaktiv, weiß ich"* (taucht nicht mehr in der Top-
Sender-Liste auf). Wenn wir denselben Schlüssel überladen, kollidieren
die Use-Cases:
- User akkceptiert *Multi-Responder* auf 8/1/1 (zwei Aktoren parallel,
  beabsichtigt) → soll *DPT-Mismatch* auf derselben GA aber **weiterhin**
  alarmieren.
- `(GA, *)` würde beides stummschalten.

Schema:

```sql
-- Migration 00xx_knx_finding_acknowledgements.sql
CREATE TABLE IF NOT EXISTS knx_finding_acknowledgements (
    ga              TEXT NOT NULL,
    finding_code    TEXT NOT NULL,
    acknowledged_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    expires_at      TEXT,            -- NULL = sticky, sonst Auto-Ablauf
    note            TEXT,
    schema_version  INTEGER NOT NULL DEFAULT 1,  -- s. §9.5
    PRIMARY KEY (ga, finding_code)
);

CREATE INDEX IF NOT EXISTS idx_finding_acks_expires
    ON knx_finding_acknowledgements (expires_at)
    WHERE expires_at IS NOT NULL;
```

Zusätzlich:
- **Default `expires_at = acknowledged_at + 90 days`** (UI-konfigurier-
  bar). Damit verschwinden *„habe ich vor zwei Jahren mal weggeklickt"*-
  Findings nicht stumm im Hintergrund. Wer wirklich permanent
  unterdrücken will, setzt `expires_at = NULL` über einen
  Sticky-Toggle.
- **Audit-Log-Eintrag** bei jedem Ack/Un-Ack (`audit_log` existiert).
  *„Warum wird Finding X auf GA Y unterdrückt?"* ist später
  beantwortbar.
- **Bestehende `knx_ga_acknowledgements` bleibt unangetastet** —
  Rate-Acknowledge ist semantisch eine andere Achse („GA spammt
  bewusst") und behält ihren bestehenden Pfad in der Top-Sender-Liste.

### 9.5 Versionierung der Finding-Codes

**Empfehlung:** Finding-Codes sind **Vertragsoberfläche** zwischen
Detector, DB, UI und User-Acks. Die Heuristik dahinter wird sich
verändern. Damit ein Re-Tuning eines Detectors keine alten Acks
ungültig macht (oder schlimmer: stumm hält), gibt jeder Finding-Code
eine **Schema-Version**:

- Detector schreibt `code = "DPT_MISMATCH"`, `schema_version = 1`.
- Wenn der Detector Bugs in v1 hat (z. B. False-Positives wegen
  ungenauer Inferenz) und wir die Schwelle ändern, bumpen wir auf
  `schema_version = 2`.
- Beim Anzeigen filtern wir `acks` nach passender Version. Alte Acks
  laufen aus oder bleiben für v1-Findings gültig — der User
  entscheidet.

Konkret heißt das, dass die Finding-Tabelle und die Ack-Tabelle die
Spalte `schema_version` führen. Bei Detector-Tuning steigt die Zahl,
und im CHANGELOG notieren wir es explizit.

### 9.6 Vertrag der Findings — eine einzige Schema-Definition

**Empfehlung:** ein einziger Pydantic/dataclass-Vertrag für Findings,
gemeinsam mit dem Frontend. JSON-Shape wird im Backend definiert,
TypeScript-Typen werden aus diesem Schema **generiert**, nicht von
Hand geschrieben. Vorlage als Dataclass:

```python
# const.py / processing/findings.py
@dataclass(frozen=True, slots=True)
class Finding:
    code: str                    # z. B. "DPT_MISMATCH"
    schema_version: int          # 1, 2, ...
    severity: KnxSeverity        # green/yellow/orange/red
    ga: str | None               # None bei GA-übergreifenden Findings
    source: str | None           # Phys-Adresse, optional
    title: str                   # für UI-Header (durch translations/)
    description: str             # ausführlich, durch translations/
    evidence: dict[str, Any]     # was hat den Detector ausgelöst?
    first_seen: datetime
    last_seen: datetime
    occurrence_count: int        # wie oft seit first_seen
    detector_version: str        # z. B. "DPT_MISMATCH/v1"
```

`evidence` ist absichtlich frei strukturiert pro Code — z. B. für
`DPT_MISMATCH`: `{"project_dpt": "9.001", "inferred_dpt": "1.001",
"confidence": 0.94, "samples": 52}`. Das macht den Finding für den User
nachvollziehbar (UI rendert die Evidence als kleine Liste) und für uns
debugbar.

### 9.7 Internationalisierung von Tag eins

**Empfehlung:** keine deutschen Strings im Detector-Code. Detektoren
liefern den **Code** und die **Evidence**, nie fertigen Text. UI lädt
die lesbaren Strings aus `translations/de.json` etc. Das passt zur
bestehenden Konvention (CLAUDE.md §Code-Stil Backend) und schützt
Übersetzungsarbeit, wenn später mehr Sprachen dazukommen.

### 9.8 Telemetrie und Reproduzierbarkeit

**Empfehlung:** zwei Dinge mitnehmen, weil sie billig und nachhaltig
sind:

- **Prometheus-Counter pro Finding-Code** (`/metrics` ist seit Iter 69
  da): `messagehub_knx_finding_total{code="DPT_MISMATCH",
  severity="error"}`. Erlaubt Alerting auf *„heute kam ein neuer
  Finding-Typ dazu"*.
- **Snapshot-Fixtures** für Detector-Tests: ein realer Group-Monitor-
  Auszug (anonymisiert) als CSV/SQL in `tests/fixtures/` pro
  Anti-Pattern. Jeder Detector-Test lädt das Snapshot und prüft, ob
  genau die erwarteten Findings entstehen. Bei Heuristik-Tuning sehen
  wir Regressionen sofort.

### 9.9 Konkrete Iterations-Reihenfolge (TDD, ≤60 Min/Iter)

Die abstrakten 19 Schritte aus dem ersten Entwurf reichen nicht — bei
genauer Betrachtung sprengen mehrere von ihnen die 60-Min-Grenze aus
CLAUDE.md, sobald Tabellenmigration, Repository-Pfad, API-Endpoint,
Frontend-Wiring und Übersetzung in einem Eintrag zusammengeworfen
werden. Die folgende Aufteilung in **31 kleinere Iterationen** sortiert
nach Abhängigkeit und nach „liefert in jedem Schritt etwas
Lauffähiges". Pro Iter: das Test-zuerst-Artefakt nach Konvention
`test_<verb>_<condition>_<expected>`, die berührten Dateien und das
Exit-Kriterium.

#### Phase 0 — Fundament (Iter 1-5)

Nichts davon liefert sichtbare User-Funktion, aber alle nachfolgenden
Iter bauen darauf auf. Ohne Phase 0 gibt es kein gemeinsames
Finding-Vokabular.

| Iter | Inhalt | Test-zuerst | Files | Exit |
|---|---|---|---|---|
| **1** | `Finding`-Dataclass + `FindingSeverity` Enum + `EvidencePayload` Typ | `test_finding_dataclass_round_trip_serializes_to_json` | `processing/findings.py` | Dataclass instantiierbar, JSON-Roundtrip stabil |
| **2** | Tabelle `knx_findings` (Append-only, Dedup-Hash) + Repo-Insert/List | `test_findings_repo_insert_dedups_by_evidence_hash` | SQL `0019_knx_findings.sql`, `storage/findings_repo.py` | Insert + List + Dedup grün |
| **3** | Tabelle `knx_finding_acknowledgements` mit `(ga, finding_code)`-PK + Auto-Expire | `test_finding_ack_filters_when_expires_at_in_past` | SQL `0020_knx_finding_acks.sql`, Repo-Erw. | Ack/Un-Ack mit Audit-Log-Eintrag |
| **4** | Tabelle `knx_finding_severity_overrides` + Resolver-Funktion | `test_severity_override_takes_precedence_over_default` | SQL `0021_knx_finding_severity_overrides.sql`, Repo | Resolver liefert Default → Override → Ack-Suppression |
| **5** | Bestand: `HealthFinding` + bestehende Anti-Pattern-Findings auf neuen Vertrag heben (Refactor) | bestehende Tests bleiben grün; `test_health_finding_emits_code_health_busload` | `processing/knx_stats.py:566+`, `_run_detectors` | Alle Bestandsdetektoren liefern `Finding` mit `code` + `evidence` |

#### Phase 1 — UI-Backbone (Iter 6-10)

Bevor neue Detektoren dazukommen, braucht es den Konfigurations-Check-
Tab als Anzeigefläche. Sonst werden die Findings ad-hoc im
GA-Detail-Pane verteilt und müssen später nochmal umgezogen werden.

| Iter | Inhalt | Test-zuerst | Files | Exit |
|---|---|---|---|---|
| **6** | API-Endpoint `GET /findings` (Filter: severity, code, ga, source; Pagination) | `test_findings_endpoint_filters_by_severity_and_paginates` | `api/findings.py` | Endpoint liefert Liste + Total |
| **7** | API-Endpoint `POST /findings/ack` + `DELETE /findings/ack/{ga}/{code}` | `test_ack_endpoint_persists_and_creates_audit_entry` | `api/findings.py` | Ack-Roundtrip funktioniert via API |
| **8** | API-Endpoint `GET /findings/severity-overrides` + `PUT /findings/severity-overrides/{code}` | `test_severity_override_endpoint_creates_and_updates` | `api/findings.py` | Override-CRUD via API |
| **9** | Frontend: leere Komponente `findings-view.ts` als 3. Sub-Tab neben Live-Status + KNX-Bus-Analyse | `frontend/tests/findings-view.test.ts` (Render leer) | `frontend/src/components/findings-view.ts`, `stats-view.ts` | Tab erscheint, leere Tabelle wird gerendert |
| **10** | Frontend-Wiring: bestehende Health-/Anti-Pattern-Findings im neuen Tab anzeigen, mit Severity-Pill + Evidence-Detail-Pane + Ack-Action | `findings-view-actions.test.ts` (Ack-Flow) | `findings-view.ts`, `api-client.ts` | End-to-End: Konstant-Wert-Spam erscheint im neuen Tab, Ack funktioniert |

**Meilenstein nach Iter 10:** der Konfigurations-Check-Tab ist
funktional, mit den heute schon erkennbaren Mustern. Alle weiteren
Iter sind reine Detector-Erweiterungen — keine UI-Änderungen mehr nötig.

#### Phase 2 — DPT-Validierungs-Detektoren (Iter 11-14)

Höchste diagnostische Sicherheit, höchster Impact — deshalb zuerst.

| Iter | Inhalt | Test-zuerst | Files | Exit |
|---|---|---|---|---|
| **11** | Migration `knx_group_addresses.dpt_inferred` + `dpt_inferred_confidence` + `dpt_inferred_at` | `test_dpt_inferred_persists_with_confidence` | SQL `0022_knx_dpt_inferred.sql`, Repo-Update | Auto-Erkenner persistiert sein Ist-Ergebnis |
| **12** | Detector `DPT_MISMATCH` (severity=error) — vergleicht `dpt` (Soll) mit `dpt_inferred` (Ist) ab Confidence-Schwelle | `test_dpt_mismatch_emits_finding_when_inferred_differs_above_threshold` | `processing/findings/dpt_mismatch.py`, Detector-Registry | Finding mit Evidence `{project_dpt, inferred_dpt, confidence, samples}` |
| **13** | Wertbereich-Tabelle in `const.py` (DPT 5.001 0-100, 9.005 ≥0, 9.007 0-100, ...) + Detector `VALUE_OUT_OF_RANGE` | `test_value_out_of_range_emits_finding_for_dpt_5001_above_100` | `const.py`, `processing/findings/value_range.py` | Finding mit Evidence `{value, dpt, range_min, range_max}` |
| **14** | i18n-Strings für Phase-2-Findings + Hilfe-Hyperlinks pro Code | `test_finding_translation_resolves_for_dpt_mismatch_de_and_en` | `translations/de.json`, `en.json`, weitere | UI rendert alle Phase-2-Findings in beiden Sprachen |

#### Phase 3 — Konfigurations-Detektoren (Iter 15-19)

Die Klassiker aus den Foren. Severity je nach Eindeutigkeit aus §9.3.

| Iter | Inhalt | Test-zuerst | Files | Exit |
|---|---|---|---|---|
| **15** | Detector `MULTI_RESPONDER` (severity=warning) — pro Read mehrere unterschiedliche `knx_source`-Responses | `test_multi_responder_emits_finding_when_two_sources_respond_to_one_read` | `processing/findings/multi_responder.py` | Evidence enthält `{responding_sources: [...]}` |
| **16** | Detector `READ_NO_RESPONSE` (severity=warning) — Read ohne Response binnen 3 s | `test_read_no_response_emits_finding_after_timeout_window` | `processing/findings/read_no_response.py` | Evidence `{read_at, expected_until}` |
| **17** | Detector `TOGGLE_LOOP` (severity=error) — DPT 1.001 mit `0,1,0,1,...` und Δt < 2 s ≥ 4× | `test_toggle_loop_emits_finding_for_alternating_pattern` | `processing/findings/toggle_loop.py` | Evidence `{period_ms, cycles}` |
| **18** | Detector `MULTI_TIME_MASTER` (severity=error) — ≥2 `knx_source` schreiben auf DPT 10.001/11.001/19.001 | `test_multi_time_master_emits_finding_for_two_sources_on_clock_dpt` | `processing/findings/multi_time_master.py` | Evidence `{sources, clock_dpt}` |
| **19** | i18n-Strings für Phase-3-Findings | `test_finding_translation_resolves_all_phase3_codes` | `translations/*.json` | UI komplett in DE/EN |

#### Phase 4 — Verhaltens-/Trend-Detektoren (Iter 20-23)

Brauchen längere Datenbasis (≥7 Tage Logs). Deshalb nach den Direkt-
Detektoren — Phase-3-Wert ist sofort sichtbar, Phase-4-Wert braucht
Geschichte.

| Iter | Inhalt | Test-zuerst | Files | Exit |
|---|---|---|---|---|
| **20** | Detector `RECONNECT_STORM` (severity=warning) — Spike auf `knx_source` ≥10× Mittel im 30-s-Fenster nach `silence_devices`-Lücke ≥60 s | `test_reconnect_storm_emits_finding_after_silence_followed_by_burst` | `processing/findings/reconnect_storm.py` | Evidence `{silence_until, burst_count, normal_avg}` |
| **21** | Detector `SEND_CYCLE_DRIFT` (severity=info) — Median(Δt) heute vs. 7 Tage davor ≤50 % | `test_send_cycle_drift_emits_finding_when_median_dt_halved` | `processing/findings/send_cycle_drift.py` | Nutzt bestehende Trend-Vergleich-Infra (WR-I) |
| **22** | Detector `REPEAT_APPROXIMATION` (severity=warning) — identisches Telegramm Δt < 100 ms auf gleicher GA | `test_repeat_approximation_counts_doubles_within_100ms_window` | `processing/findings/repeat_approximation.py` | Evidence `{repeats_per_day}` |
| **23** | i18n-Strings für Phase-4-Findings | `test_finding_translation_resolves_all_phase4_codes` | `translations/*.json` | UI komplett |

#### Phase 5 — Projekt-Integration (Iter 24-26)

Braucht `knx_group_addresses` als Soll-Liste. Niedrigster Severity-
Level, deshalb gegen Ende.

| Iter | Inhalt | Test-zuerst | Files | Exit |
|---|---|---|---|---|
| **24** | Detector `ORPHAN_GA` (severity=info) — Whitelist-GA mit `count(messages) = 0` im Auswertezeitraum | `test_orphan_ga_emits_finding_for_silent_whitelist_entry` | `processing/findings/orphan_ga.py` | Evidence `{period_from, period_to}` |
| **25** | Detector `STALE_GA` (severity=info) — GA war aktiv, ist seit X Tagen tot | `test_stale_ga_emits_finding_when_last_seen_older_than_threshold` | `processing/findings/stale_ga.py` | Evidence `{last_seen, days_silent}` |
| **26** | i18n + UI-Polish (gemeinsamer Filter „nur Projekt-Befunde") | `test_findings_filter_excludes_runtime_only_findings` | `translations/*.json`, `findings-view.ts` | Filter-Toggle wirkt |

#### Phase 6 — Polish + Telemetrie (Iter 27-29)

Zwei Mini-Iter, die das System langfristig wartbar halten.

| Iter | Inhalt | Test-zuerst | Files | Exit |
|---|---|---|---|---|
| **27** | Severity-Override-UI — Frontend-Form für `knx_finding_severity_overrides` | `severity-override-form.test.ts` (CRUD-Flow) | `findings-view.ts` Sub-View | Override per Klick einstellbar |
| **28** | Prometheus-Counter `messagehub_knx_finding_total{code,severity}` | `test_prometheus_metric_increments_on_finding_emit` | `processing/prometheus.py` | Metrik unter `/metrics` sichtbar |
| **29** | Markdown-Export der Findings (E15) — Copy-Paste-Vorlage für ETS-Notiz | `test_findings_markdown_export_renders_table_with_evidence` | `api/findings.py` | Endpoint liefert MD, UI-Button kopiert |

#### Phase 7 — Snapshot-Konsolidierung + komplexer Letzter (Iter 30-31)

| Iter | Inhalt | Test-zuerst | Files | Exit |
|---|---|---|---|---|
| **30** | Detector-Snapshot-Fixtures konsolidieren — pro Detector ein anonymisiertes SQL-Snapshot in `tests/fixtures/knx_findings/` + Doku | `test_snapshot_fixture_dpt_mismatch_yields_expected_finding_set` | `tests/fixtures/knx_findings/*.sql`, `tests/test_finding_snapshots.py` | Heuristik-Regressionen werden durch CI sichtbar |
| **31** | Detector `SEND_TO_NOWHERE` (severity=info, komplex) — Korrelation Write → Status-Wechsel; ohne Status-Wechsel innerhalb erwartbarer Zeit Finding | `test_send_to_nowhere_emits_finding_when_no_status_follows_write` | `processing/findings/send_to_nowhere.py` | Evidence `{write_at, status_window_ms, status_received}` |

#### Reihenfolge-Logik kompakt

```
Phase 0 (Iter 1–5)   ▌ Fundament — kein User-sichtbarer Effekt, aber Pflicht
Phase 1 (Iter 6–10)  ▌ UI-Backbone — neuer Tab funktional mit Bestandsdetektoren
Phase 2 (Iter 11–14) ▌ DPT-Validierung — höchster Impact, höchste Sicherheit
Phase 3 (Iter 15–19) ▌ Konfigurations-Klassiker — die Foren-Top-3
Phase 4 (Iter 20–23) ▌ Trend-Detektoren — brauchen Datenbasis
Phase 5 (Iter 24–26) ▌ Projekt-Integration — Whitelist-Vergleich
Phase 6 (Iter 27–29) ▌ Override-UI, Telemetrie, Export
Phase 7 (Iter 30–31) ▌ Snapshot-Konsolidierung + komplexester Detector
```

#### Release-Sicht

Sinnvoll: **Releases nach Phase-Ende**, nicht nach jeder Iter. Damit
sind Versionsbumps inhaltlich selbsterklärend.

| Release | Inhalt | manifest.json |
|---|---|---|
| 0.19.0 | Phase 0 + 1 (Iter 1-10) — Konfigurations-Check-Tab live, mit Bestandsdetektoren | `version: 0.19.0` |
| 0.20.0 | Phase 2 + 3 (Iter 11-19) — DPT-Validierung + Foren-Top-3 | `version: 0.20.0` |
| 0.21.0 | Phase 4 + 5 (Iter 20-26) — Trend + Projekt-Integration | `version: 0.21.0` |
| 0.22.0 | Phase 6 + 7 (Iter 27-31) — Override-UI, Telemetrie, Snapshot, SEND_TO_NOWHERE | `version: 0.22.0` |

Jeder Release entsteht durch `manifest.json:version`-Bump, `CHANGELOG.md`-
Eintrag, Tag (`git tag -a vX.Y.Z`), Push. Der Release-Workflow
(`release.yml`) übernimmt den Rest, wie heute schon.

#### Nicht in der Liste, weil bewusst out-of-scope

- **F4 echte Repeat/NACK/BUSY-Statistik** — bleibt blocked (BL-D), bis
  xknx Layer-2-Frames durchreicht oder ein Sniffer-Side-Channel kommt.
- **F9 Hop-Counter** — gleicher Grund.
- **F10 Adresskonflikt** — braucht Programmiermodus-Frames.

Diese sind in §3.1 erwähnt, aber nicht in den 31 Iter, weil das
Datenmaterial fehlt. Sobald xknx das ergänzt, kommen sie als Phase 8
nach.

### 9.10 Konsequenzen für das bestehende System

Bestehender Code muss sich anpassen, aber nicht umkrempeln:

- `processing/knx_stats.py:_run_detectors` liefert heute eine `list[Finding]`
  mit `dict`-ähnlicher Struktur — der ist nahe genug am neuen
  Vertrag, dass die Migration ein Refactor von ~50 Zeilen ist.
- `_build_health_findings` produziert `HealthFinding` — das fügen wir
  als Sub-Typ unter denselben Vertrag, mit `code = "HEALTH_*"`.
- Frontend `stats-knx-view.ts` rendert Findings heute pro GA — wir
  bauen den neuen Tab daneben, der bestehende Detail-Pane bleibt.

Damit ist die Erweiterung **additiv**, nicht **disruptiv** — was
genau dem CLAUDE.md-Prinzip *„Don't add features, refactor, or
introduce abstractions beyond what the task requires"* entspricht,
ohne zu kurz zu denken: das Finding-Schema ist nicht spekulativ,
sondern wird ab Iter A von jedem nachfolgenden Detector benötigt.

---

**Ende der Recherche.**
