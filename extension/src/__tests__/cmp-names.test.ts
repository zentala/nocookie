/**
 * Tests for shared CMP names registry.
 *
 * Validates display name mapping, selector-to-CMP mapping,
 * and script URL pattern registry.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import { getCmpDisplayName, SELECTOR_TO_CMP, CMP_SCRIPT_URLS } from "@/shared/cmp-names";

describe("getCmpDisplayName", () => {
  it("returns 'NoCookie CMP' for nocookie", () => {
    expect(getCmpDisplayName("nocookie")).toBe("NoCookie CMP");
  });

  it("returns 'OneTrust' for onetrust", () => {
    expect(getCmpDisplayName("onetrust")).toBe("OneTrust");
  });

  it("returns identifier as-is for unknown CMP", () => {
    expect(getCmpDisplayName("custom-cmp")).toBe("custom-cmp");
  });
});

describe("SELECTOR_TO_CMP", () => {
  it("maps #ca-cmp-root to nocookie", () => {
    expect(SELECTOR_TO_CMP["#ca-cmp-root"]).toBe("nocookie");
  });

  it("maps all expected selectors", () => {
    const expected = [
      "#ca-cmp-root",
      "#onetrust-consent-sdk",
      "#CybotCookiebotDialog",
      "#didomi-host",
      ".qc-cmp2-ui",
      "#truste-consent-track",
      ".cky-consent-container",
      ".cc-window",
      ".cmplz-cookiebanner",
      "#cmpbox",
    ];
    for (const sel of expected) {
      expect(SELECTOR_TO_CMP[sel]).toBeDefined();
    }
  });
});

describe("CMP_SCRIPT_URLS", () => {
  it("maps cdn.cookielaw.org to onetrust", () => {
    expect(CMP_SCRIPT_URLS["cdn.cookielaw.org"]).toBe("onetrust");
  });

  it("contains expected number of URL patterns", () => {
    expect(Object.keys(CMP_SCRIPT_URLS).length).toBe(9);
  });
});
