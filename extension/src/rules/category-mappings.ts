/**
 * Per-category preference mappings for CMPs that support granular consent.
 *
 * Used to go beyond autoconsent's binary opt-in/opt-out model. Each mapping
 * defines how our standard categories translate to a specific CMP's internal
 * category identifiers and which API strategy to use.
 */

/** Strategy for applying per-category preferences to a CMP. */
export type ConsentStrategy = "api" | "toggles" | "cookies";

/** Maps our standard categories to a CMP's internal category identifiers. */
export interface CategoryMapping {
  cmpName: string;
  /** Maps our categories to the CMP's internal category IDs. */
  categories: {
    functional: string;
    analytics: string;
    marketing: string;
    socialMedia?: string;
  };
  /** Strategy for applying per-category preferences. */
  strategy: ConsentStrategy;
}

/**
 * OneTrust uses numbered category groups C0001-C0005.
 * C0001 = Strictly Necessary (always on), C0002 = Performance/Analytics,
 * C0003 = Functional, C0004 = Targeting/Marketing, C0005 = Social Media.
 */
export const ONETRUST_MAPPING: CategoryMapping = {
  cmpName: "onetrust",
  categories: {
    functional: "C0003",
    analytics: "C0002",
    marketing: "C0004",
    socialMedia: "C0005",
  },
  strategy: "api",
};

/**
 * Cookiebot uses named category strings.
 * Categories: necessary (always on), preferences, statistics, marketing.
 */
export const COOKIEBOT_MAPPING: CategoryMapping = {
  cmpName: "cookiebot",
  categories: {
    functional: "preferences",
    analytics: "statistics",
    marketing: "marketing",
  },
  strategy: "api",
};

/**
 * Didomi uses purpose-based consent via its SDK.
 * Purpose IDs: preferences, analytics, advertising, social_media.
 */
export const DIDOMI_MAPPING: CategoryMapping = {
  cmpName: "didomi",
  categories: {
    functional: "preferences",
    analytics: "analytics",
    marketing: "advertising",
    socialMedia: "social_media",
  },
  strategy: "api",
};

/** All supported per-category CMP mappings. */
export const ALL_MAPPINGS: ReadonlyArray<CategoryMapping> = [
  ONETRUST_MAPPING,
  COOKIEBOT_MAPPING,
  DIDOMI_MAPPING,
];

/**
 * Look up a category mapping by CMP name.
 *
 * @param cmpName - CMP identifier (e.g., "onetrust")
 * @returns The mapping if found, or undefined
 */
export function getMappingForCmp(cmpName: string): CategoryMapping | undefined {
  return ALL_MAPPINGS.find((m) => m.cmpName === cmpName);
}
