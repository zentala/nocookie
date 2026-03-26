/**
 * MAIN world consent execution engine.
 *
 * Injected dynamically by background service worker via
 * `chrome.scripting.executeScript({ world: 'MAIN' })`.
 * Has access to `window` and page JS globals (OneTrust, Cookiebot, etc).
 * Reports results via `window.postMessage` to ISOLATED world content script.
 */

import type {
  ActionSequence,
  ActionStep,
  CMPRule,
  ConsentResult,
  UserPreferences,
} from "@/shared/types";

/** Message type constant for postMessage communication. */
export const EXECUTOR_MESSAGE_TYPE = "NOCOOKIE_CONSENT_RESULT";

/** Default timeout for waiting on elements (ms). */
const DEFAULT_TIMEOUT_MS = 2000;

/** Parameters passed to the executor when injected. */
export interface ExecutorParams {
  cmp: string;
  domain: string;
  preferences: UserPreferences;
  rule: CMPRule;
}

/** Result of action sequence selection. */
export interface SequenceSelection {
  sequence: ActionSequence;
  categoriesAccepted: string[];
  categoriesRejected: string[];
}

/** Optional cookie category keys (excludes essential). */
const OPTIONAL_CATEGORIES = ["functional", "analytics", "marketing", "socialMedia"] as const;

/**
 * Determine which action sequence to use based on user preferences.
 * Falls back to rejectAll as privacy-protective default.
 */
export function selectActionSequence(
  rule: CMPRule,
  preferences: UserPreferences,
): SequenceSelection {
  const allOptionalAccepted = OPTIONAL_CATEGORIES.every((c) => preferences[c]);
  const allOptionalRejected = OPTIONAL_CATEGORIES.every((c) => !preferences[c]);

  const accepted = ["essential", ...OPTIONAL_CATEGORIES.filter((c) => preferences[c])];
  const rejected = OPTIONAL_CATEGORIES.filter((c) => !preferences[c]);

  if (allOptionalAccepted) {
    return {
      sequence: rule.actions.acceptAll,
      categoriesAccepted: accepted,
      categoriesRejected: [],
    };
  }

  if (allOptionalRejected) {
    return {
      sequence: rule.actions.rejectAll,
      categoriesAccepted: ["essential"],
      categoriesRejected: [...rejected],
    };
  }

  if (rule.actions.custom.length > 0) {
    return {
      sequence: rule.actions.custom,
      categoriesAccepted: accepted,
      categoriesRejected: [...rejected],
    };
  }

  // Fallback: reject all (privacy-protective)
  return {
    sequence: rule.actions.rejectAll,
    categoriesAccepted: ["essential"],
    categoriesRejected: [...OPTIONAL_CATEGORIES],
  };
}

/**
 * Wait for an element matching `selector` to appear in DOM.
 * Uses MutationObserver with timeout. Resolves true when found.
 */
export function executeWaitFor(selector: string, timeout = DEFAULT_TIMEOUT_MS): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(true);
      return;
    }

    let settled = false;
    const observer = new MutationObserver(() => {
      if (settled) return;
      if (document.querySelector(selector)) {
        settled = true;
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        observer.disconnect();
        resolve(false);
      }
    }, timeout);
  });
}

/**
 * Click an element matching `target` selector.
 * Waits for element to appear if not immediately found.
 */
export async function executeClick(target: string, timeout = DEFAULT_TIMEOUT_MS): Promise<boolean> {
  const found = await executeWaitFor(target, timeout);
  if (!found) return false;

  const el = document.querySelector<HTMLElement>(target);
  if (!el) return false;

  el.click();
  return true;
}

/**
 * Execute a JavaScript expression in page context.
 * Uses indirect eval to run CMP API calls (e.g., `OneTrust.AllowAll()`).
 * This is intentional -- the executor runs in MAIN world specifically
 * to interact with CMP JavaScript APIs on the page.
 */
export function executeEval(expression: string): boolean {
  try {
    const indirectEval = globalThis.eval;
    indirectEval(expression);
    return true;
  } catch {
    return false;
  }
}

/**
 * Toggle a checkbox/toggle element to desired state.
 * `value` of 'on'/'true' ensures checked; 'off'/'false' ensures unchecked.
 */
export function executeToggle(target: string, value?: string): boolean {
  const el = document.querySelector<HTMLInputElement>(target);
  if (!el) return false;

  const desiredState = value === "on" || value === "true";
  if (el.checked !== desiredState) {
    el.click();
  }
  return true;
}

/**
 * Execute a single action step, dispatching to the correct handler.
 */
async function executeStep(step: ActionStep): Promise<boolean> {
  switch (step.type) {
    case "click":
      return executeClick(step.target ?? "", step.timeout);
    case "eval":
      return executeEval(step.target ?? "");
    case "waitFor":
      return executeWaitFor(step.target ?? "", step.timeout);
    case "toggle":
      return executeToggle(step.target ?? "", step.value);
    default:
      return false;
  }
}

/**
 * Execute a sequence of action steps in order.
 * Stops and returns false if any step fails.
 */
export async function executeActionSequence(steps: ActionStep[]): Promise<boolean> {
  for (const step of steps) {
    const ok = await executeStep(step);
    if (!ok) return false;
  }
  return true;
}

/**
 * Post consent result back to ISOLATED world via window.postMessage.
 */
export function postResult(result: Omit<ConsentResult, "timestamp">): void {
  window.postMessage(
    {
      type: EXECUTOR_MESSAGE_TYPE,
      payload: { ...result, timestamp: Date.now() },
    },
    "*",
  );
}

/**
 * Main execution function. Called when script is injected into MAIN world.
 * Selects appropriate action sequence and executes it.
 */
export async function executeConsent(params: ExecutorParams): Promise<void> {
  const { cmp, domain, rule, preferences } = params;
  const selection = selectActionSequence(rule, preferences);

  const success = await executeActionSequence(selection.sequence);

  postResult({
    domain,
    cmp,
    method: "api",
    categoriesAccepted: selection.categoriesAccepted,
    categoriesRejected: selection.categoriesRejected,
    confidence: "high",
    success,
  });
}
