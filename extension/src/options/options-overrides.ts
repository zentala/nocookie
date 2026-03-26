/**
 * Site Overrides tab (Tab 2) for the options page.
 *
 * Manages per-domain override rules: add, edit, delete via a
 * dialog modal. Supports whitelist, blacklist, custom, and disabled modes.
 */

import { CATEGORY_IDS, CATEGORY_META } from "@/shared/categories";
import {
  getAllDomainOverrides,
  removeDomainOverride,
  setDomainOverride,
} from "@/shared/storage-api";
import type { DomainOverride, UserPreferences } from "@/shared/types";

/** Currently editing domain (null = adding new). */
let editingDomain: string | null = null;

/** Get the modal dialog element. */
function getModal(): HTMLDialogElement | null {
  return document.getElementById("override-modal") as HTMLDialogElement | null;
}

/** Show or hide the custom preferences section based on mode. */
export function syncCustomPrefsVisibility(): void {
  const modeSelect = document.getElementById("override-mode") as HTMLSelectElement | null;
  const customPrefs = document.getElementById("custom-prefs");
  if (!modeSelect || !customPrefs) return;
  customPrefs.hidden = modeSelect.value !== "custom";
}

/** Render all override rows in the table body. */
export async function renderOverridesTable(): Promise<void> {
  const tbody = document.querySelector("#overrides-table tbody");
  if (!tbody) return;
  tbody.textContent = "";

  const overrides = await getAllDomainOverrides();
  const domains = Object.keys(overrides).sort();

  if (domains.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.textContent = "No site overrides configured.";
    cell.className = "empty-message";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  for (const domain of domains) {
    const override = overrides[domain];
    const row = document.createElement("tr");

    const domainCell = document.createElement("td");
    domainCell.textContent = domain;

    const modeCell = document.createElement("td");
    modeCell.textContent = formatMode(override.mode);

    const actionsCell = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.className = "btn-small";
    editBtn.textContent = "Edit";
    editBtn.setAttribute("aria-label", `Edit override for ${domain}`);
    editBtn.dataset.domain = domain;
    editBtn.addEventListener("click", () => openEditModal(domain, override));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-small btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", `Delete override for ${domain}`);
    deleteBtn.dataset.domain = domain;
    deleteBtn.addEventListener("click", () => deleteOverride(domain));

    actionsCell.append(editBtn, deleteBtn);
    row.append(domainCell, modeCell, actionsCell);
    tbody.appendChild(row);
  }
}

/** Format a mode value for display. */
function formatMode(mode: DomainOverride["mode"]): string {
  const labels: Record<DomainOverride["mode"], string> = {
    whitelist: "Accept All",
    blacklist: "Reject All",
    custom: "Custom",
    disabled: "Disabled",
  };
  return labels[mode];
}

/** Open the modal for adding a new override. */
export function openAddModal(): void {
  editingDomain = null;
  const modal = getModal();
  if (!modal) return;

  const domainInput = document.getElementById("override-domain") as HTMLInputElement;
  const modeSelect = document.getElementById("override-mode") as HTMLSelectElement;
  if (domainInput) {
    domainInput.value = "";
    domainInput.disabled = false;
  }
  if (modeSelect) modeSelect.value = "whitelist";
  resetCustomToggles();
  syncCustomPrefsVisibility();
  modal.showModal();
}

/** Open the modal pre-filled for editing an existing override. */
export function openEditModal(domain: string, override: DomainOverride): void {
  editingDomain = domain;
  const modal = getModal();
  if (!modal) return;

  const domainInput = document.getElementById("override-domain") as HTMLInputElement;
  const modeSelect = document.getElementById("override-mode") as HTMLSelectElement;
  if (domainInput) {
    domainInput.value = domain;
    domainInput.disabled = true;
  }
  if (modeSelect) modeSelect.value = override.mode;

  if (override.mode === "custom" && override.preferences) {
    setCustomToggles(override.preferences);
  } else {
    resetCustomToggles();
  }
  syncCustomPrefsVisibility();
  modal.showModal();
}

/** Set the custom preference toggles to match given preferences. */
function setCustomToggles(prefs: UserPreferences): void {
  for (const id of CATEGORY_IDS) {
    if (id === "essential") continue;
    const toggle = document.getElementById(`custom-toggle-${id}`);
    if (toggle) toggle.setAttribute("aria-checked", String(prefs[id]));
  }
}

/** Reset custom toggles to all-off (except essential). */
function resetCustomToggles(): void {
  for (const id of CATEGORY_IDS) {
    if (id === "essential") continue;
    const toggle = document.getElementById(`custom-toggle-${id}`);
    if (toggle) toggle.setAttribute("aria-checked", "false");
  }
}

/** Read custom toggle states into a UserPreferences object. */
function readCustomToggles(): UserPreferences {
  const prefs: UserPreferences = {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    socialMedia: false,
  };
  for (const id of CATEGORY_IDS) {
    if (id === "essential") continue;
    const toggle = document.getElementById(`custom-toggle-${id}`);
    if (toggle) {
      (prefs as unknown as Record<string, boolean>)[id] =
        toggle.getAttribute("aria-checked") === "true";
    }
  }
  return prefs;
}

/** Save the override from the modal form. */
export async function saveOverride(): Promise<void> {
  const domainInput = document.getElementById("override-domain") as HTMLInputElement;
  const modeSelect = document.getElementById("override-mode") as HTMLSelectElement;
  if (!domainInput || !modeSelect) return;

  const domain = domainInput.value.trim().toLowerCase();
  if (!domain) return;

  const mode = modeSelect.value as DomainOverride["mode"];
  const override: DomainOverride = { mode };

  if (mode === "custom") {
    override.preferences = readCustomToggles();
  }

  await setDomainOverride(domain, override);
  getModal()?.close();
  await renderOverridesTable();
}

/** Delete an override and refresh the table. */
async function deleteOverride(domain: string): Promise<void> {
  await removeDomainOverride(domain);
  await renderOverridesTable();
}

/** Build the custom prefs toggle HTML inside the custom-prefs container. */
function buildCustomPrefsToggles(): void {
  const container = document.getElementById("custom-prefs");
  if (!container || container.children.length > 0) return;

  for (const id of CATEGORY_IDS) {
    if (id === "essential") continue;
    const meta = CATEGORY_META[id];
    const row = document.createElement("div");
    row.className = "custom-pref-row";

    const label = document.createElement("span");
    label.textContent = meta.label;

    const toggle = document.createElement("button");
    toggle.className = "toggle-switch";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-checked", "false");
    toggle.setAttribute("aria-label", `${meta.label} cookies`);
    toggle.id = `custom-toggle-${id}`;
    toggle.addEventListener("click", () => {
      const current = toggle.getAttribute("aria-checked") === "true";
      toggle.setAttribute("aria-checked", String(!current));
    });

    row.append(label, toggle);
    container.appendChild(row);
  }
}

/** Initialize the overrides tab: wire up events and render table. */
export async function initOverrides(): Promise<void> {
  buildCustomPrefsToggles();

  document.getElementById("add-override")?.addEventListener("click", openAddModal);
  document.getElementById("cancel-override")?.addEventListener("click", () => {
    getModal()?.close();
  });

  const modeSelect = document.getElementById("override-mode");
  modeSelect?.addEventListener("change", syncCustomPrefsVisibility);

  const form = document.querySelector("#override-modal form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveOverride();
  });

  await renderOverridesTable();
}

export { editingDomain };
