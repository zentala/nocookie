import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { DEFAULT_SYNC_STORAGE } from "@/shared/storage";
import {
  CURRENT_SCHEMA_VERSION,
  clearConsentLogs,
  getAllConsentLogs,
  getAllDomainOverrides,
  getConsentLog,
  getDomainOverride,
  getPreferences,
  getProfile,
  getSettings,
  getStats,
  getWellKnownCache,
  incrementStat,
  isOnboardingCompleted,
  migrateStorageIfNeeded,
  removeDomainOverride,
  setConsentLog,
  setDomainOverride,
  setOnboardingCompleted,
  setPreferences,
  setProfile,
  setWellKnownCache,
  updateSettings,
} from "@/shared/storage-api";
import type { ConsentResult, DomainOverride } from "@/shared/types";
import { installChromeMock } from "./helpers/chrome-storage-mock";

const { syncMock, localMock } = installChromeMock();

beforeEach(() => {
  syncMock._reset();
  localMock._reset();
  vi.clearAllMocks();
});

// -- Preferences ------------------------------------------------------------

describe("getPreferences / setPreferences", () => {
  it("returns defaults when storage is empty", async () => {
    expect(await getPreferences()).toEqual(DEFAULT_SYNC_STORAGE.preferences);
  });

  it("merges partial preferences into existing", async () => {
    await setPreferences({ analytics: true });
    const prefs = await getPreferences();
    expect(prefs.analytics).toBe(true);
    expect(prefs.functional).toBe(DEFAULT_SYNC_STORAGE.preferences.functional);
  });

  it("overwrites previously stored values", async () => {
    await setPreferences({ marketing: true });
    await setPreferences({ marketing: false });
    expect((await getPreferences()).marketing).toBe(false);
  });
});

// -- Profile ----------------------------------------------------------------

describe("getProfile / setProfile", () => {
  it("returns default profile when storage is empty", async () => {
    expect(await getProfile()).toBe("balanced");
  });

  it("persists a new profile", async () => {
    await setProfile("privacy-max");
    expect(await getProfile()).toBe("privacy-max");
  });
});

// -- Settings ---------------------------------------------------------------

describe("getSettings / updateSettings", () => {
  it("returns defaults when empty", async () => {
    expect(await getSettings()).toEqual(DEFAULT_SYNC_STORAGE.settings);
  });

  it("merges partial settings", async () => {
    await updateSettings({ autoConsent: false, consentDelay: 1000 });
    const s = await getSettings();
    expect(s.autoConsent).toBe(false);
    expect(s.consentDelay).toBe(1000);
    expect(s.showNotifications).toBe(true);
  });
});

// -- Domain overrides -------------------------------------------------------

describe("domain overrides CRUD", () => {
  const override: DomainOverride = { mode: "whitelist" };

  it("returns null for unknown domain", async () => {
    expect(await getDomainOverride("example.com")).toBeNull();
  });

  it("sets and gets an override", async () => {
    await setDomainOverride("example.com", override);
    expect(await getDomainOverride("example.com")).toEqual(override);
  });

  it("removes an override", async () => {
    await setDomainOverride("example.com", override);
    await removeDomainOverride("example.com");
    expect(await getDomainOverride("example.com")).toBeNull();
  });

  it("getAllDomainOverrides returns all entries", async () => {
    await setDomainOverride("a.com", { mode: "blacklist" });
    await setDomainOverride("b.com", { mode: "disabled" });
    const all = await getAllDomainOverrides();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all["a.com"].mode).toBe("blacklist");
    expect(all["b.com"].mode).toBe("disabled");
  });
});

// -- Onboarding -------------------------------------------------------------

describe("onboarding", () => {
  it("defaults to false", async () => {
    expect(await isOnboardingCompleted()).toBe(false);
  });

  it("can be set to true", async () => {
    await setOnboardingCompleted(true);
    expect(await isOnboardingCompleted()).toBe(true);
  });
});

// -- Consent log ------------------------------------------------------------

describe("consent log CRUD", () => {
  const entry: ConsentResult = {
    domain: "example.com",
    cmp: "OneTrust",
    method: "click",
    categoriesAccepted: ["essential", "functional"],
    categoriesRejected: ["marketing"],
    timestamp: Date.now(),
    confidence: "high",
    success: true,
  };

  it("returns null for unknown domain", async () => {
    expect(await getConsentLog("example.com")).toBeNull();
  });

  it("sets and gets a consent log entry", async () => {
    await setConsentLog("example.com", entry);
    expect(await getConsentLog("example.com")).toEqual(entry);
  });

  it("getAllConsentLogs returns all entries", async () => {
    await setConsentLog("a.com", { ...entry, domain: "a.com" });
    await setConsentLog("b.com", { ...entry, domain: "b.com" });
    const all = await getAllConsentLogs();
    expect(Object.keys(all)).toHaveLength(2);
  });

  it("clearConsentLogs removes all entries", async () => {
    await setConsentLog("a.com", { ...entry, domain: "a.com" });
    await clearConsentLogs();
    expect(Object.keys(await getAllConsentLogs())).toHaveLength(0);
  });
});

// -- Well-known cache -------------------------------------------------------

describe("well-known cache", () => {
  it("returns null for uncached domain", async () => {
    expect(await getWellKnownCache("example.com")).toBeNull();
  });

  it("stores and retrieves a cache entry", async () => {
    const entry = { data: null, fetchedAt: Date.now(), ttl: 3600 };
    await setWellKnownCache("example.com", entry);
    expect(await getWellKnownCache("example.com")).toEqual(entry);
  });
});

// -- Stats ------------------------------------------------------------------

describe("stats", () => {
  it("returns defaults when empty", async () => {
    const stats = await getStats();
    expect(stats.popupsHandled).toBe(0);
    expect(stats.popupsByMethod).toEqual({});
    expect(stats.popupsByCmp).toEqual({});
  });

  it("incrementStat increases popupsHandled", async () => {
    await incrementStat("popupsHandled");
    await incrementStat("popupsHandled");
    expect((await getStats()).popupsHandled).toBe(2);
  });

  it("incrementStat tracks method", async () => {
    await incrementStat("popupsHandled", "click");
    await incrementStat("popupsHandled", "click");
    await incrementStat("popupsHandled", "api");
    const stats = await getStats();
    expect(stats.popupsByMethod["click"]).toBe(2);
    expect(stats.popupsByMethod["api"]).toBe(1);
  });

  it("incrementStat tracks CMP", async () => {
    await incrementStat("popupsHandled", undefined, "OneTrust");
    expect((await getStats()).popupsByCmp["OneTrust"]).toBe(1);
  });

  it("incrementStat tracks method and CMP together", async () => {
    await incrementStat("popupsHandled", "tcf", "CookieBot");
    const stats = await getStats();
    expect(stats.popupsHandled).toBe(1);
    expect(stats.popupsByMethod["tcf"]).toBe(1);
    expect(stats.popupsByCmp["CookieBot"]).toBe(1);
  });
});

// -- Migration --------------------------------------------------------------

describe("migrateStorageIfNeeded", () => {
  it("sets schema version on first run", async () => {
    await migrateStorageIfNeeded();
    expect(localMock._store().schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("is a no-op when already at current version", async () => {
    localMock.set({ schemaVersion: CURRENT_SCHEMA_VERSION });
    (localMock.set as Mock).mockClear();
    await migrateStorageIfNeeded();
    expect(localMock.set).not.toHaveBeenCalled();
  });

  it("upgrades from version 0 to current", async () => {
    await migrateStorageIfNeeded();
    expect(localMock._store().schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});
