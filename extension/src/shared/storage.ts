/**
 * Chrome storage schema types and default values.
 *
 * Provides typed schemas for chrome.storage.sync and chrome.storage.local,
 * plus sensible default values for all settings.
 */

import type { ProfileName } from "./categories";
import type {
  ConsentResult,
  DomainOverride,
  ExtensionSettings,
  ExtensionStats,
  UserPreferences,
  WellKnownCacheEntry,
} from "./types";

/** Schema for chrome.storage.sync (synced across devices). */
export interface SyncStorageSchema {
  preferences: UserPreferences;
  profile: ProfileName;
  domainOverrides: Record<string, DomainOverride>;
  settings: ExtensionSettings;
  onboardingCompleted: boolean;
}

/** Schema for chrome.storage.local (device-only). */
export interface LocalStorageSchema {
  consentLog: Record<string, ConsentResult>;
  wellKnownCache: Record<string, WellKnownCacheEntry>;
  stats: ExtensionStats;
}

/** Default user preferences (balanced profile). */
export const DEFAULT_PREFERENCES: UserPreferences = {
  essential: true,
  functional: true,
  analytics: false,
  marketing: false,
  socialMedia: false,
};

/** Default extension settings. */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  autoConsent: true,
  consentDelay: 500,
  showNotifications: true,
  logConsent: true,
  enableHeuristics: true,
  enableWellKnown: true,
  enableGpc: true,
};

/** Default sync storage state. */
export const DEFAULT_SYNC_STORAGE: SyncStorageSchema = {
  preferences: { ...DEFAULT_PREFERENCES },
  profile: "balanced",
  domainOverrides: {},
  settings: { ...DEFAULT_SETTINGS },
  onboardingCompleted: false,
};

/** Default local storage state. */
export const DEFAULT_LOCAL_STORAGE: LocalStorageSchema = {
  consentLog: {},
  wellKnownCache: {},
  stats: {
    popupsHandled: 0,
    popupsByMethod: {},
    popupsByCmp: {},
    firstInstall: 0,
  },
};
