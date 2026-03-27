/**
 * @module shared/i18n
 * Internationalization utilities: language detection, translation loading, and merging.
 */

import type { TranslationStrings } from "./types";
import { translations } from "./translations";

/** Category name and description pair for a single category. */
export interface CategoryTranslation {
  name: string;
  description: string;
}

/** Legal text strings for cookie policy pages. */
export interface LegalTranslation {
  whatAreCookies: string;
  whatAreCookiesText: string;
  yourRights: string;
  yourRightsText: string;
  gdprReference: string;
  eprivacyReference: string;
  gpcReference: string;
  lastUpdated: string;
  contact: string;
  changePreferences: string;
}

/** Complete translation set including UI strings, categories, and legal text. */
export interface FullTranslations extends TranslationStrings {
  cookiePolicy: string;
  poweredBy: string;
  alwaysActive: string;
  learnMore: string;
  categories: Record<string, CategoryTranslation>;
  legal: LegalTranslation;
}

/** All supported language codes. */
export const SUPPORTED_LANGUAGES: string[] = [
  "en",
  "de",
  "fr",
  "es",
  "pl",
  "nl",
  "it",
  "pt",
  "sv",
  "da",
  "no",
  "fi",
  "cs",
  "ro",
  "hu",
  "el",
];

/**
 * Normalize a language code to a base two-letter code.
 * For example, "en-US" becomes "en", "pt-BR" becomes "pt".
 */
export function normalizeLanguageCode(code: string): string {
  return code.split("-")[0].toLowerCase();
}

/**
 * Detect the user's language from the document or navigator.
 * Returns a normalized two-letter language code.
 */
export function detectLanguage(): string {
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement?.lang;
    if (htmlLang) return normalizeLanguageCode(htmlLang);
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    return normalizeLanguageCode(navigator.language);
  }

  return "en";
}

/**
 * Get the full translations for a language code.
 * Falls back to English if the language is not supported.
 */
export function getTranslations(lang: string): FullTranslations {
  const normalized = normalizeLanguageCode(lang);
  return translations[normalized] ?? translations["en"];
}

/**
 * Merge custom translation overrides on top of a base translation set.
 * Only provided keys are overwritten; categories and legal remain unchanged
 * unless explicitly provided in overrides.
 */
export function mergeTranslations(
  base: FullTranslations,
  overrides: Partial<TranslationStrings>,
): FullTranslations {
  return { ...base, ...overrides };
}
