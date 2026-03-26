/**
 * Verifies that the @/ path alias resolves correctly.
 */

import { describe, it, expect } from "vitest";

describe("path alias", () => {
  it("imports from @/shared/types without error", async () => {
    const mod = await import("@/shared/types");
    expect(mod).toBeDefined();
  });
});
