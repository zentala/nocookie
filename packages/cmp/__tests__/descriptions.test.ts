import { describe, it, expect } from "vitest";
import {
  getCategoryDescription,
  getCommonCookieInfo,
  resolveDescription,
} from "../src/shared/descriptions";
import type { DescriptionPreset } from "../src/shared/descriptions";
import type { CategoryConfig, CategoryId } from "../src/shared/types";
import { CATEGORY_IDS } from "../src/shared/constants";

const PRESETS: DescriptionPreset[] = ["default", "alt1", "alt2"];

describe("getCategoryDescription", () => {
  it.each(CATEGORY_IDS)("returns default description for %s", (id) => {
    const desc = getCategoryDescription(id);
    expect(desc.short).toBeTruthy();
    expect(desc.long).toBeTruthy();
    expect(desc.long.length).toBeGreaterThan(desc.short.length);
  });

  it.each(CATEGORY_IDS)("returns all 3 presets for %s", (id) => {
    const descriptions = PRESETS.map((p) => getCategoryDescription(id, p));
    const shorts = descriptions.map((d) => d.short);
    // All three presets should be distinct
    expect(new Set(shorts).size).toBe(3);
  });

  it("returns unique long descriptions per preset per category", () => {
    for (const id of CATEGORY_IDS) {
      const longs = PRESETS.map((p) => getCategoryDescription(id, p).long);
      expect(new Set(longs).size).toBe(3);
    }
  });

  it("falls back to default for unknown preset", () => {
    const result = getCategoryDescription(
      "essential",
      "nonexistent" as DescriptionPreset,
    );
    const defaultResult = getCategoryDescription("essential", "default");
    expect(result).toEqual(defaultResult);
  });
});

describe("getCommonCookieInfo", () => {
  it("returns info for known Google Analytics cookie", () => {
    const info = getCommonCookieInfo("_ga");
    expect(info).not.toBeNull();
    expect(info!.category).toBe("analytics");
    expect(info!.provider).toBe("Google Analytics");
    expect(info!.duration).toBe("2 years");
    expect(info!.purpose).toBeTruthy();
  });

  it("returns info for known Facebook cookie", () => {
    const info = getCommonCookieInfo("_fbp");
    expect(info).not.toBeNull();
    expect(info!.category).toBe("marketing");
    expect(info!.provider).toBe("Facebook");
  });

  it("returns info for known Stripe essential cookie", () => {
    const info = getCommonCookieInfo("__stripe_mid");
    expect(info).not.toBeNull();
    expect(info!.category).toBe("essential");
    expect(info!.provider).toBe("Stripe");
  });

  it("returns info for social-media cookie", () => {
    const info = getCommonCookieInfo("bcookie");
    expect(info).not.toBeNull();
    expect(info!.category).toBe("social-media");
    expect(info!.provider).toBe("LinkedIn");
  });

  it("returns null for unknown cookie", () => {
    expect(getCommonCookieInfo("my_custom_cookie")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getCommonCookieInfo("")).toBeNull();
  });
});

describe("resolveDescription", () => {
  it("uses custom description when set on CategoryConfig", () => {
    const config: CategoryConfig = {
      id: "analytics",
      description: "We track stuff for science",
    };
    const result = resolveDescription(config);
    expect(result.short).toBe("We track stuff for science");
    expect(result.long).toBe("We track stuff for science");
  });

  it("uses specified preset when no custom description", () => {
    const config: CategoryConfig = { id: "marketing" };
    const result = resolveDescription(config, "alt2");
    const expected = getCategoryDescription("marketing", "alt2");
    expect(result).toEqual(expected);
  });

  it("falls back to default preset when neither custom nor preset given", () => {
    const config: CategoryConfig = { id: "functional" };
    const result = resolveDescription(config);
    const expected = getCategoryDescription("functional", "default");
    expect(result).toEqual(expected);
  });

  it("custom description takes priority over preset", () => {
    const config: CategoryConfig = {
      id: "essential",
      description: "Custom override",
    };
    const result = resolveDescription(config, "alt1");
    expect(result.short).toBe("Custom override");
    expect(result.long).toBe("Custom override");
  });

  it("works for all categories with default fallback", () => {
    for (const id of CATEGORY_IDS) {
      const config: CategoryConfig = { id };
      const result = resolveDescription(config);
      expect(result.short).toBeTruthy();
      expect(result.long).toBeTruthy();
    }
  });
});
