// @vitest-environment jsdom
/**
 * @module tests/theme
 * Unit tests for the ThemeEngine, CSS variable generation, and theme merging.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  ThemeEngine,
  mergeTheme,
  buildThemeVariables,
  buildStylesheet,
  darkenColor,
} from "@/ui/theme";
import { DEFAULT_THEME } from "@/shared/constants";
import type { ThemeConfig } from "@/shared/types";

describe("darkenColor", () => {
  it("darkens a hex color by the default amount", () => {
    const result = darkenColor("#ffffff");
    expect(result).toBe("#e1e1e1");
  });

  it("darkens a hex color by a custom amount", () => {
    const result = darkenColor("#808080", 16);
    expect(result).toBe("#707070");
  });

  it("clamps to #000000 when darkening exceeds range", () => {
    const result = darkenColor("#101010", 50);
    expect(result).toBe("#000000");
  });

  it("handles the primary color default", () => {
    const result = darkenColor("#2563eb");
    expect(result).toBe("#0745cd");
  });
});

describe("mergeTheme", () => {
  it("returns defaults when no partial is provided", () => {
    const merged = mergeTheme();
    expect(merged).toEqual(DEFAULT_THEME);
  });

  it("returns defaults when an empty object is provided", () => {
    const merged = mergeTheme({});
    expect(merged).toEqual(DEFAULT_THEME);
  });

  it("overrides specific properties", () => {
    const partial: ThemeConfig = {
      mode: "dark",
      primaryColor: "#ff0000",
      borderRadius: 8,
    };
    const merged = mergeTheme(partial);
    expect(merged.mode).toBe("dark");
    expect(merged.primaryColor).toBe("#ff0000");
    expect(merged.borderRadius).toBe(8);
    expect(merged.acceptColor).toBe(DEFAULT_THEME.acceptColor);
    expect(merged.fontFamily).toBe(DEFAULT_THEME.fontFamily);
  });

  it("preserves all default keys in the output", () => {
    const merged = mergeTheme({ mode: "dark" });
    const keys = Object.keys(merged);
    for (const key of Object.keys(DEFAULT_THEME)) {
      expect(keys).toContain(key);
    }
  });
});

describe("buildThemeVariables", () => {
  it("produces CSS variable declarations for default theme", () => {
    const css = buildThemeVariables(DEFAULT_THEME);
    expect(css).toContain("--ca-color-primary: #2563eb;");
    expect(css).toContain("--ca-color-accept: #15803d;");
    expect(css).toContain("--ca-color-reject: #dc2626;");
    expect(css).toContain("--ca-color-bg: #ffffff;");
    expect(css).toContain("--ca-color-text: #1f2937;");
    expect(css).toContain("--ca-border-radius: 12px;");
    expect(css).toContain("--ca-font-size-base: 14px;");
    expect(css).toContain("--ca-max-width: 480px;");
    expect(css).toContain("--ca-z-index: 999999;");
    expect(css).toContain("--ca-color-primary-hover:");
  });

  it("reflects custom values", () => {
    const config = mergeTheme({ primaryColor: "#ff0000", fontSize: 16 });
    const css = buildThemeVariables(config);
    expect(css).toContain("--ca-color-primary: #ff0000;");
    expect(css).toContain("--ca-font-size-base: 16px;");
  });
});

describe("buildStylesheet", () => {
  it("includes :host block with variables", () => {
    const css = buildStylesheet(DEFAULT_THEME);
    expect(css).toContain(":host {");
    expect(css).toContain("--ca-color-primary:");
  });

  it("includes dark theme overrides", () => {
    const css = buildStylesheet(DEFAULT_THEME);
    expect(css).toContain(":host(.ca-theme-dark)");
    expect(css).toContain("--ca-color-bg: #1f2937;");
  });

  it("includes position classes", () => {
    const css = buildStylesheet(DEFAULT_THEME);
    expect(css).toContain(".ca-host--bottom-left");
    expect(css).toContain(".ca-host--bottom-right");
    expect(css).toContain(".ca-host--bottom-center");
    expect(css).toContain(".ca-host--top-center");
  });

  it("includes animation keyframes", () => {
    const css = buildStylesheet(DEFAULT_THEME);
    expect(css).toContain("@keyframes ca-slide-up");
    expect(css).toContain("@keyframes ca-fade-in");
    expect(css).toContain("@keyframes ca-fade-out");
  });

  it("includes animation utility classes", () => {
    const css = buildStylesheet(DEFAULT_THEME);
    expect(css).toContain(".ca-animate-slide-up");
    expect(css).toContain(".ca-animate-fade-in");
    expect(css).toContain(".ca-animate-fade-out");
  });

  it("includes overlay style", () => {
    const css = buildStylesheet(DEFAULT_THEME);
    expect(css).toContain(".ca-overlay");
  });
});

describe("ThemeEngine", () => {
  let engine: ThemeEngine;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    engine = new ThemeEngine(DEFAULT_THEME);
  });

  afterEach(() => {
    engine.destroy();
    container.remove();
  });

  describe("createShadowHost", () => {
    it("creates a shadow root inside a host element", () => {
      const shadowRoot = engine.createShadowHost(container);
      expect(shadowRoot).toBeTruthy();
      expect(shadowRoot.mode).toBe("open");
      const host = container.querySelector("#ca-cmp-root");
      expect(host).toBeTruthy();
    });

    it("injects a style element into the shadow root", () => {
      const shadowRoot = engine.createShadowHost(container);
      const style = shadowRoot.querySelector("style[data-ca-theme]");
      expect(style).toBeTruthy();
      expect(style?.textContent).toContain("--ca-color-primary");
    });

    it("applies light theme class by default", () => {
      engine.createShadowHost(container);
      const host = container.querySelector("#ca-cmp-root");
      expect(host?.classList.contains("ca-theme-light")).toBe(true);
    });
  });

  describe("getPositionClass", () => {
    it("returns correct class for each position", () => {
      const positions: Array<[Required<ThemeConfig>["position"], string]> = [
        ["bottom-left", "ca-host--bottom-left"],
        ["bottom-right", "ca-host--bottom-right"],
        ["bottom-center", "ca-host--bottom-center"],
        ["top-center", "ca-host--top-center"],
      ];
      for (const [position, expected] of positions) {
        const eng = new ThemeEngine(mergeTheme({ position }));
        expect(eng.getPositionClass()).toBe(expected);
        eng.destroy();
      }
    });
  });

  describe("getAnimationClass", () => {
    it("returns correct class for each animation", () => {
      const animations: Array<[Required<ThemeConfig>["animation"], string]> = [
        ["slide-up", "ca-animate-slide-up"],
        ["fade-in", "ca-animate-fade-in"],
        ["none", ""],
      ];
      for (const [animation, expected] of animations) {
        const eng = new ThemeEngine(mergeTheme({ animation }));
        expect(eng.getAnimationClass()).toBe(expected);
        eng.destroy();
      }
    });
  });

  describe("getEffectiveMode", () => {
    it("returns light when mode is light", () => {
      const eng = new ThemeEngine(mergeTheme({ mode: "light" }));
      expect(eng.getEffectiveMode()).toBe("light");
      eng.destroy();
    });

    it("returns dark when mode is dark", () => {
      const eng = new ThemeEngine(mergeTheme({ mode: "dark" }));
      expect(eng.getEffectiveMode()).toBe("dark");
      eng.destroy();
    });

    it("resolves auto mode (falls back to light in jsdom)", () => {
      const eng = new ThemeEngine(mergeTheme({ mode: "auto" }));
      const mode = eng.getEffectiveMode();
      expect(["light", "dark"]).toContain(mode);
      eng.destroy();
    });
  });

  describe("dark mode", () => {
    it("applies dark theme class when mode is dark", () => {
      const eng = new ThemeEngine(mergeTheme({ mode: "dark" }));
      eng.createShadowHost(container);
      const host = container.querySelector("#ca-cmp-root");
      expect(host?.classList.contains("ca-theme-dark")).toBe(true);
      eng.destroy();
    });
  });

  describe("updateTheme", () => {
    it("re-applies styles with new config", () => {
      const shadowRoot = engine.createShadowHost(container);
      const newConfig = mergeTheme({ primaryColor: "#ff0000" });
      engine.updateTheme(newConfig);
      const style = shadowRoot.querySelector("style[data-ca-theme]");
      expect(style?.textContent).toContain("--ca-color-primary: #ff0000;");
    });

    it("updates the stored config", () => {
      engine.createShadowHost(container);
      const newConfig = mergeTheme({ fontSize: 18 });
      engine.updateTheme(newConfig);
      expect(engine.getConfig().fontSize).toBe(18);
    });
  });

  describe("destroy", () => {
    it("removes the host element from the DOM", () => {
      engine.createShadowHost(container);
      expect(container.querySelector("#ca-cmp-root")).toBeTruthy();
      engine.destroy();
      expect(container.querySelector("#ca-cmp-root")).toBeNull();
    });

    it("nullifies shadowRoot reference", () => {
      engine.createShadowHost(container);
      engine.destroy();
      expect(engine.getShadowRoot()).toBeNull();
    });
  });

  describe("getConfig", () => {
    it("returns a copy of the config (not the original reference)", () => {
      const config = engine.getConfig();
      config.primaryColor = "#000000";
      expect(engine.getConfig().primaryColor).toBe(DEFAULT_THEME.primaryColor);
    });
  });
});
