/**
 * @module shared/constants
 * Standard category metadata, default theme, behavior, and translation values.
 */

import type {
  BehaviorConfig,
  CategoryId,
  CategoryMeta,
  ThemeConfig,
  TranslationStrings,
  WellKnownConfig,
  PolicyPageConfig,
} from "./types";

/** All recognized category IDs in display order. */
export const CATEGORY_IDS: readonly CategoryId[] = [
  "essential",
  "functional",
  "analytics",
  "marketing",
  "social-media",
] as const;

/** Standard metadata for each consent category. */
export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  essential: {
    id: "essential",
    name: "Strictly Necessary",
    description: "Required for website function, cannot be disabled",
    color: "#6b7280",
    icon: "lock",
    required: true,
    defaultState: true,
  },
  functional: {
    id: "functional",
    name: "Functional",
    description: "Enhanced functionality like preferences and language",
    color: "#2563eb",
    icon: "gear",
    required: false,
    defaultState: false,
  },
  analytics: {
    id: "analytics",
    name: "Analytics & Performance",
    description: "Understanding how visitors interact with the website",
    color: "#7c3aed",
    icon: "chart",
    required: false,
    defaultState: false,
  },
  marketing: {
    id: "marketing",
    name: "Marketing & Advertising",
    description: "Delivering relevant advertisements",
    color: "#ea580c",
    icon: "megaphone",
    required: false,
    defaultState: false,
  },
  "social-media": {
    id: "social-media",
    name: "Social Media",
    description: "Social media features like share buttons",
    color: "#0ea5e9",
    icon: "share",
    required: false,
    defaultState: false,
  },
};

/** Default theme values applied when none are provided. */
export const DEFAULT_THEME: Required<ThemeConfig> = {
  mode: "light",
  position: "bottom-left",
  primaryColor: "#2563eb",
  acceptColor: "#16a34a",
  rejectColor: "#dc2626",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  borderRadius: 12,
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: 14,
  maxWidth: 480,
  zIndex: 999999,
  showOverlay: false,
  animation: "slide-up",
};

/** Default behavior values applied when none are provided. */
export const DEFAULT_BEHAVIOR: Required<BehaviorConfig> = {
  consentExpiry: 365,
  showOnEveryVisit: false,
  rejectAllOnFirstLayer: true,
  closeOnScroll: false,
  closeOnOutsideClick: false,
  blockScriptsBeforeConsent: false,
  respectGPC: true,
  respectDNT: false,
  emitTCFSignal: false,
  googleConsentMode: false,
  cookieName: "ca_consent",
  cookieDomain: "auto",
  cookiePath: "/",
  cookieSecure: true,
  cookieSameSite: "Lax",
};

/** Default English translation strings. */
export const DEFAULT_TRANSLATIONS: TranslationStrings = {
  bannerTitle: "Cookie Consent",
  bannerDescription:
    "We use cookies to enhance your browsing experience. Choose which categories you allow.",
  acceptAll: "Accept All",
  rejectAll: "Reject All",
  customize: "Customize",
  savePreferences: "Save Preferences",
  closeAriaLabel: "Close cookie consent banner",
  categoryRequired: "Always active",
};

/** Default well-known endpoint configuration. */
export const DEFAULT_WELL_KNOWN: Required<WellKnownConfig> = {
  enabled: false,
  categories: [],
};

/** Default policy page configuration. */
export const DEFAULT_POLICY_PAGE: Required<PolicyPageConfig> = {
  enabled: false,
  title: "Cookie Policy",
  intro: "",
};

/** Default language code. */
export const DEFAULT_LANGUAGE = "en";
