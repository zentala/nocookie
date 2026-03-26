/**
 * Message handler implementations for the background service worker.
 *
 * Each handler processes a specific message type from content scripts
 * or extension pages and returns the appropriate response.
 */

import type { MessagePayloadMap, BadgeState } from "@/shared/messages";
import type { ConsentResult, UserPreferences } from "@/shared/types";
import type { ProfileName } from "@/shared/categories";
import {
  getPreferences,
  getProfile,
  getDomainOverride,
  setConsentLog,
  incrementStat,
  getSettings,
} from "@/shared/storage-api";
import { updateBadge } from "./badge";
import { getTabState, updateTabState } from "./tab-state";

/** Response for GET_PREFERENCES message. */
export interface PreferencesResponse {
  preferences: UserPreferences;
  profile: ProfileName;
  isOverride: boolean;
}

/** Response for GET_TAB_STATE message. */
export interface TabStateResponse {
  state: BadgeState;
  cmp?: string;
  domain?: string;
  result?: ConsentResult;
}

/** Handle CMP_DETECTED: store detection, look up preferences, update badge. */
export async function handleCmpDetected(
  payload: MessagePayloadMap["CMP_DETECTED"],
  tabId: number,
): Promise<PreferencesResponse> {
  updateTabState(tabId, {
    state: "attention",
    cmp: payload.cmp,
    domain: payload.domain,
  });

  await updateBadge(tabId, "attention");

  const override = await getDomainOverride(payload.domain);
  if (override?.preferences) {
    const profile = await getProfile();
    return { preferences: override.preferences, profile, isOverride: true };
  }

  const [preferences, profile] = await Promise.all([getPreferences(), getProfile()]);
  return { preferences, profile, isOverride: false };
}

/** Handle GET_PREFERENCES: return preferences for a domain. */
export async function handleGetPreferences(
  payload: MessagePayloadMap["GET_PREFERENCES"],
): Promise<PreferencesResponse> {
  const override = await getDomainOverride(payload.domain);
  if (override?.preferences) {
    const profile = await getProfile();
    return { preferences: override.preferences, profile, isOverride: true };
  }

  const [preferences, profile] = await Promise.all([getPreferences(), getProfile()]);
  return { preferences, profile, isOverride: false };
}

/** Handle CONSENT_EXECUTED: save log entry, update badge, increment stats. */
export async function handleConsentExecuted(
  payload: MessagePayloadMap["CONSENT_EXECUTED"],
  tabId: number,
): Promise<{ saved: boolean }> {
  const settings = await getSettings();
  const badgeState: BadgeState = payload.success ? "handled" : "error";

  updateTabState(tabId, {
    state: badgeState,
    result: payload,
    domain: payload.domain,
    cmp: payload.cmp ?? undefined,
  });

  await updateBadge(tabId, badgeState);

  if (settings.logConsent) {
    await setConsentLog(payload.domain, payload);
  }

  await incrementStat("popupsHandled", payload.method, payload.cmp ?? undefined);

  return { saved: settings.logConsent };
}

/** Handle UPDATE_BADGE: set badge state for a tab. */
export async function handleUpdateBadge(
  payload: MessagePayloadMap["UPDATE_BADGE"],
  tabId: number,
): Promise<void> {
  updateTabState(tabId, { state: payload.state });
  await updateBadge(tabId, payload.state);
}

/** Handle SCAN_STARTED: mark tab as scanning. */
export async function handleScanStarted(tabId: number): Promise<void> {
  updateTabState(tabId, { state: "scanning" });
  await updateBadge(tabId, "scanning");
}

/** Handle SCAN_COMPLETE: update tab state based on scan result. */
export async function handleScanComplete(
  payload: MessagePayloadMap["SCAN_COMPLETE"],
): Promise<void> {
  const tabId = payload.tabId;
  if (!payload.cmpFound) {
    updateTabState(tabId, { state: "default" });
    await updateBadge(tabId, "default");
  }
  // If CMP was found, CMP_DETECTED will handle the state update
}

/** Handle EXECUTE_CONSENT: placeholder for future script injection. */
export async function handleExecuteConsent(
  payload: MessagePayloadMap["EXECUTE_CONSENT"],
  tabId: number,
): Promise<{ injected: boolean }> {
  // TODO: Inject executor script via chrome.scripting.executeScript
  // The structure will be:
  // await chrome.scripting.executeScript({
  //   target: { tabId },
  //   world: 'MAIN',
  //   func: executorFunction,
  //   args: [payload.rule, payload.preferences],
  // });
  // eslint-disable-next-line no-console
  console.log(`[NoCookie] EXECUTE_CONSENT placeholder: tab=${tabId}, cmp=${payload.cmp}`);
  return { injected: false };
}

/** Handle GET_TAB_STATE: return current state for a tab. */
export function handleGetTabState(payload: MessagePayloadMap["GET_TAB_STATE"]): TabStateResponse {
  return getTabState(payload.tabId);
}
