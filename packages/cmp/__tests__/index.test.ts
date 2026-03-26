import { describe, it, expect } from "vitest";
import { NoCookieCMP } from "../src/index";

describe("NoCookieCMP", () => {
  it("exposes version string", () => {
    expect(NoCookieCMP.version).toBe("0.1.0");
  });

  it("init returns the CMP instance", () => {
    const result = NoCookieCMP.init();
    expect(result).toBe(NoCookieCMP);
  });

  it("getConsent returns default preferences with necessary=true", () => {
    const consent = NoCookieCMP.getConsent();
    expect(consent.necessary).toBe(true);
    expect(consent.functional).toBe(false);
    expect(consent.analytics).toBe(false);
    expect(consent.marketing).toBe(false);
  });

  it("init accepts configuration options", () => {
    const result = NoCookieCMP.init({
      autoShow: false,
      defaults: { functional: true },
    });
    expect(result).toBe(NoCookieCMP);
  });
});
