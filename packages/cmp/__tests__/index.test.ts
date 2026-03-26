import { describe, it, expect } from "vitest";
import { NoCookieCMP } from "../src/index";

describe("NoCookieCMP", () => {
  it("exposes version string", () => {
    expect(NoCookieCMP.version).toBe("0.1.0");
  });

  it("init returns the CMP instance", () => {
    const result = NoCookieCMP.init({
      siteName: "Test Site",
      categories: ["essential"],
    });
    expect(result).toBe(NoCookieCMP);
  });

  it("getConsent returns default preferences with essential=true", () => {
    const consent = NoCookieCMP.getConsent();
    expect(consent.essential).toBe(true);
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
});
