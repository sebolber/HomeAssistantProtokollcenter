// Iter R6: Pure Render-Funktionen fuer Recommendation-Pills.
//
// Vorher waren das 5 private Methoden in stats-knx-view.ts ohne
// State-Bezug — als reine Funktionen sind sie wiederverwendbar
// (Recommendation-Card, Drawer, kuenftige Recommendation-Tabellen)
// und einzeln testbar (kein Lit-Render-Cycle noetig).

import { html, type TemplateResult, nothing } from "lit";
import type {
  KnxRecommendationConfidence,
  KnxRecommendationGaDto,
  KnxRecommendationMode,
  KnxRecommendationSeverity,
  KnxRecommendationSource,
} from "../types/knx-recommend.js";


const MODE_LABELS: Record<KnxRecommendationMode, string> = {
  cyclic: "zyklisch",
  on_change: "bei Änderung",
  hybrid: "hybrid",
  silent: "stumm",
  insufficient: "zu wenig Daten",
};

const MODE_VARIANTS: Record<KnxRecommendationMode, string> = {
  cyclic: "mh-pill--info",
  on_change: "mh-pill--info",
  hybrid: "mh-pill--caution",
  silent: "mh-pill--neutral",
  insufficient: "mh-pill--neutral",
};

export function renderRecommendationModePill(
  mode: KnxRecommendationMode,
): TemplateResult {
  const cls = `mh-pill ${MODE_VARIANTS[mode]}`;
  return html`<span class=${cls}>${MODE_LABELS[mode]}</span>`;
}


const CONFIDENCE_LABELS: Record<KnxRecommendationConfidence, string> = {
  high: "hohe Konfidenz",
  medium: "mittlere Konfidenz",
  low: "niedrige Konfidenz",
};

const CONFIDENCE_VARIANTS: Record<KnxRecommendationConfidence, string> = {
  high: "mh-pill--neutral",
  medium: "mh-pill--neutral",
  low: "mh-pill--caution",
};

export function renderRecommendationConfidencePill(
  confidence: KnxRecommendationConfidence,
): TemplateResult {
  const cls = `mh-pill ${CONFIDENCE_VARIANTS[confidence]}`;
  return html`<span class=${cls}>${CONFIDENCE_LABELS[confidence]}</span>`;
}


// Iter UX-6: Quelle-Pill in der "empfohlen"-Spalte. User sieht auf
// einen Blick, ob die Empfehlung aus DPT-Standard, Modell-Override
// oder LLM stammt.
const SOURCE_LABELS: Record<KnxRecommendationSource, string> = {
  dpt_standard: "DPT",
  device_model: "Modell",
  llm: "KI",
};

const SOURCE_TITLES: Record<KnxRecommendationSource, string> = {
  dpt_standard: "Quelle: DPT-Standard-Tabelle (Layer 1)",
  device_model: "Quelle: Modell-Override (Layer 2)",
  llm: "Quelle: LLM-Vorschlag (Layer 4) — bitte manuell pruefen",
};

const SOURCE_VARIANTS: Record<KnxRecommendationSource, string> = {
  dpt_standard: "mh-pill--neutral",
  device_model: "mh-pill--info",
  llm: "mh-pill--caution",
};

export function renderRecommendationSourcePill(
  source: KnxRecommendationSource | null | undefined,
): TemplateResult {
  if (source === null || source === undefined) return html``;
  const cls = `mh-pill ${SOURCE_VARIANTS[source]} recommendation-source-pill`;
  return html`<span class=${cls} title=${SOURCE_TITLES[source]}
    >${SOURCE_LABELS[source]}</span
  >`;
}


const SEVERITY_LABELS: Record<KnxRecommendationSeverity, string> = {
  ok: "ok",
  info: "info",
  warn: "abweichend",
  deviation: "Abweichung",
};

const SEVERITY_VARIANTS: Record<KnxRecommendationSeverity, string> = {
  ok: "mh-pill--success",
  info: "mh-pill--neutral",
  warn: "mh-pill--caution",
  deviation: "mh-pill--error",
};

export function renderRecommendationSeverityPill(
  severity: KnxRecommendationSeverity,
): TemplateResult {
  const cls = `mh-pill ${SEVERITY_VARIANTS[severity]}`;
  return html`<span class=${cls}>${SEVERITY_LABELS[severity]}</span>`;
}


// Sendezyklus-Anzeige: liest mode + recommended_cycle_minutes, formt
// den UX-5-Text ("X Min", "X-Y Min", "nur bei Aenderung", "Heartbeat").
export function renderRecommendationCycle(
  ga: KnxRecommendationGaDto,
): TemplateResult {
  const cycle = ga.recommended_cycle_minutes;
  const mode = ga.recommended_mode;
  if (mode === null) return html`<span class="muted">—</span>`;
  if (mode === "on_change") {
    return html`<span class="muted small">
      nur bei Aenderung — kein Heartbeat
    </span>`;
  }
  if (cycle === null) {
    // cyclic / hybrid ohne Cycle-Korridor — sollte nicht passieren,
    // aber defensiv: zeige nur den Modus-Hinweis.
    return mode === "cyclic"
      ? html`<span class="muted small">zyklisch (Intervall offen)</span>`
      : html`<span class="muted small">
          bei Aenderung + Heartbeat (Intervall offen)
        </span>`;
  }
  const [min, max] = cycle;
  const formatted = min === max ? `${min} Min` : `${min}–${max} Min`;
  if (mode === "cyclic") {
    return html`<strong>${formatted}</strong>
      <span class="muted small">zyklisch</span>`;
  }
  // hybrid
  return html`<strong>${formatted}</strong>
    <span class="muted small">Heartbeat (zusaetzlich zu Aenderung)</span>`;
}


// Re-Export der "nothing"-Sentinel, damit Callers die das Modul-API
// als kompletten Pill-Helper nutzen, nicht doppelt aus lit
// importieren muessen.
export { nothing };
