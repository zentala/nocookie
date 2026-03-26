import { describe, expect, it, beforeEach } from "vitest";
import type { AutoConsentCMPRule } from "@duckduckgo/autoconsent";
import type { UserPreferences } from "@/shared/types";
import {
  AutoconsentAdapter,
  convertAutoconsentRule,
  isPartialConsent,
  loadAutoconsentRules,
  mapPreferencesToAction,
} from "@/background/autoconsent-adapter";
import {
  matchRule,
  registerRuleSource,
  resetRuleEngine,
  loadBuiltinRules,
  getRegisteredSources,
} from "@/background/rule-engine";

/** Minimal autoconsent rule fixture for testing. */
function makeAcRule(name: string): AutoConsentCMPRule {
  return {
    name,
    detectCmp: [{ exists: `.${name}-banner` }],
    detectPopup: [{ visible: `.${name}-popup` }],
    optIn: [{ waitForThenClick: `.${name}-accept` }],
    optOut: [{ waitForThenClick: `.${name}-reject` }],
  };
}

describe("AutoconsentAdapter", () => {
  const testRules = [makeAcRule("test-cmp-a"), makeAcRule("test-cmp-b")];

  describe("constructor and getAvailableCMPs", () => {
    it("loads provided rules", () => {
      const adapter = new AutoconsentAdapter(testRules);
      const cmps = adapter.getAvailableCMPs();
      expect(cmps).toHaveLength(2);
      expect(cmps.map((c) => c.name)).toEqual(["test-cmp-a", "test-cmp-b"]);
    });

    it("marks all CMPs as not supporting per-category", () => {
      const adapter = new AutoconsentAdapter(testRules);
      for (const cmp of adapter.getAvailableCMPs()) {
        expect(cmp.supportsPerCategory).toBe(false);
      }
    });

    it("reports correct rule count", () => {
      const adapter = new AutoconsentAdapter(testRules);
      expect(adapter.ruleCount).toBe(2);
    });
  });

  describe("match", () => {
    it("returns CMPRule for known CMP name", () => {
      const adapter = new AutoconsentAdapter(testRules);
      const rule = adapter.match("test-cmp-a");
      expect(rule).not.toBeNull();
      expect(rule!.name).toBe("test-cmp-a");
    });

    it("returns null for unknown CMP name", () => {
      const adapter = new AutoconsentAdapter(testRules);
      expect(adapter.match("nonexistent")).toBeNull();
    });

    it("returns null for empty string", () => {
      const adapter = new AutoconsentAdapter(testRules);
      expect(adapter.match("")).toBeNull();
    });

    it("returned CMPRule has correct structure", () => {
      const adapter = new AutoconsentAdapter(testRules);
      const rule = adapter.match("test-cmp-a")!;

      expect(rule.detection).toBeDefined();
      expect(rule.detection.domSelectors).toContain(".test-cmp-a-banner");
      expect(rule.categoryMapping).toBeDefined();
      expect(rule.categoryMapping.functional).toBe("all-or-nothing");
      expect(rule.categoryMapping.analytics).toBe("all-or-nothing");
      expect(rule.categoryMapping.marketing).toBe("all-or-nothing");
      expect(rule.actions.acceptAll).toBeInstanceOf(Array);
      expect(rule.actions.rejectAll).toBeInstanceOf(Array);
      expect(rule.actions.custom).toBeInstanceOf(Array);
    });
  });

  describe("has", () => {
    it("returns true for known CMP", () => {
      const adapter = new AutoconsentAdapter(testRules);
      expect(adapter.has("test-cmp-a")).toBe(true);
    });

    it("returns false for unknown CMP", () => {
      const adapter = new AutoconsentAdapter(testRules);
      expect(adapter.has("unknown")).toBe(false);
    });
  });

  describe("RuleSource properties", () => {
    it("has name 'autoconsent'", () => {
      const adapter = new AutoconsentAdapter([]);
      expect(adapter.name).toBe("autoconsent");
    });

    it("has priority 30", () => {
      const adapter = new AutoconsentAdapter([]);
      expect(adapter.priority).toBe(30);
    });
  });
});

describe("mapPreferencesToAction", () => {
  it("returns optOut when all non-essential are rejected", () => {
    const prefs: UserPreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      socialMedia: false,
    };
    expect(mapPreferencesToAction(prefs)).toBe("optOut");
  });

  it("returns optIn when all non-essential are accepted", () => {
    const prefs: UserPreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      socialMedia: true,
    };
    expect(mapPreferencesToAction(prefs)).toBe("optIn");
  });

  it("returns optOut for mixed preferences (privacy-protective)", () => {
    const prefs: UserPreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: false,
      socialMedia: false,
    };
    expect(mapPreferencesToAction(prefs)).toBe("optOut");
  });

  it("returns optOut when only functional is accepted", () => {
    const prefs: UserPreferences = {
      essential: true,
      functional: true,
      analytics: false,
      marketing: false,
      socialMedia: false,
    };
    expect(mapPreferencesToAction(prefs)).toBe("optOut");
  });
});

describe("isPartialConsent", () => {
  it("returns false when all non-essential rejected", () => {
    const prefs: UserPreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      socialMedia: false,
    };
    expect(isPartialConsent(prefs)).toBe(false);
  });

  it("returns false when all non-essential accepted", () => {
    const prefs: UserPreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      socialMedia: true,
    };
    expect(isPartialConsent(prefs)).toBe(false);
  });

  it("returns true for mixed preferences", () => {
    const prefs: UserPreferences = {
      essential: true,
      functional: true,
      analytics: false,
      marketing: false,
      socialMedia: false,
    };
    expect(isPartialConsent(prefs)).toBe(true);
  });
});

describe("convertAutoconsentRule", () => {
  it("converts detection selectors from exists steps", () => {
    const acRule = makeAcRule("test-convert");
    const rule = convertAutoconsentRule(acRule);
    expect(rule.detection.domSelectors).toContain(".test-convert-banner");
  });

  it("maps category mappings to all-or-nothing", () => {
    const acRule = makeAcRule("binary-cmp");
    const rule = convertAutoconsentRule(acRule);
    expect(rule.categoryMapping.functional).toBe("all-or-nothing");
    expect(rule.categoryMapping.analytics).toBe("all-or-nothing");
    expect(rule.categoryMapping.marketing).toBe("all-or-nothing");
  });

  it("creates eval-based action sequences referencing the CMP name", () => {
    const acRule = makeAcRule("eval-cmp");
    const rule = convertAutoconsentRule(acRule);
    expect(rule.actions.acceptAll[0]).toEqual({
      type: "eval",
      value: "autoconsent:optIn:eval-cmp",
    });
    expect(rule.actions.rejectAll[0]).toEqual({
      type: "eval",
      value: "autoconsent:optOut:eval-cmp",
    });
  });

  it("handles rule with array-style selectors", () => {
    const acRule: AutoConsentCMPRule = {
      name: "array-sel",
      detectCmp: [{ exists: [".parent", ".child"] }],
      detectPopup: [],
      optIn: [],
      optOut: [],
    };
    const rule = convertAutoconsentRule(acRule);
    expect(rule.detection.domSelectors).toContain(".parent");
  });

  it("handles rule with no detection steps gracefully", () => {
    const acRule: AutoConsentCMPRule = {
      name: "no-detect",
      detectCmp: [],
      detectPopup: [],
      optIn: [],
      optOut: [],
    };
    const rule = convertAutoconsentRule(acRule);
    expect(rule.detection.domSelectors).toBeUndefined();
  });
});

describe("loadAutoconsentRules", () => {
  it("loads rules from the bundled JSON", () => {
    const rules = loadAutoconsentRules();
    expect(rules.length).toBeGreaterThan(100);
  });

  it("each rule has a name", () => {
    const rules = loadAutoconsentRules();
    for (const rule of rules.slice(0, 10)) {
      expect(typeof rule.name).toBe("string");
      expect(rule.name.length).toBeGreaterThan(0);
    }
  });
});

describe("Rule engine integration", () => {
  beforeEach(() => {
    resetRuleEngine();
    loadBuiltinRules();
  });

  it("registers adapter as a rule source", () => {
    const adapter = new AutoconsentAdapter([makeAcRule("ext-cmp")]);
    registerRuleSource(adapter);
    expect(getRegisteredSources()).toContain("autoconsent");
  });

  it("matches autoconsent CMP through rule engine", () => {
    const adapter = new AutoconsentAdapter([makeAcRule("ext-only-cmp")]);
    registerRuleSource(adapter);

    const result = matchRule("ext-only-cmp");
    expect(result).not.toBeNull();
    expect(result!.source).toBe("autoconsent");
    expect(result!.confidence).toBe("medium");
  });

  it("native rules take priority over autoconsent", () => {
    const adapter = new AutoconsentAdapter([makeAcRule("onetrust")]);
    registerRuleSource(adapter);

    const result = matchRule("onetrust");
    expect(result).not.toBeNull();
    expect(result!.source).toBe("native");
    expect(result!.confidence).toBe("high");
  });

  it("returns null when no source has the CMP", () => {
    const adapter = new AutoconsentAdapter([makeAcRule("known-cmp")]);
    registerRuleSource(adapter);

    expect(matchRule("totally-unknown")).toBeNull();
  });
});
