/**
 * CMP rule engine.
 *
 * Matches detection signals to CMP rules and selects the
 * appropriate execution strategy. Loads builtin rules from
 * JSON and supports external rule sources (e.g., autoconsent).
 *
 * Rule source priority (lower number = higher priority):
 * 1. Well-known file (from site itself)
 * 2. Native builtin rules (JSON in src/rules/builtin/)
 * 3. Autoconsent adapter (future, 100+ CMPs)
 * 4. Heuristic fallback (lowest)
 */

import type { CMPRule, ConfidenceLevel } from "@/shared/types";
import { validateRule } from "@/rules/schema";

import onetrustData from "@/rules/builtin/onetrust.json";
import cookiebotData from "@/rules/builtin/cookiebot.json";
import didomiData from "@/rules/builtin/didomi.json";
import quantcastData from "@/rules/builtin/quantcast.json";
import trustarcData from "@/rules/builtin/trustarc.json";
import cookieyesData from "@/rules/builtin/cookieyes.json";
import complianzData from "@/rules/builtin/complianz.json";
import osanoData from "@/rules/builtin/osano.json";
import consentmanagerData from "@/rules/builtin/consentmanager.json";

/** Result of matching detection signals to a rule. */
export interface RuleMatch {
  rule: CMPRule;
  source: "well-known" | "native" | "autoconsent" | "heuristic";
  confidence: ConfidenceLevel;
}

/** External rule source that can provide rules for CMP names. */
export interface RuleSource {
  name: string;
  /** Lower number = higher priority. Native builtin = 20. */
  priority: number;
  match(cmpName: string): CMPRule | null;
}

/** Confidence mapping per source type. */
const SOURCE_CONFIDENCE: Record<RuleMatch["source"], ConfidenceLevel> = {
  "well-known": "high",
  native: "high",
  autoconsent: "medium",
  heuristic: "low",
};

/** Loaded builtin rules indexed by name. */
const builtinRules = new Map<string, CMPRule>();

/** Registered external rule sources, sorted by priority. */
const externalSources: RuleSource[] = [];

/**
 * Load all builtin rule JSON files, validate, and index them.
 * Called once at module init. Invalid rules are logged and skipped.
 */
export function loadBuiltinRules(): CMPRule[] {
  builtinRules.clear();

  const rawRules: unknown[] = [
    onetrustData,
    cookiebotData,
    didomiData,
    quantcastData,
    trustarcData,
    cookieyesData,
    complianzData,
    osanoData,
    consentmanagerData,
  ];
  const loaded: CMPRule[] = [];

  for (const raw of rawRules) {
    try {
      const rule = validateRule(raw);
      builtinRules.set(rule.name, rule);
      loaded.push(rule);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[NoCookie] Skipping invalid builtin rule:", err);
    }
  }

  return loaded;
}

/**
 * Match a detected CMP name against all rule sources.
 * Checks sources in priority order: native builtins first,
 * then external sources sorted by priority.
 *
 * @param cmpName - CMP identifier from detection (e.g., "onetrust")
 * @returns Matched rule with source and confidence, or null
 */
export function matchRule(cmpName: string): RuleMatch | null {
  // 1. Native builtin rules (priority 20)
  const builtin = builtinRules.get(cmpName);
  if (builtin) {
    return {
      rule: builtin,
      source: "native",
      confidence: SOURCE_CONFIDENCE.native,
    };
  }

  // 2. External sources in priority order
  for (const source of externalSources) {
    const rule = source.match(cmpName);
    if (rule) {
      const sourceType = inferSourceType(source.name);
      return {
        rule,
        source: sourceType,
        confidence: SOURCE_CONFIDENCE[sourceType],
      };
    }
  }

  return null;
}

/**
 * Get names of all loaded builtin rules.
 */
export function getLoadedRuleNames(): string[] {
  return Array.from(builtinRules.keys());
}

/**
 * Register an external rule source (e.g., autoconsent adapter).
 * Sources are kept sorted by priority (lower = checked first).
 */
export function registerRuleSource(source: RuleSource): void {
  externalSources.push(source);
  externalSources.sort((a, b) => a.priority - b.priority);
}

/**
 * Remove a registered external rule source by name.
 */
export function unregisterRuleSource(name: string): void {
  const idx = externalSources.findIndex((s) => s.name === name);
  if (idx !== -1) {
    externalSources.splice(idx, 1);
  }
}

/**
 * Get all registered external rule source names.
 */
export function getRegisteredSources(): string[] {
  return externalSources.map((s) => s.name);
}

/**
 * Infer the RuleMatch source type from the rule source name.
 */
function inferSourceType(sourceName: string): RuleMatch["source"] {
  if (sourceName === "well-known") return "well-known";
  if (sourceName === "autoconsent") return "autoconsent";
  if (sourceName === "heuristic") return "heuristic";
  return "autoconsent";
}

/**
 * Reset all state (for testing).
 */
export function resetRuleEngine(): void {
  builtinRules.clear();
  externalSources.length = 0;
}

// Auto-load builtin rules on module import
loadBuiltinRules();
