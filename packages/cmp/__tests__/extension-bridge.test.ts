// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ExtensionBridge } from "../src/integration/extension-bridge";
import type { ExtensionAckMessage } from "../src/integration/extension-bridge";
import { EventBus } from "../src/core/event-bus";
import type { ResolvedCMPConfig, ConsentState, CategoryId } from "../src/shared/types";
import {
  DEFAULT_BEHAVIOR,
  DEFAULT_THEME,
  DEFAULT_TRANSLATIONS,
  DEFAULT_WELL_KNOWN,
  DEFAULT_POLICY_PAGE,
} from "../src/shared/constants";

function makeConfig(categoryIds: CategoryId[] = ["essential", "analytics"]): ResolvedCMPConfig {
  return {
    siteName: "Test Site",
    categories: categoryIds.map((id) => ({ id })),
    theme: { ...DEFAULT_THEME },
    behavior: { ...DEFAULT_BEHAVIOR },
    language: "en",
    translations: { ...DEFAULT_TRANSLATIONS },
    wellKnown: { ...DEFAULT_WELL_KNOWN },
    policyPage: { ...DEFAULT_POLICY_PAGE },
    icons: {},
  };
}

/** Minimal mock of ConsentStateManager. */
function makeConsentState() {
  const state: Partial<ConsentState> = {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    "social-media": false,
  };
  return {
    setConsent: vi.fn((id: CategoryId, granted: boolean) => {
      state[id] = id === "essential" ? true : granted;
    }),
    getConsent: vi.fn(() => ({ ...state }) as ConsentState),
    acceptAll: vi.fn(),
    hasConsent: vi.fn(() => true),
    rejectAll: vi.fn(),
    reset: vi.fn(),
    getCookieString: vi.fn(() => ""),
  };
}

function sendHello(version = "1.0", preferences: Record<string, boolean> = {}) {
  window.postMessage({ type: "CA_EXTENSION_HELLO", version, preferences }, "*");
}

describe("ExtensionBridge", () => {
  let config: ResolvedCMPConfig;
  let consentState: ReturnType<typeof makeConsentState>;
  let eventBus: EventBus;
  let bridge: ExtensionBridge;
  let onHideBanner: ReturnType<typeof vi.fn>;
  let onCloseBanner: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    config = makeConfig();
    consentState = makeConsentState();
    eventBus = new EventBus();
    onHideBanner = vi.fn();
    onCloseBanner = vi.fn();
    bridge = new ExtensionBridge(config, consentState as never, eventBus, {
      onHideBanner,
      onCloseBanner,
    });
  });

  afterEach(() => {
    bridge.stop();
    vi.useRealTimers();
  });

  describe("start / markers", () => {
    it("sets the global window marker on start", () => {
      bridge.start();
      const marker = (window as unknown as Record<string, unknown>).__cookiesAccepterCMP as {
        version: string;
        protocol: string;
      };
      expect(marker).toBeDefined();
      expect(marker.version).toBe("0.1.0");
      expect(marker.protocol).toBe("1.0");
    });

    it("sets data-ca-version attribute on root element", () => {
      const el = document.createElement("div");
      el.id = "ca-cmp-root";
      bridge.setMarkers(el);
      expect(el.getAttribute("data-ca-version")).toBe("1.0");
    });

    it("cleans up global marker on stop", () => {
      bridge.start();
      bridge.stop();
      expect((window as unknown as Record<string, unknown>).__cookiesAccepterCMP).toBeUndefined();
    });
  });

  describe("hello message handling", () => {
    it("processes a valid hello message and applies preferences", async () => {
      bridge.start();
      sendHello("1.0", { essential: true, analytics: true });
      await vi.advanceTimersByTimeAsync(0);

      expect(consentState.setConsent).toHaveBeenCalledWith("essential", true);
      expect(consentState.setConsent).toHaveBeenCalledWith("analytics", true);
    });

    it("marks extension as detected after hello", async () => {
      bridge.start();
      expect(bridge.extensionDetected).toBe(false);
      sendHello("1.0", { essential: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(bridge.extensionDetected).toBe(true);
    });
  });

  describe("ACK response", () => {
    it("sends CA_EXTENSION_ACK via postMessage after hello", async () => {
      bridge.start();
      const postSpy = vi.spyOn(window, "postMessage");
      sendHello("1.0", { essential: true, analytics: false });
      await vi.advanceTimersByTimeAsync(0);

      const ackCall = postSpy.mock.calls.find(
        (call) => (call[0] as { type?: string })?.type === "CA_EXTENSION_ACK",
      );
      expect(ackCall).toBeDefined();
      const ack = ackCall![0] as ExtensionAckMessage;
      expect(ack.version).toBe("1.0");
      expect(ack.applied).toEqual({ essential: true, analytics: false });
      expect(ack.conflicts).toEqual([]);
      postSpy.mockRestore();
    });
  });

  describe("conflict detection", () => {
    it("reports categories the extension wants but site does not have", async () => {
      bridge.start();
      const postSpy = vi.spyOn(window, "postMessage");
      sendHello("1.0", { essential: true, marketing: true });
      await vi.advanceTimersByTimeAsync(0);

      const ackCall = postSpy.mock.calls.find(
        (call) => (call[0] as { type?: string })?.type === "CA_EXTENSION_ACK",
      );
      expect(ackCall).toBeDefined();
      const ack = ackCall![0] as ExtensionAckMessage;
      expect(ack.conflicts).toContain("marketing");
      postSpy.mockRestore();
    });

    it("applies only configured categories, ignoring unknown ones", async () => {
      bridge.start();
      sendHello("1.0", { essential: true, "custom-tracking": true });
      await vi.advanceTimersByTimeAsync(0);

      expect(consentState.setConsent).toHaveBeenCalledWith("essential", true);
      expect(consentState.setConsent).not.toHaveBeenCalledWith(
        "custom-tracking",
        expect.anything(),
      );
    });
  });

  describe("banner lifecycle callbacks", () => {
    it("calls onHideBanner when banner is not yet visible", async () => {
      bridge.start();
      sendHello("1.0", { essential: true });
      await vi.advanceTimersByTimeAsync(0);

      expect(onHideBanner).toHaveBeenCalledOnce();
      expect(onCloseBanner).not.toHaveBeenCalled();
    });

    it("calls onCloseBanner when banner is already visible", async () => {
      bridge.start();
      bridge.setBannerVisible(true);
      sendHello("1.0", { essential: true });
      await vi.advanceTimersByTimeAsync(0);

      expect(onCloseBanner).toHaveBeenCalledOnce();
      expect(onHideBanner).not.toHaveBeenCalled();
    });
  });

  describe("event emission", () => {
    it("emits extension:detected and extension:applied events", async () => {
      bridge.start();
      const detectedHandler = vi.fn();
      const appliedHandler = vi.fn();
      eventBus.on("extension:detected", detectedHandler);
      eventBus.on("extension:applied", appliedHandler);

      sendHello("1.0", { essential: true, analytics: true });
      await vi.advanceTimersByTimeAsync(0);

      expect(detectedHandler).toHaveBeenCalledOnce();
      expect(appliedHandler).toHaveBeenCalledOnce();
      expect(appliedHandler).toHaveBeenCalledWith(
        expect.objectContaining({ state: expect.any(Object) }),
      );
    });
  });

  describe("malformed message rejection", () => {
    it("ignores non-object messages", async () => {
      bridge.start();
      window.postMessage("random string", "*");
      await vi.advanceTimersByTimeAsync(0);
      expect(bridge.extensionDetected).toBe(false);
    });

    it("ignores null messages", async () => {
      bridge.start();
      window.postMessage(null, "*");
      await vi.advanceTimersByTimeAsync(0);
      expect(bridge.extensionDetected).toBe(false);
    });

    it("ignores messages with wrong type", async () => {
      bridge.start();
      window.postMessage({ type: "SOMETHING_ELSE", version: "1.0", preferences: {} }, "*");
      await vi.advanceTimersByTimeAsync(0);
      expect(bridge.extensionDetected).toBe(false);
    });

    it("ignores messages missing version", async () => {
      bridge.start();
      window.postMessage({ type: "CA_EXTENSION_HELLO", preferences: {} }, "*");
      await vi.advanceTimersByTimeAsync(0);
      expect(bridge.extensionDetected).toBe(false);
    });

    it("ignores messages missing preferences", async () => {
      bridge.start();
      window.postMessage({ type: "CA_EXTENSION_HELLO", version: "1.0" }, "*");
      await vi.advanceTimersByTimeAsync(0);
      expect(bridge.extensionDetected).toBe(false);
    });
  });

  describe("version validation", () => {
    it("accepts compatible major versions (1.0 with 1.5)", async () => {
      bridge.start();
      sendHello("1.5", { essential: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(bridge.extensionDetected).toBe(true);
    });

    it("rejects incompatible major versions (2.0 with 1.0)", async () => {
      bridge.start();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      sendHello("2.0", { essential: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(bridge.extensionDetected).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Incompatible extension version"),
      );
      warnSpy.mockRestore();
    });

    it("rejects non-numeric version strings", async () => {
      bridge.start();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      sendHello("abc", { essential: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(bridge.extensionDetected).toBe(false);
      warnSpy.mockRestore();
    });
  });

  describe("stop / cleanup", () => {
    it("stops listening for messages after stop()", async () => {
      bridge.start();
      bridge.stop();
      sendHello("1.0", { essential: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(bridge.extensionDetected).toBe(false);
    });

    it("clears ACK timeout on stop", async () => {
      bridge.start();
      sendHello("1.0", { essential: true });
      await vi.advanceTimersByTimeAsync(0);
      bridge.stop();
      // Advancing past timeout should not throw or warn
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      await vi.advanceTimersByTimeAsync(3000);
      const ackWarnings = warnSpy.mock.calls.filter((c) =>
        String(c[0]).includes("ACK sent but no confirmation"),
      );
      expect(ackWarnings).toHaveLength(0);
      warnSpy.mockRestore();
    });
  });

  describe("timeout warning", () => {
    it("logs a warning if no ACK confirmation within 2s", async () => {
      bridge.start();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      sendHello("1.0", { essential: true });
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(2001);

      const ackWarnings = warnSpy.mock.calls.filter((c) =>
        String(c[0]).includes("ACK sent but no confirmation"),
      );
      expect(ackWarnings.length).toBeGreaterThanOrEqual(1);
      warnSpy.mockRestore();
    });
  });
});
