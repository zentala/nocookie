import { describe, expect, it } from "vitest";
import {
  CATEGORY_IDS,
  CATEGORY_META,
  DEFAULT_PREFERENCES,
  DEFAULT_SETTINGS,
  DEFAULT_SYNC_STORAGE,
  DEFAULT_LOCAL_STORAGE,
  PROFILE_PRESETS,
  getPreferencesForProfile,
} from "@/shared";
import type { CategoryId, UserPreferences } from "@/shared";

describe("Profile presets", () => {
  it("privacy-max only allows essential", () => {
    const prefs = PROFILE_PRESETS["privacy-max"];
    expect(prefs.essential).toBe(true);
    expect(prefs.functional).toBe(false);
    expect(prefs.analytics).toBe(false);
    expect(prefs.marketing).toBe(false);
    expect(prefs.socialMedia).toBe(false);
  });

  it("balanced allows essential + functional", () => {
    const prefs = PROFILE_PRESETS["balanced"];
    expect(prefs.essential).toBe(true);
    expect(prefs.functional).toBe(true);
    expect(prefs.analytics).toBe(false);
    expect(prefs.marketing).toBe(false);
    expect(prefs.socialMedia).toBe(false);
  });

  it("allow-analytics allows essential + functional + analytics", () => {
    const prefs = PROFILE_PRESETS["allow-analytics"];
    expect(prefs.essential).toBe(true);
    expect(prefs.functional).toBe(true);
    expect(prefs.analytics).toBe(true);
    expect(prefs.marketing).toBe(false);
    expect(prefs.socialMedia).toBe(false);
  });

  it("accept-all allows everything", () => {
    const prefs = PROFILE_PRESETS["accept-all"];
    expect(prefs.essential).toBe(true);
    expect(prefs.functional).toBe(true);
    expect(prefs.analytics).toBe(true);
    expect(prefs.marketing).toBe(true);
    expect(prefs.socialMedia).toBe(true);
  });

  it("all presets have essential=true", () => {
    for (const [, prefs] of Object.entries(PROFILE_PRESETS)) {
      expect(prefs.essential).toBe(true);
    }
  });

  it("presets are progressively more permissive", () => {
    const trueCount = (p: UserPreferences) =>
      [p.functional, p.analytics, p.marketing, p.socialMedia].filter(Boolean).length;

    expect(trueCount(PROFILE_PRESETS["privacy-max"])).toBe(0);
    expect(trueCount(PROFILE_PRESETS["balanced"])).toBe(1);
    expect(trueCount(PROFILE_PRESETS["allow-analytics"])).toBe(2);
    expect(trueCount(PROFILE_PRESETS["accept-all"])).toBe(4);
  });
});

describe("getPreferencesForProfile", () => {
  it("returns a copy, not the original object", () => {
    const prefs = getPreferencesForProfile("balanced");
    expect(prefs).toEqual(PROFILE_PRESETS["balanced"]);
    expect(prefs).not.toBe(PROFILE_PRESETS["balanced"]);
  });

  it("returns custom preferences when profile is custom", () => {
    const custom: UserPreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: false,
      socialMedia: true,
    };
    expect(getPreferencesForProfile("custom", custom)).toEqual(custom);
  });

  it("falls back to balanced when custom has no preferences", () => {
    const prefs = getPreferencesForProfile("custom");
    expect(prefs).toEqual(PROFILE_PRESETS["balanced"]);
  });
});

describe("Default settings", () => {
  it("autoConsent is enabled by default", () => {
    expect(DEFAULT_SETTINGS.autoConsent).toBe(true);
  });

  it("consentDelay is a positive number", () => {
    expect(DEFAULT_SETTINGS.consentDelay).toBeGreaterThan(0);
  });

  it("GPC is enabled by default", () => {
    expect(DEFAULT_SETTINGS.enableGpc).toBe(true);
  });

  it("all boolean settings have boolean values", () => {
    const boolKeys = [
      "autoConsent",
      "showNotifications",
      "logConsent",
      "enableHeuristics",
      "enableWellKnown",
      "enableGpc",
    ] as const;
    for (const key of boolKeys) {
      expect(typeof DEFAULT_SETTINGS[key]).toBe("boolean");
    }
  });

  it("default sync storage uses balanced profile", () => {
    expect(DEFAULT_SYNC_STORAGE.profile).toBe("balanced");
    expect(DEFAULT_SYNC_STORAGE.preferences).toEqual(DEFAULT_PREFERENCES);
  });

  it("default local storage starts with zero stats", () => {
    expect(DEFAULT_LOCAL_STORAGE.stats.popupsHandled).toBe(0);
    expect(DEFAULT_LOCAL_STORAGE.stats.popupsByMethod).toEqual({});
    expect(DEFAULT_LOCAL_STORAGE.stats.popupsByCmp).toEqual({});
  });

  it("onboarding is not completed by default", () => {
    expect(DEFAULT_SYNC_STORAGE.onboardingCompleted).toBe(false);
  });
});

describe("Category metadata", () => {
  it("has metadata for all category IDs", () => {
    for (const id of CATEGORY_IDS) {
      expect(CATEGORY_META[id]).toBeDefined();
      expect(CATEGORY_META[id].id).toBe(id);
    }
  });

  it("every category has a non-empty label", () => {
    for (const id of CATEGORY_IDS) {
      expect(CATEGORY_META[id].label.length).toBeGreaterThan(0);
    }
  });

  it("every category has a non-empty description", () => {
    for (const id of CATEGORY_IDS) {
      expect(CATEGORY_META[id].description.length).toBeGreaterThan(0);
    }
  });

  it("every category has at least one example", () => {
    for (const id of CATEGORY_IDS) {
      expect(CATEGORY_META[id].examples.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("every category has a valid privacy impact", () => {
    const validImpacts = ["low", "medium", "high"];
    for (const id of CATEGORY_IDS) {
      expect(validImpacts).toContain(CATEGORY_META[id].privacyImpact);
    }
  });

  it("contains exactly 5 categories", () => {
    expect(CATEGORY_IDS).toHaveLength(5);
    expect(Object.keys(CATEGORY_META)).toHaveLength(5);
  });

  it("essential has low privacy impact", () => {
    expect(CATEGORY_META.essential.privacyImpact).toBe("low");
  });

  it("marketing has high privacy impact", () => {
    expect(CATEGORY_META.marketing.privacyImpact).toBe("high");
  });

  it("category IDs match UserPreferences keys", () => {
    const prefsKeys = Object.keys(DEFAULT_PREFERENCES) as CategoryId[];
    for (const id of CATEGORY_IDS) {
      expect(prefsKeys).toContain(id);
    }
  });
});
