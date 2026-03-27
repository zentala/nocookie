/**
 * Build output verification tests.
 *
 * Ensures the Vite build produces all expected distribution files
 * with correct content for both CDN (UMD) and npm (ESM) usage.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const distDir = resolve(__dirname, "..", "dist");

/** Helper to read a dist file as UTF-8 string. */
function readDistFile(filename: string): string {
  return readFileSync(resolve(distDir, filename), "utf-8");
}

describe("build output", () => {
  describe("ESM bundle", () => {
    const file = "nocookie-cmp.esm.js";

    it("exists", () => {
      expect(existsSync(resolve(distDir, file))).toBe(true);
    });

    it("contains NoCookieCMP export", () => {
      const content = readDistFile(file);
      expect(content).toContain("NoCookieCMP");
    });

    it("has source map", () => {
      expect(existsSync(resolve(distDir, `${file}.map`))).toBe(true);
    });
  });

  describe("UMD bundle", () => {
    const file = "nocookie-cmp.umd.cjs";

    it("exists", () => {
      expect(existsSync(resolve(distDir, file))).toBe(true);
    });

    it("contains NoCookieCMP global name", () => {
      const content = readDistFile(file);
      expect(content).toContain("NoCookieCMP");
    });

    it("has source map", () => {
      expect(existsSync(resolve(distDir, `${file}.map`))).toBe(true);
    });
  });

  describe("CSS bundle", () => {
    const file = "nocookie-cmp.css";

    it("exists", () => {
      expect(existsSync(resolve(distDir, file))).toBe(true);
    });

    it("is non-empty", () => {
      const content = readDistFile(file);
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe("type declarations", () => {
    it("index.d.ts exists (requires successful tsc build)", () => {
      expect(existsSync(resolve(distDir, "index.d.ts"))).toBe(true);
    });
  });
});
