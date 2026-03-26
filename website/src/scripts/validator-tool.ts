/**
 * Client-side logic for the validator/generator tool page.
 *
 * Handles tab switching, URL validation with fetch, generator form
 * with live JSON preview, copy-to-clipboard, and file download.
 */

import { validate } from "./validator-logic";
import { CMP_PRESETS } from "./cmp-presets";
import {
  createLoadingEl,
  createNotFoundEl,
  createErrorEl,
  createCorsErrorEl,
  createResultEl,
} from "./validator-ui";

/* ------------------------------------------------------------------ */
/*  DOM references                                                     */
/* ------------------------------------------------------------------ */

const tabValidator = document.getElementById("tab-validator") as HTMLButtonElement;
const tabGenerator = document.getElementById("tab-generator") as HTMLButtonElement;
const panelValidator = document.getElementById("panel-validator")!;
const panelGenerator = document.getElementById("panel-generator")!;

const urlInput = document.getElementById("url-input") as HTMLInputElement;
const validateBtn = document.getElementById("validate-btn") as HTMLButtonElement;
const validatorResults = document.getElementById("validator-results")!;

const cmpSelect = document.getElementById("cmp-select") as HTMLSelectElement;
const genCategories = document.querySelectorAll<HTMLInputElement>(".gen-category");
const genBanner = document.getElementById("gen-banner") as HTMLInputElement;
const genAcceptAll = document.getElementById("gen-accept-all") as HTMLInputElement;
const genRejectAll = document.getElementById("gen-reject-all") as HTMLInputElement;
const genPreferences = document.getElementById("gen-preferences") as HTMLInputElement;
const genSave = document.getElementById("gen-save") as HTMLInputElement;
const genApiType = document.getElementById("gen-api-type") as HTMLInputElement;
const genApiAccept = document.getElementById("gen-api-accept") as HTMLInputElement;
const genApiReject = document.getElementById("gen-api-reject") as HTMLInputElement;
const genContact = document.getElementById("gen-contact") as HTMLInputElement;
const genPolicyUrl = document.getElementById("gen-policy-url") as HTMLInputElement;
const genGpc = document.getElementById("gen-gpc") as HTMLInputElement;
const genTcf = document.getElementById("gen-tcf") as HTMLInputElement;
const jsonPreview = document.getElementById("json-preview")!;
const copyBtn = document.getElementById("copy-btn") as HTMLButtonElement;
const downloadBtn = document.getElementById("download-btn") as HTMLButtonElement;

/* ------------------------------------------------------------------ */
/*  Tab switching                                                      */
/* ------------------------------------------------------------------ */

function switchTab(active: "validator" | "generator"): void {
  const isValidator = active === "validator";
  panelValidator.classList.toggle("hidden", !isValidator);
  panelGenerator.classList.toggle("hidden", isValidator);
  tabValidator.classList.toggle("border-primary", isValidator);
  tabValidator.classList.toggle("text-white", isValidator);
  tabValidator.classList.toggle("border-transparent", !isValidator);
  tabValidator.classList.toggle("text-muted", !isValidator);
  tabGenerator.classList.toggle("border-primary", !isValidator);
  tabGenerator.classList.toggle("text-white", !isValidator);
  tabGenerator.classList.toggle("border-transparent", isValidator);
  tabGenerator.classList.toggle("text-muted", isValidator);
}

tabValidator.addEventListener("click", () => switchTab("validator"));
tabGenerator.addEventListener("click", () => switchTab("generator"));

/* ------------------------------------------------------------------ */
/*  Validator                                                          */
/* ------------------------------------------------------------------ */

validateBtn.addEventListener("click", () => runValidation());
urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runValidation();
});

async function runValidation(): Promise<void> {
  let url = urlInput.value.trim();
  if (!url) return;
  if (!url.startsWith("http")) url = `https://${url}`;
  url = url.replace(/\/+$/, "");
  const endpoint = `${url}/.well-known/cookie-consent.json`;

  validatorResults.textContent = "";
  validatorResults.appendChild(createLoadingEl());
  try {
    const res = await fetch(endpoint, { mode: "cors" });
    if (res.status === 404) {
      validatorResults.textContent = "";
      validatorResults.appendChild(createNotFoundEl(() => tabGenerator.click()));
      return;
    }
    if (!res.ok) {
      validatorResults.textContent = "";
      validatorResults.appendChild(createErrorEl(`HTTP ${res.status}: ${res.statusText}`));
      return;
    }
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      validatorResults.textContent = "";
      validatorResults.appendChild(createErrorEl("Response is not valid JSON."));
      return;
    }
    const result = validate(parsed);
    validatorResults.textContent = "";
    validatorResults.appendChild(createResultEl(result, text));
  } catch {
    validatorResults.textContent = "";
    validatorResults.appendChild(createCorsErrorEl(endpoint));
  }
}

/* ------------------------------------------------------------------ */
/*  Generator                                                          */
/* ------------------------------------------------------------------ */

cmpSelect.addEventListener("change", applyCmpPreset);
const generatorInputs = document.querySelectorAll(
  "#panel-generator input, #panel-generator select",
);
generatorInputs.forEach((el) => el.addEventListener("input", updatePreview));

function applyCmpPreset(): void {
  const key = cmpSelect.value;
  const preset = CMP_PRESETS[key];
  if (!preset) return;
  genBanner.value = preset.selectors.banner ?? "";
  genAcceptAll.value = preset.selectors.acceptAll ?? "";
  genRejectAll.value = preset.selectors.rejectAll ?? "";
  genPreferences.value = preset.selectors.preferences ?? "";
  genSave.value = preset.selectors.save ?? "";
  genApiType.value = preset.api?.type ?? "";
  genApiAccept.value = preset.api?.acceptAll ?? "";
  genApiReject.value = preset.api?.rejectAll ?? "";
  updatePreview();
}

function buildJson(): Record<string, unknown> {
  const categories: string[] = [];
  genCategories.forEach((cb) => {
    if (cb.checked) categories.push(cb.value);
  });
  if (!categories.includes("essential")) categories.unshift("essential");

  const obj: Record<string, unknown> = { version: "1.0", categories };

  const cmpName = CMP_PRESETS[cmpSelect.value]?.cmp.name || cmpSelect.value;
  if (cmpName && cmpName !== "custom") obj.cmp = { name: cmpName };

  const selectors: Record<string, string> = {};
  if (genBanner.value) selectors.banner = genBanner.value;
  if (genAcceptAll.value) selectors.acceptAll = genAcceptAll.value;
  if (genRejectAll.value) selectors.rejectAll = genRejectAll.value;
  if (genPreferences.value) selectors.preferences = genPreferences.value;
  if (genSave.value) selectors.save = genSave.value;
  if (Object.keys(selectors).length > 0) obj.selectors = selectors;

  const api: Record<string, string> = {};
  if (genApiType.value) api.type = genApiType.value;
  if (genApiAccept.value) api.acceptAll = genApiAccept.value;
  if (genApiReject.value) api.rejectAll = genApiReject.value;
  if (Object.keys(api).length > 0) obj.api = api;

  if (genGpc.checked) obj.gpc = true;
  if (genTcf.checked) obj.tcf = true;
  if (genContact.value) obj.contact = genContact.value;
  if (genPolicyUrl.value) obj.policyUrl = genPolicyUrl.value;

  return obj;
}

function updatePreview(): void {
  const json = JSON.stringify(buildJson(), null, 2);
  jsonPreview.textContent = json;
}

copyBtn.addEventListener("click", async () => {
  const json = JSON.stringify(buildJson(), null, 2);
  await navigator.clipboard.writeText(json);
  const original = copyBtn.textContent;
  copyBtn.textContent = "Copied!";
  setTimeout(() => {
    copyBtn.textContent = original;
  }, 2000);
});

downloadBtn.addEventListener("click", () => {
  const json = JSON.stringify(buildJson(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cookie-consent.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

/* Initial preview */
updatePreview();
