/**
 * Per-category consent builders for additional CMPs.
 *
 * Builds CMP-specific API calls for Quantcast, TrustArc, CookieYes,
 * Complianz, Osano, and consentmanager. Each builder translates
 * UserPreferences into the CMP's native consent format.
 */

import type { ActionSequence, UserPreferences } from "@/shared/types";

/**
 * Build Quantcast TCF consent call with per-purpose flags.
 * Uses __tcfapi with TCF v2 purpose consent bitmap.
 */
export function buildQuantcastConsent(preferences: UserPreferences): ActionSequence {
  const purposes: Record<number, boolean> = {
    1: preferences.marketing,
    3: preferences.functional,
    5: preferences.analytics,
  };
  const purposeStr = JSON.stringify(purposes);

  return [
    {
      type: "eval",
      target: `__tcfapi('setConsent', 2, function(){}, {purposeConsents:${purposeStr}})`,
    },
  ];
}

/**
 * Build TrustArc consent via preference panel toggle clicks.
 * TrustArc uses an iframe-based preference panel with checkbox toggles.
 */
export function buildTrustArcConsent(preferences: UserPreferences): ActionSequence {
  const actions: ActionSequence = [
    { type: "click", target: "#truste-show-consent" },
    { type: "waitFor", target: ".prefPanel", timeout: 2000 },
  ];

  const toggleMap: Array<[boolean, string]> = [
    [preferences.functional, ".prefPanel input[data-category='functional']"],
    [preferences.analytics, ".prefPanel input[data-category='analytics']"],
    [preferences.marketing, ".prefPanel input[data-category='advertising']"],
  ];

  for (const [enabled, selector] of toggleMap) {
    actions.push({
      type: "toggle",
      target: selector,
      value: enabled ? "on" : "off",
    });
  }

  actions.push({ type: "click", target: ".prefPanel .submit" });
  return actions;
}

/**
 * Build CookieYes consent via its banner API.
 * Uses cookieyes.performBannerAction() with category-specific consent.
 */
export function buildCookieYesConsent(preferences: UserPreferences): ActionSequence {
  const categories: Record<string, boolean> = {
    functional: preferences.functional,
    analytics: preferences.analytics,
    advertisement: preferences.marketing,
  };
  const catStr = JSON.stringify(categories);

  return [
    {
      type: "eval",
      target: `cookieyes.performBannerAction('custom', ${catStr})`,
    },
  ];
}

/**
 * Build Complianz consent via WordPress custom event dispatch.
 * Fires cmplz_fire_categories with the accepted category list.
 */
export function buildComplianzConsent(preferences: UserPreferences): ActionSequence {
  const categories: string[] = ["functional"];
  if (preferences.functional) categories.push("preferences");
  if (preferences.analytics) categories.push("statistics");
  if (preferences.marketing) categories.push("marketing");

  const catArray = JSON.stringify(categories);

  return [
    {
      type: "eval",
      target: `document.dispatchEvent(new CustomEvent('cmplz_fire_categories',{detail:{categories:${catArray}}}))`,
    },
  ];
}

/**
 * Build Osano consent via its consent manager API.
 * Uses Osano.cm with per-category consent state updates.
 */
export function buildOsanoConsent(preferences: UserPreferences): ActionSequence {
  const state: Record<string, string> = {
    ESSENTIAL: "ACCEPT",
    PERSONALIZATION: preferences.functional ? "ACCEPT" : "DENY",
    ANALYTICS: preferences.analytics ? "ACCEPT" : "DENY",
    MARKETING: preferences.marketing ? "ACCEPT" : "DENY",
  };
  const stateStr = JSON.stringify(state);

  return [
    {
      type: "eval",
      target: `Osano.cm.consentManager.updateConsentState(${stateStr})`,
    },
  ];
}

/**
 * Build consentmanager consent via __cmp TCF API.
 * Uses __cmp('setConsent') with per-purpose consent flags.
 */
export function buildConsentmanagerConsent(preferences: UserPreferences): ActionSequence {
  const purposes: Record<number, boolean> = {
    2: preferences.analytics,
    3: preferences.functional,
    4: preferences.marketing,
  };
  const purposeStr = JSON.stringify(purposes);

  return [
    {
      type: "eval",
      target: `__cmp('setConsent', {purposeConsents:${purposeStr}})`,
    },
  ];
}
