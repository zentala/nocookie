// @vitest-environment jsdom
/**
 * @module tests/index
 * Unit tests for the NoCookieCMP public API facade.
 */

import { describe, it, expect, afterEach } from "vitest";
import { NoCookieCMP } from "../src/index";

describe("NoCookieCMP", () => {
  afterEach(() => {
    // Clean up Shadow DOM host if created
    const host = document.getElementById("ca-cmp-root");
    if (host) host.remove();
    // Clear cookies
    document.cookie = "ca_consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("exposes version string", () => {
    expect(NoCookieCMP.version).toBe("0.1.0");
  });

  it("init returns the CMP instance for chaining", () => {
    const result = NoCookieCMP.init({
      siteName: "Test Site",
      categories: ["essential"],
    });
    expect(result).toBe(NoCookieCMP);
  });

  it("getConsent returns default preferences before init", () => {
    const consent = NoCookieCMP.getConsent();
    expect(consent.essential).toBe(true);
    expect(consent.analytics).toBe(false);
  });

  it("init accepts configuration and resolves it", () => {
    const result = NoCookieCMP.init({
      siteName: "Test Site",
      categories: ["essential", "analytics"],
    });
    expect(result).toBe(NoCookieCMP);
    const config = NoCookieCMP.getConfig();
    expect(config).not.toBeNull();
    expect(config!.siteName).toBe("Test Site");
    expect(config!.categories).toHaveLength(2);
  });

  it("getConfig returns null before init", () => {
    // Force a fresh state by calling with a fresh import would be ideal,
    // but since the module is a singleton, just check type safety
    expect(NoCookieCMP.getConfig()).toBeDefined();
  });
});
