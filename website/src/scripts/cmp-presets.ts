/**
 * CMP presets for the cookie-consent.json generator.
 *
 * Each preset pre-fills known selectors, API patterns, and CMP metadata
 * for popular Consent Management Platforms.
 */

export interface CmpPreset {
  label: string;
  cmp: { name: string };
  selectors: {
    banner?: string;
    acceptAll?: string;
    rejectAll?: string;
    preferences?: string;
    save?: string;
  };
  api?: {
    type?: string;
    acceptAll?: string;
    rejectAll?: string;
    setCategory?: string;
  };
}

export const CMP_PRESETS: Record<string, CmpPreset> = {
  onetrust: {
    label: "OneTrust",
    cmp: { name: "onetrust" },
    selectors: {
      banner: "#onetrust-banner-sdk",
      acceptAll: "#onetrust-accept-btn-handler",
      rejectAll: "#onetrust-reject-all-handler",
      preferences: "#onetrust-pc-btn-handler",
      save: ".save-preference-btn-handler",
    },
    api: {
      type: "onetrust",
      acceptAll: "OneTrust.AllowAll()",
      rejectAll: "OneTrust.RejectAll()",
      setCategory: "OneTrust.UpdateConsent()",
    },
  },
  cookiebot: {
    label: "Cookiebot",
    cmp: { name: "cookiebot" },
    selectors: {
      banner: "#CybotCookiebotDialog",
      acceptAll: "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
      rejectAll: "#CybotCookiebotDialogBodyButtonDecline",
      preferences: "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection",
    },
    api: {
      type: "cookiebot",
      acceptAll: "Cookiebot.submitCustomConsent(true, true, true, true)",
      rejectAll: "Cookiebot.submitCustomConsent(true, false, false, false)",
    },
  },
  didomi: {
    label: "Didomi",
    cmp: { name: "didomi" },
    selectors: {
      banner: "#didomi-popup",
      acceptAll: "#didomi-notice-agree-button",
      rejectAll: "#didomi-notice-disagree-button",
      preferences: ".didomi-components-button--secondary",
    },
    api: {
      type: "didomi",
      acceptAll: "Didomi.setUserAgreeToAll()",
      rejectAll: "Didomi.setUserDisagreeToAll()",
    },
  },
  cookieyes: {
    label: "CookieYes",
    cmp: { name: "cookieyes" },
    selectors: {
      banner: ".cky-consent-container",
      acceptAll: ".cky-btn-accept",
      rejectAll: ".cky-btn-reject",
      preferences: ".cky-btn-customize",
      save: ".cky-btn-preferences",
    },
  },
  complianz: {
    label: "Complianz",
    cmp: { name: "complianz" },
    selectors: {
      banner: ".cmplz-cookiebanner",
      acceptAll: ".cmplz-accept",
      rejectAll: ".cmplz-deny",
      preferences: ".cmplz-manage-settings",
      save: ".cmplz-save-preferences",
    },
  },
  osano: {
    label: "Osano",
    cmp: { name: "osano" },
    selectors: {
      banner: ".osano-cm-dialog",
      acceptAll: ".osano-cm-accept-all",
      rejectAll: ".osano-cm-deny-all",
      preferences: ".osano-cm-manage",
      save: ".osano-cm-save",
    },
  },
  custom: {
    label: "Custom",
    cmp: { name: "" },
    selectors: {},
  },
};
