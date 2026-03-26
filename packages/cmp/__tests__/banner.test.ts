// @vitest-environment jsdom
/**
 * @module tests/banner
 * Unit tests for the Banner component: DOM generation, button actions,
 * show/hide logic, accessibility, and translations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Banner } from "@/ui/banner";
import { ConsentStateManager } from "@/core/consent-state";
import { EventBus } from "@/core/event-bus";
import type { ResolvedCMPConfig } from "@/shared/types";
import {
  DEFAULT_THEME,
  DEFAULT_BEHAVIOR,
  DEFAULT_TRANSLATIONS,
  DEFAULT_WELL_KNOWN,
  DEFAULT_POLICY_PAGE,
} from "@/shared/constants";

/** Build a minimal resolved config for testing. */
function createConfig(overrides?: Partial<ResolvedCMPConfig>): ResolvedCMPConfig {
  return {
    siteName: "Test Site",
    categories: [{ id: "essential", required: true }, { id: "analytics" }, { id: "marketing" }],
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

/** Create a shadow root for testing. */
function createShadowRoot(): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  return { host, shadow };
}

describe("Banner", () => {
  let config: ResolvedCMPConfig;
  let consentState: ConsentStateManager;
  let eventBus: EventBus;
  let shadow: ShadowRoot;
  let hostEl: HTMLElement;
  let banner: Banner;

  beforeEach(() => {
    config = createConfig();
    consentState = new ConsentStateManager(config);
    eventBus = new EventBus();
    const sr = createShadowRoot();
    shadow = sr.shadow;
    hostEl = sr.host;
    banner = new Banner(config, consentState, eventBus, shadow);
  });

  afterEach(() => {
    banner.destroy();
    hostEl.remove();
  });

  describe("render", () => {
    it("creates the banner element in the shadow root", () => {
      banner.render();
      const el = shadow.querySelector(".ca-banner");
      expect(el).toBeTruthy();
    });

    it("injects banner CSS style element into the shadow root", () => {
      banner.render();
      const style = shadow.querySelector("style[data-ca-banner]");
      expect(style).toBeTruthy();
      expect(style?.tagName).toBe("STYLE");
    });

    it("renders the banner title from translations", () => {
      banner.render();
      const title = shadow.querySelector(".ca-banner__title");
      expect(title?.textContent).toBe("Cookie Consent");
    });

    it("renders the banner description from translations", () => {
      banner.render();
      const text = shadow.querySelector(".ca-banner__text");
      expect(text?.textContent).toContain("We use cookies to enhance your browsing experience");
    });

    it("renders category icon dots for each category", () => {
      banner.render();
      const dots = shadow.querySelectorAll(".ca-banner__icon-dot");
      expect(dots.length).toBe(3);
    });

    it("renders Accept All button with correct text", () => {
      banner.render();
      const btn = shadow.querySelector(".ca-btn--accept");
      expect(btn?.textContent).toBe("Accept All");
    });

    it("renders Reject All button with correct text", () => {
      banner.render();
      const btn = shadow.querySelector(".ca-btn--reject");
      expect(btn?.textContent).toBe("Reject All");
    });

    it("renders Customize button with correct text", () => {
      banner.render();
      const btn = shadow.querySelector(".ca-btn--customize");
      expect(btn?.textContent).toBe("Customize");
    });

    it("starts hidden", () => {
      banner.render();
      const el = shadow.querySelector(".ca-banner");
      expect(el?.classList.contains("ca-banner--hidden")).toBe(true);
    });
  });

  describe("ARIA attributes", () => {
    it("has role=dialog on the banner", () => {
      banner.render();
      const el = shadow.querySelector(".ca-banner");
      expect(el?.getAttribute("role")).toBe("dialog");
    });

    it("has aria-label matching banner title", () => {
      banner.render();
      const el = shadow.querySelector(".ca-banner");
      expect(el?.getAttribute("aria-label")).toBe("Cookie Consent");
    });

    it("buttons have type=button", () => {
      banner.render();
      const buttons = shadow.querySelectorAll("button");
      for (const btn of buttons) {
        expect(btn.type).toBe("button");
      }
    });
  });

  describe("policy link", () => {
    it("renders learn more link when policyUrl is set", () => {
      const cfg = createConfig({ policyUrl: "https://example.com/privacy" });
      const b = new Banner(cfg, consentState, eventBus, shadow);
      b.render();
      const link = shadow.querySelector(".ca-banner__link");
      expect(link).toBeTruthy();
      expect(link?.getAttribute("href")).toBe("https://example.com/privacy");
      expect(link?.textContent).toBe("Learn more");
      b.destroy();
    });

    it("does not render link when policyUrl is absent", () => {
      banner.render();
      const link = shadow.querySelector(".ca-banner__link");
      expect(link).toBeNull();
    });

    it("sets target=_blank and rel=noopener noreferrer on link", () => {
      const cfg = createConfig({ policyUrl: "https://example.com/privacy" });
      const b = new Banner(cfg, consentState, eventBus, shadow);
      b.render();
      const link = shadow.querySelector(".ca-banner__link");
      expect(link?.getAttribute("target")).toBe("_blank");
      expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
      b.destroy();
    });
  });

  describe("rejectAllOnFirstLayer", () => {
    it("hides Reject All button when rejectAllOnFirstLayer is false", () => {
      const cfg = createConfig({
        behavior: { ...DEFAULT_BEHAVIOR, rejectAllOnFirstLayer: false },
      });
      const b = new Banner(cfg, consentState, eventBus, shadow);
      b.render();
      const btn = shadow.querySelector(".ca-btn--reject");
      expect(btn).toBeNull();
      b.destroy();
    });
  });

  describe("show", () => {
    it("removes the hidden class", () => {
      banner.render();
      banner.show();
      const el = shadow.querySelector(".ca-banner");
      expect(el?.classList.contains("ca-banner--hidden")).toBe(false);
    });

    it("adds entrance animation class based on theme", () => {
      banner.render();
      banner.show();
      const el = shadow.querySelector(".ca-banner");
      expect(el?.classList.contains("ca-animate-slide-up")).toBe(true);
    });

    it("emits ui:banner:show event", () => {
      const handler = vi.fn();
      eventBus.on("ui:banner:show", handler);
      banner.render();
      banner.show();
      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe("hide", () => {
    it("adds exiting class immediately", () => {
      banner.render();
      banner.show();
      banner.hide();
      const el = shadow.querySelector(".ca-banner");
      expect(el?.classList.contains("ca-banner--exiting")).toBe(true);
    });

    it("adds hidden class after animation timeout", () => {
      vi.useFakeTimers();
      banner.render();
      banner.show();
      banner.hide();
      vi.advanceTimersByTime(250);
      const el = shadow.querySelector(".ca-banner");
      expect(el?.classList.contains("ca-banner--hidden")).toBe(true);
      vi.useRealTimers();
    });

    it("emits ui:banner:hide event after animation", () => {
      vi.useFakeTimers();
      const handler = vi.fn();
      eventBus.on("ui:banner:hide", handler);
      banner.render();
      banner.show();
      banner.hide();
      expect(handler).not.toHaveBeenCalled();
      vi.advanceTimersByTime(250);
      expect(handler).toHaveBeenCalledOnce();
      vi.useRealTimers();
    });
  });

  describe("shouldShow", () => {
    it("returns true when no consent has been given", () => {
      expect(banner.shouldShow()).toBe(true);
    });

    it("returns false after consent is given", () => {
      consentState.acceptAll();
      expect(banner.shouldShow()).toBe(false);
    });

    it("returns true when showOnEveryVisit is enabled", () => {
      const cfg = createConfig({
        behavior: { ...DEFAULT_BEHAVIOR, showOnEveryVisit: true },
      });
      const b = new Banner(cfg, consentState, eventBus, shadow);
      consentState.acceptAll();
      expect(b.shouldShow()).toBe(true);
      b.destroy();
    });
  });

  describe("button actions", () => {
    it("Accept All calls consentState.acceptAll and emits consent:updated", () => {
      const spy = vi.spyOn(consentState, "acceptAll");
      const handler = vi.fn();
      eventBus.on("consent:updated", handler);

      banner.render();
      const btn = shadow.querySelector(".ca-btn--accept") as HTMLElement;
      btn.click();

      expect(spy).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledOnce();
    });

    it("Reject All calls consentState.rejectAll and emits consent:updated", () => {
      const spy = vi.spyOn(consentState, "rejectAll");
      const handler = vi.fn();
      eventBus.on("consent:updated", handler);

      banner.render();
      const btn = shadow.querySelector(".ca-btn--reject") as HTMLElement;
      btn.click();

      expect(spy).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledOnce();
    });

    it("Customize emits ui:preferences:open", () => {
      const handler = vi.fn();
      eventBus.on("ui:preferences:open", handler);

      banner.render();
      const btn = shadow.querySelector(".ca-btn--customize") as HTMLElement;
      btn.click();

      expect(handler).toHaveBeenCalledOnce();
    });

    it("Accept All hides the banner", () => {
      banner.render();
      banner.show();
      const btn = shadow.querySelector(".ca-btn--accept") as HTMLElement;
      btn.click();
      const el = shadow.querySelector(".ca-banner");
      expect(el?.classList.contains("ca-banner--exiting")).toBe(true);
    });
  });

  describe("translations", () => {
    it("uses custom translation strings", () => {
      const cfg = createConfig({
        translations: {
          ...DEFAULT_TRANSLATIONS,
          bannerTitle: "Eigene Zustimmung",
          bannerDescription: "Wir verwenden Cookies.",
          acceptAll: "Alle akzeptieren",
          rejectAll: "Alle ablehnen",
          customize: "Anpassen",
        },
      });
      const b = new Banner(cfg, consentState, eventBus, shadow);
      b.render();

      expect(shadow.querySelector(".ca-banner__title")?.textContent).toBe("Eigene Zustimmung");
      expect(shadow.querySelector(".ca-banner__text")?.textContent).toContain(
        "Wir verwenden Cookies.",
      );
      expect(shadow.querySelector(".ca-btn--accept")?.textContent).toBe("Alle akzeptieren");
      expect(shadow.querySelector(".ca-btn--reject")?.textContent).toBe("Alle ablehnen");
      expect(shadow.querySelector(".ca-btn--customize")?.textContent).toBe("Anpassen");
      b.destroy();
    });
  });

  describe("destroy", () => {
    it("removes banner element from shadow root", () => {
      banner.render();
      expect(shadow.querySelector(".ca-banner")).toBeTruthy();
      banner.destroy();
      expect(shadow.querySelector(".ca-banner")).toBeNull();
    });

    it("removes banner styles from shadow root", () => {
      banner.render();
      expect(shadow.querySelector("style[data-ca-banner]")).toBeTruthy();
      banner.destroy();
      expect(shadow.querySelector("style[data-ca-banner]")).toBeNull();
    });
  });
});
