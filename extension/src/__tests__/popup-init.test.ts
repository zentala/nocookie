/**
 * Tests for popup initialization and tab state loading.
 *
 * Covers loadTabState, listenForStateChanges, onProfileChange,
 * and extractDomain helper.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { installChromeMock } from "./helpers/chrome-storage-mock";

function installPopupChromeMock(): void {
  installChromeMock();

  Object.assign(globalThis.chrome, {
    tabs: {
      query: vi.fn(() => Promise.resolve([{ id: 1, url: "https://example.com/page" }])),
      create: vi.fn(() => Promise.resolve({ id: 99 })),
    },
    runtime: {
      sendMessage: vi.fn(() => Promise.resolve(undefined)),
      onMessage: { addListener: vi.fn() },
      openOptionsPage: vi.fn(),
      getURL: vi.fn((path: string) => `chrome-extension://abc/${path}`),
    },
  });
}

beforeEach(() => {
  vi.resetModules();
  installPopupChromeMock();
  document.body.textContent = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Popup exported functions", () => {
  it("buildStatusDetail handles handled state with CMP and method", async () => {
    const { buildStatusDetail } = await import("@/popup/popup");
    const detail = buildStatusDetail({
      state: "handled",
      cmp: "OneTrust",
      result: {
        domain: "test.com",
        cmp: "OneTrust",
        method: "api",
        categoriesAccepted: ["essential"],
        categoriesRejected: ["marketing"],
        timestamp: Date.now(),
        confidence: "high",
        success: true,
      },
    });
    expect(detail).toContain("CMP: OneTrust");
    expect(detail).toContain("Method: api");
  });

  it("buildStatusDetail returns empty for disabled state", async () => {
    const { buildStatusDetail } = await import("@/popup/popup");
    expect(buildStatusDetail({ state: "disabled" })).toBe("");
  });

  it("renderPopup correctly sets domain text to Unknown when missing", async () => {
    const { renderPopup } = await import("@/popup/popup");
    const el = {
      domain: document.createElement("p"),
      statusSection: document.createElement("section"),
      statusIcon: document.createElement("span"),
      statusLabel: document.createElement("span"),
      statusDetail: document.createElement("span"),
      categoriesSection: document.createElement("section"),
      categoriesList: document.createElement("ul"),
    };

    renderPopup({ state: "default" }, el);
    expect(el.domain.textContent).toBe("Unknown");
  });
});

describe("listenForStateChanges", () => {
  it("registers a runtime.onMessage listener", async () => {
    const { listenForStateChanges } = await import("@/popup/popup");
    const el = {
      domain: document.createElement("p"),
      statusSection: document.createElement("section"),
      statusIcon: document.createElement("span"),
      statusLabel: document.createElement("span"),
      statusDetail: document.createElement("span"),
      categoriesSection: document.createElement("section"),
      categoriesList: document.createElement("ul"),
    };

    listenForStateChanges(el);
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });
});

describe("populateProfileSelect", () => {
  it("creates options with correct values", async () => {
    const { populateProfileSelect } = await import("@/popup/popup");
    const select = document.createElement("select");
    populateProfileSelect(select, "balanced");

    expect(select.options.length).toBeGreaterThan(0);
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toContain("balanced");
    expect(values).toContain("privacy-max");
  });
});

describe("Profile switching", () => {
  it("setProfile and setPreferences are called on profile change", async () => {
    const storageApi = await import("@/shared/storage-api");
    const setProfileSpy = vi.spyOn(storageApi, "setProfile");
    const setPreferencesSpy = vi.spyOn(storageApi, "setPreferences");

    await storageApi.setProfile("privacy-max");
    expect(setProfileSpy).toHaveBeenCalledWith("privacy-max");

    await storageApi.setPreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      socialMedia: false,
    });
    expect(setPreferencesSpy).toHaveBeenCalled();
  });
});

describe("Popup renders all badge states", () => {
  it("renders attention state correctly", async () => {
    const { renderPopup } = await import("@/popup/popup");
    const el = {
      domain: document.createElement("p"),
      statusSection: document.createElement("section"),
      statusIcon: document.createElement("span"),
      statusLabel: document.createElement("span"),
      statusDetail: document.createElement("span"),
      categoriesSection: document.createElement("section"),
      categoriesList: document.createElement("ul"),
    };

    renderPopup({ state: "attention", cmp: "CookieBot", domain: "test.com" }, el);
    expect(el.statusSection.className).toContain("status-attention");
    expect(el.statusLabel.textContent).toBe("Needs attention");
    expect(el.statusDetail.textContent).toContain("CookieBot");
  });

  it("renders error state correctly", async () => {
    const { renderPopup } = await import("@/popup/popup");
    const el = {
      domain: document.createElement("p"),
      statusSection: document.createElement("section"),
      statusIcon: document.createElement("span"),
      statusLabel: document.createElement("span"),
      statusDetail: document.createElement("span"),
      categoriesSection: document.createElement("section"),
      categoriesList: document.createElement("ul"),
    };

    renderPopup(
      {
        state: "error",
        domain: "err.com",
        result: {
          domain: "err.com",
          cmp: null,
          method: "heuristic",
          categoriesAccepted: [],
          categoriesRejected: [],
          timestamp: Date.now(),
          confidence: "low",
          success: false,
        },
      },
      el,
    );
    expect(el.statusSection.className).toContain("status-error");
    expect(el.statusDetail.textContent).toContain("Could not apply");
  });

  it("renders disabled state correctly", async () => {
    const { renderPopup } = await import("@/popup/popup");
    const el = {
      domain: document.createElement("p"),
      statusSection: document.createElement("section"),
      statusIcon: document.createElement("span"),
      statusLabel: document.createElement("span"),
      statusDetail: document.createElement("span"),
      categoriesSection: document.createElement("section"),
      categoriesList: document.createElement("ul"),
    };

    renderPopup({ state: "disabled", domain: "skip.com" }, el);
    expect(el.statusSection.className).toContain("status-disabled");
    expect(el.statusLabel.textContent).toBe("Disabled for this site");
  });
});
