/**
 * @module core/config
 * Config parser that validates raw input, expands shorthand category
 * strings into full CategoryConfig objects, and merges defaults.
 */

import type { CategoryConfig, CategoryId, CMPConfig, ResolvedCMPConfig } from "@/shared/types";
import {
  CATEGORY_IDS,
  CATEGORY_META,
  DEFAULT_BEHAVIOR,
  DEFAULT_LANGUAGE,
  DEFAULT_POLICY_PAGE,
  DEFAULT_THEME,
  DEFAULT_TRANSLATIONS,
  DEFAULT_WELL_KNOWN,
} from "@/shared/constants";

/** Errors thrown during config validation. */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigValidationError";
  }
}

/**
 * Check whether a string is a valid CategoryId.
 *
 * @param value - The string to check
 * @returns True if value is a recognised category identifier
 */
export function isValidCategoryId(value: string): value is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

/**
 * Expand a shorthand category entry (string or partial object) into a
 * full CategoryConfig with defaults applied.
 *
 * @param entry - A category ID string or partial CategoryConfig
 * @returns A fully populated CategoryConfig
 * @throws ConfigValidationError if the category ID is unknown
 */
export function expandCategory(entry: string | CategoryConfig): CategoryConfig {
  const id = typeof entry === "string" ? entry : entry.id;

  if (!isValidCategoryId(id)) {
    throw new ConfigValidationError(
      `Unknown category id: "${id}". Valid ids: ${CATEGORY_IDS.join(", ")}`,
    );
  }

  const meta = CATEGORY_META[id];
  const base: CategoryConfig = {
    id,
    name: meta.name,
    description: meta.description,
    required: meta.required,
    defaultState: meta.defaultState,
    cookies: [],
  };

  if (typeof entry === "string") {
    return base;
  }

  return {
    ...base,
    ...entry,
    // Ensure id is never overridden by spread
    id,
    // Merge cookies: entry overrides base entirely when provided
    cookies: entry.cookies ?? base.cookies,
  };
}

/**
 * Validate and resolve raw CMP configuration into a fully populated
 * ResolvedCMPConfig with all defaults applied.
 *
 * Minimal valid config: `{ siteName: "My Site", categories: ["essential"] }`
 *
 * @param input - Raw configuration object from the site owner
 * @returns Fully resolved configuration
 * @throws ConfigValidationError on invalid input
 */
export function parseConfig(input: unknown): ResolvedCMPConfig {
  if (input === null || input === undefined || typeof input !== "object") {
    throw new ConfigValidationError("Config must be a non-null object");
  }

  const raw = input as Record<string, unknown>;

  if (typeof raw.siteName !== "string" || raw.siteName.trim() === "") {
    throw new ConfigValidationError('Config "siteName" is required and must be a non-empty string');
  }

  if (!Array.isArray(raw.categories) || raw.categories.length === 0) {
    throw new ConfigValidationError(
      'Config "categories" is required and must be a non-empty array',
    );
  }

  const config = raw as unknown as CMPConfig;
  const categories = config.categories.map(expandCategory);

  // Validate no duplicate category IDs
  const seen = new Set<string>();
  for (const cat of categories) {
    if (seen.has(cat.id)) {
      throw new ConfigValidationError(`Duplicate category id: "${cat.id}"`);
    }
    seen.add(cat.id);
  }

  return {
    siteName: config.siteName,
    privacyContact: config.privacyContact,
    dpo: config.dpo,
    policyUrl: config.policyUrl,
    siteUrl: config.siteUrl,
    imprintUrl: config.imprintUrl,
    categories,
    theme: { ...DEFAULT_THEME, ...config.theme },
    behavior: { ...DEFAULT_BEHAVIOR, ...config.behavior },
    language: config.language ?? DEFAULT_LANGUAGE,
    translations: { ...DEFAULT_TRANSLATIONS, ...config.translations },
    wellKnown: { ...DEFAULT_WELL_KNOWN, ...config.wellKnown },
    policyPage: { ...DEFAULT_POLICY_PAGE, ...config.policyPage },
    icons: config.icons ?? {},
  };
}
