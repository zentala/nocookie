// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import {
  getTranslations,
  detectLanguage,
  mergeTranslations,
  normalizeLanguageCode,
  SUPPORTED_LANGUAGES,
} from "../src/shared/i18n";
import type { FullTranslations } from "../src/shared/i18n";
import { translations } from "../src/shared/translations";

describe("SUPPORTED_LANGUAGES", () => {
  it("contains exactly 16 languages", () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(16);
  });

  it("includes en as the first language", () => {
    expect(SUPPORTED_LANGUAGES[0]).toBe("en");
  });

  it("matches the keys in translations record", () => {
    const translationKeys = Object.keys(translations).sort();
    const supported = [...SUPPORTED_LANGUAGES].sort();
    expect(translationKeys).toEqual(supported);
  });
});

describe("normalizeLanguageCode", () => {
  it("returns base code from regional variant", () => {
    expect(normalizeLanguageCode("en-US")).toBe("en");
    expect(normalizeLanguageCode("pt-BR")).toBe("pt");
    expect(normalizeLanguageCode("de-AT")).toBe("de");
  });

  it("lowercases the code", () => {
    expect(normalizeLanguageCode("EN")).toBe("en");
    expect(normalizeLanguageCode("Fr-FR")).toBe("fr");
  });

  it("returns simple codes unchanged", () => {
    expect(normalizeLanguageCode("pl")).toBe("pl");
  });
});

describe("getTranslations", () => {
  it("returns English translations for 'en'", () => {
    const t = getTranslations("en");
    expect(t.bannerTitle).toBe("Cookie Consent");
    expect(t.acceptAll).toBe("Accept All");
  });

  it("returns German translations for 'de'", () => {
    const t = getTranslations("de");
    expect(t.bannerTitle).toBe("Cookie-Einstellungen");
    expect(t.acceptAll).toBe("Alle akzeptieren");
  });

  it("falls back to English for unsupported language", () => {
    const t = getTranslations("zh");
    expect(t.bannerTitle).toBe("Cookie Consent");
  });

  it("handles regional variants by normalizing", () => {
    const t = getTranslations("fr-CA");
    expect(t.bannerTitle).toBe("Consentement aux cookies");
  });

  it("falls back to English for empty string", () => {
    const t = getTranslations("");
    expect(t.bannerTitle).toBe("Cookie Consent");
  });
});

describe("detectLanguage", () => {
  const originalLang = document.documentElement.lang;
  const originalNavigator = navigator.language;

  afterEach(() => {
    document.documentElement.lang = originalLang;
    Object.defineProperty(navigator, "language", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("detects language from html lang attribute", () => {
    document.documentElement.lang = "de";
    expect(detectLanguage()).toBe("de");
  });

  it("normalizes html lang with regional code", () => {
    document.documentElement.lang = "pt-BR";
    expect(detectLanguage()).toBe("pt");
  });

  it("falls back to navigator.language when html lang is empty", () => {
    document.documentElement.lang = "";
    Object.defineProperty(navigator, "language", {
      value: "fr-FR",
      writable: true,
      configurable: true,
    });
    expect(detectLanguage()).toBe("fr");
  });

  it("returns en as ultimate fallback", () => {
    document.documentElement.lang = "";
    Object.defineProperty(navigator, "language", {
      value: "",
      writable: true,
      configurable: true,
    });
    expect(detectLanguage()).toBe("en");
  });
});

describe("mergeTranslations", () => {
  it("overrides specific UI strings", () => {
    const base = getTranslations("en");
    const merged = mergeTranslations(base, {
      bannerTitle: "Custom Title",
    });
    expect(merged.bannerTitle).toBe("Custom Title");
    expect(merged.acceptAll).toBe("Accept All");
  });

  it("preserves categories and legal when only UI strings overridden", () => {
    const base = getTranslations("de");
    const merged = mergeTranslations(base, { acceptAll: "OK" });
    expect(merged.categories).toEqual(base.categories);
    expect(merged.legal).toEqual(base.legal);
    expect(merged.acceptAll).toBe("OK");
  });

  it("returns equivalent object when overrides are empty", () => {
    const base = getTranslations("en");
    const merged = mergeTranslations(base, {});
    expect(merged).toEqual(base);
  });
});

describe("all 16 languages have complete translations", () => {
  const requiredUIKeys: (keyof FullTranslations)[] = [
    "bannerTitle",
    "bannerDescription",
    "acceptAll",
    "rejectAll",
    "customize",
    "savePreferences",
    "closeAriaLabel",
    "categoryRequired",
    "cookiePolicy",
    "poweredBy",
    "alwaysActive",
    "learnMore",
  ];

  const requiredCategories = ["essential", "functional", "analytics", "marketing", "social-media"];

  const requiredLegalKeys = [
    "whatAreCookies",
    "whatAreCookiesText",
    "yourRights",
    "yourRightsText",
    "gdprReference",
    "eprivacyReference",
    "gpcReference",
    "lastUpdated",
    "contact",
    "changePreferences",
  ];

  it.each(SUPPORTED_LANGUAGES)("%s has all required UI strings", (lang) => {
    const t = getTranslations(lang);
    for (const key of requiredUIKeys) {
      expect(t[key], `${lang}.${key}`).toBeTruthy();
    }
  });

  it.each(SUPPORTED_LANGUAGES)("%s has all required category translations", (lang) => {
    const t = getTranslations(lang);
    for (const cat of requiredCategories) {
      expect(t.categories[cat], `${lang}.categories.${cat}`).toBeDefined();
      expect(t.categories[cat].name, `${lang}.categories.${cat}.name`).toBeTruthy();
      expect(t.categories[cat].description, `${lang}.categories.${cat}.description`).toBeTruthy();
    }
  });

  it.each(SUPPORTED_LANGUAGES)("%s has all required legal text", (lang) => {
    const t = getTranslations(lang);
    for (const key of requiredLegalKeys) {
      const value = t.legal[key as keyof typeof t.legal];
      expect(value, `${lang}.legal.${key}`).toBeTruthy();
    }
  });

  it("all translations have non-empty string values", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const t = getTranslations(lang);
      for (const key of requiredUIKeys) {
        const val = t[key];
        if (typeof val === "string") {
          expect(val.length, `${lang}.${key} should not be empty`).toBeGreaterThan(0);
        }
      }
    }
  });
});
