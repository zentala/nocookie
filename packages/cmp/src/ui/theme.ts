/**
 * @module ui/theme
 * Theme engine that maps ThemeConfig to CSS custom properties inside Shadow DOM.
 */

import type { ThemeConfig } from "@/shared/types";
import { DEFAULT_THEME } from "@/shared/constants";

/** CSS variable mapping from ThemeConfig properties to custom property names. */
const THEME_VAR_MAP: Record<string, string> = {
  primaryColor: "--ca-color-primary",
  acceptColor: "--ca-color-accept",
  rejectColor: "--ca-color-reject",
  backgroundColor: "--ca-color-bg",
  textColor: "--ca-color-text",
  fontFamily: "--ca-font-family",
};

/** CSS variable mapping for numeric properties that need unit suffixes. */
const THEME_PX_MAP: Record<string, string> = {
  borderRadius: "--ca-border-radius",
  fontSize: "--ca-font-size-base",
  maxWidth: "--ca-max-width",
};

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
 * Generate a darker shade of a hex color for hover states.
 *
 * @param hex - Hex color string (e.g. "#2563eb")
 * @param amount - Darkening amount (0-255, default 30)
 * @returns Darkened hex color
 */
export function darkenColor(hex: string, amount = 30): string {
  const cleaned = hex.replace("#", "");
  const num = parseInt(cleaned, 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Build CSS custom property declarations from a resolved theme config.
 *
 * @param config - Fully resolved theme config with all defaults applied
 * @returns CSS text containing custom property declarations
 */
export function buildThemeVariables(config: Required<ThemeConfig>): string {
  const lines: string[] = [];

  for (const [key, varName] of Object.entries(THEME_VAR_MAP)) {
    const value = config[key as keyof ThemeConfig];
    if (value !== undefined) {
      lines.push(`  ${varName}: ${String(value)};`);
    }
  }

  for (const [key, varName] of Object.entries(THEME_PX_MAP)) {
    const value = config[key as keyof ThemeConfig];
    if (value !== undefined) {
      lines.push(`  ${varName}: ${String(value)}px;`);
    }
  }

  lines.push(`  --ca-z-index: ${String(config.zIndex)};`);
  lines.push(`  --ca-color-primary-hover: ${darkenColor(config.primaryColor)};`);

  return lines.join("\n");
}

/**
 * Build the complete CSS stylesheet for injection into Shadow DOM.
 *
 * Includes base variables, dark theme overrides, position styles,
 * and animation keyframes as a single string.
 *
 * @param config - Fully resolved theme config
 * @returns Complete CSS string ready for Shadow DOM injection
 */
export function buildStylesheet(config: Required<ThemeConfig>): string {
  const vars = buildThemeVariables(config);

  return `
:host {
${vars}
  display: block;
  font-family: var(--ca-font-family);
  font-size: var(--ca-font-size-base);
  line-height: 1.5;
  color: var(--ca-color-text);
  box-sizing: border-box;
}
:host *,
:host *::before,
:host *::after {
  box-sizing: inherit;
}
:host([hidden]) {
  display: none;
}
:host(.ca-theme-dark) {
  --ca-color-bg: #1f2937;
  --ca-color-text: #f9fafb;
  --ca-color-text-secondary: #9ca3af;
  --ca-color-border: #374151;
  --ca-color-overlay: rgba(0, 0, 0, 0.7);
}
.ca-host {
  position: fixed;
  z-index: var(--ca-z-index);
  max-width: var(--ca-max-width);
  width: calc(100% - 32px);
}
.ca-host--bottom-left { bottom: 16px; left: 16px; }
.ca-host--bottom-right { bottom: 16px; right: 16px; }
.ca-host--bottom-center { bottom: 16px; left: 50%; transform: translateX(-50%); }
.ca-host--top-center { top: 16px; left: 50%; transform: translateX(-50%); }
@keyframes ca-slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes ca-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes ca-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
.ca-animate-slide-up { animation: ca-slide-up 0.3s ease-out forwards; }
.ca-animate-fade-in { animation: ca-fade-in 0.3s ease-out forwards; }
.ca-animate-fade-out { animation: ca-fade-out 0.2s ease-in forwards; }
.ca-overlay {
  position: fixed;
  inset: 0;
  background: var(--ca-color-overlay);
  z-index: calc(var(--ca-z-index) - 1);
}
`;
}

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

/**
 * Merge a partial ThemeConfig with defaults to produce a fully resolved config.
 *
 * @param partial - User-provided partial theme config
 * @returns Fully resolved theme config with all defaults applied
 */
export function mergeTheme(partial?: ThemeConfig): Required<ThemeConfig> {
  return { ...DEFAULT_THEME, ...partial };
}
