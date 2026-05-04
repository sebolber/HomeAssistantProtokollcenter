// REST-API-Client fuer das messagehub-Panel.
// Iter 13-15: list/get/delete/sources/stats/webhooks

export interface MessageDto {
  id: number;
  timestamp: string;
  severity: "debug" | "info" | "warning" | "error";
  source: string;
  text: string;
  metadata: Record<string, unknown> | null;
  webhook_id: string | null;
}

export interface ListResponse {
  items: MessageDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface ChannelDto {
  id: number | null;
  name: string;
  channel_type: "telegram" | "pushover" | "ntfy" | "signal" | "notify";
  enabled: boolean;
  severity_threshold: "debug" | "info" | "warning" | "error";
  quiet_start: string | null;
  quiet_end: string | null;
  quiet_bypass_error: boolean;
  throttle_seconds: number;
  config: Record<string, unknown> | null;
}

export interface MqttTopicDto {
  id: number | null;
  topic_pattern: string;
  source: string;
  severity: "debug" | "info" | "warning" | "error";
  enabled: boolean;
}

export interface RemediationHookDto {
  id: number | null;
  name: string;
  source_pattern: string;
  fingerprint: string | null;
  automation_id: string;
  confirm_required: boolean;
  enabled: boolean;
}

export interface HeartbeatDto {
  source: string;
  expected_interval_seconds: number;
  last_seen: string | null;
  silent_alert_active: boolean;
  enabled: boolean;
}

export interface KnxAddressDto {
  address: string;
  label: string;
  dpt: string | null;
  description: string | null;
  log_enabled: boolean;
  log_severity: "debug" | "info" | "warning" | "error" | "auto";
  severity_on_true: string | null;
  severity_on_false: string | null;
}

export interface WebhookDto {
  id: number;
  name: string;
  webhook_id: string;
  default_severity: string;
  default_source: string;
  field_map: Record<string, unknown> | null;
  enabled: boolean;
  created_at: string;
}

export interface StatsDto {
  total: number;
  severity_24h: Record<string, number>;
}

// KNX-Stats DTOs — gespiegelt zum Backend `api/knx_stats.py`.
export interface KnxStatsSummaryDto {
  from: string;
  to: string;
  total_telegrams: number;
  active_gas: number;
  active_devices: number;
  estimated_busload_pct: number;
  counts_by_severity: Record<"green" | "yellow" | "orange" | "red", number>;
}

export type KnxRowSeverity = "green" | "yellow" | "orange" | "red";

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

/** Iter 92 / K1: Saved Filters serverseitig. */
export interface SavedFilterDto {
  id: number;
  name: string;
  scope: "messages" | "knx-stats" | "audit";
  filters: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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

// =============================================================================
// Iter L1 — Sende-Modus-Recommendation-Engine (Backend ↔ Frontend Vertrag)
// =============================================================================
//
// Schema-Pinning: jede Aenderung muss synchron im Python-DTO
// (``processing/knx_recommend_service.py:device_recommendation_to_dict``)
// gespiegelt werden. Schema-Contract-Test in Iter L1.5.

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

export interface KnxDeviceListDto {
  items: KnxDeviceDto[];
  count: number;
}

export interface KnxDevicePutBody {
  manufacturer?: string | null;
  model?: string | null;
  notes?: string | null;
}

// Iter L2.5 — ETS-Default-Block, der vom GET /knx-devices/{id}-Endpoint
// mitgeliefert wird, sodass das Frontend den ETS-Wert als Default
// anzeigen kann (kein User-Pflegeaufwand fuer den 99%-Fall).
export interface KnxDeviceEtsBlockDto {
  manufacturer: string | null;
  model: string | null;
  name: string | null;
}

// Iter L4.3 — LLM-Settings (Layer 4 / KI-Empfehlungen)
export interface KnxRecommendLlmSettingsDto {
  enabled: boolean;
  base_url: string;
  model: string;
  api_key_set: boolean;
  timeout_s: number;
  max_tokens: number;
  system_prompt_override: string;
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

export interface KnxStatsAlarmDto {
  rule: string;
  triggered: boolean;
  actual: number;
  threshold: number;
  unit: string;
  message: string;
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

export interface ListFilters {
  severity?: string[];
  source?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  order?: "asc" | "desc";
  // Iter 61 / U15: GroupValueRead-Telegramme serverseitig ausblenden.
  hideKnxRead?: boolean;
}

// Iter 6+ (knx-findings): Vertrag fuer den /findings-Endpoint.
// Spiegel von Finding aus processing/findings.py — JSON-Form.
export type FindingSeverity = "debug" | "info" | "warning" | "error";

export interface FindingDto {
  code: string;
  schema_version: number;
  severity: FindingSeverity;
  ga: string | null;
  source: string | null;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  first_seen: string;
  last_seen: string;
  occurrence_count: number;
  detector_version: string;
  /**
   * F-004: Liefert das Backend (`list_findings_response`) seit Iter +3
   * mit. `true`, wenn fuer diese (ga, code) ein gueltiger Ack existiert.
   * Bei bus-weiten Findings (`ga=null`) immer `false`. Optional, weil
   * aeltere Backends das Feld noch nicht senden — UI defaultet auf
   * `false`.
   */
  acknowledged?: boolean;
}

export interface FindingsListResponse {
  items: FindingDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface FindingsListFilters {
  code?: string;
  ga?: string;
  severity?: FindingSeverity;
  source?: string;
  limit?: number;
  offset?: number;
}

export interface FindingsAckPayload {
  ga: string;
  code: string;
  note?: string;
  sticky?: boolean;
}

export interface SeverityOverrideItemDto {
  code: string;
  default_severity: FindingSeverity;
  override_severity: FindingSeverity | null;
  note: string | null;
  updated_at: string | null;
}

export interface SeverityOverridesResponse {
  items: SeverityOverrideItemDto[];
  total: number;
}

export class ApiClient {
  private auth: { token: string } | null = null;

  constructor(public baseUrl = "") {}

  setAuth(token: string): void {
    this.auth = { token };
  }

  private headers(): HeadersInit {
    const h: HeadersInit = { "Content-Type": "application/json" };
    if (this.auth) h["Authorization"] = `Bearer ${this.auth.token}`;
    return h;
  }

  async listMessages(filters: ListFilters = {}): Promise<ListResponse> {
    const params = new URLSearchParams();
    if (filters.severity?.length) params.set("severity", filters.severity.join(","));
    if (filters.source) params.set("source", filters.source);
    if (filters.search) params.set("search", filters.search);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.limit !== undefined) params.set("limit", String(filters.limit));
    if (filters.offset !== undefined) params.set("offset", String(filters.offset));
    if (filters.order) params.set("order", filters.order);
    if (filters.hideKnxRead) params.set("hide_knx_read", "1");
    const url = `${this.baseUrl}/api/messagehub/messages?${params.toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as ListResponse;
  }

  async getMessage(id: number): Promise<MessageDto> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/messages/${id}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as MessageDto;
  }

  async deleteMessage(id: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/messages/${id}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  async setMessageStatus(id: number, status: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/messages/${id}/status`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async setMessageSeverity(id: number, severity: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/messages/${id}/severity`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ severity }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async getMessageTags(id: number): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/messages/${id}/tags`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { tags: string[] }).tags;
  }

  async addMessageTag(id: number, tag: string): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/messages/${id}/tags`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ tag }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { tags: string[] }).tags;
  }

  async removeMessageTag(id: number, tag: string): Promise<string[]> {
    const url = `${this.baseUrl}/api/messagehub/messages/${id}/tags?tag=${encodeURIComponent(tag)}`;
    const res = await fetch(url, { method: "DELETE", headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { tags: string[] }).tags;
  }

  async getRunbookForSource(
    source: string,
    fingerprint?: string | null
  ): Promise<{ id: number; title: string; markdown: string } | null> {
    const qs = fingerprint ? `?fingerprint=${encodeURIComponent(fingerprint)}` : "";
    const res = await fetch(
      `${this.baseUrl}/api/messagehub/runbook/${encodeURIComponent(source)}${qs}`,
      { headers: this.headers() }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as { id: number; title: string; markdown: string };
  }

  async listAudit(limit = 200): Promise<Array<Record<string, unknown>>> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/audit?limit=${limit}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { items: Array<Record<string, unknown>> }).items;
  }

  async getKnxBusAnalysisState(): Promise<{ enabled: boolean }> {
    const res = await fetch(
      `${this.baseUrl}/api/messagehub/knx-stats/bus-analysis-state`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as { enabled: boolean };
  }

  async setKnxBusAnalysisState(enabled: boolean): Promise<{ ok: boolean; enabled: boolean }> {
    const res = await fetch(
      `${this.baseUrl}/api/messagehub/knx-stats/bus-analysis-state`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify({ enabled }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as { ok: boolean; enabled: boolean };
  }

  async clearAuditLog(): Promise<{ ok: boolean; deleted: number }> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/audit`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as { ok: boolean; deleted: number };
  }

  async discoverKnxFromProject(): Promise<{
    items: Array<{ address: string; name: string; dpt: string | null }>;
    status: string;
  }> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/knx-discovery`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as {
      items: Array<{ address: string; name: string; dpt: string | null }>;
      status: string;
    };
  }

  // Iter 47 (N4): intelligenter Abgleich mit Vorschau (apply=false) +
  // Anwendung (apply=true). Aenderungen siehe Backend-Doc-String.
  // Iter 56: Bulk-Patch fuer mehrere KNX-GAs in einem Request.
  async bulkPatchKnxAddresses(
    addresses: string[],
    patch: {
      log_enabled?: boolean;
      log_severity?: string;
      severity_on_true?: string | null;
      severity_on_false?: string | null;
    }
  ): Promise<{ updated: number; address_count: number }> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses/bulk`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ addresses, patch }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as { updated: number; address_count: number };
  }

  async syncKnxProject(
    items: Array<{ address: string; name: string; dpt: string | null }>,
    apply: boolean
  ): Promise<{
    plan: {
      add: Array<{ address: string; label: string; dpt: string | null }>;
      update: Array<{
        address: string;
        label: string;
        dpt: string | null;
        old_label: string;
        old_dpt: string | null;
      }>;
      delete: Array<{ address: string; label: string }>;
      keep: string[];
    };
    counts:
      | { add: number; update: number; delete: number; keep: number }
      | { added: number; updated: number; deleted: number };
  }> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses/sync`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ items, apply }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as {
      plan: {
        add: Array<{ address: string; label: string; dpt: string | null }>;
        update: Array<{
          address: string;
          label: string;
          dpt: string | null;
          old_label: string;
          old_dpt: string | null;
        }>;
        delete: Array<{ address: string; label: string }>;
        keep: string[];
      };
      counts:
        | { add: number; update: number; delete: number; keep: number }
        | { added: number; updated: number; deleted: number };
    };
  }

  async listKnxAddresses(): Promise<KnxAddressDto[]> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { items: KnxAddressDto[] }).items;
  }

  async upsertKnxAddress(payload: {
    address: string;
    label: string;
    dpt?: string | null;
    description?: string | null;
    log_enabled?: boolean;
    log_severity?: "debug" | "info" | "warning" | "error" | "auto";
    severity_on_true?: string | null;
    severity_on_false?: string | null;
  }): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async listChannels(): Promise<ChannelDto[]> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/channels`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { items: ChannelDto[] }).items;
  }

  async createChannel(payload: Partial<ChannelDto>): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/channels`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async updateChannel(id: number, payload: Partial<ChannelDto>): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/channels/${id}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async deleteChannel(id: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/channels/${id}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  /**
   * F-001: Sendet eine Test-Nachricht ueber einen konfigurierten Channel.
   * Backend ist rate-limited (3 Versuche/Min/Channel; HTTP 429 bei Burst).
   */
  async testChannel(id: number): Promise<{ delivered: boolean; channel: string }> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/channels/${id}/test`, {
      method: "POST",
      headers: this.headers(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }
    return (await res.json()) as { delivered: boolean; channel: string };
  }

  async listMqttTopics(): Promise<MqttTopicDto[]> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { items: MqttTopicDto[] }).items;
  }

  async createMqttTopic(payload: Partial<MqttTopicDto>): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async deleteMqttTopic(id: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics/${id}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  /**
   * F-002: MQTT-Topic ID-stabil aktualisieren. Backend-Endpoint
   * (Iter 83 / CR-4) stand seit langem bereit, Frontend-Methode
   * fehlte. Ohne Update-Pfad mussten User Loeschen + Neu-Anlegen,
   * was die ID veraenderte und Audit-/Findings-Bezuege brach.
   */
  async updateMqttTopic(id: number, payload: Partial<MqttTopicDto>): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/mqtt-topics/${id}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async listRemediationHooks(): Promise<RemediationHookDto[]> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { items: RemediationHookDto[] }).items;
  }

  async createRemediationHook(payload: Partial<RemediationHookDto>): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async deleteRemediationHook(id: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/remediation-hooks/${id}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  /**
   * F-006: ID-stabiles Update eines Remediation-Hooks.
   * Erfordert vollstaendigen Payload (name, source_pattern, automation_id);
   * optionale Felder duerfen weggelassen werden.
   */
  async updateRemediationHook(
    id: number,
    payload: Partial<RemediationHookDto>
  ): Promise<void> {
    const res = await fetch(
      `${this.baseUrl}/api/messagehub/remediation-hooks/${id}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async listHeartbeats(): Promise<HeartbeatDto[]> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/heartbeats`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { items: HeartbeatDto[] }).items;
  }

  async upsertHeartbeat(source: string, expectedIntervalSeconds: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/heartbeats`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ source, expected_interval_seconds: expectedIntervalSeconds }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  /**
   * F-005: Entfernt einen Heartbeat-Eintrag dauerhaft.
   * 404, wenn die Source nicht (mehr) existiert.
   */
  async deleteHeartbeat(source: string): Promise<void> {
    const res = await fetch(
      `${this.baseUrl}/api/messagehub/heartbeats/${encodeURIComponent(source)}`,
      { method: "DELETE", headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  /**
   * F-005: Pausiert/aktiviert das Tracking ohne den Eintrag zu loeschen.
   * False -> Heartbeat-Job ueberspringt diese Source.
   */
  async setHeartbeatEnabled(source: string, enabled: boolean): Promise<void> {
    const res = await fetch(
      `${this.baseUrl}/api/messagehub/heartbeats/${encodeURIComponent(source)}`,
      {
        method: "PATCH",
        headers: this.headers(),
        body: JSON.stringify({ enabled }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async getStatsExtended(days = 30): Promise<{
    heatmap: Array<{ hour: number; weekday: number; count: number }>;
    top_sources: Array<{ source: string; count: number }>;
  }> {
    const res = await fetch(
      `${this.baseUrl}/api/messagehub/stats-extended?days=${days}`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as {
      heatmap: Array<{ hour: number; weekday: number; count: number }>;
      top_sources: Array<{ source: string; count: number }>;
    };
  }

  async deleteKnxAddress(address: string): Promise<void> {
    const url = `${this.baseUrl}/api/messagehub/knx-addresses/${encodeURIComponent(address)}`;
    const res = await fetch(url, { method: "DELETE", headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  async importKnxCsv(
    csvContent: string
  ): Promise<{ imported: number; skipped: number; errors: number }> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/knx-addresses`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ csv: csvContent }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as { imported: number; skipped: number; errors: number };
  }

  /**
   * F-011: Typisierter URL-Helfer fuer KNX-GA-Telegramm-Export.
   * Vorher hat stats-knx-view die URL inline zusammengebaut, was bei
   * GA-Adressen mit Slashes (1/2/3) ohne URL-Encoding einen 404
   * produziert haette. Diese Methode kapselt das encodeURIComponent
   * sicher und ist Vitest-getestet.
   */
  knxStatsGaExportUrl(
    ga: string,
    format: "csv" | "json",
    range: { from?: string; to?: string } = {}
  ): string {
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    params.set("format", format);
    return (
      `${this.baseUrl}/api/messagehub/knx-stats/ga/${encodeURIComponent(ga)}/export` +
      `?${params.toString()}`
    );
  }

  exportUrl(filters: ListFilters & { format?: "jsonl" | "csv" }): string {
    const params = new URLSearchParams();
    if (filters.severity?.length) params.set("severity", filters.severity.join(","));
    if (filters.source) params.set("source", filters.source);
    if (filters.search) params.set("search", filters.search);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("format", filters.format ?? "jsonl");
    if (filters.limit !== undefined) params.set("limit", String(filters.limit));
    return `${this.baseUrl}/api/messagehub/export?${params.toString()}`;
  }

  async deleteMessages(filters: ListFilters = {}): Promise<number> {
    const params = new URLSearchParams();
    if (filters.severity?.length) params.set("severity", filters.severity.join(","));
    if (filters.source) params.set("source", filters.source);
    if (filters.search) params.set("search", filters.search);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const url = `${this.baseUrl}/api/messagehub/messages?${params.toString()}`;
    const res = await fetch(url, { method: "DELETE", headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { deleted: number };
    return body.deleted;
  }

  async listSources(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/sources`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (((await res.json()) as { sources: string[] }).sources);
  }

  async getStats(): Promise<StatsDto> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/stats`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as StatsDto;
  }

  async listWebhooks(): Promise<WebhookDto[]> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/webhooks`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (((await res.json()) as { webhooks: WebhookDto[] }).webhooks);
  }

  async createWebhook(payload: {
    name: string;
    default_source: string;
    default_severity?: string;
    field_map?: Record<string, unknown> | null;
    enabled?: boolean;
  }): Promise<WebhookDto> {
    const res = await fetch(`${this.baseUrl}/api/messagehub/webhooks`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as WebhookDto;
  }

  async updateWebhook(
    webhookId: string,
    payload: Partial<{
      name: string;
      default_source: string;
      default_severity: string;
      field_map: Record<string, unknown> | null;
      enabled: boolean;
    }>
  ): Promise<WebhookDto> {
    const res = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${webhookId}`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as WebhookDto;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    const res = await fetch(
      `${this.baseUrl}/api/messagehub/webhooks/${webhookId}`,
      { method: "DELETE", headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  // --- KNX-Stats (Iter 6) ----------------------------------------------

  private _knxStatsParams(f: KnxStatsFilters): URLSearchParams {
    const p = new URLSearchParams();
    if (f.from) p.set("from", f.from);
    if (f.to) p.set("to", f.to);
    if (f.limit !== undefined) p.set("limit", String(f.limit));
    if (f.minRate !== undefined) p.set("min_rate", String(f.minRate));
    if (f.includeAcknowledged === false) p.set("include_acknowledged", "false");
    return p;
  }

  async getKnxStatsSummary(f: KnxStatsFilters): Promise<KnxStatsSummaryDto> {
    const url = `${this.baseUrl}/api/messagehub/knx-stats/summary?${this._knxStatsParams(f).toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsSummaryDto;
  }

  async getKnxStatsTop(
    f: KnxStatsFilters
  ): Promise<{ from: string; to: string; items: KnxStatsTopRowDto[]; total: number }> {
    const url = `${this.baseUrl}/api/messagehub/knx-stats/top?${this._knxStatsParams(f).toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as {
      from: string;
      to: string;
      items: KnxStatsTopRowDto[];
      total: number;
    };
  }

  async getKnxStatsTopBySource(
    f: KnxStatsFilters
  ): Promise<{ from: string; to: string; items: KnxStatsTopBySourceRowDto[]; total: number }> {
    const url = `${this.baseUrl}/api/messagehub/knx-stats/top-by-source?${this._knxStatsParams(f).toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as {
      from: string;
      to: string;
      items: KnxStatsTopBySourceRowDto[];
      total: number;
    };
  }

  async getKnxStatsGaDetail(
    ga: string,
    f: KnxStatsFilters
  ): Promise<KnxStatsGaDetailDto> {
    const url = `${this.baseUrl}/api/messagehub/knx-stats/ga/${encodeURIComponent(ga)}?${this._knxStatsParams(f).toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsGaDetailDto;
  }

  async getKnxStatsSourceDetail(
    devSource: string,
    f: KnxStatsFilters
  ): Promise<KnxStatsSourceDetailDto> {
    // Iter D (knx-detail-panes): Source-Detail-Endpoint fuer
    // Top-Geraete + Stille-Alarme.
    const url = `${this.baseUrl}/api/messagehub/knx-stats/source/${encodeURIComponent(devSource)}?${this._knxStatsParams(f).toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsSourceDetailDto;
  }

  /** Iter L1.3 (Sprint Recommendations): Geraete-Empfehlung. */
  async getKnxStatsSourceRecommendation(
    devSource: string,
    f: KnxStatsFilters
  ): Promise<KnxStatsSourceRecommendationDto> {
    const url = `${this.baseUrl}/api/messagehub/knx-stats/source/${encodeURIComponent(devSource)}/recommendation?${this._knxStatsParams(f).toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsSourceRecommendationDto;
  }

  /** Iter L2.4: Geraete-Profil pflegen. */
  async getKnxDevice(devSource: string): Promise<KnxDeviceDto> {
    const url = `${this.baseUrl}/api/messagehub/knx-devices/${encodeURIComponent(devSource)}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxDeviceDto;
  }

  async putKnxDevice(
    devSource: string,
    body: KnxDevicePutBody,
  ): Promise<KnxDeviceDto> {
    const url = `${this.baseUrl}/api/messagehub/knx-devices/${encodeURIComponent(devSource)}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxDeviceDto;
  }

  async deleteKnxDevice(devSource: string): Promise<void> {
    const url = `${this.baseUrl}/api/messagehub/knx-devices/${encodeURIComponent(devSource)}`;
    const res = await fetch(url, { method: "DELETE", headers: this.headers() });
    if (!res.ok && res.status !== 404) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
  }

  /** Iter L4.3: LLM-Settings lesen. */
  async getKnxRecommendLlmSettings(): Promise<KnxRecommendLlmSettingsDto> {
    const url = `${this.baseUrl}/api/messagehub/knx-recommend/llm-settings`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxRecommendLlmSettingsDto;
  }

  /** Iter L4.3: LLM-Settings speichern. */
  async putKnxRecommendLlmSettings(
    body: KnxRecommendLlmSettingsPutBody,
  ): Promise<KnxRecommendLlmSettingsDto> {
    const url = `${this.baseUrl}/api/messagehub/knx-recommend/llm-settings`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxRecommendLlmSettingsDto;
  }

  async getKnxStatsTimeline(
    f: KnxStatsFilters & { gas: string[]; bucketMinutes?: number }
  ): Promise<KnxStatsTimelineDto> {
    const params = this._knxStatsParams(f);
    params.set("gas", f.gas.join(","));
    if (f.bucketMinutes !== undefined) params.set("bucket", String(f.bucketMinutes));
    const url = `${this.baseUrl}/api/messagehub/knx-stats/timeline?${params.toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsTimelineDto;
  }

  async acknowledgeKnxGa(
    ga: string,
    payload: { note?: string; expiryDays?: number } = {}
  ): Promise<void> {
    const body: Record<string, unknown> = { ga };
    if (payload.note !== undefined) body["note"] = payload.note;
    if (payload.expiryDays !== undefined) body["expiry_days"] = payload.expiryDays;
    const res = await fetch(`${this.baseUrl}/api/messagehub/knx-stats/acknowledge`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async getKnxStatsAlarms(f: KnxStatsFilters): Promise<KnxStatsAlarmsDto> {
    const url = `${this.baseUrl}/api/messagehub/knx-stats/alarms?${this._knxStatsParams(f).toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsAlarmsDto;
  }

  /** Iter 92 / K1: Saved Filters listen. */
  async listSavedFilters(scope: string): Promise<SavedFilterDto[]> {
    const url = `${this.baseUrl}/api/messagehub/saved-filters?scope=${encodeURIComponent(scope)}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { items: SavedFilterDto[] };
    return json.items;
  }

  /** Iter 92 / K1: Saved Filter speichern (upsert). */
  async upsertSavedFilter(
    name: string,
    scope: string,
    filters: Record<string, unknown>,
  ): Promise<SavedFilterDto> {
    const url = `${this.baseUrl}/api/messagehub/saved-filters`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ name, scope, filters }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as SavedFilterDto;
  }

  /** Iter 92 / K1: Saved Filter loeschen. */
  async deleteSavedFilter(id: number): Promise<void> {
    const url = `${this.baseUrl}/api/messagehub/saved-filters/${id}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  /** Iter 91 / WR-G: GA-Heatmap (Top-N GAs x Zeit-Buckets). */
  async getKnxStatsHeatmap(
    f: KnxStatsFilters,
    topN = 10,
    bucketMinutes = 60,
  ): Promise<KnxStatsHeatmapDto> {
    const params = this._knxStatsParams(f);
    params.set("top_n", String(topN));
    params.set("bucket", String(bucketMinutes));
    const url = `${this.baseUrl}/api/messagehub/knx-stats/heatmap?${params.toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsHeatmapDto;
  }

  /** Iter 67 / WR-I: Trend-Vergleich aktueller Periode vs. Vorperiode. */
  async getKnxStatsTrend(
    f: KnxStatsFilters,
    topN = 5,
  ): Promise<KnxStatsTrendDto> {
    const params = this._knxStatsParams(f);
    params.set("top_n", String(topN));
    const url = `${this.baseUrl}/api/messagehub/knx-stats/trend?${params.toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsTrendDto;
  }

  async getKnxStatsOrphans(f: KnxStatsFilters): Promise<KnxStatsOrphansDto> {
    const url = `${this.baseUrl}/api/messagehub/knx-stats/orphans?${this._knxStatsParams(f).toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsOrphansDto;
  }

  async getKnxStatsSilence(
    f: KnxStatsFilters & { maxSilenceMinutes?: number }
  ): Promise<KnxStatsSilenceDto> {
    const params = this._knxStatsParams(f);
    if (f.maxSilenceMinutes !== undefined) {
      params.set("max_silence_min", String(f.maxSilenceMinutes));
    }
    const url = `${this.baseUrl}/api/messagehub/knx-stats/silence?${params.toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsSilenceDto;
  }

  async getKnxStatsBusHealth(f: KnxStatsFilters): Promise<KnxStatsBusHealthDto> {
    const url = `${this.baseUrl}/api/messagehub/knx-stats/bus-health?${this._knxStatsParams(f).toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsBusHealthDto;
  }

  async getKnxStatsBusload(
    f: KnxStatsFilters,
    bucketSeconds?: number
  ): Promise<KnxStatsBusloadDto> {
    const params = this._knxStatsParams(f);
    if (bucketSeconds && Number.isFinite(bucketSeconds) && bucketSeconds > 0) {
      params.set("bucket_seconds", String(Math.trunc(bucketSeconds)));
    }
    const url = `${this.baseUrl}/api/messagehub/knx-stats/busload?${params.toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsBusloadDto;
  }

  async getKnxStatsHealthScore(f: KnxStatsFilters): Promise<KnxStatsHealthScoreDto> {
    const params = this._knxStatsParams(f);
    const url = `${this.baseUrl}/api/messagehub/knx-stats/health-score?${params.toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsHealthScoreDto;
  }

  async getKnxStatsLongTerm(
    f: KnxStatsFilters,
    bucket: "auto" | "hour" | "day" = "auto"
  ): Promise<KnxStatsLongTermDto> {
    const params = this._knxStatsParams(f);
    if (bucket !== "auto") params.set("bucket", bucket);
    const url = `${this.baseUrl}/api/messagehub/knx-stats/long-term?${params.toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsLongTermDto;
  }

  async getKnxStatsBursts(
    f: KnxStatsFilters,
    opts: { windowSeconds?: number; thresholdPct?: number } = {}
  ): Promise<KnxStatsBurstsDto> {
    const params = this._knxStatsParams(f);
    if (opts.windowSeconds && Number.isFinite(opts.windowSeconds)) {
      params.set("window_seconds", String(Math.trunc(opts.windowSeconds)));
    }
    if (opts.thresholdPct && Number.isFinite(opts.thresholdPct)) {
      params.set("threshold_pct", String(opts.thresholdPct));
    }
    const url = `${this.baseUrl}/api/messagehub/knx-stats/bursts?${params.toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsBurstsDto;
  }

  async getKnxStatsSensitiveLog(
    f: KnxStatsFilters
  ): Promise<KnxStatsSensitiveLogDto> {
    const params = this._knxStatsParams(f);
    const url = `${this.baseUrl}/api/messagehub/knx-stats/sensitive-log?${params.toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as KnxStatsSensitiveLogDto;
  }

  async setKnxStatsSensitive(ga: string, sensitive: boolean): Promise<void> {
    const url = `${this.baseUrl}/api/messagehub/knx-stats/sensitive/${encodeURIComponent(ga)}`;
    const res = await fetch(url, {
      method: sensitive ? "POST" : "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  async unacknowledgeKnxGa(ga: string): Promise<void> {
    const url = `${this.baseUrl}/api/messagehub/knx-stats/acknowledge/${encodeURIComponent(ga)}`;
    const res = await fetch(url, { method: "DELETE", headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  // ----- Iter 6/7/8 (knx-findings): Findings-Endpoints --------------------

  async listFindings(
    filters: FindingsListFilters = {}
  ): Promise<FindingsListResponse> {
    const params = new URLSearchParams();
    if (filters.code) params.set("code", filters.code);
    if (filters.ga) params.set("ga", filters.ga);
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.source) params.set("source", filters.source);
    if (filters.limit !== undefined) params.set("limit", String(filters.limit));
    if (filters.offset !== undefined) params.set("offset", String(filters.offset));
    const url = `${this.baseUrl}/api/messagehub/findings?${params.toString()}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as FindingsListResponse;
  }

  async acknowledgeFinding(payload: FindingsAckPayload): Promise<unknown> {
    const url = `${this.baseUrl}/api/messagehub/findings/ack`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return await res.json();
  }

  async unacknowledgeFinding(ga: string, code: string): Promise<unknown> {
    const url = `${this.baseUrl}/api/messagehub/findings/ack/${encodeURIComponent(ga)}/${encodeURIComponent(code)}`;
    const res = await fetch(url, { method: "DELETE", headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return await res.json();
  }

  async listSeverityOverrides(): Promise<SeverityOverridesResponse> {
    const url = `${this.baseUrl}/api/messagehub/findings/severity-overrides`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SeverityOverridesResponse;
  }

  async setSeverityOverride(
    code: string,
    severity: FindingSeverity,
    note?: string
  ): Promise<unknown> {
    const url = `${this.baseUrl}/api/messagehub/findings/severity-overrides/${encodeURIComponent(code)}`;
    const body: Record<string, unknown> = { severity };
    if (note !== undefined) body["note"] = note;
    const res = await fetch(url, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return await res.json();
  }

  async clearSeverityOverride(code: string): Promise<unknown> {
    const url = `${this.baseUrl}/api/messagehub/findings/severity-overrides/${encodeURIComponent(code)}`;
    const res = await fetch(url, { method: "DELETE", headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return await res.json();
  }

  async exportFindingsMarkdown(): Promise<string> {
    const url = `${this.baseUrl}/api/messagehub/findings/export.md`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  }

  async refreshFindings(
    ga: string,
    periodDays = 7
  ): Promise<{ ga: string; period_days: number; findings_recorded: number }> {
    // Iter 29a: Triggert Per-GA-Detector-Runner (DPT_MISMATCH,
    // VALUE_OUT_OF_RANGE, MULTI_RESPONDER, READ_NO_RESPONSE,
    // TOGGLE_LOOP, REPEAT_APPROXIMATION, PATTERN_*).
    const url = `${this.baseUrl}/api/messagehub/findings/refresh`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ ga, period_days: periodDays }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as {
      ga: string;
      period_days: number;
      findings_recorded: number;
    };
  }

  async acknowledgeKnxBulk(
    devSource: string,
    payload: { note?: string; expiryDays?: number; from?: string; to?: string } = {}
  ): Promise<{ ok: boolean; dev_source: string; count: number; gas: string[] }> {
    const params = new URLSearchParams();
    if (payload.from) params.set("from", payload.from);
    if (payload.to) params.set("to", payload.to);
    const url = `${this.baseUrl}/api/messagehub/knx-stats/acknowledge-bulk?${params.toString()}`;
    const body: Record<string, unknown> = { dev_source: devSource };
    if (payload.note !== undefined) body["note"] = payload.note;
    if (payload.expiryDays !== undefined) body["expiry_days"] = payload.expiryDays;
    const res = await fetch(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as {
      ok: boolean;
      dev_source: string;
      count: number;
      gas: string[];
    };
  }
}
