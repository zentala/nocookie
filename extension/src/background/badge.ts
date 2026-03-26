/**
 * Badge rendering logic for the NoCookie extension icon.
 *
 * Maps badge states to colors and text, then applies them
 * to the extension action icon for a specific tab.
 */

import type { BadgeState } from "@/shared/messages";

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
 * Apply badge text and color to the extension icon for a tab.
 * Uses chrome.action API (Manifest V3).
 */
export async function updateBadge(tabId: number, state: BadgeState): Promise<void> {
  await Promise.all([
    chrome.action.setBadgeText({ tabId, text: BADGE_TEXT[state] }),
    chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLORS[state] }),
  ]);
}
