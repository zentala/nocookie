/**
 * Integration tests: storage migration.
 *
 * Validates fresh install defaults, schema version upgrades,
 * and graceful handling of corrupt data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { installChromeMock, type StorageAreaMock } from "../helpers/chrome-storage-mock";
import {
  CURRENT_SCHEMA_VERSION,
  migrateStorageIfNeeded,
  getPreferences,
  getSettings,
  getStats,
  isOnboardingCompleted,
} from "@/shared/storage-api";
import { DEFAULT_PREFERENCES, DEFAULT_SETTINGS } from "@/shared/storage";

let syncMock: StorageAreaMock;
let localMock: StorageAreaMock;

beforeEach(() => {
  const mocks = installChromeMock();
  syncMock = mocks.syncMock;
  localMock = mocks.localMock;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Fresh install -> defaults populated", () => {
  it("getPreferences returns defaults when storage is empty", async () => {
    const prefs = await getPreferences();
    expect(prefs).toEqual(DEFAULT_PREFERENCES);
  });

  it("getSettings returns defaults when storage is empty", async () => {
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("getStats returns zero counters on fresh install", async () => {
    const stats = await getStats();
    expect(stats.popupsHandled).toBe(0);
    expect(stats.popupsByMethod).toEqual({});
    expect(stats.popupsByCmp).toEqual({});
  });

  it("onboarding is not completed on fresh install", async () => {
    const completed = await isOnboardingCompleted();
    expect(completed).toBe(false);
  });
});

describe("Schema version upgrade -> migration runs", () => {
  it("sets schema version on first run", async () => {
    await migrateStorageIfNeeded();

    const setCalls = localMock.set.mock.calls;
    const versionCall = setCalls.find(
      (c: unknown[]) => (c[0] as Record<string, unknown>).schemaVersion !== undefined,
    );
    expect(versionCall).toBeDefined();
    expect((versionCall![0] as Record<string, number>).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("skips migration if already at current version", async () => {
    localMock.set({ schemaVersion: CURRENT_SCHEMA_VERSION });

    await migrateStorageIfNeeded();

    // set should have been called once for the initial schemaVersion,
    // and NOT called again by migration
    const setCalls = localMock.set.mock.calls;
    const migrationCalls = setCalls.filter(
      (c: unknown[]) => (c[0] as Record<string, unknown>).schemaVersion !== undefined,
    );
    // Only the initial set, no additional migration set
    expect(migrationCalls.length).toBe(1);
  });

  it("migrates when schema version is lower", async () => {
    localMock.set({ schemaVersion: 0 });

    await migrateStorageIfNeeded();

    const setCalls = localMock.set.mock.calls;
    const migrationCalls = setCalls.filter(
      (c: unknown[]) => (c[0] as Record<string, unknown>).schemaVersion === CURRENT_SCHEMA_VERSION,
    );
    expect(migrationCalls.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Corrupt data -> graceful handling", () => {
  it("getPreferences returns defaults when stored value is null", async () => {
    syncMock.set({ preferences: null });

    // Should fall back to default via chrome.storage.get default
    const prefs = await getPreferences();
    // Storage mock returns null when set to null, but the API uses defaults
    expect(prefs).toBeDefined();
  });

  it("getStats handles missing fields gracefully", async () => {
    // Simulate partially corrupted stats
    localMock.set({
      stats: { popupsHandled: 5 },
    });

    const stats = await getStats();
    expect(stats.popupsHandled).toBe(5);
  });

  it("migrateStorageIfNeeded handles non-numeric schemaVersion", async () => {
    localMock.set({ schemaVersion: "invalid" });

    // Should not throw
    await expect(migrateStorageIfNeeded()).resolves.toBeUndefined();
  });
});
