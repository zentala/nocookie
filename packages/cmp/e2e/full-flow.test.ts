// @vitest-environment jsdom
/**
 * @module e2e/full-flow
 * End-to-end integration tests for the complete CMP user journey:
 * config -> banner display -> accept/reject -> preference center -> save -> persistence.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  setupCMP,
  makeFullConfig,
  shadowQuery,
  shadowQueryAll,
  clickButton,
  type CMPTestHarness,
} from "./helpers";
import { DEFAULT_TRANSLATIONS } from "@/shared/constants";

describe("Full CMP Flow", () => {
  let harness: CMPTestHarness;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    harness?.destroy();
    vi.useRealTimers();
  });

  describe("Banner appears on first visit", () => {
    it("should render the banner into shadow DOM", () => {
      harness = setupCMP();
      const banner = shadowQuery(harness.shadowRoot, ".ca-banner");
      expect(banner).not.toBeNull();
    });

    it("should show banner when no consent cookie exists", () => {
      harness = setupCMP();
      expect(harness.banner.shouldShow()).toBe(true);
    });

    it("should display correct title and description", () => {
      harness = setupCMP();
      harness.banner.show();
      const title = shadowQuery(harness.shadowRoot, ".ca-banner__title");
      const text = shadowQuery(harness.shadowRoot, ".ca-banner__text");
      expect(title?.textContent).toBe(DEFAULT_TRANSLATIONS.bannerTitle);
      expect(text?.textContent).toContain(DEFAULT_TRANSLATIONS.bannerDescription);
    });

    it("should render Accept All, Customize, and Reject All buttons", () => {
      harness = setupCMP({
        behavior: { ...harness?.config.behavior, rejectAllOnFirstLayer: true },
      });
      harness = setupCMP({
        behavior: {
          ...setupCMP().config.behavior,
          rejectAllOnFirstLayer: true,
        },
      });
      const buttons = shadowQueryAll(harness.shadowRoot, "button");
      const texts = buttons.map((b) => b.textContent?.trim());
      expect(texts).toContain(DEFAULT_TRANSLATIONS.acceptAll);
      expect(texts).toContain(DEFAULT_TRANSLATIONS.customize);
      expect(texts).toContain(DEFAULT_TRANSLATIONS.rejectAll);
    });

    it("should render category icon dots for each configured category", () => {
      harness = setupCMP();
      const dots = shadowQueryAll(harness.shadowRoot, ".ca-banner__icon-dot");
      expect(dots.length).toBe(3); // essential, analytics, marketing
    });
  });

  describe("Accept All hides banner", () => {
    it("should hide banner and save all-true consent after Accept All", () => {
      harness = setupCMP();
      harness.banner.show();

      const events: string[] = [];
      harness.eventBus.on("consent:updated", () => events.push("updated"));
      harness.eventBus.on("ui:banner:hide", () => events.push("hidden"));

      clickButton(harness.shadowRoot, DEFAULT_TRANSLATIONS.acceptAll);
      vi.advanceTimersByTime(300);

      expect(events).toContain("updated");
      expect(events).toContain("hidden");

      const consent = harness.consentState.getConsent();
      expect(consent).not.toBeNull();
      expect(consent!.essential).toBe(true);
      expect(consent!.analytics).toBe(true);
      expect(consent!.marketing).toBe(true);
    });
  });

  describe("Reject All hides banner", () => {
    it("should hide banner and save essential-only consent", () => {
      harness = setupCMP({
        behavior: {
          ...setupCMP().config.behavior,
          rejectAllOnFirstLayer: true,
        },
      });
      harness.banner.show();

      clickButton(harness.shadowRoot, DEFAULT_TRANSLATIONS.rejectAll);
      vi.advanceTimersByTime(300);

      const consent = harness.consentState.getConsent();
      expect(consent).not.toBeNull();
      expect(consent!.essential).toBe(true);
      expect(consent!.analytics).toBe(false);
      expect(consent!.marketing).toBe(false);
    });
  });

  describe("Customize opens preference center", () => {
    it("should emit preferences:open when Customize is clicked", () => {
      harness = setupCMP();
      harness.banner.show();

      const events: string[] = [];
      harness.eventBus.on("ui:preferences:open", () => events.push("open"));

      clickButton(harness.shadowRoot, DEFAULT_TRANSLATIONS.customize);

      expect(events).toContain("open");
    });

    it("should show preference center overlay after Customize", () => {
      harness = setupCMP();
      harness.banner.show();
      harness.preferenceCenter.render();

      clickButton(harness.shadowRoot, DEFAULT_TRANSLATIONS.customize);

      const overlay = shadowQuery(harness.shadowRoot, ".ca-overlay");
      expect(overlay).not.toBeNull();
      expect(overlay!.hidden).toBe(false);
    });
  });

  describe("Per-category toggle works", () => {
    it("should render toggles for non-required categories", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const toggles = shadowQueryAll(
        harness.shadowRoot,
        'input[type="checkbox"][data-category-id]',
      );
      const ids = toggles.map((t) => (t as HTMLInputElement).dataset.categoryId);
      expect(ids).toContain("analytics");
      expect(ids).toContain("marketing");
      expect(ids).not.toContain("essential");
    });

    it("should show Always Active badge for required categories", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const badge = shadowQuery(harness.shadowRoot, ".ca-category__always-active");
      expect(badge).not.toBeNull();
      expect(badge!.textContent).toBe(DEFAULT_TRANSLATIONS.categoryRequired);
    });

    it("should allow toggling analytics on and off", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const toggle = harness.shadowRoot.querySelector<HTMLInputElement>(
        'input[data-category-id="analytics"]',
      );
      expect(toggle).not.toBeNull();

      toggle!.checked = true;
      toggle!.dispatchEvent(new Event("change"));
      expect(toggle!.checked).toBe(true);

      toggle!.checked = false;
      toggle!.dispatchEvent(new Event("change"));
      expect(toggle!.checked).toBe(false);
    });
  });

  describe("Save Preferences saves correctly", () => {
    it("should persist toggled categories when Save is clicked", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const analyticsToggle = harness.shadowRoot.querySelector<HTMLInputElement>(
        'input[data-category-id="analytics"]',
      );
      analyticsToggle!.checked = true;

      const marketingToggle = harness.shadowRoot.querySelector<HTMLInputElement>(
        'input[data-category-id="marketing"]',
      );
      marketingToggle!.checked = false;

      clickButton(harness.shadowRoot, DEFAULT_TRANSLATIONS.savePreferences);

      const consent = harness.consentState.getConsent();
      expect(consent).not.toBeNull();
      expect(consent!.essential).toBe(true);
      expect(consent!.analytics).toBe(true);
      expect(consent!.marketing).toBe(false);
    });

    it("should close preference center after saving", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const events: string[] = [];
      harness.eventBus.on("ui:preferences:close", () => events.push("closed"));

      clickButton(harness.shadowRoot, DEFAULT_TRANSLATIONS.savePreferences);

      expect(events).toContain("closed");
      const overlay = shadowQuery(harness.shadowRoot, ".ca-overlay");
      expect(overlay!.hidden).toBe(true);
    });
  });

  describe("Banner does not appear after consent given", () => {
    it("should not show banner when consent cookie exists", () => {
      harness = setupCMP();
      harness.consentState.acceptAll();

      expect(harness.banner.shouldShow()).toBe(false);
    });

    it("should show banner again after consent is reset", () => {
      harness = setupCMP();
      harness.consentState.acceptAll();
      expect(harness.banner.shouldShow()).toBe(false);

      harness.consentState.reset();
      expect(harness.banner.shouldShow()).toBe(true);
    });
  });

  describe("Full config with all categories and cookies", () => {
    it("should render all five categories in preference center", () => {
      const config = makeFullConfig();
      harness = setupCMP(config);
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const sections = shadowQueryAll(harness.shadowRoot, ".ca-category");
      expect(sections.length).toBe(5);
    });

    it("should render cookie detail tables for categories with cookies", () => {
      const config = makeFullConfig();
      harness = setupCMP(config);
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const tables = shadowQueryAll(harness.shadowRoot, ".ca-cookie-table");
      expect(tables.length).toBe(5);
    });

    it("should toggle cookie details when expand button is clicked", () => {
      const config = makeFullConfig();
      harness = setupCMP(config);
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const expandBtn = shadowQuery(harness.shadowRoot, ".ca-category__toggle-details");
      expect(expandBtn).not.toBeNull();

      const details = shadowQuery(harness.shadowRoot, ".ca-category__details");
      expect(details!.hidden).toBe(true);

      expandBtn!.click();
      expect(details!.hidden).toBe(false);
      expect(expandBtn!.getAttribute("aria-expanded")).toBe("true");

      expandBtn!.click();
      expect(details!.hidden).toBe(true);
      expect(expandBtn!.getAttribute("aria-expanded")).toBe("false");
    });
  });

  describe("Accept All / Reject All in preference center", () => {
    it("should accept all categories via preference center", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      clickButton(harness.shadowRoot, DEFAULT_TRANSLATIONS.acceptAll);

      const consent = harness.consentState.getConsent();
      expect(consent!.essential).toBe(true);
      expect(consent!.analytics).toBe(true);
      expect(consent!.marketing).toBe(true);
    });

    it("should reject non-essential via preference center", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      clickButton(harness.shadowRoot, DEFAULT_TRANSLATIONS.rejectAll);

      const consent = harness.consentState.getConsent();
      expect(consent!.essential).toBe(true);
      expect(consent!.analytics).toBe(false);
      expect(consent!.marketing).toBe(false);
    });
  });
});
