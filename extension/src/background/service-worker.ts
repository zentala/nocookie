/**
 * Background service worker for the NoCookie extension.
 *
 * Handles extension lifecycle events, message passing between
 * content scripts and popup/options pages, and manages extension state.
 */

chrome.runtime.onInstalled.addListener(() => {
  // Extension installed or updated
});
