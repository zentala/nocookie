import { describe, expect, it, vi } from "vitest";
import { safeAsync } from "@/shared/ui-error-handler";

describe("safeAsync", () => {
  it("executes the async function without error", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    safeAsync(fn);
    await vi.waitFor(() => expect(fn).toHaveBeenCalledOnce());
  });

  it("logs error with context when async function rejects", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("storage failed");

    safeAsync(() => Promise.reject(error), "profile change");

    await vi.waitFor(() => expect(consoleSpy).toHaveBeenCalledOnce());
    expect(consoleSpy).toHaveBeenCalledWith("[NoCookie] profile change:", error);
    consoleSpy.mockRestore();
  });

  it("logs error without context when none provided", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("unknown failure");

    safeAsync(() => Promise.reject(error));

    await vi.waitFor(() => expect(consoleSpy).toHaveBeenCalledOnce());
    expect(consoleSpy).toHaveBeenCalledWith("[NoCookie]", error);
    consoleSpy.mockRestore();
  });

  it("does not throw when the async function rejects", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      safeAsync(() => Promise.reject(new Error("boom")), "test");
    }).not.toThrow();
    consoleSpy.mockRestore();
  });
});
