/**
 * Tests for executor action handlers and sequence execution.
 *
 * Validates click, eval, waitFor, toggle, postResult, and
 * executeActionSequence behaviors.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  MockMutationObserver,
  setupExecutorTest,
  teardownExecutorTest,
} from "./helpers/executor-fixtures";

beforeEach(() => setupExecutorTest());
afterEach(() => teardownExecutorTest());

// -- executeClick tests -------------------------------------------------------

describe("executeClick", () => {
  it("clicks element when present", async () => {
    const { executeClick } = await import("@/content/executor");
    const btn = document.createElement("button");
    btn.id = "accept-btn";
    const clickSpy = vi.fn();
    btn.addEventListener("click", clickSpy);
    document.body.appendChild(btn);

    const result = await executeClick("#accept-btn");
    expect(result).toBe(true);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("returns false when element not found within timeout", async () => {
    const { executeClick } = await import("@/content/executor");
    const promise = executeClick("#nonexistent", 100);
    vi.advanceTimersByTime(200);
    const result = await promise;
    expect(result).toBe(false);
  });
});

// -- executeWaitFor tests -----------------------------------------------------

describe("executeWaitFor", () => {
  it("resolves immediately when element already present", async () => {
    const { executeWaitFor } = await import("@/content/executor");
    const el = document.createElement("div");
    el.id = "existing";
    document.body.appendChild(el);

    const result = await executeWaitFor("#existing");
    expect(result).toBe(true);
  });

  it("resolves when element appears after delay", async () => {
    const { executeWaitFor } = await import("@/content/executor");
    const promise = executeWaitFor("#delayed", 3000);

    setTimeout(() => {
      const el = document.createElement("div");
      el.id = "delayed";
      document.body.appendChild(el);
      const obs = MockMutationObserver.instances[MockMutationObserver.instances.length - 1];
      if (obs) obs.trigger();
    }, 500);

    vi.advanceTimersByTime(600);
    const result = await promise;
    expect(result).toBe(true);
  });

  it("returns false on timeout", async () => {
    const { executeWaitFor } = await import("@/content/executor");
    const promise = executeWaitFor("#never-appears", 500);
    vi.advanceTimersByTime(600);
    const result = await promise;
    expect(result).toBe(false);
  });
});

// -- executeEval tests --------------------------------------------------------

describe("executeEval", () => {
  it("returns true for valid expression", async () => {
    const { executeEval } = await import("@/content/executor");
    const result = executeEval("1 + 1");
    expect(result).toBe(true);
  });

  it("returns false for throwing expression", async () => {
    const { executeEval } = await import("@/content/executor");
    const result = executeEval("throw new Error('fail')");
    expect(result).toBe(false);
  });

  it("returns false for syntax error", async () => {
    const { executeEval } = await import("@/content/executor");
    const result = executeEval("}{invalid");
    expect(result).toBe(false);
  });
});

// -- executeToggle tests ------------------------------------------------------

describe("executeToggle", () => {
  it("checks an unchecked checkbox when value is 'on'", async () => {
    const { executeToggle } = await import("@/content/executor");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "toggle-test";
    checkbox.checked = false;
    document.body.appendChild(checkbox);

    const result = executeToggle("#toggle-test", "on");
    expect(result).toBe(true);
    expect(checkbox.checked).toBe(true);
  });

  it("leaves checkbox checked when already checked and value is 'true'", async () => {
    const { executeToggle } = await import("@/content/executor");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "toggle-test2";
    checkbox.checked = true;
    document.body.appendChild(checkbox);

    const result = executeToggle("#toggle-test2", "true");
    expect(result).toBe(true);
    expect(checkbox.checked).toBe(true);
  });

  it("unchecks a checked checkbox when value is 'false'", async () => {
    const { executeToggle } = await import("@/content/executor");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "toggle-test3";
    checkbox.checked = true;
    document.body.appendChild(checkbox);

    const result = executeToggle("#toggle-test3", "false");
    expect(result).toBe(true);
    expect(checkbox.checked).toBe(false);
  });

  it("returns false when element not found", async () => {
    const { executeToggle } = await import("@/content/executor");
    const result = executeToggle("#nonexistent", "on");
    expect(result).toBe(false);
  });
});

// -- postResult tests ---------------------------------------------------------

describe("postResult", () => {
  it("calls window.postMessage with correct format", async () => {
    const { postResult, EXECUTOR_MESSAGE_TYPE } = await import("@/content/executor");
    const spy = vi.spyOn(window, "postMessage");

    postResult({
      domain: "example.com",
      cmp: "onetrust",
      method: "api",
      categoriesAccepted: ["essential", "functional"],
      categoriesRejected: ["marketing"],
      confidence: "high",
      success: true,
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const [data, origin] = spy.mock.calls[0];
    expect(data.type).toBe(EXECUTOR_MESSAGE_TYPE);
    expect(data.payload.domain).toBe("example.com");
    expect(data.payload.success).toBe(true);
    expect(typeof data.payload.timestamp).toBe("number");
    expect(origin).toBe("*");
  });
});

// -- executeActionSequence tests ----------------------------------------------

describe("executeActionSequence", () => {
  it("executes all steps in order and returns true", async () => {
    const { executeActionSequence } = await import("@/content/executor");
    const btn = document.createElement("button");
    btn.id = "step-btn";
    document.body.appendChild(btn);

    const result = await executeActionSequence([{ type: "click", target: "#step-btn" }]);
    expect(result).toBe(true);
  });

  it("stops and returns false if a step fails", async () => {
    const { executeActionSequence } = await import("@/content/executor");
    const promise = executeActionSequence([
      { type: "click", target: "#nonexistent", timeout: 100 },
      { type: "click", target: "#never-reached" },
    ]);
    vi.advanceTimersByTime(200);
    const result = await promise;
    expect(result).toBe(false);
  });

  it("returns true for empty sequence", async () => {
    const { executeActionSequence } = await import("@/content/executor");
    const result = await executeActionSequence([]);
    expect(result).toBe(true);
  });
});
