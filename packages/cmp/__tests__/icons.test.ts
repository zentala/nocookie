// @vitest-environment jsdom
/**
 * @module tests/icons
 * Unit tests for the icon rendering system: category icons, privacy badges,
 * compliance badges, privacy level calculation, and sprite sheet generation.
 */

import { describe, it, expect } from "vitest";
import {
  renderCategoryIcon,
  renderPrivacyBadge,
  renderComplianceBadge,
  getPrivacyLevel,
  generateSpriteSheet,
} from "@/ui/icons";
import type { IconSize, PrivacyLevel, ComplianceBadgeType } from "@/ui/icons";
import type { CategoryId } from "@/shared/types";
import { CATEGORY_IDS } from "@/shared/constants";

const ALL_SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl", "xxl"];
const SIZE_PX: Record<IconSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
};

describe("renderCategoryIcon", () => {
  it.each(CATEGORY_IDS as unknown as CategoryId[])("renders valid SVG for category '%s'", (id) => {
    const svg = renderCategoryIcon(id);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain("<circle");
    expect(svg).toContain("<path");
  });

  it("defaults to md size (24px)", () => {
    const svg = renderCategoryIcon("essential");
    expect(svg).toContain('width="24"');
    expect(svg).toContain('height="24"');
  });

  it.each(ALL_SIZES)("renders at size '%s'", (size) => {
    const svg = renderCategoryIcon("essential", size);
    const px = SIZE_PX[size];
    expect(svg).toContain(`width="${px}"`);
    expect(svg).toContain(`height="${px}"`);
  });

  it("includes correct aria-label for each category", () => {
    const labels: Record<CategoryId, string> = {
      essential: "Essential cookies",
      functional: "Functional cookies",
      analytics: "Analytics cookies",
      marketing: "Marketing cookies",
      "social-media": "Social media cookies",
    };
    for (const [id, label] of Object.entries(labels)) {
      const svg = renderCategoryIcon(id as CategoryId);
      expect(svg).toContain(`aria-label="${label}"`);
    }
  });

  it('includes role="img" for accessibility', () => {
    const svg = renderCategoryIcon("analytics");
    expect(svg).toContain('role="img"');
  });

  it("uses the correct color from category metadata", () => {
    const svg = renderCategoryIcon("analytics");
    expect(svg).toContain('fill="#7c3aed"');
  });

  it("includes the ca-icon class", () => {
    const svg = renderCategoryIcon("essential");
    expect(svg).toContain('class="ca-icon"');
  });
});

describe("getPrivacyLevel", () => {
  it("returns 'maximum' for essential only", () => {
    expect(getPrivacyLevel(["essential"])).toBe("maximum");
  });

  it("returns 'maximum' for empty array", () => {
    expect(getPrivacyLevel([])).toBe("maximum");
  });

  it("returns 'friendly' when functional is included", () => {
    expect(getPrivacyLevel(["essential", "functional"])).toBe("friendly");
  });

  it("returns 'balanced' when analytics is included", () => {
    expect(getPrivacyLevel(["essential", "functional", "analytics"])).toBe("balanced");
  });

  it("returns 'full-tracking' when marketing is included", () => {
    expect(getPrivacyLevel(["essential", "marketing"])).toBe("full-tracking");
  });

  it("returns 'full-tracking' when social-media is included", () => {
    expect(getPrivacyLevel(["essential", "social-media"])).toBe("full-tracking");
  });

  it("returns 'full-tracking' when all categories are active", () => {
    expect(
      getPrivacyLevel(["essential", "functional", "analytics", "marketing", "social-media"]),
    ).toBe("full-tracking");
  });

  it("marketing overrides analytics (full-tracking > balanced)", () => {
    expect(getPrivacyLevel(["essential", "analytics", "marketing"])).toBe("full-tracking");
  });
});

describe("renderPrivacyBadge", () => {
  const levels: PrivacyLevel[] = ["maximum", "friendly", "balanced", "full-tracking"];

  it.each(levels)("renders badge for level '%s'", (level) => {
    const html = renderPrivacyBadge(level);
    expect(html).toContain("ca-badge");
    expect(html).toContain(`ca-badge--privacy-${level}`);
    expect(html).toContain('role="img"');
    expect(html).toContain("aria-label=");
    expect(html).toContain("<svg");
  });

  it("includes descriptive text inside the badge", () => {
    const html = renderPrivacyBadge("maximum");
    expect(html).toContain("Essential only");
  });

  it("respects size parameter", () => {
    const html = renderPrivacyBadge("friendly", "lg");
    expect(html).toContain('width="32"');
    expect(html).toContain('height="32"');
  });

  it("uses correct color for each level", () => {
    expect(renderPrivacyBadge("maximum")).toContain("#16a34a");
    expect(renderPrivacyBadge("friendly")).toContain("#2563eb");
    expect(renderPrivacyBadge("balanced")).toContain("#d97706");
    expect(renderPrivacyBadge("full-tracking")).toContain("#ea580c");
  });
});

describe("renderComplianceBadge", () => {
  const types: ComplianceBadgeType[] = ["gdpr", "gpc", "standard", "extension-ready"];

  it.each(types)("renders badge for type '%s'", (type) => {
    const html = renderComplianceBadge(type);
    expect(html).toContain("ca-badge");
    expect(html).toContain(`ca-badge--${type}`);
    expect(html).toContain('role="img"');
    expect(html).toContain("aria-label=");
    expect(html).toContain("<svg");
  });

  it("shows correct text labels", () => {
    expect(renderComplianceBadge("gdpr")).toContain("GDPR");
    expect(renderComplianceBadge("gpc")).toContain("GPC");
    expect(renderComplianceBadge("standard")).toContain("v1");
  });

  it("includes correct aria-labels", () => {
    expect(renderComplianceBadge("gdpr")).toContain('aria-label="GDPR Compliant"');
    expect(renderComplianceBadge("gpc")).toContain('aria-label="GPC Respected"');
    expect(renderComplianceBadge("standard")).toContain('aria-label="Standard Compliant"');
    expect(renderComplianceBadge("extension-ready")).toContain('aria-label="Extension Ready"');
  });

  it("uses correct colors", () => {
    expect(renderComplianceBadge("gdpr")).toContain("#2563eb");
    expect(renderComplianceBadge("gpc")).toContain("#16a34a");
    expect(renderComplianceBadge("standard")).toContain("#7c3aed");
    expect(renderComplianceBadge("extension-ready")).toContain("#ea580c");
  });
});

describe("generateSpriteSheet", () => {
  it("returns a valid SVG element", () => {
    const sheet = generateSpriteSheet();
    expect(sheet).toContain("<svg");
    expect(sheet).toContain("</svg>");
    expect(sheet).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("is hidden from display", () => {
    const sheet = generateSpriteSheet();
    expect(sheet).toContain('style="display:none"');
    expect(sheet).toContain('aria-hidden="true"');
  });

  it("contains symbols for all 5 category icons", () => {
    const sheet = generateSpriteSheet();
    for (const id of CATEGORY_IDS) {
      expect(sheet).toContain(`id="ca-icon-${id}"`);
    }
  });

  it("contains symbols for all 4 privacy levels", () => {
    const sheet = generateSpriteSheet();
    expect(sheet).toContain('id="ca-privacy-maximum"');
    expect(sheet).toContain('id="ca-privacy-friendly"');
    expect(sheet).toContain('id="ca-privacy-balanced"');
    expect(sheet).toContain('id="ca-privacy-full-tracking"');
  });

  it("includes aria-labels on category symbols", () => {
    const sheet = generateSpriteSheet();
    expect(sheet).toContain('aria-label="Essential cookies"');
    expect(sheet).toContain('aria-label="Analytics cookies"');
  });
});
