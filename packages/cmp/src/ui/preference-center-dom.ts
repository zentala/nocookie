/**
 * @module ui/preference-center-dom
 * DOM builder functions for the preference center modal.
 * Extracted to keep each file under 250 lines.
 */

import type { CategoryConfig, CategoryId, ResolvedCMPConfig } from "@/shared/types";
import { CATEGORY_META } from "@/shared/constants";

/** Callbacks wired into the DOM by the PreferenceCenter class. */
export interface PreferenceCenterCallbacks {
  onClose: () => void;
  onSave: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

/** Build the full overlay element containing the dialog. */
export function buildOverlay(
  config: ResolvedCMPConfig,
  callbacks: PreferenceCenterCallbacks,
): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.className = "ca-overlay";
  overlay.hidden = true;

  const dialog = document.createElement("div");
  dialog.className = "ca-prefs";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-label", "Cookie preferences");
  dialog.setAttribute("aria-modal", "true");

  dialog.appendChild(buildHeader(config, callbacks.onClose));
  dialog.appendChild(buildBody(config));
  dialog.appendChild(buildActions(config, callbacks));
  overlay.appendChild(dialog);
  return overlay;
}

/** Build the header row with title and close button. */
function buildHeader(config: ResolvedCMPConfig, onClose: () => void): HTMLDivElement {
  const header = document.createElement("div");
  header.className = "ca-prefs__header";

  const title = document.createElement("h2");
  title.textContent = config.translations.bannerTitle;
  header.appendChild(title);

  const closeBtn = document.createElement("button");
  closeBtn.className = "ca-prefs__close";
  closeBtn.setAttribute("aria-label", config.translations.closeAriaLabel);
  closeBtn.textContent = "\u00D7";
  closeBtn.addEventListener("click", onClose);
  header.appendChild(closeBtn);

  return header;
}

/** Build the scrollable body with one section per category. */
function buildBody(config: ResolvedCMPConfig): HTMLDivElement {
  const body = document.createElement("div");
  body.className = "ca-prefs__body";
  for (const cat of config.categories) {
    body.appendChild(buildCategory(cat, config));
  }
  return body;
}

/** Build a single category section. */
function buildCategory(cat: CategoryConfig, config: ResolvedCMPConfig): HTMLDivElement {
  const meta = CATEGORY_META[cat.id];
  const section = document.createElement("div");
  section.className = "ca-category";
  section.dataset.categoryId = cat.id;

  section.appendChild(buildCategoryHeader(cat, meta, config));

  const desc = document.createElement("p");
  desc.className = "ca-category__desc";
  desc.textContent = cat.description ?? meta.description;
  section.appendChild(desc);

  if (cat.cookies && cat.cookies.length > 0) {
    section.appendChild(buildDetails(cat));
  }

  return section;
}

/** Build category header with expand button and toggle/badge. */
function buildCategoryHeader(
  cat: CategoryConfig,
  meta: { name: string; required: boolean },
  config: ResolvedCMPConfig,
): HTMLDivElement {
  const header = document.createElement("div");
  header.className = "ca-category__header";

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "ca-category__toggle-details";
  toggleBtn.setAttribute("aria-expanded", "false");

  const name = document.createElement("span");
  name.className = "ca-category__name";
  name.textContent = cat.name ?? meta.name;
  toggleBtn.appendChild(name);

  const chevron = document.createElement("span");
  chevron.className = "ca-category__chevron";
  chevron.textContent = "\u25B8";
  toggleBtn.appendChild(chevron);

  toggleBtn.addEventListener("click", () => {
    const details = toggleBtn
      .closest(".ca-category")
      ?.querySelector(".ca-category__details") as HTMLElement | null;
    if (!details) return;
    const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
    toggleBtn.setAttribute("aria-expanded", String(!expanded));
    details.hidden = expanded;
    chevron.classList.toggle("ca-category__chevron--open", !expanded);
  });

  header.appendChild(toggleBtn);

  if (cat.required) {
    const badge = document.createElement("span");
    badge.className = "ca-category__always-active";
    badge.textContent = config.translations.categoryRequired;
    header.appendChild(badge);
  } else {
    header.appendChild(buildToggle(cat.id));
  }

  return header;
}

/** Build a toggle switch (checkbox + slider). */
function buildToggle(categoryId: CategoryId): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "ca-toggle";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.dataset.categoryId = categoryId;
  label.appendChild(input);

  const slider = document.createElement("span");
  slider.className = "ca-toggle__slider";
  label.appendChild(slider);

  return label;
}

/** Build collapsible cookie detail table. */
function buildDetails(cat: CategoryConfig): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "ca-category__details";
  wrapper.hidden = true;

  const table = document.createElement("table");
  table.className = "ca-cookie-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Cookie", "Provider", "Duration", "Purpose"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const cookie of cat.cookies ?? []) {
    const row = document.createElement("tr");
    for (const val of [cookie.name, cookie.provider, cookie.duration, cookie.purpose]) {
      const td = document.createElement("td");
      td.textContent = val;
      row.appendChild(td);
    }
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  wrapper.appendChild(table);

  return wrapper;
}

/** Build the action buttons row (reject, save, accept). */
function buildActions(
  config: ResolvedCMPConfig,
  callbacks: PreferenceCenterCallbacks,
): HTMLDivElement {
  const actions = document.createElement("div");
  actions.className = "ca-prefs__actions";

  const rejectBtn = document.createElement("button");
  rejectBtn.className = "ca-btn ca-btn--reject";
  rejectBtn.textContent = config.translations.rejectAll;
  rejectBtn.addEventListener("click", callbacks.onRejectAll);

  const saveBtn = document.createElement("button");
  saveBtn.className = "ca-btn ca-btn--save";
  saveBtn.textContent = config.translations.savePreferences;
  saveBtn.addEventListener("click", callbacks.onSave);

  const acceptBtn = document.createElement("button");
  acceptBtn.className = "ca-btn ca-btn--accept";
  acceptBtn.textContent = config.translations.acceptAll;
  acceptBtn.addEventListener("click", callbacks.onAcceptAll);

  actions.appendChild(rejectBtn);
  actions.appendChild(saveBtn);
  actions.appendChild(acceptBtn);
  return actions;
}
