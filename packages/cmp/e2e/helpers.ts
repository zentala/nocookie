/**
 * @module e2e/helpers
 * Shared test helpers for E2E integration tests.
 * Orchestrates CMP components the same way the real init() will.
 */

import type { ResolvedCMPConfig, CategoryConfig } from "@/shared/types";
import {
  DEFAULT_THEME,
  DEFAULT_BEHAVIOR,
  DEFAULT_TRANSLATIONS,
  DEFAULT_WELL_KNOWN,
  DEFAULT_POLICY_PAGE,
} from "@/shared/constants";
import { ConsentStateManager } from "@/core/consent-state";
import { EventBus } from "@/core/event-bus";
import { ThemeEngine } from "@/ui/theme";
import { Banner } from "@/ui/banner";
import { PreferenceCenter } from "@/ui/preference-center";

/** All components created by setupCMP, for cleanup. */
export interface CMPTestHarness {
  config: ResolvedCMPConfig;
  consentState: ConsentStateManager;
  eventBus: EventBus;
  themeEngine: ThemeEngine;
  shadowRoot: ShadowRoot;
  banner: Banner;
  preferenceCenter: PreferenceCenter;
  destroy: () => void;
}

/** Build a resolved config with optional overrides. */
export function makeConfig(overrides?: Partial<ResolvedCMPConfig>): ResolvedCMPConfig {
  return {
    siteName: "Test Site",
    categories: [
      { id: "essential", required: true, defaultState: true },
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
    ...overrides,
  };
}

/** Build a full-category config with all five categories and cookies. */
export function makeFullConfig(): ResolvedCMPConfig {
  const categories: CategoryConfig[] = [
    {
      id: "essential",
      required: true,
      defaultState: true,
      cookies: [
        {
          name: "session_id",
          provider: "Test Site",
          duration: "Session",
          purpose: "Session management",
        },
      ],
    },
    {
      id: "functional",
      cookies: [
        { name: "lang", provider: "Test Site", duration: "1 year", purpose: "Language preference" },
      ],
    },
    {
      id: "analytics",
      cookies: [
        { name: "_ga", provider: "Google", duration: "2 years", purpose: "Analytics tracking" },
      ],
    },
    {
      id: "marketing",
      cookies: [{ name: "_fbp", provider: "Meta", duration: "3 months", purpose: "Ad targeting" }],
    },
    {
      id: "social-media",
      cookies: [
        { name: "tw_pixel", provider: "Twitter", duration: "1 year", purpose: "Social sharing" },
      ],
    },
  ];
  return makeConfig({ categories });
}

/**
 * Set up a full CMP instance with all components wired together.
 * Mirrors the real init() orchestration flow.
 */
export function setupCMP(configOverrides?: Partial<ResolvedCMPConfig>): CMPTestHarness {
  const config = configOverrides ? makeConfig(configOverrides) : makeConfig();

  const consentState = new ConsentStateManager(config);
  const eventBus = new EventBus();
  const themeEngine = new ThemeEngine(config.theme);
  const shadowRoot = themeEngine.createShadowHost();

  const banner = new Banner(config, consentState, eventBus, shadowRoot);
  banner.render();

  const preferenceCenter = new PreferenceCenter(config, consentState, eventBus, shadowRoot);

  return {
    config,
    consentState,
    eventBus,
    themeEngine,
    shadowRoot,
    banner,
    preferenceCenter,
    destroy: () => {
      preferenceCenter.destroy();
      banner.destroy();
      themeEngine.destroy();
      eventBus.removeAllListeners();
    },
  };
}

/** Query an element inside the shadow root. */
export function shadowQuery(shadowRoot: ShadowRoot, selector: string): HTMLElement | null {
  return shadowRoot.querySelector<HTMLElement>(selector);
}

/** Query all elements inside the shadow root. */
export function shadowQueryAll(shadowRoot: ShadowRoot, selector: string): HTMLElement[] {
  return Array.from(shadowRoot.querySelectorAll<HTMLElement>(selector));
}

/** Click a button found by text content inside shadow DOM. */
export function clickButton(shadowRoot: ShadowRoot, text: string): void {
  const buttons = shadowQueryAll(shadowRoot, "button");
  const btn = buttons.find((b) => b.textContent?.trim() === text);
  if (!btn) {
    throw new Error(
      `Button "${text}" not found. Available: ${buttons.map((b) => b.textContent).join(", ")}`,
    );
  }
  btn.click();
}

/** Flush pending timers (for animation callbacks). */
export function flushTimers(): void {
  vi.advanceTimersByTime(300);
}

import { vi } from "vitest";
