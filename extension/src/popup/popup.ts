/**
 * Popup page entry point.
 *
 * Renders the extension popup showing current site consent status,
 * category breakdown, profile quick-switch, and navigation links.
 */

import type { BadgeState } from "@/shared/messages";
import type { ConsentResult } from "@/shared/types";
import type { ProfileName, CategoryId } from "@/shared/categories";
import { CATEGORY_META, PROFILE_LABELS } from "@/shared/categories";
import { createMessage } from "@/shared/messages";
import { getProfile, setProfile, setPreferences } from "@/shared/storage-api";
import { getPreferencesForProfile } from "@/shared/categories";

/** Subset of TabState needed by the popup. */
export interface PopupTabState {
  state: BadgeState;
  cmp?: string;
  domain?: string;
  result?: ConsentResult;
}

/** Status display configuration for each badge state. */
export interface StatusConfig {
  cssClass: string;
  iconText: string;
  isSpinner: boolean;
  label: string;
  showCategories: boolean;
}

/** Map of badge states to their visual configuration. */
export const STATUS_MAP: Record<BadgeState, StatusConfig> = {
  handled: {
    cssClass: "status-handled",
    iconText: "\u2713",
    isSpinner: false,
    label: "Consent handled",
    showCategories: true,
  },
  default: {
    cssClass: "status-default",
    iconText: "\u2014",
    isSpinner: false,
    label: "No popup detected",
    showCategories: false,
  },
  attention: {
    cssClass: "status-attention",
    iconText: "!",
    isSpinner: false,
    label: "Needs attention",
    showCategories: false,
  },
  error: {
    cssClass: "status-error",
    iconText: "\u2717",
    isSpinner: false,
    label: "Error occurred",
    showCategories: false,
  },
  disabled: {
    cssClass: "status-disabled",
    iconText: "\u2014",
    isSpinner: false,
    label: "Disabled for this site",
    showCategories: false,
  },
  scanning: {
    cssClass: "status-scanning",
    iconText: "",
    isSpinner: true,
    label: "Detecting cookie popup\u2026",
    showCategories: false,
  },
};

const NON_ESSENTIAL: CategoryId[] = ["functional", "analytics", "marketing", "socialMedia"];

/** Build the detail text shown below the status label. */
export function buildStatusDetail(tabState: PopupTabState): string {
  const { state, cmp, result } = tabState;
  if (state === "handled" && result) {
    const parts: string[] = [];
    if (cmp) parts.push(`CMP: ${cmp}`);
    parts.push(`Method: ${result.method}`);
    return parts.join(" \u00b7 ");
  }
  if (state === "attention" && cmp) return `CMP detected: ${cmp}`;
  if (state === "error" && result) return "Could not apply preferences";
  return "";
}

/** Build category list items for the given consent result. */
export function buildCategoryItems(
  result: ConsentResult,
): Array<{ id: string; label: string; accepted: boolean }> {
  return NON_ESSENTIAL.map((id) => ({
    id,
    label: CATEGORY_META[id].label,
    accepted: result.categoriesAccepted.includes(id),
  }));
}

/** Populate profile dropdown options. */
export function populateProfileSelect(
  select: HTMLSelectElement,
  currentProfile: ProfileName,
): void {
  while (select.firstChild) select.removeChild(select.firstChild);
  for (const [value, label] of Object.entries(PROFILE_LABELS)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = value === currentProfile;
    select.appendChild(option);
  }
}

/** Set the status icon content (text or spinner element). */
function setStatusIcon(el: HTMLElement, config: StatusConfig): void {
  while (el.firstChild) el.removeChild(el.firstChild);
  if (config.isSpinner) {
    const spinner = document.createElement("div");
    spinner.className = "spinner-icon";
    el.appendChild(spinner);
  } else {
    el.textContent = config.iconText;
  }
}

/** Elements needed by renderPopup. */
export interface PopupElements {
  domain: HTMLElement;
  statusSection: HTMLElement;
  statusIcon: HTMLElement;
  statusLabel: HTMLElement;
  statusDetail: HTMLElement;
  categoriesSection: HTMLElement;
  categoriesList: HTMLElement;
}

/** Render the popup UI from tab state. */
export function renderPopup(tabState: PopupTabState, el: PopupElements): void {
  el.domain.textContent = tabState.domain ?? "Unknown";
  const config = STATUS_MAP[tabState.state];
  el.statusSection.className = `status-section ${config.cssClass}`;
  setStatusIcon(el.statusIcon, config);
  el.statusLabel.textContent = config.label;
  el.statusDetail.textContent = buildStatusDetail(tabState);

  if (config.showCategories && tabState.result) {
    el.categoriesSection.classList.remove("hidden");
    while (el.categoriesList.firstChild) {
      el.categoriesList.removeChild(el.categoriesList.firstChild);
    }
    for (const item of buildCategoryItems(tabState.result)) {
      const li = document.createElement("li");
      li.className = `category-item ${item.accepted ? "category-accepted" : "category-rejected"}`;
      const icon = document.createElement("span");
      icon.className = "category-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = item.accepted ? "\u2713" : "\u2717";
      const lbl = document.createElement("span");
      lbl.textContent = `${item.label}: ${item.accepted ? "Accepted" : "Rejected"}`;
      li.appendChild(icon);
      li.appendChild(lbl);
      el.categoriesList.appendChild(li);
    }
  } else {
    el.categoriesSection.classList.add("hidden");
  }
}

/** Extract hostname from a URL string. */
function extractDomain(url: string | undefined): string {
  if (!url) return "Unknown";
  try {
    return new URL(url).hostname;
  } catch {
    return "Unknown";
  }
}

/** Handle profile selection change. */
async function onProfileChange(name: ProfileName): Promise<void> {
  await setProfile(name);
  if (name !== "custom") await setPreferences(getPreferencesForProfile(name));
}

/** Query active tab and fetch its consent state from background. */
async function loadTabState(el: PopupElements): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    renderPopup({ state: "default" }, el);
    return;
  }
  const domain = extractDomain(tab.url);
  renderPopup({ state: "scanning", domain }, el);
  try {
    const msg = createMessage("GET_TAB_STATE", { tabId: tab.id });
    const res = (await chrome.runtime.sendMessage(msg)) as PopupTabState | undefined;
    if (res) {
      res.domain = res.domain ?? domain;
      renderPopup(res, el);
    } else renderPopup({ state: "default", domain }, el);
  } catch {
    renderPopup({ state: "default", domain }, el);
  }
}

/** Initialize popup when DOM is ready. */
async function init(): Promise<void> {
  const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
  const el: PopupElements = {
    domain: $("domain"),
    statusSection: $("status-section"),
    statusIcon: $("status-icon"),
    statusLabel: $("status-label"),
    statusDetail: $("status-detail"),
    categoriesSection: $("categories-section"),
    categoriesList: $("categories-list"),
  };
  const profileSelect = $<HTMLSelectElement>("profile-select");

  $("settings-btn").addEventListener("click", () => chrome.runtime.openOptionsPage());
  $("override-link").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  $("history-link").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  const currentProfile = await getProfile();
  populateProfileSelect(profileSelect, currentProfile);
  profileSelect.addEventListener("change", () => {
    void onProfileChange(profileSelect.value as ProfileName);
  });

  await loadTabState(el);
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init);
}
