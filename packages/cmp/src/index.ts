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

import type {
  CMPConfig,
  ResolvedCMPConfig,
  ConsentState,
  CategoryId,
  CMPEvent,
} from "@/shared/types";
import { CMPOrchestrator } from "@/core/cmp";

/** CMP controller interface with full public API. */
export interface NoCookieCMPInstance {
  readonly version: string;
  init(config: CMPConfig): NoCookieCMPInstance;
  getConsent(): ConsentState;
  setConsent(category: CategoryId, granted: boolean): void;
  acceptAll(): void;
  rejectAll(): void;
  openPreferences(): void;
  close(): void;
  reset(): void;
  on(event: CMPEvent | "*", handler: (...args: unknown[]) => void): void;
  off(event: CMPEvent | "*", handler: (...args: unknown[]) => void): void;
  getWellKnownJSON(): object;
  getPolicyHTML(): string;
  getConfig(): ResolvedCMPConfig | null;
}

const orchestrator = new CMPOrchestrator();

/**
 * Main CMP controller.
 *
 * Manages cookie consent UI (Shadow DOM banner), consent state,
 * extension bridge, GPC detection, and accessibility features.
 * Call `init(config)` to start the CMP.
 */
export const NoCookieCMP: NoCookieCMPInstance = {
  version: "0.1.0",

  init(config: CMPConfig): NoCookieCMPInstance {
    orchestrator.init(config);
    return NoCookieCMP;
  },

  getConsent(): ConsentState {
    return orchestrator.getConsent();
  },

  setConsent(category: CategoryId, granted: boolean): void {
    orchestrator.setConsent(category, granted);
  },

  acceptAll(): void {
    orchestrator.acceptAll();
  },

  rejectAll(): void {
    orchestrator.rejectAll();
  },

  openPreferences(): void {
    orchestrator.openPreferences();
  },

  close(): void {
    orchestrator.close();
  },

  reset(): void {
    orchestrator.reset();
  },

  on(event: CMPEvent | "*", handler: (...args: unknown[]) => void): void {
    orchestrator.on(event, handler);
  },

  off(event: CMPEvent | "*", handler: (...args: unknown[]) => void): void {
    orchestrator.off(event, handler);
  },

  getWellKnownJSON(): object {
    return orchestrator.getWellKnownJSON();
  },

  getPolicyHTML(): string {
    return orchestrator.getPolicyHTML();
  },

  getConfig(): ResolvedCMPConfig | null {
    return orchestrator.getConfig();
  },
};
