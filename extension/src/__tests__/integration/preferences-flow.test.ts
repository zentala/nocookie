/**
 * Integration tests: preferences -> consent flow.
 *
 * Validates profile changes, domain overrides, GPC activation,
 * and stats tracking through the full message handling pipeline.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { installChromeMock, type StorageAreaMock } from "../helpers/chrome-storage-mock";
import { clearAllTabStates } from "@/background/tab-state";

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
    declarativeNetRequest: {
      updateDynamicRules: vi.fn(() => Promise.resolve()),
    },
  });
}

beforeEach(() => {
  installFullChromeMock();
  clearAllTabStates();
});

describe("Profile change -> preferences updated -> correct consent", () => {
  it("privacy-max profile returns all optional categories rejected", async () => {
    syncMock.set({
      preferences: {
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
        socialMedia: false,
      },
      profile: "privacy-max",
    });

    const { handleGetPreferences } = await import("@/background/message-handlers");
    const result = await handleGetPreferences({ domain: "any-site.com" });

    expect(result.preferences.functional).toBe(false);
    expect(result.preferences.analytics).toBe(false);
    expect(result.preferences.marketing).toBe(false);
    expect(result.preferences.socialMedia).toBe(false);
    expect(result.isOverride).toBe(false);
  });

  it("accept-all profile returns all optional categories accepted", async () => {
    syncMock.set({
      preferences: {
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        socialMedia: true,
      },
      profile: "accept-all",
    });

    const { handleGetPreferences } = await import("@/background/message-handlers");
    const result = await handleGetPreferences({ domain: "any-site.com" });

    expect(result.preferences.functional).toBe(true);
    expect(result.preferences.analytics).toBe(true);
    expect(result.preferences.marketing).toBe(true);
    expect(result.preferences.socialMedia).toBe(true);
  });
});

describe("Domain override -> custom preferences for that domain", () => {
  it("whitelist override with custom prefs overrides global", async () => {
    syncMock.set({
      preferences: {
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
        socialMedia: false,
      },
      domainOverrides: {
        "trusted.com": {
          mode: "custom",
          preferences: {
            essential: true,
            functional: true,
            analytics: true,
            marketing: true,
            socialMedia: true,
          },
        },
      },
    });

    const { handleGetPreferences } = await import("@/background/message-handlers");

    // Overridden domain gets custom prefs
    const overridden = await handleGetPreferences({ domain: "trusted.com" });
    expect(overridden.isOverride).toBe(true);
    expect(overridden.preferences.marketing).toBe(true);

    // Non-overridden domain gets global prefs
    const global = await handleGetPreferences({ domain: "other.com" });
    expect(global.isOverride).toBe(false);
    expect(global.preferences.marketing).toBe(false);
  });

  it("override without preferences field uses global prefs", async () => {
    syncMock.set({
      domainOverrides: {
        "disabled-site.com": { mode: "disabled" },
      },
    });

    const { handleGetPreferences } = await import("@/background/message-handlers");
    const result = await handleGetPreferences({ domain: "disabled-site.com" });

    // No preferences on override -> falls back to global
    expect(result.isOverride).toBe(false);
  });
});

describe("GPC enabled when marketing rejected", () => {
  it("syncGpcState enables GPC when marketing is rejected", async () => {
    syncMock.set({
      settings: {
        autoConsent: true,
        consentDelay: 500,
        showNotifications: true,
        logConsent: true,
        enableHeuristics: true,
        enableWellKnown: true,
        enableGpc: true,
      },
      preferences: {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
        socialMedia: false,
      },
    });

    const { syncGpcState } = await import("@/background/gpc");
    await syncGpcState();

    expect(chrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith(
      expect.objectContaining({
        addRules: expect.arrayContaining([expect.objectContaining({ id: 1 })]),
      }),
    );
  });

  it("syncGpcState disables GPC when marketing is accepted", async () => {
    syncMock.set({
      settings: {
        autoConsent: true,
        consentDelay: 500,
        showNotifications: true,
        logConsent: true,
        enableHeuristics: true,
        enableWellKnown: true,
        enableGpc: true,
      },
      preferences: {
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        socialMedia: true,
      },
    });

    const { syncGpcState } = await import("@/background/gpc");
    await syncGpcState();

    expect(chrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith(
      expect.objectContaining({
        removeRuleIds: [1],
      }),
    );
  });
});

describe("Stats increment after consent execution", () => {
  it("increments popupsHandled counter with method and CMP", async () => {
    const { handleConsentExecuted } = await import("@/background/message-handlers");
    await handleConsentExecuted(
      {
        domain: "stats-test.com",
        cmp: "cookiebot",
        method: "api",
        categoriesAccepted: ["essential"],
        categoriesRejected: ["marketing"],
        timestamp: Date.now(),
        confidence: "high",
        success: true,
      },
      1,
    );

    // Verify local storage was written (stats update)
    const setCalls = localMock.set.mock.calls;
    const statsCall = setCalls.find(
      (c: unknown[]) => (c[0] as Record<string, unknown>).stats !== undefined,
    );
    expect(statsCall).toBeDefined();

    const stats = (statsCall![0] as Record<string, unknown>).stats as {
      popupsHandled: number;
      popupsByMethod: Record<string, number>;
      popupsByCmp: Record<string, number>;
    };
    expect(stats.popupsHandled).toBe(1);
    expect(stats.popupsByMethod["api"]).toBe(1);
    expect(stats.popupsByCmp["cookiebot"]).toBe(1);
  });
});
