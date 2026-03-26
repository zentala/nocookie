/**
 * Tests for the background service worker orchestration.
 *
 * Covers message routing, lifecycle listener registration,
 * tab navigation state resets, and storage change handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { installChromeMock } from "./helpers/chrome-storage-mock";

// Storage mocks available via installChromeMock() but not directly referenced.

/** Captured listener callbacks from chrome event registrations. */
let listeners: Record<string, Function[]> = {};

function captureListener(eventName: string) {
  listeners[eventName] = [];
  return {
    addListener: vi.fn((cb: Function) => {
      listeners[eventName].push(cb);
    }),
  };
}

function installFullChromeMock(): void {
  const mocks = installChromeMock();

  Object.assign(globalThis.chrome, {
    action: {
      setBadgeText: vi.fn(() => Promise.resolve()),
      setBadgeBackgroundColor: vi.fn(() => Promise.resolve()),
      setIcon: vi.fn(() => Promise.resolve()),
    },
    tabs: {
      create: vi.fn(() => Promise.resolve({ id: 99 })),
      onUpdated: captureListener("tabs.onUpdated"),
      onRemoved: captureListener("tabs.onRemoved"),
      onActivated: captureListener("tabs.onActivated"),
    },
    runtime: {
      onMessage: captureListener("runtime.onMessage"),
      onInstalled: captureListener("runtime.onInstalled"),
      sendMessage: vi.fn(() => Promise.resolve()),
    },
    storage: {
      ...mocks.syncMock,
      sync: mocks.syncMock,
      local: mocks.localMock,
      onChanged: captureListener("storage.onChanged"),
    },
    scripting: {
      executeScript: vi.fn(() => Promise.resolve()),
    },
    declarativeNetRequest: {
      updateDynamicRules: vi.fn(() => Promise.resolve()),
    },
  });
}

beforeEach(() => {
  vi.resetModules();
  listeners = {};
  installFullChromeMock();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Helper: import service-worker and tab-state from the same module graph. */
async function loadServiceWorker() {
  const tabState = await import("@/background/tab-state");
  tabState.clearAllTabStates();
  await import("@/background/service-worker");
  return tabState;
}

describe("Service worker — message routing", () => {
  it("routes CMP_DETECTED message and calls sendResponse", async () => {
    await loadServiceWorker();

    const messageListener = listeners["runtime.onMessage"]?.[0];
    expect(messageListener).toBeDefined();

    const sendResponse = vi.fn();
    const message = {
      type: "CMP_DETECTED",
      payload: {
        cmp: "onetrust",
        domain: "test.com",
        confidence: "high",
        layer: 1,
      },
    };

    const result = messageListener(message, { tab: { id: 5 } }, sendResponse);
    expect(result).toBe(true);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalled();
    });
  });

  it("routes SCAN_STARTED and updates tab state", async () => {
    const tabState = await loadServiceWorker();

    const messageListener = listeners["runtime.onMessage"]?.[0];
    const sendResponse = vi.fn();

    messageListener(
      { type: "SCAN_STARTED", payload: { tabId: 0 } },
      { tab: { id: 7 } },
      sendResponse,
    );

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalled();
    });

    expect(tabState.getTabState(7).state).toBe("scanning");
  });

  it("handles unknown message type gracefully", async () => {
    await loadServiceWorker();

    const messageListener = listeners["runtime.onMessage"]?.[0];
    const sendResponse = vi.fn();

    messageListener({ type: "UNKNOWN_TYPE", payload: {} }, { tab: { id: 1 } }, sendResponse);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("Unknown") }),
      );
    });
  });

  it("uses tabId 0 when sender has no tab", async () => {
    const tabState = await loadServiceWorker();

    const messageListener = listeners["runtime.onMessage"]?.[0];
    const sendResponse = vi.fn();

    messageListener({ type: "SCAN_STARTED", payload: { tabId: 0 } }, {}, sendResponse);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalled();
    });

    expect(tabState.getTabState(0).state).toBe("scanning");
  });
});

describe("Service worker — lifecycle listeners registered", () => {
  it("registers all expected listeners", async () => {
    await loadServiceWorker();

    expect(listeners["runtime.onInstalled"].length).toBeGreaterThan(0);
    expect(listeners["tabs.onUpdated"].length).toBeGreaterThan(0);
    expect(listeners["tabs.onRemoved"].length).toBeGreaterThan(0);
    expect(listeners["tabs.onActivated"].length).toBeGreaterThan(0);
    expect(listeners["storage.onChanged"].length).toBeGreaterThan(0);
  });
});

describe("Service worker — tabs.onRemoved clears state", () => {
  it("clears tab state when tab is closed", async () => {
    const tabState = await loadServiceWorker();
    tabState.setTabState(10, { state: "handled", cmp: "test" });
    expect(tabState.getTabState(10).state).toBe("handled");

    const onRemoved = listeners["tabs.onRemoved"]?.[0];
    onRemoved(10);

    expect(tabState.getTabState(10).state).toBe("default");
  });
});

describe("Service worker — tabs.onActivated updates badge", () => {
  it("calls setBadgeText when switching tabs", async () => {
    const tabState = await loadServiceWorker();
    tabState.setTabState(20, { state: "handled" });

    const onActivated = listeners["tabs.onActivated"]?.[0];
    onActivated({ tabId: 20 });

    expect(chrome.action.setBadgeText).toHaveBeenCalled();
  });
});

describe("Service worker — tabs.onUpdated resets on navigation", () => {
  it("resets tab state on URL change", async () => {
    const tabState = await loadServiceWorker();
    tabState.setTabState(30, { state: "handled", cmp: "old", domain: "old.com" });

    const onUpdated = listeners["tabs.onUpdated"]?.[0];
    onUpdated(30, { status: "loading", url: "https://new.com" });

    expect(tabState.getTabState(30).state).toBe("default");
  });

  it("ignores onUpdated without url change", async () => {
    const tabState = await loadServiceWorker();
    tabState.setTabState(31, { state: "handled", cmp: "keep" });

    const onUpdated = listeners["tabs.onUpdated"]?.[0];
    onUpdated(31, { status: "loading" });

    expect(tabState.getTabState(31).state).toBe("handled");
  });
});

describe("Service worker — storage.onChanged triggers GPC sync", () => {
  it("triggers GPC sync when preferences change in sync area", async () => {
    await loadServiceWorker();

    const onChanged = listeners["storage.onChanged"]?.[0];
    onChanged({ preferences: { newValue: {} } }, "sync");

    await vi.waitFor(() => {
      expect(chrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalled();
    });
  });

  it("ignores changes in non-sync area", async () => {
    await loadServiceWorker();
    const callsBefore = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls
      .length;

    const onChanged = listeners["storage.onChanged"]?.[0];
    onChanged({ preferences: { newValue: {} } }, "local");

    await new Promise((r) => setTimeout(r, 10));
    const callsAfter = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls.length;
    expect(callsAfter).toBe(callsBefore);
  });
});
