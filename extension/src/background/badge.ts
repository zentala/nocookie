/**
 * Badge rendering logic for the NoCookie extension icon.
 *
 * Maps badge states to colors, text, and icon paths, then applies them
 * to the extension action icon for a specific tab. Supports per-tab
 * icon variants and full state reset.
 */

import type { BadgeState } from "@/shared/messages";

/** Icon sizes used in Manifest V3 action icons. */
const ICON_SIZES = [16, 32, 48, 128] as const;
type IconSize = (typeof ICON_SIZES)[number];

/** Background colors for each badge state. */
export const BADGE_COLORS: Record<BadgeState, string> = {
  default: "#9CA3AF",
  handled: "#22C55E",
  attention: "#F59E0B",
  error: "#EF4444",
  disabled: "#6B7280",
  scanning: "#3B82F6",
};

/** Short text overlay for each badge state. */
export const BADGE_TEXT: Record<BadgeState, string> = {
  default: "",
  handled: "\u2713",
  attention: "!",
  error: "\u2717",
  disabled: "",
  scanning: "...",
};

/**
 * Build the icon path record for a given badge state.
 * Maps each icon size to its asset path (e.g. "assets/icons/handled-16.png").
 * Falls back to "default" icons for states without dedicated assets.
 */
export function getIconPaths(state: BadgeState): Record<IconSize, string> {
  const prefix = hasIconAsset(state) ? state : "default";
  return Object.fromEntries(
    ICON_SIZES.map((size) => [size, `assets/icons/${prefix}-${size}.png`]),
  ) as Record<IconSize, string>;
}

/**
 * Check whether dedicated icon assets exist for a state.
 * Currently only "default" has real PNGs; other states reuse it
 * and rely on badge text/color to differentiate.
 */
function hasIconAsset(state: BadgeState): boolean {
  const statesWithAssets: BadgeState[] = ["default"];
  return statesWithAssets.includes(state);
}

/**
 * Apply badge text and color to the extension icon for a tab.
 * Uses chrome.action API (Manifest V3).
 */
export async function updateBadge(tabId: number, state: BadgeState): Promise<void> {
  await Promise.all([
    chrome.action.setBadgeText({ tabId, text: BADGE_TEXT[state] }),
    chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLORS[state] }),
  ]);
}

/**
 * Set the full badge state for a tab: icon variant + text + color.
 * This is the primary entry point for changing a tab's visual state.
 */
export async function setBadgeState(tabId: number, state: BadgeState): Promise<void> {
  const iconPaths = getIconPaths(state);
  await Promise.all([
    chrome.action.setIcon({ tabId, path: iconPaths }),
    chrome.action.setBadgeText({ tabId, text: BADGE_TEXT[state] }),
    chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLORS[state] }),
  ]);
}

/**
 * Clear badge for a tab — reset icon, text, and color to default state.
 */
export async function clearBadge(tabId: number): Promise<void> {
  await setBadgeState(tabId, "default");
}
