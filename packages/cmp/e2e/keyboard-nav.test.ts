// @vitest-environment jsdom
/**
 * @module e2e/keyboard-nav
 * Integration tests for keyboard navigation and accessibility.
 * Validates Tab cycling, Escape to close, focus trapping,
 * and ARIA attributes across banner and preference center.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  setupCMP,
  makeFullConfig,
  shadowQuery,
  shadowQueryAll,
  type CMPTestHarness,
} from "./helpers";
import { DEFAULT_TRANSLATIONS } from "@/shared/constants";

describe("Keyboard Navigation", () => {
  let harness: CMPTestHarness;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    harness?.destroy();
    vi.useRealTimers();
  });

  describe("Banner accessibility", () => {
    it("should have role=dialog on the banner", () => {
      harness = setupCMP();
      const banner = shadowQuery(harness.shadowRoot, ".ca-banner");
      expect(banner!.getAttribute("role")).toBe("dialog");
    });

    it("should have aria-label on the banner", () => {
      harness = setupCMP();
      const banner = shadowQuery(harness.shadowRoot, ".ca-banner");
      expect(banner!.getAttribute("aria-label")).toBe(DEFAULT_TRANSLATIONS.bannerTitle);
    });

    it("should have all buttons focusable with Tab", () => {
      harness = setupCMP();
      harness.banner.show();
      const buttons = shadowQueryAll(harness.shadowRoot, ".ca-banner button");
      for (const btn of buttons) {
        expect(btn.tabIndex).not.toBe(-1);
      }
    });

    it("should render buttons with type=button", () => {
      harness = setupCMP();
      const buttons = shadowQueryAll(harness.shadowRoot, ".ca-banner button");
      for (const btn of buttons) {
        expect((btn as HTMLButtonElement).type).toBe("button");
      }
    });
  });

  describe("Preference center accessibility", () => {
    it("should have role=dialog on the preference center", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const dialog = shadowQuery(harness.shadowRoot, ".ca-prefs");
      expect(dialog!.getAttribute("role")).toBe("dialog");
      expect(dialog!.getAttribute("aria-modal")).toBe("true");
    });

    it("should have aria-label on close button", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const closeBtn = shadowQuery(harness.shadowRoot, ".ca-prefs__close");
      expect(closeBtn!.getAttribute("aria-label")).toBe(DEFAULT_TRANSLATIONS.closeAriaLabel);
    });

    it("should have aria-expanded on category expand buttons", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const expandBtns = shadowQueryAll(harness.shadowRoot, ".ca-category__toggle-details");
      for (const btn of expandBtns) {
        expect(btn.getAttribute("aria-expanded")).toBe("false");
      }
    });
  });

  describe("Escape key closes preference center", () => {
    it("should close on Escape keydown", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const overlay = shadowQuery(harness.shadowRoot, ".ca-overlay");
      expect(overlay!.hidden).toBe(false);

      const escEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      harness.shadowRoot.dispatchEvent(escEvent);

      expect(overlay!.hidden).toBe(true);
    });

    it("should emit ui:preferences:close on Escape", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const events: string[] = [];
      harness.eventBus.on("ui:preferences:close", () => events.push("closed"));

      const escEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      harness.shadowRoot.dispatchEvent(escEvent);

      expect(events).toContain("closed");
    });
  });

  describe("Focus trapping in preference center", () => {
    it("should contain focusable elements in the preference center", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const focusable = shadowQueryAll(
        harness.shadowRoot,
        '.ca-overlay button, .ca-overlay input, .ca-overlay [tabindex]:not([tabindex="-1"])',
      );
      expect(focusable.length).toBeGreaterThan(0);
    });

    it("should have Tab key handled in preference center", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const tabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      });

      // Should not throw when Tab is pressed
      expect(() => {
        harness.shadowRoot.dispatchEvent(tabEvent);
      }).not.toThrow();
    });
  });

  describe("Banner button order for Tab navigation", () => {
    it("should have buttons in logical order: Reject, Customize, Accept", () => {
      harness = setupCMP({
        behavior: {
          ...setupCMP().config.behavior,
          rejectAllOnFirstLayer: true,
        },
      });

      const buttons = shadowQueryAll(harness.shadowRoot, ".ca-banner button");
      const order = buttons.map((b) => b.textContent?.trim());

      const rejectIdx = order.indexOf(DEFAULT_TRANSLATIONS.rejectAll);
      const customizeIdx = order.indexOf(DEFAULT_TRANSLATIONS.customize);
      const acceptIdx = order.indexOf(DEFAULT_TRANSLATIONS.acceptAll);

      expect(rejectIdx).toBeLessThan(customizeIdx);
      expect(customizeIdx).toBeLessThan(acceptIdx);
    });

    it("should have Customize and Accept when reject is hidden", () => {
      harness = setupCMP({
        behavior: {
          ...setupCMP().config.behavior,
          rejectAllOnFirstLayer: false,
        },
      });

      const buttons = shadowQueryAll(harness.shadowRoot, ".ca-banner button");
      const texts = buttons.map((b) => b.textContent?.trim());

      expect(texts).toContain(DEFAULT_TRANSLATIONS.customize);
      expect(texts).toContain(DEFAULT_TRANSLATIONS.acceptAll);
      expect(texts).not.toContain(DEFAULT_TRANSLATIONS.rejectAll);
    });
  });

  describe("Close button in preference center", () => {
    it("should close preference center when close button is clicked", () => {
      harness = setupCMP();
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const closeBtn = shadowQuery(harness.shadowRoot, ".ca-prefs__close") as HTMLButtonElement;
      expect(closeBtn).not.toBeNull();
      closeBtn.click();

      const overlay = shadowQuery(harness.shadowRoot, ".ca-overlay");
      expect(overlay!.hidden).toBe(true);
    });
  });

  describe("Category expand/collapse keyboard interaction", () => {
    it("should toggle cookie details on Enter/click", () => {
      const config = makeFullConfig();
      harness = setupCMP(config);
      harness.preferenceCenter.render();
      harness.preferenceCenter.open();

      const expandBtn = shadowQuery(
        harness.shadowRoot,
        ".ca-category__toggle-details",
      ) as HTMLButtonElement;
      const details = shadowQuery(harness.shadowRoot, ".ca-category__details");

      expect(details!.hidden).toBe(true);

      // Click to expand
      expandBtn.click();
      expect(details!.hidden).toBe(false);
      expect(expandBtn.getAttribute("aria-expanded")).toBe("true");

      // Click to collapse
      expandBtn.click();
      expect(details!.hidden).toBe(true);
      expect(expandBtn.getAttribute("aria-expanded")).toBe("false");
    });
  });
});
