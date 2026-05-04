// Iter R5: Findings-DTOs aus api-client.ts ausgegliedert.
//
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
