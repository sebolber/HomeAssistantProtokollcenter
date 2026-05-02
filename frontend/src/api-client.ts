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

// KNX-Stats — siehe docs/messagehub_knx_statistik.md
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
