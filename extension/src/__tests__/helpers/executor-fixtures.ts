/**
 * Shared fixtures and helpers for executor tests.
 */

import { vi } from "vitest";
import type { CMPRule, UserPreferences } from "@/shared/types";

/** Mock MutationObserver for jsdom tests. */
export class MockMutationObserver {
  static instances: MockMutationObserver[] = [];
  callback: MutationCallback;
  observing = false;

  constructor(callback: MutationCallback) {
    this.callback = callback;
    MockMutationObserver.instances.push(this);
  }

  observe(): void {
    this.observing = true;
  }

  disconnect(): void {
    this.observing = false;
  }

  trigger(mutations: Partial<MutationRecord>[] = [{ type: "childList" }]): void {
    this.callback(mutations as MutationRecord[], this);
  }

  takeRecords(): MutationRecord[] {
    return [];
  }
}

/** Create a test CMPRule with optional overrides. */
export function makeRule(overrides?: Partial<CMPRule>): CMPRule {
  return {
    name: "test-cmp",
    detection: { domSelectors: ["#test"] },
    categoryMapping: {
      functional: "C0003",
      analytics: "C0002",
      marketing: "C0004",
      socialMedia: "C0005",
    },
    actions: {
      acceptAll: [{ type: "click", target: "#accept-all" }],
      rejectAll: [{ type: "click", target: "#reject-all" }],
      custom: [
        { type: "click", target: "#open-settings" },
        { type: "waitFor", target: ".settings-panel", timeout: 1000 },
        { type: "click", target: "#save-settings" },
      ],
    },
    ...overrides,
  };
}

export const PREFS_ACCEPT_ALL: UserPreferences = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: true,
  socialMedia: true,
};

export const PREFS_REJECT_ALL: UserPreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  socialMedia: false,
};

export const PREFS_CUSTOM: UserPreferences = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: false,
  socialMedia: false,
};

/** Standard setup for executor tests. */
export function setupExecutorTest(): void {
  vi.useFakeTimers();
  vi.resetModules();
  MockMutationObserver.instances = [];
  globalThis.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
}

/** Standard teardown for executor tests. */
export function teardownExecutorTest(): void {
  vi.useRealTimers();
  vi.restoreAllMocks();
}
