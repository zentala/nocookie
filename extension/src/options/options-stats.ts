/**
 * Statistics tab (Tab 4) for the options page.
 *
 * Reads aggregate extension usage data from storage and renders
 * stat cards, method breakdown, and CMP breakdown.
 */

import { getStats } from "@/shared/storage-api";
import type { ExtensionStats } from "@/shared/types";

/** Format a number with locale-appropriate separators. */
function formatNumber(n: number): string {
  return n.toLocaleString();
}

/** Format a timestamp to a readable date string, or "N/A" if zero. */
function formatDate(timestamp: number): string {
  if (timestamp === 0) return "N/A";
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Build a bar item for breakdown lists. */
function buildBreakdownItem(label: string, count: number, total: number): HTMLDivElement {
  const item = document.createElement("div");
  item.className = "breakdown-item";

  const header = document.createElement("div");
  header.className = "breakdown-header";

  const nameSpan = document.createElement("span");
  nameSpan.className = "breakdown-label";
  nameSpan.textContent = label;

  const countSpan = document.createElement("span");
  countSpan.className = "breakdown-count";
  countSpan.textContent = formatNumber(count);

  header.append(nameSpan, countSpan);

  const barBg = document.createElement("div");
  barBg.className = "breakdown-bar";
  const barFill = document.createElement("div");
  barFill.className = "breakdown-bar-fill";
  barFill.style.width = total > 0 ? `${(count / total) * 100}%` : "0%";
  barBg.appendChild(barFill);

  item.append(header, barBg);
  return item;
}

/** Build the breakdown section (by method or by CMP). */
function buildBreakdownSection(
  container: HTMLElement,
  data: Record<string, number>,
  total: number,
): void {
  container.textContent = "";
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "No data yet.";
    container.appendChild(empty);
    return;
  }

  for (const [label, count] of entries) {
    container.appendChild(buildBreakdownItem(label, count, total));
  }
}

/** Render the full statistics panel. */
export function renderStats(container: HTMLElement, stats: ExtensionStats): void {
  container.textContent = "";

  // Stat cards row
  const cardsRow = document.createElement("div");
  cardsRow.className = "stat-cards";

  const totalCard = buildStatCard(
    "stat-total",
    formatNumber(stats.popupsHandled),
    "Popups handled",
  );
  const methodCount = Object.keys(stats.popupsByMethod).length;
  const methodsCard = buildStatCard("stat-methods", String(methodCount), "Methods used");
  const cmpCount = Object.keys(stats.popupsByCmp).length;
  const cmpsCard = buildStatCard("stat-cmps", String(cmpCount), "CMPs detected");
  const installCard = buildStatCard(
    "stat-install",
    formatDate(stats.firstInstall),
    "First install",
  );

  cardsRow.append(totalCard, methodsCard, cmpsCard, installCard);
  container.appendChild(cardsRow);

  // By method
  const methodTitle = document.createElement("h3");
  methodTitle.textContent = "By method";
  container.appendChild(methodTitle);

  const methodContainer = document.createElement("div");
  methodContainer.id = "stats-by-method";
  container.appendChild(methodContainer);
  buildBreakdownSection(methodContainer, stats.popupsByMethod, stats.popupsHandled);

  // By CMP
  const cmpTitle = document.createElement("h3");
  cmpTitle.textContent = "By CMP";
  container.appendChild(cmpTitle);

  const cmpContainer = document.createElement("div");
  cmpContainer.id = "stats-by-cmp";
  container.appendChild(cmpContainer);
  buildBreakdownSection(cmpContainer, stats.popupsByCmp, stats.popupsHandled);
}

/** Build a single stat card element. */
function buildStatCard(id: string, value: string, label: string): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "stat-card";

  const numDiv = document.createElement("div");
  numDiv.className = "stat-number";
  numDiv.id = id;
  numDiv.textContent = value;

  const labelDiv = document.createElement("div");
  labelDiv.className = "stat-label";
  labelDiv.textContent = label;

  card.append(numDiv, labelDiv);
  return card;
}

/** Initialize the statistics tab: load data and render. */
export async function initStats(): Promise<void> {
  const container = document.getElementById("panel-statistics");
  if (!container) return;
  const stats = await getStats();
  renderStats(container, stats);
}
