/**
 * Tests for options page initialization, tab navigation events,
 * and category toggle/info keyboard handlers.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { installChromeMock } from "./helpers/chrome-storage-mock";
import {
  activateTab,
  buildCategoryList,
  detectProfile,
  handleToggle,
  initTabs,
  populateProfileSelect,
  syncToggles,
} from "@/options/options";
import { CATEGORY_IDS, PROFILE_PRESETS } from "@/shared/categories";
import type { UserPreferences } from "@/shared/types";

function createFullOptionsDom(): void {
  document.body.textContent = "";

  const nav = document.createElement("nav");
  nav.setAttribute("role", "tablist");

  const tabIds = [
    "tab-preferences",
    "tab-overrides",
    "tab-advanced",
    "tab-statistics",
    "tab-about",
  ];
  for (const id of tabIds) {
    const btn = document.createElement("button");
    btn.setAttribute("role", "tab");
    btn.id = id;
    btn.setAttribute("aria-selected", id === "tab-preferences" ? "true" : "false");
    btn.setAttribute("tabindex", id === "tab-preferences" ? "0" : "-1");
    nav.appendChild(btn);
  }
  document.body.appendChild(nav);

  const panelIds = [
    "panel-preferences",
    "panel-overrides",
    "panel-advanced",
    "panel-statistics",
    "panel-about",
  ];
  for (let i = 0; i < panelIds.length; i++) {
    const div = document.createElement("div");
    div.setAttribute("role", "tabpanel");
    div.id = panelIds[i];
    if (i > 0) div.setAttribute("hidden", "");
    document.body.appendChild(div);
  }
}

beforeEach(() => {
  installChromeMock();
  document.body.textContent = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("initTabs — tab click navigation", () => {
  it("clicking a tab activates it and shows its panel", () => {
    createFullOptionsDom();
    initTabs();

    const tab = document.getElementById("tab-advanced")!;
    tab.click();

    expect(tab.getAttribute("aria-selected")).toBe("true");
    const panel = document.getElementById("panel-advanced")!;
    expect(panel.hasAttribute("hidden")).toBe(false);

    const prefsPanel = document.getElementById("panel-preferences")!;
    expect(prefsPanel.hasAttribute("hidden")).toBe(true);
  });
});

describe("initTabs — keyboard navigation", () => {
  it("ArrowRight moves focus to next tab", () => {
    createFullOptionsDom();
    initTabs();

    const tablist = document.querySelector("[role='tablist']")!;
    const firstTab = document.getElementById("tab-preferences")!;
    firstTab.focus();

    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    });
    tablist.dispatchEvent(event);

    const secondTab = document.getElementById("tab-overrides")!;
    expect(secondTab.getAttribute("aria-selected")).toBe("true");
  });

  it("ArrowLeft wraps around to last tab", () => {
    createFullOptionsDom();
    initTabs();

    const tablist = document.querySelector("[role='tablist']")!;
    const firstTab = document.getElementById("tab-preferences")!;
    firstTab.focus();

    const event = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
    });
    tablist.dispatchEvent(event);

    const lastTab = document.getElementById("tab-about")!;
    expect(lastTab.getAttribute("aria-selected")).toBe("true");
  });

  it("Home key activates first tab", () => {
    createFullOptionsDom();
    initTabs();

    // Start on a non-first tab
    activateTab("tab-statistics");
    const statsTab = document.getElementById("tab-statistics")!;
    statsTab.focus();

    const tablist = document.querySelector("[role='tablist']")!;
    const event = new KeyboardEvent("keydown", {
      key: "Home",
      bubbles: true,
    });
    tablist.dispatchEvent(event);

    const firstTab = document.getElementById("tab-preferences")!;
    expect(firstTab.getAttribute("aria-selected")).toBe("true");
  });

  it("End key activates last tab", () => {
    createFullOptionsDom();
    initTabs();

    const firstTab = document.getElementById("tab-preferences")!;
    firstTab.focus();

    const tablist = document.querySelector("[role='tablist']")!;
    const event = new KeyboardEvent("keydown", {
      key: "End",
      bubbles: true,
    });
    tablist.dispatchEvent(event);

    const lastTab = document.getElementById("tab-about")!;
    expect(lastTab.getAttribute("aria-selected")).toBe("true");
  });
});

describe("Category toggle via keyboard", () => {
  it("handleToggle toggles functional category", async () => {
    const select = document.createElement("select");
    const prefs: UserPreferences = { ...PROFILE_PRESETS["balanced"] };
    populateProfileSelect(select, "balanced");

    const updated = await handleToggle("functional", prefs, select);
    expect(updated.functional).toBe(!prefs.functional);
  });

  it("handleToggle on accept-all breaks to custom profile", async () => {
    const select = document.createElement("select");
    const prefs: UserPreferences = { ...PROFILE_PRESETS["accept-all"] };
    populateProfileSelect(select, "accept-all");

    const updated = await handleToggle("analytics", prefs, select);
    expect(updated.analytics).toBe(false);
    expect(detectProfile(updated)).toBe("custom");
  });
});

describe("syncToggles updates DOM state", () => {
  it("syncs all category toggles to new preferences", () => {
    const container = document.createElement("div");
    const prefs: UserPreferences = { ...PROFILE_PRESETS["balanced"] };
    buildCategoryList(container, prefs);
    document.body.appendChild(container);

    const allOn: UserPreferences = { ...PROFILE_PRESETS["accept-all"] };
    syncToggles(allOn);

    for (const id of CATEGORY_IDS) {
      const toggle = document.getElementById(`toggle-${id}`);
      expect(toggle?.getAttribute("aria-checked")).toBe("true");
    }

    const allOff: UserPreferences = { ...PROFILE_PRESETS["privacy-max"] };
    syncToggles(allOff);

    for (const id of CATEGORY_IDS) {
      if (id === "essential") continue;
      const toggle = document.getElementById(`toggle-${id}`);
      expect(toggle?.getAttribute("aria-checked")).toBe("false");
    }
  });
});

describe("detectProfile matches known presets", () => {
  it("returns balanced for balanced preferences", () => {
    expect(detectProfile(PROFILE_PRESETS["balanced"])).toBe("balanced");
  });

  it("returns custom for mixed non-preset preferences", () => {
    const custom: UserPreferences = {
      essential: true,
      functional: false,
      analytics: true,
      marketing: false,
      socialMedia: true,
    };
    expect(detectProfile(custom)).toBe("custom");
  });
});
