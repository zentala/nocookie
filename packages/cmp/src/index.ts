/**
 * @module @nocookie/cmp
 * Open-source Consent Management Platform plugin.
 *
 * Provides a Shadow DOM-based cookie consent banner that integrates
 * with the NoCookie browser extension and the /.well-known/cookie-consent.json
 * open standard.
 */

import "@/styles/base.css";

// Re-export public API from submodules
export type {
  CategoryId,
  CookieDeclaration,
  CategoryConfig,
  ThemeConfig,
  BehaviorConfig,
  TranslationStrings,
  WellKnownConfig,
  PolicyPageConfig,
  IconConfig,
  CMPConfig,
  ResolvedCMPConfig,
  ConsentState,
  CMPEvent,
  CategoryMeta,
} from "@/shared/index";

export {
  CATEGORY_IDS,
  CATEGORY_META,
  DEFAULT_THEME,
  DEFAULT_BEHAVIOR,
  DEFAULT_TRANSLATIONS,
  DEFAULT_WELL_KNOWN,
  DEFAULT_POLICY_PAGE,
  DEFAULT_LANGUAGE,
} from "@/shared/index";

export {
  parseConfig,
  expandCategory,
  isValidCategoryId,
  ConfigValidationError,
} from "@/core/index";

import type { CMPConfig, ResolvedCMPConfig, ConsentState } from "@/shared/types";
import { parseConfig } from "@/core/config";

/** CMP controller interface. */
export interface NoCookieCMPInstance {
  readonly version: string;
  init(config: CMPConfig): NoCookieCMPInstance;
  getConsent(): ConsentState;
  getConfig(): ResolvedCMPConfig | null;
}

/**
 * Main CMP controller.
 *
 * Manages cookie consent UI (Shadow DOM banner) and consent state.
 * This is a placeholder implementation to be expanded in subsequent tasks.
 */
export const NoCookieCMP: NoCookieCMPInstance = (() => {
  let resolvedConfig: ResolvedCMPConfig | null = null;

  return {
    version: "0.1.0",

    /**
     * Initialize the CMP with the given configuration.
     *
     * @param config - CMP configuration from the site owner
     * @returns The CMP instance for chaining
     */
    init(config: CMPConfig): NoCookieCMPInstance {
      resolvedConfig = parseConfig(config);
      return NoCookieCMP;
    },

    /**
     * Get current consent preferences.
     *
     * @returns Current consent state per category
     */
    getConsent(): ConsentState {
      if (!resolvedConfig) {
        return {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
          "social-media": false,
        };
      }
      const state: Record<string, boolean> = {};
      for (const cat of resolvedConfig.categories) {
        state[cat.id] = cat.defaultState ?? false;
      }
      return state as ConsentState;
    },

    /**
     * Get the resolved configuration, or null if not yet initialized.
     *
     * @returns The resolved config or null
     */
    getConfig(): ResolvedCMPConfig | null {
      return resolvedConfig;
    },
  };
})();
