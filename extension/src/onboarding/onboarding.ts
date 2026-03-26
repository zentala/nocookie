/**
 * Onboarding page entry point.
 *
 * Guides new users through a 4-step wizard for initial cookie
 * preference setup after extension installation.
 */

import {
  CATEGORY_IDS,
  CATEGORY_META,
  PROFILE_LABELS,
  PROFILE_PRESETS,
  type CategoryId,
  type ProfileName,
} from "@/shared/categories";
import type { UserPreferences } from "@/shared/types";
import { setOnboardingCompleted, setPreferences, setProfile } from "@/shared/storage-api";

/** Profile definitions for the card UI in step 2. */
const ONBOARDING_PROFILES: {
  id: Exclude<ProfileName, "custom" | "allow-analytics">;
  icon: string;
  title: string;
  desc: string;
  recommended?: boolean;
}[] = [
  {
    id: "privacy-max",
    icon: "\u{1F6E1}",
    title: "Privacy Maximum",
    desc: "Only essential cookies. Maximum privacy protection.",
  },
  {
    id: "balanced",
    icon: "\u2696",
    title: "Balanced",
    desc: "Essential + functional cookies. Good privacy, sites work well.",
    recommended: true,
  },
  {
    id: "accept-all",
    icon: "\u2714",
    title: "Accept All",
    desc: "Accept everything. Sites get full functionality.",
  },
];

const TOTAL_STEPS = 4;

/** State tracked during onboarding. */
interface OnboardingState {
  currentStep: number;
  selectedProfile: ProfileName | null;
  preferences: UserPreferences;
  cameFromCustomize: boolean;
}

const state: OnboardingState = {
  currentStep: 1,
  selectedProfile: null,
  preferences: { ...PROFILE_PRESETS["privacy-max"] },
  cameFromCustomize: false,
};

/** Reset onboarding state to defaults (exported for tests). */
export function resetState(): void {
  state.currentStep = 1;
  state.selectedProfile = null;
  state.preferences = { ...PROFILE_PRESETS["privacy-max"] };
  state.cameFromCustomize = false;
}

// -- Step navigation --------------------------------------------------------

/** Navigate to a specific step, updating progress dots and visibility. */
export function goToStep(step: number): void {
  if (step < 1 || step > TOTAL_STEPS) return;
  state.currentStep = step;

  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const section = document.getElementById(`step-${i}`);
    const dot = document.querySelector(`.progress-dot[data-step="${i}"]`);
    if (section) {
      section.classList.toggle("active", i === step);
    }
    if (dot) {
      dot.classList.toggle("active", i === step);
      dot.classList.toggle("completed", i < step);
      updateDotAria(dot as HTMLElement, i, step);
    }
  }

  if (step === 4) {
    renderSummary();
  }

  announceStep(step);
}

/** Update aria-label on a progress dot. */
function updateDotAria(dot: HTMLElement, dotStep: number, current: number): void {
  const labels = ["Welcome", "Choose profile", "Customize", "Done"];
  let suffix = "";
  if (dotStep === current) suffix = ", current";
  else if (dotStep < current) suffix = ", completed";
  dot.setAttribute("aria-label", `Step ${dotStep}: ${labels[dotStep - 1]}${suffix}`);
}

/** Announce the current step to screen readers via a live region. */
function announceStep(step: number): void {
  let existing = document.getElementById("sr-announce");
  if (!existing) {
    existing = document.createElement("div");
    existing.id = "sr-announce";
    existing.setAttribute("role", "status");
    existing.setAttribute("aria-live", "polite");
    existing.className = "sr-only";
    existing.style.cssText =
      "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)";
    document.body.appendChild(existing);
  }
  const titles = ["Welcome", "Choose profile", "Customize categories", "Setup complete"];
  existing.textContent = `Step ${step} of ${TOTAL_STEPS}: ${titles[step - 1]}`;
}

// -- Profile cards ----------------------------------------------------------

/** Build and insert profile cards into the radiogroup container. */
export function buildProfileCards(container: HTMLElement): void {
  container.textContent = "";
  for (const p of ONBOARDING_PROFILES) {
    const card = document.createElement("div");
    card.className = "profile-card";
    card.setAttribute("role", "radio");
    card.setAttribute("aria-checked", "false");
    card.setAttribute("tabindex", "0");
    card.setAttribute("data-profile", p.id);
    card.setAttribute("aria-label", `${p.title}: ${p.desc}`);

    if (p.recommended) {
      const badge = document.createElement("span");
      badge.className = "badge-recommended";
      badge.textContent = "Recommended";
      card.appendChild(badge);
    }

    const icon = document.createElement("span");
    icon.className = "profile-card-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = p.icon;

    const body = document.createElement("div");
    body.className = "profile-card-body";

    const title = document.createElement("div");
    title.className = "profile-card-title";
    title.textContent = p.title;

    const desc = document.createElement("div");
    desc.className = "profile-card-desc";
    desc.textContent = p.desc;

    body.append(title, desc);
    card.append(icon, body);
    container.appendChild(card);
  }
}

/** Handle profile card selection via click or keyboard. */
export async function selectProfile(profileId: string, container: HTMLElement): Promise<void> {
  const profile = profileId as Exclude<ProfileName, "custom" | "allow-analytics">;
  state.selectedProfile = profile;
  state.preferences = { ...PROFILE_PRESETS[profile] };

  const cards = container.querySelectorAll(".profile-card");
  for (const card of cards) {
    const isSelected = (card as HTMLElement).dataset.profile === profileId;
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-checked", String(isSelected));
  }

  await setProfile(profile);
  await setPreferences(state.preferences);

  const nextBtn = document.getElementById("btn-next-2") as HTMLButtonElement | null;
  if (nextBtn) nextBtn.disabled = false;
}

// -- Category toggles (step 3) ----------------------------------------------

/** Build category toggle rows in the customize step. */
export function buildCategoryToggles(container: HTMLElement): void {
  container.textContent = "";
  for (const id of CATEGORY_IDS) {
    const meta = CATEGORY_META[id];
    const isEssential = id === "essential";

    const row = document.createElement("div");
    row.className = "category-row";

    const label = document.createElement("span");
    label.className = "category-name";
    label.textContent = meta.label;
    label.id = `label-${id}`;

    const toggle = document.createElement("button");
    toggle.className = "toggle-switch";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-checked", String(state.preferences[id]));
    toggle.setAttribute("aria-labelledby", `label-${id}`);
    toggle.id = `toggle-${id}`;
    if (isEssential) {
      toggle.disabled = true;
      toggle.setAttribute("aria-disabled", "true");
    }

    row.append(label, toggle);
    container.appendChild(row);
  }
}

/** Toggle a category and update state (does NOT save to storage yet). */
export function toggleCategory(categoryId: CategoryId): void {
  if (categoryId === "essential") return;
  state.preferences = {
    ...state.preferences,
    [categoryId]: !state.preferences[categoryId],
  };
  const toggle = document.getElementById(`toggle-${categoryId}`);
  if (toggle) {
    toggle.setAttribute("aria-checked", String(state.preferences[categoryId]));
  }
}

/** Save customized preferences to storage and move to done step. */
export async function saveCustomPreferences(): Promise<void> {
  state.selectedProfile = "custom";
  await setProfile("custom");
  await setPreferences(state.preferences);
  state.cameFromCustomize = true;
  goToStep(4);
}

// -- Summary (step 4) -------------------------------------------------------

/** Create a labeled summary line as a DOM element. */
function createSummaryLine(label: string, value: string): HTMLElement {
  const line = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  line.appendChild(strong);
  line.appendChild(document.createTextNode(value));
  return line;
}

/** Render the summary in the done step using safe DOM methods. */
export function renderSummary(): void {
  const container = document.getElementById("done-summary");
  if (!container) return;
  container.textContent = "";

  const profileLabel = state.selectedProfile
    ? PROFILE_LABELS[state.selectedProfile]
    : "Privacy Maximum";

  const accepted: string[] = [];
  const rejected: string[] = [];
  for (const id of CATEGORY_IDS) {
    const label = CATEGORY_META[id].label;
    if (state.preferences[id]) {
      accepted.push(label);
    } else {
      rejected.push(label);
    }
  }

  container.appendChild(createSummaryLine("Profile", profileLabel));
  container.appendChild(createSummaryLine("Accepting", accepted.join(", ") || "None"));
  if (rejected.length > 0) {
    container.appendChild(createSummaryLine("Rejecting", rejected.join(", ")));
  }
}

/** Finish onboarding: set flag and close tab. */
export async function finishOnboarding(): Promise<void> {
  await setOnboardingCompleted(true);
  window.close();
}

// -- Init -------------------------------------------------------------------

/** Wire up all event listeners and build initial UI. */
export function initOnboarding(): void {
  const cardsContainer = document.querySelector(".profile-cards") as HTMLElement;
  if (cardsContainer) {
    buildProfileCards(cardsContainer);

    cardsContainer.addEventListener("click", (e) => {
      const card = (e.target as HTMLElement).closest(".profile-card") as HTMLElement;
      if (card?.dataset.profile) {
        selectProfile(card.dataset.profile, cardsContainer);
      }
    });

    cardsContainer.addEventListener("keydown", (e) => {
      const kbEvent = e as KeyboardEvent;
      const card = (kbEvent.target as HTMLElement).closest(".profile-card") as HTMLElement;
      if (!card?.dataset.profile) return;
      if (kbEvent.key === "Enter" || kbEvent.key === " ") {
        kbEvent.preventDefault();
        selectProfile(card.dataset.profile, cardsContainer);
      }
    });
  }

  const categoriesList = document.getElementById("categories-list");

  document.getElementById("btn-get-started")?.addEventListener("click", () => goToStep(2));

  document.getElementById("btn-back-2")?.addEventListener("click", () => goToStep(1));
  document.getElementById("btn-next-2")?.addEventListener("click", () => goToStep(4));

  document.getElementById("btn-customize")?.addEventListener("click", () => {
    if (categoriesList) buildCategoryToggles(categoriesList);
    goToStep(3);
  });

  document.getElementById("btn-back-3")?.addEventListener("click", () => goToStep(2));
  document.getElementById("btn-save-custom")?.addEventListener("click", () => {
    saveCustomPreferences();
  });

  document.getElementById("btn-back-4")?.addEventListener("click", () => {
    goToStep(state.cameFromCustomize ? 3 : 2);
  });
  document.getElementById("btn-start-browsing")?.addEventListener("click", () => {
    finishOnboarding();
  });

  if (categoriesList) {
    categoriesList.addEventListener("click", (e) => {
      const toggle = (e.target as HTMLElement).closest(".toggle-switch") as HTMLElement;
      if (!toggle) return;
      const id = toggle.id.replace("toggle-", "") as CategoryId;
      toggleCategory(id);
    });

    categoriesList.addEventListener("keydown", (e) => {
      const kbEvent = e as KeyboardEvent;
      const toggle = (kbEvent.target as HTMLElement).closest(".toggle-switch") as HTMLElement;
      if (!toggle) return;
      if (kbEvent.key === "Enter" || kbEvent.key === " ") {
        kbEvent.preventDefault();
        const id = toggle.id.replace("toggle-", "") as CategoryId;
        toggleCategory(id);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initOnboarding);
