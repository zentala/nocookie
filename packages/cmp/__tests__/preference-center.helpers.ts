/**
 * @module tests/preference-center-helpers
 * Shared test helpers for PreferenceCenter test suites.
 */

import type { ResolvedCMPConfig, CategoryConfig } from "@/shared/types";
import {
  DEFAULT_THEME,
  DEFAULT_BEHAVIOR,
  DEFAULT_TRANSLATIONS,
  DEFAULT_WELL_KNOWN,
  DEFAULT_POLICY_PAGE,
} from "@/shared/constants";

/** Build a resolved config with optional category overrides. */
export function makeConfig(categories?: CategoryConfig[]): ResolvedCMPConfig {
  return {
    siteName: "Test Site",
    categories: categories ?? [
      { id: "essential", required: true },
      { id: "analytics" },
      { id: "marketing" },
    ],
    theme: { ...DEFAULT_THEME },
    behavior: { ...DEFAULT_BEHAVIOR },
    language: "en",
    translations: { ...DEFAULT_TRANSLATIONS },
    wellKnown: { ...DEFAULT_WELL_KNOWN },
    policyPage: { ...DEFAULT_POLICY_PAGE },
    icons: {},
  };
}

/** Create a shadow root host for testing. */
export function createShadowHost(): ShadowRoot {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return host.attachShadow({ mode: "open" });
}
