/**
 * @module shared/descriptions-i18n
 * Localized cookie practice descriptions with fallback chain:
 * config language > detected language > English.
 */

import type { CategoryId } from "./types";
import type { CategoryDescription, DescriptionPreset } from "./descriptions";
import { getCategoryDescription, getCommonCookieInfo } from "./descriptions";
import { normalizeLanguageCode } from "./i18n";
import { descriptionsDE } from "./descriptions-de";
import { descriptionsFR } from "./descriptions-fr";
import { descriptionsES } from "./descriptions-es";
import { descriptionsPL } from "./descriptions-pl";

/** Localized descriptions for all categories and common cookies. */
export interface LocalizedDescriptions {
  categories: Record<CategoryId, Record<DescriptionPreset, CategoryDescription>>;
  cookies: Record<string, { purpose: string }>;
}

/** Languages with description translations available. */
const DESCRIPTION_LANGUAGES: Record<string, LocalizedDescriptions> = {
  de: descriptionsDE,
  fr: descriptionsFR,
  es: descriptionsES,
  pl: descriptionsPL,
};

/**
 * Get all descriptions in a specific language.
 * Falls back to English if the language has no translation.
 */
export function getLocalizedDescriptions(lang: string): LocalizedDescriptions {
  const normalized = normalizeLanguageCode(lang);
  return DESCRIPTION_LANGUAGES[normalized] ?? buildEnglishDescriptions();
}

/**
 * Get a localized category description for a specific preset.
 * Fallback chain: requested language > English defaults.
 */
export function getLocalizedCategoryDescription(
  categoryId: CategoryId,
  lang: string,
  preset: DescriptionPreset = "default",
): CategoryDescription {
  const normalized = normalizeLanguageCode(lang);
  const localized = DESCRIPTION_LANGUAGES[normalized];
  if (localized) {
    const presets = localized.categories[categoryId];
    return presets[preset] ?? presets.default;
  }
  return getCategoryDescription(categoryId, preset);
}

/**
 * Get a localized cookie purpose string.
 * Falls back to the English common cookie database.
 * Returns null if the cookie is unknown.
 */
export function getLocalizedCookiePurpose(cookieName: string, lang: string): string | null {
  const normalized = normalizeLanguageCode(lang);
  const localized = DESCRIPTION_LANGUAGES[normalized];
  if (localized) {
    const cookie = localized.cookies[cookieName];
    if (cookie) return cookie.purpose;
  }
  const info = getCommonCookieInfo(cookieName);
  return info?.purpose ?? null;
}

/** Build an English LocalizedDescriptions from the existing descriptions module. */
function buildEnglishDescriptions(): LocalizedDescriptions {
  const categoryIds: CategoryId[] = [
    "essential",
    "functional",
    "analytics",
    "marketing",
    "social-media",
  ];
  const presets: DescriptionPreset[] = ["default", "alt1", "alt2"];
  const categories = {} as Record<CategoryId, Record<DescriptionPreset, CategoryDescription>>;

  for (const id of categoryIds) {
    categories[id] = {} as Record<DescriptionPreset, CategoryDescription>;
    for (const preset of presets) {
      categories[id][preset] = getCategoryDescription(id, preset);
    }
  }

  const cookieNames = [
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
  const cookies: Record<string, { purpose: string }> = {};
  for (const name of cookieNames) {
    const info = getCommonCookieInfo(name);
    if (info) cookies[name] = { purpose: info.purpose };
  }

  return { categories, cookies };
}
