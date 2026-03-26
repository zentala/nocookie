/**
 * Consent dashboard entry point.
 *
 * Renders a searchable, filterable, paginated list of all sites
 * where cookie consent was handled. Supports JSON/CSV export
 * and per-site preference overrides.
 */

import type { ConsentResult, DomainOverride } from "@/shared/types";
import { getAllConsentLogs, setDomainOverride } from "@/shared/storage-api";
import { safeAsync } from "@/shared/ui-error-handler";

/** Number of entries displayed per page. */
export const PAGE_SIZE = 20;

/** Format a timestamp as a relative time string (e.g. "2 hours ago"). */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(timestamp).toLocaleDateString();
}

/** Filter state for the dashboard. */
export interface FilterState {
  domain: string;
  cmp: string;
  method: string;
  confidence: string;
}

/** Apply filters to consent entries. */
export function filterEntries(entries: ConsentResult[], filters: FilterState): ConsentResult[] {
  return entries.filter((e) => {
    if (filters.domain && !e.domain.includes(filters.domain)) return false;
    if (filters.cmp && (e.cmp ?? "") !== filters.cmp) return false;
    if (filters.method && e.method !== filters.method) return false;
    if (filters.confidence && e.confidence !== filters.confidence) return false;
    return true;
  });
}

/** Get a page slice of entries. */
export function paginate(entries: ConsentResult[], page: number): ConsentResult[] {
  const start = page * PAGE_SIZE;
  return entries.slice(start, start + PAGE_SIZE);
}

/** Compute total number of pages. */
export function totalPages(count: number): number {
  return Math.max(1, Math.ceil(count / PAGE_SIZE));
}

/** Extract unique CMP names from entries for the filter dropdown. */
export function extractUniqueCmps(entries: ConsentResult[]): string[] {
  const cmps = new Set<string>();
  for (const e of entries) {
    if (e.cmp) cmps.add(e.cmp);
  }
  return [...cmps].sort();
}

/** Extract unique methods from entries for the filter dropdown. */
export function extractUniqueMethods(entries: ConsentResult[]): string[] {
  const methods = new Set<string>();
  for (const e of entries) methods.add(e.method);
  return [...methods].sort();
}

/** Convert consent entries to a JSON string for export. */
export function exportAsJson(entries: ConsentResult[]): string {
  return JSON.stringify(entries, null, 2);
}

/** Convert consent entries to a CSV string for export. */
export function exportAsCsv(entries: ConsentResult[]): string {
  const headers = [
    "domain",
    "cmp",
    "method",
    "confidence",
    "categoriesAccepted",
    "categoriesRejected",
    "timestamp",
    "success",
  ];
  const rows = entries.map((e) =>
    [
      e.domain,
      e.cmp ?? "",
      e.method,
      e.confidence,
      e.categoriesAccepted.join(";"),
      e.categoriesRejected.join(";"),
      new Date(e.timestamp).toISOString(),
      String(e.success),
    ]
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

/** Trigger a file download via Blob URL. */
function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Create a text span with given class. */
function span(text: string, cls?: string): HTMLSpanElement {
  const el = document.createElement("span");
  el.textContent = text;
  if (cls) el.className = cls;
  return el;
}

/** Create the DOM element for a single consent entry. */
export function renderEntry(entry: ConsentResult): HTMLElement {
  const div = document.createElement("div");
  div.className = "consent-entry";
  div.setAttribute("role", "listitem");

  const header = document.createElement("div");
  header.className = "entry-header";
  header.appendChild(span(entry.domain, "domain"));
  header.appendChild(span(formatRelativeTime(entry.timestamp), "timestamp"));
  div.appendChild(header);

  const details = document.createElement("div");
  details.className = "entry-details";
  details.appendChild(span(`CMP: ${entry.cmp ?? "Unknown"} | Method: ${entry.method} | `));
  details.appendChild(span(entry.confidence, `confidence-badge confidence-${entry.confidence}`));
  div.appendChild(details);

  const cats = document.createElement("div");
  cats.className = "entry-categories";
  const accepted = entry.categoriesAccepted.join(", ") || "None";
  const rejected = entry.categoriesRejected.join(", ") || "None";
  cats.appendChild(span(`Accepted: ${accepted}`, "accepted"));
  cats.appendChild(document.createTextNode(" \u00B7 "));
  cats.appendChild(span(`Rejected: ${rejected}`, "rejected"));
  div.appendChild(cats);

  const btn = document.createElement("button");
  btn.className = "override-btn";
  btn.textContent = "Change preferences for this site";
  btn.dataset.domain = entry.domain;
  div.appendChild(btn);

  return div;
}

/** Dashboard controller managing state and rendering. */
class DashboardController {
  private allEntries: ConsentResult[] = [];
  private filtered: ConsentResult[] = [];
  private page = 0;
  private filters: FilterState = {
    domain: "",
    cmp: "",
    method: "",
    confidence: "",
  };

  private listEl: HTMLElement;
  private summaryEl: HTMLElement;
  private pageInfoEl: HTMLElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private cmpSelect: HTMLSelectElement;
  private methodSelect: HTMLSelectElement;

  constructor() {
    this.listEl = this.$("consent-list");
    this.summaryEl = this.$("summary-total");
    this.pageInfoEl = this.$("page-info");
    this.prevBtn = this.$("prev-page") as HTMLButtonElement;
    this.nextBtn = this.$("next-page") as HTMLButtonElement;
    this.cmpSelect = this.$("filter-cmp") as HTMLSelectElement;
    this.methodSelect = this.$("filter-method") as HTMLSelectElement;
  }

  private $(id: string): HTMLElement {
    return document.getElementById(id) as HTMLElement;
  }

  /** Load data and render. */
  async init(): Promise<void> {
    const logs = await getAllConsentLogs();
    this.allEntries = Object.values(logs).sort((a, b) => b.timestamp - a.timestamp);

    this.populateFilterDropdowns();
    this.bindEvents();
    this.applyFilters();
  }

  private populateFilterDropdowns(): void {
    for (const cmp of extractUniqueCmps(this.allEntries)) {
      const opt = document.createElement("option");
      opt.value = cmp;
      opt.textContent = cmp;
      this.cmpSelect.appendChild(opt);
    }
    for (const method of extractUniqueMethods(this.allEntries)) {
      const opt = document.createElement("option");
      opt.value = method;
      opt.textContent = method;
      this.methodSelect.appendChild(opt);
    }
  }

  private bindEvents(): void {
    this.$("search-domain").addEventListener("input", (e) => {
      this.filters.domain = (e.target as HTMLInputElement).value.toLowerCase();
      this.page = 0;
      this.applyFilters();
    });

    this.cmpSelect.addEventListener("change", () => {
      this.filters.cmp = this.cmpSelect.value;
      this.page = 0;
      this.applyFilters();
    });

    this.methodSelect.addEventListener("change", () => {
      this.filters.method = this.methodSelect.value;
      this.page = 0;
      this.applyFilters();
    });

    const confSelect = this.$("filter-confidence") as HTMLSelectElement;
    confSelect.addEventListener("change", () => {
      this.filters.confidence = confSelect.value;
      this.page = 0;
      this.applyFilters();
    });

    this.prevBtn.addEventListener("click", () => {
      if (this.page > 0) {
        this.page--;
        this.render();
      }
    });

    this.nextBtn.addEventListener("click", () => {
      if (this.page < totalPages(this.filtered.length) - 1) {
        this.page++;
        this.render();
      }
    });

    this.setupExportMenu();
    this.setupOverrideDialog();
  }

  private setupExportMenu(): void {
    const exportBtn = this.$("export-btn");
    const exportMenu = this.$("export-menu");

    const closeMenu = (): void => {
      exportMenu.classList.add("hidden");
      exportBtn.setAttribute("aria-expanded", "false");
      exportBtn.focus();
    };

    exportBtn.addEventListener("click", () => {
      const open = !exportMenu.classList.contains("hidden");
      exportMenu.classList.toggle("hidden", open);
      exportBtn.setAttribute("aria-expanded", String(!open));
      if (!open) {
        const firstItem = exportMenu.querySelector<HTMLElement>("[role='menuitem']");
        firstItem?.focus();
      }
    });

    exportMenu.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest("[data-format]");
      if (!target) return;
      const format = (target as HTMLElement).dataset.format;
      this.doExport(format as "json" | "csv");
      closeMenu();
    });

    exportMenu.addEventListener("keydown", (e) => {
      const kbEvent = e as KeyboardEvent;
      const items = [...exportMenu.querySelectorAll<HTMLElement>("[role='menuitem']")];
      const idx = items.indexOf(document.activeElement as HTMLElement);

      if (kbEvent.key === "Escape") {
        kbEvent.preventDefault();
        closeMenu();
      } else if (kbEvent.key === "ArrowDown") {
        kbEvent.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (kbEvent.key === "ArrowUp") {
        kbEvent.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      } else if (kbEvent.key === "Tab") {
        closeMenu();
      }
    });

    document.addEventListener("click", (e) => {
      if (!exportBtn.contains(e.target as Node) && !exportMenu.contains(e.target as Node)) {
        if (!exportMenu.classList.contains("hidden")) {
          exportMenu.classList.add("hidden");
          exportBtn.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  private setupOverrideDialog(): void {
    this.listEl.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest(".override-btn");
      if (!target) return;
      const domain = (target as HTMLElement).dataset.domain;
      if (domain) this.openOverrideDialog(domain);
    });

    this.$("override-cancel").addEventListener("click", () => {
      (this.$("override-dialog") as HTMLDialogElement).close();
    });

    this.$("override-form").addEventListener("submit", (e) => {
      e.preventDefault();
      safeAsync(() => this.saveOverride(), "dashboard save override");
    });
  }

  private applyFilters(): void {
    this.filtered = filterEntries(this.allEntries, this.filters);
    this.render();
  }

  private render(): void {
    const pages = totalPages(this.filtered.length);
    const pageEntries = paginate(this.filtered, this.page);
    const sites = new Set(this.allEntries.map((e) => e.domain)).size;

    const total = this.allEntries.length;
    this.summaryEl.textContent = `${total} popup${total === 1 ? "" : "s"} handled across ${sites} site${sites === 1 ? "" : "s"}`;

    while (this.listEl.firstChild) this.listEl.removeChild(this.listEl.firstChild);

    if (pageEntries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent =
        total === 0
          ? "No consent history yet. Browse some sites to get started."
          : "No entries match your filters.";
      this.listEl.appendChild(empty);
    } else {
      for (const entry of pageEntries) {
        this.listEl.appendChild(renderEntry(entry));
      }
    }

    this.pageInfoEl.textContent = `Page ${this.page + 1} of ${pages}`;
    this.prevBtn.disabled = this.page === 0;
    this.nextBtn.disabled = this.page >= pages - 1;
  }

  private doExport(format: "json" | "csv"): void {
    const data = this.filtered.length > 0 ? this.filtered : this.allEntries;
    if (format === "json") {
      downloadBlob(exportAsJson(data), "consent-log.json", "application/json");
    } else {
      downloadBlob(exportAsCsv(data), "consent-log.csv", "text/csv");
    }
  }

  private openOverrideDialog(domain: string): void {
    const dialog = this.$("override-dialog") as HTMLDialogElement;
    this.$("override-domain").textContent = domain;
    dialog.dataset.domain = domain;
    const modeSelect = this.$("override-mode") as HTMLSelectElement;
    modeSelect.value = "custom";
    for (const cb of dialog.querySelectorAll<HTMLInputElement>("[data-cat]")) {
      cb.checked = false;
    }
    dialog.showModal();
  }

  private async saveOverride(): Promise<void> {
    const dialog = this.$("override-dialog") as HTMLDialogElement;
    const domain = dialog.dataset.domain;
    if (!domain) return;
    const mode = (this.$("override-mode") as HTMLSelectElement).value as DomainOverride["mode"];
    const override: DomainOverride = { mode };
    if (mode === "custom") {
      override.preferences = {
        essential: true,
        functional: this.getCatChecked(dialog, "functional"),
        analytics: this.getCatChecked(dialog, "analytics"),
        marketing: this.getCatChecked(dialog, "marketing"),
        socialMedia: this.getCatChecked(dialog, "socialMedia"),
      };
    }
    await setDomainOverride(domain, override);
    dialog.close();
  }

  private getCatChecked(dialog: HTMLElement, cat: string): boolean {
    const cb = dialog.querySelector<HTMLInputElement>(`[data-cat="${cat}"]`);
    return cb?.checked ?? false;
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const ctrl = new DashboardController();
    safeAsync(() => ctrl.init(), "dashboard init");
  });
}
