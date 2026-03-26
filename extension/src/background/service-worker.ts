/**
 * Background service worker for the NoCookie extension.
 *
 * Handles extension lifecycle events, message passing between
 * content scripts and popup/options pages, and manages extension state.
 */

import type { Message, MessageType } from "@/shared/messages";
import { isOnboardingCompleted, migrateStorageIfNeeded } from "@/shared/storage-api";
import {
  handleCmpDetected,
  handleConsentExecuted,
  handleExecuteConsent,
  handleGetPreferences,
  handleGetTabState,
  handleScanComplete,
  handleScanStarted,
  handleUpdateBadge,
} from "./message-handlers";
import { clearTabState, updateTabState } from "./tab-state";

/**
 * Route an incoming message to the correct handler.
 * Returns the handler's response or an error object.
 */
async function routeMessage(message: Message, tabId: number): Promise<unknown> {
  const { type, payload } = message;

  switch (type as MessageType) {
    case "CMP_DETECTED":
      return handleCmpDetected(payload as Message<"CMP_DETECTED">["payload"], tabId);
    case "GET_PREFERENCES":
      return handleGetPreferences(payload as Message<"GET_PREFERENCES">["payload"]);
    case "CONSENT_EXECUTED":
      return handleConsentExecuted(payload as Message<"CONSENT_EXECUTED">["payload"], tabId);
    case "UPDATE_BADGE":
      return handleUpdateBadge(payload as Message<"UPDATE_BADGE">["payload"], tabId);
    case "SCAN_STARTED":
      return handleScanStarted(tabId);
    case "SCAN_COMPLETE":
      return handleScanComplete(payload as Message<"SCAN_COMPLETE">["payload"]);
    case "EXECUTE_CONSENT":
      return handleExecuteConsent(payload as Message<"EXECUTE_CONSENT">["payload"], tabId);
    case "GET_TAB_STATE":
      return handleGetTabState(payload as Message<"GET_TAB_STATE">["payload"]);
    default:
      // eslint-disable-next-line no-console
      console.warn(`[NoCookie] Unknown message type: ${type}`);
      return { error: `Unknown message type: ${type}` };
  }
}

// -- Message listener ---------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (message: Message, sender: chrome.runtime.MessageSender, sendResponse) => {
    const tabId = sender.tab?.id ?? 0;

    routeMessage(message, tabId)
      .then(sendResponse)
      .catch((err: Error) => {
        // eslint-disable-next-line no-console
        console.error(`[NoCookie] Handler error for ${message.type}:`, err);
        sendResponse({ error: err.message });
      });

    // Return true to indicate async sendResponse
    return true;
  },
);

// -- Lifecycle listeners ------------------------------------------------------

chrome.runtime.onInstalled.addListener(async (details) => {
  await migrateStorageIfNeeded();

  if (details.reason === "install") {
    const completed = await isOnboardingCompleted();
    if (!completed) {
      await chrome.tabs.create({ url: "src/options/options.html" });
    }
  }
});

/** Clear tab state when the tab navigates to a new URL. */
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading" && changeInfo.url) {
    updateTabState(tabId, {
      state: "default",
      cmp: undefined,
      domain: undefined,
      result: undefined,
    });
  }
});

/** Clean up tab state when a tab is closed. */
chrome.tabs.onRemoved.addListener((tabId) => {
  clearTabState(tabId);
});
