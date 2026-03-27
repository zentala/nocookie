/**
 * @module ui/theme
 * Theme engine that maps ThemeConfig to CSS custom properties inside Shadow DOM.
 */

import type { ThemeConfig } from "@/shared/types";
import { buildStylesheet } from "@/ui/theme-css";

// Re-export CSS generation functions for backward compatibility
export { darkenColor, buildThemeVariables, buildStylesheet, mergeTheme } from "@/ui/theme-css";

/** Valid banner positions. */
type Position = Required<ThemeConfig>["position"];

/** Valid animation types. */
type Animation = Required<ThemeConfig>["animation"];

/** Position CSS class lookup. */
const POSITION_CLASSES: Record<Position, string> = {
  "bottom-left": "ca-host--bottom-left",
  "bottom-right": "ca-host--bottom-right",
  "bottom-center": "ca-host--bottom-center",
  "top-center": "ca-host--top-center",
};

/** Animation CSS class lookup. */
const ANIMATION_CLASSES: Record<Animation, string> = {
  "slide-up": "ca-animate-slide-up",
  "fade-in": "ca-animate-fade-in",
  none: "",
};

/**
 * Theme engine that manages Shadow DOM creation, CSS variable injection,
 * and auto theme detection for the NoCookie CMP.
 */
export class ThemeEngine {
  private config: Required<ThemeConfig>;
  private hostElement: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private mediaQuery: MediaQueryList | null = null;
  private mediaHandler: ((e: MediaQueryListEvent) => void) | null = null;

  /**
   * Create a new ThemeEngine with the given theme configuration.
   *
   * @param theme - Fully resolved theme config (all fields required)
   */
  constructor(theme: Required<ThemeConfig>) {
    this.config = { ...theme };
  }

  /**
   * Create a Shadow DOM host element and attach it to the given target.
   *
   * @param target - Parent element to attach the host to (defaults to document.body)
   * @returns The created ShadowRoot
   */
  createShadowHost(target?: HTMLElement): ShadowRoot {
    const parent = target ?? document.body;
    this.hostElement = document.createElement("div");
    this.hostElement.id = "ca-cmp-root";
    parent.appendChild(this.hostElement);

    this.shadowRoot = this.hostElement.attachShadow({ mode: "open" });
    this.applyTheme();
    this.setupAutoTheme();

    return this.shadowRoot;
  }

  /**
   * Inject theme CSS and apply classes to the Shadow DOM host.
   * Generates the full stylesheet and sets position/animation classes.
   */
  applyTheme(): void {
    if (!this.shadowRoot || !this.hostElement) return;

    const style = document.createElement("style");
    style.textContent = buildStylesheet(this.config);

    const existing = this.shadowRoot.querySelector("style[data-ca-theme]");
    if (existing) {
      existing.remove();
    }
    style.setAttribute("data-ca-theme", "true");
    this.shadowRoot.prepend(style);

    this.applyThemeClass();
  }

  /**
   * Get the CSS class name for the current banner position.
   *
   * @returns Position CSS class name
   */
  getPositionClass(): string {
    return POSITION_CLASSES[this.config.position];
  }

  /**
   * Get the CSS class name for the current animation type.
   *
   * @returns Animation CSS class name (empty string for "none")
   */
  getAnimationClass(): string {
    return ANIMATION_CLASSES[this.config.animation];
  }

  /**
   * Determine the effective theme mode, resolving "auto" to light/dark
   * based on the user's system preference.
   *
   * @returns "light" or "dark"
   */
  getEffectiveMode(): "light" | "dark" {
    if (this.config.mode !== "auto") {
      return this.config.mode;
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }

  /**
   * Set up a media query listener for automatic light/dark switching.
   * Only active when mode is set to "auto".
   */
  setupAutoTheme(): void {
    this.teardownAutoTheme();

    if (this.config.mode !== "auto") return;
    if (typeof window === "undefined" || !window.matchMedia) return;

    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.mediaHandler = () => {
      this.applyThemeClass();
    };
    this.mediaQuery.addEventListener("change", this.mediaHandler);
  }

  /**
   * Update the theme configuration and re-apply styles.
   *
   * @param theme - New theme config (all fields required)
   */
  updateTheme(theme: Required<ThemeConfig>): void {
    this.config = { ...theme };
    this.applyTheme();
    this.setupAutoTheme();
  }

  /**
   * Get the current Shadow DOM root, if created.
   *
   * @returns The ShadowRoot or null
   */
  getShadowRoot(): ShadowRoot | null {
    return this.shadowRoot;
  }

  /**
   * Get the current theme configuration.
   *
   * @returns A copy of the current theme config
   */
  getConfig(): Required<ThemeConfig> {
    return { ...this.config };
  }

  /**
   * Remove the host element, clean up event listeners, and release references.
   */
  destroy(): void {
    this.teardownAutoTheme();
    if (this.hostElement) {
      this.hostElement.remove();
    }
    this.hostElement = null;
    this.shadowRoot = null;
  }

  /** Apply the correct ca-theme-light or ca-theme-dark class to the host. */
  private applyThemeClass(): void {
    if (!this.hostElement) return;
    const mode = this.getEffectiveMode();
    this.hostElement.classList.remove("ca-theme-light", "ca-theme-dark");
    this.hostElement.classList.add(`ca-theme-${mode}`);
  }

  /** Remove the media query listener if present. */
  private teardownAutoTheme(): void {
    if (this.mediaQuery && this.mediaHandler) {
      this.mediaQuery.removeEventListener("change", this.mediaHandler);
    }
    this.mediaQuery = null;
    this.mediaHandler = null;
  }
}
