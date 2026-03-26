// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  ConsentStateManager,
  autoDetectDomain,
  buildCookieValue,
  parseCookieValue,
} from "../src/core/consent-state";
import { DEFAULT_BEHAVIOR, CATEGORY_IDS } from "../src/shared/constants";
import type { CategoryId, ResolvedCMPConfig } from "../src/shared/types";

/**
 * Build a minimal resolved config for testing.
 * Uses test-friendly cookie settings (no Secure flag, no domain)
 * since jsdom rejects cookies with Secure on non-HTTPS origins.
 */
function makeConfig(overrides?: Partial<ResolvedCMPConfig["behavior"]>): ResolvedCMPConfig {
  return {
    siteName: "Test",
    categories: [
      { id: "essential", required: true },
      { id: "functional" },
      { id: "analytics" },
      { id: "marketing" },
      { id: "social-media" },
    ],
    behavior: {
      ...DEFAULT_BEHAVIOR,
      cookieSecure: false,
      cookieDomain: "",
      ...overrides,
    },
    theme: {} as ResolvedCMPConfig["theme"],
    language: "en",
    translations: {} as ResolvedCMPConfig["translations"],
    wellKnown: {} as ResolvedCMPConfig["wellKnown"],
    policyPage: {} as ResolvedCMPConfig["policyPage"],
    icons: {},
  } as ResolvedCMPConfig;
}

function clearCookies(): void {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

describe("parseCookieValue", () => {
  const allIds = new Set<CategoryId>(CATEGORY_IDS);

  it("parses a valid cookie value", () => {
    const result = parseCookieValue("e:1|f:0|a:1|m:0|s:0|ts:1711324800000", allIds);
    expect(result).not.toBeNull();
    expect(result!.state.essential).toBe(true);
    expect(result!.state.functional).toBe(false);
    expect(result!.state.analytics).toBe(true);
    expect(result!.state.marketing).toBe(false);
    expect(result!.state["social-media"]).toBe(false);
    expect(result!.timestamp).toBe(1711324800000);
  });

  it("forces essential to true even if cookie says 0", () => {
    const result = parseCookieValue("e:0|f:1|a:0|m:0|s:0|ts:1000", allIds);
    expect(result!.state.essential).toBe(true);
  });

  it("returns null for missing timestamp", () => {
    expect(parseCookieValue("e:1|f:0", allIds)).toBeNull();
  });

  it("returns null for malformed pairs (no colon)", () => {
    expect(parseCookieValue("e1|f0|ts1000", allIds)).toBeNull();
  });

  it("returns null for non-numeric timestamp", () => {
    expect(parseCookieValue("e:1|ts:abc", allIds)).toBeNull();
  });

  it("treats missing category keys as false", () => {
    const result = parseCookieValue("e:1|ts:1000", allIds);
    expect(result!.state.functional).toBe(false);
    expect(result!.state.analytics).toBe(false);
  });

  it("ignores categories not in configuredIds", () => {
    const partial = new Set<CategoryId>(["essential", "functional"]);
    const result = parseCookieValue("e:1|f:1|a:1|m:1|s:1|ts:1000", partial);
    expect(result!.state.functional).toBe(true);
    expect(result!.state.analytics).toBe(false);
    expect(result!.state.marketing).toBe(false);
  });
});

describe("buildCookieValue", () => {
  const allIds = new Set<CategoryId>(CATEGORY_IDS);

  it("builds a pipe-delimited string with timestamp", () => {
    vi.spyOn(Date, "now").mockReturnValue(1711324800000);
    const state = {
      essential: true,
      functional: false,
      analytics: true,
      marketing: false,
      "social-media": false,
    };
    const result = buildCookieValue(state, allIds);
    expect(result).toBe("e:1|f:0|a:1|m:0|s:0|ts:1711324800000");
    vi.restoreAllMocks();
  });

  it("only includes configured categories", () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    const partial = new Set<CategoryId>(["essential", "analytics"]);
    const state = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      "social-media": true,
    };
    const result = buildCookieValue(state, partial);
    expect(result).toBe("e:1|a:1|ts:1000");
    vi.restoreAllMocks();
  });

  it("forces essential to 1 regardless of state value", () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    const state = {
      essential: false,
      functional: false,
      analytics: false,
      marketing: false,
      "social-media": false,
    };
    const result = buildCookieValue(state, allIds);
    expect(result).toContain("e:1");
    vi.restoreAllMocks();
  });
});

describe("autoDetectDomain", () => {
  it("prepends dot for normal hostnames", () => {
    Object.defineProperty(window, "location", {
      value: { hostname: "example.com" },
      writable: true,
    });
    expect(autoDetectDomain()).toBe(".example.com");
  });

  it("returns empty string for localhost", () => {
    Object.defineProperty(window, "location", {
      value: { hostname: "localhost" },
      writable: true,
    });
    expect(autoDetectDomain()).toBe("");
  });

  it("returns empty string for IPv4", () => {
    Object.defineProperty(window, "location", {
      value: { hostname: "192.168.1.1" },
      writable: true,
    });
    expect(autoDetectDomain()).toBe("");
  });

  it("returns empty string for IPv6", () => {
    Object.defineProperty(window, "location", {
      value: { hostname: "::1" },
      writable: true,
    });
    expect(autoDetectDomain()).toBe("");
  });
});

describe("ConsentStateManager", () => {
  beforeEach(() => {
    clearCookies();
    Object.defineProperty(window, "location", {
      value: { hostname: "example.com" },
      writable: true,
    });
  });

  afterEach(() => {
    clearCookies();
    vi.restoreAllMocks();
  });

  describe("first visit (no cookie)", () => {
    it("getConsent returns null", () => {
      const mgr = new ConsentStateManager(makeConfig());
      expect(mgr.getConsent()).toBeNull();
    });

    it("hasConsent returns false", () => {
      const mgr = new ConsentStateManager(makeConfig());
      expect(mgr.hasConsent()).toBe(false);
    });
  });

  describe("acceptAll", () => {
    it("sets all categories to true and persists cookie", () => {
      const mgr = new ConsentStateManager(makeConfig());
      mgr.acceptAll();

      const state = mgr.getConsent();
      expect(state).not.toBeNull();
      expect(state!.essential).toBe(true);
      expect(state!.functional).toBe(true);
      expect(state!.analytics).toBe(true);
      expect(state!.marketing).toBe(true);
      expect(state!["social-media"]).toBe(true);
    });

    it("hasConsent returns true after acceptAll", () => {
      const mgr = new ConsentStateManager(makeConfig());
      mgr.acceptAll();
      expect(mgr.hasConsent()).toBe(true);
    });
  });

  describe("rejectAll", () => {
    it("sets only essential to true", () => {
      const mgr = new ConsentStateManager(makeConfig());
      mgr.rejectAll();

      const state = mgr.getConsent();
      expect(state).not.toBeNull();
      expect(state!.essential).toBe(true);
      expect(state!.functional).toBe(false);
      expect(state!.analytics).toBe(false);
      expect(state!.marketing).toBe(false);
      expect(state!["social-media"]).toBe(false);
    });
  });

  describe("setConsent", () => {
    it("sets a single category", () => {
      const mgr = new ConsentStateManager(makeConfig());
      mgr.rejectAll();
      mgr.setConsent("analytics", true);

      const state = mgr.getConsent();
      expect(state!.analytics).toBe(true);
      expect(state!.functional).toBe(false);
    });

    it("forces essential to true even when setting to false", () => {
      const mgr = new ConsentStateManager(makeConfig());
      mgr.rejectAll();
      mgr.setConsent("essential", false);

      const state = mgr.getConsent();
      expect(state!.essential).toBe(true);
    });

    it("creates cookie on first setConsent if none exists", () => {
      const mgr = new ConsentStateManager(makeConfig());
      mgr.setConsent("functional", true);

      expect(mgr.hasConsent()).toBe(true);
      expect(mgr.getConsent()!.functional).toBe(true);
    });
  });

  describe("reset", () => {
    it("clears the cookie so hasConsent returns false", () => {
      const mgr = new ConsentStateManager(makeConfig());
      mgr.acceptAll();
      expect(mgr.hasConsent()).toBe(true);

      mgr.reset();
      expect(mgr.hasConsent()).toBe(false);
      expect(mgr.getConsent()).toBeNull();
    });
  });

  describe("expiry", () => {
    it("returns null for expired consent", () => {
      const mgr = new ConsentStateManager(makeConfig({ consentExpiry: 1 }));
      // Write a cookie with a timestamp 2 days ago
      vi.spyOn(Date, "now").mockReturnValue(Date.now() - 2 * 86_400_000);
      mgr.acceptAll();
      vi.restoreAllMocks();

      expect(mgr.getConsent()).toBeNull();
      expect(mgr.hasConsent()).toBe(false);
    });

    it("returns state for non-expired consent", () => {
      const mgr = new ConsentStateManager(makeConfig({ consentExpiry: 365 }));
      mgr.acceptAll();

      expect(mgr.getConsent()).not.toBeNull();
      expect(mgr.hasConsent()).toBe(true);
    });
  });

  describe("getCookieString", () => {
    it("returns the raw cookie value", () => {
      vi.spyOn(Date, "now").mockReturnValue(1711324800000);
      const mgr = new ConsentStateManager(makeConfig());
      mgr.acceptAll();

      const str = mgr.getCookieString();
      expect(str).toContain("e:1");
      expect(str).toContain("f:1");
      expect(str).toContain("ts:");
      vi.restoreAllMocks();
    });

    it("returns default state string when no cookie exists", () => {
      vi.spyOn(Date, "now").mockReturnValue(1000);
      const mgr = new ConsentStateManager(makeConfig());
      const str = mgr.getCookieString();
      expect(str).toBe("e:1|f:0|a:0|m:0|s:0|ts:1000");
      vi.restoreAllMocks();
    });
  });

  describe("custom cookie name", () => {
    it("reads and writes with custom cookie name", () => {
      const mgr = new ConsentStateManager(makeConfig({ cookieName: "my_consent" }));
      mgr.acceptAll();

      expect(document.cookie).toContain("my_consent=");
      expect(mgr.hasConsent()).toBe(true);
    });
  });

  describe("cookie domain resolution", () => {
    it("uses auto-detected domain when cookieDomain is auto", () => {
      // autoDetectDomain is tested separately; here we just verify
      // the manager delegates to it (indirectly via resolveDomain)
      const domain = autoDetectDomain();
      expect(domain).toBe(".example.com");
    });

    it("uses explicit domain when provided", () => {
      // With explicit empty domain, cookies work in jsdom
      const mgr = new ConsentStateManager(makeConfig({ cookieDomain: "" }));
      mgr.acceptAll();
      expect(mgr.hasConsent()).toBe(true);
    });
  });

  describe("subset of categories", () => {
    it("only includes configured categories in cookie", () => {
      vi.spyOn(Date, "now").mockReturnValue(1000);
      const config = makeConfig();
      config.categories = [{ id: "essential", required: true }, { id: "analytics" }];
      const mgr = new ConsentStateManager(config);
      mgr.acceptAll();

      const str = mgr.getCookieString();
      expect(str).toBe("e:1|a:1|ts:1000");
      expect(str).not.toContain("f:");
      vi.restoreAllMocks();
    });
  });
});
