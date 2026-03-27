/**
 * NoCookie CMP native handshake handler.
 *
 * When the extension detects the NoCookie CMP (`#ca-cmp-root`), it sends
 * a `CA_EXTENSION_HELLO` message via `window.postMessage`. The CMP responds
 * with `CA_EXTENSION_ACK` once it has applied the user's preferences.
 *
 * This enables high-confidence, native consent application without
 * relying on heuristic clicking or API guessing.
 */

import type { UserPreferences, ConsentResult } from "@/shared/types";

/** Message type sent from extension to CMP. */
export const HELLO_MESSAGE_TYPE = "CA_EXTENSION_HELLO";

/** Message type sent from CMP back to extension. */
export const ACK_MESSAGE_TYPE = "CA_EXTENSION_ACK";

/** Protocol version for the handshake. */
const PROTOCOL_VERSION = "1.0";

/** Timeout for waiting on CMP acknowledgment (ms). */
const ACK_TIMEOUT_MS = 3000;

/** Callback invoked when the CMP acknowledges the handshake. */
export type AckCallback = (result: ConsentResult) => void;

/**
 * Check whether the NoCookie CMP is present in the DOM.
 * Looks for the `#ca-cmp-root` element or the `__cookiesAccepterCMP` global.
 */
export function isNoCookieCmpPresent(): boolean {
  if (document.querySelector("#ca-cmp-root")) return true;
  if ("__cookiesAccepterCMP" in window) return true;
  return false;
}

/**
 * Read the CMP version from the DOM if available.
 */
export function getCmpVersion(): string | null {
  const root = document.querySelector("#ca-cmp-root");
  return root?.getAttribute("data-ca-version") ?? null;
}

/**
 * Send the `CA_EXTENSION_HELLO` message to the NoCookie CMP.
 * The CMP will read user preferences and apply them natively.
 */
export function sendHello(preferences: UserPreferences): void {
  window.postMessage(
    {
      type: HELLO_MESSAGE_TYPE,
      version: PROTOCOL_VERSION,
      preferences: {
        essential: preferences.essential,
        functional: preferences.functional,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        socialMedia: preferences.socialMedia,
      },
    },
    "*",
  );
}

/**
 * Build a ConsentResult from the CMP's ACK payload.
 */
function buildResult(ackData: Record<string, unknown>, domain: string): ConsentResult {
  const applied = (ackData.appliedPreferences ?? {}) as Record<string, boolean>;
  const accepted = Object.entries(applied)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
  const rejected = Object.entries(applied)
    .filter(([, v]) => v === false)
    .map(([k]) => k);

  return {
    domain,
    cmp: "NoCookie CMP",
    method: "extension-native",
    categoriesAccepted: accepted.length > 0 ? accepted : ["essential"],
    categoriesRejected: rejected,
    timestamp: Date.now(),
    confidence: "high",
    success: true,
  };
}

/**
 * Wait for the CMP to respond with `CA_EXTENSION_ACK`.
 * Resolves with a ConsentResult on success, or null on timeout.
 */
export function waitForAck(domain: string): Promise<ConsentResult | null> {
  return new Promise<ConsentResult | null>((resolve) => {
    let settled = false;

    const onMessage = (event: MessageEvent): void => {
      if (event.source !== window) return;
      if (event.data?.type !== ACK_MESSAGE_TYPE) return;
      if (settled) return;

      settled = true;
      window.removeEventListener("message", onMessage);
      resolve(buildResult(event.data, domain));
    };

    window.addEventListener("message", onMessage);

    setTimeout(() => {
      if (!settled) {
        settled = true;
        window.removeEventListener("message", onMessage);
        resolve(null);
      }
    }, ACK_TIMEOUT_MS);
  });
}

/**
 * Execute the full NoCookie CMP handshake.
 *
 * 1. Send `CA_EXTENSION_HELLO` with user preferences
 * 2. Wait for `CA_EXTENSION_ACK` from the CMP
 * 3. Return the consent result (or null on timeout)
 */
export async function executeNoCookieHandshake(
  preferences: UserPreferences,
  domain: string,
): Promise<ConsentResult | null> {
  sendHello(preferences);
  return waitForAck(domain);
}
