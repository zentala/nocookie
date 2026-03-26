/** Tests for additional CMP category mappings and per-category builders. */
import { describe, expect, it } from "vitest";
import {
  QUANTCAST_MAPPING,
  TRUSTARC_MAPPING,
  COOKIEYES_MAPPING,
  COMPLIANZ_MAPPING,
  OSANO_MAPPING,
  CONSENTMANAGER_MAPPING,
  getMappingForCmp,
} from "@/rules/category-mappings";
import {
  supportsPerCategory,
  buildCustomConsentAction,
  buildQuantcastConsent,
  buildTrustArcConsent,
  buildCookieYesConsent,
  buildComplianzConsent,
  buildOsanoConsent,
  buildConsentmanagerConsent,
} from "@/background/per-category-executor";
import { validateRule } from "@/rules/schema";
import type { UserPreferences } from "@/shared/types";
import quantcastData from "@/rules/builtin/quantcast.json";
import trustarcData from "@/rules/builtin/trustarc.json";
import cookieyesData from "@/rules/builtin/cookieyes.json";
import complianzData from "@/rules/builtin/complianz.json";
import osanoData from "@/rules/builtin/osano.json";
import consentmanagerData from "@/rules/builtin/consentmanager.json";

function prefs(overrides: Partial<Omit<UserPreferences, "essential">> = {}): UserPreferences {
  return {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    socialMedia: false,
    ...overrides,
  };
}

const ADDITIONAL_CMPS = [
  "quantcast",
  "trustarc",
  "cookieyes",
  "complianz",
  "osano",
  "consentmanager",
] as const;

describe("Additional CMP category mappings", () => {
  it("Quantcast mapping has correct TCF purpose IDs", () => {
    expect(QUANTCAST_MAPPING.categories.functional).toBe("3");
    expect(QUANTCAST_MAPPING.categories.analytics).toBe("5");
    expect(QUANTCAST_MAPPING.categories.marketing).toBe("1");
    expect(QUANTCAST_MAPPING.strategy).toBe("api");
  });

  it("TrustArc mapping has correct category names", () => {
    expect(TRUSTARC_MAPPING.categories.functional).toBe("functional");
    expect(TRUSTARC_MAPPING.categories.analytics).toBe("analytics");
    expect(TRUSTARC_MAPPING.categories.marketing).toBe("advertising");
    expect(TRUSTARC_MAPPING.strategy).toBe("toggles");
  });

  it("CookieYes mapping has correct category names", () => {
    expect(COOKIEYES_MAPPING.categories.functional).toBe("functional");
    expect(COOKIEYES_MAPPING.categories.analytics).toBe("analytics");
    expect(COOKIEYES_MAPPING.categories.marketing).toBe("advertisement");
    expect(COOKIEYES_MAPPING.strategy).toBe("api");
  });

  it("Complianz mapping has correct category names", () => {
    expect(COMPLIANZ_MAPPING.categories.functional).toBe("functional");
    expect(COMPLIANZ_MAPPING.categories.analytics).toBe("statistics");
    expect(COMPLIANZ_MAPPING.categories.marketing).toBe("marketing");
    expect(COMPLIANZ_MAPPING.strategy).toBe("api");
  });

  it("Osano mapping has correct uppercase purpose IDs", () => {
    expect(OSANO_MAPPING.categories.functional).toBe("PERSONALIZATION");
    expect(OSANO_MAPPING.categories.analytics).toBe("ANALYTICS");
    expect(OSANO_MAPPING.categories.marketing).toBe("MARKETING");
    expect(OSANO_MAPPING.strategy).toBe("api");
  });

  it("consentmanager mapping has correct numeric purpose IDs", () => {
    expect(CONSENTMANAGER_MAPPING.categories.functional).toBe("3");
    expect(CONSENTMANAGER_MAPPING.categories.analytics).toBe("2");
    expect(CONSENTMANAGER_MAPPING.categories.marketing).toBe("4");
    expect(CONSENTMANAGER_MAPPING.strategy).toBe("api");
  });

  it("getMappingForCmp returns mapping for all 6 additional CMPs", () => {
    for (const name of ADDITIONAL_CMPS) {
      expect(getMappingForCmp(name)).toBeDefined();
      expect(getMappingForCmp(name)?.cmpName).toBe(name);
    }
  });
});

describe("supportsPerCategory for additional CMPs", () => {
  it("returns true for all 6 additional CMPs", () => {
    for (const name of ADDITIONAL_CMPS) {
      expect(supportsPerCategory(name)).toBe(true);
    }
  });
});

describe("buildCustomConsentAction for additional CMPs", () => {
  it("returns action sequence for all 6 additional CMPs", () => {
    for (const name of ADDITIONAL_CMPS) {
      const result = buildCustomConsentAction(name, prefs());
      expect(result).not.toBeNull();
      expect(result!.length).toBeGreaterThan(0);
    }
  });
});

describe("Builtin rule JSON validation", () => {
  const ruleData = [
    { name: "quantcast", data: quantcastData },
    { name: "trustarc", data: trustarcData },
    { name: "cookieyes", data: cookieyesData },
    { name: "complianz", data: complianzData },
    { name: "osano", data: osanoData },
    { name: "consentmanager", data: consentmanagerData },
  ];

  for (const { name, data } of ruleData) {
    it(`${name}.json passes validateRule`, () => {
      const rule = validateRule(data);
      expect(rule.name).toBe(name);
      expect(rule.detection).toBeDefined();
      expect(rule.actions.acceptAll.length).toBeGreaterThan(0);
      expect(rule.actions.rejectAll.length).toBeGreaterThan(0);
      expect(rule.actions.custom.length).toBeGreaterThan(0);
    });
  }
});

describe("buildQuantcastConsent", () => {
  it("generates TCF consent call rejecting all", () => {
    const actions = buildQuantcastConsent(prefs());
    expect(actions).toHaveLength(1);
    expect(actions[0].target).toContain("__tcfapi");
    expect(actions[0].target).toContain('"1":false');
    expect(actions[0].target).toContain('"3":false');
    expect(actions[0].target).toContain('"5":false');
  });

  it("generates TCF consent call accepting analytics only", () => {
    const actions = buildQuantcastConsent(prefs({ analytics: true }));
    expect(actions[0].target).toContain('"5":true');
    expect(actions[0].target).toContain('"1":false');
    expect(actions[0].target).toContain('"3":false');
  });
});

describe("buildTrustArcConsent", () => {
  it("generates toggle sequence with show-consent click first", () => {
    const actions = buildTrustArcConsent(prefs());
    expect(actions[0].type).toBe("click");
    expect(actions[0].target).toContain("truste-show-consent");
    expect(actions[1].type).toBe("waitFor");
  });

  it("includes toggle steps for each category", () => {
    const actions = buildTrustArcConsent(prefs({ functional: true }));
    const toggles = actions.filter((a) => a.type === "toggle");
    expect(toggles).toHaveLength(3);
    expect(toggles[0].value).toBe("on");
    expect(toggles[1].value).toBe("off");
    expect(toggles[2].value).toBe("off");
  });

  it("ends with submit click", () => {
    const actions = buildTrustArcConsent(prefs());
    const last = actions[actions.length - 1];
    expect(last.type).toBe("click");
    expect(last.target).toContain("submit");
  });
});

describe("buildCookieYesConsent", () => {
  it("generates API call rejecting all", () => {
    const actions = buildCookieYesConsent(prefs());
    expect(actions).toHaveLength(1);
    expect(actions[0].target).toContain("performBannerAction");
    expect(actions[0].target).toContain('"functional":false');
    expect(actions[0].target).toContain('"analytics":false');
    expect(actions[0].target).toContain('"advertisement":false');
  });

  it("generates API call accepting analytics only", () => {
    const actions = buildCookieYesConsent(prefs({ analytics: true }));
    expect(actions[0].target).toContain('"analytics":true');
    expect(actions[0].target).toContain('"functional":false');
  });
});

describe("buildComplianzConsent", () => {
  it("generates event dispatch with only functional when all rejected", () => {
    const actions = buildComplianzConsent(prefs());
    expect(actions).toHaveLength(1);
    expect(actions[0].target).toContain("cmplz_fire_categories");
    expect(actions[0].target).toContain('"functional"');
    expect(actions[0].target).not.toContain('"statistics"');
  });

  it("includes statistics when analytics accepted", () => {
    const actions = buildComplianzConsent(prefs({ analytics: true }));
    expect(actions[0].target).toContain('"statistics"');
  });

  it("includes all categories when all accepted", () => {
    const actions = buildComplianzConsent(
      prefs({ functional: true, analytics: true, marketing: true }),
    );
    const target = actions[0].target!;
    expect(target).toContain('"preferences"');
    expect(target).toContain('"statistics"');
    expect(target).toContain('"marketing"');
  });
});

describe("buildOsanoConsent", () => {
  it("generates API call with all DENY when rejecting all", () => {
    const actions = buildOsanoConsent(prefs());
    expect(actions).toHaveLength(1);
    expect(actions[0].target).toContain("updateConsentState");
    expect(actions[0].target).toContain('"ESSENTIAL":"ACCEPT"');
    expect(actions[0].target).toContain('"PERSONALIZATION":"DENY"');
    expect(actions[0].target).toContain('"ANALYTICS":"DENY"');
    expect(actions[0].target).toContain('"MARKETING":"DENY"');
  });

  it("generates correct state when accepting analytics", () => {
    const actions = buildOsanoConsent(prefs({ analytics: true }));
    expect(actions[0].target).toContain('"ANALYTICS":"ACCEPT"');
    expect(actions[0].target).toContain('"PERSONALIZATION":"DENY"');
  });
});

describe("buildConsentmanagerConsent", () => {
  it("generates __cmp call rejecting all", () => {
    const actions = buildConsentmanagerConsent(prefs());
    expect(actions).toHaveLength(1);
    expect(actions[0].target).toContain("__cmp");
    expect(actions[0].target).toContain('"2":false');
    expect(actions[0].target).toContain('"3":false');
    expect(actions[0].target).toContain('"4":false');
  });

  it("generates __cmp call accepting marketing only", () => {
    const actions = buildConsentmanagerConsent(prefs({ marketing: true }));
    expect(actions[0].target).toContain('"4":true');
    expect(actions[0].target).toContain('"2":false');
    expect(actions[0].target).toContain('"3":false');
  });
});
