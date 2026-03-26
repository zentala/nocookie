import { describe, it, expect } from "vitest";
import { WellKnownGenerator } from "../src/integration/well-known";
import type { WellKnownCookieConsent } from "../src/integration/well-known";
import type { ResolvedCMPConfig } from "../src/shared/types";
import {
  DEFAULT_BEHAVIOR,
  DEFAULT_THEME,
  DEFAULT_TRANSLATIONS,
  DEFAULT_WELL_KNOWN,
  DEFAULT_POLICY_PAGE,
} from "../src/shared/constants";

/** Build a resolved config with sensible defaults. */
function makeConfig(overrides?: Partial<ResolvedCMPConfig>): ResolvedCMPConfig {
  return {
    siteName: "Test Site",
    categories: [
      { id: "essential", name: "Strictly Necessary", required: true },
      { id: "analytics", name: "Analytics" },
    ],
    theme: DEFAULT_THEME,
    behavior: DEFAULT_BEHAVIOR,
    language: "en",
    translations: DEFAULT_TRANSLATIONS,
    wellKnown: DEFAULT_WELL_KNOWN,
    policyPage: DEFAULT_POLICY_PAGE,
    icons: {},
    ...overrides,
  };
}

describe("WellKnownGenerator", () => {
  describe("generate()", () => {
    it("returns correct top-level structure", () => {
      const gen = new WellKnownGenerator(makeConfig());
      const result = gen.generate();

      expect(result.version).toBe("1.0");
      expect(result.cmp).toEqual({
        name: "NoCookie CMP",
        version: "0.1.0",
        homepage: "https://nocookie.zentala.io",
      });
      expect(result.categories).toBeDefined();
      expect(result.selectors).toBeDefined();
      expect(result.api).toBeDefined();
      expect(result.categorySelectors).toBeDefined();
      expect(result.signals).toBeDefined();
    });

    it("maps categories from config", () => {
      const gen = new WellKnownGenerator(makeConfig());
      const result = gen.generate();

      expect(result.categories).toHaveLength(2);
      expect(result.categories[0]).toEqual({
        id: "essential",
        name: "Strictly Necessary",
        required: true,
        cookies: [],
      });
      expect(result.categories[1]).toEqual({
        id: "analytics",
        name: "Analytics",
        required: false,
        cookies: [],
      });
    });

    it("uses default name from CATEGORY_META when not provided", () => {
      const gen = new WellKnownGenerator(
        makeConfig({
          categories: [{ id: "marketing" }],
        }),
      );
      const result = gen.generate();

      expect(result.categories[0].name).toBe("Marketing & Advertising");
    });

    it("includes cookies in category output", () => {
      const gen = new WellKnownGenerator(
        makeConfig({
          categories: [
            {
              id: "analytics",
              cookies: [
                {
                  name: "_ga",
                  provider: "Google",
                  duration: "2 years",
                  purpose: "Distinguish users",
                },
              ],
            },
          ],
        }),
      );
      const result = gen.generate();

      expect(result.categories[0].cookies).toEqual([
        {
          name: "_ga",
          provider: "Google",
          duration: "2 years",
          purpose: "Distinguish users",
        },
      ]);
    });

    it("generates correct selectors", () => {
      const gen = new WellKnownGenerator(makeConfig());
      const result = gen.generate();

      expect(result.selectors).toEqual({
        banner: "#ca-cmp-root",
        acceptAll: ".ca-btn--accept",
        rejectAll: ".ca-btn--reject",
        preferences: ".ca-btn--customize",
        save: ".ca-btn--save",
      });
    });

    it("generates correct API references", () => {
      const gen = new WellKnownGenerator(makeConfig());
      const result = gen.generate();

      expect(result.api).toEqual({
        acceptAll: "NoCookieCMP.acceptAll()",
        rejectAll: "NoCookieCMP.rejectAll()",
        setConsent: "NoCookieCMP.setConsent(category, granted)",
        getConsent: "NoCookieCMP.getConsent()",
        openPreferences: "NoCookieCMP.openPreferences()",
      });
    });

    it("builds categorySelectors for each category", () => {
      const gen = new WellKnownGenerator(makeConfig());
      const result = gen.generate();

      expect(result.categorySelectors).toEqual({
        essential: { toggle: 'input[data-category-id="essential"]' },
        analytics: { toggle: 'input[data-category-id="analytics"]' },
      });
    });

    it("reflects GPC and TCF flags from behavior config", () => {
      const gen = new WellKnownGenerator(
        makeConfig({
          behavior: {
            ...DEFAULT_BEHAVIOR,
            respectGPC: true,
            emitTCFSignal: true,
          },
        }),
      );
      const result = gen.generate();

      expect(result.signals).toEqual({ gpc: true, tcf: true });
    });

    it("reflects disabled GPC and TCF", () => {
      const gen = new WellKnownGenerator(
        makeConfig({
          behavior: {
            ...DEFAULT_BEHAVIOR,
            respectGPC: false,
            emitTCFSignal: false,
          },
        }),
      );
      const result = gen.generate();

      expect(result.signals).toEqual({ gpc: false, tcf: false });
    });

    it("includes contact when privacyContact is set", () => {
      const gen = new WellKnownGenerator(makeConfig({ privacyContact: "privacy@example.com" }));
      const result = gen.generate();

      expect(result.contact).toBe("privacy@example.com");
    });

    it("omits contact when privacyContact is not set", () => {
      const gen = new WellKnownGenerator(makeConfig());
      const result = gen.generate();

      expect(result.contact).toBeUndefined();
    });

    it("includes policyUrl when set", () => {
      const gen = new WellKnownGenerator(makeConfig({ policyUrl: "/cookie-policy" }));
      const result = gen.generate();

      expect(result.policyUrl).toBe("/cookie-policy");
    });

    it("omits policyUrl when not set", () => {
      const gen = new WellKnownGenerator(makeConfig());
      const result = gen.generate();

      expect(result.policyUrl).toBeUndefined();
    });
  });

  describe("toJSON()", () => {
    it("returns a valid JSON string", () => {
      const gen = new WellKnownGenerator(makeConfig());
      const json = gen.toJSON();

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it("produces formatted output with 2-space indent", () => {
      const gen = new WellKnownGenerator(makeConfig());
      const json = gen.toJSON();
      const parsed = JSON.parse(json) as WellKnownCookieConsent;
      const expected = JSON.stringify(parsed, null, 2);

      expect(json).toBe(expected);
    });

    it("round-trips to the same object as generate()", () => {
      const gen = new WellKnownGenerator(
        makeConfig({
          privacyContact: "dpo@site.com",
          policyUrl: "/privacy",
        }),
      );
      const fromGenerate = gen.generate();
      const fromJSON = JSON.parse(gen.toJSON()) as WellKnownCookieConsent;

      expect(fromJSON).toEqual(fromGenerate);
    });
  });
});
