// Iter L2.4: Geraete-Profil-Editor in der Recommendation-Card.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxDeviceDto,
  KnxDevicePutBody,
  KnxStatsSourceDetailDto,
  KnxStatsSourceRecommendationDto,
  KnxStatsSummaryDto,
} from "../src/api-client.js";

const SUMMARY: KnxStatsSummaryDto = {
  from: "2026-04-25T00:00:00Z",
  to: "2026-05-02T00:00:00Z",
  total_telegrams: 1000,
  active_gas: 5,
  active_devices: 3,
  estimated_busload_pct: 1.0,
  counts_by_severity: { green: 3, yellow: 1, orange: 0, red: 1 },
};

const SOURCE_DETAIL: KnxStatsSourceDetailDto = {
  dev_source: "1.1.220",
  total_count: 500,
  ga_count: 1,
  share_pct: 50.0,
  last_seen: "2026-05-02T15:30:00Z",
  silent_minutes: 12.5,
  silent_alarm: false,
  repeat_ratio_pct: 0.4,
  gas: [
    {
      ga: "1/0/1",
      label: "Tor Klima Temp",
      dpt: "9.001",
      count: 500,
      rate_per_min: 1.0,
      recommended_rate: 2.0,
      ratio: 0.5,
      severity: "green",
      acknowledged: false,
      last_seen: "2026-05-02T15:30:00Z",
    },
  ],
  trend: null,
};

const RECOMMENDATION: KnxStatsSourceRecommendationDto = {
  dev_source: "1.1.220",
  headline_mode: "cyclic",
  headline_recommendation: "Aktuell cyclic — empfohlen: hybrid.",
  confidence: "high",
  reasoning: ["Layer 1 (dpt_standard) — DPT-Standard-Empfehlung."],
  generated_at: "2026-05-02T15:31:00",
  ga_recommendations: [
    {
      ga: "1/0/1",
      label: "Tor Klima Temp",
      dpt: "9.001",
      observed: {
        mode: "cyclic",
        confidence: "high",
        sample_count: 60,
        value_changes: 0,
        median_interval_s: 60,
        median_interval_minutes: 1.0,
        stdev_interval_s: 1.0,
      },
      recommended_mode: "hybrid",
      recommended_cycle_minutes: [5, 15],
      recommended_hysteresis: ">= 0.2 K",
      severity: "warn",
      rationale: "Temperatur: hybrid empfohlen.",
    },
  ],
};

interface MockApi extends ApiClient {
  putCalls: Array<{ devSource: string; body: KnxDevicePutBody }>;
  recommendationCalls: number;
}

function makeApi(initialDevice: KnxDeviceDto | null = null): MockApi {
  let device: KnxDeviceDto | null = initialDevice;
  const api: Partial<MockApi> = {
    getKnxStatsSummary: vi.fn(async () => SUMMARY),
    getKnxStatsTop: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, items: [], total: 0,
    })),
    getKnxStatsTopBySource: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, items: [], total: 0,
    })),
    getKnxStatsTimeline: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, bucket_minutes: 60, items: [],
    })),
    getKnxStatsBusHealth: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to,
      summary: { total: 0, repeated: 0, ratio_pct: 0 }, per_ga: [],
    })),
    getKnxStatsSilence: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, max_silence_minutes: 1440,
      items: [], alarm_count: 0,
    })),
    getKnxStatsOrphans: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to,
      missing_in_log: [], extra_in_log: [],
      project_total: 0, log_total: 0, discovery_status: "ok",
    })),
    getKnxStatsAlarms: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, alarms: [], triggered_count: 0,
    })),
    getKnxStatsBusload: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, bucket_seconds: 10,
      summary: { current_pct: 0, max_pct: 0, avg_pct: 0,
        total_telegrams: 0, buckets: 0 }, series: [],
    })),
    getKnxStatsHealthScore: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, score: 100,
      severity: "green" as const,
      components: { repeat: 100, busload: 100, silence: 100, alarms: 100 },
      findings: [],
    })),
    getKnxStatsLongTerm: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to,
      bucket: "hour" as const, total: 0, top_gas: [], series: [],
    })),
    getKnxStatsBursts: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to,
      window_seconds: 5, threshold_pct: 30.0, bursts: [],
    })),
    getKnxStatsSensitiveLog: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, addresses: [], telegrams: [],
    })),
    getKnxStatsTrend: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to,
      prev_from: SUMMARY.from, prev_to: SUMMARY.from,
      period_minutes: 60, total_now: 0, total_prev: 0,
      total_delta_abs: 0, total_delta_pct: null,
      top_increase: [], top_decrease: [],
    })),
    getKnxStatsHeatmap: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, bucket_minutes: 60,
      gas: [], buckets: [], matrix: [],
    })),
    getKnxBusAnalysisState: vi.fn(async () => ({ enabled: true })),
    setKnxBusAnalysisState: vi.fn(async (enabled: boolean) => ({
      ok: true, enabled,
    })),
    putCalls: [],
    recommendationCalls: 0,
  };
  api.getKnxStatsSourceDetail = vi.fn(async (devSource: string) => ({
    ...SOURCE_DETAIL, dev_source: devSource,
  }));
  api.getKnxStatsSourceRecommendation = vi.fn(async (devSource: string) => {
    api.recommendationCalls!++;
    return { ...RECOMMENDATION, dev_source: devSource };
  });
  api.getKnxDevice = vi.fn(async (devSource: string) => {
    if (device !== null) return { ...device, dev_source: devSource };
    return {
      dev_source: devSource,
      manufacturer: null,
      model: null,
      notes: null,
      last_seen: null,
      created_at: null,
      updated_at: null,
      inferred: null,
    };
  });
  api.putKnxDevice = vi.fn(
    async (devSource: string, body: KnxDevicePutBody) => {
      api.putCalls!.push({ devSource, body });
      device = {
        dev_source: devSource,
        manufacturer: body.manufacturer ?? null,
        model: body.model ?? null,
        notes: body.notes ?? null,
        last_seen: null,
        created_at: "2026-05-02T15:31:00",
        updated_at: "2026-05-02T15:31:00",
      };
      return device;
    },
  );
  api.deleteKnxDevice = vi.fn(async () => undefined);
  return api as MockApi;
}

interface PrivateView extends HTMLElement {
  api?: ApiClient;
  updateComplete: Promise<unknown>;
  _loadSourceDetail(devSource: string): Promise<void>;
}

async function mount(api: MockApi): Promise<PrivateView> {
  const el = document.createElement("stats-knx-view") as PrivateView;
  el.api = api;
  document.body.appendChild(el);
  for (let i = 0; i < 6; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
  return el;
}

async function settle(el: PrivateView): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
}

async function loadSource(el: PrivateView, devSource: string): Promise<void> {
  await el._loadSourceDetail(devSource);
  await settle(el);
}

async function expandRecommendation(el: PrivateView): Promise<void> {
  const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>(
    ".recommendation-card__toggle",
  );
  toggle!.click();
  await settle(el);
}

describe("stats-knx-view device-profile editor (Iter L2.4)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
  });

  it("Editor zeigt 'noch nicht gepflegt' bei leerem Profil", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadSource(el, "1.1.220");
    await expandRecommendation(el);

    const profile = el.shadowRoot!.querySelector(
      ".recommendation-card__device-profile",
    );
    expect(profile).not.toBeNull();
    expect(profile?.textContent ?? "").toContain("noch nicht gepflegt");
  });

  it("Bestehendes Profil wird mit manufacturer + model angezeigt", async () => {
    const api = makeApi({
      dev_source: "1.1.220",
      manufacturer: "hoermann",
      model: "garage-control",
      notes: "Hauptanschluss",
      last_seen: null,
      created_at: "2026-05-02T15:00:00",
      updated_at: "2026-05-02T15:00:00",
    });
    const el = await mount(api);
    await loadSource(el, "1.1.220");
    await expandRecommendation(el);

    const profile = el.shadowRoot!.querySelector(
      ".recommendation-card__device-profile",
    );
    expect(profile?.textContent ?? "").toContain("hoermann");
    expect(profile?.textContent ?? "").toContain("garage-control");
    expect(profile?.textContent ?? "").toContain("Hauptanschluss");
  });

  it("Bearbeiten-Klick zeigt Form, Save sendet PUT + reload Recommendation", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadSource(el, "1.1.220");
    await expandRecommendation(el);
    const initialReco = api.recommendationCalls;

    // Edit-Knopf finden
    const editBtn = Array.from(
      el.shadowRoot!.querySelectorAll<HTMLButtonElement>(
        ".recommendation-card__device-profile button",
      ),
    )[0];
    expect(editBtn).toBeDefined();
    editBtn.click();
    await settle(el);

    // Form ist da
    const form = el.shadowRoot!.querySelector(
      ".recommendation-card__device-form",
    );
    expect(form).not.toBeNull();

    // Inputs fuellen
    const inputs = form!.querySelectorAll<HTMLInputElement>("input");
    expect(inputs.length).toBe(3);
    inputs[0].value = "hoermann";
    inputs[0].dispatchEvent(new Event("input"));
    inputs[1].value = "garage-control";
    inputs[1].dispatchEvent(new Event("input"));
    await settle(el);

    // Speichern klicken (erster Knopf der Actions)
    const actions = form!.querySelector(
      ".recommendation-card__device-form-actions",
    );
    const saveBtn = actions!.querySelectorAll<HTMLButtonElement>("button")[0];
    saveBtn.click();
    await settle(el);

    expect(api.putCalls).toHaveLength(1);
    expect(api.putCalls[0].devSource).toBe("1.1.220");
    expect(api.putCalls[0].body.manufacturer).toBe("hoermann");
    expect(api.putCalls[0].body.model).toBe("garage-control");
    // Recommendation wurde neu geladen, weil Layer 2 sich aendern koennte
    expect(api.recommendationCalls).toBeGreaterThan(initialReco);
  });

  it("Cancel-Klick schliesst die Form ohne PUT", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadSource(el, "1.1.220");
    await expandRecommendation(el);

    const editBtn = el.shadowRoot!.querySelector<HTMLButtonElement>(
      ".recommendation-card__device-profile button",
    );
    editBtn!.click();
    await settle(el);

    const form = el.shadowRoot!.querySelector(
      ".recommendation-card__device-form",
    );
    expect(form).not.toBeNull();

    // Abbrechen-Knopf (zweiter)
    const actions = form!.querySelector(
      ".recommendation-card__device-form-actions",
    );
    const cancelBtn = actions!.querySelectorAll<HTMLButtonElement>("button")[1];
    cancelBtn.click();
    await settle(el);

    expect(
      el.shadowRoot!.querySelector(".recommendation-card__device-form"),
    ).toBeNull();
    expect(api.putCalls).toHaveLength(0);
  });

  it("Inferenz-Vorschlag wird unterhalb 'noch nicht gepflegt' angezeigt", async () => {
    const api = makeApi();
    api.getKnxDevice = vi.fn(
      async (devSource: string): Promise<KnxDeviceDto> => ({
        dev_source: devSource,
        manufacturer: null,
        model: null,
        notes: null,
        last_seen: null,
        created_at: null,
        updated_at: null,
        inferred: {
          manufacturer: "hoermann",
          confidence: "low" as const,
          rationale: "from_ga_labels",
        },
      }),
    );
    const el = await mount(api);
    await loadSource(el, "1.1.220");
    await expandRecommendation(el);

    const profile = el.shadowRoot!.querySelector(
      ".recommendation-card__device-profile",
    );
    expect(profile?.textContent ?? "").toContain("Vorschlag");
    expect(profile?.textContent ?? "").toContain("hoermann");
  });
});
