/**
 * Tests for options page rendering and interaction logic.
 * Validates profile selector, category toggles, info expandos,
 * tab switching, and storage persistence.
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeMock, type StorageAreaMock } from "./helpers/chrome-storage-mock";
import {
  activateTab,
  buildCategoryList,
  detectProfile,
  handleInfoToggle,
  handleToggle,
  populateProfileSelect,
  syncToggles,
} from "@/options/options";
import { CATEGORY_IDS, PROFILE_LABELS, PROFILE_PRESETS } from "@/shared/categories";
import type { UserPreferences } from "@/shared/types";

let syncMock: StorageAreaMock;

/** Default balanced preferences. */
function balancedPrefs(): UserPreferences {
  return { ...PROFILE_PRESETS["balanced"] };
}

/** Create a minimal tab + panel DOM for testing. */
function createTabDom(): void {
  document.body.textContent = "";
  const nav = document.createElement("nav");
  nav.setAttribute("role", "tablist");

  const tabs = ["tab-preferences", "tab-overrides", "tab-advanced", "tab-statistics", "tab-about"];
  const panels = [
    "panel-preferences",
    "panel-overrides",
    "panel-advanced",
    "panel-statistics",
    "panel-about",
  ];

  for (const id of tabs) {
    const btn = document.createElement("button");
    btn.setAttribute("role", "tab");
    btn.id = id;
    btn.setAttribute("aria-selected", id === "tab-preferences" ? "true" : "false");
    nav.appendChild(btn);
  }
  document.body.appendChild(nav);

  for (let i = 0; i < panels.length; i++) {
    const div = document.createElement("div");
    div.setAttribute("role", "tabpanel");
    div.id = panels[i];
    if (i > 0) div.setAttribute("hidden", "");
    document.body.appendChild(div);
  }
}

beforeEach(() => {
  const mocks = installChromeMock();
  syncMock = mocks.syncMock;
  document.body.textContent = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("populateProfileSelect", () => {
  it("creates options for all profiles", () => {
    const select = document.createElement("select");
    populateProfileSelect(select, "balanced");
    expect(select.options.length).toBe(Object.keys(PROFILE_LABELS).length);
  });

  it("sets the correct option as selected", () => {
    const select = document.createElement("select");
    populateProfileSelect(select, "privacy-max");
    expect(select.value).toBe("privacy-max");
  });

  it("clears existing options before populating", () => {
    const select = document.createElement("select");
    const old = document.createElement("option");
    old.value = "old";
    select.appendChild(old);
    populateProfileSelect(select, "balanced");
    expect(select.querySelector("[value='old']")).toBeNull();
  });
});

describe("detectProfile", () => {
  it("detects privacy-max profile", () => {
    expect(detectProfile(PROFILE_PRESETS["privacy-max"])).toBe("privacy-max");
  });

  it("detects balanced profile", () => {
    expect(detectProfile(PROFILE_PRESETS["balanced"])).toBe("balanced");
  });

  it("detects accept-all profile", () => {
    expect(detectProfile(PROFILE_PRESETS["accept-all"])).toBe("accept-all");
  });

  it("returns custom for non-matching preferences", () => {
    const custom: UserPreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      socialMedia: false,
    };
    expect(detectProfile(custom)).toBe("custom");
  });
});

describe("buildCategoryList", () => {
  it("creates items for all 5 categories", () => {
    const container = document.createElement("div");
    buildCategoryList(container, balancedPrefs());
    const items = container.querySelectorAll(".category-item");
    expect(items.length).toBe(5);
  });

  it("sets correct aria-checked for each toggle", () => {
    const container = document.createElement("div");
    const prefs = balancedPrefs();
    buildCategoryList(container, prefs);
    for (const id of CATEGORY_IDS) {
      const toggle = container.querySelector(`#toggle-${id}`);
      expect(toggle?.getAttribute("aria-checked")).toBe(String(prefs[id]));
    }
  });

  it("disables the essential toggle", () => {
    const container = document.createElement("div");
    buildCategoryList(container, balancedPrefs());
    const essential = container.querySelector("#toggle-essential") as HTMLButtonElement;
    expect(essential.disabled).toBe(true);
    expect(essential.getAttribute("aria-disabled")).toBe("true");
  });

  it("does not disable non-essential toggles", () => {
    const container = document.createElement("div");
    buildCategoryList(container, balancedPrefs());
    const functional = container.querySelector("#toggle-functional") as HTMLButtonElement;
    expect(functional.disabled).toBe(false);
  });

  it("creates info panels with aria-hidden", () => {
    const container = document.createElement("div");
    buildCategoryList(container, balancedPrefs());
    const panels = container.querySelectorAll(".info-panel");
    expect(panels.length).toBe(5);
    panels.forEach((p) => {
      expect(p.getAttribute("aria-hidden")).toBe("true");
    });
  });

  it("creates info buttons with aria-expanded=false", () => {
    const container = document.createElement("div");
    buildCategoryList(container, balancedPrefs());
    const btns = container.querySelectorAll(".info-btn");
    expect(btns.length).toBe(5);
    btns.forEach((b) => {
      expect(b.getAttribute("aria-expanded")).toBe("false");
    });
  });
});

describe("handleToggle", () => {
  it("toggles a category and saves to storage", async () => {
    const select = document.createElement("select");
    const prefs = balancedPrefs();
    populateProfileSelect(select, "balanced");

    const updated = await handleToggle("analytics", prefs, select);
    expect(updated.analytics).toBe(true);
    expect(syncMock.set).toHaveBeenCalled();
  });

  it("switches profile to custom when toggling breaks preset", async () => {
    const select = document.createElement("select");
    const prefs: UserPreferences = { ...PROFILE_PRESETS["accept-all"] };
    populateProfileSelect(select, "accept-all");

    const updated = await handleToggle("marketing", prefs, select);
    expect(updated.marketing).toBe(false);
    expect(select.value).toBe("custom");
  });

  it("does not toggle essential category", async () => {
    const select = document.createElement("select");
    const prefs = balancedPrefs();
    const result = await handleToggle("essential", prefs, select);
    expect(result).toBe(prefs);
    expect(syncMock.set).not.toHaveBeenCalled();
  });
});

describe("handleInfoToggle", () => {
  it("toggles aria-expanded on info button", () => {
    const container = document.createElement("div");
    buildCategoryList(container, balancedPrefs());
    document.body.appendChild(container);

    const btn = container.querySelector(".info-btn") as HTMLButtonElement;
    expect(btn.getAttribute("aria-expanded")).toBe("false");

    handleInfoToggle(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");

    const panelId = btn.getAttribute("aria-controls")!;
    const panel = document.getElementById(panelId)!;
    expect(panel.getAttribute("aria-hidden")).toBe("false");

    handleInfoToggle(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(panel.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("syncToggles", () => {
  it("updates all toggle aria-checked values", () => {
    const container = document.createElement("div");
    buildCategoryList(container, balancedPrefs());
    document.body.appendChild(container);

    const allOn: UserPreferences = { ...PROFILE_PRESETS["accept-all"] };
    syncToggles(allOn);

    for (const id of CATEGORY_IDS) {
      const toggle = document.getElementById(`toggle-${id}`);
      expect(toggle?.getAttribute("aria-checked")).toBe("true");
    }
  });
});

describe("activateTab", () => {
  it("shows the selected panel and hides others", () => {
    createTabDom();
    activateTab("tab-advanced");

    const advanced = document.getElementById("panel-advanced");
    const prefs = document.getElementById("panel-preferences");
    expect(advanced?.hasAttribute("hidden")).toBe(false);
    expect(prefs?.hasAttribute("hidden")).toBe(true);
  });

  it("sets aria-selected on active tab only", () => {
    createTabDom();
    activateTab("tab-statistics");

    const stats = document.getElementById("tab-statistics");
    const prefs = document.getElementById("tab-preferences");
    expect(stats?.getAttribute("aria-selected")).toBe("true");
    expect(prefs?.getAttribute("aria-selected")).toBe("false");
  });

  it("sets tabindex 0 on active, -1 on others", () => {
    createTabDom();
    activateTab("tab-about");

    const about = document.getElementById("tab-about");
    const prefs = document.getElementById("tab-preferences");
    expect(about?.getAttribute("tabindex")).toBe("0");
    expect(prefs?.getAttribute("tabindex")).toBe("-1");
  });
});
