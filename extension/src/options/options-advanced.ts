/**
 * Advanced settings tab (Tab 3) for the options page.
 *
 * Manages extension-wide toggles and sliders: auto-consent, consent delay,
 * heuristics, notifications, logging, well-known, and GPC.
 */

import { getSettings, updateSettings } from "@/shared/storage-api";
import type { ExtensionSettings } from "@/shared/types";

/** Metadata for each advanced setting toggle. */
interface SettingDef {
  key: keyof ExtensionSettings;
  label: string;
  description: string;
}

/** Toggle-based settings displayed in the Advanced tab. */
const TOGGLE_SETTINGS: SettingDef[] = [
  {
    key: "autoConsent",
    label: "Auto-consent",
    description: "Automatically handle cookie popups on page load.",
  },
  {
    key: "enableHeuristics",
    label: "Heuristic detection",
    description: "Use heuristics to detect unknown cookie banners.",
  },
  {
    key: "showNotifications",
    label: "Notifications",
    description: "Show a notification after handling a cookie popup.",
  },
  {
    key: "logConsent",
    label: "Log consent actions",
    description: "Record each consent action for statistics.",
  },
  {
    key: "enableWellKnown",
    label: "Well-known standard",
    description: "Check /.well-known/cookie-consent.json for site preferences.",
  },
  {
    key: "enableGpc",
    label: "Global Privacy Control",
    description: "Send the Sec-GPC: 1 header to signal opt-out preference.",
  },
];

/** Build the advanced settings panel DOM. */
export function buildAdvancedPanel(container: HTMLElement, settings: ExtensionSettings): void {
  container.textContent = "";

  for (const def of TOGGLE_SETTINGS) {
    const row = document.createElement("div");
    row.className = "setting-row";

    const header = document.createElement("div");
    header.className = "setting-header";

    const label = document.createElement("span");
    label.className = "setting-label";
    label.textContent = def.label;

    const toggle = document.createElement("button");
    toggle.className = "toggle-switch";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-checked", String(settings[def.key]));
    toggle.setAttribute("aria-label", def.label);
    toggle.id = `setting-${def.key}`;

    header.append(label, toggle);

    const desc = document.createElement("p");
    desc.className = "setting-desc";
    desc.textContent = def.description;

    row.append(header, desc);
    container.appendChild(row);
  }

  // Consent delay slider
  const delayRow = document.createElement("div");
  delayRow.className = "setting-row";

  const delayHeader = document.createElement("div");
  delayHeader.className = "setting-header";

  const delayLabel = document.createElement("span");
  delayLabel.className = "setting-label";
  delayLabel.textContent = "Consent delay";

  const delayRight = document.createElement("span");
  delayRight.className = "delay-display";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "2000";
  slider.step = "100";
  slider.value = String(settings.consentDelay);
  slider.id = "setting-consentDelay";
  slider.setAttribute("aria-label", "Consent delay in milliseconds");
  slider.setAttribute("aria-valuemin", "0");
  slider.setAttribute("aria-valuemax", "2000");
  slider.setAttribute("aria-valuenow", String(settings.consentDelay));
  slider.setAttribute("aria-valuetext", `${settings.consentDelay} milliseconds`);

  const valueSpan = document.createElement("span");
  valueSpan.id = "delay-value";
  valueSpan.textContent = `${settings.consentDelay}ms`;

  delayRight.append(slider, valueSpan);
  delayHeader.append(delayLabel, delayRight);

  const delayDesc = document.createElement("p");
  delayDesc.className = "setting-desc";
  delayDesc.textContent = "Wait time before auto-handling cookie popups (milliseconds).";

  delayRow.append(delayHeader, delayDesc);
  container.appendChild(delayRow);
}

/** Initialize the advanced tab: build DOM, wire up event handlers. */
export async function initAdvanced(): Promise<void> {
  const container = document.getElementById("panel-advanced");
  if (!container) return;

  const settings = await getSettings();
  buildAdvancedPanel(container, settings);

  // Toggle click handler (event delegation)
  container.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("toggle-switch")) return;

    const key = target.id.replace("setting-", "") as keyof ExtensionSettings;
    const current = target.getAttribute("aria-checked") === "true";
    const newValue = !current;
    target.setAttribute("aria-checked", String(newValue));
    await updateSettings({ [key]: newValue });
  });

  // Slider input handler
  const slider = document.getElementById("setting-consentDelay") as HTMLInputElement | null;
  const delayValue = document.getElementById("delay-value");
  slider?.addEventListener("input", async () => {
    const value = Number(slider.value);
    if (delayValue) delayValue.textContent = `${value}ms`;
    slider.setAttribute("aria-valuenow", String(value));
    slider.setAttribute("aria-valuetext", `${value} milliseconds`);
    await updateSettings({ consentDelay: value });
  });
}
