/**
 * Tests for popup rendering logic.
 * Validates status display, category rendering, profile dropdown,
 * and detail text for all six popup states.
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import {
  buildStatusDetail,
  buildCategoryItems,
  populateProfileSelect,
  renderPopup,
  STATUS_MAP,
} from "@/popup/popup";
import type { PopupTabState } from "@/popup/popup";
import type { ConsentResult } from "@/shared/types";
import type { BadgeState } from "@/shared/messages";
import { PROFILE_LABELS } from "@/shared/categories";

/** Create a minimal ConsentResult for testing. */
function mockResult(overrides: Partial<ConsentResult> = {}): ConsentResult {
  return {
    domain: "example.com",
    cmp: "OneTrust",
    method: "click",
    categoriesAccepted: ["essential", "functional"],
    categoriesRejected: ["analytics", "marketing", "socialMedia"],
    timestamp: Date.now(),
    confidence: "high",
    success: true,
    ...overrides,
  };
}

/** Create minimal DOM elements for renderPopup. */
function createMockElements(): {
  domain: HTMLElement;
  statusSection: HTMLElement;
  statusIcon: HTMLElement;
  statusLabel: HTMLElement;
  statusDetail: HTMLElement;
  categoriesSection: HTMLElement;
  categoriesList: HTMLElement;
} {
  return {
    domain: document.createElement("p"),
    statusSection: document.createElement("section"),
    statusIcon: document.createElement("span"),
    statusLabel: document.createElement("span"),
    statusDetail: document.createElement("span"),
    categoriesSection: document.createElement("section"),
    categoriesList: document.createElement("ul"),
  };
}

describe("STATUS_MAP", () => {
  it("defines all six badge states", () => {
    const states: BadgeState[] = [
      "handled",
      "default",
      "attention",
      "error",
      "disabled",
      "scanning",
    ];
    for (const s of states) {
      expect(STATUS_MAP[s]).toBeDefined();
      expect(STATUS_MAP[s].cssClass).toContain(s);
      expect(STATUS_MAP[s].label).toBeTruthy();
    }
  });

  it("only scanning state uses spinner", () => {
    expect(STATUS_MAP.scanning.isSpinner).toBe(true);
    expect(STATUS_MAP.handled.isSpinner).toBe(false);
    expect(STATUS_MAP.default.isSpinner).toBe(false);
  });

  it("only handled state shows categories", () => {
    expect(STATUS_MAP.handled.showCategories).toBe(true);
    for (const key of Object.keys(STATUS_MAP) as BadgeState[]) {
      if (key !== "handled") {
        expect(STATUS_MAP[key].showCategories).toBe(false);
      }
    }
  });
});

describe("buildStatusDetail", () => {
  it("shows CMP and method for handled state", () => {
    const state: PopupTabState = {
      state: "handled",
      cmp: "OneTrust",
      result: mockResult(),
    };
    const detail = buildStatusDetail(state);
    expect(detail).toContain("CMP: OneTrust");
    expect(detail).toContain("Method: click");
  });

  it("shows method only when no CMP name", () => {
    const state: PopupTabState = {
      state: "handled",
      result: mockResult({ cmp: null }),
    };
    const detail = buildStatusDetail(state);
    expect(detail).not.toContain("CMP:");
    expect(detail).toContain("Method: click");
  });

  it("shows CMP name for attention state", () => {
    const state: PopupTabState = {
      state: "attention",
      cmp: "CookieBot",
    };
    expect(buildStatusDetail(state)).toBe("CMP detected: CookieBot");
  });

  it("shows error message for error state with result", () => {
    const state: PopupTabState = {
      state: "error",
      result: mockResult({ success: false }),
    };
    expect(buildStatusDetail(state)).toBe("Could not apply preferences");
  });

  it("returns empty for default state", () => {
    expect(buildStatusDetail({ state: "default" })).toBe("");
  });

  it("returns empty for scanning state", () => {
    expect(buildStatusDetail({ state: "scanning" })).toBe("");
  });

  it("returns empty for disabled state", () => {
    expect(buildStatusDetail({ state: "disabled" })).toBe("");
  });
});

describe("buildCategoryItems", () => {
  it("returns 4 non-essential categories", () => {
    const items = buildCategoryItems(mockResult());
    expect(items).toHaveLength(4);
    expect(items.map((i) => i.id)).toEqual(["functional", "analytics", "marketing", "socialMedia"]);
  });

  it("marks accepted categories correctly", () => {
    const items = buildCategoryItems(mockResult());
    const functional = items.find((i) => i.id === "functional");
    const analytics = items.find((i) => i.id === "analytics");
    expect(functional?.accepted).toBe(true);
    expect(analytics?.accepted).toBe(false);
  });

  it("uses category labels from metadata", () => {
    const items = buildCategoryItems(mockResult());
    expect(items[0].label).toBe("Functional");
    expect(items[1].label).toBe("Analytics");
    expect(items[2].label).toBe("Marketing");
    expect(items[3].label).toBe("Social Media");
  });
});

describe("populateProfileSelect", () => {
  it("creates options for all profiles", () => {
    const select = document.createElement("select");
    populateProfileSelect(select, "balanced");
    const profileCount = Object.keys(PROFILE_LABELS).length;
    expect(select.options.length).toBe(profileCount);
  });

  it("sets the correct option as selected", () => {
    const select = document.createElement("select");
    populateProfileSelect(select, "privacy-max");
    expect(select.value).toBe("privacy-max");
  });

  it("clears existing options before populating", () => {
    const select = document.createElement("select");
    const dummy = document.createElement("option");
    dummy.value = "old";
    select.appendChild(dummy);
    populateProfileSelect(select, "balanced");
    expect(select.querySelector("[value='old']")).toBeNull();
  });
});

describe("renderPopup", () => {
  it("renders handled state with categories", () => {
    const elements = createMockElements();
    const tabState: PopupTabState = {
      state: "handled",
      domain: "example.com",
      cmp: "OneTrust",
      result: mockResult(),
    };
    renderPopup(tabState, elements);
    expect(elements.statusSection.className).toContain("status-handled");
    expect(elements.statusLabel.textContent).toBe("Consent handled");
    expect(elements.categoriesSection.classList.contains("hidden")).toBe(false);
    expect(elements.categoriesList.children.length).toBe(4);
  });

  it("renders default state without categories", () => {
    const elements = createMockElements();
    renderPopup({ state: "default", domain: "test.com" }, elements);
    expect(elements.statusSection.className).toContain("status-default");
    expect(elements.statusLabel.textContent).toBe("No popup detected");
    expect(elements.categoriesSection.classList.contains("hidden")).toBe(true);
  });

  it("renders scanning state with spinner", () => {
    const elements = createMockElements();
    renderPopup({ state: "scanning", domain: "test.com" }, elements);
    expect(elements.statusSection.className).toContain("status-scanning");
    const spinner = elements.statusIcon.querySelector(".spinner-icon");
    expect(spinner).not.toBeNull();
  });

  it("sets domain text", () => {
    const elements = createMockElements();
    renderPopup({ state: "default", domain: "test.com" }, elements);
    expect(elements.domain.textContent).toBe("test.com");
  });

  it("shows Unknown when no domain", () => {
    const elements = createMockElements();
    renderPopup({ state: "default" }, elements);
    expect(elements.domain.textContent).toBe("Unknown");
  });

  it("hides categories for error state", () => {
    const elements = createMockElements();
    renderPopup({ state: "error", domain: "err.com" }, elements);
    expect(elements.categoriesSection.classList.contains("hidden")).toBe(true);
  });

  it("renders category items with accessible text", () => {
    const elements = createMockElements();
    const tabState: PopupTabState = {
      state: "handled",
      domain: "example.com",
      result: mockResult(),
    };
    renderPopup(tabState, elements);
    const items = elements.categoriesList.querySelectorAll("li");
    expect(items.length).toBe(4);
    const firstText = items[0].querySelector("span:last-child");
    expect(firstText?.textContent).toContain("Accepted");
  });
});
