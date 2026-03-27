/**
 * Tests for NoCookie CMP native handshake handler.
 *
 * Validates hello message sending, ACK response handling,
 * CMP detection helpers, and the full handshake flow.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// -- Setup / Teardown ---------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// -- Detection helpers --------------------------------------------------------

describe("isNoCookieCmpPresent", () => {
  it("returns false when no CMP element exists", async () => {
    const { isNoCookieCmpPresent } = await import("@/content/nocookie-handler");
    expect(isNoCookieCmpPresent()).toBe(false);
  });

  it("returns true when #ca-cmp-root exists", async () => {
    const el = document.createElement("div");
    el.id = "ca-cmp-root";
    document.body.appendChild(el);

    const { isNoCookieCmpPresent } = await import("@/content/nocookie-handler");
    expect(isNoCookieCmpPresent()).toBe(true);

    document.body.removeChild(el);
  });

  it("returns true when __cookiesAccepterCMP global exists", async () => {
    (window as Record<string, unknown>).__cookiesAccepterCMP = {};
    const { isNoCookieCmpPresent } = await import("@/content/nocookie-handler");
    expect(isNoCookieCmpPresent()).toBe(true);
    delete (window as Record<string, unknown>).__cookiesAccepterCMP;
  });
});

describe("getCmpVersion", () => {
  it("returns null when no CMP element exists", async () => {
    const { getCmpVersion } = await import("@/content/nocookie-handler");
    expect(getCmpVersion()).toBeNull();
  });

  it("returns version from data-ca-version attribute", async () => {
    const el = document.createElement("div");
    el.id = "ca-cmp-root";
    el.setAttribute("data-ca-version", "2.1.0");
    document.body.appendChild(el);

    const { getCmpVersion } = await import("@/content/nocookie-handler");
    expect(getCmpVersion()).toBe("2.1.0");

    document.body.removeChild(el);
  });
});

// -- Hello message ------------------------------------------------------------

describe("sendHello", () => {
  it("posts CA_EXTENSION_HELLO with user preferences", async () => {
    const postSpy = vi.spyOn(window, "postMessage");
    const { sendHello } = await import("@/content/nocookie-handler");

    const prefs = {
      essential: true as const,
      functional: true,
      analytics: false,
      marketing: false,
      socialMedia: false,
    };

    sendHello(prefs);

    expect(postSpy).toHaveBeenCalledWith(
      {
        type: "CA_EXTENSION_HELLO",
        version: "1.0",
        preferences: {
          essential: true,
          functional: true,
          analytics: false,
          marketing: false,
          socialMedia: false,
        },
      },
      "*",
    );
  });
});

// -- ACK handling -------------------------------------------------------------

describe("waitForAck", () => {
  it("resolves with ConsentResult when ACK received", async () => {
    vi.useRealTimers();
    const { waitForAck } = await import("@/content/nocookie-handler");

    const promise = waitForAck("example.com");

    // Simulate CMP sending ACK via dispatchEvent (synchronous in jsdom)
    window.dispatchEvent(
      new MessageEvent("message", {
        source: window,
        data: {
          type: "CA_EXTENSION_ACK",
          appliedPreferences: {
            essential: true,
            functional: true,
            analytics: false,
            marketing: false,
          },
        },
      }),
    );

    const result = await promise;
    expect(result).not.toBeNull();
    expect(result!.domain).toBe("example.com");
    expect(result!.cmp).toBe("NoCookie CMP");
    expect(result!.method).toBe("extension-native");
    expect(result!.confidence).toBe("high");
    expect(result!.success).toBe(true);
    expect(result!.categoriesAccepted).toContain("essential");
    expect(result!.categoriesAccepted).toContain("functional");
    expect(result!.categoriesRejected).toContain("analytics");
    expect(result!.categoriesRejected).toContain("marketing");
  });

  it("resolves with null on timeout", async () => {
    const { waitForAck } = await import("@/content/nocookie-handler");

    const promise = waitForAck("example.com");

    // Advance past ACK timeout (3000ms)
    vi.advanceTimersByTime(3100);

    const result = await promise;
    expect(result).toBeNull();
  });

  it("ignores non-ACK messages and times out", async () => {
    const { waitForAck } = await import("@/content/nocookie-handler");

    const promise = waitForAck("example.com");

    // Dispatch a non-ACK message
    window.dispatchEvent(
      new MessageEvent("message", {
        source: window,
        data: { type: "SOME_OTHER_MESSAGE" },
      }),
    );

    // Advance past timeout
    vi.advanceTimersByTime(3100);

    const result = await promise;
    expect(result).toBeNull();
  });
});

// -- Full handshake -----------------------------------------------------------

describe("executeNoCookieHandshake", () => {
  it("sends hello and returns result on ACK", async () => {
    vi.useRealTimers();
    const postSpy = vi.spyOn(window, "postMessage");
    const { executeNoCookieHandshake } = await import("@/content/nocookie-handler");

    const prefs = {
      essential: true as const,
      functional: false,
      analytics: false,
      marketing: false,
      socialMedia: false,
    };

    const promise = executeNoCookieHandshake(prefs, "test.com");

    // Verify hello was sent
    expect(postSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "CA_EXTENSION_HELLO" }),
      "*",
    );

    // Simulate ACK via dispatchEvent
    window.dispatchEvent(
      new MessageEvent("message", {
        source: window,
        data: {
          type: "CA_EXTENSION_ACK",
          appliedPreferences: { essential: true },
        },
      }),
    );

    const result = await promise;
    expect(result).not.toBeNull();
    expect(result!.method).toBe("extension-native");
    expect(result!.domain).toBe("test.com");
  });

  it("returns null when CMP does not respond", async () => {
    const { executeNoCookieHandshake } = await import("@/content/nocookie-handler");

    const prefs = {
      essential: true as const,
      functional: false,
      analytics: false,
      marketing: false,
      socialMedia: false,
    };

    const promise = executeNoCookieHandshake(prefs, "silent.com");

    vi.advanceTimersByTime(3100);

    const result = await promise;
    expect(result).toBeNull();
  });
});
