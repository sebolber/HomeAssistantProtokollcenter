// Iter 14+ (knx-findings): i18n-Helper fuer Detector-Codes.
//
// Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md §9.7:
// Detektoren liefern Code + Evidence, UI rendert lesbare Strings.
//
// Iter E1: Single Source of Truth ist
// ``custom_components/messagehub/translations/*.json``. Der Pre-Build-
// Schritt ``npm run prebuild`` ruft ``scripts/generate-findings-i18n.mjs``
// und schreibt die Strings nach ``findings-i18n.generated.ts``. Hier
// importieren wir das Generated-Modul und exposen die public Helper.
// Frontend hat damit alle 6 Sprachen (de/en/es/fr/it/nl) und keine
// Drift mehr zwischen Backend- und Frontend-Tabellen.

import {
  STRINGS as GENERATED_STRINGS,
  SUPPORTED_LANGS,
  type Lang as GeneratedLang,
} from "./findings-i18n.generated.js";

type Lang = GeneratedLang;
type FallbackLang = string;

interface CodeStrings {
  title: string;
  description: string;
  help_url: string;
}

// Iter E1: STRINGS kommt jetzt aus dem Generator-Modul.
const STRINGS: Record<Lang, Record<string, CodeStrings>> = GENERATED_STRINGS as Record<Lang, Record<string, CodeStrings>>;

// Iter 26: Codes mit Projekt-Bezug (Filter "Nur Projekt-Befunde").
// DPT_MISMATCH braucht das Soll-DPT aus dem Projekt; ORPHAN_GA und
// STALE_GA listen Whitelist-Eintraege. Andere Findings sind reine
// Laufzeit-Befunde aus dem Telegrammverkehr.
export const PROJECT_RELATED_CODES: ReadonlySet<string> = new Set([
  "DPT_MISMATCH",
  "ORPHAN_GA",
  "STALE_GA",
]);

export function isProjectRelated(code: string): boolean {
  return PROJECT_RELATED_CODES.has(code);
}

function _resolveLang(lang: FallbackLang): Lang {
  // Iter E1: alle SUPPORTED_LANGS aus dem Generator pruefen — der User
  // bekommt seine HA-Sprache, wenn ein Backend-Translation-File
  // existiert; sonst Fallback EN.
  const code = (lang || "").toLowerCase();
  for (const supported of SUPPORTED_LANGS) {
    if (code === supported || code.startsWith(supported + "-")) {
      return supported;
    }
  }
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
