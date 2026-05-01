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
}
