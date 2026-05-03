// Iter L4.3: UI-Tests fuer den LLM-Settings-View.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/knx-recommend-llm-view.js";
import type {
  ApiClient,
  KnxRecommendLlmSettingsDto,
  KnxRecommendLlmSettingsPutBody,
} from "../src/api-client.js";

const DEFAULT_SETTINGS: KnxRecommendLlmSettingsDto = {
  enabled: false,
  base_url: "",
  model: "",
  api_key_set: false,
  timeout_s: 15.0,
  max_tokens: 800,
  system_prompt_override: "",
};

const CONFIGURED_SETTINGS: KnxRecommendLlmSettingsDto = {
  enabled: true,
  base_url: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  api_key_set: true,
  timeout_s: 15.0,
  max_tokens: 800,
  system_prompt_override: "",
};

interface MockApi extends ApiClient {
  getCalls: number;
  putCalls: KnxRecommendLlmSettingsPutBody[];
}

function makeApi(
  initial: KnxRecommendLlmSettingsDto = DEFAULT_SETTINGS,
): MockApi {
  let current: KnxRecommendLlmSettingsDto = { ...initial };
  const api: Partial<MockApi> = {
    getCalls: 0,
    putCalls: [],
  };
  api.getKnxRecommendLlmSettings = vi.fn(async () => {
    api.getCalls!++;
    return { ...current };
  });
  api.putKnxRecommendLlmSettings = vi.fn(
    async (body: KnxRecommendLlmSettingsPutBody) => {
      api.putCalls!.push({ ...body });
      current = {
        enabled: body.enabled,
        base_url: body.base_url,
        model: body.model,
        api_key_set:
          body.api_key !== undefined && body.api_key !== ""
            ? true
            : current.api_key_set,
        timeout_s: body.timeout_s ?? current.timeout_s,
        max_tokens: body.max_tokens ?? current.max_tokens,
        system_prompt_override:
          body.system_prompt_override ?? current.system_prompt_override,
      };
      return { ...current };
    },
  );
  return api as MockApi;
}

interface PrivateView extends HTMLElement {
  api?: ApiClient;
  updateComplete: Promise<unknown>;
}

async function mount(api: MockApi): Promise<PrivateView> {
  const el = document.createElement("knx-recommend-llm-view") as PrivateView;
  el.api = api;
  document.body.appendChild(el);
  for (let i = 0; i < 6; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
  return el;
}

async function settle(el: PrivateView): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
}

describe("knx-recommend-llm-view (Iter L4.3)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("Default-Render zeigt deaktivierten Toggle und leere Felder", async () => {
    const api = makeApi();
    const el = await mount(api);

    const enabledCheckbox = el.shadowRoot!.querySelector<HTMLInputElement>(
      "#llm-enabled",
    );
    expect(enabledCheckbox?.checked).toBe(false);
    expect(api.getCalls).toBeGreaterThanOrEqual(1);
  });

  it("Configured Settings: Felder gefuellt, API-Key als Platzhalter", async () => {
    const api = makeApi(CONFIGURED_SETTINGS);
    const el = await mount(api);

    const enabled = el.shadowRoot!.querySelector<HTMLInputElement>(
      "#llm-enabled",
    );
    expect(enabled?.checked).toBe(true);
    // API-Key-Anzeige als Placeholder, nicht editierbar
    const apiKeyInput = el.shadowRoot!.querySelector<HTMLInputElement>(
      'input[type="text"][disabled]',
    );
    expect(apiKeyInput).not.toBeNull();
    expect(apiKeyInput?.value ?? "").toContain("Schluessel gespeichert");
  });

  it("Preset-Klick fuellt base_url + model", async () => {
    const api = makeApi();
    const el = await mount(api);

    // Erster Preset-Knopf "OpenAI"
    const presets = Array.from(
      el.shadowRoot!.querySelectorAll<HTMLButtonElement>(
        ".llm-presets button",
      ),
    );
    const openaiBtn = presets.find(
      (b) => b.textContent?.trim() === "OpenAI",
    );
    expect(openaiBtn).toBeDefined();
    openaiBtn!.click();
    await settle(el);

    const baseUrl = el.shadowRoot!.querySelector<HTMLInputElement>(
      'input[type="url"]',
    );
    expect(baseUrl?.value).toBe("https://api.openai.com/v1");
    const model = el.shadowRoot!.querySelector<HTMLInputElement>(
      'input[type="text"]:not([disabled])',
    );
    expect(model?.value).toBe("gpt-4o-mini");
  });

  it("Speichern ohne API-Key-Edit sendet KEIN api_key-Feld", async () => {
    const api = makeApi(CONFIGURED_SETTINGS);
    const el = await mount(api);

    // Speichern-Klick (erster Knopf in .llm-actions)
    const actions = el.shadowRoot!.querySelector(".llm-actions");
    const saveBtn = actions!.querySelectorAll<HTMLButtonElement>("button")[0];
    saveBtn.click();
    await settle(el);

    expect(api.putCalls.length).toBe(1);
    expect(api.putCalls[0].api_key).toBeUndefined();
  });

  it("Klick auf 'Aendern' schaltet API-Key-Feld editierbar", async () => {
    const api = makeApi(CONFIGURED_SETTINGS);
    const el = await mount(api);

    // Aendern-Knopf finden (im API-Key-Row)
    const apiKeyRow = el.shadowRoot!.querySelector(".api-key-row");
    const changeBtn = apiKeyRow!.querySelector<HTMLButtonElement>("button");
    expect(changeBtn?.textContent?.trim()).toBe("Aendern");
    changeBtn!.click();
    await settle(el);

    // Jetzt ist ein password-Input da
    const pw = el.shadowRoot!.querySelector<HTMLInputElement>(
      'input[type="password"]',
    );
    expect(pw).not.toBeNull();
  });

  it("API-Key editieren + Speichern sendet das api_key-Feld", async () => {
    const api = makeApi(CONFIGURED_SETTINGS);
    const el = await mount(api);

    // Aendern-Klick
    const apiKeyRow = el.shadowRoot!.querySelector(".api-key-row");
    const changeBtn = apiKeyRow!.querySelector<HTMLButtonElement>("button");
    changeBtn!.click();
    await settle(el);

    const pw = el.shadowRoot!.querySelector<HTMLInputElement>(
      'input[type="password"]',
    );
    pw!.value = "sk-newkey";
    pw!.dispatchEvent(new Event("input"));
    await settle(el);

    const actions = el.shadowRoot!.querySelector(".llm-actions");
    const saveBtn = actions!.querySelectorAll<HTMLButtonElement>("button")[0];
    saveBtn.click();
    await settle(el);

    expect(api.putCalls.length).toBe(1);
    expect(api.putCalls[0].api_key).toBe("sk-newkey");
  });

  it("Verwerfen laedt Settings neu", async () => {
    const api = makeApi(CONFIGURED_SETTINGS);
    const el = await mount(api);

    const initialCalls = api.getCalls;
    const actions = el.shadowRoot!.querySelector(".llm-actions");
    const cancelBtn = actions!.querySelectorAll<HTMLButtonElement>("button")[1];
    cancelBtn.click();
    await settle(el);

    expect(api.getCalls).toBeGreaterThan(initialCalls);
  });

  it("Aktiv-Toggle zeigt Cost-Warnung", async () => {
    const api = makeApi();
    const el = await mount(api);

    // Toggle aktivieren
    const enabledCheckbox = el.shadowRoot!.querySelector<HTMLInputElement>(
      "#llm-enabled",
    );
    enabledCheckbox!.checked = true;
    enabledCheckbox!.dispatchEvent(new Event("change"));
    await settle(el);

    const warning = el.shadowRoot!.querySelector(".llm-warning");
    expect(warning).not.toBeNull();
    expect(warning?.textContent ?? "").toContain("Kosten");
  });
});
