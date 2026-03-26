import { describe, expect, it } from "vitest";
import {
  ALL_MAPPINGS,
  ONETRUST_MAPPING,
  COOKIEBOT_MAPPING,
  DIDOMI_MAPPING,
  getMappingForCmp,
} from "@/rules/category-mappings";
import {
  supportsPerCategory,
  buildCustomConsentAction,
  buildOneTrustConsent,
  buildCookiebotConsent,
  buildDidomiConsent,
} from "@/background/per-category-executor";
import type { UserPreferences } from "@/shared/types";

/** Helper to create preferences with defaults. */
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

describe("Category mappings", () => {
  it("ALL_MAPPINGS contains exactly 3 CMPs", () => {
    expect(ALL_MAPPINGS).toHaveLength(3);
    const names = ALL_MAPPINGS.map((m) => m.cmpName);
    expect(names).toContain("onetrust");
    expect(names).toContain("cookiebot");
    expect(names).toContain("didomi");
  });

  it("OneTrust mapping has correct category IDs", () => {
    expect(ONETRUST_MAPPING.categories.functional).toBe("C0003");
    expect(ONETRUST_MAPPING.categories.analytics).toBe("C0002");
    expect(ONETRUST_MAPPING.categories.marketing).toBe("C0004");
    expect(ONETRUST_MAPPING.categories.socialMedia).toBe("C0005");
    expect(ONETRUST_MAPPING.strategy).toBe("api");
  });

  it("Cookiebot mapping has correct category names", () => {
    expect(COOKIEBOT_MAPPING.categories.functional).toBe("preferences");
    expect(COOKIEBOT_MAPPING.categories.analytics).toBe("statistics");
    expect(COOKIEBOT_MAPPING.categories.marketing).toBe("marketing");
    expect(COOKIEBOT_MAPPING.categories.socialMedia).toBeUndefined();
    expect(COOKIEBOT_MAPPING.strategy).toBe("api");
  });

  it("Didomi mapping has correct purpose names", () => {
    expect(DIDOMI_MAPPING.categories.functional).toBe("preferences");
    expect(DIDOMI_MAPPING.categories.analytics).toBe("analytics");
    expect(DIDOMI_MAPPING.categories.marketing).toBe("advertising");
    expect(DIDOMI_MAPPING.categories.socialMedia).toBe("social_media");
    expect(DIDOMI_MAPPING.strategy).toBe("api");
  });

  it("getMappingForCmp returns mapping for known CMP", () => {
    expect(getMappingForCmp("onetrust")).toBe(ONETRUST_MAPPING);
    expect(getMappingForCmp("cookiebot")).toBe(COOKIEBOT_MAPPING);
    expect(getMappingForCmp("didomi")).toBe(DIDOMI_MAPPING);
  });

  it("getMappingForCmp returns undefined for unknown CMP", () => {
    expect(getMappingForCmp("unknown")).toBeUndefined();
  });
});

describe("supportsPerCategory", () => {
  it("returns true for top 3 CMPs", () => {
    expect(supportsPerCategory("onetrust")).toBe(true);
    expect(supportsPerCategory("cookiebot")).toBe(true);
    expect(supportsPerCategory("didomi")).toBe(true);
  });

  it("returns false for unknown CMP", () => {
    expect(supportsPerCategory("unknown-cmp")).toBe(false);
    expect(supportsPerCategory("")).toBe(false);
  });
});

describe("buildCustomConsentAction", () => {
  it("returns null for unknown CMP", () => {
    expect(buildCustomConsentAction("unknown", prefs())).toBeNull();
  });

  it("returns action sequence for onetrust", () => {
    const result = buildCustomConsentAction("onetrust", prefs());
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
  });

  it("returns action sequence for cookiebot", () => {
    const result = buildCustomConsentAction("cookiebot", prefs());
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
  });

  it("returns action sequence for didomi", () => {
    const result = buildCustomConsentAction("didomi", prefs());
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
  });
});

describe("buildOneTrustConsent", () => {
  it("generates correct API call rejecting all optional", () => {
    const actions = buildOneTrustConsent(prefs());
    const evalStep = actions[0];
    expect(evalStep.type).toBe("eval");
    expect(evalStep.target).toContain("OneTrust.UpdateConsent");
    expect(evalStep.target).toContain("C0001:1");
    expect(evalStep.target).toContain("C0002:0");
    expect(evalStep.target).toContain("C0003:0");
    expect(evalStep.target).toContain("C0004:0");
    expect(evalStep.target).toContain("C0005:0");
  });

  it("generates correct API call accepting analytics only", () => {
    const actions = buildOneTrustConsent(prefs({ analytics: true }));
    const evalStep = actions[0];
    expect(evalStep.target).toContain("C0002:1");
    expect(evalStep.target).toContain("C0003:0");
    expect(evalStep.target).toContain("C0004:0");
  });

  it("generates correct API call accepting all optional", () => {
    const actions = buildOneTrustConsent(
      prefs({ functional: true, analytics: true, marketing: true, socialMedia: true }),
    );
    const evalStep = actions[0];
    expect(evalStep.target).toContain("C0002:1");
    expect(evalStep.target).toContain("C0003:1");
    expect(evalStep.target).toContain("C0004:1");
    expect(evalStep.target).toContain("C0005:1");
  });

  it("includes Close step after UpdateConsent", () => {
    const actions = buildOneTrustConsent(prefs());
    expect(actions.length).toBe(3);
    expect(actions[2].target).toContain("OneTrust.Close()");
  });
});

describe("buildCookiebotConsent", () => {
  it("generates correct call rejecting all", () => {
    const actions = buildCookiebotConsent(prefs());
    expect(actions).toHaveLength(1);
    expect(actions[0].target).toBe("Cookiebot.submitCustomConsent(false, false, false)");
  });

  it("generates correct call accepting functional only", () => {
    const actions = buildCookiebotConsent(prefs({ functional: true }));
    expect(actions[0].target).toBe("Cookiebot.submitCustomConsent(true, false, false)");
  });

  it("generates correct call accepting all", () => {
    const actions = buildCookiebotConsent(
      prefs({ functional: true, analytics: true, marketing: true }),
    );
    expect(actions[0].target).toBe("Cookiebot.submitCustomConsent(true, true, true)");
  });
});

describe("buildDidomiConsent", () => {
  it("generates correct call rejecting all", () => {
    const actions = buildDidomiConsent(prefs());
    expect(actions).toHaveLength(1);
    const target = actions[0].target!;
    expect(target).toContain("Didomi.setUserStatus");
    expect(target).toContain("enabled:[]");
    expect(target).toContain('"preferences"');
    expect(target).toContain('"analytics"');
    expect(target).toContain('"advertising"');
    expect(target).toContain('"social_media"');
  });

  it("generates correct call accepting analytics and marketing", () => {
    const actions = buildDidomiConsent(prefs({ analytics: true, marketing: true }));
    const target = actions[0].target!;
    expect(target).toContain('enabled:["analytics","advertising"]');
    expect(target).toContain('disabled:["preferences","social_media"]');
  });

  it("generates correct call accepting all", () => {
    const actions = buildDidomiConsent(
      prefs({ functional: true, analytics: true, marketing: true, socialMedia: true }),
    );
    const target = actions[0].target!;
    expect(target).toContain('enabled:["preferences","analytics","advertising","social_media"]');
    expect(target).toContain("disabled:[]");
  });
});
