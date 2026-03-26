/**
 * Typed CRUD wrapper around chrome.storage.sync and chrome.storage.local.
 *
 * Provides async functions for managing user preferences, domain overrides,
 * consent logs, statistics, well-known cache, and storage schema migrations.
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
import { DEFAULT_LOCAL_STORAGE, DEFAULT_SYNC_STORAGE } from "./storage";
import type { LocalStorageSchema, SyncStorageSchema } from "./storage";

/** Current storage schema version. Bump when adding migrations. */
export const CURRENT_SCHEMA_VERSION = 1;

/** Read a single key from sync storage, returning its default if absent. */
async function getSyncKey<K extends keyof SyncStorageSchema>(
  key: K,
): Promise<SyncStorageSchema[K]> {
  const defaultValue = structuredClone(DEFAULT_SYNC_STORAGE[key]);
  const result = await chrome.storage.sync.get({ [key]: defaultValue });
  return result[key] as SyncStorageSchema[K];
}

/** Write a single key to sync storage. */
async function setSyncKey<K extends keyof SyncStorageSchema>(
  key: K,
  value: SyncStorageSchema[K],
): Promise<void> {
  await chrome.storage.sync.set({ [key]: value });
}

/** Read a single key from local storage, returning its default if absent. */
async function getLocalKey<K extends keyof LocalStorageSchema>(
  key: K,
): Promise<LocalStorageSchema[K]> {
  const defaultValue = structuredClone(DEFAULT_LOCAL_STORAGE[key]);
  const result = await chrome.storage.local.get({ [key]: defaultValue });
  return result[key] as LocalStorageSchema[K];
}

/** Write a single key to local storage. */
async function setLocalKey<K extends keyof LocalStorageSchema>(
  key: K,
  value: LocalStorageSchema[K],
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// -- Sync: preferences ------------------------------------------------------

/** Get the current user preferences (falls back to defaults). */
export async function getPreferences(): Promise<UserPreferences> {
  return getSyncKey("preferences");
}

/** Merge partial preferences into the stored preferences. */
export async function setPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const current = await getPreferences();
  await setSyncKey("preferences", { ...current, ...prefs });
}

// -- Sync: profile ----------------------------------------------------------

/** Get the active profile name. */
export async function getProfile(): Promise<ProfileName> {
  return getSyncKey("profile");
}

/** Set the active profile name. */
export async function setProfile(profile: ProfileName): Promise<void> {
  await setSyncKey("profile", profile);
}

// -- Sync: settings ---------------------------------------------------------

/** Get extension settings. */
export async function getSettings(): Promise<ExtensionSettings> {
  return getSyncKey("settings");
}

/** Merge partial settings into the stored settings. */
export async function updateSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings();
  await setSyncKey("settings", { ...current, ...settings });
}

// -- Sync: domain overrides -------------------------------------------------

/** Get the override for a specific domain, or null if none. */
export async function getDomainOverride(domain: string): Promise<DomainOverride | null> {
  const overrides = await getSyncKey("domainOverrides");
  return overrides[domain] ?? null;
}

/** Set (create or update) the override for a specific domain. */
export async function setDomainOverride(domain: string, override: DomainOverride): Promise<void> {
  const overrides = await getSyncKey("domainOverrides");
  overrides[domain] = override;
  await setSyncKey("domainOverrides", overrides);
}

/** Remove the override for a specific domain. */
export async function removeDomainOverride(domain: string): Promise<void> {
  const overrides = await getSyncKey("domainOverrides");
  delete overrides[domain];
  await setSyncKey("domainOverrides", overrides);
}

/** Get all domain overrides. */
export async function getAllDomainOverrides(): Promise<Record<string, DomainOverride>> {
  return getSyncKey("domainOverrides");
}

// -- Sync: onboarding -------------------------------------------------------

/** Check whether onboarding has been completed. */
export async function isOnboardingCompleted(): Promise<boolean> {
  return getSyncKey("onboardingCompleted");
}

/** Set the onboarding-completed flag. */
export async function setOnboardingCompleted(completed: boolean): Promise<void> {
  await setSyncKey("onboardingCompleted", completed);
}

// -- Local: consent log -----------------------------------------------------

/** Get the consent result for a specific domain, or null. */
export async function getConsentLog(domain: string): Promise<ConsentResult | null> {
  const log = await getLocalKey("consentLog");
  return log[domain] ?? null;
}

/** Store a consent result for a domain. */
export async function setConsentLog(domain: string, result: ConsentResult): Promise<void> {
  const log = await getLocalKey("consentLog");
  log[domain] = result;
  await setLocalKey("consentLog", log);
}

/** Get all consent log entries. */
export async function getAllConsentLogs(): Promise<Record<string, ConsentResult>> {
  return getLocalKey("consentLog");
}

/** Clear the entire consent log. */
export async function clearConsentLogs(): Promise<void> {
  await setLocalKey("consentLog", {});
}

// -- Local: well-known cache ------------------------------------------------

/** Get the cached well-known entry for a domain, or null. */
export async function getWellKnownCache(domain: string): Promise<WellKnownCacheEntry | null> {
  const cache = await getLocalKey("wellKnownCache");
  return cache[domain] ?? null;
}

/** Store a well-known cache entry for a domain. */
export async function setWellKnownCache(domain: string, entry: WellKnownCacheEntry): Promise<void> {
  const cache = await getLocalKey("wellKnownCache");
  cache[domain] = entry;
  await setLocalKey("wellKnownCache", cache);
}

// -- Local: stats -----------------------------------------------------------

/** Get extension usage statistics. */
export async function getStats(): Promise<ExtensionStats> {
  return getLocalKey("stats");
}

/** Increment the popupsHandled counter and optionally track method/CMP. */
export async function incrementStat(
  _key: "popupsHandled",
  method?: string,
  cmp?: string,
): Promise<void> {
  const stats = await getStats();
  stats.popupsHandled += 1;
  if (method) {
    stats.popupsByMethod[method] = (stats.popupsByMethod[method] ?? 0) + 1;
  }
  if (cmp) {
    stats.popupsByCmp[cmp] = (stats.popupsByCmp[cmp] ?? 0) + 1;
  }
  await setLocalKey("stats", stats);
}

// -- Migration --------------------------------------------------------------

/** Run storage migrations if the schema version is outdated. */
export async function migrateStorageIfNeeded(): Promise<void> {
  const result = await chrome.storage.local.get({ schemaVersion: 0 });
  const currentVersion = result.schemaVersion as number;
  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return;
  }
  // Future migrations go here:
  // if (currentVersion < 2) { /* migrate v1 -> v2 */ }
  await chrome.storage.local.set({ schemaVersion: CURRENT_SCHEMA_VERSION });
}
