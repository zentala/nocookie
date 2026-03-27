// @vitest-environment jsdom
/**
 * @module tests/preference-center
 * Unit tests for PreferenceCenter: DOM generation, essential category,
 * toggle interactions, and consent persistence (save/accept/reject).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PreferenceCenter } from "@/ui/preference-center";
import { EventBus } from "@/core/event-bus";
import { ConsentStateManager } from "@/core/consent-state";
import type { ResolvedCMPConfig } from "@/shared/types";
import { makeConfig, createShadowHost } from "./preference-center.helpers";
import { DEFAULT_TRANSLATIONS } from "@/shared/constants";

describe("PreferenceCenter", () => {
  let config: ResolvedCMPConfig;
  let consentState: ConsentStateManager;
  let eventBus: EventBus;
  let shadowRoot: ShadowRoot;
  let pc: PreferenceCenter;

  beforeEach(() => {
    document.body.textContent = "";
    config = makeConfig();
    consentState = new ConsentStateManager(config);
    eventBus = new EventBus();
    shadowRoot = createShadowHost();
    pc = new PreferenceCenter(config, consentState, eventBus, shadowRoot);
  });

  describe("DOM generation", () => {
    it("renders overlay with dialog structure", () => {
      pc.render();
      const overlay = shadowRoot.querySelector(".ca-overlay");
      expect(overlay).toBeTruthy();
      expect(overlay?.getAttribute("hidden")).not.toBeNull();

      const dialog = shadowRoot.querySelector(".ca-prefs");
      expect(dialog?.getAttribute("role")).toBe("dialog");
      expect(dialog?.getAttribute("aria-modal")).toBe("true");
    });

    it("renders header with title and close button", () => {
      pc.render();
      const h2 = shadowRoot.querySelector(".ca-prefs__header h2");
      expect(h2?.textContent).toBe(DEFAULT_TRANSLATIONS.preferencesTitle);

      const closeBtn = shadowRoot.querySelector(".ca-prefs__close");
      expect(closeBtn).toBeTruthy();
      expect(closeBtn?.getAttribute("aria-label")).toBe(DEFAULT_TRANSLATIONS.closeAriaLabel);
    });

    it("renders one section per category", () => {
      pc.render();
      const cats = shadowRoot.querySelectorAll(".ca-category");
      expect(cats.length).toBe(3);
    });

    it("renders action buttons", () => {
      pc.render();
      const btns = shadowRoot.querySelectorAll(".ca-btn");
      expect(btns.length).toBe(3);
      expect(btns[0].textContent).toBe(DEFAULT_TRANSLATIONS.rejectAll);
      expect(btns[1].textContent).toBe(DEFAULT_TRANSLATIONS.savePreferences);
      expect(btns[2].textContent).toBe(DEFAULT_TRANSLATIONS.acceptAll);
    });
  });

  describe("essential category", () => {
    it("shows Always Active instead of toggle for required categories", () => {
      pc.render();
      const essential = shadowRoot.querySelector('[data-category-id="essential"]');
      const badge = essential?.querySelector(".ca-category__always-active");
      expect(badge?.textContent).toBe(DEFAULT_TRANSLATIONS.categoryRequired);
      expect(essential?.querySelector(".ca-toggle")).toBeNull();
    });
  });

  describe("toggle interactions", () => {
    it("renders toggles for non-required categories", () => {
      pc.render();
      const toggles = shadowRoot.querySelectorAll('input[type="checkbox"][data-category-id]');
      expect(toggles.length).toBe(2);
    });

    it("syncs toggles from consent state on open", () => {
      consentState.setConsent("analytics", true);
      pc.render();
      pc.open();
      const cb = shadowRoot.querySelector<HTMLInputElement>('input[data-category-id="analytics"]');
      expect(cb?.checked).toBe(true);
    });

    it("defaults unchecked when no consent exists", () => {
      pc.render();
      pc.open();
      const cb = shadowRoot.querySelector<HTMLInputElement>('input[data-category-id="marketing"]');
      expect(cb?.checked).toBe(false);
    });
  });

  describe("save preferences", () => {
    it("persists toggle states via consentState.setConsent", () => {
      const spy = vi.spyOn(consentState, "setConsent");
      pc.render();
      pc.open();
      const analytics = shadowRoot.querySelector<HTMLInputElement>(
        'input[data-category-id="analytics"]',
      );
      if (analytics) analytics.checked = true;
      (shadowRoot.querySelector(".ca-btn--save") as HTMLElement)?.click();
      expect(spy).toHaveBeenCalledWith("analytics", true);
      expect(spy).toHaveBeenCalledWith("marketing", false);
    });

    it("closes modal after saving", () => {
      pc.render();
      pc.open();
      (shadowRoot.querySelector(".ca-btn--save") as HTMLElement)?.click();
      expect(shadowRoot.querySelector(".ca-overlay")?.hasAttribute("hidden")).toBe(true);
    });
  });

  describe("accept all", () => {
    it("calls consentState.acceptAll and closes", () => {
      const spy = vi.spyOn(consentState, "acceptAll");
      pc.render();
      pc.open();
      (shadowRoot.querySelector(".ca-btn--accept") as HTMLElement)?.click();
      expect(spy).toHaveBeenCalled();
      expect(shadowRoot.querySelector(".ca-overlay")?.hasAttribute("hidden")).toBe(true);
    });
  });

  describe("reject all", () => {
    it("calls consentState.rejectAll and closes", () => {
      const spy = vi.spyOn(consentState, "rejectAll");
      pc.render();
      pc.open();
      (shadowRoot.querySelector(".ca-btn--reject") as HTMLElement)?.click();
      expect(spy).toHaveBeenCalled();
      expect(shadowRoot.querySelector(".ca-overlay")?.hasAttribute("hidden")).toBe(true);
    });
  });
});
