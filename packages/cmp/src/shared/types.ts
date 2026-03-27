/**
 * @module shared/types
 * All TypeScript interfaces for the NoCookie CMP plugin.
 */

/** Standard cookie consent category identifiers. */
export type CategoryId = "essential" | "functional" | "analytics" | "marketing" | "social-media";

/** Cookie declaration describing an individual cookie. */
export interface CookieDeclaration {
  /** Cookie name or pattern. */
  name: string;
  /** Company or service that sets this cookie. */
  provider: string;
  /** URL of the provider. */
  providerUrl?: string;
  /** URL of the provider's privacy policy. */
  providerPrivacyUrl?: string;
  /** Domain the cookie is set on. */
  domain?: string;
  /** Human-readable duration (e.g. "1 year", "session"). */
  duration: string;
  /** Description of what this cookie does. */
  purpose: string;
  /** Whether cookie is set by the site or a third party. */
  type?: "first-party" | "third-party";
}

/** Configuration for a single consent category. */
export interface CategoryConfig {
  /** Category identifier. */
  id: CategoryId;
  /** Display name override. */
  name?: string;
  /** Description override. */
  description?: string;
  /** Whether the category cannot be disabled. */
  required?: boolean;
  /** Default consent state when user has not yet chosen. */
  defaultState?: boolean;
  /** Cookies belonging to this category. */
  cookies?: CookieDeclaration[];
}

/** Visual theme configuration for the consent banner. */
export interface ThemeConfig {
  /** Color scheme mode. */
  mode?: "light" | "dark" | "auto";
  /** Banner position on screen. */
  position?: "bottom-left" | "bottom-right" | "bottom-center" | "top-center";
  /** Primary accent color (hex). */
  primaryColor?: string;
  /** Accept button color (hex). */
  acceptColor?: string;
  /** Reject button color (hex). */
  rejectColor?: string;
  /** Banner background color (hex). */
  backgroundColor?: string;
  /** Banner text color (hex). */
  textColor?: string;
  /** Border radius in pixels. */
  borderRadius?: number;
  /** Font family string. */
  fontFamily?: string;
  /** Base font size in pixels. */
  fontSize?: number;
  /** Maximum banner width in pixels. */
  maxWidth?: number;
  /** CSS z-index for the banner. */
  zIndex?: number;
  /** Whether to show a page overlay behind the banner. */
  showOverlay?: boolean;
  /** Banner entrance animation style. */
  animation?: "slide-up" | "fade-in" | "none";
}

/** Behavioral configuration for consent handling. */
export interface BehaviorConfig {
  /** Days until consent expires and must be re-collected. */
  consentExpiry?: number;
  /** Whether to show the banner on every visit regardless of saved consent. */
  showOnEveryVisit?: boolean;
  /** Whether to show a "Reject All" button on the first layer. */
  rejectAllOnFirstLayer?: boolean;
  /** Whether scrolling the page dismisses the banner. */
  closeOnScroll?: boolean;
  /** Whether clicking outside the banner dismisses it. */
  closeOnOutsideClick?: boolean;
  /** Whether to block tagged scripts before consent is given. */
  blockScriptsBeforeConsent?: boolean;
  /** Whether to respect the Global Privacy Control signal. */
  respectGPC?: boolean;
  /** Whether to respect the Do Not Track header. */
  respectDNT?: boolean;
  /** Whether to emit a TCF v2 consent signal. */
  emitTCFSignal?: boolean;
  /** Whether to integrate with Google Consent Mode v2. */
  googleConsentMode?: boolean;
  /** Name of the consent cookie. */
  cookieName?: string;
  /** Domain for the consent cookie. Use 'auto' for automatic detection. */
  cookieDomain?: string | "auto";
  /** Path for the consent cookie. */
  cookiePath?: string;
  /** Whether the consent cookie requires HTTPS. */
  cookieSecure?: boolean;
  /** SameSite attribute for the consent cookie. */
  cookieSameSite?: "Strict" | "Lax" | "None";
}

/** UI translation strings. */
export interface TranslationStrings {
  bannerTitle: string;
  bannerDescription: string;
  preferencesTitle: string;
  acceptAll: string;
  rejectAll: string;
  customize: string;
  savePreferences: string;
  learnMore: string;
  closeAriaLabel: string;
  categoryRequired: string;
}

/** Configuration for .well-known/cookie-consent.json generation. */
export interface WellKnownConfig {
  /** Whether to expose consent config at the well-known endpoint. */
  enabled?: boolean;
  /** Categories to include in the well-known file. */
  categories?: CategoryId[];
}

/** Configuration for an auto-generated cookie policy page. */
export interface PolicyPageConfig {
  /** Whether to generate a policy page. */
  enabled?: boolean;
  /** Title of the policy page. */
  title?: string;
  /** Introductory text. */
  intro?: string;
}

/** Icon configuration overrides per category. */
export type IconConfig = Partial<Record<CategoryId, string>>;

/** Top-level CMP configuration provided by the site owner. */
export interface CMPConfig {
  /** Name of the website. */
  siteName: string;
  /** Privacy contact email. */
  privacyContact?: string;
  /** Data Protection Officer contact. */
  dpo?: string;
  /** URL to the site's privacy policy. */
  policyUrl?: string;
  /** Main site URL. */
  siteUrl?: string;
  /** URL to the site's legal imprint. */
  imprintUrl?: string;
  /** Consent categories. Strings are expanded to full CategoryConfig objects. */
  categories: (string | CategoryConfig)[];
  /** Theme configuration. */
  theme?: ThemeConfig;
  /** Behavior configuration. */
  behavior?: BehaviorConfig;
  /** UI language code (e.g. 'en', 'de'). */
  language?: string;
  /** Translation string overrides. */
  translations?: Partial<TranslationStrings>;
  /** .well-known endpoint configuration. */
  wellKnown?: WellKnownConfig;
  /** Auto-generated policy page configuration. */
  policyPage?: PolicyPageConfig;
  /** Icon overrides per category. */
  icons?: IconConfig;
}

/** Resolved configuration with all defaults applied. */
export interface ResolvedCMPConfig {
  siteName: string;
  privacyContact?: string;
  dpo?: string;
  policyUrl?: string;
  siteUrl?: string;
  imprintUrl?: string;
  categories: CategoryConfig[];
  theme: Required<ThemeConfig>;
  behavior: Required<BehaviorConfig>;
  language: string;
  translations: TranslationStrings;
  wellKnown: Required<WellKnownConfig>;
  policyPage: Required<PolicyPageConfig>;
  icons: IconConfig;
}

/** Per-category consent state. */
export type ConsentState = Record<CategoryId, boolean>;

/** Events emitted by the CMP. */
export type CMPEvent =
  | "consent:granted"
  | "consent:denied"
  | "consent:updated"
  | "consent:reset"
  | "ui:banner:show"
  | "ui:banner:hide"
  | "ui:preferences:open"
  | "ui:preferences:close"
  | "extension:detected"
  | "extension:applied"
  | "gpc:detected";

/** Metadata for a standard consent category. */
export interface CategoryMeta {
  id: CategoryId;
  name: string;
  description: string;
  color: string;
  icon: string;
  required: boolean;
  defaultState: boolean;
}
