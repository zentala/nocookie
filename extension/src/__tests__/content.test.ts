/**
 * Tests for content script modules (observer + detector).
 *
 * Validates CMP detection by DOM selectors, script URLs,
 * MutationObserver fallback, timeout behavior, and SPA navigation.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// -- Mock MutationObserver ----------------------------------------------------

type MockCallback = MutationCallback;

class MockMutationObserver {
  static instances: MockMutationObserver[] = [];
  callback: MockCallback;
  observing = false;

  constructor(callback: MockCallback) {
    this.callback = callback;
    MockMutationObserver.instances.push(this);
  }

  observe(): void {
    this.observing = true;
  }

  disconnect(): void {
    this.observing = false;
  }

  /** Simulate a DOM mutation. */
  trigger(mutations: Partial<MutationRecord>[] = [{ type: "childList" }]): void {
    this.callback(mutations as MutationRecord[], this);
  }

  takeRecords(): MutationRecord[] {
    return [];
  }
}

// -- Chrome mock --------------------------------------------------------------

function installContentChromeMock(): void {
  const sendMessage = vi.fn(() => Promise.resolve());
  const addListener = vi.fn();

  globalThis.chrome = {
    runtime: {
      sendMessage,
      onMessage: { addListener },
    },
  } as unknown as typeof chrome;
}

// -- DOM helpers --------------------------------------------------------------

function resetDom(): void {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  while (document.head.firstChild) {
    document.head.removeChild(document.head.firstChild);
  }
}

function addCmpElement(selector: string): void {
  const el = document.createElement("div");
  if (selector.startsWith("#")) {
    el.id = selector.slice(1);
  } else if (selector.startsWith(".")) {
    el.className = selector.slice(1);
  }
  document.body.appendChild(el);
}

function addScriptElement(src: string): void {
  const script = document.createElement("script");
  script.src = src;
  document.head.appendChild(script);
}

// -- Message call helpers -----------------------------------------------------

interface SentMessage {
  type: string;
  payload: Record<string, unknown>;
}

/** Extract sent messages from chrome.runtime.sendMessage mock calls. */
function getSentMessages(): SentMessage[] {
  return vi
    .mocked(chrome.runtime.sendMessage)
    .mock.calls.map((c) => c[0] as unknown as SentMessage);
}

/** Find a sent message by type. */
function findMessage(type: string): SentMessage | undefined {
  return getSentMessages().find((m) => m.type === type);
}

// -- Setup / Teardown ---------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
  MockMutationObserver.instances = [];
  globalThis.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;
  installContentChromeMock();
  resetDom();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// -- Observer tests -----------------------------------------------------------

describe("observer", () => {
  it("findCmpSelector returns null when no CMP in DOM", async () => {
    const { findCmpSelector } = await import("@/content/observer");
    expect(findCmpSelector()).toBeNull();
  });

  it("findCmpSelector returns matched selector", async () => {
    addCmpElement("#onetrust-consent-sdk");
    const { findCmpSelector } = await import("@/content/observer");
    expect(findCmpSelector()).toBe("#onetrust-consent-sdk");
  });

  it("startObserver calls onDetected when CMP appears", async () => {
    const { startObserver } = await import("@/content/observer");
    const onDetected = vi.fn();

    startObserver(onDetected);

    // Simulate CMP appearing in DOM
    addCmpElement("#CybotCookiebotDialog");

    // Trigger mutation
    const obs = MockMutationObserver.instances[0];
    obs.trigger();

    // Advance debounce timer
    vi.advanceTimersByTime(100);

    expect(onDetected).toHaveBeenCalledWith("#CybotCookiebotDialog");
  });

  it("startObserver auto-disconnects after detection", async () => {
    const { startObserver } = await import("@/content/observer");
    const onDetected = vi.fn();

    startObserver(onDetected);
    addCmpElement("#didomi-host");

    const obs = MockMutationObserver.instances[0];
    obs.trigger();
    vi.advanceTimersByTime(100);

    expect(obs.observing).toBe(false);
  });

  it("startObserver debounces rapid mutations", async () => {
    const { startObserver } = await import("@/content/observer");
    const onDetected = vi.fn();

    startObserver(onDetected);

    const obs = MockMutationObserver.instances[0];
    obs.trigger();
    obs.trigger();
    obs.trigger();

    // No CMP element yet, so onDetected should not fire
    vi.advanceTimersByTime(100);
    expect(onDetected).not.toHaveBeenCalled();

    // Now add CMP and trigger again
    addCmpElement("#cmpbox");
    obs.trigger();
    vi.advanceTimersByTime(100);

    expect(onDetected).toHaveBeenCalledTimes(1);
  });

  it("stopObserver disconnects the observer", async () => {
    const { startObserver, stopObserver } = await import("@/content/observer");
    const onDetected = vi.fn();

    const observer = startObserver(onDetected);
    const obs = MockMutationObserver.instances[0];
    expect(obs.observing).toBe(true);

    stopObserver(observer);
    expect(obs.observing).toBe(false);
  });
});

// -- Detector tests -----------------------------------------------------------

describe("detector", () => {
  describe("scanScriptUrls", () => {
    it("returns null when no CMP scripts present", async () => {
      const { scanScriptUrls } = await import("@/content/detector");
      expect(scanScriptUrls()).toBeNull();
    });

    it("detects OneTrust by script URL", async () => {
      addScriptElement("https://cdn.cookielaw.org/scripttemplates/otSDKStub.js");
      const { scanScriptUrls } = await import("@/content/detector");
      expect(scanScriptUrls()).toBe("onetrust");
    });

    it("detects Cookiebot by script URL", async () => {
      addScriptElement("https://consent.cookiebot.com/uc.js");
      const { scanScriptUrls } = await import("@/content/detector");
      expect(scanScriptUrls()).toBe("cookiebot");
    });
  });

  describe("runDetection", () => {
    it("sends CMP_DETECTED when DOM selector matches immediately", async () => {
      addCmpElement("#onetrust-consent-sdk");
      await import("@/content/detector"); // init() calls runDetection()

      const messages = getSentMessages();
      const types = messages.map((m) => m.type);

      expect(types).toContain("SCAN_STARTED");
      expect(types).toContain("CMP_DETECTED");

      const detected = findMessage("CMP_DETECTED");
      expect(detected!.payload.cmp).toBe("onetrust");
    });

    it("sends CMP_DETECTED when script URL matches", async () => {
      addScriptElement("https://cdn.cookielaw.org/consent.js");
      await import("@/content/detector");

      const detected = findMessage("CMP_DETECTED");
      expect(detected).toBeDefined();
      expect(detected!.payload.confidence).toBe("medium");
    });

    it("starts observer when no CMP found initially", async () => {
      await import("@/content/detector");

      expect(MockMutationObserver.instances.length).toBeGreaterThan(0);
      const obs = MockMutationObserver.instances[MockMutationObserver.instances.length - 1];
      expect(obs.observing).toBe(true);
    });

    it("observer detects new CMP element and sends CMP_DETECTED", async () => {
      await import("@/content/detector");

      vi.mocked(chrome.runtime.sendMessage).mockClear();

      addCmpElement("#CybotCookiebotDialog");
      const obs = MockMutationObserver.instances[MockMutationObserver.instances.length - 1];
      obs.trigger();
      vi.advanceTimersByTime(100);

      const detected = findMessage("CMP_DETECTED");
      expect(detected).toBeDefined();
      expect(detected!.payload.cmp).toBe("cookiebot");
    });

    it("sends SCAN_COMPLETE with cmpFound:false after timeout", async () => {
      await import("@/content/detector");

      vi.mocked(chrome.runtime.sendMessage).mockClear();

      vi.advanceTimersByTime(5000);

      const complete = findMessage("SCAN_COMPLETE");
      expect(complete).toBeDefined();
      expect(complete!.payload.cmpFound).toBe(false);
    });
  });

  describe("SPA navigation", () => {
    it("re-runs detection on popstate", async () => {
      await import("@/content/detector");

      vi.mocked(chrome.runtime.sendMessage).mockClear();

      window.dispatchEvent(new Event("popstate"));

      const scanStarted = findMessage("SCAN_STARTED");
      expect(scanStarted).toBeDefined();
    });

    it("re-runs detection on hashchange", async () => {
      await import("@/content/detector");

      vi.mocked(chrome.runtime.sendMessage).mockClear();

      window.dispatchEvent(new Event("hashchange"));

      const scanStarted = findMessage("SCAN_STARTED");
      expect(scanStarted).toBeDefined();
    });
  });
});
