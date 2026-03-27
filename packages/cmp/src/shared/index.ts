/**
 * @module shared
 * Shared types, constants, and i18n utilities.
 */

export type {
  CategoryId,
  CookieDeclaration,
  CategoryConfig,
  ThemeConfig,
  BehaviorConfig,
  TranslationStrings,
  WellKnownConfig,
  PolicyPageConfig,
  IconConfig,
  CMPConfig,
  ResolvedCMPConfig,
  ConsentState,
  CMPEvent,
  CategoryMeta,
} from "./types";

export {
  CATEGORY_IDS,
  CATEGORY_META,
  DEFAULT_THEME,
  DEFAULT_BEHAVIOR,
  DEFAULT_TRANSLATIONS,
  DEFAULT_WELL_KNOWN,
  DEFAULT_POLICY_PAGE,
  DEFAULT_LANGUAGE,
  DEFAULT_CONSENT_STATE,
} from "./constants";

export type { CategoryDescription, DescriptionPreset, CommonCookieInfo } from "./descriptions";

export { getCategoryDescription, getCommonCookieInfo, resolveDescription } from "./descriptions";

export type { LocalizedDescriptions } from "./descriptions-i18n";

export {
  getLocalizedDescriptions,
  getLocalizedCategoryDescription,
  getLocalizedCookiePurpose,
} from "./descriptions-i18n";

export type { FullTranslations, CategoryTranslation, LegalTranslation } from "./i18n";

export {
  SUPPORTED_LANGUAGES,
  normalizeLanguageCode,
  detectLanguage,
  getTranslations,
  mergeTranslations,
} from "./i18n";

export type { PrivacyLevelData, ComplianceBadgeData } from "./icon-data";

export { CATEGORY_PATHS, CATEGORY_LABELS, PRIVACY_LEVELS, COMPLIANCE_BADGES } from "./icon-data";
