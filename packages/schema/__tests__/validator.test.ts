/**
 * Tests for the cookie-consent.json validator.
 *
 * Covers required fields, optional fields, type checks, format validation,
 * forward compatibility, warnings, and the validateString helper.
 */

import { describe, expect, it } from "vitest";
import { validate, validateString } from "../src/validator";

/** Minimal valid declaration used as a base for test variations. */
const MINIMAL_VALID = {
  version: "1.0",
  categories: ["essential"],
};

/** Full valid declaration with all optional fields. */
const FULL_VALID = {
  version: "1.0",
  categories: ["essential", "functional", "analytics", "marketing", "social-media"],
  cmp: { name: "MyCMP", version: "2.1" },
  selectors: {
    banner: "#cookie-banner",
    acceptAll: "#accept-all",
    rejectAll: "#reject-all",
    preferences: "#preferences",
    save: "#save",
  },
  categorySelectors: {
    analytics: { toggle: "#analytics-toggle", cmpId: "C0002" },
    marketing: { toggle: "#marketing-toggle", cmpId: "C0004" },
  },
  api: {
    type: "custom",
    acceptAll: "CMP.acceptAll()",
    rejectAll: "CMP.rejectAll()",
    setCategory: "CMP.setCategory(id, val)",
  },
  gpc: true,
  tcf: false,
  contact: "privacy@example.com",
  policyUrl: "https://example.com/privacy",
};

describe("validate", () => {
  describe("valid declarations", () => {
    it("accepts a minimal valid declaration", () => {
      const result = validate(MINIMAL_VALID);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual(MINIMAL_VALID);
    });

    it("accepts a full valid declaration", () => {
      const result = validate(FULL_VALID);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual(FULL_VALID);
    });

    it("accepts categories with only essential and functional", () => {
      const result = validate({
        version: "2.0",
        categories: ["essential", "functional"],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("root value", () => {
    it("rejects null", () => {
      const result = validate(null);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("JSON object");
    });

    it("rejects an array", () => {
      const result = validate([]);
      expect(result.valid).toBe(false);
    });

    it("rejects a string", () => {
      const result = validate("not an object");
      expect(result.valid).toBe(false);
    });

    it("rejects a number", () => {
      const result = validate(42);
      expect(result.valid).toBe(false);
    });
  });

  describe("version field", () => {
    it("errors when version is missing", () => {
      const result = validate({ categories: ["essential"] });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: "version", message: expect.stringContaining("missing") }),
      );
    });

    it("errors when version is not a string", () => {
      const result = validate({ version: 1.0, categories: ["essential"] });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: "version", message: expect.stringContaining("string") }),
      );
    });

    it("errors when version has invalid format", () => {
      const result = validate({ version: "v1.0.0", categories: ["essential"] });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: "version", message: expect.stringContaining("pattern") }),
      );
    });

    it("errors for semver format (three parts)", () => {
      const result = validate({ version: "1.0.0", categories: ["essential"] });
      expect(result.valid).toBe(false);
    });

    it("accepts valid version formats", () => {
      for (const v of ["1.0", "2.3", "10.99"]) {
        const result = validate({ version: v, categories: ["essential"] });
        expect(result.valid).toBe(true);
      }
    });
  });

  describe("categories field", () => {
    it("errors when categories is missing", () => {
      const result = validate({ version: "1.0" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: "categories",
          message: expect.stringContaining("missing"),
        }),
      );
    });

    it("errors when categories is not an array", () => {
      const result = validate({ version: "1.0", categories: "essential" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: "categories",
          message: expect.stringContaining("array"),
        }),
      );
    });

    it("errors when categories is missing essential", () => {
      const result = validate({ version: "1.0", categories: ["analytics"] });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: "categories",
          message: expect.stringContaining("essential"),
        }),
      );
    });

    it("errors on invalid category values", () => {
      const result = validate({
        version: "1.0",
        categories: ["essential", "tracking"],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: "categories[1]",
          value: "tracking",
        }),
      );
    });

    it("errors on non-string category values", () => {
      const result = validate({
        version: "1.0",
        categories: ["essential", 42],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: "categories[1]" }));
    });
  });

  describe("optional cmp field", () => {
    it("passes when cmp is a valid object", () => {
      const result = validate({
        ...MINIMAL_VALID,
        cmp: { name: "OneTrust", version: "6.0" },
      });
      expect(result.valid).toBe(true);
    });

    it("errors when cmp is not an object", () => {
      const result = validate({ ...MINIMAL_VALID, cmp: "OneTrust" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: "cmp" }));
    });

    it("errors when cmp.name is not a string", () => {
      const result = validate({ ...MINIMAL_VALID, cmp: { name: 123 } });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: "cmp.name" }));
    });
  });

  describe("optional selectors field", () => {
    it("passes with valid selectors", () => {
      const result = validate({
        ...MINIMAL_VALID,
        selectors: { banner: "#banner", acceptAll: ".btn-accept" },
      });
      expect(result.valid).toBe(true);
    });

    it("errors when selectors is not an object", () => {
      const result = validate({ ...MINIMAL_VALID, selectors: [] });
      expect(result.valid).toBe(false);
    });

    it("errors when a selector value is not a string", () => {
      const result = validate({
        ...MINIMAL_VALID,
        selectors: { banner: 42 },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: "selectors.banner" }));
    });
  });

  describe("optional categorySelectors field", () => {
    it("passes with valid categorySelectors", () => {
      const result = validate({
        ...MINIMAL_VALID,
        categorySelectors: {
          analytics: { toggle: "#toggle", cmpId: "C0002" },
        },
      });
      expect(result.valid).toBe(true);
    });

    it("errors when categorySelectors entry is not an object", () => {
      const result = validate({
        ...MINIMAL_VALID,
        categorySelectors: { analytics: "bad" },
      });
      expect(result.valid).toBe(false);
    });

    it("errors when toggle is not a string", () => {
      const result = validate({
        ...MINIMAL_VALID,
        categorySelectors: { analytics: { toggle: 123 } },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("optional api field", () => {
    it("passes with valid api object", () => {
      const result = validate({
        ...MINIMAL_VALID,
        api: { type: "custom", acceptAll: "accept()" },
      });
      expect(result.valid).toBe(true);
    });

    it("errors when api is not an object", () => {
      const result = validate({ ...MINIMAL_VALID, api: true });
      expect(result.valid).toBe(false);
    });

    it("errors when api.type is not a string", () => {
      const result = validate({
        ...MINIMAL_VALID,
        api: { type: 123 },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("boolean fields (gpc, tcf)", () => {
    it("passes with valid boolean values", () => {
      const result = validate({ ...MINIMAL_VALID, gpc: true, tcf: false });
      expect(result.valid).toBe(true);
    });

    it("errors when gpc is not a boolean", () => {
      const result = validate({ ...MINIMAL_VALID, gpc: "yes" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: "gpc" }));
    });

    it("errors when tcf is not a boolean", () => {
      const result = validate({ ...MINIMAL_VALID, tcf: 1 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: "tcf" }));
    });
  });

  describe("contact field (email format)", () => {
    it("passes with a valid email", () => {
      const result = validate({ ...MINIMAL_VALID, contact: "a@b.com" });
      expect(result.valid).toBe(true);
    });

    it("errors when contact is not a string", () => {
      const result = validate({ ...MINIMAL_VALID, contact: 42 });
      expect(result.valid).toBe(false);
    });

    it("errors with invalid email format", () => {
      const result = validate({ ...MINIMAL_VALID, contact: "not-an-email" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: "contact",
          message: expect.stringContaining("email"),
        }),
      );
    });
  });

  describe("policyUrl field (URI format)", () => {
    it("passes with a valid https URL", () => {
      const result = validate({
        ...MINIMAL_VALID,
        policyUrl: "https://example.com/privacy",
      });
      expect(result.valid).toBe(true);
    });

    it("passes with a valid http URL", () => {
      const result = validate({
        ...MINIMAL_VALID,
        policyUrl: "http://example.com/privacy",
      });
      expect(result.valid).toBe(true);
    });

    it("errors with invalid URI", () => {
      const result = validate({
        ...MINIMAL_VALID,
        policyUrl: "/privacy",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: "policyUrl" }));
    });
  });

  describe("forward compatibility", () => {
    it("does not error on unknown top-level fields", () => {
      const result = validate({
        ...MINIMAL_VALID,
        futureField: "hello",
        anotherOne: { nested: true },
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("warnings", () => {
    it("warns when recommended field selectors is missing", () => {
      const result = validate(MINIMAL_VALID);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          path: "selectors",
          message: expect.stringContaining("Recommended"),
        }),
      );
    });

    it("warns when recommended field cmp is missing", () => {
      const result = validate(MINIMAL_VALID);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          path: "cmp",
          message: expect.stringContaining("Recommended"),
        }),
      );
    });

    it("does not warn when recommended fields are present", () => {
      const result = validate(FULL_VALID);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("multiple errors", () => {
    it("returns all errors when both required fields are missing", () => {
      const result = validate({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      const paths = result.errors.map((e) => e.path);
      expect(paths).toContain("version");
      expect(paths).toContain("categories");
    });
  });

  describe("data field", () => {
    it("includes data when valid", () => {
      const result = validate(MINIMAL_VALID);
      expect(result.data).toBeDefined();
      expect(result.data?.version).toBe("1.0");
    });

    it("does not include data when invalid", () => {
      const result = validate({});
      expect(result.data).toBeUndefined();
    });
  });
});

describe("validateString", () => {
  it("validates a valid JSON string", () => {
    const result = validateString(JSON.stringify(MINIMAL_VALID));
    expect(result.valid).toBe(true);
    expect(result.data).toEqual(MINIMAL_VALID);
  });

  it("returns parse error for invalid JSON", () => {
    const result = validateString("{bad json");
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("Invalid JSON") }),
    );
  });

  it("validates content after parsing", () => {
    const result = validateString(JSON.stringify({ version: "bad" }));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns errors for empty string", () => {
    const result = validateString("");
    expect(result.valid).toBe(false);
  });
});
