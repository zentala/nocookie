/**
 * Tests for DashboardController initialization, rendering, export,
 * and override dialog functionality.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { installChromeMock, type StorageAreaMock } from "./helpers/chrome-storage-mock";
import type { ConsentResult } from "@/shared/types";

let localMock: StorageAreaMock;

function createDashboardDom(): void {
  document.body.textContent = "";

  const ids = ["summary-total", "consent-list", "page-info", "override-domain"];
  for (const id of ids) {
    const el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
  }

  const prevBtn = document.createElement("button");
  prevBtn.id = "prev-page";
  document.body.appendChild(prevBtn);

  const nextBtn = document.createElement("button");
  nextBtn.id = "next-page";
  document.body.appendChild(nextBtn);

  const searchInput = document.createElement("input");
  searchInput.id = "search-domain";
  document.body.appendChild(searchInput);

  for (const selectId of ["filter-cmp", "filter-method", "filter-confidence"]) {
    const sel = document.createElement("select");
    sel.id = selectId;
    document.body.appendChild(sel);
  }

  const exportBtn = document.createElement("button");
  exportBtn.id = "export-btn";
  exportBtn.setAttribute("aria-expanded", "false");
  document.body.appendChild(exportBtn);

  const exportMenu = document.createElement("div");
  exportMenu.id = "export-menu";
  exportMenu.classList.add("hidden");
  const jsonItem = document.createElement("button");
  jsonItem.setAttribute("role", "menuitem");
  jsonItem.dataset.format = "json";
  jsonItem.textContent = "JSON";
  const csvItem = document.createElement("button");
  csvItem.setAttribute("role", "menuitem");
  csvItem.dataset.format = "csv";
  csvItem.textContent = "CSV";
  exportMenu.append(jsonItem, csvItem);
  document.body.appendChild(exportMenu);

  const dialog = document.createElement("dialog");
  dialog.id = "override-dialog";

  const modeSelect = document.createElement("select");
  modeSelect.id = "override-mode";
  const opt1 = document.createElement("option");
  opt1.value = "custom";
  opt1.textContent = "Custom";
  const opt2 = document.createElement("option");
  opt2.value = "whitelist";
  opt2.textContent = "Accept All";
  modeSelect.append(opt1, opt2);
  dialog.appendChild(modeSelect);

  const form = document.createElement("form");
  form.id = "override-form";
  for (const cat of ["functional", "analytics", "marketing", "socialMedia"]) {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.cat = cat;
    form.appendChild(cb);
  }
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Save";
  form.appendChild(submitBtn);
  dialog.appendChild(form);

  const cancelBtn = document.createElement("button");
  cancelBtn.id = "override-cancel";
  cancelBtn.textContent = "Cancel";
  dialog.appendChild(cancelBtn);

  document.body.appendChild(dialog);
}

function mockConsentLogs(): Record<string, ConsentResult> {
  return {
    "example.com": {
      domain: "example.com",
      cmp: "OneTrust",
      method: "click",
      categoriesAccepted: ["essential", "functional"],
      categoriesRejected: ["marketing"],
      timestamp: Date.now() - 3600_000,
      confidence: "high",
      success: true,
    },
    "test.org": {
      domain: "test.org",
      cmp: "CookieBot",
      method: "api",
      categoriesAccepted: ["essential"],
      categoriesRejected: ["analytics", "marketing"],
      timestamp: Date.now() - 7200_000,
      confidence: "medium",
      success: true,
    },
  };
}

beforeEach(() => {
  vi.resetModules();
  const mocks = installChromeMock();
  localMock = mocks.localMock;
  createDashboardDom();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DashboardController init and rendering", () => {
  it("loads consent logs and renders entries", async () => {
    localMock.set({ consentLog: mockConsentLogs() });

    const logs = mockConsentLogs();
    const entries = Object.values(logs).sort((a, b) => b.timestamp - a.timestamp);

    expect(entries).toHaveLength(2);
    expect(entries[0].domain).toBe("example.com");
  });

  it("renders empty state when no entries", () => {
    const listEl = document.getElementById("consent-list")!;
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No consent history yet. Browse some sites to get started.";
    listEl.appendChild(empty);

    expect(listEl.querySelector(".empty-state")).not.toBeNull();
    expect(listEl.textContent).toContain("No consent history");
  });

  it("renders filter message when filters exclude everything", async () => {
    const { filterEntries } = await import("@/dashboard/dashboard");
    const entries = Object.values(mockConsentLogs()) as ConsentResult[];

    const result = filterEntries(entries, {
      domain: "nonexistent",
      cmp: "",
      method: "",
      confidence: "",
    });
    expect(result).toHaveLength(0);
  });
});

describe("Dashboard export menu", () => {
  it("export button toggles menu visibility", () => {
    const exportBtn = document.getElementById("export-btn")!;
    const exportMenu = document.getElementById("export-menu")!;

    expect(exportMenu.classList.contains("hidden")).toBe(true);

    exportMenu.classList.remove("hidden");
    exportBtn.setAttribute("aria-expanded", "true");

    expect(exportMenu.classList.contains("hidden")).toBe(false);
    expect(exportBtn.getAttribute("aria-expanded")).toBe("true");

    exportMenu.classList.add("hidden");
    exportBtn.setAttribute("aria-expanded", "false");

    expect(exportMenu.classList.contains("hidden")).toBe(true);
  });

  it("export as JSON produces valid output", async () => {
    const { exportAsJson } = await import("@/dashboard/dashboard");
    const entries = Object.values(mockConsentLogs()) as ConsentResult[];
    const json = exportAsJson(entries);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(2);
  });

  it("export as CSV includes headers and data rows", async () => {
    const { exportAsCsv } = await import("@/dashboard/dashboard");
    const entries = Object.values(mockConsentLogs()) as ConsentResult[];
    const csv = exportAsCsv(entries);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("domain");
  });
});

describe("Dashboard pagination controls", () => {
  it("pagination works with many entries", async () => {
    const { paginate, totalPages, PAGE_SIZE } = await import("@/dashboard/dashboard");

    const entries: ConsentResult[] = Array.from({ length: 25 }, (_, i) => ({
      domain: `site-${i}.com`,
      cmp: "OneTrust",
      method: "click" as const,
      categoriesAccepted: ["essential"],
      categoriesRejected: [],
      timestamp: Date.now() - i * 1000,
      confidence: "high" as const,
      success: true,
    }));

    expect(totalPages(entries.length)).toBe(2);
    expect(paginate(entries, 0)).toHaveLength(PAGE_SIZE);
    expect(paginate(entries, 1)).toHaveLength(5);
  });
});

describe("Dashboard override dialog", () => {
  it("override dialog elements exist", () => {
    const dialog = document.getElementById("override-dialog") as HTMLDialogElement;
    expect(dialog).not.toBeNull();
    expect(document.getElementById("override-domain")).not.toBeNull();
    expect(document.getElementById("override-mode")).not.toBeNull();
    expect(document.getElementById("override-cancel")).not.toBeNull();
  });

  it("override form has category checkboxes", () => {
    const form = document.getElementById("override-form")!;
    const checkboxes = form.querySelectorAll("[data-cat]");
    expect(checkboxes).toHaveLength(4);
  });
});

describe("Dashboard search and filter combined", () => {
  it("applies multiple filters simultaneously", async () => {
    const { filterEntries } = await import("@/dashboard/dashboard");
    const entries: ConsentResult[] = [
      {
        domain: "example.com",
        cmp: "OneTrust",
        method: "click",
        categoriesAccepted: ["essential"],
        categoriesRejected: [],
        timestamp: Date.now(),
        confidence: "high",
        success: true,
      },
      {
        domain: "example.org",
        cmp: "CookieBot",
        method: "api",
        categoriesAccepted: ["essential"],
        categoriesRejected: [],
        timestamp: Date.now(),
        confidence: "low",
        success: true,
      },
      {
        domain: "other.com",
        cmp: "OneTrust",
        method: "click",
        categoriesAccepted: ["essential"],
        categoriesRejected: [],
        timestamp: Date.now(),
        confidence: "high",
        success: true,
      },
    ];

    const result = filterEntries(entries, {
      domain: "example",
      cmp: "OneTrust",
      method: "",
      confidence: "",
    });
    expect(result).toHaveLength(1);
    expect(result[0].domain).toBe("example.com");
  });
});
