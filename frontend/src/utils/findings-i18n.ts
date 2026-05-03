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
