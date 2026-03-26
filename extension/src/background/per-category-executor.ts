/**
 * Per-category consent executor for CMPs that support granular control.
 *
 * Builds CMP-specific API calls based on user preferences, enabling
 * per-category consent beyond autoconsent's binary opt-in/opt-out.
 * Falls back to null when a CMP is not recognized, signaling the
 * caller to use binary autoconsent instead.
 */

import type { ActionSequence, UserPreferences } from "@/shared/types";
import { getMappingForCmp } from "@/rules/category-mappings";

/**
 * Check whether a CMP supports per-category consent via our mappings.
 *
 * @param cmpName - CMP identifier (e.g., "onetrust")
 * @returns true if we have a per-category mapping for this CMP
 */
export function supportsPerCategory(cmpName: string): boolean {
  return getMappingForCmp(cmpName) !== undefined;
}

/**
 * Build a custom consent action sequence for a CMP with specific preferences.
 * Returns null if the CMP is not supported for per-category consent.
 *
 * @param cmpName - CMP identifier
 * @param preferences - User's per-category preferences
 * @returns Action sequence to execute, or null if unsupported
 */
export function buildCustomConsentAction(
  cmpName: string,
  preferences: UserPreferences,
): ActionSequence | null {
  switch (cmpName) {
    case "onetrust":
      return buildOneTrustConsent(preferences);
    case "cookiebot":
      return buildCookiebotConsent(preferences);
    case "didomi":
      return buildDidomiConsent(preferences);
    default:
      return null;
  }
}

/**
 * Build OneTrust API call with per-category group consent.
 * Uses OneTrust.UpdateConsent() with category groups C0001-C0005.
 */
export function buildOneTrustConsent(preferences: UserPreferences): ActionSequence {
  const groups = [
    "C0001:1", // Strictly Necessary — always enabled
    `C0002:${preferences.analytics ? "1" : "0"}`,
    `C0003:${preferences.functional ? "1" : "0"}`,
    `C0004:${preferences.marketing ? "1" : "0"}`,
    `C0005:${preferences.socialMedia ? "1" : "0"}`,
  ];
  const groupsParam = groups.join(",");

  return [
    {
      type: "eval",
      target: `OneTrust.UpdateConsent("${groupsParam}")`,
    },
    {
      type: "waitFor",
      target: "#onetrust-consent-sdk",
      timeout: 1000,
    },
    {
      type: "eval",
      target: "OneTrust.Close()",
    },
  ];
}

/**
 * Build Cookiebot submitCustomConsent call with per-category booleans.
 * Signature: Cookiebot.submitCustomConsent(preferences, statistics, marketing).
 */
export function buildCookiebotConsent(preferences: UserPreferences): ActionSequence {
  const funcArg = preferences.functional ? "true" : "false";
  const statArg = preferences.analytics ? "true" : "false";
  const mktArg = preferences.marketing ? "true" : "false";

  return [
    {
      type: "eval",
      target: `Cookiebot.submitCustomConsent(${funcArg}, ${statArg}, ${mktArg})`,
    },
  ];
}

/**
 * Build Didomi setUserStatus call with per-purpose consent.
 * Uses the Didomi SDK's setUserStatus method with purpose consent arrays.
 */
export function buildDidomiConsent(preferences: UserPreferences): ActionSequence {
  const enabled: string[] = [];
  const disabled: string[] = [];

  const purposeMap: Array<[boolean, string]> = [
    [preferences.functional, "preferences"],
    [preferences.analytics, "analytics"],
    [preferences.marketing, "advertising"],
    [preferences.socialMedia, "social_media"],
  ];

  for (const [accepted, purposeId] of purposeMap) {
    if (accepted) {
      enabled.push(`"${purposeId}"`);
    } else {
      disabled.push(`"${purposeId}"`);
    }
  }

  const statusObj = [
    "Didomi.setUserStatus({",
    `purposes:{consent:{enabled:[${enabled.join(",")}],disabled:[${disabled.join(",")}]}},`,
    `vendors:{consent:{enabled:[],disabled:[]}}`,
    "})",
  ].join("");

  return [{ type: "eval", target: statusObj }];
}
