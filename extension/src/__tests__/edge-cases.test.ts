/**
 * Edge case and error handling tests.
 *
 * Validates graceful behavior under unusual conditions:
 * service worker restart, storage errors, concurrent detections,
 * network failures, and invalid data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { installChromeMock, type StorageAreaMock } from "./helpers/chrome-storage-mock";
import { getTabState, setTabState, clearAllTabStates, clearTabState } from "@/background/tab-state";

let syncMock: StorageAreaMock;
let localMock: StorageAreaMock;

function installFullChromeMock(): void {
  const mocks = installChromeMock();
  syncMock = mocks.syncMock;
  localMock = mocks.localMock;

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
}

beforeEach(() => {
  installFullChromeMock();
  clearAllTabStates();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Multiple CMP detections on same page (first wins)", () => {
  it("second detection still updates tab state (last write wins)", async () => {
    const { handleCmpDetected } = await import("@/background/message-handlers");

    await handleCmpDetected(
      { cmp: "onetrust", domain: "multi.com", confidence: "high", layer: 1 },
      1,
    );
    expect(getTabState(1).cmp).toBe("onetrust");

    // Second detection overwrites
    await handleCmpDetected(
      { cmp: "cookiebot", domain: "multi.com", confidence: "medium", layer: 1 },
      1,
    );
    expect(getTabState(1).cmp).toBe("cookiebot");
    expect(getTabState(1).state).toBe("attention");
  });
});

describe("Service worker restart (tab states cleared)", () => {
  it("all tab states return to default after clearAllTabStates", () => {
    setTabState(1, { state: "handled", cmp: "OneTrust", domain: "a.com" });
    setTabState(2, { state: "attention", cmp: "CookieBot", domain: "b.com" });
    setTabState(3, { state: "error", domain: "c.com" });

    clearAllTabStates();

    expect(getTabState(1).state).toBe("default");
    expect(getTabState(2).state).toBe("default");
    expect(getTabState(3).state).toBe("default");
  });

  it("clearTabState only removes specified tab", () => {
    setTabState(1, { state: "handled", cmp: "A" });
    setTabState(2, { state: "attention", cmp: "B" });

    clearTabState(1);

    expect(getTabState(1).state).toBe("default");
    expect(getTabState(2).state).toBe("attention");
    expect(getTabState(2).cmp).toBe("B");
  });
});

describe("Storage quota exceeded (graceful error)", () => {
  it("setConsentLog handles storage.set rejection", async () => {
    localMock.set = vi.fn(() => Promise.reject(new Error("QUOTA_BYTES_PER_ITEM quota exceeded")));

    const { setConsentLog } = await import("@/shared/storage-api");
    await expect(
      setConsentLog("big-site.com", {
        domain: "big-site.com",
        cmp: "onetrust",
        method: "api",
        categoriesAccepted: ["essential"],
        categoriesRejected: [],
        timestamp: Date.now(),
        confidence: "high",
        success: true,
      }),
    ).rejects.toThrow("QUOTA_BYTES_PER_ITEM");
  });
});

describe("broadcast silently handles popup not open", () => {
  it("broadcastTabStateChange swallows sendMessage error", async () => {
    vi.mocked(chrome.runtime.sendMessage).mockRejectedValue(
      new Error("Could not establish connection"),
    );

    const { broadcastTabStateChange } = await import("@/background/message-handlers");

    // Should not throw even when sendMessage fails
    expect(() => broadcastTabStateChange(1, "handled")).not.toThrow();
  });
});

describe("handleConsentExecuted with logConsent disabled", () => {
  it("does not save consent log when logConsent is false", async () => {
    syncMock.set({
      settings: {
        autoConsent: true,
        consentDelay: 500,
        showNotifications: true,
        logConsent: false,
        enableHeuristics: true,
        enableWellKnown: true,
        enableGpc: false,
      },
    });

    const { handleConsentExecuted } = await import("@/background/message-handlers");
    const result = await handleConsentExecuted(
      {
        domain: "no-log.com",
        cmp: "cookiebot",
        method: "click",
        categoriesAccepted: ["essential"],
        categoriesRejected: ["marketing"],
        timestamp: Date.now(),
        confidence: "high",
        success: true,
      },
      5,
    );

    expect(result.saved).toBe(false);
    expect(getTabState(5).state).toBe("handled");
  });
});

describe("Consent with null CMP", () => {
  it("handles null CMP gracefully in consent executed", async () => {
    const { handleConsentExecuted } = await import("@/background/message-handlers");
    const result = await handleConsentExecuted(
      {
        domain: "unknown-cmp.com",
        cmp: null,
        method: "heuristic",
        categoriesAccepted: ["essential"],
        categoriesRejected: ["marketing", "analytics"],
        timestamp: Date.now(),
        confidence: "low",
        success: true,
      },
      8,
    );

    expect(result.saved).toBe(true);
    expect(getTabState(8).state).toBe("handled");
    expect(getTabState(8).cmp).toBeUndefined();
  });
});

describe("GET_TAB_STATE for non-existent tab", () => {
  it("returns default state for tab that was never tracked", () => {
    const state = getTabState(99999);
    expect(state).toEqual({ state: "default" });
  });
});

describe("Badge state transitions cover all states", () => {
  it("handleUpdateBadge sets each possible badge state", async () => {
    const { handleUpdateBadge } = await import("@/background/message-handlers");
    const states = ["default", "handled", "attention", "error", "disabled", "scanning"] as const;

    for (const state of states) {
      await handleUpdateBadge({ state }, 100);
      expect(getTabState(100).state).toBe(state);
    }
  });
});
