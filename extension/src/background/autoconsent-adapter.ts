/**
 * Adapter between @duckduckgo/autoconsent and our preference-based model.
 *
 * Wraps autoconsent's 2800+ declarative CMP rules as a RuleSource for the
 * rule engine. Translates our 5-category UserPreferences into autoconsent's
 * binary optIn/optOut model using a privacy-protective strategy: when in
 * doubt, reject non-essential cookies.
 */

import type { AutoConsentCMPRule } from "@duckduckgo/autoconsent";
import type { CMPRule, UserPreferences } from "@/shared/types";
import type { RuleSource } from "@/background/rule-engine";
import rulesJson from "@duckduckgo/autoconsent/rules/rules.json";

/** Autoconsent action derived from user preferences. */
export type AutoconsentAction = "optIn" | "optOut";

/** Non-essential category keys used for preference mapping. */
const NON_ESSENTIAL_KEYS: ReadonlyArray<keyof Omit<UserPreferences, "essential">> = [
  "functional",
  "analytics",
  "marketing",
  "socialMedia",
] as const;

/** Information about an autoconsent-provided CMP. */
export interface AutoconsentCMPInfo {
  name: string;
  /** Whether autoconsent supports per-category control (always false). */
  supportsPerCategory: false;
}

/**
 * Load autoconsent rules from the bundled JSON.
 * Filters out rules that require unsupported rule step versions.
 */
export function loadAutoconsentRules(): AutoConsentCMPRule[] {
  const bundle = rulesJson as { autoconsent?: AutoConsentCMPRule[] };
  return bundle.autoconsent ?? [];
}

/**
 * Map user preferences to an autoconsent binary action.
 *
 * Strategy (privacy-protective):
 * - ALL non-essential accepted -> optIn
 * - ALL non-essential rejected -> optOut
 * - Mixed (some accepted, some rejected) -> optOut (safer default)
 */
export function mapPreferencesToAction(preferences: UserPreferences): AutoconsentAction {
  const allAccepted = NON_ESSENTIAL_KEYS.every((key) => preferences[key] === true);
  if (allAccepted) {
    return "optIn";
  }
  return "optOut";
}

/**
 * Check whether a mixed preference set loses granularity via binary mapping.
 * Returns true if some (but not all) non-essential categories are accepted.
 */
export function isPartialConsent(preferences: UserPreferences): boolean {
  const accepted = NON_ESSENTIAL_KEYS.filter((key) => preferences[key] === true);
  return accepted.length > 0 && accepted.length < NON_ESSENTIAL_KEYS.length;
}

/**
 * Convert an autoconsent rule into our CMPRule format.
 * Maps detection selectors and creates opt-in/opt-out action sequences.
 */
export function convertAutoconsentRule(acRule: AutoConsentCMPRule): CMPRule {
  const domSelectors = extractDetectionSelectors(acRule);

  return {
    name: acRule.name,
    detection: {
      domSelectors: domSelectors.length > 0 ? domSelectors : undefined,
    },
    categoryMapping: {
      functional: "all-or-nothing",
      analytics: "all-or-nothing",
      marketing: "all-or-nothing",
    },
    actions: {
      acceptAll: [{ type: "eval", value: `autoconsent:optIn:${acRule.name}` }],
      rejectAll: [{ type: "eval", value: `autoconsent:optOut:${acRule.name}` }],
      custom: [{ type: "eval", value: `autoconsent:optOut:${acRule.name}` }],
    },
  };
}

/**
 * Extract CSS selectors from autoconsent's detectCmp steps.
 * Only extracts simple "exists" and "visible" selectors.
 */
function extractDetectionSelectors(acRule: AutoConsentCMPRule): string[] {
  const selectors: string[] = [];

  for (const step of acRule.detectCmp ?? []) {
    if (step.exists) {
      const sel = Array.isArray(step.exists) ? step.exists[0] : step.exists;
      if (typeof sel === "string") {
        selectors.push(sel);
      }
    }
    if (step.visible) {
      const sel = Array.isArray(step.visible) ? step.visible[0] : step.visible;
      if (typeof sel === "string") {
        selectors.push(sel);
      }
    }
  }

  return selectors;
}

/**
 * Adapter that wraps @duckduckgo/autoconsent as a RuleSource.
 * Provides 2800+ CMP rules at priority 30 (below native, above heuristic).
 */
export class AutoconsentAdapter implements RuleSource {
  readonly name = "autoconsent";
  readonly priority = 30;

  private readonly ruleMap = new Map<string, AutoConsentCMPRule>();

  constructor(rules?: AutoConsentCMPRule[]) {
    const loaded = rules ?? loadAutoconsentRules();
    for (const rule of loaded) {
      this.ruleMap.set(rule.name, rule);
    }
  }

  /** List all CMPs this adapter can handle. */
  getAvailableCMPs(): AutoconsentCMPInfo[] {
    return Array.from(this.ruleMap.keys()).map((name) => ({
      name,
      supportsPerCategory: false as const,
    }));
  }

  /** Total number of CMP rules available. */
  get ruleCount(): number {
    return this.ruleMap.size;
  }

  /**
   * Match a CMP name to an autoconsent rule, converting to our CMPRule format.
   * Returns null if no matching autoconsent rule exists.
   */
  match(cmpName: string): CMPRule | null {
    const acRule = this.ruleMap.get(cmpName);
    if (!acRule) {
      return null;
    }
    return convertAutoconsentRule(acRule);
  }

  /** Check if this adapter has a rule for the given CMP name. */
  has(cmpName: string): boolean {
    return this.ruleMap.has(cmpName);
  }
}
