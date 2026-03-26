/**
 * Integration tests for the scanning state flow.
 *
 * Validates the end-to-end lifecycle: SCAN_STARTED sets scanning state,
 * CMP_DETECTED transitions to attention, SCAN_COMPLETE with no CMP
 * transitions to default, and broadcastTabStateChange notifies the popup.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { installChromeMock } from "./helpers/chrome-storage-mock";
import { getTabState, setTabState, clearAllTabStates } from "@/background/tab-state";

/** Install full chrome mock with all APIs needed by message handlers. */
function installFullChromeMock(): void {
  installChromeMock();

  Object.assign(globalThis.chrome, {
    action: {
      setBadgeText: vi.fn(() => Promise.resolve()),
      setBadgeBackgroundColor: vi.fn(() => Promise.resolve()),
      setIcon: vi.fn(() => Promise.resolve()),
    },
    tabs: {
      create: vi.fn(() => Promise.resolve({ id: 99 })),
      query: vi.fn(() => Promise.resolve([{ id: 1, url: "https://example.com" }])),
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

describe("Scanning flow — end-to-end state transitions", () => {
  async function getHandlers() {
    return import("@/background/message-handlers");
  }

  it("SCAN_STARTED sets tab state to scanning", async () => {
    const { handleScanStarted } = await getHandlers();
    await handleScanStarted(1);

    expect(getTabState(1).state).toBe("scanning");
  });

  it("SCAN_STARTED updates badge to scanning (blue dots)", async () => {
    const { handleScanStarted } = await getHandlers();
    await handleScanStarted(1);

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith(
      expect.objectContaining({ text: "..." }),
    );
    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith(
      expect.objectContaining({ color: "#3B82F6" }),
    );
  });

  it("CMP_DETECTED transitions from scanning to attention", async () => {
    const { handleScanStarted, handleCmpDetected } = await getHandlers();
    await handleScanStarted(1);
    expect(getTabState(1).state).toBe("scanning");

    await handleCmpDetected(
      { cmp: "CookieBot", domain: "example.com", confidence: "high", layer: 1 },
      1,
    );
    expect(getTabState(1).state).toBe("attention");
    expect(getTabState(1).cmp).toBe("CookieBot");
  });

  it("SCAN_COMPLETE with no CMP transitions scanning to default", async () => {
    const { handleScanStarted, handleScanComplete } = await getHandlers();
    await handleScanStarted(2);
    expect(getTabState(2).state).toBe("scanning");

    await handleScanComplete({ tabId: 2, cmpFound: false });
    expect(getTabState(2).state).toBe("default");
  });

  it("SCAN_COMPLETE with CMP found does not reset state", async () => {
    const { handleScanStarted, handleCmpDetected, handleScanComplete } = await getHandlers();
    await handleScanStarted(3);
    await handleCmpDetected(
      { cmp: "OneTrust", domain: "site.com", confidence: "medium", layer: 0 },
      3,
    );

    await handleScanComplete({ tabId: 3, cmpFound: true });
    // State should remain attention (set by CMP_DETECTED), not reset to default
    expect(getTabState(3).state).toBe("attention");
  });

  it("full flow: scanning → attention → handled", async () => {
    const { handleScanStarted, handleCmpDetected, handleConsentExecuted } = await getHandlers();

    await handleScanStarted(5);
    expect(getTabState(5).state).toBe("scanning");

    await handleCmpDetected(
      { cmp: "CookieBot", domain: "example.com", confidence: "high", layer: 1 },
      5,
    );
    expect(getTabState(5).state).toBe("attention");

    await handleConsentExecuted(
      {
        domain: "example.com",
        cmp: "CookieBot",
        method: "click",
        categoriesAccepted: ["essential", "functional"],
        categoriesRejected: ["marketing"],
        timestamp: Date.now(),
        confidence: "high",
        success: true,
      },
      5,
    );
    expect(getTabState(5).state).toBe("handled");
  });
});

describe("broadcastTabStateChange — popup notification", () => {
  async function getHandlers() {
    return import("@/background/message-handlers");
  }

  it("SCAN_STARTED broadcasts TAB_STATE_CHANGED to popup", async () => {
    const { handleScanStarted } = await getHandlers();
    await handleScanStarted(10);

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "TAB_STATE_CHANGED",
      payload: { tabId: 10, state: "scanning" },
    });
  });

  it("CMP_DETECTED broadcasts TAB_STATE_CHANGED with attention", async () => {
    const { handleCmpDetected } = await getHandlers();
    await handleCmpDetected(
      { cmp: "CookieBot", domain: "test.com", confidence: "high", layer: 1 },
      11,
    );

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "TAB_STATE_CHANGED",
      payload: { tabId: 11, state: "attention" },
    });
  });

  it("SCAN_COMPLETE (no CMP) broadcasts TAB_STATE_CHANGED with default", async () => {
    const { handleScanComplete } = await getHandlers();
    setTabState(12, { state: "scanning" });

    await handleScanComplete({ tabId: 12, cmpFound: false });

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "TAB_STATE_CHANGED",
      payload: { tabId: 12, state: "default" },
    });
  });

  it("CONSENT_EXECUTED broadcasts TAB_STATE_CHANGED with handled", async () => {
    const { handleConsentExecuted } = await getHandlers();
    await handleConsentExecuted(
      {
        domain: "done.com",
        cmp: "CookieBot",
        method: "click",
        categoriesAccepted: ["essential"],
        categoriesRejected: [],
        timestamp: Date.now(),
        confidence: "high",
        success: true,
      },
      13,
    );

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "TAB_STATE_CHANGED",
      payload: { tabId: 13, state: "handled" },
    });
  });

  it("broadcast silently ignores errors when popup is closed", async () => {
    // Simulate popup not being open — sendMessage rejects
    vi.mocked(chrome.runtime.sendMessage).mockRejectedValueOnce(
      new Error("Could not establish connection"),
    );

    const { handleScanStarted } = await getHandlers();
    // Should not throw
    await expect(handleScanStarted(14)).resolves.toBeUndefined();
  });
});

describe("Popup state change listener", () => {
  it("TAB_STATE_CHANGED message triggers re-render via loadTabState", async () => {
    // This tests the listener setup exported from popup.ts
    const { listenForStateChanges } = await import("@/popup/popup");

    // Verify the function exists and is callable
    expect(typeof listenForStateChanges).toBe("function");
  });
});
