/**
 * Tests for options page tabs 2-5: Site Overrides, Advanced, Statistics, About.
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeMock, type StorageAreaMock } from "./helpers/chrome-storage-mock";
import {
  initOverrides,
  openAddModal,
  renderOverridesTable,
  saveOverride,
  syncCustomPrefsVisibility,
} from "@/options/options-overrides";
import { buildAdvancedPanel, initAdvanced } from "@/options/options-advanced";
import { renderStats } from "@/options/options-stats";
import { buildAboutPanel } from "@/options/options-about";
import type { ExtensionStats } from "@/shared/types";
import { DEFAULT_SETTINGS } from "@/shared/storage";

let syncMock: StorageAreaMock;

/** Build minimal DOM for overrides tab using safe DOM methods. */
function createOverridesDom(): void {
  document.body.textContent = "";

  const addBtn = document.createElement("button");
  addBtn.id = "add-override";
  document.body.appendChild(addBtn);

  const table = document.createElement("table");
  table.id = "overrides-table";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const text of ["Domain", "Mode", "Actions"]) {
    const th = document.createElement("th");
    th.textContent = text;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  document.body.appendChild(table);

  const dialog = document.createElement("dialog");
  dialog.id = "override-modal";
  const form = document.createElement("form");
  form.method = "dialog";

  const domainInput = document.createElement("input");
  domainInput.type = "text";
  domainInput.id = "override-domain";
  form.appendChild(domainInput);

  const modeSelect = document.createElement("select");
  modeSelect.id = "override-mode";
  for (const val of ["whitelist", "blacklist", "custom", "disabled"]) {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    modeSelect.appendChild(opt);
  }
  form.appendChild(modeSelect);

  const customPrefs = document.createElement("div");
  customPrefs.id = "custom-prefs";
  customPrefs.hidden = true;
  form.appendChild(customPrefs);

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Save";
  form.appendChild(submitBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.id = "cancel-override";
  cancelBtn.textContent = "Cancel";
  form.appendChild(cancelBtn);

  dialog.appendChild(form);
  document.body.appendChild(dialog);

  // jsdom does not support showModal/close natively
  if (!dialog.showModal) {
    dialog.showModal = vi.fn(() => {
      dialog.setAttribute("open", "");
    });
    dialog.close = vi.fn(() => {
      dialog.removeAttribute("open");
    });
  }
}

/** Build minimal DOM for advanced tab. */
function createAdvancedDom(): void {
  document.body.textContent = "";
  const panel = document.createElement("div");
  panel.id = "panel-advanced";
  document.body.appendChild(panel);
}

beforeEach(() => {
  const mocks = installChromeMock();
  syncMock = mocks.syncMock;
  document.body.textContent = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

// -- Site Overrides (Tab 2) ------------------------------------------------

describe("Site Overrides", () => {
  it("renders empty table when no overrides exist", async () => {
    createOverridesDom();
    await renderOverridesTable();
    const tbody = document.querySelector("#overrides-table tbody");
    expect(tbody?.textContent).toContain("No site overrides");
  });

  it("renders override rows from storage", async () => {
    syncMock.set({
      domainOverrides: {
        "example.com": { mode: "whitelist" },
        "test.org": { mode: "blacklist" },
      },
    });
    createOverridesDom();
    await renderOverridesTable();
    const rows = document.querySelectorAll("#overrides-table tbody tr");
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain("example.com");
    expect(rows[0].textContent).toContain("Accept All");
    expect(rows[1].textContent).toContain("test.org");
    expect(rows[1].textContent).toContain("Reject All");
  });

  it("opens add modal and saves new override", async () => {
    createOverridesDom();
    await initOverrides();
    openAddModal();

    const domainInput = document.getElementById("override-domain") as HTMLInputElement;
    const modeSelect = document.getElementById("override-mode") as HTMLSelectElement;
    domainInput.value = "new-site.com";
    modeSelect.value = "blacklist";

    await saveOverride();
    expect(syncMock.set).toHaveBeenCalled();
    const lastCall = syncMock.set.mock.calls.at(-1)?.[0];
    expect(lastCall?.domainOverrides?.["new-site.com"]).toEqual({ mode: "blacklist" });
  });

  it("delete button removes override from storage", async () => {
    syncMock.set({
      domainOverrides: { "del.com": { mode: "disabled" } },
    });
    createOverridesDom();
    await renderOverridesTable();

    const deleteBtn = document.querySelector(".btn-danger") as HTMLButtonElement;
    expect(deleteBtn).not.toBeNull();
    deleteBtn.click();

    // Wait for async handlers
    await new Promise((r) => setTimeout(r, 50));
    const store = syncMock._store();
    const overrides = store.domainOverrides as Record<string, unknown> | undefined;
    expect(overrides?.["del.com"]).toBeUndefined();
  });

  it("syncCustomPrefsVisibility shows custom prefs when mode=custom", () => {
    createOverridesDom();
    const modeSelect = document.getElementById("override-mode") as HTMLSelectElement;
    const customPrefs = document.getElementById("custom-prefs") as HTMLElement;

    modeSelect.value = "custom";
    syncCustomPrefsVisibility();
    expect(customPrefs.hidden).toBe(false);

    modeSelect.value = "whitelist";
    syncCustomPrefsVisibility();
    expect(customPrefs.hidden).toBe(true);
  });
});

// -- Advanced Settings (Tab 3) ---------------------------------------------

describe("Advanced Settings", () => {
  it("builds toggle elements for all settings", () => {
    const container = document.createElement("div");
    buildAdvancedPanel(container, { ...DEFAULT_SETTINGS });

    const toggles = container.querySelectorAll(".toggle-switch");
    // 6 boolean toggles
    expect(toggles.length).toBe(6);
  });

  it("renders consent delay slider with correct value", () => {
    const container = document.createElement("div");
    buildAdvancedPanel(container, { ...DEFAULT_SETTINGS, consentDelay: 1000 });

    const slider = container.querySelector("#setting-consentDelay") as HTMLInputElement;
    expect(slider).not.toBeNull();
    expect(slider.value).toBe("1000");

    const label = container.querySelector("#delay-value");
    expect(label?.textContent).toBe("1000ms");
  });

  it("toggles persist to storage on click", async () => {
    createAdvancedDom();
    await initAdvanced();

    const toggle = document.getElementById("setting-autoConsent") as HTMLButtonElement;
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute("aria-checked")).toBe("true");

    toggle.click();
    // Wait for async handler
    await new Promise((r) => setTimeout(r, 50));
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(syncMock.set).toHaveBeenCalled();
  });

  it("slider updates display and persists", async () => {
    createAdvancedDom();
    await initAdvanced();

    const slider = document.getElementById("setting-consentDelay") as HTMLInputElement;
    const display = document.getElementById("delay-value") as HTMLElement;

    // Simulate input event
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(slider, "1200");
    slider.dispatchEvent(new Event("input"));

    await new Promise((r) => setTimeout(r, 50));
    expect(display.textContent).toBe("1200ms");
    expect(syncMock.set).toHaveBeenCalled();
  });
});

// -- Statistics (Tab 4) ----------------------------------------------------

describe("Statistics", () => {
  const sampleStats: ExtensionStats = {
    popupsHandled: 42,
    popupsByMethod: { click: 25, autoconsent: 15, api: 2 },
    popupsByCmp: { OneTrust: 20, Cookiebot: 12, unknown: 10 },
    firstInstall: Date.now() - 86400000,
  };

  it("renders total popups handled", () => {
    const container = document.createElement("div");
    renderStats(container, sampleStats);
    const total = container.querySelector("#stat-total");
    expect(total?.textContent).toBe("42");
  });

  it("renders method breakdown items", () => {
    const container = document.createElement("div");
    renderStats(container, sampleStats);
    const methodItems = container.querySelectorAll("#stats-by-method .breakdown-item");
    expect(methodItems.length).toBe(3);
  });

  it("renders CMP breakdown items", () => {
    const container = document.createElement("div");
    renderStats(container, sampleStats);
    const cmpItems = container.querySelectorAll("#stats-by-cmp .breakdown-item");
    expect(cmpItems.length).toBe(3);
  });

  it("shows empty message when no data", () => {
    const container = document.createElement("div");
    renderStats(container, {
      popupsHandled: 0,
      popupsByMethod: {},
      popupsByCmp: {},
      firstInstall: 0,
    });
    const empties = container.querySelectorAll(".empty-message");
    expect(empties.length).toBe(2);
  });

  it("formats numbers with locale separators", () => {
    const container = document.createElement("div");
    renderStats(container, { ...sampleStats, popupsHandled: 1234 });
    const total = container.querySelector("#stat-total");
    // toLocaleString varies by locale; just check it contains 1234 digits
    expect(total?.textContent).toMatch(/1[,.]?234/);
  });
});

// -- About (Tab 5) ---------------------------------------------------------

describe("About", () => {
  it("renders version title", () => {
    const container = document.createElement("div");
    buildAboutPanel(container);
    const title = container.querySelector("#about-title");
    expect(title?.textContent).toContain("NoCookie");
    expect(title?.textContent).toContain("v0.1.0");
  });

  it("renders tagline", () => {
    const container = document.createElement("div");
    buildAboutPanel(container);
    const tagline = container.querySelector(".about-tagline");
    expect(tagline?.textContent).toContain("Set cookie preferences once");
  });

  it("renders links with target=_blank", () => {
    const container = document.createElement("div");
    buildAboutPanel(container);
    const links = container.querySelectorAll(".about-links a");
    expect(links.length).toBeGreaterThanOrEqual(2);
    links.forEach((a) => {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toContain("noopener");
    });
  });
});
