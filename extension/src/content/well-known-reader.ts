/**
 * Well-known cookie consent file reader.
 *
 * Fetches and validates `/.well-known/cookie-consent.json` for the current domain.
 * Highest priority detection layer — when present, provides perfect CMP information
 * declared by the site itself. Results are cached in chrome.storage.local with TTL.
 */

import type { CMPRule, WellKnownCookieConsent } from "@/shared/types";
import type { RuleSource } from "@/background/rule-engine";
import { getWellKnownCache, setWellKnownCache } from "@/shared/storage-api";

const WELL_KNOWN_PATH = "/.well-known/cookie-consent.json";

/** Cache TTL for successful fetches (24 hours). */
const CACHE_TTL_SUCCESS = 24 * 60 * 60 * 1000;

/** Cache TTL for failed fetches (1 hour) to avoid repeated requests. */
const CACHE_TTL_FAILURE = 60 * 60 * 1000;

/** Fetch timeout in milliseconds. */
const FETCH_TIMEOUT_MS = 3000;

/** Regex for validating the version field (e.g., "1.0"). */
const VERSION_REGEX = /^\d+\.\d+$/;

/**
 * Validate that unknown data conforms to the WellKnownCookieConsent schema.
 * Required: `version` (semver-like string) and `categories` (array containing "essential").
 * Unknown fields are silently ignored for forward compatibility.
 */
export function validateWellKnown(data: unknown): data is WellKnownCookieConsent {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== "string" || !VERSION_REGEX.test(obj.version)) {
    return false;
  }

  if (!Array.isArray(obj.categories)) {
    return false;
  }

  const hasEssential = obj.categories.some((c: unknown) => c === "essential");
  return hasEssential;
}

/**
 * Fetch the well-known cookie consent file for a domain.
 * Returns null on 404, network error, timeout, CORS error, or invalid JSON.
 * Logs at debug level since most sites will not have this file.
 */
export async function fetchWellKnown(domain: string): Promise<WellKnownCookieConsent | null> {
  const url = `https://${domain}${WELL_KNOWN_PATH}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      cache: "default",
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.debug(`[NoCookie] Well-known fetch ${response.status} for ${domain}`);
      return null;
    }

    const json: unknown = await response.json();

    if (!validateWellKnown(json)) {
      console.debug(`[NoCookie] Well-known validation failed for ${domain}`);
      return null;
    }

    return json;
  } catch (err) {
    console.debug(`[NoCookie] Well-known fetch error for ${domain}:`, err);
    return null;
  }
}

/**
 * Get the well-known cookie consent data for a domain.
 * Checks cache first; fetches and caches on miss or expiry.
 */
export async function getWellKnown(domain: string): Promise<WellKnownCookieConsent | null> {
  const cached = await getWellKnownCache(domain);

  if (cached) {
    const age = Date.now() - cached.fetchedAt;
    if (age < cached.ttl) {
      return cached.data;
    }
  }

  const data = await fetchWellKnown(domain);

  const ttl = data ? CACHE_TTL_SUCCESS : CACHE_TTL_FAILURE;
  await setWellKnownCache(domain, {
    data,
    fetchedAt: Date.now(),
    ttl,
  });

  return data;
}

/**
 * Convert well-known cookie consent data into a CMPRule
 * that the executor can use directly.
 */
export function wellKnownToRule(data: WellKnownCookieConsent): CMPRule {
  const cmpName = data.cmp?.name ?? "well-known";

  const acceptSelector = data.selectors?.acceptAll ?? "";
  const rejectSelector = data.selectors?.rejectAll ?? "";
  const saveSelector = data.selectors?.save ?? "";
  const bannerSelector = data.selectors?.banner ?? "";

  return {
    name: cmpName,
    detection: {
      domSelectors: bannerSelector ? [bannerSelector] : undefined,
    },
    categoryMapping: buildCategoryMapping(data),
    actions: {
      acceptAll: buildAcceptActions(data, acceptSelector),
      rejectAll: buildRejectActions(data, rejectSelector),
      custom: buildCustomActions(data, saveSelector),
    },
  };
}

/** Build accept-all action sequence from well-known data. */
function buildAcceptActions(
  data: WellKnownCookieConsent,
  acceptSelector: string,
): CMPRule["actions"]["acceptAll"] {
  if (data.api?.acceptAll) {
    return [{ type: "eval", value: data.api.acceptAll }];
  }
  if (acceptSelector) {
    return [{ type: "click", target: acceptSelector }];
  }
  return [];
}

/** Build reject-all action sequence from well-known data. */
function buildRejectActions(
  data: WellKnownCookieConsent,
  rejectSelector: string,
): CMPRule["actions"]["rejectAll"] {
  if (data.api?.rejectAll) {
    return [{ type: "eval", value: data.api.rejectAll }];
  }
  if (rejectSelector) {
    return [{ type: "click", target: rejectSelector }];
  }
  return [];
}

/** Build custom action sequence from well-known data. */
function buildCustomActions(
  data: WellKnownCookieConsent,
  saveSelector: string,
): CMPRule["actions"]["custom"] {
  const steps: CMPRule["actions"]["custom"] = [];

  if (data.categorySelectors) {
    for (const [, sel] of Object.entries(data.categorySelectors)) {
      if (sel.toggle) {
        steps.push({ type: "toggle", target: sel.toggle });
      }
    }
  }

  if (data.api?.setCategory) {
    steps.push({ type: "eval", value: data.api.setCategory });
  }

  if (saveSelector) {
    steps.push({ type: "click", target: saveSelector });
  }

  return steps;
}

/** Build category mapping from well-known data. */
function buildCategoryMapping(data: WellKnownCookieConsent): CMPRule["categoryMapping"] {
  const selectors = data.categorySelectors ?? {};
  return {
    functional: selectors.functional?.cmpId ?? "functional",
    analytics: selectors.analytics?.cmpId ?? "analytics",
    marketing: selectors.marketing?.cmpId ?? "marketing",
    socialMedia: selectors.socialMedia?.cmpId ?? "socialMedia",
  };
}

/**
 * Well-known rule source for the rule engine.
 * Priority 1 (highest) — site-declared consent info is most trustworthy.
 *
 * Note: This source works synchronously via `match()`, but the well-known
 * data must be pre-fetched and cached. The detector calls `getWellKnown()`
 * asynchronously before rule matching occurs.
 */
let cachedRule: CMPRule | null = null;

/** Store a pre-fetched well-known rule for synchronous access by the rule engine. */
export function setWellKnownRule(rule: CMPRule | null): void {
  cachedRule = rule;
}

/** Clear the cached well-known rule (for testing). */
export function clearWellKnownRule(): void {
  cachedRule = null;
}

/** Well-known rule source implementing the RuleSource interface. */
export const wellKnownRuleSource: RuleSource = {
  name: "well-known",
  priority: 1,
  match(cmpName: string): CMPRule | null {
    if (cmpName === "well-known" && cachedRule) {
      return cachedRule;
    }
    return null;
  },
};
