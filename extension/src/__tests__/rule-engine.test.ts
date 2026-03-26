import { describe, expect, it, beforeEach } from "vitest";
import {
  loadBuiltinRules,
  matchRule,
  getLoadedRuleNames,
  registerRuleSource,
  unregisterRuleSource,
  getRegisteredSources,
  resetRuleEngine,
} from "@/background/rule-engine";
import type { RuleSource } from "@/background/rule-engine";
import { validateRule, isValidRule } from "@/rules/schema";
import type { CMPRule } from "@/shared/types";

describe("Rule engine", () => {
  beforeEach(() => {
    resetRuleEngine();
    loadBuiltinRules();
  });

  describe("loadBuiltinRules", () => {
    it("loads all builtin rules successfully", () => {
      const rules = loadBuiltinRules();
      expect(rules.length).toBe(9);
      expect(rules.map((r) => r.name).sort()).toEqual([
        "complianz",
        "consentmanager",
        "cookiebot",
        "cookieyes",
        "didomi",
        "onetrust",
        "osano",
        "quantcast",
        "trustarc",
      ]);
    });

    it("returns valid CMPRule objects", () => {
      const rules = loadBuiltinRules();
      for (const rule of rules) {
        expect(rule.name).toBeTruthy();
        expect(rule.detection).toBeDefined();
        expect(rule.categoryMapping).toBeDefined();
        expect(rule.actions).toBeDefined();
        expect(rule.actions.acceptAll).toBeInstanceOf(Array);
        expect(rule.actions.rejectAll).toBeInstanceOf(Array);
        expect(rule.actions.custom).toBeInstanceOf(Array);
      }
    });
  });

  describe("getLoadedRuleNames", () => {
    it("returns names of all loaded rules", () => {
      const names = getLoadedRuleNames();
      expect(names).toContain("onetrust");
      expect(names).toContain("cookiebot");
      expect(names).toContain("didomi");
    });
  });

  describe("matchRule", () => {
    it("matches a known CMP by name", () => {
      const result = matchRule("onetrust");
      expect(result).not.toBeNull();
      expect(result!.rule.name).toBe("onetrust");
      expect(result!.source).toBe("native");
      expect(result!.confidence).toBe("high");
    });

    it("matches cookiebot", () => {
      const result = matchRule("cookiebot");
      expect(result).not.toBeNull();
      expect(result!.rule.name).toBe("cookiebot");
    });

    it("matches didomi", () => {
      const result = matchRule("didomi");
      expect(result).not.toBeNull();
      expect(result!.rule.name).toBe("didomi");
    });

    it("returns null for unknown CMP", () => {
      const result = matchRule("unknown-cmp");
      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      const result = matchRule("");
      expect(result).toBeNull();
    });
  });

  describe("external rule sources", () => {
    const mockRule: CMPRule = {
      name: "custom-cmp",
      detection: { domSelectors: [".custom"] },
      categoryMapping: {
        functional: "func",
        analytics: "analy",
        marketing: "mark",
      },
      actions: {
        acceptAll: [{ type: "click", target: ".accept" }],
        rejectAll: [{ type: "click", target: ".reject" }],
        custom: [{ type: "click", target: ".save" }],
      },
    };

    it("registers and matches from external source", () => {
      const source: RuleSource = {
        name: "autoconsent",
        priority: 30,
        match: (name) => (name === "custom-cmp" ? mockRule : null),
      };
      registerRuleSource(source);

      const result = matchRule("custom-cmp");
      expect(result).not.toBeNull();
      expect(result!.rule.name).toBe("custom-cmp");
      expect(result!.source).toBe("autoconsent");
      expect(result!.confidence).toBe("medium");
    });

    it("native rules take priority over external sources", () => {
      const overrideRule: CMPRule = { ...mockRule, name: "onetrust" };
      const source: RuleSource = {
        name: "autoconsent",
        priority: 30,
        match: (name) => (name === "onetrust" ? overrideRule : null),
      };
      registerRuleSource(source);

      const result = matchRule("onetrust");
      expect(result!.source).toBe("native");
    });

    it("respects priority ordering among external sources", () => {
      const lowPriorityRule: CMPRule = { ...mockRule, name: "ext-cmp" };
      const highPriorityRule: CMPRule = {
        ...mockRule,
        name: "ext-cmp",
        categoryMapping: { ...mockRule.categoryMapping, functional: "high-func" },
      };

      registerRuleSource({
        name: "heuristic",
        priority: 50,
        match: (name) => (name === "ext-cmp" ? lowPriorityRule : null),
      });
      registerRuleSource({
        name: "well-known",
        priority: 10,
        match: (name) => (name === "ext-cmp" ? highPriorityRule : null),
      });

      const result = matchRule("ext-cmp");
      expect(result!.source).toBe("well-known");
      expect(result!.confidence).toBe("high");
      expect(result!.rule.categoryMapping.functional).toBe("high-func");
    });

    it("unregisters a source by name", () => {
      registerRuleSource({
        name: "test-source",
        priority: 30,
        match: (name) => (name === "test-cmp" ? mockRule : null),
      });
      expect(getRegisteredSources()).toContain("test-source");

      unregisterRuleSource("test-source");
      expect(getRegisteredSources()).not.toContain("test-source");
      expect(matchRule("test-cmp")).toBeNull();
    });

    it("getRegisteredSources returns all registered names", () => {
      registerRuleSource({ name: "source-a", priority: 10, match: () => null });
      registerRuleSource({ name: "source-b", priority: 20, match: () => null });

      const sources = getRegisteredSources();
      expect(sources).toContain("source-a");
      expect(sources).toContain("source-b");
    });
  });
});

describe("Rule validation", () => {
  const validRule = {
    name: "test-cmp",
    detection: {
      domSelectors: [".test"],
      scriptUrls: ["test.com"],
    },
    categoryMapping: {
      functional: "func",
      analytics: "analy",
      marketing: "mark",
    },
    actions: {
      acceptAll: [{ type: "click", target: ".accept" }],
      rejectAll: [{ type: "click", target: ".reject" }],
      custom: [{ type: "click", target: ".save" }],
    },
  };

  describe("validateRule", () => {
    it("accepts a valid rule", () => {
      const result = validateRule(validRule);
      expect(result.name).toBe("test-cmp");
    });

    it("accepts rule with optional socialMedia", () => {
      const rule = {
        ...validRule,
        categoryMapping: { ...validRule.categoryMapping, socialMedia: "social" },
      };
      expect(() => validateRule(rule)).not.toThrow();
    });

    it("accepts rule with optional version field", () => {
      const rule = { ...validRule, version: "1.0.0" };
      expect(() => validateRule(rule)).not.toThrow();
    });

    it("rejects null", () => {
      expect(() => validateRule(null)).toThrow("non-null object");
    });

    it("rejects missing name", () => {
      const { name: _name, ...noName } = validRule;
      void _name;
      expect(() => validateRule(noName)).toThrow("name");
    });

    it("rejects missing detection", () => {
      const { detection: _det, ...noDetection } = validRule;
      void _det;
      expect(() => validateRule(noDetection)).toThrow("detection");
    });

    it("rejects missing categoryMapping", () => {
      const { categoryMapping: _cm, ...noCM } = validRule;
      void _cm;
      expect(() => validateRule(noCM)).toThrow("categoryMapping");
    });

    it("rejects missing actions", () => {
      const { actions: _acts, ...noActions } = validRule;
      void _acts;
      expect(() => validateRule(noActions)).toThrow("actions");
    });

    it("rejects invalid action step type", () => {
      const rule = {
        ...validRule,
        actions: {
          ...validRule.actions,
          acceptAll: [{ type: "invalid", target: ".x" }],
        },
      };
      expect(() => validateRule(rule)).toThrow("type");
    });

    it("rejects non-string target in action step", () => {
      const rule = {
        ...validRule,
        actions: {
          ...validRule.actions,
          acceptAll: [{ type: "click", target: 123 }],
        },
      };
      expect(() => validateRule(rule)).toThrow("target");
    });

    it("rejects non-array domSelectors", () => {
      const rule = {
        ...validRule,
        detection: { domSelectors: "not-array" },
      };
      expect(() => validateRule(rule)).toThrow("domSelectors");
    });

    it("rejects missing required categoryMapping fields", () => {
      const rule = {
        ...validRule,
        categoryMapping: { functional: "f" },
      };
      expect(() => validateRule(rule)).toThrow("analytics");
    });
  });

  describe("isValidRule", () => {
    it("returns true for valid rule", () => {
      expect(isValidRule(validRule)).toBe(true);
    });

    it("returns false for invalid rule", () => {
      expect(isValidRule(null)).toBe(false);
      expect(isValidRule({})).toBe(false);
      expect(isValidRule({ name: "x" })).toBe(false);
    });
  });
});
