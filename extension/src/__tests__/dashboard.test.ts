/**
 * Tests for the consent dashboard logic.
 * Validates rendering, search, filters, pagination, export, and timestamps.
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import type { ConsentResult } from "@/shared/types";
import {
  filterEntries,
  paginate,
  totalPages,
  formatRelativeTime,
  exportAsJson,
  exportAsCsv,
  extractUniqueCmps,
  extractUniqueMethods,
  renderEntry,
  PAGE_SIZE,
} from "@/dashboard/dashboard";
import type { FilterState } from "@/dashboard/dashboard";

/** Create a minimal ConsentResult for testing. */
function mockEntry(overrides: Partial<ConsentResult> = {}): ConsentResult {
  return {
    domain: "example.com",
    cmp: "OneTrust",
    method: "click",
    categoriesAccepted: ["essential", "functional"],
    categoriesRejected: ["analytics", "marketing"],
    timestamp: Date.now() - 3600_000,
    confidence: "high",
    success: true,
    ...overrides,
  };
}

/** Generate N entries with distinct domains. */
function mockEntries(count: number): ConsentResult[] {
  return Array.from({ length: count }, (_, i) =>
    mockEntry({
      domain: `site-${i}.com`,
      timestamp: Date.now() - i * 60_000,
    }),
  );
}

const NO_FILTERS: FilterState = {
  domain: "",
  cmp: "",
  method: "",
  confidence: "",
};

describe("renderEntry", () => {
  it("creates entry DOM from consent result", () => {
    const entry = mockEntry();
    const el = renderEntry(entry);
    expect(el.className).toBe("consent-entry");
    expect(el.getAttribute("role")).toBe("listitem");
    const domain = el.querySelector(".domain");
    expect(domain?.textContent).toBe("example.com");
  });

  it("shows accepted and rejected categories", () => {
    const entry = mockEntry();
    const el = renderEntry(entry);
    const accepted = el.querySelector(".accepted");
    const rejected = el.querySelector(".rejected");
    expect(accepted?.textContent).toContain("essential, functional");
    expect(rejected?.textContent).toContain("analytics, marketing");
  });

  it("includes override button with domain data", () => {
    const entry = mockEntry({ domain: "test.org" });
    const el = renderEntry(entry);
    const btn = el.querySelector(".override-btn") as HTMLElement;
    expect(btn).not.toBeNull();
    expect(btn.dataset.domain).toBe("test.org");
  });

  it("displays confidence badge", () => {
    const entry = mockEntry({ confidence: "medium" });
    const el = renderEntry(entry);
    const badge = el.querySelector(".confidence-badge");
    expect(badge?.textContent).toBe("medium");
    expect(badge?.classList.contains("confidence-medium")).toBe(true);
  });
});

describe("filterEntries — search by domain", () => {
  it("filters entries by domain substring", () => {
    const entries = [
      mockEntry({ domain: "example.com" }),
      mockEntry({ domain: "test.org" }),
      mockEntry({ domain: "example.org" }),
    ];
    const result = filterEntries(entries, { ...NO_FILTERS, domain: "example" });
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.domain.includes("example"))).toBe(true);
  });

  it("returns all entries when domain filter is empty", () => {
    const entries = mockEntries(5);
    expect(filterEntries(entries, NO_FILTERS)).toHaveLength(5);
  });
});

describe("filterEntries — filter by CMP", () => {
  it("filters by CMP name", () => {
    const entries = [
      mockEntry({ cmp: "OneTrust" }),
      mockEntry({ cmp: "CookieBot" }),
      mockEntry({ cmp: "OneTrust" }),
    ];
    const result = filterEntries(entries, { ...NO_FILTERS, cmp: "CookieBot" });
    expect(result).toHaveLength(1);
    expect(result[0].cmp).toBe("CookieBot");
  });
});

describe("filterEntries — filter by method", () => {
  it("filters by method", () => {
    const entries = [
      mockEntry({ method: "click" }),
      mockEntry({ method: "api" }),
      mockEntry({ method: "tcf" }),
    ];
    const result = filterEntries(entries, { ...NO_FILTERS, method: "api" });
    expect(result).toHaveLength(1);
  });
});

describe("filterEntries — filter by confidence", () => {
  it("filters by confidence level", () => {
    const entries = [
      mockEntry({ confidence: "high" }),
      mockEntry({ confidence: "low" }),
      mockEntry({ confidence: "high" }),
    ];
    const result = filterEntries(entries, { ...NO_FILTERS, confidence: "high" });
    expect(result).toHaveLength(2);
  });
});

describe("pagination", () => {
  it("returns first page of entries", () => {
    const entries = mockEntries(25);
    const page = paginate(entries, 0);
    expect(page).toHaveLength(PAGE_SIZE);
    expect(page[0].domain).toBe("site-0.com");
  });

  it("returns second page with remaining entries", () => {
    const entries = mockEntries(25);
    const page = paginate(entries, 1);
    expect(page).toHaveLength(5);
    expect(page[0].domain).toBe("site-20.com");
  });

  it("returns empty for out-of-range page", () => {
    const entries = mockEntries(5);
    expect(paginate(entries, 5)).toHaveLength(0);
  });

  it("prev/next: totalPages computes correctly", () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(1)).toBe(1);
    expect(totalPages(PAGE_SIZE)).toBe(1);
    expect(totalPages(PAGE_SIZE + 1)).toBe(2);
    expect(totalPages(PAGE_SIZE * 3)).toBe(3);
  });
});

describe("exportAsJson", () => {
  it("generates valid JSON", () => {
    const entries = [mockEntry(), mockEntry({ domain: "other.com" })];
    const json = exportAsJson(entries);
    const parsed = JSON.parse(json) as ConsentResult[];
    expect(parsed).toHaveLength(2);
    expect(parsed[0].domain).toBe("example.com");
    expect(parsed[1].domain).toBe("other.com");
  });

  it("handles empty entries", () => {
    const json = exportAsJson([]);
    expect(JSON.parse(json)).toEqual([]);
  });
});

describe("exportAsCsv", () => {
  it("generates valid CSV with headers", () => {
    const entries = [mockEntry()];
    const csv = exportAsCsv(entries);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("domain");
    expect(lines[0]).toContain("cmp");
    expect(lines[0]).toContain("timestamp");
  });

  it("escapes quotes in CSV fields", () => {
    const entry = mockEntry({ cmp: 'My "CMP"' });
    const csv = exportAsCsv([entry]);
    expect(csv).toContain('My ""CMP""');
  });

  it("joins categories with semicolons", () => {
    const entry = mockEntry({
      categoriesAccepted: ["essential", "functional"],
    });
    const csv = exportAsCsv([entry]);
    expect(csv).toContain("essential;functional");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'just now' for timestamps less than 60 seconds ago", () => {
    expect(formatRelativeTime(Date.now() - 30_000)).toBe("just now");
  });

  it("returns minutes ago", () => {
    expect(formatRelativeTime(Date.now() - 5 * 60_000)).toBe("5 minutes ago");
  });

  it("returns singular minute", () => {
    expect(formatRelativeTime(Date.now() - 60_000)).toBe("1 minute ago");
  });

  it("returns hours ago", () => {
    expect(formatRelativeTime(Date.now() - 2 * 3600_000)).toBe("2 hours ago");
  });

  it("returns singular hour", () => {
    expect(formatRelativeTime(Date.now() - 3600_000)).toBe("1 hour ago");
  });

  it("returns days ago", () => {
    expect(formatRelativeTime(Date.now() - 3 * 86400_000)).toBe("3 days ago");
  });

  it("returns date string for old timestamps", () => {
    const old = Date.now() - 60 * 86400_000;
    const result = formatRelativeTime(old);
    expect(result).not.toContain("ago");
  });
});

describe("extractUniqueCmps", () => {
  it("returns sorted unique CMP names", () => {
    const entries = [
      mockEntry({ cmp: "CookieBot" }),
      mockEntry({ cmp: "OneTrust" }),
      mockEntry({ cmp: "CookieBot" }),
      mockEntry({ cmp: null }),
    ];
    expect(extractUniqueCmps(entries)).toEqual(["CookieBot", "OneTrust"]);
  });
});

describe("extractUniqueMethods", () => {
  it("returns sorted unique methods", () => {
    const entries = [
      mockEntry({ method: "tcf" }),
      mockEntry({ method: "api" }),
      mockEntry({ method: "click" }),
      mockEntry({ method: "api" }),
    ];
    expect(extractUniqueMethods(entries)).toEqual(["api", "click", "tcf"]);
  });
});
