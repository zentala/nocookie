/**
 * @module ui/icons
 * SVG icon renderers for cookie categories, privacy level badges, and compliance badges.
 */

import type { CategoryId } from "@/shared/types";
import { CATEGORY_META } from "@/shared/constants";
import {
  CATEGORY_PATHS,
  CATEGORY_LABELS,
  PRIVACY_LEVELS,
  COMPLIANCE_BADGES,
} from "@/shared/icon-data";

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
