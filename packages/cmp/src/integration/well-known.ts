/**
 * @module integration/well-known
 * Generates the `/.well-known/cookie-consent.json` descriptor from CMP config.
 *
 * The well-known file allows browsers, extensions, and AI agents to discover
 * a site's cookie consent configuration without parsing the DOM.
 */

import { CATEGORY_META } from "@/shared/constants";
import type { CategoryConfig, ResolvedCMPConfig } from "@/shared/types";

/** CMP metadata in the well-known output. */
export interface WellKnownCMP {
  name: string;
  version: string;
  homepage: string;
}

/** A category entry in the well-known output. */
export interface WellKnownCategory {
  id: string;
  name: string;
  required: boolean;
  cookies: Array<{
    name: string;
    provider: string;
    duration: string;
    purpose: string;
  }>;
}

/** DOM selectors for the consent UI elements. */
export interface WellKnownSelectors {
  banner: string;
  acceptAll: string;
  rejectAll: string;
  preferences: string;
  save: string;
}

/** JavaScript API entry points. */
export interface WellKnownAPI {
  acceptAll: string;
  rejectAll: string;
  setConsent: string;
  getConsent: string;
  openPreferences: string;
}

/** Signal flags (GPC, TCF). */
export interface WellKnownSignals {
  gpc: boolean;
  tcf: boolean;
}

/** Full well-known cookie-consent.json structure. */
export interface WellKnownCookieConsent {
  version: string;
  cmp: WellKnownCMP;
  categories: WellKnownCategory[];
  selectors: WellKnownSelectors;
  api: WellKnownAPI;
  categorySelectors: Record<string, { toggle: string }>;
  signals: WellKnownSignals;
  contact?: string;
  policyUrl?: string;
}

const CMP_NAME = "NoCookie CMP";
const CMP_VERSION = "0.1.0";
const CMP_HOMEPAGE = "https://nocookie.zentala.io";
const WELL_KNOWN_VERSION = "1.0";

/** Generates a well-known cookie-consent.json from resolved CMP config. */
export class WellKnownGenerator {
  constructor(private config: ResolvedCMPConfig) {}

  /** Generate the well-known JSON object. */
  generate(): WellKnownCookieConsent {
    const result: WellKnownCookieConsent = {
      version: WELL_KNOWN_VERSION,
      cmp: {
        name: CMP_NAME,
        version: CMP_VERSION,
        homepage: CMP_HOMEPAGE,
      },
      categories: this.buildCategories(),
      selectors: this.buildSelectors(),
      api: this.buildAPI(),
      categorySelectors: this.buildCategorySelectors(),
      signals: {
        gpc: this.config.behavior.respectGPC,
        tcf: this.config.behavior.emitTCFSignal,
      },
    };

    if (this.config.privacyContact) {
      result.contact = this.config.privacyContact;
    }
    if (this.config.policyUrl) {
      result.policyUrl = this.config.policyUrl;
    }

    return result;
  }

  /** Generate as formatted JSON string. */
  toJSON(): string {
    return JSON.stringify(this.generate(), null, 2);
  }

  /** Build category entries from config. */
  private buildCategories(): WellKnownCategory[] {
    return this.config.categories.map((cat) => this.mapCategory(cat));
  }

  /** Map a single CategoryConfig to a WellKnownCategory. */
  private mapCategory(cat: CategoryConfig): WellKnownCategory {
    const meta = CATEGORY_META[cat.id];
    return {
      id: cat.id,
      name: cat.name ?? meta.name,
      required: cat.required ?? meta.required,
      cookies: (cat.cookies ?? []).map((c) => ({
        name: c.name,
        provider: c.provider,
        duration: c.duration,
        purpose: c.purpose,
      })),
    };
  }

  /** Build fixed selector references for the CMP UI. */
  private buildSelectors(): WellKnownSelectors {
    return {
      banner: "#ca-cmp-root",
      acceptAll: ".ca-btn--accept",
      rejectAll: ".ca-btn--reject",
      preferences: ".ca-btn--customize",
      save: ".ca-btn--save",
    };
  }

  /** Build JavaScript API references. */
  private buildAPI(): WellKnownAPI {
    return {
      acceptAll: "NoCookieCMP.acceptAll()",
      rejectAll: "NoCookieCMP.rejectAll()",
      setConsent: "NoCookieCMP.setConsent(category, granted)",
      getConsent: "NoCookieCMP.getConsent()",
      openPreferences: "NoCookieCMP.openPreferences()",
    };
  }

  /** Build per-category toggle selectors. */
  private buildCategorySelectors(): Record<string, { toggle: string }> {
    const selectors: Record<string, { toggle: string }> = {};
    for (const cat of this.config.categories) {
      selectors[cat.id] = {
        toggle: `input[data-category-id="${cat.id}"]`,
      };
    }
    return selectors;
  }
}
