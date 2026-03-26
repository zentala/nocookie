/**
 * @module core/consent-state
 * Cookie-based consent state management. Reads and writes per-category
 * consent preferences to a single cookie string.
 */

import type { CategoryId, ConsentState, ResolvedCMPConfig } from "@/shared/types";
import { CATEGORY_IDS } from "@/shared/constants";

/** Short key mapping for cookie compactness. */
const CATEGORY_KEY: Record<CategoryId, string> = {
  essential: "e",
  functional: "f",
  analytics: "a",
  marketing: "m",
  "social-media": "s",
};

/** Milliseconds per day. */
const MS_PER_DAY = 86_400_000;

/**
 * Manages consent state through a browser cookie.
 * Reads, writes, and validates per-category consent with expiry support.
 */
export class ConsentStateManager {
  private readonly config: ResolvedCMPConfig;
  private readonly configuredIds: Set<CategoryId>;

  constructor(config: ResolvedCMPConfig) {
    this.config = config;
    this.configuredIds = new Set(config.categories.map((c) => c.id));
  }

  /** Read consent state from cookie. Returns null if absent or expired. */
  getConsent(): ConsentState | null {
    const raw = this.readCookieValue();
    if (!raw) return null;

    const parsed = parseCookieValue(raw, this.configuredIds);
    if (!parsed) return null;

    if (this.isExpired(parsed.timestamp)) return null;

    return parsed.state;
  }

  /** Check whether the user has given consent (cookie exists and is not expired). */
  hasConsent(): boolean {
    return this.getConsent() !== null;
  }

  /** Set consent for a single category. Essential is always forced to true. */
  setConsent(categoryId: CategoryId, granted: boolean): void {
    const current = this.getConsent() ?? this.defaultState();
    current[categoryId] = categoryId === "essential" ? true : granted;
    this.writeCookie(current);
  }

  /** Accept all configured categories. */
  acceptAll(): void {
    const state = this.defaultState();
    for (const id of this.configuredIds) {
      state[id] = true;
    }
    this.writeCookie(state);
  }

  /** Reject all non-essential categories. */
  rejectAll(): void {
    const state = this.defaultState();
    this.writeCookie(state);
  }

  /** Clear the consent cookie entirely. */
  reset(): void {
    const { cookieName, cookiePath } = this.config.behavior;
    const domain = this.resolveDomain();
    const domainAttr = domain ? `; domain=${domain}` : "";
    document.cookie =
      `${cookieName}=; path=${cookiePath}${domainAttr}` + `; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  /** Build the raw cookie value string for the current consent state. */
  getCookieString(): string {
    const state = this.getConsent() ?? this.defaultState();
    return buildCookieValue(state, this.configuredIds);
  }

  // -- Private helpers --

  /** Build a default state where only essential is true. */
  private defaultState(): ConsentState {
    const state: Partial<ConsentState> = {};
    for (const id of CATEGORY_IDS) {
      state[id] = id === "essential";
    }
    return state as ConsentState;
  }

  /** Read the raw cookie value for the configured cookie name. */
  private readCookieValue(): string | null {
    const name = this.config.behavior.cookieName;
    const cookies = document.cookie.split(";");
    for (const c of cookies) {
      const [key, ...rest] = c.split("=");
      if (key.trim() === name) {
        return rest.join("=").trim();
      }
    }
    return null;
  }

  /** Check whether a consent timestamp has expired per config. */
  private isExpired(timestamp: number): boolean {
    const expiryMs = this.config.behavior.consentExpiry * MS_PER_DAY;
    return Date.now() - timestamp > expiryMs;
  }

  /** Resolve the cookie domain from config. */
  private resolveDomain(): string {
    const { cookieDomain } = this.config.behavior;
    if (cookieDomain !== "auto") return cookieDomain;
    return autoDetectDomain();
  }

  /** Write the consent state as a cookie. */
  private writeCookie(state: ConsentState): void {
    const { cookieName, cookiePath, cookieSecure, cookieSameSite, consentExpiry } =
      this.config.behavior;
    const domain = this.resolveDomain();
    const value = buildCookieValue(state, this.configuredIds);
    const expires = new Date(Date.now() + consentExpiry * MS_PER_DAY).toUTCString();

    let cookie = `${cookieName}=${value}; path=${cookiePath}; expires=${expires}`;
    cookie += `; SameSite=${cookieSameSite}`;
    if (cookieSecure) cookie += "; Secure";
    if (domain) cookie += `; domain=${domain}`;

    document.cookie = cookie;
  }
}

/**
 * Auto-detect cookie domain from `window.location.hostname`.
 * Prepends `.` for subdomain sharing. Returns empty string for
 * localhost / IP addresses.
 */
export function autoDetectDomain(): string {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || isIPAddress(hostname)) return "";
  return `.${hostname}`;
}

/** Check whether a hostname string is an IP address. */
function isIPAddress(hostname: string): boolean {
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  // IPv6 (bracketed or raw)
  if (hostname.includes(":")) return true;
  return false;
}

/**
 * Build cookie value string from consent state.
 * Only includes categories that are in the site's config.
 */
export function buildCookieValue(state: ConsentState, configuredIds: Set<CategoryId>): string {
  const parts: string[] = [];
  for (const id of CATEGORY_IDS) {
    if (!configuredIds.has(id)) continue;
    const key = CATEGORY_KEY[id];
    const val = id === "essential" ? 1 : state[id] ? 1 : 0;
    parts.push(`${key}:${val}`);
  }
  parts.push(`ts:${Date.now()}`);
  return parts.join("|");
}

/**
 * Parse a cookie value string into consent state + timestamp.
 * Returns null if the value is malformed or missing required fields.
 */
export function parseCookieValue(
  raw: string,
  configuredIds: Set<CategoryId>,
): { state: ConsentState; timestamp: number } | null {
  const pairs = raw.split("|");
  const map = new Map<string, string>();

  for (const pair of pairs) {
    const colonIdx = pair.indexOf(":");
    if (colonIdx === -1) return null;
    map.set(pair.slice(0, colonIdx), pair.slice(colonIdx + 1));
  }

  const tsStr = map.get("ts");
  if (!tsStr) return null;
  const timestamp = Number(tsStr);
  if (!Number.isFinite(timestamp)) return null;

  const state: Partial<ConsentState> = {};
  for (const id of CATEGORY_IDS) {
    if (id === "essential") {
      state[id] = true;
      continue;
    }
    const key = CATEGORY_KEY[id];
    const val = map.get(key);
    if (configuredIds.has(id)) {
      state[id] = val === "1";
    } else {
      state[id] = false;
    }
  }

  return { state: state as ConsentState, timestamp };
}
