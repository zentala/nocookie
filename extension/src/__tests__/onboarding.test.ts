/**
 * Tests for onboarding wizard step navigation, profile selection,
 * category customization, and storage persistence.
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeMock, type StorageAreaMock } from "./helpers/chrome-storage-mock";
import {
  buildCategoryToggles,
  buildProfileCards,
  finishOnboarding,
  goToStep,
  resetState,
  saveCustomPreferences,
  selectProfile,
  toggleCategory,
} from "@/onboarding/onboarding";

let syncMock: StorageAreaMock;

/** Build the minimal wizard DOM needed for testing. */
function createWizardDom(): void {
  document.body.textContent = "";
  const wizard = document.createElement("main");
  wizard.className = "wizard";

  const progress = document.createElement("nav");
  progress.className = "progress";
  for (let i = 1; i <= 4; i++) {
    const dot = document.createElement("div");
    dot.className = `progress-dot${i === 1 ? " active" : ""}`;
    dot.dataset.step = String(i);
    progress.appendChild(dot);
  }
  wizard.appendChild(progress);

  for (let i = 1; i <= 4; i++) {
    const section = document.createElement("section");
    section.className = `step${i === 1 ? " active" : ""}`;
    section.id = `step-${i}`;
    wizard.appendChild(section);
  }

  const cardsContainer = document.createElement("div");
  cardsContainer.className = "profile-cards";
  cardsContainer.setAttribute("role", "radiogroup");
  wizard.querySelector("#step-2")!.appendChild(cardsContainer);

  const categoriesList = document.createElement("div");
  categoriesList.id = "categories-list";
  wizard.querySelector("#step-3")!.appendChild(categoriesList);

  const summary = document.createElement("div");
  summary.id = "done-summary";
  wizard.querySelector("#step-4")!.appendChild(summary);

  const nextBtn = document.createElement("button");
  nextBtn.id = "btn-next-2";
  nextBtn.disabled = true;
  wizard.querySelector("#step-2")!.appendChild(nextBtn);

  document.body.appendChild(wizard);
}

beforeEach(() => {
  const mocks = installChromeMock();
  syncMock = mocks.syncMock;
  resetState();
  createWizardDom();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("goToStep", () => {
  it("shows the target step and hides others", () => {
    goToStep(2);
    expect(document.getElementById("step-2")!.classList.contains("active")).toBe(true);
    expect(document.getElementById("step-1")!.classList.contains("active")).toBe(false);
  });

  it("updates progress dots", () => {
    goToStep(3);
    const dot1 = document.querySelector('[data-step="1"]')!;
    const dot3 = document.querySelector('[data-step="3"]')!;
    expect(dot1.classList.contains("completed")).toBe(true);
    expect(dot3.classList.contains("active")).toBe(true);
  });

  it("ignores invalid step numbers", () => {
    goToStep(1);
    goToStep(0);
    expect(document.getElementById("step-1")!.classList.contains("active")).toBe(true);
    goToStep(5);
    expect(document.getElementById("step-1")!.classList.contains("active")).toBe(true);
  });

  it("navigates back from step 3 to step 2", () => {
    goToStep(3);
    goToStep(2);
    expect(document.getElementById("step-2")!.classList.contains("active")).toBe(true);
    expect(document.getElementById("step-3")!.classList.contains("active")).toBe(false);
  });
});

describe("buildProfileCards", () => {
  it("creates 3 profile cards", () => {
    const container = document.querySelector(".profile-cards") as HTMLElement;
    buildProfileCards(container);
    const cards = container.querySelectorAll(".profile-card");
    expect(cards.length).toBe(3);
  });

  it("cards have role=radio and tabindex=0", () => {
    const container = document.querySelector(".profile-cards") as HTMLElement;
    buildProfileCards(container);
    const card = container.querySelector(".profile-card")!;
    expect(card.getAttribute("role")).toBe("radio");
    expect(card.getAttribute("tabindex")).toBe("0");
  });

  it("marks balanced as recommended", () => {
    const container = document.querySelector(".profile-cards") as HTMLElement;
    buildProfileCards(container);
    const balanced = container.querySelector('[data-profile="balanced"]')!;
    const badge = balanced.querySelector(".badge-recommended");
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe("Recommended");
  });
});

describe("selectProfile", () => {
  it("saves profile and preferences to storage", async () => {
    const container = document.querySelector(".profile-cards") as HTMLElement;
    buildProfileCards(container);
    await selectProfile("balanced", container);
    expect(syncMock.set).toHaveBeenCalled();
    const calls = syncMock.set.mock.calls;
    const profileCall = calls.find(
      (c: unknown[]) => (c[0] as Record<string, unknown>).profile !== undefined,
    );
    expect(profileCall).toBeDefined();
    expect((profileCall![0] as Record<string, unknown>).profile).toBe("balanced");
  });

  it("marks the selected card and deselects others", async () => {
    const container = document.querySelector(".profile-cards") as HTMLElement;
    buildProfileCards(container);
    await selectProfile("privacy-max", container);
    const selected = container.querySelector('[data-profile="privacy-max"]')!;
    const other = container.querySelector('[data-profile="balanced"]')!;
    expect(selected.classList.contains("selected")).toBe(true);
    expect(selected.getAttribute("aria-checked")).toBe("true");
    expect(other.getAttribute("aria-checked")).toBe("false");
  });

  it("enables the Continue button", async () => {
    const container = document.querySelector(".profile-cards") as HTMLElement;
    buildProfileCards(container);
    const nextBtn = document.getElementById("btn-next-2") as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
    await selectProfile("accept-all", container);
    expect(nextBtn.disabled).toBe(false);
  });
});

describe("buildCategoryToggles", () => {
  it("creates 5 category rows", () => {
    const container = document.getElementById("categories-list")!;
    buildCategoryToggles(container);
    const rows = container.querySelectorAll(".category-row");
    expect(rows.length).toBe(5);
  });

  it("disables the essential toggle", () => {
    const container = document.getElementById("categories-list")!;
    buildCategoryToggles(container);
    const essential = document.getElementById("toggle-essential") as HTMLButtonElement;
    expect(essential.disabled).toBe(true);
    expect(essential.getAttribute("aria-disabled")).toBe("true");
  });

  it("sets correct initial aria-checked values", () => {
    const container = document.getElementById("categories-list")!;
    buildCategoryToggles(container);
    const essential = document.getElementById("toggle-essential")!;
    expect(essential.getAttribute("aria-checked")).toBe("true");
  });
});

describe("toggleCategory", () => {
  it("toggles a non-essential category", () => {
    const container = document.getElementById("categories-list")!;
    buildCategoryToggles(container);
    toggleCategory("analytics");
    const toggle = document.getElementById("toggle-analytics")!;
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("does not toggle essential category", () => {
    const container = document.getElementById("categories-list")!;
    buildCategoryToggles(container);
    toggleCategory("essential");
    const toggle = document.getElementById("toggle-essential")!;
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("toggles back on second call", () => {
    const container = document.getElementById("categories-list")!;
    buildCategoryToggles(container);
    toggleCategory("marketing");
    toggleCategory("marketing");
    const toggle = document.getElementById("toggle-marketing")!;
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });
});

describe("saveCustomPreferences", () => {
  it("saves custom profile to storage and goes to step 4", async () => {
    const container = document.getElementById("categories-list")!;
    buildCategoryToggles(container);
    toggleCategory("analytics");
    await saveCustomPreferences();

    expect(syncMock.set).toHaveBeenCalled();
    const profileCall = syncMock.set.mock.calls.find(
      (c: unknown[]) => (c[0] as Record<string, unknown>).profile !== undefined,
    );
    expect((profileCall![0] as Record<string, unknown>).profile).toBe("custom");
    expect(document.getElementById("step-4")!.classList.contains("active")).toBe(true);
  });
});

describe("renderSummary", () => {
  it("renders profile and accepted/rejected categories", async () => {
    const container = document.querySelector(".profile-cards") as HTMLElement;
    buildProfileCards(container);
    await selectProfile("balanced", container);
    goToStep(4);

    const summary = document.getElementById("done-summary")!;
    expect(summary.textContent).toContain("Profile");
    expect(summary.textContent).toContain("Balanced");
    expect(summary.textContent).toContain("Accepting");
    expect(summary.textContent).toContain("Essential");
    expect(summary.textContent).toContain("Rejecting");
  });
});

describe("finishOnboarding", () => {
  it("sets onboardingCompleted to true in storage", async () => {
    vi.spyOn(window, "close").mockImplementation(() => {});
    await finishOnboarding();

    const completedCall = syncMock.set.mock.calls.find(
      (c: unknown[]) => (c[0] as Record<string, unknown>).onboardingCompleted !== undefined,
    );
    expect(completedCall).toBeDefined();
    expect((completedCall![0] as Record<string, unknown>).onboardingCompleted).toBe(true);
  });
});

describe("default behavior", () => {
  it("defaults to Privacy Maximum preferences when no profile selected", () => {
    goToStep(4);
    const summary = document.getElementById("done-summary")!;
    expect(summary.textContent).toContain("Privacy Maximum");
    expect(summary.textContent).toContain("Rejecting");
  });
});
