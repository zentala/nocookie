import { describe, it, expect } from "vitest";
import {
  getLocalizedDescriptions,
  getLocalizedCategoryDescription,
  getLocalizedCookiePurpose,
} from "../src/shared/descriptions-i18n";
import { getCategoryDescription, getCommonCookieInfo } from "../src/shared/descriptions";
import type { DescriptionPreset } from "../src/shared/descriptions";
import { CATEGORY_IDS } from "../src/shared/constants";

const TRANSLATED_LANGUAGES = ["de", "fr", "es", "pl"];
const PRESETS: DescriptionPreset[] = ["default", "alt1", "alt2"];
const TRANSLATED_COOKIES = [
  "_ga",
  "_gid",
  "_fbp",
  "fr",
  "_gcl_au",
  "IDE",
  "__hssc",
  "__hstc",
  "_hjSessionUser",
  "__stripe_mid",
];

describe("getLocalizedDescriptions", () => {
  it.each(TRANSLATED_LANGUAGES)("returns descriptions for %s", (lang) => {
    const desc = getLocalizedDescriptions(lang);
    expect(desc).toBeDefined();
    expect(desc.categories).toBeDefined();
    expect(desc.cookies).toBeDefined();
  });

  it.each(TRANSLATED_LANGUAGES)("%s has all 5 categories x 3 presets", (lang) => {
    const desc = getLocalizedDescriptions(lang);
    for (const id of CATEGORY_IDS) {
      for (const preset of PRESETS) {
        const cat = desc.categories[id][preset];
        expect(cat, `${lang}.${id}.${preset}`).toBeDefined();
        expect(cat.short, `${lang}.${id}.${preset}.short`).toBeTruthy();
        expect(cat.long, `${lang}.${id}.${preset}.long`).toBeTruthy();
        expect(cat.long.length).toBeGreaterThan(cat.short.length);
      }
    }
  });

  it.each(TRANSLATED_LANGUAGES)("%s has all 10 cookie purposes", (lang) => {
    const desc = getLocalizedDescriptions(lang);
    for (const name of TRANSLATED_COOKIES) {
      expect(desc.cookies[name], `${lang}.cookies.${name}`).toBeDefined();
      expect(desc.cookies[name].purpose, `${lang}.cookies.${name}.purpose`).toBeTruthy();
    }
  });

  it("falls back to English for unsupported language", () => {
    const desc = getLocalizedDescriptions("ja");
    const enDefault = getCategoryDescription("essential", "default");
    expect(desc.categories.essential.default).toEqual(enDefault);
  });

  it("falls back to English for empty string", () => {
    const desc = getLocalizedDescriptions("");
    expect(desc.categories.analytics.default.short).toBe(
      getCategoryDescription("analytics", "default").short,
    );
  });

  it("handles regional language codes via normalization", () => {
    const desc = getLocalizedDescriptions("de-AT");
    const deDesc = getLocalizedDescriptions("de");
    expect(desc).toEqual(deDesc);
  });

  it("translations differ from English originals", () => {
    for (const lang of TRANSLATED_LANGUAGES) {
      const desc = getLocalizedDescriptions(lang);
      const enShort = getCategoryDescription("essential", "default").short;
      expect(desc.categories.essential.default.short).not.toBe(enShort);
    }
  });
});

describe("getLocalizedCategoryDescription", () => {
  it("returns translated description for known language", () => {
    const desc = getLocalizedCategoryDescription("analytics", "fr");
    expect(desc.short).toBeTruthy();
    expect(desc.long).toBeTruthy();
    expect(desc.short).not.toBe(getCategoryDescription("analytics", "default").short);
  });

  it("returns specified preset", () => {
    const alt1 = getLocalizedCategoryDescription("marketing", "de", "alt1");
    const alt2 = getLocalizedCategoryDescription("marketing", "de", "alt2");
    expect(alt1.short).not.toBe(alt2.short);
  });

  it("defaults to 'default' preset when not specified", () => {
    const desc = getLocalizedCategoryDescription("functional", "es");
    const explicit = getLocalizedCategoryDescription("functional", "es", "default");
    expect(desc).toEqual(explicit);
  });

  it("falls back to English for unsupported language", () => {
    const desc = getLocalizedCategoryDescription("essential", "zh");
    const en = getCategoryDescription("essential", "default");
    expect(desc).toEqual(en);
  });
});

describe("getLocalizedCookiePurpose", () => {
  it("returns translated purpose for known cookie and language", () => {
    const purpose = getLocalizedCookiePurpose("_ga", "pl");
    expect(purpose).toBeTruthy();
    expect(purpose).not.toBe(getCommonCookieInfo("_ga")!.purpose);
  });

  it("falls back to English purpose for unsupported language", () => {
    const purpose = getLocalizedCookiePurpose("_ga", "ja");
    expect(purpose).toBe(getCommonCookieInfo("_ga")!.purpose);
  });

  it("returns null for unknown cookie", () => {
    expect(getLocalizedCookiePurpose("unknown_cookie", "de")).toBeNull();
  });

  it("returns null for unknown cookie even in English fallback", () => {
    expect(getLocalizedCookiePurpose("unknown_cookie", "ja")).toBeNull();
  });

  it.each(TRANSLATED_LANGUAGES)("%s has purpose for all 10 common cookies", (lang) => {
    for (const name of TRANSLATED_COOKIES) {
      const purpose = getLocalizedCookiePurpose(name, lang);
      expect(purpose, `${lang}.${name}`).toBeTruthy();
    }
  });
});

describe("fallback chain integrity", () => {
  it("English fallback returns valid LocalizedDescriptions shape", () => {
    const desc = getLocalizedDescriptions("en");
    for (const id of CATEGORY_IDS) {
      for (const preset of PRESETS) {
        expect(desc.categories[id][preset].short).toBeTruthy();
        expect(desc.categories[id][preset].long).toBeTruthy();
      }
    }
  });

  it("all translated languages have unique content per category", () => {
    for (const lang of TRANSLATED_LANGUAGES) {
      const desc = getLocalizedDescriptions(lang);
      for (const id of CATEGORY_IDS) {
        const shorts = PRESETS.map((p) => desc.categories[id][p].short);
        expect(new Set(shorts).size, `${lang}.${id} should have 3 distinct shorts`).toBe(3);
      }
    }
  });
});
