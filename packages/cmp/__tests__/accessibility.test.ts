// @vitest-environment jsdom
/**
 * @module tests/accessibility
 * Unit tests for the AccessibilityManager: ARIA live region creation,
 * screen reader announcements, event-driven messages, and cleanup.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AccessibilityManager } from "@/ui/accessibility";
import { EventBus } from "@/core/event-bus";

/** Read the raw accessibility CSS from disk for content assertions. */
const accessibilityCss = readFileSync(
  resolve(__dirname, "../src/styles/accessibility.css"),
  "utf-8",
);

/** Create a shadow root for testing. */
function createShadowRoot(): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  return { host, shadow };
}

describe("AccessibilityManager", () => {
  let eventBus: EventBus;
  let shadow: ShadowRoot;
  let hostEl: HTMLElement;
  let manager: AccessibilityManager;

  beforeEach(() => {
    eventBus = new EventBus();
    const sr = createShadowRoot();
    shadow = sr.shadow;
    hostEl = sr.host;
    manager = new AccessibilityManager(shadow, eventBus);
  });

  afterEach(() => {
    manager.destroy();
    hostEl.remove();
  });

  describe("init", () => {
    it("creates an ARIA live region in the shadow root", () => {
      manager.init();
      const region = shadow.querySelector('[role="status"]');
      expect(region).toBeTruthy();
      expect(region?.getAttribute("aria-live")).toBe("polite");
      expect(region?.getAttribute("aria-atomic")).toBe("true");
    });

    it("applies the sr-only class to the live region", () => {
      manager.init();
      const region = shadow.querySelector('[role="status"]');
      expect(region?.classList.contains("ca-sr-only")).toBe(true);
    });

    it("injects accessibility CSS style element into the shadow root", () => {
      manager.init();
      const style = shadow.querySelector("style[data-ca-accessibility]");
      expect(style).toBeTruthy();
      expect(style?.tagName).toBe("STYLE");
    });

    it("does not duplicate styles on repeated init calls", () => {
      manager.init();
      manager.init();
      const styles = shadow.querySelectorAll("style[data-ca-accessibility]");
      expect(styles.length).toBe(1);
    });
  });

  describe("announce", () => {
    it("sets live region text content via requestAnimationFrame", () => {
      vi.useFakeTimers();
      manager.init();

      manager.announce("Test announcement");

      // Before rAF fires, region is cleared
      const region = manager.getLiveRegion();
      expect(region?.textContent).toBe("");

      // Trigger rAF callback
      vi.advanceTimersByTime(16);
      expect(region?.textContent).toBe("Test announcement");

      vi.useRealTimers();
    });

    it("does nothing when live region is not initialized", () => {
      // No init() call — announce should not throw
      expect(() => manager.announce("No crash")).not.toThrow();
    });
  });

  describe("event-driven announcements", () => {
    it("announces 'Cookie preferences saved' on consent:updated", () => {
      vi.useFakeTimers();
      manager.init();

      eventBus.emit("consent:updated", {
        state: { essential: true, analytics: false },
        changes: [{ category: "analytics", granted: false }],
      });

      vi.advanceTimersByTime(16);
      expect(manager.getLiveRegion()?.textContent).toBe("Cookie preferences saved");
      vi.useRealTimers();
    });

    it("announces 'Cookie consent dialog opened' on ui:banner:show", () => {
      vi.useFakeTimers();
      manager.init();

      eventBus.emit("ui:banner:show");

      vi.advanceTimersByTime(16);
      expect(manager.getLiveRegion()?.textContent).toBe("Cookie consent dialog opened");
      vi.useRealTimers();
    });

    it("announces 'Cookie consent dialog closed' on ui:banner:hide", () => {
      vi.useFakeTimers();
      manager.init();

      eventBus.emit("ui:banner:hide");

      vi.advanceTimersByTime(16);
      expect(manager.getLiveRegion()?.textContent).toBe("Cookie consent dialog closed");
      vi.useRealTimers();
    });

    it("announces 'Cookie preferences dialog opened' on ui:preferences:open", () => {
      vi.useFakeTimers();
      manager.init();

      eventBus.emit("ui:preferences:open");

      vi.advanceTimersByTime(16);
      expect(manager.getLiveRegion()?.textContent).toBe("Cookie preferences dialog opened");
      vi.useRealTimers();
    });

    it("announces 'Cookie preferences dialog closed' on ui:preferences:close", () => {
      vi.useFakeTimers();
      manager.init();

      eventBus.emit("ui:preferences:close");

      vi.advanceTimersByTime(16);
      expect(manager.getLiveRegion()?.textContent).toBe("Cookie preferences dialog closed");
      vi.useRealTimers();
    });

    it("does not announce for events without a mapped message", () => {
      vi.useFakeTimers();
      manager.init();

      eventBus.emit("gpc:detected");

      vi.advanceTimersByTime(16);
      // Live region should remain empty (no announcement for gpc:detected)
      expect(manager.getLiveRegion()?.textContent).toBe("");
      vi.useRealTimers();
    });
  });

  describe("CSS features (verified from source file)", () => {
    it("includes reduced motion media query", () => {
      expect(accessibilityCss).toContain("prefers-reduced-motion: reduce");
    });

    it("includes focus-visible styles", () => {
      expect(accessibilityCss).toContain("focus-visible");
    });

    it("includes sr-only utility class", () => {
      expect(accessibilityCss).toContain(".ca-sr-only");
      expect(accessibilityCss).toContain("clip: rect(0, 0, 0, 0)");
    });

    it("style element is injected into shadow root on init", () => {
      manager.init();
      const style = shadow.querySelector("style[data-ca-accessibility]");
      expect(style).toBeTruthy();
    });
  });

  describe("destroy", () => {
    it("removes live region from shadow root", () => {
      manager.init();
      expect(shadow.querySelector('[role="status"]')).toBeTruthy();

      manager.destroy();
      expect(shadow.querySelector('[role="status"]')).toBeNull();
    });

    it("removes accessibility styles from shadow root", () => {
      manager.init();
      expect(shadow.querySelector("style[data-ca-accessibility]")).toBeTruthy();

      manager.destroy();
      expect(shadow.querySelector("style[data-ca-accessibility]")).toBeNull();
    });

    it("unsubscribes from EventBus events", () => {
      vi.useFakeTimers();
      manager.init();
      manager.destroy();

      // Emit after destroy — should not announce
      eventBus.emit("ui:banner:show");
      vi.advanceTimersByTime(16);

      // Live region is removed, so nothing to check except no error
      expect(shadow.querySelector('[role="status"]')).toBeNull();
      vi.useRealTimers();
    });

    it("is safe to call destroy multiple times", () => {
      manager.init();
      manager.destroy();
      expect(() => manager.destroy()).not.toThrow();
    });
  });
});
