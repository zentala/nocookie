/**
 * @module ui/theme-css
 * CSS generation functions for theming: stylesheet building, variable injection,
 * dark mode overrides, position/animation styles, and color utilities.
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
 * Merge a partial ThemeConfig with defaults to produce a fully resolved config.
 *
 * @param partial - User-provided partial theme config
 * @returns Fully resolved theme config with all defaults applied
 */
export function mergeTheme(partial?: ThemeConfig): Required<ThemeConfig> {
  return { ...DEFAULT_THEME, ...partial };
}
