/**
 * Smoke tests for the extension manifest and project setup.
 */

import { describe, it, expect } from "vitest";
import manifest from "../../manifest.json";

describe("manifest.json", () => {
  it("uses Manifest V3", () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it("has correct extension name", () => {
    expect(manifest.name).toBe("NoCookie");
  });

  it("has required permissions", () => {
    expect(manifest.permissions).toContain("storage");
    expect(manifest.permissions).toContain("activeTab");
    expect(manifest.permissions).toContain("scripting");
  });

  it("has background service worker configured", () => {
    expect(manifest.background.service_worker).toBeDefined();
    expect(manifest.background.type).toBe("module");
  });

  it("has content scripts configured", () => {
    expect(manifest.content_scripts).toHaveLength(1);
    expect(manifest.content_scripts[0].matches).toContain("<all_urls>");
  });

  it("has popup configured", () => {
    expect(manifest.action.default_popup).toBeDefined();
  });
});
