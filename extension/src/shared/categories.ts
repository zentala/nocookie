/**
 * Cookie category taxonomy.
 *
 * Defines the standardized cookie categories, their metadata,
 * and profile presets for quick preference selection.
 */

import type { UserPreferences } from "./types";

/** Identifier for each cookie category. */
export type CategoryId = "essential" | "functional" | "analytics" | "marketing" | "socialMedia";

/** All valid category IDs as a runtime array. */
export const CATEGORY_IDS: readonly CategoryId[] = [
  "essential",
  "functional",
  "analytics",
  "marketing",
  "socialMedia",
] as const;

/** Privacy impact level for a cookie category. */
export type PrivacyImpact = "low" | "medium" | "high";

/** Metadata describing a single cookie category. */
export interface CategoryMeta {
  id: CategoryId;
  label: string;
  description: string;
  examples: string[];
  privacyImpact: PrivacyImpact;
}

/** Metadata for all five cookie categories. */
export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  essential: {
    id: "essential",
    label: "Essential",
    description:
      "Strictly necessary cookies required for the website to function. Cannot be disabled.",
    examples: ["Session ID", "CSRF token", "Load balancer affinity"],
    privacyImpact: "low",
  },
  functional: {
    id: "functional",
    label: "Functional",
    description:
      "Cookies that enable enhanced functionality like language preferences and region selection.",
    examples: ["Language preference", "Theme setting", "Currency selection"],
    privacyImpact: "low",
  },
  analytics: {
    id: "analytics",
    label: "Analytics",
    description:
      "Cookies used to understand how visitors interact with the website via anonymous statistics.",
    examples: ["Google Analytics", "Matomo", "Hotjar session recording"],
    privacyImpact: "medium",
  },
  marketing: {
    id: "marketing",
    label: "Marketing",
    description: "Cookies used to track visitors across websites for advertising purposes.",
    examples: ["Google Ads remarketing", "Facebook Pixel", "Retargeting cookies"],
    privacyImpact: "high",
  },
  socialMedia: {
    id: "socialMedia",
    label: "Social Media",
    description:
      "Cookies set by social media services for sharing content and tracking across sites.",
    examples: ["Facebook Like button", "Twitter share widget", "LinkedIn Insight Tag"],
    privacyImpact: "high",
  },
} as const;

/** Named profile for quick preference selection. */
export type ProfileName = "privacy-max" | "balanced" | "allow-analytics" | "accept-all" | "custom";

/** Human-readable labels for each profile. */
export const PROFILE_LABELS: Record<ProfileName, string> = {
  "privacy-max": "Privacy Maximum",
  balanced: "Balanced",
  "allow-analytics": "Allow Analytics",
  "accept-all": "Accept All",
  custom: "Custom",
} as const;

/** Maps each profile to its corresponding user preferences. */
export const PROFILE_PRESETS: Record<Exclude<ProfileName, "custom">, UserPreferences> = {
  "privacy-max": {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    socialMedia: false,
  },
  balanced: {
    essential: true,
    functional: true,
    analytics: false,
    marketing: false,
    socialMedia: false,
  },
  "allow-analytics": {
    essential: true,
    functional: true,
    analytics: true,
    marketing: false,
    socialMedia: false,
  },
  "accept-all": {
    essential: true,
    functional: true,
    analytics: true,
    marketing: true,
    socialMedia: true,
  },
} as const;

/**
 * Returns the UserPreferences for a given profile name.
 * For 'custom', returns the provided custom preferences or the balanced default.
 */
export function getPreferencesForProfile(
  profile: ProfileName,
  customPreferences?: UserPreferences,
): UserPreferences {
  if (profile === "custom") {
    return customPreferences ?? { ...PROFILE_PRESETS["balanced"] };
  }
  return { ...PROFILE_PRESETS[profile] };
}
