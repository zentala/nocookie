/**
 * Shared error wrapper for async UI event handlers.
 *
 * Catches unhandled rejections in event listeners and logs them
 * to the console with a contextual prefix.
 */

/**
 * Wraps async event handlers with error logging.
 * Shows a brief console error and optionally a status message.
 */
export function safeAsync(fn: () => Promise<void>, context?: string): void {
  fn().catch((err) => {
    console.error(`[NoCookie]${context ? ` ${context}:` : ""}`, err);
  });
}
