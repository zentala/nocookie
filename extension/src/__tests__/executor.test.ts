/**
 * Tests for executor action sequence selection logic.
 *
 * Validates selectActionSequence with different preference combos
 * (accept all, reject all, custom, fallback).
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  makeRule,
  PREFS_ACCEPT_ALL,
  PREFS_REJECT_ALL,
  PREFS_CUSTOM,
  setupExecutorTest,
  teardownExecutorTest,
} from "./helpers/executor-fixtures";

beforeEach(() => setupExecutorTest());
afterEach(() => teardownExecutorTest());

describe("selectActionSequence", () => {
  it("returns acceptAll when all optional categories accepted", async () => {
    const { selectActionSequence } = await import("@/content/executor");
    const rule = makeRule();
    const result = selectActionSequence(rule, PREFS_ACCEPT_ALL);

    expect(result.sequence).toBe(rule.actions.acceptAll);
    expect(result.categoriesAccepted).toContain("essential");
    expect(result.categoriesAccepted).toContain("marketing");
    expect(result.categoriesRejected).toHaveLength(0);
  });

  it("returns rejectAll when all optional categories rejected", async () => {
    const { selectActionSequence } = await import("@/content/executor");
    const rule = makeRule();
    const result = selectActionSequence(rule, PREFS_REJECT_ALL);

    expect(result.sequence).toBe(rule.actions.rejectAll);
    expect(result.categoriesAccepted).toEqual(["essential"]);
    expect(result.categoriesRejected).toContain("functional");
    expect(result.categoriesRejected).toContain("marketing");
  });

  it("returns custom sequence for mixed preferences", async () => {
    const { selectActionSequence } = await import("@/content/executor");
    const rule = makeRule();
    const result = selectActionSequence(rule, PREFS_CUSTOM);

    expect(result.sequence).toBe(rule.actions.custom);
    expect(result.categoriesAccepted).toContain("functional");
    expect(result.categoriesAccepted).toContain("analytics");
    expect(result.categoriesRejected).toContain("marketing");
    expect(result.categoriesRejected).toContain("socialMedia");
  });

  it("falls back to rejectAll when custom is empty and prefs are mixed", async () => {
    const { selectActionSequence } = await import("@/content/executor");
    const rule = makeRule({
      actions: {
        acceptAll: [],
        rejectAll: [{ type: "click", target: "#r" }],
        custom: [],
      },
    });
    const result = selectActionSequence(rule, PREFS_CUSTOM);

    expect(result.sequence).toBe(rule.actions.rejectAll);
    expect(result.categoriesAccepted).toEqual(["essential"]);
  });
});
