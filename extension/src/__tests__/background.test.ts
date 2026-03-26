/**
 * Tests for the background service worker modules.
 *
 * Validates message routing, tab state management, badge rendering,
 * and handler logic with mocked Chrome APIs.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { installChromeMock, type StorageAreaMock } from "./helpers/chrome-storage-mock";
import {
  getTabState,
  setTabState,
  updateTabState,
  clearTabState,
  clearAllTabStates,
} from "@/background/tab-state";
import { BADGE_COLORS, BADGE_TEXT, updateBadge } from "@/background/badge";
import type { BadgeState } from "@/shared/messages";

let syncMock: StorageAreaMock;

/** Install full chrome mock with all APIs needed by the service worker. */
function installFullChromeMock(): { syncMock: StorageAreaMock; localMock: StorageAreaMock } {
  const mocks = installChromeMock();

  Object.assign(globalThis.chrome, {
    action: {
      setBadgeText: vi.fn(() => Promise.resolve()),
      setBadgeBackgroundColor: vi.fn(() => Promise.resolve()),
      setIcon: vi.fn(() => Promise.resolve()),
    },
    tabs: {
      create: vi.fn(() => Promise.resolve({ id: 99 })),
      onUpdated: { addListener: vi.fn() },
      onRemoved: { addListener: vi.fn() },
      onActivated: { addListener: vi.fn() },
    },
    runtime: {
      onMessage: { addListener: vi.fn() },
      onInstalled: { addListener: vi.fn() },
      sendMessage: vi.fn(() => Promise.resolve()),
    },
    scripting: {
      executeScript: vi.fn(() => Promise.resolve()),
    },
  });

  return mocks;
}

beforeEach(() => {
  const mocks = installFullChromeMock();
  syncMock = mocks.syncMock;
  clearAllTabStates();
});

// -- Tab state ----------------------------------------------------------------

describe("Tab state management", () => {
  it("returns default state for unknown tab", () => {
    const state = getTabState(999);
    expect(state).toEqual({ state: "default" });
  });

  it("sets and retrieves tab state", () => {
    setTabState(1, { state: "handled", cmp: "CookieBot", domain: "example.com" });
    expect(getTabState(1)).toEqual({
      state: "handled",
      cmp: "CookieBot",
      domain: "example.com",
    });
  });

  it("updates partial tab state", () => {
    setTabState(2, { state: "scanning", domain: "test.com" });
    updateTabState(2, { state: "attention", cmp: "OneTrust" });
    expect(getTabState(2)).toEqual({
      state: "attention",
      domain: "test.com",
      cmp: "OneTrust",
    });
  });

  it("clears tab state", () => {
    setTabState(3, { state: "handled" });
    clearTabState(3);
    expect(getTabState(3)).toEqual({ state: "default" });
  });

  it("clears all tab states", () => {
    setTabState(1, { state: "handled" });
    setTabState(2, { state: "error" });
    clearAllTabStates();
    expect(getTabState(1)).toEqual({ state: "default" });
    expect(getTabState(2)).toEqual({ state: "default" });
  });
});

// -- Badge --------------------------------------------------------------------

describe("Badge rendering", () => {
  it("has colors for all badge states", () => {
    const states: BadgeState[] = [
      "default",
      "handled",
      "attention",
      "error",
      "disabled",
      "scanning",
    ];
    for (const s of states) {
      expect(BADGE_COLORS[s]).toBeDefined();
      expect(BADGE_TEXT[s]).toBeDefined();
    }
  });

  it("handled state shows green checkmark", () => {
    expect(BADGE_COLORS.handled).toBe("#22C55E");
    expect(BADGE_TEXT.handled).toBe("\u2713");
  });

  it("error state shows red cross", () => {
    expect(BADGE_COLORS.error).toBe("#EF4444");
    expect(BADGE_TEXT.error).toBe("\u2717");
  });

  it("default state has empty text", () => {
    expect(BADGE_TEXT.default).toBe("");
  });

  it("updateBadge calls chrome.action APIs", async () => {
    await updateBadge(42, "handled");
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
      tabId: 42,
      text: "\u2713",
    });
    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      tabId: 42,
      color: "#22C55E",
    });
  });
});

// -- Message handlers ---------------------------------------------------------

describe("Message handlers", () => {
  // Import handlers lazily so chrome mock is installed first
  async function getHandlers() {
    return import("@/background/message-handlers");
  }

  describe("handleGetPreferences", () => {
    it("returns global preferences when no domain override", async () => {
      const { handleGetPreferences } = await getHandlers();
      const result = await handleGetPreferences({ domain: "example.com" });

      expect(result.isOverride).toBe(false);
      expect(result.preferences).toBeDefined();
      expect(result.preferences.essential).toBe(true);
    });

    it("returns domain override when set", async () => {
      syncMock.set({
        domainOverrides: {
          "override.com": {
            mode: "custom",
            preferences: {
              essential: true,
              functional: true,
              analytics: true,
              marketing: false,
              socialMedia: false,
            },
          },
        },
      });

      const { handleGetPreferences } = await getHandlers();
      const result = await handleGetPreferences({ domain: "override.com" });

      expect(result.isOverride).toBe(true);
      expect(result.preferences.analytics).toBe(true);
    });
  });

  describe("handleCmpDetected", () => {
    it("updates tab state to attention", async () => {
      const { handleCmpDetected } = await getHandlers();
      await handleCmpDetected(
        { cmp: "CookieBot", domain: "test.com", confidence: "high", layer: 1 },
        10,
      );

      const state = getTabState(10);
      expect(state.state).toBe("attention");
      expect(state.cmp).toBe("CookieBot");
      expect(state.domain).toBe("test.com");
    });

    it("returns preferences in response", async () => {
      const { handleCmpDetected } = await getHandlers();
      const result = await handleCmpDetected(
        { cmp: "OneTrust", domain: "site.com", confidence: "medium", layer: 0 },
        11,
      );

      expect(result.preferences).toBeDefined();
      expect(result.profile).toBeDefined();
    });

    it("calls updateBadge with attention", async () => {
      const { handleCmpDetected } = await getHandlers();
      await handleCmpDetected(
        { cmp: "CookieBot", domain: "test.com", confidence: "high", layer: 1 },
        12,
      );

      expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith(
        expect.objectContaining({ color: BADGE_COLORS.attention }),
      );
    });
  });

  describe("handleConsentExecuted", () => {
    it("saves to consent log and increments stats", async () => {
      const { handleConsentExecuted } = await getHandlers();
      const payload = {
        domain: "logged.com",
        cmp: "CookieBot",
        method: "click" as const,
        categoriesAccepted: ["essential", "functional"],
        categoriesRejected: ["marketing"],
        timestamp: Date.now(),
        confidence: "high" as const,
        success: true,
      };

      const result = await handleConsentExecuted(payload, 20);
      expect(result.saved).toBe(true);

      const state = getTabState(20);
      expect(state.state).toBe("handled");
    });

    it("sets error badge on failed consent", async () => {
      const { handleConsentExecuted } = await getHandlers();
      const payload = {
        domain: "fail.com",
        cmp: null,
        method: "heuristic" as const,
        categoriesAccepted: [],
        categoriesRejected: [],
        timestamp: Date.now(),
        confidence: "low" as const,
        success: false,
      };

      await handleConsentExecuted(payload, 21);
      const state = getTabState(21);
      expect(state.state).toBe("error");
    });
  });

  describe("handleScanStarted", () => {
    it("sets tab state to scanning", async () => {
      const { handleScanStarted } = await getHandlers();
      await handleScanStarted(30);

      const state = getTabState(30);
      expect(state.state).toBe("scanning");
    });

    it("updates badge to scanning", async () => {
      const { handleScanStarted } = await getHandlers();
      await handleScanStarted(31);

      expect(chrome.action.setBadgeText).toHaveBeenCalledWith(
        expect.objectContaining({ text: "..." }),
      );
    });
  });

  describe("handleScanComplete", () => {
    it("resets to default when no CMP found", async () => {
      const { handleScanComplete } = await getHandlers();
      setTabState(40, { state: "scanning" });

      await handleScanComplete({ tabId: 40, cmpFound: false });
      expect(getTabState(40).state).toBe("default");
    });

    it("keeps state when CMP was found", async () => {
      const { handleScanComplete } = await getHandlers();
      setTabState(41, { state: "attention", cmp: "OneTrust" });

      await handleScanComplete({ tabId: 41, cmpFound: true });
      // State should not be reset to default
      expect(getTabState(41).state).toBe("attention");
    });
  });

  describe("handleExecuteConsent", () => {
    it("returns injected: false (placeholder)", async () => {
      const { handleExecuteConsent } = await getHandlers();
      const result = await handleExecuteConsent(
        {
          cmp: "CookieBot",
          rule: {
            name: "CookieBot",
            detection: {},
            categoryMapping: {
              functional: "func",
              analytics: "stat",
              marketing: "market",
            },
            actions: { acceptAll: [], rejectAll: [], custom: [] },
          },
          preferences: {
            essential: true,
            functional: true,
            analytics: false,
            marketing: false,
            socialMedia: false,
          },
        },
        50,
      );

      expect(result.injected).toBe(false);
    });
  });

  describe("handleGetTabState", () => {
    it("returns current tab state", async () => {
      const { handleGetTabState } = await getHandlers();
      setTabState(60, { state: "handled", cmp: "OneTrust", domain: "done.com" });

      const result = handleGetTabState({ tabId: 60 });
      expect(result.state).toBe("handled");
      expect(result.cmp).toBe("OneTrust");
      expect(result.domain).toBe("done.com");
    });

    it("returns default for unknown tab", async () => {
      const { handleGetTabState } = await getHandlers();
      const result = handleGetTabState({ tabId: 999 });
      expect(result.state).toBe("default");
    });
  });

  describe("handleUpdateBadge", () => {
    it("sets badge and tab state", async () => {
      const { handleUpdateBadge } = await getHandlers();
      await handleUpdateBadge({ state: "error" }, 70);

      expect(getTabState(70).state).toBe("error");
      expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith(
        expect.objectContaining({ color: BADGE_COLORS.error }),
      );
    });
  });
});
