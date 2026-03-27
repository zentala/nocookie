/**
 * CMP identifier constants and display name mapping.
 *
 * Central registry of known CMP identifiers, DOM selectors,
 * script URL patterns, and human-friendly display names.
 */

/** Known CMP script URL patterns mapped to CMP names. */
export const CMP_SCRIPT_URLS: Record<string, string> = {
  "cdn.cookielaw.org": "onetrust",
  "consent.cookiebot.com": "cookiebot",
  "sdk.privacy-center.org": "didomi",
  "quantcast.mgr.consensu.org": "quantcast",
  "consent.trustarc.com": "trustarc",
  "cdn-cookieyes.com": "cookieyes",
  "complianz.io": "complianz",
  "cdn.osano.com": "osano",
  "delivery.consentmanager.net": "consentmanager",
};

/** Map of DOM selectors to CMP names. */
export const SELECTOR_TO_CMP: Record<string, string> = {
  "#ca-cmp-root": "nocookie",
  "#onetrust-consent-sdk": "onetrust",
  "#CybotCookiebotDialog": "cookiebot",
  "#didomi-host": "didomi",
  ".qc-cmp2-ui": "quantcast",
  "#truste-consent-track": "trustarc",
  ".cky-consent-container": "cookieyes",
  ".cc-window": "osano",
  ".cmplz-cookiebanner": "complianz",
  "#cmpbox": "consentmanager",
};

/** Display names for known CMP identifiers. Unmapped names pass through as-is. */
const CMP_DISPLAY_NAMES: Record<string, string> = {
  nocookie: "NoCookie CMP",
  onetrust: "OneTrust",
  cookiebot: "Cookiebot",
  didomi: "Didomi",
  quantcast: "Quantcast",
  trustarc: "TrustArc",
  cookieyes: "CookieYes",
  complianz: "Complianz",
  osano: "Osano",
  consentmanager: "ConsentManager",
};

/** Get display-friendly name for a CMP identifier. */
export function getCmpDisplayName(cmp: string): string {
  return CMP_DISPLAY_NAMES[cmp] ?? cmp;
}
