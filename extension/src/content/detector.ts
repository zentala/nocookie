/**
 * Cookie consent dialog detector.
 *
 * Main detection script running in ISOLATED world on every page.
 * Performs initial scan, then starts MutationObserver for async-loaded CMPs.
 * Communicates results to background service worker.
 */

import { createMessage } from "@/shared/messages";
import type { ConfidenceLevel } from "@/shared/types";
import { findCmpSelector, startObserver, stopObserver } from "./observer";

/** Known CMP script URL patterns mapped to CMP names. */
const CMP_SCRIPT_URLS: Record<string, string> = {
  "cdn.cookielaw.org": "onetrust",
  "consent.cookiebot.com": "cookiebot",
  "sdk.privacy-center.org": "didomi",
  "quantcast.mgr.consensu.org": "quantcast",
  "consent.trustarc.com": "trustarc",
  "cdn-cookieyes.com": "cookieyes",
  "complianz.io": "complianz",
  "cdn.osano.com": "osano",
  "delivery.consentmanager.net": "consentmanager",
};

/** Map of DOM selectors to CMP names. */
const SELECTOR_TO_CMP: Record<string, string> = {
  "#onetrust-consent-sdk": "onetrust",
  "#CybotCookiebotDialog": "cookiebot",
  "#didomi-host": "didomi",
  ".qc-cmp2-ui": "quantcast",
  "#truste-consent-track": "trustarc",
  ".cky-consent-container": "cookieyes",
  ".cc-window": "osano",
  ".cmplz-cookiebanner": "complianz",
  "#cmpbox": "consentmanager",
};

/** Detection timeout in milliseconds. */
const DETECTION_TIMEOUT_MS = 5000;

/** Current observer instance (for cleanup on re-scan). */
let activeObserver: MutationObserver | null = null;

/** Current timeout handle (for cleanup on re-scan). */
let activeTimeout: ReturnType<typeof setTimeout> | null = null;

/** Whether a scan is currently running. */
let scanning = false;

/**
 * Scan `<script>` elements for known CMP CDN URLs.
 * Returns the CMP name if found, null otherwise.
 */
export function scanScriptUrls(): string | null {
  const scripts = document.querySelectorAll("script[src]");
  for (const script of scripts) {
    const src = script.getAttribute("src") ?? "";
    for (const [urlPattern, cmpName] of Object.entries(CMP_SCRIPT_URLS)) {
      if (src.includes(urlPattern)) {
        return cmpName;
      }
    }
  }
  return null;
}

/**
 * Send a CMP_DETECTED message to the background service worker.
 */
function notifyCmpDetected(cmp: string, confidence: ConfidenceLevel): void {
  const message = createMessage("CMP_DETECTED", {
    cmp,
    domain: window.location.hostname,
    confidence,
    layer: 1,
  });
  chrome.runtime.sendMessage(message).catch(() => {
    /* Extension context may be invalidated */
  });
}

/**
 * Send a SCAN_COMPLETE message to the background service worker.
 */
function notifyScanComplete(cmpFound: boolean): void {
  const message = createMessage("SCAN_COMPLETE", {
    tabId: 0, // Background will use sender.tab.id
    cmpFound,
  });
  chrome.runtime.sendMessage(message).catch(() => {
    /* Extension context may be invalidated */
  });
}

/** Clean up any active observer and timeout. */
function cleanup(): void {
  if (activeObserver) {
    stopObserver(activeObserver);
    activeObserver = null;
  }
  if (activeTimeout) {
    clearTimeout(activeTimeout);
    activeTimeout = null;
  }
  scanning = false;
}

/**
 * Run the full CMP detection flow:
 * 1. Notify background: SCAN_STARTED
 * 2. Initial DOM selector scan
 * 3. Script URL scan
 * 4. If found -> notify CMP_DETECTED
 * 5. If not -> start MutationObserver with timeout
 */
export function runDetection(): void {
  cleanup();
  scanning = true;

  // Notify background that scan started
  const scanMsg = createMessage("SCAN_STARTED", { tabId: 0 });
  chrome.runtime.sendMessage(scanMsg).catch(() => {});

  // Step 1: DOM selector scan
  const matchedSelector = findCmpSelector();
  if (matchedSelector) {
    const cmpName = SELECTOR_TO_CMP[matchedSelector] ?? "unknown";
    scanning = false;
    notifyCmpDetected(cmpName, "high");
    return;
  }

  // Step 2: Script URL scan
  const scriptCmp = scanScriptUrls();
  if (scriptCmp) {
    scanning = false;
    notifyCmpDetected(scriptCmp, "medium");
    return;
  }

  // Step 3: Start observer for async-loaded CMPs
  activeObserver = startObserver((selector: string) => {
    if (activeTimeout) {
      clearTimeout(activeTimeout);
      activeTimeout = null;
    }
    const cmpName = SELECTOR_TO_CMP[selector] ?? "unknown";
    activeObserver = null;
    scanning = false;
    notifyCmpDetected(cmpName, "high");
  });

  // Step 4: Timeout — give up after DETECTION_TIMEOUT_MS
  activeTimeout = setTimeout(() => {
    activeTimeout = null;
    if (activeObserver) {
      stopObserver(activeObserver);
      activeObserver = null;
    }
    scanning = false;
    notifyScanComplete(false);
  }, DETECTION_TIMEOUT_MS);
}

// -- SPA navigation handling --------------------------------------------------

/** Handle SPA route changes by re-running detection. */
function onSpaNavigation(): void {
  runDetection();
}

// -- Initialization -----------------------------------------------------------

/** Set up event listeners and run initial detection. */
export function init(): void {
  window.addEventListener("popstate", onSpaNavigation);
  window.addEventListener("hashchange", onSpaNavigation);

  // Listen for re-scan commands from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "EXECUTE_CONSENT" && !scanning) {
      // Future: pass to executor. For now, just acknowledge.
    }
  });

  runDetection();
}

// Auto-initialize when loaded as content script
init();
