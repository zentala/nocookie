/**
 * @module ui/banner-dom
 * DOM creation helpers for the cookie consent banner.
 * Builds the visual structure: icons, title, description text, and action buttons.
 */

import type { ResolvedCMPConfig, CategoryConfig } from "@/shared/types";
import { CATEGORY_META } from "@/shared/constants";

/**
 * Build category icon placeholder dots.
 *
 * @param categories - Array of category configs to render dots for
 * @returns Container element with colored dots
 */
export function createCategoryDots(categories: readonly CategoryConfig[]): HTMLElement {
  const container = document.createElement("div");
  container.className = "ca-banner__icons";

  for (const cat of categories) {
    const dot = document.createElement("span");
    dot.className = "ca-banner__icon-dot";
    dot.style.backgroundColor = getCategoryColor(cat);
    dot.title = cat.name ?? cat.id;
    container.appendChild(dot);
  }

  return container;
}

/**
 * Build the banner title element.
 *
 * @param title - Title text to display
 * @returns Heading element
 */
export function createTitle(title: string): HTMLElement {
  const el = document.createElement("h2");
  el.className = "ca-banner__title";
  el.textContent = title;
  return el;
}

/**
 * Build the banner description text with optional policy link.
 *
 * @param config - Resolved CMP config with translations and policyUrl
 * @returns Paragraph element with optional learn-more link
 */
export function createTextSection(config: ResolvedCMPConfig): HTMLElement {
  const p = document.createElement("p");
  p.className = "ca-banner__text";
  p.textContent = config.translations.bannerDescription;

  if (config.policyUrl) {
    const space = document.createTextNode(" ");
    p.appendChild(space);

    const link = document.createElement("a");
    link.className = "ca-banner__link";
    link.href = config.policyUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = config.translations.learnMore;
    p.appendChild(link);
  }

  return p;
}

/**
 * Build the action buttons row (reject, customize, accept).
 *
 * @param config - Resolved CMP config with translations and behavior flags
 * @param handlers - Click handlers for each action
 * @returns Container element with action buttons
 */
export function createActions(
  config: ResolvedCMPConfig,
  handlers: {
    onRejectAll: () => void;
    onCustomize: () => void;
    onAcceptAll: () => void;
  },
): HTMLElement {
  const actions = document.createElement("div");
  actions.className = "ca-banner__actions";

  if (config.behavior.rejectAllOnFirstLayer) {
    actions.appendChild(
      createButton("ca-btn ca-btn--reject", config.translations.rejectAll, handlers.onRejectAll),
    );
  }

  actions.appendChild(
    createButton("ca-btn ca-btn--customize", config.translations.customize, handlers.onCustomize),
  );

  actions.appendChild(
    createButton("ca-btn ca-btn--accept", config.translations.acceptAll, handlers.onAcceptAll),
  );

  return actions;
}

/**
 * Create a button element with click handler.
 *
 * @param className - CSS class name(s)
 * @param text - Button label
 * @param onClick - Click handler
 * @returns Configured button element
 */
function createButton(className: string, text: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = className;
  btn.textContent = text;
  btn.type = "button";
  btn.addEventListener("click", onClick);
  return btn;
}

/**
 * Resolve color for a category from standard metadata.
 *
 * @param cat - Category config
 * @returns Hex color string
 */
function getCategoryColor(cat: CategoryConfig): string {
  return CATEGORY_META[cat.id]?.color ?? "#6b7280";
}
