/**
 * @module __tests__/badge-kit
 * Verifies the badge kit generator produces all expected files with valid SVG/CSS content.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const CMP_ROOT = resolve(__dirname, "..");
const KIT_DIR = resolve(CMP_ROOT, "badge-kit");

/** Run the generator before all tests. */
beforeAll(() => {
  execSync("node scripts/generate-badge-kit.mjs", { cwd: CMP_ROOT });
});

describe("badge-kit generator", () => {
  const EXPECTED_ICONS = [
    "icons/essential.svg",
    "icons/functional.svg",
    "icons/analytics.svg",
    "icons/marketing.svg",
    "icons/social-media.svg",
  ];

  const EXPECTED_BADGES = [
    "badges/privacy-maximum.svg",
    "badges/privacy-friendly.svg",
    "badges/privacy-balanced.svg",
    "badges/privacy-full-tracking.svg",
  ];

  const EXPECTED_COMPLIANCE = [
    "compliance/gdpr.svg",
    "compliance/gpc.svg",
    "compliance/standard.svg",
    "compliance/extension-ready.svg",
  ];

  const EXPECTED_ROOT = ["sprite.svg", "badges.css", "README.md"];

  it("generates all category icon SVGs", () => {
    for (const file of EXPECTED_ICONS) {
      const path = resolve(KIT_DIR, file);
      expect(existsSync(path), `Missing: ${file}`).toBe(true);
    }
  });

  it("generates all privacy level badge SVGs", () => {
    for (const file of EXPECTED_BADGES) {
      const path = resolve(KIT_DIR, file);
      expect(existsSync(path), `Missing: ${file}`).toBe(true);
    }
  });

  it("generates all compliance badge SVGs", () => {
    for (const file of EXPECTED_COMPLIANCE) {
      const path = resolve(KIT_DIR, file);
      expect(existsSync(path), `Missing: ${file}`).toBe(true);
    }
  });

  it("generates root files (sprite, CSS, README)", () => {
    for (const file of EXPECTED_ROOT) {
      const path = resolve(KIT_DIR, file);
      expect(existsSync(path), `Missing: ${file}`).toBe(true);
    }
  });

  it("SVG files contain valid XML declaration and svg element", () => {
    const allSvgs = [...EXPECTED_ICONS, ...EXPECTED_BADGES, ...EXPECTED_COMPLIANCE];
    for (const file of allSvgs) {
      const content = readFileSync(resolve(KIT_DIR, file), "utf-8");
      expect(content).toContain('<?xml version="1.0"');
      expect(content).toContain("<svg");
      expect(content).toContain("</svg>");
    }
  });

  it("SVG files include accessible aria-label attributes", () => {
    const allSvgs = [...EXPECTED_ICONS, ...EXPECTED_BADGES, ...EXPECTED_COMPLIANCE];
    for (const file of allSvgs) {
      const content = readFileSync(resolve(KIT_DIR, file), "utf-8");
      expect(content).toMatch(/aria-label="[^"]+"/);
    }
  });

  it("CSS file contains all expected class selectors", () => {
    const css = readFileSync(resolve(KIT_DIR, "badges.css"), "utf-8");
    expect(css).toContain(".nocookie-badge");
    expect(css).toContain(".nocookie-badge--gdpr");
    expect(css).toContain(".nocookie-badge--gpc");
    expect(css).toContain(".nocookie-privacy--maximum");
    expect(css).toContain(".nocookie-category--essential");
    expect(css).toContain(".nocookie-category--analytics");
  });

  it("sprite sheet contains symbols for categories and privacy levels", () => {
    const sprite = readFileSync(resolve(KIT_DIR, "sprite.svg"), "utf-8");
    expect(sprite).toContain('id="ca-icon-essential"');
    expect(sprite).toContain('id="ca-icon-analytics"');
    expect(sprite).toContain('id="ca-privacy-maximum"');
    expect(sprite).toContain('id="ca-privacy-full-tracking"');
  });
});
