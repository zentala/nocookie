/**
 * Shared module barrel export.
 *
 * Re-exports all types, constants, and utilities from the shared module
 * for convenient single-import access.
 */

export type {
  ActionSequence,
  ActionStep,
  CMPRule,
  ConfidenceLevel,
  ConsentMethod,
  ConsentResult,
  DetectionSignals,
  DomainOverride,
  ExtensionSettings,
  ExtensionStats,
  UserPreferences,
  WellKnownCacheEntry,
  WellKnownCookieConsent,
} from "./types";

export type { CategoryId, CategoryMeta, PrivacyImpact, ProfileName } from "./categories";

export {
  CATEGORY_IDS,
  CATEGORY_META,
  PROFILE_LABELS,
  PROFILE_PRESETS,
  getPreferencesForProfile,
} from "./categories";

export type { BadgeState, Message, MessagePayloadMap, MessageType } from "./messages";

export { createMessage } from "./messages";

export type { LocalStorageSchema, SyncStorageSchema } from "./storage";

export {
  DEFAULT_LOCAL_STORAGE,
  DEFAULT_PREFERENCES,
  DEFAULT_SETTINGS,
  DEFAULT_SYNC_STORAGE,
} from "./storage";
