import { describe, it, expect } from "vitest";
import { categorizeAction } from "../src/components/audit-view.js";

describe("categorizeAction", () => {
  it("erkennt Create-Aktionen (knx_upsert, webhook_create, csv_import)", () => {
    expect(categorizeAction("knx_upsert")).toBe("create");
    expect(categorizeAction("webhook_create")).toBe("create");
    expect(categorizeAction("knx_csv_import")).toBe("create");
    expect(categorizeAction("knx_address_add")).toBe("create");
  });

  it("erkennt Delete-Aktionen", () => {
    expect(categorizeAction("knx_address_delete")).toBe("delete");
    expect(categorizeAction("webhook_remove")).toBe("delete");
  });

  it("erkennt Update-Aktionen", () => {
    expect(categorizeAction("webhook_update")).toBe("update");
    expect(categorizeAction("knx_set_severity")).toBe("update");
  });

  it("erkennt Status-Aenderungen (ack, toggle, enable/disable)", () => {
    expect(categorizeAction("message_ack")).toBe("status");
    expect(categorizeAction("knx_toggle_log")).toBe("status");
    expect(categorizeAction("webhook_enable")).toBe("status");
    expect(categorizeAction("status_change")).toBe("status");
  });

  it("liefert 'other' fuer unbekannte Aktionen", () => {
    expect(categorizeAction("backup")).toBe("other");
    expect(categorizeAction("xyz")).toBe("other");
  });
});
