/**
 * DOM mutation observer for cookie consent dialogs.
 *
 * Watches for dynamically injected consent dialogs that appear
 * after initial page load using MutationObserver. Only watches
 * body direct children + subtree to minimize performance impact.
 */

/** Known CMP container selectors (top 9 CMPs). */
export const CMP_SELECTORS = [
  "#onetrust-consent-sdk",
  "#CybotCookiebotDialog",
  "#didomi-host",
  ".qc-cmp2-ui",
  "#truste-consent-track",
  ".cky-consent-container",
  ".cc-window",
  ".cmplz-cookiebanner",
  "#cmpbox",
] as const;

/** Debounce interval in milliseconds for mutation checks. */
const DEBOUNCE_MS = 100;

/**
 * Check if any CMP selector matches in the current DOM.
 * Returns the first matched selector or null.
 */
export function findCmpSelector(): string | null {
  for (const selector of CMP_SELECTORS) {
    if (document.querySelector(selector)) {
      return selector;
    }
  }
  return null;
}

/**
 * Start observing the DOM for CMP elements.
 * When a CMP element appears, calls `onDetected` with the matched selector
 * and automatically disconnects (one CMP per page).
 */
export function startObserver(onDetected: (selector: string) => void): MutationObserver {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver(() => {
    if (debounceTimer) return;

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const matched = findCmpSelector();
      if (matched) {
        observer.disconnect();
        onDetected(matched);
      }
    }, DEBOUNCE_MS);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}

/** Stop observing DOM mutations. */
export function stopObserver(observer: MutationObserver): void {
  observer.disconnect();
}
