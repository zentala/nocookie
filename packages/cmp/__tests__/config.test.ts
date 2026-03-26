import { describe, it, expect } from "vitest";
import {
  parseConfig,
  expandCategory,
  isValidCategoryId,
  ConfigValidationError,
} from "../src/core/config";
import {
  DEFAULT_BEHAVIOR,
  DEFAULT_THEME,
  DEFAULT_TRANSLATIONS,
  DEFAULT_LANGUAGE,
  CATEGORY_META,
} from "../src/shared/constants";
import type { CategoryConfig, CMPConfig } from "../src/shared/types";

/** Helper to build a minimal valid config. */
function minimal(overrides?: Partial<CMPConfig>): CMPConfig {
  return {
    siteName: "Test Site",
    categories: ["essential"],
    ...overrides,
  };
}

describe("isValidCategoryId", () => {
  it("returns true for all standard category ids", () => {
    expect(isValidCategoryId("essential")).toBe(true);
    expect(isValidCategoryId("functional")).toBe(true);
    expect(isValidCategoryId("analytics")).toBe(true);
    expect(isValidCategoryId("marketing")).toBe(true);
    expect(isValidCategoryId("social-media")).toBe(true);
  });

  it("returns false for unknown ids", () => {
    expect(isValidCategoryId("tracking")).toBe(false);
    expect(isValidCategoryId("")).toBe(false);
    expect(isValidCategoryId("ESSENTIAL")).toBe(false);
  });
});

describe("expandCategory", () => {
  it("expands a string to full CategoryConfig with defaults", () => {
    const result = expandCategory("analytics");
    expect(result.id).toBe("analytics");
    expect(result.name).toBe(CATEGORY_META.analytics.name);
    expect(result.description).toBe(CATEGORY_META.analytics.description);
    expect(result.required).toBe(false);
    expect(result.defaultState).toBe(false);
    expect(result.cookies).toEqual([]);
  });

  it("expands essential as required with defaultState true", () => {
    const result = expandCategory("essential");
    expect(result.required).toBe(true);
    expect(result.defaultState).toBe(true);
  });

  it("preserves overrides from a CategoryConfig object", () => {
    const input: CategoryConfig = {
      id: "analytics",
      name: "Custom Analytics",
      description: "Custom description",
      cookies: [
        {
          name: "_ga",
          provider: "Google",
          duration: "2 years",
          purpose: "Analytics tracking",
        },
      ],
    };
    const result = expandCategory(input);
    expect(result.name).toBe("Custom Analytics");
    expect(result.description).toBe("Custom description");
    expect(result.cookies).toHaveLength(1);
    expect(result.cookies![0].name).toBe("_ga");
    // Defaults still applied for unset fields
    expect(result.required).toBe(false);
    expect(result.defaultState).toBe(false);
  });

  it("throws for unknown category id string", () => {
    expect(() => expandCategory("tracking")).toThrow(ConfigValidationError);
    expect(() => expandCategory("tracking")).toThrow(/Unknown category id/);
  });

  it("throws for unknown category id in object", () => {
    expect(() => expandCategory({ id: "tracking" as never })).toThrow(ConfigValidationError);
  });
});

describe("parseConfig", () => {
  describe("validation", () => {
    it("throws for null input", () => {
      expect(() => parseConfig(null)).toThrow(ConfigValidationError);
    });

    it("throws for undefined input", () => {
      expect(() => parseConfig(undefined)).toThrow(ConfigValidationError);
    });

    it("throws for non-object input", () => {
      expect(() => parseConfig("string")).toThrow(ConfigValidationError);
    });

    it("throws when siteName is missing", () => {
      expect(() => parseConfig({ categories: ["essential"] })).toThrow(/siteName/);
    });

    it("throws when siteName is empty", () => {
      expect(() => parseConfig({ siteName: "", categories: ["essential"] })).toThrow(/siteName/);
    });

    it("throws when categories is missing", () => {
      expect(() => parseConfig({ siteName: "Test" })).toThrow(/categories/);
    });

    it("throws when categories is empty", () => {
      expect(() => parseConfig({ siteName: "Test", categories: [] })).toThrow(/categories/);
    });

    it("throws for duplicate category ids", () => {
      expect(() => parseConfig(minimal({ categories: ["essential", "essential"] }))).toThrow(
        /Duplicate category id/,
      );
    });

    it("throws for unknown category string", () => {
      expect(() => parseConfig(minimal({ categories: ["essential", "invalid"] }))).toThrow(
        /Unknown category id/,
      );
    });
  });

  describe("minimal config expansion", () => {
    it("parses minimal string-array config", () => {
      const result = parseConfig(minimal({ categories: ["essential", "analytics"] }));
      expect(result.siteName).toBe("Test Site");
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].id).toBe("essential");
      expect(result.categories[1].id).toBe("analytics");
    });

    it("expands string categories to full objects", () => {
      const result = parseConfig(minimal());
      const cat = result.categories[0];
      expect(cat.name).toBe("Strictly Necessary");
      expect(cat.required).toBe(true);
      expect(cat.defaultState).toBe(true);
      expect(cat.cookies).toEqual([]);
    });

    it("handles mixed string and object categories", () => {
      const result = parseConfig(
        minimal({
          categories: [
            "essential",
            {
              id: "analytics",
              name: "My Analytics",
              cookies: [
                {
                  name: "_ga",
                  provider: "Google",
                  duration: "2 years",
                  purpose: "Tracking",
                },
              ],
            },
          ],
        }),
      );
      expect(result.categories[0].id).toBe("essential");
      expect(result.categories[1].name).toBe("My Analytics");
      expect(result.categories[1].cookies).toHaveLength(1);
    });
  });

  describe("default merging", () => {
    it("applies default theme values", () => {
      const result = parseConfig(minimal());
      expect(result.theme).toEqual(DEFAULT_THEME);
    });

    it("applies default behavior values", () => {
      const result = parseConfig(minimal());
      expect(result.behavior).toEqual(DEFAULT_BEHAVIOR);
    });

    it("applies default translations", () => {
      const result = parseConfig(minimal());
      expect(result.translations).toEqual(DEFAULT_TRANSLATIONS);
    });

    it("applies default language", () => {
      const result = parseConfig(minimal());
      expect(result.language).toBe(DEFAULT_LANGUAGE);
    });

    it("merges partial theme overrides with defaults", () => {
      const result = parseConfig(
        minimal({
          theme: { mode: "dark", borderRadius: 8 },
        }),
      );
      expect(result.theme.mode).toBe("dark");
      expect(result.theme.borderRadius).toBe(8);
      expect(result.theme.primaryColor).toBe(DEFAULT_THEME.primaryColor);
      expect(result.theme.animation).toBe(DEFAULT_THEME.animation);
    });

    it("merges partial behavior overrides with defaults", () => {
      const result = parseConfig(
        minimal({
          behavior: {
            consentExpiry: 180,
            respectDNT: true,
          },
        }),
      );
      expect(result.behavior.consentExpiry).toBe(180);
      expect(result.behavior.respectDNT).toBe(true);
      expect(result.behavior.cookieName).toBe(DEFAULT_BEHAVIOR.cookieName);
    });

    it("merges partial translation overrides", () => {
      const result = parseConfig(
        minimal({
          translations: { acceptAll: "Alles akzeptieren" },
        }),
      );
      expect(result.translations.acceptAll).toBe("Alles akzeptieren");
      expect(result.translations.rejectAll).toBe(DEFAULT_TRANSLATIONS.rejectAll);
    });
  });

  describe("optional fields", () => {
    it("passes through optional string fields", () => {
      const result = parseConfig(
        minimal({
          privacyContact: "privacy@example.com",
          dpo: "dpo@example.com",
          policyUrl: "https://example.com/privacy",
          siteUrl: "https://example.com",
          imprintUrl: "https://example.com/imprint",
        }),
      );
      expect(result.privacyContact).toBe("privacy@example.com");
      expect(result.dpo).toBe("dpo@example.com");
      expect(result.policyUrl).toBe("https://example.com/privacy");
      expect(result.siteUrl).toBe("https://example.com");
      expect(result.imprintUrl).toBe("https://example.com/imprint");
    });

    it("leaves optional fields undefined when not provided", () => {
      const result = parseConfig(minimal());
      expect(result.privacyContact).toBeUndefined();
      expect(result.dpo).toBeUndefined();
      expect(result.policyUrl).toBeUndefined();
    });

    it("resolves custom language", () => {
      const result = parseConfig(minimal({ language: "de" }));
      expect(result.language).toBe("de");
    });

    it("resolves icons config", () => {
      const result = parseConfig(
        minimal({
          icons: { essential: "shield", analytics: "bar-chart" },
        }),
      );
      expect(result.icons.essential).toBe("shield");
      expect(result.icons.analytics).toBe("bar-chart");
    });

    it("defaults icons to empty object", () => {
      const result = parseConfig(minimal());
      expect(result.icons).toEqual({});
    });
  });

  describe("all five categories", () => {
    it("resolves all standard categories from strings", () => {
      const result = parseConfig(
        minimal({
          categories: ["essential", "functional", "analytics", "marketing", "social-media"],
        }),
      );
      expect(result.categories).toHaveLength(5);
      expect(result.categories.map((c) => c.id)).toEqual([
        "essential",
        "functional",
        "analytics",
        "marketing",
        "social-media",
      ]);
    });
  });
});
