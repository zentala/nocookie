/**
 * Integration tests: detection -> execution flow.
 *
 * Validates the full pipeline from content script CMP detection
 * through background message routing to executor injection.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { installChromeMock, type StorageAreaMock } from "../helpers/chrome-storage-mock";
import { getTabState, clearAllTabStates } from "@/background/tab-state";

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

describe("Detection -> execution integration flow", () => {
  async function getHandlers() {
    return import("@/background/message-handlers");
  }

  it("CMP detected -> background looks up rule -> returns preferences for executor", async () => {
    const { handleCmpDetected, handleGetPreferences } = await getHandlers();

    // Step 1: Content script detects CMP and sends CMP_DETECTED
    const detectResult = await handleCmpDetected(
      { cmp: "onetrust", domain: "shop.com", confidence: "high", layer: 1 },
      1,
    );

    // Background returns preferences for the executor
    expect(detectResult.preferences).toBeDefined();
    expect(detectResult.preferences.essential).toBe(true);
    expect(detectResult.profile).toBeDefined();

    // Step 2: Tab state updated to attention
    expect(getTabState(1).state).toBe("attention");
    expect(getTabState(1).cmp).toBe("onetrust");

    // Step 3: GET_PREFERENCES also works for same domain
    const prefsResult = await handleGetPreferences({ domain: "shop.com" });
    expect(prefsResult.preferences.essential).toBe(true);
  });

  it("domain override -> custom preferences used instead of global", async () => {
    syncMock.set({
      domainOverrides: {
        "override-site.com": {
          mode: "custom",
          preferences: {
            essential: true,
            functional: false,
            analytics: false,
            marketing: false,
            socialMedia: false,
          },
        },
      },
    });

    const { handleCmpDetected } = await getHandlers();
    const result = await handleCmpDetected(
      { cmp: "cookiebot", domain: "override-site.com", confidence: "high", layer: 1 },
      2,
    );

    expect(result.isOverride).toBe(true);
    expect(result.preferences.functional).toBe(false);
    expect(result.preferences.marketing).toBe(false);
  });

  it("full lifecycle: scan -> detect -> consent -> handled with stats", async () => {
    const { handleScanStarted, handleCmpDetected, handleConsentExecuted } = await getHandlers();

    // 1. Scan starts
    await handleScanStarted(10);
    expect(getTabState(10).state).toBe("scanning");

    // 2. CMP detected
    await handleCmpDetected(
      { cmp: "didomi", domain: "news.com", confidence: "medium", layer: 0 },
      10,
    );
    expect(getTabState(10).state).toBe("attention");

    // 3. Consent executed successfully
    await handleConsentExecuted(
      {
        domain: "news.com",
        cmp: "didomi",
        method: "api",
        categoriesAccepted: ["essential", "functional", "analytics"],
        categoriesRejected: ["marketing", "socialMedia"],
        timestamp: Date.now(),
        confidence: "medium",
        success: true,
      },
      10,
    );

    expect(getTabState(10).state).toBe("handled");
    expect(getTabState(10).result?.cmp).toBe("didomi");

    // Verify stats were incremented
    expect(localMock.set).toHaveBeenCalled();
  });

  it("consent failure sets error state", async () => {
    const { handleCmpDetected, handleConsentExecuted } = await getHandlers();

    await handleCmpDetected(
      { cmp: "unknown-cmp", domain: "broken.com", confidence: "low", layer: 1 },
      20,
    );

    await handleConsentExecuted(
      {
        domain: "broken.com",
        cmp: "unknown-cmp",
        method: "heuristic",
        categoriesAccepted: [],
        categoriesRejected: [],
        timestamp: Date.now(),
        confidence: "low",
        success: false,
      },
      20,
    );

    expect(getTabState(20).state).toBe("error");
  });
});

describe("EXECUTE_CONSENT handler (placeholder)", () => {
  it("returns injected: false for any CMP", async () => {
    const { handleExecuteConsent } = await import("@/background/message-handlers");
    const result = await handleExecuteConsent(
      {
        cmp: "onetrust",
        rule: {
          name: "onetrust",
          detection: { domSelectors: ["#onetrust-consent-sdk"] },
          categoryMapping: { functional: "C0003", analytics: "C0002", marketing: "C0004" },
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
      30,
    );
    expect(result.injected).toBe(false);
  });
});
