/**
 * Options page entry point. Renders preferences tab with profile
 * selector and category toggles, initializes other tabs.
 */

import {
  CATEGORY_IDS,
  CATEGORY_META,
  PROFILE_LABELS,
  PROFILE_PRESETS,
  type CategoryId,
  type ProfileName,
} from "@/shared/categories";
import { getPreferences, getProfile, setPreferences, setProfile } from "@/shared/storage-api";
import type { UserPreferences } from "@/shared/types";
import { safeAsync } from "@/shared/ui-error-handler";
import { initAbout } from "./options-about";
import { initAdvanced } from "./options-advanced";
import { initOverrides } from "./options-overrides";
import { initStats } from "./options-stats";

/** All tab IDs in display order. */
const TAB_IDS = [
  "tab-preferences",
  "tab-overrides",
  "tab-advanced",
  "tab-statistics",
  "tab-about",
] as const;

/** Activate a tab and show its panel. */
export function activateTab(tabId: string): void {
  for (const id of TAB_IDS) {
    const tab = document.getElementById(id);
    const panelId = id.replace("tab-", "panel-");
    const panel = document.getElementById(panelId);
    if (!tab || !panel) continue;
    const isActive = id === tabId;
    tab.setAttribute("aria-selected", String(isActive));
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
    if (isActive) {
      panel.removeAttribute("hidden");
    } else {
      panel.setAttribute("hidden", "");
    }
  }
}

export function initTabs(): void {
  const tablist = document.querySelector('[role="tablist"]');
  if (!tablist) return;

  tablist.addEventListener("click", (e) => {
    const tab = (e.target as HTMLElement).closest('[role="tab"]');
    if (tab) {
      activateTab(tab.id);
      (tab as HTMLElement).focus();
    }
  });

  tablist.addEventListener("keydown", (e) => {
    const kbEvent = e as KeyboardEvent;
    const current = document.activeElement;
    if (!current || current.getAttribute("role") !== "tab") return;

    const idx = TAB_IDS.indexOf(current.id as (typeof TAB_IDS)[number]);
    if (idx === -1) return;

    let next = -1;
    if (kbEvent.key === "ArrowRight") next = (idx + 1) % TAB_IDS.length;
    else if (kbEvent.key === "ArrowLeft") next = (idx - 1 + TAB_IDS.length) % TAB_IDS.length;
    else if (kbEvent.key === "Home") next = 0;
    else if (kbEvent.key === "End") next = TAB_IDS.length - 1;

    if (next >= 0) {
      kbEvent.preventDefault();
      activateTab(TAB_IDS[next]);
      document.getElementById(TAB_IDS[next])?.focus();
    }
  });
}

/** Populate the profile <select> with all profile options. */
export function populateProfileSelect(select: HTMLSelectElement, activeProfile: ProfileName): void {
  select.textContent = "";
  for (const [value, label] of Object.entries(PROFILE_LABELS)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = value === activeProfile;
    select.appendChild(option);
  }
}

/** Detect which named profile matches the given preferences, or "custom". */
export function detectProfile(prefs: UserPreferences): ProfileName {
  for (const [name, preset] of Object.entries(PROFILE_PRESETS)) {
    const match = CATEGORY_IDS.every((id) => prefs[id] === preset[id]);
    if (match) return name as ProfileName;
  }
  return "custom";
}

/** Build an info panel element with description, examples, and impact. */
function buildInfoPanel(
  id: string,
  description: string,
  examples: string[],
  impact: string,
): HTMLDivElement {
  const panel = document.createElement("div");
  panel.className = "info-panel";
  panel.id = `info-${id}`;
  panel.setAttribute("aria-hidden", "true");

  const descP = document.createElement("p");
  descP.textContent = description;
  const examplesP = document.createElement("p");
  examplesP.textContent = `Examples: ${examples.join(", ")}`;
  const impactP = document.createElement("p");
  impactP.textContent = "Privacy impact: ";
  const badge = document.createElement("span");
  badge.className = `impact-badge impact-${impact}`;
  badge.textContent = impact;
  impactP.appendChild(badge);
  panel.append(descP, examplesP, impactP);
  return panel;
}

/** Build the category list DOM inside the container element. */
export function buildCategoryList(container: HTMLElement, preferences: UserPreferences): void {
  container.textContent = "";
  for (const id of CATEGORY_IDS) {
    const meta = CATEGORY_META[id];
    const isEssential = id === "essential";

    const item = document.createElement("div");
    item.className = "category-item";
    item.dataset.categoryId = id;

    const header = document.createElement("div");
    header.className = "category-header";

    const label = document.createElement("span");
    label.className = "category-label";
    label.textContent = meta.label;

    const toggle = document.createElement("button");
    toggle.className = "toggle-switch";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-checked", String(preferences[id]));
    toggle.setAttribute("aria-label", `${meta.label} cookies`);
    toggle.id = `toggle-${id}`;
    if (isEssential) {
      toggle.disabled = true;
      toggle.setAttribute("aria-disabled", "true");
    }

    const infoBtn = document.createElement("button");
    infoBtn.className = "info-btn";
    infoBtn.setAttribute("aria-expanded", "false");
    infoBtn.setAttribute("aria-controls", `info-${id}`);
    infoBtn.setAttribute("aria-label", `${meta.label} info`);
    infoBtn.textContent = "\u2139";

    header.append(label, toggle, infoBtn);

    const infoPanel = buildInfoPanel(id, meta.description, meta.examples, meta.privacyImpact);

    item.append(header, infoPanel);
    container.appendChild(item);
  }
}

/** Toggle a category switch value and persist. */
export async function handleToggle(
  categoryId: CategoryId,
  preferences: UserPreferences,
  profileSelect: HTMLSelectElement,
): Promise<UserPreferences> {
  if (categoryId === "essential") return preferences;
  const updated = { ...preferences, [categoryId]: !preferences[categoryId] };
  await setPreferences(updated);
  const profile = detectProfile(updated);
  await setProfile(profile);
  populateProfileSelect(profileSelect, profile);
  return updated;
}

/** Toggle an info panel open/closed. */
export function handleInfoToggle(infoBtn: HTMLButtonElement): void {
  const expanded = infoBtn.getAttribute("aria-expanded") === "true";
  infoBtn.setAttribute("aria-expanded", String(!expanded));
  const panelId = infoBtn.getAttribute("aria-controls");
  if (!panelId) return;
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.setAttribute("aria-hidden", String(expanded));
  }
}

/** Update all toggle button states to match preferences. */
export function syncToggles(preferences: UserPreferences): void {
  for (const id of CATEGORY_IDS) {
    const toggle = document.getElementById(`toggle-${id}`);
    if (toggle) {
      toggle.setAttribute("aria-checked", String(preferences[id]));
    }
  }
}

/** Initialize the options page (called on DOMContentLoaded). */
export async function initOptions(): Promise<void> {
  initTabs();

  const profileSelect = document.getElementById("profile-select") as HTMLSelectElement;
  const categoriesList = document.getElementById("categories-list") as HTMLElement;
  if (!profileSelect || !categoriesList) return;

  let preferences = await getPreferences();
  const profile = await getProfile();

  populateProfileSelect(profileSelect, profile);
  buildCategoryList(categoriesList, preferences);

  // Initialize other tabs
  await initOverrides();
  await initAdvanced();
  await initStats();
  initAbout();

  profileSelect.addEventListener("change", () => {
    safeAsync(async () => {
      const selected = profileSelect.value as ProfileName;
      if (selected === "custom") return;
      const preset = PROFILE_PRESETS[selected];
      preferences = { ...preset };
      await setPreferences(preferences);
      await setProfile(selected);
      syncToggles(preferences);
    }, "profile change");
  });

  categoriesList.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("toggle-switch")) {
      safeAsync(async () => {
        const item = target.closest(".category-item") as HTMLElement;
        const categoryId = item?.dataset.categoryId as CategoryId;
        if (categoryId) {
          preferences = await handleToggle(categoryId, preferences, profileSelect);
          syncToggles(preferences);
        }
      }, "toggle click");
    }
    if (target.classList.contains("info-btn")) {
      handleInfoToggle(target as HTMLButtonElement);
    }
  });

  categoriesList.addEventListener("keydown", (e) => {
    const kbEvent = e as KeyboardEvent;
    const target = kbEvent.target as HTMLElement;
    if (kbEvent.key !== "Enter" && kbEvent.key !== " ") return;
    if (target.classList.contains("toggle-switch")) {
      kbEvent.preventDefault();
      safeAsync(async () => {
        const item = target.closest(".category-item") as HTMLElement;
        const categoryId = item?.dataset.categoryId as CategoryId;
        if (categoryId) {
          preferences = await handleToggle(categoryId, preferences, profileSelect);
          syncToggles(preferences);
        }
      }, "toggle keydown");
    }
    if (target.classList.contains("info-btn")) {
      kbEvent.preventDefault();
      handleInfoToggle(target as HTMLButtonElement);
    }
  });
}

document.addEventListener("DOMContentLoaded", initOptions);
