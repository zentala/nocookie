/**
 * Per-tab state management for the NoCookie extension.
 *
 * Tracks ephemeral state for each browser tab (scanning status,
 * detected CMP, consent result). State is lost when the service
 * worker is terminated — this is by design for MV3.
 */

import type { BadgeState } from "@/shared/messages";
import type { ConsentResult } from "@/shared/types";

/** Ephemeral state tracked for a single tab. */
export interface TabState {
  state: BadgeState;
  cmp?: string;
  domain?: string;
  result?: ConsentResult;
}

/** In-memory map of tab ID to state. Ephemeral — lost on SW termination. */
const tabStates = new Map<number, TabState>();

/** Get the state for a tab, defaulting to "default" badge state. */
export function getTabState(tabId: number): TabState {
  return tabStates.get(tabId) ?? { state: "default" };
}

/** Set the full state for a tab. */
export function setTabState(tabId: number, state: TabState): void {
  tabStates.set(tabId, state);
}

/** Update partial fields on an existing tab state. */
export function updateTabState(tabId: number, patch: Partial<TabState>): void {
  const current = getTabState(tabId);
  tabStates.set(tabId, { ...current, ...patch });
}

/** Remove state for a tab (e.g. when the tab is closed). */
export function clearTabState(tabId: number): void {
  tabStates.delete(tabId);
}

/** Clear all tab states. Useful for testing. */
export function clearAllTabStates(): void {
  tabStates.clear();
}
