/**
 * Shared type definitions for the NoCookie extension.
 *
 * Contains interfaces and types used across background,
 * content scripts, popup, and options pages.
 */

import type { CategoryId } from "./categories";

/** User's cookie consent preferences per category. */
export interface UserPreferences {
  /** Always true - essential cookies cannot be disabled. */
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  socialMedia: boolean;
}

/** Signals used to detect a CMP on the page. */
export interface DetectionSignals {
  domSelectors?: string[];
  scriptUrls?: string[];
  jsGlobals?: string[];
}

/** A single step in a consent action sequence. */
export interface ActionStep {
  type: "click" | "eval" | "waitFor" | "toggle";
  /** CSS selector or JS expression depending on type. */
  target?: string;
  value?: string;
  timeout?: number;
}

/** Ordered list of action steps to execute. */
export type ActionSequence = ActionStep[];

/** Rule describing how to interact with a specific CMP. */
export interface CMPRule {
  name: string;
  detection: DetectionSignals;
  categoryMapping: {
    functional: string;
    analytics: string;
    marketing: string;
    socialMedia?: string;
  };
  actions: {
    acceptAll: ActionSequence;
    rejectAll: ActionSequence;
    custom: ActionSequence;
  };
}

/** Confidence level for detection or consent results. */
export type ConfidenceLevel = "high" | "medium" | "low";

/** Method used to apply consent on a page. */
export type ConsentMethod =
  | "api"
  | "click"
  | "tcf"
  | "heuristic"
  | "well-known"
  | "autoconsent"
  | "extension-native";

/** Result of a consent operation on a single domain. */
export interface ConsentResult {
  domain: string;
  cmp: string | null;
  method: ConsentMethod;
  categoriesAccepted: string[];
  categoriesRejected: string[];
  timestamp: number;
  confidence: ConfidenceLevel;
  success: boolean;
}

/** Per-domain override configuration. */
export interface DomainOverride {
  mode: "whitelist" | "blacklist" | "custom" | "disabled";
  preferences?: UserPreferences;
}

/** Global extension settings. */
export interface ExtensionSettings {
  autoConsent: boolean;
  consentDelay: number;
  showNotifications: boolean;
  logConsent: boolean;
  enableHeuristics: boolean;
  enableWellKnown: boolean;
  enableGpc: boolean;
}

/** Schema for the `/.well-known/cookie-consent.json` standard. */
export interface WellKnownCookieConsent {
  version: string;
  categories: CategoryId[];
  cmp?: { name: string; version?: string };
  selectors?: {
    banner?: string;
    acceptAll?: string;
    rejectAll?: string;
    preferences?: string;
    save?: string;
  };
  categorySelectors?: Record<string, { toggle?: string; cmpId?: string }>;
  api?: {
    type: string;
    acceptAll?: string;
    rejectAll?: string;
    setCategory?: string;
  };
  gpc?: boolean;
  tcf?: boolean;
  contact?: string;
  policyUrl?: string;
}

/** Cached entry for a well-known cookie consent fetch. */
export interface WellKnownCacheEntry {
  data: WellKnownCookieConsent | null;
  fetchedAt: number;
  ttl: number;
}

/** Aggregate extension usage statistics. */
export interface ExtensionStats {
  popupsHandled: number;
  popupsByMethod: Record<string, number>;
  popupsByCmp: Record<string, number>;
  firstInstall: number;
}
