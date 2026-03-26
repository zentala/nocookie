/**
 * Generic heuristic detector for unknown cookie consent popups.
 *
 * Last resort — used only when no CMP is identified by other layers.
 * Scans for common consent UI patterns across multiple languages.
 */

import type { CMPRule } from "@/shared/types";
import type { RuleSource } from "@/background/rule-engine";

/** Button text patterns for "accept all" in multiple languages. */
const ACCEPT_ALL_PATTERNS: RegExp[] = [
  // English
  /accept\s*all/i,
  /accept\s*cookies/i,
  /i\s*agree/i,
  /agree\s*&?\s*close/i,
  /got\s*it/i,
  /allow\s*all/i,
  // German
  /alle\s*akzeptieren/i,
  /alle\s*annehmen/i,
  /zustimmen/i,
  /einverstanden/i,
  // French
  /tout\s*accepter/i,
  /j'accepte/i,
  /accepter/i,
  // Spanish
  /aceptar\s*todo/i,
  /acepto/i,
  // Polish
  /zaakceptuj\s*wszystkie/i,
  /akceptuję/i,
  /zgadzam\s*się/i,
  // Dutch
  /alles\s*accepteren/i,
  /akkoord/i,
  // Italian
  /accetta\s*tutto/i,
  /accetto/i,
];

/** Button text patterns for "reject all" in multiple languages. */
const REJECT_ALL_PATTERNS: RegExp[] = [
  /reject\s*all/i,
  /decline/i,
  /refuse/i,
  /deny/i,
  /nur\s*notwendige/i,
  /nur\s*erforderliche/i,
  /ablehnen/i,
  /tout\s*refuser/i,
  /refuser/i,
  /rechazar\s*todo/i,
  /rechazar/i,
  /odrzuć\s*wszystkie/i,
  /odrzuć/i,
  /alles\s*weigeren/i,
  /weigeren/i,
  /rifiuta\s*tutto/i,
  /rifiuta/i,
  /necessary\s*only/i,
  /essential\s*only/i,
];

/** Button text patterns for "settings/preferences" in multiple languages. */
const SETTINGS_PATTERNS: RegExp[] = [
  /manage\s*(cookie\s*)?settings/i,
  /cookie\s*settings/i,
  /preferences/i,
  /customize/i,
  /einstellungen/i,
  /paramètres/i,
  /configurar/i,
  /ustawienia/i,
  /instellingen/i,
  /impostazioni/i,
];

/** Keywords indicating cookie consent content. */
const COOKIE_KEYWORDS: string[] = [
  "cookie",
  "cookies",
  "consent",
  "privacy",
  "gdpr",
  "dsgvo",
  "datenschutz",
  "données",
  "privacidad",
  "ciasteczka",
  "prywatność",
];

/** Minimum confidence score to consider a detection valid. */
const MIN_CONFIDENCE = 30;

/** Result of a heuristic scan of the page. */
export interface HeuristicScanResult {
  overlay: HTMLElement | null;
  acceptBtn: HTMLElement | null;
  rejectBtn: HTMLElement | null;
  settingsBtn: HTMLElement | null;
  confidence: number;
}

/**
 * Check if an element has fixed or sticky positioning.
 */
function isFixedOrSticky(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  return style.position === "fixed" || style.position === "sticky";
}

/**
 * Check if element text contains cookie-related keywords.
 */
function containsCookieKeywords(el: HTMLElement): boolean {
  const text = (el.textContent ?? "").toLowerCase();
  return COOKIE_KEYWORDS.some((kw) => text.includes(kw));
}

/**
 * Find a button inside a container matching any of the given patterns.
 */
function findButtonByPatterns(container: HTMLElement, patterns: RegExp[]): HTMLElement | null {
  const candidates = container.querySelectorAll(
    "button, a[role='button'], [role='button'], input[type='submit'], input[type='button']",
  );
  for (const el of candidates) {
    const text = (el.textContent ?? "").trim();
    if (patterns.some((p) => p.test(text))) {
      return el as HTMLElement;
    }
  }
  return null;
}

/** Find the "accept all" button inside a container. */
export function findAcceptButton(container: HTMLElement): HTMLElement | null {
  return findButtonByPatterns(container, ACCEPT_ALL_PATTERNS);
}

/** Find the "reject all" button inside a container. */
export function findRejectButton(container: HTMLElement): HTMLElement | null {
  return findButtonByPatterns(container, REJECT_ALL_PATTERNS);
}

/** Find the "settings/preferences" button inside a container. */
export function findSettingsButton(container: HTMLElement): HTMLElement | null {
  return findButtonByPatterns(container, SETTINGS_PATTERNS);
}

/**
 * Score how likely an element is a cookie consent popup (0-100).
 *
 * Factors: fixed/sticky positioning, cookie keywords, presence of
 * accept/reject buttons, overlay-like dimensions.
 */
export function scoreConsentLikelihood(element: HTMLElement): number {
  let score = 0;

  if (isFixedOrSticky(element)) score += 30;
  if (containsCookieKeywords(element)) score += 30;
  if (findAcceptButton(element)) score += 20;
  if (findRejectButton(element)) score += 10;

  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth || 800;
  if (rect.width > viewportWidth * 0.3) score += 10;

  return Math.min(score, 100);
}

/**
 * Find the most likely cookie consent overlay on the page.
 *
 * Scans all fixed/sticky elements for cookie-related text and buttons.
 * Returns the element with the highest consent likelihood score.
 */
export function findConsentOverlay(): HTMLElement | null {
  const allElements = document.querySelectorAll("div, section, aside, dialog");
  let best: HTMLElement | null = null;
  let bestScore = 0;

  for (const el of allElements) {
    const htmlEl = el as HTMLElement;
    if (!isFixedOrSticky(htmlEl) && !containsCookieKeywords(htmlEl)) continue;

    const score = scoreConsentLikelihood(htmlEl);
    if (score > bestScore) {
      bestScore = score;
      best = htmlEl;
    }
  }

  return bestScore >= MIN_CONFIDENCE ? best : null;
}

/**
 * Run a full heuristic scan of the current page.
 *
 * Finds the consent overlay, locates accept/reject/settings buttons,
 * and computes a confidence score.
 */
export function heuristicScan(): HeuristicScanResult {
  const overlay = findConsentOverlay();
  if (!overlay) {
    return { overlay: null, acceptBtn: null, rejectBtn: null, settingsBtn: null, confidence: 0 };
  }

  return {
    overlay,
    acceptBtn: findAcceptButton(overlay),
    rejectBtn: findRejectButton(overlay),
    settingsBtn: findSettingsButton(overlay),
    confidence: scoreConsentLikelihood(overlay),
  };
}

/**
 * Build a heuristic CMPRule from detected elements.
 *
 * Creates click-based action sequences targeting the detected buttons.
 * Returns null if no overlay or no actionable buttons found.
 */
export function buildHeuristicRule(scanResult: HeuristicScanResult): CMPRule | null {
  if (!scanResult.overlay || !scanResult.acceptBtn) return null;

  const acceptSelector = buildUniqueSelector(scanResult.acceptBtn);
  const rejectSelector = scanResult.rejectBtn
    ? buildUniqueSelector(scanResult.rejectBtn)
    : acceptSelector;

  return {
    name: "heuristic",
    detection: { domSelectors: [] },
    categoryMapping: {
      functional: "unknown",
      analytics: "unknown",
      marketing: "unknown",
    },
    actions: {
      acceptAll: [{ type: "click", target: acceptSelector }],
      rejectAll: [{ type: "click", target: rejectSelector }],
      custom: [],
    },
  };
}

/**
 * Build a reasonably unique CSS selector for an element.
 *
 * Uses id, then class + tag, then nth-child as fallback.
 */
function buildUniqueSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;

  const tag = el.tagName.toLowerCase();
  if (el.className && typeof el.className === "string") {
    const classes = el.className.trim().split(/\s+/).slice(0, 3).join(".");
    if (classes) return `${tag}.${classes}`;
  }

  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    const idx = siblings.indexOf(el) + 1;
    return `${tag}:nth-child(${idx})`;
  }

  return tag;
}

/**
 * HeuristicRuleSource — implements RuleSource for the rule engine.
 *
 * Priority 50 (lowest). Only matches the synthetic "heuristic" CMP name,
 * which is set by the detector when no other CMP is identified.
 */
export const heuristicRuleSource: RuleSource = {
  name: "heuristic",
  priority: 50,
  match(cmpName: string): CMPRule | null {
    if (cmpName !== "heuristic") return null;
    const scan = heuristicScan();
    return buildHeuristicRule(scan);
  },
};
