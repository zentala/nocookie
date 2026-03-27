/**
 * @module ui/icons
 * SVG icon renderers for cookie categories, privacy level badges, and compliance badges.
 */

import type { CategoryId } from "@/shared/types";
import { CATEGORY_META } from "@/shared/constants";

/** Available icon size tokens. */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

/** Pixel values for each icon size token. */
const SIZE_MAP: Record<IconSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
};

/** Privacy strictness levels derived from active cookie categories. */
export type PrivacyLevel = "maximum" | "friendly" | "balanced" | "full-tracking";

/** Compliance badge identifiers. */
export type ComplianceBadgeType = "gdpr" | "gpc" | "standard" | "extension-ready";

/** SVG path data for each category icon (drawn inside a 24x24 viewBox). */
const CATEGORY_PATHS: Record<string, string> = {
  lock: "M9 11V9a3 3 0 0 1 6 0v2h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1z",
  gear: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1-4h2l.4 1.6c.3.1.6.3.9.5l1.5-.6 1 1.7-1.1 1c.1.3.1.7 0 1l1.1 1.1-1 1.7-1.5-.6c-.3.2-.6.4-.9.5L13 18h-2l-.4-1.6c-.3-.1-.6-.3-.9-.5l-1.5.6-1-1.7 1.1-1c-.1-.3-.1-.7 0-1L7.2 7.8l1-1.7 1.5.6c.3-.2.6-.4.9-.5L11 6z",
  chart: "M7 17V11h2v6H7zm4 0V7h2v10h-2zm4 0v-4h2v4h-2z",
  megaphone: "M6 10v4h2l4 4V6L8 10H6zm10.5 2A4.5 4.5 0 0 0 14 8.5v7a4.47 4.47 0 0 0 2.5-3.5z",
  share:
    "M16 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM8 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1.5-2.6-5-2.8m0 4.8 5-2.8",
};

/** Aria label for each category icon. */
const CATEGORY_LABELS: Record<CategoryId, string> = {
  essential: "Essential cookies",
  functional: "Functional cookies",
  analytics: "Analytics cookies",
  marketing: "Marketing cookies",
  "social-media": "Social media cookies",
};

/** Privacy level metadata for badge rendering. */
const PRIVACY_LEVELS: Record<
  PrivacyLevel,
  { color: string; label: string; text: string; path: string }
> = {
  maximum: {
    color: "#15803d",
    label: "Privacy Maximum",
    text: "Essential only",
    path: "M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4zm-1 14l-3-3 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z",
  },
  friendly: {
    color: "#2563eb",
    label: "Privacy Friendly",
    text: "Essential + Functional",
    path: "M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4zm0 4a4 4 0 0 1 0 8v-2a2 2 0 0 0 0-4V6z",
  },
  balanced: {
    color: "#d97706",
    label: "Balanced",
    text: "Includes Analytics",
    path: "M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4zm-3 12l3-6 3 6H9z",
  },
  "full-tracking": {
    color: "#ea580c",
    label: "Full Tracking",
    text: "All categories",
    path: "M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4zm0 5a5 5 0 0 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 0 0 0 6 3 3 0 0 0 0-6zm0 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z",
  },
};

/** Compliance badge metadata. */
const COMPLIANCE_BADGES: Record<
  ComplianceBadgeType,
  { color: string; label: string; text: string; icon: string }
> = {
  gdpr: {
    color: "#2563eb",
    label: "GDPR Compliant",
    text: "GDPR",
    icon: '<path d="M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z" fill="currentColor"/>',
  },
  gpc: {
    color: "#15803d",
    label: "GPC Respected",
    text: "GPC",
    icon: '<path d="M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4zm-1 14l-3-3 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z" fill="currentColor"/>',
  },
  standard: {
    color: "#7c3aed",
    label: "Standard Compliant",
    text: "v1",
    icon: '<path d="M9 12l2 2 4-4M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill="none" stroke="currentColor" stroke-width="2"/>',
  },
  "extension-ready": {
    color: "#ea580c",
    label: "Extension Ready",
    text: "\u26A1",
    icon: '<path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor"/>',
  },
};

/**
 * Render a category icon as an inline SVG string.
 *
 * @param categoryId - Which cookie category to render
 * @param size - Icon size token (defaults to "md")
 * @returns Complete SVG element as a string
 */
export function renderCategoryIcon(categoryId: CategoryId, size: IconSize = "md"): string {
  const meta = CATEGORY_META[categoryId];
  const px = SIZE_MAP[size];
  const pathData = CATEGORY_PATHS[meta.icon];
  const label = CATEGORY_LABELS[categoryId];

  return (
    `<svg class="ca-icon" viewBox="0 0 24 24" width="${px}" height="${px}" role="img" aria-label="${label}">` +
    `<circle cx="12" cy="12" r="12" fill="${meta.color}"/>` +
    `<path d="${pathData}" fill="white" stroke="white" stroke-width="0.3"/>` +
    `</svg>`
  );
}

/**
 * Render a privacy level badge as an HTML string (pill shape with icon + text).
 *
 * @param level - Privacy level to render
 * @param size - Icon size token inside the badge (defaults to "sm")
 * @returns HTML string for the badge
 */
export function renderPrivacyBadge(level: PrivacyLevel, size: IconSize = "sm"): string {
  const meta = PRIVACY_LEVELS[level];
  const px = SIZE_MAP[size];

  const svg =
    `<svg viewBox="0 0 24 24" width="${px}" height="${px}" fill="none">` +
    `<path d="${meta.path}" fill="${meta.color}"/>` +
    `</svg>`;

  return (
    `<span class="ca-badge ca-badge--privacy ca-badge--privacy-${level}" ` +
    `role="img" aria-label="${meta.label}: ${meta.text}" ` +
    `style="--ca-badge-color: ${meta.color}">` +
    svg +
    `<span>${meta.text}</span>` +
    `</span>`
  );
}

/**
 * Render a compliance badge as an HTML string (pill shape with icon + text).
 *
 * @param type - Compliance badge type
 * @returns HTML string for the badge
 */
export function renderComplianceBadge(type: ComplianceBadgeType): string {
  const meta = COMPLIANCE_BADGES[type];

  const svg = `<svg viewBox="0 0 24 24" width="14" height="14">${meta.icon}</svg>`;

  return (
    `<span class="ca-badge ca-badge--compliance ca-badge--${type}" ` +
    `role="img" aria-label="${meta.label}" ` +
    `style="--ca-badge-color: ${meta.color}; color: ${meta.color}">` +
    svg +
    `<span>${meta.text}</span>` +
    `</span>`
  );
}

/**
 * Determine the privacy level from the set of active (consented) categories.
 *
 * @param categories - Array of active category IDs
 * @returns The computed privacy level
 */
export function getPrivacyLevel(categories: CategoryId[]): PrivacyLevel {
  const set = new Set(categories);
  const hasMarketing = set.has("marketing");
  const hasSocial = set.has("social-media");
  const hasAnalytics = set.has("analytics");
  const hasFunctional = set.has("functional");

  if (hasMarketing || hasSocial) return "full-tracking";
  if (hasAnalytics) return "balanced";
  if (hasFunctional) return "friendly";
  return "maximum";
}

/**
 * Generate an SVG sprite sheet containing all category icons as symbols.
 * Can be injected once and referenced via `<use href="#ca-icon-{id}"/>`.
 *
 * @returns Complete SVG sprite sheet as a string
 */
export function generateSpriteSheet(): string {
  const symbols: string[] = [];

  for (const [id, meta] of Object.entries(CATEGORY_META)) {
    const pathData = CATEGORY_PATHS[meta.icon];
    const label = CATEGORY_LABELS[id as CategoryId];
    symbols.push(
      `<symbol id="ca-icon-${id}" viewBox="0 0 24 24" role="img" aria-label="${label}">` +
        `<circle cx="12" cy="12" r="12" fill="${meta.color}"/>` +
        `<path d="${pathData}" fill="white" stroke="white" stroke-width="0.3"/>` +
        `</symbol>`,
    );
  }

  for (const [id, meta] of Object.entries(PRIVACY_LEVELS)) {
    symbols.push(
      `<symbol id="ca-privacy-${id}" viewBox="0 0 24 24">` +
        `<path d="${meta.path}" fill="${meta.color}"/>` +
        `</symbol>`,
    );
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">` +
    symbols.join("") +
    `</svg>`
  );
}
