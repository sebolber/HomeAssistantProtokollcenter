import { describe, it, expect, vi } from "vitest";
import "../src/components/message-table.js";
import type { MessageTable } from "../src/components/message-table.js";
import type { MessageDto } from "../src/api-client.js";

function makeMsg(overrides: Partial<MessageDto> = {}): MessageDto {
  return {
    id: 1,
    timestamp: "2026-05-01T20:00:00Z",
    severity: "info",
    source: "test.source",
    text: "hello",
    metadata: null,
    webhook_id: null,
    ...overrides,
  };
}

async function mountTable(items: MessageDto[]): Promise<MessageTable> {
  const el = document.createElement("message-table") as MessageTable;
  el.items = items;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe("message-table severity inline edit", () => {
  it("rendert die Severity-Pille als klickbaren Button mit Trigger-Klasse", async () => {
    const el = await mountTable([makeMsg({ id: 42, severity: "info" })]);
    const trigger = el.shadowRoot!.querySelector("button.sev-trigger");
    expect(trigger).not.toBeNull();
    expect(trigger!.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger!.getAttribute("aria-expanded")).toBe("false");
    el.remove();
  });

  it("oeffnet das Popover nach Click auf die Severity-Pille", async () => {
    const el = await mountTable([makeMsg({ id: 7, severity: "warning" })]);
    const trigger = el.shadowRoot!.querySelector("button.sev-trigger") as HTMLButtonElement;
    trigger.click();
    await el.updateComplete;

    const popover = el.shadowRoot!.querySelector(".sev-popover");
    expect(popover).not.toBeNull();

    const options = el.shadowRoot!.querySelectorAll(".sev-option");
    expect(options.length).toBe(4);
  });

  it("hindert die Row daran, den Detail-Dialog zu oeffnen (stopPropagation)", async () => {
    const el = await mountTable([makeMsg({ id: 99 })]);
    const onSelect = vi.fn();
    el.addEventListener("select", onSelect);

    const trigger = el.shadowRoot!.querySelector("button.sev-trigger") as HTMLButtonElement;
    trigger.click();
    await el.updateComplete;

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("emittiert severity-change beim Click auf eine andere Severity-Option", async () => {
    const el = await mountTable([makeMsg({ id: 5, severity: "info" })]);
    const onChange = vi.fn();
    el.addEventListener("severity-change", (e) => onChange((e as CustomEvent).detail));

    const trigger = el.shadowRoot!.querySelector("button.sev-trigger") as HTMLButtonElement;
    trigger.click();
    await el.updateComplete;

    // "error"-Option (erste in SEVERITY_OPTIONS-Reihenfolge)
    const errorOption = el.shadowRoot!.querySelectorAll(".sev-option")[0] as HTMLButtonElement;
    errorOption.click();
    await el.updateComplete;

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ id: 5, severity: "error", previous: "info" });
  });

  it("schliesst das Popover ohne Event, wenn die aktuelle Severity gewaehlt wird", async () => {
    const el = await mountTable([makeMsg({ id: 12, severity: "warning" })]);
    const onChange = vi.fn();
    el.addEventListener("severity-change", onChange);

    const trigger = el.shadowRoot!.querySelector("button.sev-trigger") as HTMLButtonElement;
    trigger.click();
    await el.updateComplete;

    // "warning"-Option ist aktiv
    const warningOption = el.shadowRoot!.querySelector(
      ".sev-option.active"
    ) as HTMLButtonElement;
    expect(warningOption).not.toBeNull();
    warningOption.click();
    await el.updateComplete;

    expect(onChange).not.toHaveBeenCalled();
    // Popover ist zu
    expect(el.shadowRoot!.querySelector(".sev-popover")).toBeNull();
  });

  it("schliesst das Popover beim Click auf den Backdrop", async () => {
    const el = await mountTable([makeMsg({ id: 1 })]);
    const trigger = el.shadowRoot!.querySelector("button.sev-trigger") as HTMLButtonElement;
    trigger.click();
    await el.updateComplete;

    const backdrop = el.shadowRoot!.querySelector(".popover-backdrop") as HTMLElement;
    expect(backdrop).not.toBeNull();
    backdrop.click();
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector(".sev-popover")).toBeNull();
  });
});
