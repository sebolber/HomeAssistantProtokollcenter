// Iter R5: KNX-Stats-DTOs aus api-client.ts ausgegliedert.
//
// Spiegel zum Backend ``api/knx_stats.py``. Schema-Pinning per
// Backend-Contract-Tests; jede DTO-Aenderung hier muss mit dem
// Python-Pendant synchron bleiben.

export type KnxRowSeverity = "green" | "yellow" | "orange" | "red";

export interface KnxStatsSummaryDto {
  from: string;
  to: string;
  total_telegrams: number;
  active_gas: number;
  active_devices: number;
  estimated_busload_pct: number;
  counts_by_severity: Record<"green" | "yellow" | "orange" | "red", number>;
}

export interface KnxStatsTopRowDto {
  ga: string;
  dpt: string | null;
  label: string | null;
  dev_source: string;
  count: number;
  rate_per_min: number;
  recommended_rate: number;
  ratio: number;
  severity: KnxRowSeverity;
  acknowledged: boolean;
  /**
   * Iter 62 / WR-T: true, wenn der DPT nicht aus dem ETS-Projekt
   * stammt, sondern aus den Sample-Werten geraten wurde
   * (`infer_dpt_from_samples`). Frontend zeigt das mit Tooltip.
   */
  dpt_inferred?: boolean;
  /**
   * Iter 63 / U13: true, wenn fuer diese GA mindestens ein Anti-
   * Pattern erkannt wurde (Lightweight-Check: Konstant-Wert-Spam ueber
   * >= 5 Samples). Detail-Pane zeigt die volle Findings-Liste.
   */
  has_findings?: boolean;
}

/** Iter 91 / WR-G: GA-Heatmap (Top-N GAs x Zeit-Buckets). */
export interface KnxStatsHeatmapDto {
  from: string;
  to: string;
  bucket_minutes: number;
  gas: Array<{ ga: string; label: string | null; total: number }>;
  buckets: string[];
  matrix: number[][];
}

/** Iter 67 / WR-I: Trend-Vergleich aktuelle Periode vs. Vorperiode. */
export interface KnxStatsTrendRowDto {
  ga: string;
  label: string | null;
  dpt: string | null;
  count_now: number;
  count_prev: number;
  delta_abs: number;
  /** null wenn Vorperiode 0 (= GA neu in dieser Periode). */
  delta_pct: number | null;
}

export interface KnxStatsTrendDto {
  from: string;
  to: string;
  prev_from: string;
  prev_to: string;
  period_minutes: number;
  total_now: number;
  total_prev: number;
  total_delta_abs: number;
  total_delta_pct: number | null;
  top_increase: KnxStatsTrendRowDto[];
  top_decrease: KnxStatsTrendRowDto[];
}

export interface KnxStatsRecommendationDto {
  severity: KnxRowSeverity;
  text: string;
  action_required: boolean;
  ratio: number;
  estimated_reduction_pct: number | null;
}

export interface KnxStatsFindingDto {
  kind: string;
  severity: KnxRowSeverity;
  text: string;
}

export interface KnxStatsSiblingGaDto {
  ga: string;
  label: string | null;
  count: number;
  rate_per_min: number;
}

export interface KnxStatsValuePoint {
  ts: string;
  value: unknown;
}

export interface KnxStatsManufacturerHints {
  matched_key: string;
  doc_url: string;
  tips: string[];
}

export interface KnxStatsDeviceInfo {
  individual_address: string;
  manufacturer: string;
  name: string;
  product: string;
}

export interface KnxStatsGaDetailDto {
  ga: string;
  dpt: string | null;
  label: string | null;
  dev_source: string;
  count: number;
  rate_per_min: number;
  recommended_rate: number;
  recommendation: KnxStatsRecommendationDto;
  findings: KnxStatsFindingDto[];
  sibling_gas: KnxStatsSiblingGaDto[];
  value_history: KnxStatsValuePoint[];
  device?: KnxStatsDeviceInfo | null;
  manufacturer_hints?: KnxStatsManufacturerHints | null;
}

// Iter D (knx-detail-panes): Source-Detail-DTO.
export interface KnxStatsSourceGaSummaryDto {
  ga: string;
  label: string | null;
  dpt: string | null;
  count: number;
  rate_per_min: number;
  recommended_rate: number;
  ratio: number;
  severity: "green" | "yellow" | "orange" | "red";
  acknowledged: boolean;
  last_seen: string | null;
}

// Iter H (knx-detail-panes): persistierter Detector-Finding fuer das
// Source-Detail. Spiegel der Backend-Finding-Dataclass; nur die fuer
// die UI relevanten Felder, weil title/description aus translations/
// gerendert werden.
export interface KnxStatsSourcePersistedFindingDto {
  code: string;
  schema_version: number;
  severity: "debug" | "info" | "warning" | "error";
  ga: string | null;
  source: string | null;
  title: string;
  description: string;
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
  detector_version: string;
  evidence?: Record<string, unknown>;
}

// Iter I (knx-detail-panes): Trend-Vergleich pro Source — aktuelle
// Periode vs. gleich-lange Vorperiode davor.
export interface KnxStatsSourceTrendDeltaDto {
  count_now: number;
  count_prev: number;
  delta_abs: number;
  /** null wenn count_prev === 0 (Division-durch-0; UI rendert "neu"). */
  delta_pct: number | null;
}

export interface KnxStatsSourceDetailDto {
  dev_source: string;
  total_count: number;
  ga_count: number;
  share_pct: number;
  last_seen: string | null;
  silent_minutes: number | null;
  silent_alarm: boolean;
  repeat_ratio_pct: number;
  gas: KnxStatsSourceGaSummaryDto[];
  // Iter H (knx-detail-panes): Findings-Liste pro Source.
  findings?: KnxStatsSourcePersistedFindingDto[];
  // Iter I (knx-detail-panes): Trend-Compare bei Perioden >= 24h.
  trend?: KnxStatsSourceTrendDeltaDto | null;
  from?: string;
  to?: string;
  device?: KnxStatsDeviceInfo | null;
  manufacturer_hints?: KnxStatsManufacturerHints | null;
}

export interface KnxStatsTimelineDto {
  from: string;
  to: string;
  bucket_minutes: number;
  items: Array<{ ga: string; bucket: string; count: number }>;
}

export interface KnxStatsTopBySourceRowDto {
  dev_source: string;
  count: number;
  ga_count: number;
  manufacturer?: string;
  device_name?: string;
}

// Iter UX-1.0: pro stillem Geraet im Alarm-Banner-Detail.
export interface KnxStatsSilenceDeviceDto {
  dev_source: string;
  manufacturer: string | null;
  device_name: string | null;
  silent_minutes: number;
  last_seen: string;
  ga_count: number;
  gas: Array<{
    ga: string;
    label: string | null;
    dpt: string | null;
    count: number;
  }>;
}

export interface KnxStatsAlarmDetailsDto {
  /** Iter UX-1.0: ``silence_alarm`` enthaelt die betroffenen Geraete
   * mit Namen + GAs zum Aufklappen. */
  devices?: KnxStatsSilenceDeviceDto[];
}

export interface KnxStatsAlarmDto {
  rule: string;
  triggered: boolean;
  actual: number;
  threshold: number;
  unit: string;
  message: string;
  /** Iter UX-1.0: regel-spezifischer Detail-Block. */
  details?: KnxStatsAlarmDetailsDto | null;
}

export interface KnxStatsAlarmsDto {
  from: string;
  to: string;
  alarms: KnxStatsAlarmDto[];
  triggered_count: number;
}

export interface KnxStatsOrphansDto {
  from: string;
  to: string;
  missing_in_log: Array<{ address: string; name: string; dpt: string | null }>;
  extra_in_log: Array<{ address: string; label: string | null; count: number }>;
  project_total: number;
  log_total: number;
  discovery_status: string;
}

export interface KnxStatsSilenceItemDto {
  dev_source: string;
  last_seen: string;
  total: number;
  silent_minutes: number;
  alarm: boolean;
  // Iter UX-1.0: Geraete-Info aus ETS + GAs der Source.
  manufacturer?: string | null;
  device_name?: string | null;
  ga_count?: number;
  gas?: Array<{
    ga: string;
    label: string | null;
    dpt: string | null;
    count: number;
  }>;
}

export interface KnxStatsSilenceDto {
  from: string;
  to: string;
  max_silence_minutes: number;
  items: KnxStatsSilenceItemDto[];
  alarm_count: number;
}

export interface KnxStatsBusHealthDto {
  from: string;
  to: string;
  summary: { total: number; repeated: number; ratio_pct: number };
  per_ga: Array<{
    ga: string;
    label: string | null;
    total: number;
    repeated: number;
    ratio_pct: number;
  }>;
}

export interface KnxStatsBusloadBucket {
  bucket: string;
  telegrams: number;
  busload_pct: number;
}

export interface KnxStatsBusloadDto {
  from: string;
  to: string;
  bucket_seconds: number;
  summary: {
    current_pct: number;
    max_pct: number;
    avg_pct: number;
    total_telegrams: number;
    buckets: number;
  };
  series: KnxStatsBusloadBucket[];
}

export interface KnxStatsHealthFinding {
  severity: "info" | "warn" | "critical";
  code: string;
  message: string;
}

export interface KnxStatsHealthScoreDto {
  from: string;
  to: string;
  score: number;
  severity: "green" | "yellow" | "orange" | "red";
  components: {
    repeat: number;
    busload: number;
    silence: number;
    alarms: number;
  };
  findings: KnxStatsHealthFinding[];
}

export interface KnxStatsLongTermBucket {
  bucket: string;
  count: number;
}

export interface KnxStatsLongTermTopGa {
  ga: string;
  label: string | null;
  dpt: string | null;
  count: number;
}

export interface KnxStatsLongTermDto {
  from: string;
  to: string;
  bucket: "hour" | "day";
  total: number;
  top_gas: KnxStatsLongTermTopGa[];
  series: KnxStatsLongTermBucket[];
}

export interface KnxStatsBurst {
  bucket: string;
  telegrams: number;
  busload_pct: number;
  ga_count: number;
  source_count: number;
}

export interface KnxStatsBurstsDto {
  from: string;
  to: string;
  window_seconds: number;
  threshold_pct: number;
  bursts: KnxStatsBurst[];
}

export interface KnxStatsSensitiveAddress {
  ga: string;
  label: string | null;
  dpt: string | null;
}

export interface KnxStatsSensitiveTelegram {
  ts: string;
  ga: string;
  dev_source: string;
  value: string | null;
  telegramtype: string | null;
  label: string | null;
  dpt: string | null;
}

export interface KnxStatsSensitiveLogDto {
  from: string;
  to: string;
  addresses: KnxStatsSensitiveAddress[];
  telegrams: KnxStatsSensitiveTelegram[];
}

export interface KnxStatsFilters {
  from?: string;
  to?: string;
  limit?: number;
  minRate?: number;
  includeAcknowledged?: boolean;
}
