/**
 * @module shared/icon-data
 * Shared SVG path data and metadata for icons, badges, and the badge kit generator.
 * Pure data — no DOM or rendering logic.
 *
 * Single source of truth: icon-data.json. This module re-exports typed versions.
 * The badge kit script (generate-badge-kit.mjs) also reads from icon-data.json.
 */

import type { CategoryId } from "@/shared/types";
import jsonData from "@/shared/icon-data.json";

/** SVG path data for each category icon (24x24 viewBox). */
export const CATEGORY_PATHS: Record<string, string> = jsonData.categoryPaths;

/** Aria labels for category icons. */
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  essential: "Essential cookies",
  functional: "Functional cookies",
  analytics: "Analytics cookies",
  marketing: "Marketing cookies",
  "social-media": "Social media cookies",
};

/** Privacy level badge metadata. */
export interface PrivacyLevelData {
  color: string;
  label: string;
  text: string;
  path: string;
}

/** Privacy level metadata for badge rendering, keyed by level ID. */
export const PRIVACY_LEVELS: Record<string, PrivacyLevelData> = Object.fromEntries(
  jsonData.privacyLevels.map((l) => [
    l.id,
    { color: l.color, label: l.label, text: l.text, path: l.path },
  ]),
);

/** Compliance badge metadata. */
export interface ComplianceBadgeData {
  color: string;
  label: string;
  text: string;
  icon: string;
}

/** Compliance badge metadata for rendering, keyed by badge ID. */
export const COMPLIANCE_BADGES: Record<string, ComplianceBadgeData> = Object.fromEntries(
  jsonData.complianceBadges.map((b) => [
    b.id,
    { color: b.color, label: b.label, text: b.text, icon: b.icon },
  ]),
);
