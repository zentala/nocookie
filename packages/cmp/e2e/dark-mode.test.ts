// @vitest-environment jsdom
/**
 * @module e2e/dark-mode
 * Integration tests for dark mode theme application.
 * Validates CSS custom property injection, theme class toggling,
 * and auto-detection based on system preference.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { setupCMP, shadowQuery, type CMPTestHarness } from "./helpers";
import { DEFAULT_THEME } from "@/shared/constants";
import { ThemeEngine, buildStylesheet } from "@/ui/theme";

describe("Dark Mode", () => {
  let harness: CMPTestHarness;

  afterEach(() => {
    harness?.destroy();
  });

  describe("Light mode (default)", () => {
    it("should apply ca-theme-light class by default", () => {
      harness = setupCMP();
      const host = harness.shadowRoot.host as HTMLElement;
      expect(host.classList.contains("ca-theme-light")).toBe(true);
      expect(host.classList.contains("ca-theme-dark")).toBe(false);
    });

    it("should inject theme CSS variables into shadow root", () => {
      harness = setupCMP();
      const style = shadowQuery(harness.shadowRoot, "style[data-ca-theme]");
      expect(style).not.toBeNull();
      expect(style!.textContent).toContain("--ca-color-primary");
      expect(style!.textContent).toContain("--ca-color-bg");
      expect(style!.textContent).toContain("--ca-color-text");
    });
  });

  describe("Dark mode explicit", () => {
    it("should apply ca-theme-dark class when mode is dark", () => {
      harness = setupCMP({
        theme: { ...DEFAULT_THEME, mode: "dark" },
      });
      const host = harness.shadowRoot.host as HTMLElement;
      expect(host.classList.contains("ca-theme-dark")).toBe(true);
      expect(host.classList.contains("ca-theme-light")).toBe(false);
    });

    it("should include dark mode CSS overrides in stylesheet", () => {
      const css = buildStylesheet({ ...DEFAULT_THEME, mode: "dark" });
      expect(css).toContain(".ca-theme-dark");
      expect(css).toContain("--ca-color-bg: #1f2937");
      expect(css).toContain("--ca-color-text: #f9fafb");
    });
  });

  describe("Auto mode", () => {
    it("should detect light mode when prefers-color-scheme is light", () => {
      const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
      }));
      Object.defineProperty(window, "matchMedia", {
        value: mockMatchMedia,
        writable: true,
      });

      harness = setupCMP({
        theme: { ...DEFAULT_THEME, mode: "auto" },
      });
      const host = harness.shadowRoot.host as HTMLElement;
      expect(host.classList.contains("ca-theme-light")).toBe(true);
    });

    it("should detect dark mode when prefers-color-scheme is dark", () => {
      const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("dark"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
      }));
      Object.defineProperty(window, "matchMedia", {
        value: mockMatchMedia,
        writable: true,
      });

      harness = setupCMP({
        theme: { ...DEFAULT_THEME, mode: "auto" },
      });
      const host = harness.shadowRoot.host as HTMLElement;
      expect(host.classList.contains("ca-theme-dark")).toBe(true);
    });
  });

  describe("Theme customization", () => {
    it("should apply custom primary color", () => {
      harness = setupCMP({
        theme: { ...DEFAULT_THEME, primaryColor: "#ff0000" },
      });
      const style = shadowQuery(harness.shadowRoot, "style[data-ca-theme]");
      expect(style!.textContent).toContain("#ff0000");
    });

    it("should apply custom font family", () => {
      harness = setupCMP({
        theme: { ...DEFAULT_THEME, fontFamily: "Comic Sans MS" },
      });
      const style = shadowQuery(harness.shadowRoot, "style[data-ca-theme]");
      expect(style!.textContent).toContain("Comic Sans MS");
    });

    it("should apply custom border radius", () => {
      harness = setupCMP({
        theme: { ...DEFAULT_THEME, borderRadius: 20 },
      });
      const style = shadowQuery(harness.shadowRoot, "style[data-ca-theme]");
      expect(style!.textContent).toContain("20px");
    });
  });

  describe("Theme update", () => {
    it("should re-apply theme when updateTheme is called", () => {
      harness = setupCMP();
      const host = harness.shadowRoot.host as HTMLElement;
      expect(host.classList.contains("ca-theme-light")).toBe(true);

      harness.themeEngine.updateTheme({
        ...DEFAULT_THEME,
        mode: "dark",
      });

      expect(host.classList.contains("ca-theme-dark")).toBe(true);
    });
  });

  describe("Position classes", () => {
    it("should return correct position class for bottom-left", () => {
      const engine = new ThemeEngine({ ...DEFAULT_THEME, position: "bottom-left" });
      expect(engine.getPositionClass()).toBe("ca-host--bottom-left");
      engine.destroy();
    });

    it("should return correct position class for top-center", () => {
      const engine = new ThemeEngine({ ...DEFAULT_THEME, position: "top-center" });
      expect(engine.getPositionClass()).toBe("ca-host--top-center");
      engine.destroy();
    });
  });

  describe("Animation classes", () => {
    it("should return slide-up animation class", () => {
      const engine = new ThemeEngine({ ...DEFAULT_THEME, animation: "slide-up" });
      expect(engine.getAnimationClass()).toBe("ca-animate-slide-up");
      engine.destroy();
    });

    it("should return empty string for no animation", () => {
      const engine = new ThemeEngine({ ...DEFAULT_THEME, animation: "none" });
      expect(engine.getAnimationClass()).toBe("");
      engine.destroy();
    });
  });
});
