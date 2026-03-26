/**
 * @module @nocookie/cmp
 * Open-source Consent Management Platform plugin.
 *
 * Provides a Shadow DOM-based cookie consent banner that integrates
 * with the NoCookie browser extension and the /.well-known/cookie-consent.json
 * open standard.
 */

import "@/styles/base.css";

/** Cookie consent category identifiers. */
export type ConsentCategory = "necessary" | "functional" | "analytics" | "marketing";

/** User consent preferences per category. */
export interface ConsentPreferences {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

/** Configuration options for the CMP. */
export interface NoCookieCMPConfig {
  /** Whether to auto-attach the banner on initialization. */
  autoShow?: boolean;
  /** Target element to attach the Shadow DOM host. Defaults to `document.body`. */
  target?: HTMLElement;
  /** Initial consent preferences. */
  defaults?: Partial<ConsentPreferences>;
}

/** CMP controller interface. */
export interface NoCookieCMPInstance {
  readonly version: string;
  init(config?: NoCookieCMPConfig): NoCookieCMPInstance;
  getConsent(): ConsentPreferences;
}

/**
 * Main CMP controller.
 *
 * Manages cookie consent UI (Shadow DOM banner) and consent state.
 * This is a placeholder implementation to be expanded in subsequent tasks.
 */
export const NoCookieCMP: NoCookieCMPInstance = {
  /** Current library version. */
  version: "0.1.0",

  /**
   * Initialize the CMP with the given configuration.
   *
   * @param config - CMP configuration options
   * @returns The CMP instance for chaining
   */
  init(config: NoCookieCMPConfig = {}): NoCookieCMPInstance {
    const { autoShow = true, target, defaults } = config;
    void autoShow;
    void target;
    void defaults;
    return NoCookieCMP;
  },

  /**
   * Get current consent preferences.
   *
   * @returns Current consent state
   */
  getConsent(): ConsentPreferences {
    return {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
  },
};
