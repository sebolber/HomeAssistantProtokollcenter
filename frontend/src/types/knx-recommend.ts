// Iter R5: KNX-Recommendation-DTOs aus api-client.ts ausgegliedert.
//
// Schema-Pinning: jede Aenderung muss synchron im Python-DTO
// (``processing/knx_recommend_service.py:device_recommendation_to_dict``)
// gespiegelt werden. Schema-Contract-Test in Iter L1.5.
//
// Layer 1-4 vertikaler Slice: Mode-Klassifikation, Geraete-Profile,
// LLM-Settings/Test.

export type KnxRecommendationMode =
  | "cyclic"
  | "on_change"
  | "hybrid"
  | "silent"
  | "insufficient";

export type KnxRecommendationConfidence = "high" | "medium" | "low";

export type KnxRecommendationSeverity = "ok" | "info" | "warn" | "deviation";

export interface KnxRecommendationObservedDto {
  mode: KnxRecommendationMode;
  confidence: KnxRecommendationConfidence;
  sample_count: number;
  value_changes: number;
  median_interval_s: number | null;
  median_interval_minutes: number | null;
  stdev_interval_s: number | null;
}

export type KnxRecommendationSource =
  | "dpt_standard"
  | "device_model"
  | "llm";

export interface KnxRecommendationGaDto {
  ga: string;
  label: string | null;
  dpt: string | null;
  observed: KnxRecommendationObservedDto;
  recommended_mode: KnxRecommendationMode | null;
  recommended_cycle_minutes: [number, number] | null;
  recommended_hysteresis: string | null;
  severity: KnxRecommendationSeverity;
  rationale: string | null;
  /** Iter UX-6: Quelle der Empfehlung (DPT-Default / Modell-Override /
   * LLM-Vorschlag). Frontend rendert das als Pill. ``null`` wenn
   * keine Empfehlung greift. */
  source?: KnxRecommendationSource | null;
}

export interface KnxStatsSourceRecommendationDto {
  dev_source: string;
  headline_mode: KnxRecommendationMode;
  headline_recommendation: string;
  confidence: KnxRecommendationConfidence;
  reasoning: string[];
  generated_at: string;
  ga_recommendations: KnxRecommendationGaDto[];
  // optional: Backend setzt these zusaetzlich aus parse_iso_period
  from?: string;
  to?: string;
}

// =============================================================================
// Iter L2.x — Geraete-Profile (manufacturer/model/notes) fuer Layer-2-Override
// =============================================================================

// Iter L2.5 — ETS-Default-Block, der vom GET /knx-devices/{id}-Endpoint
// mitgeliefert wird, sodass das Frontend den ETS-Wert als Default
// anzeigen kann (kein User-Pflegeaufwand fuer den 99%-Fall).
export interface KnxDeviceEtsBlockDto {
  manufacturer: string | null;
  model: string | null;
  name: string | null;
}

export interface KnxDeviceDto {
  dev_source: string;
  manufacturer: string | null;
  model: string | null;
  notes: string | null;
  last_seen: string | null;
  created_at: string | null;
  updated_at: string | null;
  /** Iter L2.5: ETS-Default-Werte fuer Anzeige. Hat Vorrang vor User-
   * Pflegeaufwand — der User sieht direkt, was im ETS-Projekt steht. */
  ets?: KnxDeviceEtsBlockDto | null;
}

export interface KnxDevicePutBody {
  manufacturer?: string | null;
  model?: string | null;
  notes?: string | null;
}

// =============================================================================
// Iter L4.3 — LLM-Settings (Layer 4 / KI-Empfehlungen)
// =============================================================================

export interface KnxRecommendLlmSettingsDto {
  enabled: boolean;
  base_url: string;
  model: string;
  api_key_set: boolean;
  timeout_s: number;
  max_tokens: number;
  system_prompt_override: string;
  /**
   * Iter UX-7: Read-only Default-Prompt vom Backend, damit das
   * Frontend das Editor-Feld vorbefuellen kann (statt User vor leerer
   * Textbox zu lassen).
   */
  default_system_prompt: string;
}

export interface KnxRecommendLlmSettingsPutBody {
  enabled: boolean;
  base_url: string;
  model: string;
  /** ``undefined`` lasst den bestehenden Key unberuehrt; Empty-String loescht. */
  api_key?: string;
  timeout_s?: number;
  max_tokens?: number;
  system_prompt_override?: string;
}

// Iter UX-4: LLM-Provider-Verbindungstest
export interface KnxRecommendLlmTestBody {
  base_url?: string;
  model?: string;
  /** Wenn ``undefined``: gespeicherter Key wird genutzt. */
  api_key?: string;
  timeout_s?: number;
  max_tokens?: number;
  system_prompt_override?: string;
}

export interface KnxRecommendLlmTestResultDto {
  ok: boolean;
  latency_ms: number;
  response: {
    mode: "on_change" | "cyclic" | "hybrid";
    cycle_minutes_min: number | null;
    cycle_minutes_max: number | null;
    hysteresis: string | null;
    max_rate_per_min: number;
    rationale: string;
  } | null;
  error: string | null;
  error_category:
    | "incomplete_config"
    | "exception"
    | "invalid_response"
    | null;
}
