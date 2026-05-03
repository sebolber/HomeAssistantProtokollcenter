// Iter 14+ (knx-findings): i18n-Helper fuer Detector-Codes.
//
// Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md §9.7:
// Detektoren liefern Code + Evidence, UI rendert lesbare Strings.
//
// Iter 14: Phase 2 (DPT_MISMATCH, VALUE_OUT_OF_RANGE) in DE/EN.
// Spaetere Iter (19, 23, 26) ergaenzen weitere Codes + Sprachen — die
// Tabelle in `STRINGS` ist die zentrale Anlaufstelle. Andere Sprachen
// fallen automatisch auf EN zurueck.
//
// Synchronisiert mit `custom_components/messagehub/translations/*.json`,
// wo dieselben Strings unter `findings.codes.{CODE}.{title|description|
// help_url}` liegen — der HA-Backend-Layer (i18n fuer Issues) liest sie
// von dort, das Frontend bringt sie als TypeScript-Const mit (kein
// Runtime-Fetch noetig, weil das Panel als ein Bundle ausgeliefert wird).

type Lang = "de" | "en";
type FallbackLang = string;

interface CodeStrings {
  title: string;
  description: string;
  help_url: string;
}

const STRINGS: Record<Lang, Record<string, CodeStrings>> = {
  de: {
    DPT_MISMATCH: {
      title: "Erkannter Datentyp widerspricht Projekt-DPT",
      description:
        "Auto-Erkenner liefert {inferred_dpt} aus {samples} Stichproben " +
        "(Confidence {confidence}). Projekt-DPT ist {project_dpt}. " +
        "Werte werden vermutlich falsch dekodiert — bitte ETS-Projekt pruefen.",
      help_url:
        "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types",
    },
    VALUE_OUT_OF_RANGE: {
      title: "Wert ausserhalb des erlaubten DPT-Bereichs",
      description:
        "Wert {value} liegt ausserhalb des fuer DPT {dpt} erlaubten " +
        "Bereichs [{range_min}, {range_max}]. Wahrscheinlich falscher " +
        "DPT oder fehlerhafte Sensorik.",
      help_url:
        "https://support.knx.org/hc/en-us/articles/115001133744-Datapoint-Type",
    },
    MULTI_RESPONDER: {
      title: "Mehrere Aktoren antworten auf gleicher GA",
      description:
        "{count} Quellen antworten innerhalb {window_ms} ms: " +
        "{responding_sources}. Wahrscheinlich mehrere Aktoren mit gesetztem " +
        "L-Flag — kann beabsichtigt sein bei parallelen Aktoren, sonst " +
        "ETS-Topologie pruefen.",
      help_url: "https://knx-blogger.de/knx-flags-einfach-erklaert/",
    },
    READ_NO_RESPONSE: {
      title: "GroupValueRead bleibt ohne Antwort",
      description:
        "Read um {read_at} hat innerhalb von {timeout_sec} s keine Antwort " +
        "erhalten. Empfaenger fehlt, ist offline oder das L-Flag ist nicht " +
        "gesetzt.",
      help_url:
        "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics",
    },
    TOGGLE_LOOP: {
      title: "Schaltschleife auf DPT 1.001",
      description:
        "GA wechselt zyklisch zwischen 0 und 1 (Periode {period_ms} ms, " +
        "{cycles} Wertwechsel). Vermutung: gleiche GA wird sendend und " +
        "hoerend gleichzeitig genutzt.",
      help_url: "https://community.openhab.org/t/loops-on-knx-bus/22185",
    },
    MULTI_TIME_MASTER: {
      title: "Mehrere Zeit-Master auf gleicher GA",
      description:
        "{sources} schreiben gemeinsam auf eine GA mit DPT {clock_dpt}. " +
        "Doppelte Zeitquellen erzeugen Drift — nur ein Geraet als " +
        "Time-Master konfigurieren.",
      help_url:
        "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types",
    },
    RECONNECT_STORM: {
      title: "Reconnect-Sturm nach Bus-Stille",
      description:
        "Nach einer Stille bis {silence_until} feuerte die Quelle einen " +
        "Burst: {burst_count} Telegramme im 30-s-Fenster (Schnitt sonst " +
        "{normal_avg}, Faktor {factor}). Typisch fuer Reconnect-Floods " +
        "nach Bus-Spannungsausfall.",
      help_url: "https://github.com/home-assistant/core/issues/69328",
    },
    SEND_CYCLE_DRIFT: {
      title: "Sendezyklus deutlich verkuerzt",
      description:
        "Median-Δt der letzten Periode {recent_median_dt} s vs. " +
        "Vergleichszeitraum {baseline_median_dt} s — Verhaeltnis {ratio}. " +
        "Sendezyklus halbiert; vermutlich Hysterese verstellt oder " +
        "Sensorik defekt.",
      help_url: "https://knx-blogger.de/was-ist-auf-deinem-knx-bus-los/",
    },
    REPEAT_APPROXIMATION: {
      title: "Vermutete Telegrammwiederholungen",
      description:
        "{total_repeats} identische Folge-Telegramme mit Δt < 100 ms ueber " +
        "{period_days} Tage (~ {repeats_per_day}/Tag). Approximation des " +
        "Repeat-Bits — bestaetigen via xknx-Tracer (BL-D), wenn verfuegbar.",
      help_url:
        "https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/1611435-unbest%C3%A4tigte-telegramme-telegrammwiederholung",
    },
  },
  en: {
    DPT_MISMATCH: {
      title: "Inferred datapoint type contradicts project DPT",
      description:
        "Auto-detector inferred {inferred_dpt} from {samples} samples " +
        "(confidence {confidence}). Project DPT is {project_dpt}. " +
        "Values are likely decoded incorrectly — please verify the ETS project.",
      help_url:
        "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types",
    },
    VALUE_OUT_OF_RANGE: {
      title: "Value outside allowed DPT range",
      description:
        "Value {value} is outside the allowed range [{range_min}, {range_max}] " +
        "for DPT {dpt}. Likely wrong DPT or faulty sensor.",
      help_url:
        "https://support.knx.org/hc/en-us/articles/115001133744-Datapoint-Type",
    },
    MULTI_RESPONDER: {
      title: "Multiple actuators respond on same group address",
      description:
        "{count} sources answered within {window_ms} ms: {responding_sources}. " +
        "Likely multiple actuators with the L-flag set — may be intentional " +
        "for parallel actuators, otherwise verify the ETS topology.",
      help_url: "https://knx-blogger.de/knx-flags-einfach-erklaert/",
    },
    READ_NO_RESPONSE: {
      title: "GroupValueRead without response",
      description:
        "Read at {read_at} received no response within {timeout_sec} s. " +
        "Receiver missing, offline, or L-flag not set.",
      help_url:
        "https://support.knx.org/hc/en-us/articles/360019068120-Groups-Diagnostics",
    },
    TOGGLE_LOOP: {
      title: "Switching loop on DPT 1.001",
      description:
        "Group address alternates between 0 and 1 (period {period_ms} ms, " +
        "{cycles} value changes). Likely the same GA is used both sending " +
        "and listening.",
      help_url: "https://community.openhab.org/t/loops-on-knx-bus/22185",
    },
    MULTI_TIME_MASTER: {
      title: "Multiple time masters on same group address",
      description:
        "{sources} both write to a GA with DPT {clock_dpt}. Duplicate " +
        "time sources cause drift — configure only one device as time master.",
      help_url:
        "https://support.knx.org/hc/en-us/articles/115001366044-Group-Addresses-Datapoint-Types",
    },
    RECONNECT_STORM: {
      title: "Reconnect storm after bus silence",
      description:
        "After silence until {silence_until} the source produced a burst: " +
        "{burst_count} telegrams in the 30s window (normal {normal_avg}, " +
        "factor {factor}). Typical for reconnect floods after bus power loss.",
      help_url: "https://github.com/home-assistant/core/issues/69328",
    },
    SEND_CYCLE_DRIFT: {
      title: "Send cycle significantly shortened",
      description:
        "Recent median Δt {recent_median_dt} s vs. baseline " +
        "{baseline_median_dt} s — ratio {ratio}. Send cycle halved; " +
        "likely a changed hysteresis or faulty sensor.",
      help_url: "https://knx-blogger.de/was-ist-auf-deinem-knx-bus-los/",
    },
    REPEAT_APPROXIMATION: {
      title: "Suspected telegram repeats",
      description:
        "{total_repeats} identical follow-up telegrams with Δt < 100 ms " +
        "across {period_days} days (~ {repeats_per_day}/day). Approximation " +
        "of the repeat bit — confirm via xknx tracer (BL-D) when available.",
      help_url:
        "https://knx-user-forum.de/forum/%C3%B6ffentlicher-bereich/knx-eib-forum/1611435-unbest%C3%A4tigte-telegramme-telegrammwiederholung",
    },
  },
};

function _resolveLang(lang: FallbackLang): Lang {
  // Iter 14: nur DE/EN explizit gepflegt. Andere Sprachen fallen auf
  // EN zurueck — HA setzt typischerweise einen 2-stelligen Code.
  if (lang.startsWith("de")) return "de";
  return "en";
}

export function getFindingTitle(code: string, lang: FallbackLang): string {
  const entry = STRINGS[_resolveLang(lang)][code];
  return entry?.title ?? "";
}

export function getFindingHelpUrl(code: string): string {
  // Iter 14: Help-URLs sind aktuell sprach-unabhaengig (KNX-Support-Doku
  // ist en-only). Spaeter ggf. pro Sprache differenzieren.
  return STRINGS.en[code]?.help_url ?? "";
}

export function getFindingDescription(
  code: string,
  lang: FallbackLang,
  evidence: Record<string, unknown>
): string {
  const entry = STRINGS[_resolveLang(lang)][code];
  if (entry === undefined) return "";
  return _interpolate(entry.description, evidence);
}

function _interpolate(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (key in values) return String(values[key]);
    return match;
  });
}
