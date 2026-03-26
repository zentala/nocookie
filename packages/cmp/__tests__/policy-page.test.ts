// @vitest-environment jsdom
/**
 * @module tests/policy-page
 * Unit tests for the PolicyPageGenerator: HTML generation, sections,
 * badges, cookie tables, standalone vs injection mode, and contact info.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PolicyPageGenerator } from "@/ui/policy-page";
import type { ResolvedCMPConfig } from "@/shared/types";
import {
  DEFAULT_THEME,
  DEFAULT_BEHAVIOR,
  DEFAULT_TRANSLATIONS,
  DEFAULT_WELL_KNOWN,
  DEFAULT_POLICY_PAGE,
} from "@/shared/constants";

/** Minimal resolved config factory for tests. */
function createConfig(overrides: Partial<ResolvedCMPConfig> = {}): ResolvedCMPConfig {
  return {
    siteName: "Test Site",
    categories: [{ id: "essential", required: true }, { id: "analytics" }],
    theme: { ...DEFAULT_THEME },
    behavior: { ...DEFAULT_BEHAVIOR },
    language: "en",
    translations: { ...DEFAULT_TRANSLATIONS },
    wellKnown: { ...DEFAULT_WELL_KNOWN },
    policyPage: { ...DEFAULT_POLICY_PAGE },
    icons: {},
    ...overrides,
  };
}

describe("PolicyPageGenerator", () => {
  let generator: PolicyPageGenerator;

  beforeEach(() => {
    generator = new PolicyPageGenerator(createConfig());
  });

  describe("generateHTML", () => {
    it("wraps output in .ca-policy container", () => {
      const html = generator.generateHTML();
      expect(html).toMatch(/^<div class="ca-policy">/);
      expect(html).toMatch(/<\/div>$/);
    });

    it("includes the site name in the header", () => {
      const html = generator.generateHTML();
      expect(html).toContain("Test Site");
    });

    it("includes the policy title from config", () => {
      const gen = new PolicyPageGenerator(
        createConfig({ policyPage: { enabled: true, title: "Our Cookies", intro: "" } }),
      );
      const html = gen.generateHTML();
      expect(html).toContain("Our Cookies");
    });

    it("includes last updated timestamp", () => {
      const html = generator.generateHTML();
      expect(html).toContain("Last updated:");
      expect(html).toContain("ca-policy__meta");
    });
  });

  describe("sections", () => {
    it("includes What Are Cookies section", () => {
      const html = generator.generateHTML();
      expect(html).toContain("1. What Are Cookies");
      expect(html).toContain("small text files");
    });

    it("includes How We Use Cookies section", () => {
      const html = generator.generateHTML();
      expect(html).toContain("2. How We Use Cookies");
    });

    it("includes Managing Your Preferences section", () => {
      const html = generator.generateHTML();
      expect(html).toContain("3. Managing Your Preferences");
    });

    it("includes Your Rights section with GDPR references", () => {
      const html = generator.generateHTML();
      expect(html).toContain("4. Your Rights");
      expect(html).toContain("General Data Protection Regulation");
      expect(html).toContain("ePrivacy Directive");
      expect(html).toContain("Global Privacy Control");
    });

    it("includes Powered by NoCookie footer", () => {
      const html = generator.generateHTML();
      expect(html).toContain("Powered by");
      expect(html).toContain("NoCookie");
      expect(html).toContain("ca-policy__footer");
    });
  });

  describe("badges", () => {
    it("includes privacy level badge", () => {
      const html = generator.generateHTML();
      expect(html).toContain("ca-badge--privacy");
    });

    it("includes GDPR compliance badge", () => {
      const html = generator.generateHTML();
      expect(html).toContain("ca-badge--gdpr");
    });

    it("includes GPC compliance badge", () => {
      const html = generator.generateHTML();
      expect(html).toContain("ca-badge--gpc");
    });

    it("includes standard compliance badge", () => {
      const html = generator.generateHTML();
      expect(html).toContain("ca-badge--standard");
    });

    it("wraps badges in ca-policy__badges container", () => {
      const html = generator.generateHTML();
      expect(html).toContain('class="ca-policy__badges"');
    });
  });

  describe("categories", () => {
    it("renders each configured category", () => {
      const html = generator.generateHTML();
      expect(html).toContain("Strictly Necessary");
      expect(html).toContain("Analytics");
    });

    it("renders category icons", () => {
      const html = generator.generateHTML();
      expect(html).toContain("ca-icon");
    });

    it("marks required categories as always active", () => {
      const html = generator.generateHTML();
      expect(html).toContain("Always active");
    });

    it("renders category descriptions", () => {
      const html = generator.generateHTML();
      expect(html).toContain("essential for the website");
    });

    it("uses custom category name when provided", () => {
      const gen = new PolicyPageGenerator(
        createConfig({
          categories: [{ id: "essential", name: "Must-Have", required: true }],
        }),
      );
      const html = gen.generateHTML();
      expect(html).toContain("Must-Have");
    });
  });

  describe("cookie tables", () => {
    it("renders cookie table when cookies are declared", () => {
      const gen = new PolicyPageGenerator(
        createConfig({
          categories: [
            {
              id: "analytics",
              cookies: [
                {
                  name: "_ga",
                  provider: "Google Analytics",
                  duration: "2 years",
                  purpose: "Distinguishes users",
                  type: "third-party",
                },
              ],
            },
          ],
        }),
      );
      const html = gen.generateHTML();
      expect(html).toContain("ca-policy__cookie-table");
      expect(html).toContain("_ga");
      expect(html).toContain("Google Analytics");
      expect(html).toContain("2 years");
      expect(html).toContain("Distinguishes users");
      expect(html).toContain("third-party");
    });

    it("does not render table when no cookies are declared", () => {
      const html = generator.generateHTML();
      expect(html).not.toContain("ca-policy__cookie-table");
    });

    it("defaults cookie type to first-party", () => {
      const gen = new PolicyPageGenerator(
        createConfig({
          categories: [
            {
              id: "essential",
              cookies: [
                { name: "session", provider: "Self", duration: "Session", purpose: "Auth" },
              ],
            },
          ],
        }),
      );
      const html = gen.generateHTML();
      expect(html).toContain("first-party");
    });

    it("includes table headers", () => {
      const gen = new PolicyPageGenerator(
        createConfig({
          categories: [
            {
              id: "essential",
              cookies: [{ name: "sid", provider: "Self", duration: "1h", purpose: "Session" }],
            },
          ],
        }),
      );
      const html = gen.generateHTML();
      expect(html).toContain("<th>Cookie</th>");
      expect(html).toContain("<th>Provider</th>");
      expect(html).toContain("<th>Purpose</th>");
      expect(html).toContain("<th>Duration</th>");
      expect(html).toContain("<th>Type</th>");
    });
  });

  describe("contact section", () => {
    it("renders privacy contact when provided", () => {
      const gen = new PolicyPageGenerator(createConfig({ privacyContact: "privacy@example.com" }));
      const html = gen.generateHTML();
      expect(html).toContain("5. Contact");
      expect(html).toContain("privacy@example.com");
    });

    it("renders DPO when provided", () => {
      const gen = new PolicyPageGenerator(createConfig({ dpo: "dpo@example.com" }));
      const html = gen.generateHTML();
      expect(html).toContain("Data Protection Officer");
      expect(html).toContain("dpo@example.com");
    });

    it("omits contact section when neither is provided", () => {
      const html = generator.generateHTML();
      expect(html).not.toContain("5. Contact");
    });
  });

  describe("change preferences button", () => {
    it("renders a change preferences button", () => {
      const html = generator.generateHTML();
      expect(html).toContain("Change my preferences");
      expect(html).toContain("ca-policy__change-btn");
    });

    it("includes data attribute for action binding", () => {
      const html = generator.generateHTML();
      expect(html).toContain('data-ca-action="open-preferences"');
    });
  });

  describe("generateStandalonePage", () => {
    it("produces a complete HTML document", () => {
      const html = generator.generateStandalonePage();
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");
      expect(html).toContain("</html>");
    });

    it("includes meta viewport tag", () => {
      const html = generator.generateStandalonePage();
      expect(html).toContain("viewport");
    });

    it("includes charset meta tag", () => {
      const html = generator.generateStandalonePage();
      expect(html).toContain('charset="UTF-8"');
    });

    it("includes the site name in the title", () => {
      const html = generator.generateStandalonePage();
      expect(html).toContain("<title>");
      expect(html).toContain("Test Site");
    });

    it("embeds the full policy content in the body", () => {
      const html = generator.generateStandalonePage();
      expect(html).toContain('class="ca-policy"');
      expect(html).toContain("What Are Cookies");
    });
  });

  describe("inject", () => {
    it("injects HTML into a target element", () => {
      const target = document.createElement("div");
      target.id = "ca-policy";
      generator.inject(target);
      expect(target.querySelector(".ca-policy")).toBeTruthy();
      expect(target.textContent).toContain("Test Site");
    });

    it("replaces existing content in the target", () => {
      const target = document.createElement("div");
      target.textContent = "Old content";
      generator.inject(target);
      expect(target.textContent).not.toContain("Old content");
      expect(target.querySelector(".ca-policy")).toBeTruthy();
    });
  });

  describe("HTML escaping", () => {
    it("escapes special characters in site name", () => {
      const gen = new PolicyPageGenerator(
        createConfig({ siteName: '<script>alert("xss")</script>' }),
      );
      const html = gen.generateHTML();
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });
  });
});
