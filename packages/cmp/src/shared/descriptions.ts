/**
 * @module shared/descriptions
 * Standardized cookie practice descriptions: category taxonomy and common cookie database.
 */

import type { CategoryId, CategoryConfig } from "./types";
import { CATEGORY_DESCRIPTIONS, COMMON_COOKIES } from "./descriptions-data";

/** Short and long description pair for display contexts. */
export interface CategoryDescription {
  /** One-liner for banner display. */
  short: string;
  /** Full description for preference center and policy page. */
  long: string;
}

/** Preset variant identifier. */
export type DescriptionPreset = "default" | "alt1" | "alt2";

/** Information about a well-known third-party cookie. */
export interface CommonCookieInfo {
  category: CategoryId;
  provider: string;
  duration: string;
  purpose: string;
}

/**
 * Retrieve the category description for a given preset.
 * Falls back to 'default' if the preset is not recognized.
 */
export function getCategoryDescription(
  categoryId: CategoryId,
  preset: DescriptionPreset = "default",
): CategoryDescription {
  const presets = CATEGORY_DESCRIPTIONS[categoryId];
  return presets[preset] ?? presets.default;
}

/**
 * Look up metadata for a well-known cookie by name.
 * Returns null if the cookie is not in the database.
 */
export function getCommonCookieInfo(cookieName: string): CommonCookieInfo | null {
  return COMMON_COOKIES[cookieName] ?? null;
}

/**
 * Resolve the description for a category config using the priority chain:
 * 1. Custom description on the CategoryConfig (used as both short and long)
 * 2. Specified preset
 * 3. Default preset
 */
export function resolveDescription(
  category: CategoryConfig,
  preset?: DescriptionPreset,
): CategoryDescription {
  if (category.description) {
    return { short: category.description, long: category.description };
  }
  return getCategoryDescription(category.id, preset);
}
