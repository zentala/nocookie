/**
 * Tests for badge state management.
 *
 * Validates setBadgeState, clearBadge, getIconPaths, and per-tab
 * badge behavior with mocked Chrome APIs.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { installChromeMock } from "./helpers/chrome-storage-mock";
import type { BadgeState } from "@/shared/messages";
import {
  BADGE_COLORS,
  BADGE_TEXT,
  setBadgeState,
  clearBadge,
  getIconPaths,
} from "@/background/badge";

/** Install chrome mock with action APIs. */
function installBadgeChromeMock(): void {
  installChromeMock();

  Object.assign(globalThis.chrome, {
    action: {
      setBadgeText: vi.fn(() => Promise.resolve()),
      setBadgeBackgroundColor: vi.fn(() => Promise.resolve()),
      setIcon: vi.fn(() => Promise.resolve()),
    },
  });
}

beforeEach(() => {
  installBadgeChromeMock();
});

// -- Icon paths ---------------------------------------------------------------

describe("getIconPaths", () => {
  it("returns default paths for default state", () => {
    const paths = getIconPaths("default");
    expect(paths[16]).toBe("assets/icons/default-16.png");
    expect(paths[32]).toBe("assets/icons/default-32.png");
    expect(paths[48]).toBe("assets/icons/default-48.png");
    expect(paths[128]).toBe("assets/icons/default-128.png");
  });

  it("falls back to default paths for states without dedicated assets", () => {
    const states: BadgeState[] = ["handled", "attention", "error", "scanning", "disabled"];
    for (const state of states) {
      const paths = getIconPaths(state);
      expect(paths[16]).toBe("assets/icons/default-16.png");
    }
  });

  it("returns all 4 icon sizes", () => {
    const paths = getIconPaths("handled");
    const sizes = Object.keys(paths).map(Number);
    expect(sizes).toEqual([16, 32, 48, 128]);
  });
});

// -- setBadgeState ------------------------------------------------------------

describe("setBadgeState", () => {
  const allStates: BadgeState[] = [
    "default",
    "handled",
    "attention",
    "error",
    "disabled",
    "scanning",
  ];

  it("sets icon, text, and color for each state", async () => {
    for (const state of allStates) {
      vi.clearAllMocks();
      await setBadgeState(42, state);

      expect(chrome.action.setIcon).toHaveBeenCalledWith({
        tabId: 42,
        path: getIconPaths(state),
      });
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
        tabId: 42,
        text: BADGE_TEXT[state],
      });
      expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        tabId: 42,
        color: BADGE_COLORS[state],
      });
    }
  });

  it("calls all three chrome.action APIs in parallel", async () => {
    await setBadgeState(1, "handled");

    expect(chrome.action.setIcon).toHaveBeenCalledTimes(1);
    expect(chrome.action.setBadgeText).toHaveBeenCalledTimes(1);
    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledTimes(1);
  });

  it("applies state to the correct tabId", async () => {
    await setBadgeState(100, "error");
    await setBadgeState(200, "handled");

    const setIconCalls = vi.mocked(chrome.action.setIcon).mock.calls;
    expect(setIconCalls[0][0]).toEqual(expect.objectContaining({ tabId: 100 }));
    expect(setIconCalls[1][0]).toEqual(expect.objectContaining({ tabId: 200 }));
  });
});

// -- clearBadge ---------------------------------------------------------------

describe("clearBadge", () => {
  it("resets to default state", async () => {
    await clearBadge(55);

    expect(chrome.action.setIcon).toHaveBeenCalledWith({
      tabId: 55,
      path: getIconPaths("default"),
    });
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
      tabId: 55,
      text: "",
    });
    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      tabId: 55,
      color: BADGE_COLORS.default,
    });
  });

  it("works on different tab IDs", async () => {
    await clearBadge(1);
    await clearBadge(2);

    expect(chrome.action.setIcon).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(chrome.action.setBadgeText).mock.calls;
    expect(calls[0][0]).toEqual({ tabId: 1, text: "" });
    expect(calls[1][0]).toEqual({ tabId: 2, text: "" });
  });
});
