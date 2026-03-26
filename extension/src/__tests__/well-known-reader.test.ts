/**
 * Tests for the well-known cookie consent reader.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeMock } from "./helpers/chrome-storage-mock";
import {
  validateWellKnown,
  fetchWellKnown,
  getWellKnown,
  wellKnownToRule,
  wellKnownRuleSource,
  setWellKnownRule,
  clearWellKnownRule,
  wireToInternalCategory,
} from "@/content/well-known-reader";
import type { WellKnownCookieConsent } from "@/shared/types";

const { localMock } = installChromeMock();

const VALID_MINIMAL: WellKnownCookieConsent = {
  version: "1.0",
  categories: ["essential"],
};

const VALID_FULL: WellKnownCookieConsent = {
  version: "1.0",
  categories: ["essential", "functional", "analytics", "marketing"],
  cmp: { name: "my-cmp", version: "2.0" },
  selectors: {
    banner: "#cookie-banner",
    acceptAll: "#accept-btn",
    rejectAll: "#reject-btn",
    preferences: "#prefs-btn",
    save: "#save-btn",
  },
  categorySelectors: {
    functional: { toggle: "#func-toggle", cmpId: "func_cookies" },
    analytics: { toggle: "#analytics-toggle", cmpId: "analytics_cookies" },
  },
  api: {
    type: "custom",
    acceptAll: "window.CMP.acceptAll()",
    rejectAll: "window.CMP.rejectAll()",
    setCategory: "window.CMP.setCategory()",
  },
  gpc: true,
  tcf: false,
  contact: "privacy@example.com",
  policyUrl: "https://example.com/privacy",
};

function mockFetch(response: {
  ok?: boolean;
  status?: number;
  json?: unknown;
  throwError?: Error;
}): void {
  globalThis.fetch = vi.fn(() => {
    if (response.throwError) return Promise.reject(response.throwError);
    return Promise.resolve({
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: () => Promise.resolve(response.json),
    } as Response);
  });
}

beforeEach(() => {
  localMock._reset();
  clearWellKnownRule();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("validateWellKnown", () => {
  it("accepts valid minimal file", () => {
    expect(validateWellKnown(VALID_MINIMAL)).toBe(true);
  });
  it("accepts valid full file", () => {
    expect(validateWellKnown(VALID_FULL)).toBe(true);
  });
  it("rejects missing version", () => {
    expect(validateWellKnown({ categories: ["essential"] })).toBe(false);
  });
  it("rejects invalid version format", () => {
    expect(validateWellKnown({ version: "v1", categories: ["essential"] })).toBe(false);
  });
  it("rejects missing categories", () => {
    expect(validateWellKnown({ version: "1.0" })).toBe(false);
  });
  it("rejects categories without essential", () => {
    expect(validateWellKnown({ version: "1.0", categories: ["analytics"] })).toBe(false);
  });
  it("rejects null", () => {
    expect(validateWellKnown(null)).toBe(false);
  });
  it("rejects array", () => {
    expect(validateWellKnown([1, 2])).toBe(false);
  });
  it("rejects primitive", () => {
    expect(validateWellKnown("string")).toBe(false);
  });
  it("ignores unknown fields (forward-compatible)", () => {
    expect(validateWellKnown({ version: "1.0", categories: ["essential"], future: 1 })).toBe(true);
  });
});

describe("fetchWellKnown", () => {
  it("succeeds with valid JSON", async () => {
    mockFetch({ json: VALID_MINIMAL });
    const result = await fetchWellKnown("example.com");
    expect(result).toEqual(VALID_MINIMAL);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://example.com/.well-known/cookie-consent.json",
      expect.objectContaining({ cache: "default" }),
    );
  });
  it("returns null on 404", async () => {
    mockFetch({ ok: false, status: 404 });
    expect(await fetchWellKnown("example.com")).toBeNull();
  });
  it("returns null on network error", async () => {
    mockFetch({ throwError: new TypeError("Failed to fetch") });
    expect(await fetchWellKnown("example.com")).toBeNull();
  });
  it("returns null on timeout (abort)", async () => {
    mockFetch({ throwError: new DOMException("Aborted", "AbortError") });
    expect(await fetchWellKnown("example.com")).toBeNull();
  });
  it("returns null on invalid JSON structure", async () => {
    mockFetch({ json: { noVersion: true } });
    expect(await fetchWellKnown("example.com")).toBeNull();
  });
});

describe("getWellKnown", () => {
  it("returns cached data without fetching when cache is fresh", async () => {
    mockFetch({ json: VALID_MINIMAL });
    await localMock.set({
      wellKnownCache: {
        "example.com": { data: VALID_FULL, fetchedAt: Date.now(), ttl: 86400000 },
      },
    });
    const result = await getWellKnown("example.com");
    expect(result).toEqual(VALID_FULL);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it("fetches when cache is missing", async () => {
    mockFetch({ json: VALID_MINIMAL });
    expect(await getWellKnown("new-domain.com")).toEqual(VALID_MINIMAL);
    expect(globalThis.fetch).toHaveBeenCalled();
  });
  it("re-fetches when cache is expired", async () => {
    mockFetch({ json: VALID_MINIMAL });
    await localMock.set({
      wellKnownCache: {
        "example.com": { data: VALID_FULL, fetchedAt: Date.now() - 90000000, ttl: 86400000 },
      },
    });
    expect(await getWellKnown("example.com")).toEqual(VALID_MINIMAL);
    expect(globalThis.fetch).toHaveBeenCalled();
  });
  it("caches null on failed fetch with shorter TTL", async () => {
    mockFetch({ ok: false, status: 404 });
    expect(await getWellKnown("missing.com")).toBeNull();
    const store = localMock._store();
    const cache = store.wellKnownCache as Record<string, { data: unknown; ttl: number }>;
    expect(cache["missing.com"].data).toBeNull();
    expect(cache["missing.com"].ttl).toBe(3600000);
  });
});

describe("wellKnownToRule", () => {
  it("generates correct CMPRule from full data", () => {
    const rule = wellKnownToRule(VALID_FULL);
    expect(rule.name).toBe("my-cmp");
    expect(rule.detection.domSelectors).toEqual(["#cookie-banner"]);
    expect(rule.actions.acceptAll).toEqual([{ type: "eval", value: "window.CMP.acceptAll()" }]);
    expect(rule.actions.rejectAll).toEqual([{ type: "eval", value: "window.CMP.rejectAll()" }]);
    expect(rule.categoryMapping.functional).toBe("func_cookies");
    expect(rule.categoryMapping.analytics).toBe("analytics_cookies");
  });
  it("generates rule with click actions from selectors (no API)", () => {
    const data: WellKnownCookieConsent = {
      version: "1.0",
      categories: ["essential"],
      selectors: { acceptAll: "#accept", rejectAll: "#reject" },
    };
    const rule = wellKnownToRule(data);
    expect(rule.actions.acceptAll).toEqual([{ type: "click", target: "#accept" }]);
    expect(rule.actions.rejectAll).toEqual([{ type: "click", target: "#reject" }]);
  });
  it("uses 'well-known' as default CMP name", () => {
    expect(wellKnownToRule(VALID_MINIMAL).name).toBe("well-known");
  });
  it("uses default category mapping when no categorySelectors", () => {
    expect(wellKnownToRule(VALID_MINIMAL).categoryMapping).toEqual({
      functional: "functional",
      analytics: "analytics",
      marketing: "marketing",
      socialMedia: "socialMedia",
    });
  });
  it("produces empty actions when no selectors or api", () => {
    const rule = wellKnownToRule(VALID_MINIMAL);
    expect(rule.actions.acceptAll).toEqual([]);
    expect(rule.actions.rejectAll).toEqual([]);
    expect(rule.actions.custom).toEqual([]);
  });
});

describe("wireToInternalCategory", () => {
  it("maps social-media to socialMedia", () => {
    expect(wireToInternalCategory("social-media")).toBe("socialMedia");
  });
  it("passes through already-camelCase categories", () => {
    expect(wireToInternalCategory("functional")).toBe("functional");
    expect(wireToInternalCategory("analytics")).toBe("analytics");
    expect(wireToInternalCategory("marketing")).toBe("marketing");
    expect(wireToInternalCategory("essential")).toBe("essential");
  });
  it("passes through unknown categories unchanged", () => {
    expect(wireToInternalCategory("custom-unknown")).toBe("custom-unknown");
  });
});

describe("wellKnownToRule with wire-format social-media", () => {
  it("maps social-media categorySelector to socialMedia in categoryMapping", () => {
    const data: WellKnownCookieConsent = {
      version: "1.0",
      categories: ["essential", "socialMedia"],
      categorySelectors: {
        "social-media": { toggle: "#social-toggle", cmpId: "social_cookies" },
      },
    };
    const rule = wellKnownToRule(data);
    expect(rule.categoryMapping.socialMedia).toBe("social_cookies");
  });
  it("includes social-media toggle in custom actions", () => {
    const data: WellKnownCookieConsent = {
      version: "1.0",
      categories: ["essential", "socialMedia"],
      categorySelectors: {
        "social-media": { toggle: "#social-toggle" },
      },
      selectors: { save: "#save-btn" },
    };
    const rule = wellKnownToRule(data);
    expect(rule.actions.custom).toContainEqual({
      type: "toggle",
      target: "#social-toggle",
    });
  });
});

describe("wellKnownRuleSource", () => {
  it("has correct name and priority", () => {
    expect(wellKnownRuleSource.name).toBe("well-known");
    expect(wellKnownRuleSource.priority).toBe(1);
  });
  it("returns null when no cached rule", () => {
    expect(wellKnownRuleSource.match("well-known")).toBeNull();
  });
  it("returns cached rule for 'well-known' CMP name", () => {
    const rule = wellKnownToRule(VALID_FULL);
    setWellKnownRule(rule);
    expect(wellKnownRuleSource.match("well-known")).toBe(rule);
  });
  it("returns null for non-well-known CMP names", () => {
    setWellKnownRule(wellKnownToRule(VALID_FULL));
    expect(wellKnownRuleSource.match("onetrust")).toBeNull();
  });
});
