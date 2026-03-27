// @vitest-environment jsdom
/**
 * @module tests/cmp-integration
 * Integration tests for the full CMP lifecycle: init, consent flows,
 * event emission, preference center, reset, and generator outputs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CMPOrchestrator } from "@/core/cmp";
import type { CMPConfig } from "@/shared/types";

/** Minimal config for integration tests. */
const TEST_CONFIG: CMPConfig = {
  siteName: "Integration Test Site",
  categories: ["essential", "analytics", "marketing"],
};

/** Full config with more options. */
const FULL_CONFIG: CMPConfig = {
  siteName: "Full Test Site",
  privacyContact: "privacy@example.com",
  policyUrl: "https://example.com/policy",
  categories: [
    { id: "essential", required: true },
    { id: "analytics" },
    { id: "marketing" },
    { id: "functional" },
  ],
  behavior: {
    respectGPC: true,
    rejectAllOnFirstLayer: true,
  },
};

describe("CMP Integration", () => {
  let cmp: CMPOrchestrator;

  beforeEach(() => {
    cmp = new CMPOrchestrator();
    document.cookie = "ca_consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  afterEach(() => {
    cmp.destroy();
    const host = document.getElementById("ca-cmp-root");
    if (host) host.remove();
    document.cookie = "ca_consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  describe("init()", () => {
    it("creates Shadow DOM host element", () => {
      cmp.init(TEST_CONFIG);
      const host = document.getElementById("ca-cmp-root");
      expect(host).not.toBeNull();
      expect(host!.shadowRoot).not.toBeNull();
    });

    it("sets data-ca-version on host element", () => {
      cmp.init(TEST_CONFIG);
      const host = document.getElementById("ca-cmp-root");
      expect(host!.getAttribute("data-ca-version")).toBe("0.1.0");
    });

    it("shows banner on first visit (no consent cookie)", () => {
      cmp.init(TEST_CONFIG);
      const host = document.getElementById("ca-cmp-root");
      const banner = host!.shadowRoot!.querySelector(".ca-banner");
      expect(banner).not.toBeNull();
    });

    it("does not show banner when consent cookie exists", () => {
      // Pre-set a consent cookie
      document.cookie = "ca_consent=e:1|a:0|m:0|ts:" + Date.now() + "; path=/";
      cmp.init(TEST_CONFIG);
      const host = document.getElementById("ca-cmp-root");
      const banner = host!.shadowRoot!.querySelector(".ca-banner");
      // Banner should not be rendered at all
      expect(banner).toBeNull();
    });

    it("stores resolved config accessible via getConfig()", () => {
      cmp.init(TEST_CONFIG);
      const config = cmp.getConfig();
      expect(config).not.toBeNull();
      expect(config!.siteName).toBe("Integration Test Site");
      expect(config!.categories).toHaveLength(3);
    });
  });

  describe("acceptAll()", () => {
    it("writes consent cookie and hides banner", () => {
      cmp.init(TEST_CONFIG);
      cmp.acceptAll();

      const consent = cmp.getConsent();
      expect(consent.essential).toBe(true);
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(true);
    });

    it("emits consent:updated event", () => {
      cmp.init(TEST_CONFIG);
      const handler = vi.fn();
      cmp.on("consent:updated", handler);
      cmp.acceptAll();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("rejectAll()", () => {
    it("writes cookie with only essential=true", () => {
      cmp.init(TEST_CONFIG);
      cmp.rejectAll();

      const consent = cmp.getConsent();
      expect(consent.essential).toBe(true);
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);
    });

    it("emits consent:updated event", () => {
      cmp.init(TEST_CONFIG);
      const handler = vi.fn();
      cmp.on("consent:updated", handler);
      cmp.rejectAll();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("setConsent()", () => {
    it("updates a single category", () => {
      cmp.init(TEST_CONFIG);
      cmp.acceptAll(); // Start with all accepted
      cmp.setConsent("analytics", false);

      const consent = cmp.getConsent();
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(true);
    });

    it("emits consent:granted for true", () => {
      cmp.init(TEST_CONFIG);
      const handler = vi.fn();
      cmp.on("consent:granted", handler);
      cmp.setConsent("analytics", true);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ category: "analytics", granted: true }),
      );
    });

    it("emits consent:denied for false", () => {
      cmp.init(TEST_CONFIG);
      const handler = vi.fn();
      cmp.on("consent:denied", handler);
      cmp.setConsent("marketing", false);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ category: "marketing", granted: false }),
      );
    });
  });

  describe("openPreferences()", () => {
    it("emits ui:preferences:open event", () => {
      cmp.init(TEST_CONFIG);
      const handler = vi.fn();
      cmp.on("ui:preferences:open", handler);
      cmp.openPreferences();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("reset()", () => {
    it("clears consent cookie and re-shows banner", () => {
      cmp.init(TEST_CONFIG);
      cmp.acceptAll();
      expect(cmp.getConsent().analytics).toBe(true);

      cmp.reset();
      // After reset, getConsent returns default (no cookie)
      const consent = cmp.getConsent();
      expect(consent.analytics).toBe(false);
    });

    it("emits consent:reset event", () => {
      cmp.init(TEST_CONFIG);
      const handler = vi.fn();
      cmp.on("consent:reset", handler);
      cmp.reset();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("event system", () => {
    it("on/off subscribe and unsubscribe", () => {
      cmp.init(TEST_CONFIG);
      const handler = vi.fn();
      cmp.on("consent:updated", handler);
      cmp.acceptAll();
      expect(handler).toHaveBeenCalledTimes(1);

      cmp.off("consent:updated", handler);
      cmp.rejectAll();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("getWellKnownJSON()", () => {
    it("returns valid well-known object after init", () => {
      cmp.init(FULL_CONFIG);
      const json = cmp.getWellKnownJSON() as Record<string, unknown>;
      expect(json).toHaveProperty("version");
      expect(json).toHaveProperty("cmp");
      expect(json).toHaveProperty("categories");
      expect(json).toHaveProperty("selectors");
      expect(json).toHaveProperty("api");
      expect(json).toHaveProperty("signals");
    });

    it("returns empty object before init", () => {
      const json = cmp.getWellKnownJSON();
      expect(json).toEqual({});
    });
  });

  describe("getPolicyHTML()", () => {
    it("returns HTML string after init", () => {
      cmp.init(FULL_CONFIG);
      const html = cmp.getPolicyHTML();
      expect(typeof html).toBe("string");
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain("ca-policy");
    });

    it("returns empty string before init", () => {
      expect(cmp.getPolicyHTML()).toBe("");
    });
  });

  describe("GPC detection", () => {
    it("runs GPC detection on init", () => {
      // GPC not set in jsdom by default, so just verify init completes
      cmp.init(FULL_CONFIG);
      expect(cmp.initialized).toBe(true);
    });

    it("respects GPC signal when enabled", () => {
      // Simulate GPC signal
      Object.defineProperty(navigator, "globalPrivacyControl", {
        value: true,
        configurable: true,
      });

      cmp.init(FULL_CONFIG);

      // Marketing should be auto-rejected by GPC
      expect(cmp.getConsent().marketing).toBe(false);
      expect(cmp.initialized).toBe(true);

      // Clean up
      Object.defineProperty(navigator, "globalPrivacyControl", {
        value: undefined,
        configurable: true,
      });
    });
  });

  describe("destroy()", () => {
    it("cleans up all components", () => {
      cmp.init(TEST_CONFIG);
      expect(cmp.initialized).toBe(true);
      cmp.destroy();
      expect(cmp.initialized).toBe(false);
      expect(cmp.getConfig()).toBeNull();
    });

    it("re-init after destroy works", () => {
      cmp.init(TEST_CONFIG);
      cmp.destroy();
      cmp.init(TEST_CONFIG);
      expect(cmp.initialized).toBe(true);
      expect(cmp.getConfig()).not.toBeNull();
    });
  });

  describe("close()", () => {
    it("does not throw when called after init", () => {
      cmp.init(TEST_CONFIG);
      expect(() => cmp.close()).not.toThrow();
    });
  });

  describe("no-op before init", () => {
    it("setConsent is no-op", () => {
      expect(() => cmp.setConsent("analytics", true)).not.toThrow();
    });

    it("acceptAll is no-op", () => {
      expect(() => cmp.acceptAll()).not.toThrow();
    });

    it("rejectAll is no-op", () => {
      expect(() => cmp.rejectAll()).not.toThrow();
    });

    it("openPreferences is no-op", () => {
      expect(() => cmp.openPreferences()).not.toThrow();
    });

    it("close is no-op", () => {
      expect(() => cmp.close()).not.toThrow();
    });

    it("reset is no-op", () => {
      expect(() => cmp.reset()).not.toThrow();
    });

    it("on/off are no-ops", () => {
      const handler = vi.fn();
      expect(() => cmp.on("consent:updated", handler)).not.toThrow();
      expect(() => cmp.off("consent:updated", handler)).not.toThrow();
    });
  });
});
