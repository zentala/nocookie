// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GPCDetector } from "../src/integration/gpc";
import { EventBus } from "../src/core/event-bus";
import { ConsentStateManager } from "../src/core/consent-state";
import type { ResolvedCMPConfig, CategoryConfig } from "../src/shared/types";
import {
  DEFAULT_BEHAVIOR,
  DEFAULT_THEME,
  DEFAULT_TRANSLATIONS,
  DEFAULT_WELL_KNOWN,
  DEFAULT_POLICY_PAGE,
  DEFAULT_LANGUAGE,
} from "../src/shared/constants";

/** Build a resolved config with the given categories and behavior overrides. */
function makeConfig(
  categoryIds: string[] = ["essential", "marketing", "social-media", "analytics"],
  behaviorOverrides: Partial<typeof DEFAULT_BEHAVIOR> = {},
): ResolvedCMPConfig {
  const categories: CategoryConfig[] = categoryIds.map((id) => ({
    id: id as CategoryConfig["id"],
    required: id === "essential",
  }));

  return {
    siteName: "Test",
    categories,
    theme: { ...DEFAULT_THEME },
    behavior: { ...DEFAULT_BEHAVIOR, ...behaviorOverrides },
    language: DEFAULT_LANGUAGE,
    translations: { ...DEFAULT_TRANSLATIONS },
    wellKnown: { ...DEFAULT_WELL_KNOWN },
    policyPage: { ...DEFAULT_POLICY_PAGE },
    icons: {},
  };
}

/** Set or remove the GPC flag on the navigator object. */
function setGPC(value: boolean | undefined): void {
  if (value === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).globalPrivacyControl;
  } else {
    Object.defineProperty(navigator, "globalPrivacyControl", {
      value,
      writable: true,
      configurable: true,
    });
  }
}

describe("GPCDetector", () => {
  let eventBus: EventBus;
  let consentState: ConsentStateManager;
  let config: ResolvedCMPConfig;

  beforeEach(() => {
    eventBus = new EventBus();
    config = makeConfig();
    consentState = new ConsentStateManager(config);
    // Stub setConsent to avoid cookie writes in jsdom
    vi.spyOn(consentState, "setConsent");
  });

  afterEach(() => {
    setGPC(undefined);
    vi.restoreAllMocks();
  });

  describe("when GPC is not present", () => {
    it("returns detected=false", () => {
      setGPC(undefined);
      const detector = new GPCDetector(config, consentState, eventBus);
      const result = detector.detect();

      expect(result.detected).toBe(false);
      expect(result.applied).toBe(false);
      expect(result.rejectedCategories).toEqual([]);
    });

    it("does not emit gpc:detected", () => {
      setGPC(undefined);
      const handler = vi.fn();
      eventBus.on("gpc:detected", handler);

      new GPCDetector(config, consentState, eventBus).detect();
      expect(handler).not.toHaveBeenCalled();
    });

    it("isGPCEnabled is false", () => {
      setGPC(undefined);
      const detector = new GPCDetector(config, consentState, eventBus);
      detector.detect();
      expect(detector.isGPCEnabled).toBe(false);
    });
  });

  describe("when GPC is explicitly false", () => {
    it("returns detected=false", () => {
      setGPC(false);
      const detector = new GPCDetector(config, consentState, eventBus);
      const result = detector.detect();

      expect(result.detected).toBe(false);
      expect(result.applied).toBe(false);
    });
  });

  describe("when GPC is true and respectGPC is true", () => {
    beforeEach(() => {
      setGPC(true);
      config = makeConfig(["essential", "marketing", "social-media", "analytics"], {
        respectGPC: true,
      });
      consentState = new ConsentStateManager(config);
      vi.spyOn(consentState, "setConsent");
    });

    it("returns detected=true and applied=true", () => {
      const detector = new GPCDetector(config, consentState, eventBus);
      const result = detector.detect();

      expect(result.detected).toBe(true);
      expect(result.applied).toBe(true);
    });

    it("rejects marketing", () => {
      new GPCDetector(config, consentState, eventBus).detect();
      expect(consentState.setConsent).toHaveBeenCalledWith("marketing", false);
    });

    it("rejects social-media", () => {
      new GPCDetector(config, consentState, eventBus).detect();
      expect(consentState.setConsent).toHaveBeenCalledWith("social-media", false);
    });

    it("does NOT reject analytics", () => {
      new GPCDetector(config, consentState, eventBus).detect();
      expect(consentState.setConsent).not.toHaveBeenCalledWith("analytics", expect.anything());
    });

    it("does NOT reject essential", () => {
      new GPCDetector(config, consentState, eventBus).detect();
      expect(consentState.setConsent).not.toHaveBeenCalledWith("essential", expect.anything());
    });

    it("returns rejected categories list", () => {
      const result = new GPCDetector(config, consentState, eventBus).detect();
      expect(result.rejectedCategories).toEqual(["marketing", "social-media"]);
    });

    it("emits gpc:detected event", () => {
      const handler = vi.fn();
      eventBus.on("gpc:detected", handler);

      new GPCDetector(config, consentState, eventBus).detect();
      expect(handler).toHaveBeenCalledOnce();
    });

    it("isGPCEnabled is true after detect", () => {
      const detector = new GPCDetector(config, consentState, eventBus);
      detector.detect();
      expect(detector.isGPCEnabled).toBe(true);
    });
  });

  describe("when GPC is true but respectGPC is false", () => {
    beforeEach(() => {
      setGPC(true);
      config = makeConfig(["essential", "marketing", "social-media", "analytics"], {
        respectGPC: false,
      });
      consentState = new ConsentStateManager(config);
      vi.spyOn(consentState, "setConsent");
    });

    it("returns detected=true but applied=false", () => {
      const result = new GPCDetector(config, consentState, eventBus).detect();
      expect(result.detected).toBe(true);
      expect(result.applied).toBe(false);
      expect(result.rejectedCategories).toEqual([]);
    });

    it("does NOT call setConsent", () => {
      new GPCDetector(config, consentState, eventBus).detect();
      expect(consentState.setConsent).not.toHaveBeenCalled();
    });

    it("still emits gpc:detected event", () => {
      const handler = vi.fn();
      eventBus.on("gpc:detected", handler);

      new GPCDetector(config, consentState, eventBus).detect();
      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe("when categories are not in config", () => {
    it("skips marketing if not configured", () => {
      setGPC(true);
      config = makeConfig(["essential", "analytics"], { respectGPC: true });
      consentState = new ConsentStateManager(config);
      vi.spyOn(consentState, "setConsent");

      const result = new GPCDetector(config, consentState, eventBus).detect();

      expect(consentState.setConsent).not.toHaveBeenCalledWith("marketing", expect.anything());
      expect(result.rejectedCategories).toEqual([]);
    });

    it("skips social-media if not configured", () => {
      setGPC(true);
      config = makeConfig(["essential", "marketing"], { respectGPC: true });
      consentState = new ConsentStateManager(config);
      vi.spyOn(consentState, "setConsent");

      const result = new GPCDetector(config, consentState, eventBus).detect();

      expect(result.rejectedCategories).toEqual(["marketing"]);
      expect(consentState.setConsent).not.toHaveBeenCalledWith("social-media", expect.anything());
    });

    it("rejects only configured GPC categories", () => {
      setGPC(true);
      config = makeConfig(["essential", "marketing", "analytics"], { respectGPC: true });
      consentState = new ConsentStateManager(config);
      vi.spyOn(consentState, "setConsent");

      const result = new GPCDetector(config, consentState, eventBus).detect();

      expect(result.rejectedCategories).toEqual(["marketing"]);
      expect(consentState.setConsent).toHaveBeenCalledTimes(1);
      expect(consentState.setConsent).toHaveBeenCalledWith("marketing", false);
    });
  });
});
