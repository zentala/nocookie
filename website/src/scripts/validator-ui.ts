/**
 * DOM builder functions for validator result display.
 *
 * All user-visible strings are set via textContent (safe from XSS).
 * No innerHTML is used with untrusted data.
 */

import type { ValidationResult } from "./validator-logic";

/** Create a loading indicator element. */
export function createLoadingEl(): HTMLElement {
  const div = document.createElement("div");
  div.className = "text-muted animate-pulse";
  div.textContent = "Fetching...";
  return div;
}

/** Create element shown when file is not found (404). */
export function createNotFoundEl(onSwitchToGenerator: () => void): HTMLElement {
  const div = document.createElement("div");
  div.className = "rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4";
  const p1 = document.createElement("p");
  p1.className = "text-yellow-400 font-medium";
  p1.textContent = "No file found at /.well-known/cookie-consent.json";
  const p2 = document.createElement("p");
  p2.className = "text-muted text-sm mt-2";
  p2.textContent = "Switch to the Generator tab to create one. ";
  const btn = document.createElement("button");
  btn.className = "text-primary underline";
  btn.textContent = "Go to Generator";
  btn.addEventListener("click", onSwitchToGenerator);
  p2.appendChild(btn);
  div.appendChild(p1);
  div.appendChild(p2);
  return div;
}

/** Create a generic error element. */
export function createErrorEl(msg: string): HTMLElement {
  const div = document.createElement("div");
  div.className = "rounded-lg border border-red-500/30 bg-red-500/10 p-4";
  const p1 = document.createElement("p");
  p1.className = "text-red-400 font-medium";
  p1.textContent = "Error";
  const p2 = document.createElement("p");
  p2.className = "text-muted text-sm mt-1";
  p2.textContent = msg;
  div.appendChild(p1);
  div.appendChild(p2);
  return div;
}

/** Create element shown when CORS blocks the fetch. */
export function createCorsErrorEl(endpoint: string): HTMLElement {
  const div = document.createElement("div");
  div.className = "rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4";
  const p1 = document.createElement("p");
  p1.className = "text-yellow-400 font-medium";
  p1.textContent = "Could not fetch (CORS restriction)";
  const p2 = document.createElement("p");
  p2.className = "text-muted text-sm mt-2";
  p2.textContent =
    "The server does not allow cross-origin requests. Try opening the URL directly: ";
  const code = document.createElement("code");
  code.className = "text-primary/80";
  code.textContent = endpoint;
  p2.appendChild(code);
  div.appendChild(p1);
  div.appendChild(p2);
  return div;
}

/** Create the full validation result display. */
export function createResultEl(result: ValidationResult, rawJson: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "space-y-4";

  const statusRow = document.createElement("div");
  statusRow.className = "flex items-center gap-2";
  const dot = document.createElement("span");
  dot.className = `w-3 h-3 rounded-full ${result.valid ? "bg-green-500" : "bg-red-500"}`;
  const label = document.createElement("span");
  label.className = `font-semibold ${result.valid ? "text-green-400" : "text-red-400"}`;
  label.textContent = result.valid ? "Valid" : "Invalid";
  statusRow.appendChild(dot);
  statusRow.appendChild(label);
  wrapper.appendChild(statusRow);

  for (const err of result.errors) {
    wrapper.appendChild(createIssueEl(err.path || "(root)", err.message, "red"));
  }
  for (const w of result.warnings) {
    wrapper.appendChild(createIssueEl(w.path, w.message, "yellow"));
  }

  const details = document.createElement("details");
  details.className = "mt-4";
  const summary = document.createElement("summary");
  summary.className = "text-sm text-muted cursor-pointer hover:text-white";
  summary.textContent = "Raw JSON";
  const pre = document.createElement("pre");
  pre.className = "mt-2 rounded-lg bg-surface p-4 text-sm text-muted overflow-x-auto font-mono";
  pre.textContent = rawJson;
  details.appendChild(summary);
  details.appendChild(pre);
  wrapper.appendChild(details);

  return wrapper;
}

/** Create a single error or warning row. */
function createIssueEl(path: string, message: string, color: "red" | "yellow"): HTMLElement {
  const div = document.createElement("div");
  div.className = `rounded border border-${color}-500/30 bg-${color}-500/10 px-3 py-2 text-sm`;
  const pathSpan = document.createElement("span");
  pathSpan.className = `text-${color}-400 font-mono`;
  pathSpan.textContent = path;
  const msgSpan = document.createElement("span");
  msgSpan.className = "text-muted ml-2";
  msgSpan.textContent = message;
  div.appendChild(pathSpan);
  div.appendChild(msgSpan);
  return div;
}
