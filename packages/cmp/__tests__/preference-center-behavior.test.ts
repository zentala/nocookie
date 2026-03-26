// @vitest-environment jsdom
/**
 * @module tests/preference-center-behavior
 * Unit tests for PreferenceCenter behavior: open/close lifecycle,
 * escape key, focus trap, collapsible details, cookie table, destroy.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PreferenceCenter } from "@/ui/preference-center";
import { EventBus } from "@/core/event-bus";
import { ConsentStateManager } from "@/core/consent-state";
import type { ResolvedCMPConfig, CategoryConfig } from "@/shared/types";
import { makeConfig, createShadowHost } from "./preference-center.helpers";

describe("PreferenceCenter behavior", () => {
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

  describe("open / close", () => {
    it("shows overlay on open", () => {
      pc.render();
      pc.open();
      expect(shadowRoot.querySelector(".ca-overlay")?.hidden).toBe(false);
    });

    it("hides overlay on close", () => {
      pc.render();
      pc.open();
      pc.close();
      expect(shadowRoot.querySelector(".ca-overlay")?.hidden).toBe(true);
    });

    it("emits ui:preferences:close on close", () => {
      const handler = vi.fn();
      eventBus.on("ui:preferences:close", handler);
      pc.render();
      pc.open();
      pc.close();
      expect(handler).toHaveBeenCalled();
    });

    it("close button hides modal", () => {
      pc.render();
      pc.open();
      (shadowRoot.querySelector(".ca-prefs__close") as HTMLElement)?.click();
      expect(shadowRoot.querySelector(".ca-overlay")?.hidden).toBe(true);
    });

    it("opens via eventBus ui:preferences:open", () => {
      pc.render();
      eventBus.emit("ui:preferences:open");
      expect(shadowRoot.querySelector(".ca-overlay")?.hidden).toBe(false);
    });
  });

  describe("escape key", () => {
    it("closes modal on Escape keydown", () => {
      pc.render();
      pc.open();
      shadowRoot.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      expect(shadowRoot.querySelector(".ca-overlay")?.hidden).toBe(true);
    });
  });

  describe("collapsible details", () => {
    it("toggles cookie detail table visibility", () => {
      const cats: CategoryConfig[] = [
        {
          id: "analytics",
          cookies: [{ name: "_ga", provider: "Google", duration: "2y", purpose: "Analytics" }],
        },
      ];
      const cfg = makeConfig(cats);
      const cs = new ConsentStateManager(cfg);
      const eb = new EventBus();
      const sr = createShadowHost();
      const pref = new PreferenceCenter(cfg, cs, eb, sr);

      pref.render();
      const details = sr.querySelector(".ca-category__details") as HTMLElement;
      expect(details?.hidden).toBe(true);

      const toggleBtn = sr.querySelector(".ca-category__toggle-details") as HTMLElement;
      toggleBtn?.click();
      expect(details?.hidden).toBe(false);
      expect(toggleBtn?.getAttribute("aria-expanded")).toBe("true");

      toggleBtn?.click();
      expect(details?.hidden).toBe(true);
      expect(toggleBtn?.getAttribute("aria-expanded")).toBe("false");
    });
  });

  describe("cookie table", () => {
    it("renders cookie declarations in table rows", () => {
      const cats: CategoryConfig[] = [
        {
          id: "functional",
          cookies: [
            { name: "lang", provider: "Site", duration: "1y", purpose: "Language" },
            { name: "theme", provider: "Site", duration: "1y", purpose: "Theme pref" },
          ],
        },
      ];
      const cfg = makeConfig(cats);
      const cs = new ConsentStateManager(cfg);
      const eb = new EventBus();
      const sr = createShadowHost();
      const pref = new PreferenceCenter(cfg, cs, eb, sr);

      pref.render();
      const rows = sr.querySelectorAll(".ca-cookie-table tbody tr");
      expect(rows.length).toBe(2);
      expect(rows[0].querySelector("td")?.textContent).toBe("lang");
    });
  });

  describe("destroy", () => {
    it("removes overlay and unsubscribes from events", () => {
      pc.render();
      pc.open();
      pc.destroy();

      expect(shadowRoot.querySelector(".ca-overlay")).toBeNull();
      eventBus.emit("ui:preferences:open");
      expect(shadowRoot.querySelector(".ca-overlay")).toBeNull();
    });
  });
});
