/**
 * Tests for the GPC (Global Privacy Control) module.
 *
 * Validates declarativeNetRequest rule creation/removal,
 * state synchronisation logic, and content script generation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { installChromeMock, type StorageAreaMock } from "./helpers/chrome-storage-mock";

let syncMock: StorageAreaMock;

/** Install chrome mock with declarativeNetRequest and scripting APIs. */
function installGpcChromeMock(): { syncMock: StorageAreaMock; localMock: StorageAreaMock } {
  const mocks = installChromeMock();

  Object.assign(globalThis.chrome, {
    declarativeNetRequest: {
      updateDynamicRules: vi.fn(() => Promise.resolve()),
    },
    scripting: {
      executeScript: vi.fn(() => Promise.resolve()),
    },
    runtime: {
      onMessage: { addListener: vi.fn() },
      onInstalled: { addListener: vi.fn() },
    },
    tabs: {
      onUpdated: { addListener: vi.fn() },
      onRemoved: { addListener: vi.fn() },
    },
  });

  return mocks;
}

beforeEach(() => {
  vi.resetModules();
  const mocks = installGpcChromeMock();
  syncMock = mocks.syncMock;
});

describe("GPC module", () => {
  async function getGpc() {
    return import("@/background/gpc");
  }

  describe("enableGpc", () => {
    it("adds correct declarativeNetRequest rule with Sec-GPC header", async () => {
      const { enableGpc, GPC_RULE_ID } = await getGpc();
      await enableGpc();

      expect(chrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith({
        addRules: [
          expect.objectContaining({
            id: GPC_RULE_ID,
            priority: 1,
            action: expect.objectContaining({
              type: "modifyHeaders",
              requestHeaders: [
                expect.objectContaining({
                  header: "Sec-GPC",
                  operation: "set",
                  value: "1",
                }),
              ],
            }),
            condition: expect.objectContaining({
              resourceTypes: expect.arrayContaining(["main_frame", "xmlhttprequest"]),
            }),
          }),
        ],
        removeRuleIds: [GPC_RULE_ID],
      });
    });

    it("includes all expected resource types", async () => {
      const { enableGpc } = await getGpc();
      await enableGpc();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0][0];
      const resourceTypes = call.addRules?.[0]?.condition?.resourceTypes ?? [];
      expect(resourceTypes).toContain("main_frame");
      expect(resourceTypes).toContain("sub_frame");
      expect(resourceTypes).toContain("xmlhttprequest");
      expect(resourceTypes).toContain("script");
      expect(resourceTypes).toContain("image");
      expect(resourceTypes).toContain("stylesheet");
      expect(resourceTypes).toContain("font");
    });
  });

  describe("disableGpc", () => {
    it("removes the GPC rule by ID", async () => {
      const { disableGpc, GPC_RULE_ID } = await getGpc();
      await disableGpc();

      expect(chrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith({
        removeRuleIds: [GPC_RULE_ID],
      });
    });

    it("does not add any rules when disabling", async () => {
      const { disableGpc } = await getGpc();
      await disableGpc();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0][0];
      expect(call.addRules).toBeUndefined();
    });
  });

  describe("syncGpcState", () => {
    it("enables GPC when marketing=false and enableGpc=true", async () => {
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
          marketing: false,
          socialMedia: false,
        },
      });

      const { syncGpcState, GPC_RULE_ID } = await getGpc();
      await syncGpcState();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0][0];
      expect(call.addRules).toBeDefined();
      expect(call.addRules?.[0]?.id).toBe(GPC_RULE_ID);
    });

    it("disables GPC when marketing=true", async () => {
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

      const { syncGpcState } = await getGpc();
      await syncGpcState();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0][0];
      expect(call.addRules).toBeUndefined();
      expect(call.removeRuleIds).toEqual([1]);
    });

    it("disables GPC when enableGpc=false even if marketing=false", async () => {
      syncMock.set({
        settings: {
          autoConsent: true,
          consentDelay: 500,
          showNotifications: true,
          logConsent: true,
          enableHeuristics: true,
          enableWellKnown: true,
          enableGpc: false,
        },
        preferences: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
          socialMedia: false,
        },
      });

      const { syncGpcState } = await getGpc();
      await syncGpcState();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0][0];
      expect(call.addRules).toBeUndefined();
    });
  });

  describe("getGpcContentScript", () => {
    it("returns a string that defines navigator.globalPrivacyControl", async () => {
      const { getGpcContentScript } = await getGpc();
      const script = getGpcContentScript();

      expect(script).toContain("navigator");
      expect(script).toContain("globalPrivacyControl");
      expect(script).toContain("true");
      expect(script).toContain("Object.defineProperty");
    });

    it("sets writable and configurable to false", async () => {
      const { getGpcContentScript } = await getGpc();
      const script = getGpcContentScript();

      expect(script).toContain("writable: false");
      expect(script).toContain("configurable: false");
    });
  });

  describe("injectGpcScript", () => {
    it("injects script when GPC is active", async () => {
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
          marketing: false,
          socialMedia: false,
        },
      });

      const { injectGpcScript } = await getGpc();
      await injectGpcScript(42);

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tabId: 42 },
          world: "MAIN",
        }),
      );
    });

    it("does not inject when enableGpc is false", async () => {
      syncMock.set({
        settings: {
          autoConsent: true,
          consentDelay: 500,
          showNotifications: true,
          logConsent: true,
          enableHeuristics: true,
          enableWellKnown: true,
          enableGpc: false,
        },
        preferences: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
          socialMedia: false,
        },
      });

      const { injectGpcScript } = await getGpc();
      await injectGpcScript(42);

      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    it("does not inject when marketing is accepted", async () => {
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

      const { injectGpcScript } = await getGpc();
      await injectGpcScript(42);

      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });
  });
});
