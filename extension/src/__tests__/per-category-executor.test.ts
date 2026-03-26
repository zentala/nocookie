/**
 * Tests for per-category executor: CMP builder output validation
 * and buildCustomConsentAction dispatch logic.
 */

import { describe, it, expect } from "vitest";
import {
  buildCustomConsentAction,
  supportsPerCategory,
  buildOneTrustConsent,
  buildCookiebotConsent,
  buildDidomiConsent,
  buildQuantcastConsent,
  buildTrustArcConsent,
  buildCookieYesConsent,
  buildComplianzConsent,
  buildOsanoConsent,
  buildConsentmanagerConsent,
} from "@/background/per-category-executor";
import type { UserPreferences } from "@/shared/types";

const PREFS_ALL_ON: UserPreferences = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: true,
  socialMedia: true,
};

const PREFS_ALL_OFF: UserPreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  socialMedia: false,
};

const PREFS_MIXED: UserPreferences = {
  essential: true,
  functional: true,
  analytics: false,
  marketing: false,
  socialMedia: true,
};

describe("supportsPerCategory", () => {
  it("returns true for known CMPs", () => {
    const known = [
      "onetrust",
      "cookiebot",
      "didomi",
      "quantcast",
      "trustarc",
      "cookieyes",
      "complianz",
      "osano",
      "consentmanager",
    ];
    for (const cmp of known) {
      expect(supportsPerCategory(cmp)).toBe(true);
    }
  });

  it("returns false for unknown CMP", () => {
    expect(supportsPerCategory("random-cmp")).toBe(false);
    expect(supportsPerCategory("")).toBe(false);
  });
});

describe("buildCustomConsentAction dispatch", () => {
  it("returns action sequence for each known CMP", () => {
    const cmps = [
      "onetrust",
      "cookiebot",
      "didomi",
      "quantcast",
      "trustarc",
      "cookieyes",
      "complianz",
      "osano",
      "consentmanager",
    ];
    for (const cmp of cmps) {
      const result = buildCustomConsentAction(cmp, PREFS_MIXED);
      expect(result).not.toBeNull();
      expect(result!.length).toBeGreaterThan(0);
    }
  });

  it("returns null for unknown CMP", () => {
    expect(buildCustomConsentAction("unknown", PREFS_ALL_ON)).toBeNull();
  });
});

describe("OneTrust builder", () => {
  it("produces eval action with group consent string", () => {
    const actions = buildOneTrustConsent(PREFS_MIXED);
    expect(actions.length).toBe(3);
    expect(actions[0].type).toBe("eval");
    expect(actions[0].target).toContain("OneTrust.UpdateConsent");
    expect(actions[0].target).toContain("C0001:1");
    expect(actions[0].target).toContain("C0003:1"); // functional on
    expect(actions[0].target).toContain("C0002:0"); // analytics off
    expect(actions[0].target).toContain("C0004:0"); // marketing off
  });

  it("all-on produces all :1 groups", () => {
    const actions = buildOneTrustConsent(PREFS_ALL_ON);
    expect(actions[0].target).toContain("C0002:1");
    expect(actions[0].target).toContain("C0003:1");
    expect(actions[0].target).toContain("C0004:1");
    expect(actions[0].target).toContain("C0005:1");
  });
});

describe("Cookiebot builder", () => {
  it("produces submitCustomConsent with correct booleans", () => {
    const actions = buildCookiebotConsent(PREFS_MIXED);
    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe("eval");
    expect(actions[0].target).toContain("submitCustomConsent(true, false, false)");
  });

  it("all-off produces all false", () => {
    const actions = buildCookiebotConsent(PREFS_ALL_OFF);
    expect(actions[0].target).toContain("submitCustomConsent(false, false, false)");
  });
});

describe("Didomi builder", () => {
  it("produces setUserStatus with correct enabled/disabled arrays", () => {
    const actions = buildDidomiConsent(PREFS_MIXED);
    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe("eval");
    expect(actions[0].target).toContain("setUserStatus");
    expect(actions[0].target).toContain('"preferences"');
    // Analytics off -> disabled
    expect(actions[0].target).toContain('"analytics"');
  });
});

describe("Quantcast builder", () => {
  it("produces __tcfapi call with purpose consent", () => {
    const actions = buildQuantcastConsent(PREFS_MIXED);
    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe("eval");
    expect(actions[0].target).toContain("__tcfapi");
    expect(actions[0].target).toContain("setConsent");
  });
});

describe("TrustArc builder", () => {
  it("produces click + waitFor + toggle sequence", () => {
    const actions = buildTrustArcConsent(PREFS_MIXED);
    expect(actions.length).toBeGreaterThanOrEqual(5);
    expect(actions[0].type).toBe("click");
    expect(actions[1].type).toBe("waitFor");
    expect(actions[2].type).toBe("toggle");
    expect(actions[2].value).toBe("on"); // functional on
    expect(actions[3].value).toBe("off"); // analytics off
    expect(actions[4].value).toBe("off"); // marketing off
  });
});

describe("CookieYes builder", () => {
  it("produces performBannerAction eval", () => {
    const actions = buildCookieYesConsent(PREFS_MIXED);
    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe("eval");
    expect(actions[0].target).toContain("performBannerAction");
  });
});

describe("Complianz builder", () => {
  it("produces custom event dispatch with categories", () => {
    const actions = buildComplianzConsent(PREFS_MIXED);
    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe("eval");
    expect(actions[0].target).toContain("cmplz_fire_categories");
    // functional on -> preferences included
    expect(actions[0].target).toContain("preferences");
    // analytics off -> statistics not included
    expect(actions[0].target).not.toContain("statistics");
  });
});

describe("Osano builder", () => {
  it("produces updateConsentState with correct accept/deny", () => {
    const actions = buildOsanoConsent(PREFS_MIXED);
    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe("eval");
    expect(actions[0].target).toContain("updateConsentState");
    expect(actions[0].target).toContain('"ESSENTIAL":"ACCEPT"');
    expect(actions[0].target).toContain('"PERSONALIZATION":"ACCEPT"');
    expect(actions[0].target).toContain('"ANALYTICS":"DENY"');
    expect(actions[0].target).toContain('"MARKETING":"DENY"');
  });
});

describe("Consentmanager builder", () => {
  it("produces __cmp setConsent call", () => {
    const actions = buildConsentmanagerConsent(PREFS_MIXED);
    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe("eval");
    expect(actions[0].target).toContain("__cmp");
    expect(actions[0].target).toContain("setConsent");
  });
});

describe("Mixed preferences produce correct API calls", () => {
  it("OneTrust with only marketing on", () => {
    const prefs: UserPreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: true,
      socialMedia: false,
    };
    const actions = buildOneTrustConsent(prefs);
    expect(actions[0].target).toContain("C0003:0"); // functional off
    expect(actions[0].target).toContain("C0004:1"); // marketing on
    expect(actions[0].target).toContain("C0005:0"); // social off
  });

  it("Cookiebot with only analytics on", () => {
    const prefs: UserPreferences = {
      essential: true,
      functional: false,
      analytics: true,
      marketing: false,
      socialMedia: false,
    };
    const actions = buildCookiebotConsent(prefs);
    expect(actions[0].target).toContain("submitCustomConsent(false, true, false)");
  });
});
