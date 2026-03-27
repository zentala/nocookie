/**
 * @module configurator
 * Client-side logic for the CMP configurator tool.
 * Reads form inputs, builds config JSON, renders live banner preview.
 *
 * Security note: innerHTML usage is safe here because all dynamic values
 * are escaped via escapeHtml() before insertion. This is a local-only
 * configurator — no untrusted external input is processed.
 */

interface ConfigOutput {
  siteName: string;
  privacyContact?: string;
  policyUrl?: string;
  categories: string[];
  theme: {
    mode: string;
    position: string;
    primaryColor: string;
    acceptColor: string;
    rejectColor: string;
  };
}

/** Escape HTML special characters to prevent XSS. */
function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (c) => map[c] || c);
}

/** Read all form values and build a config object. */
function buildConfig(): ConfigOutput {
  const siteName =
    (document.getElementById("cfg-site-name") as HTMLInputElement)?.value || "My Website";
  const privacyContact = (document.getElementById("cfg-contact") as HTMLInputElement)?.value;
  const policyUrl = (document.getElementById("cfg-policy-url") as HTMLInputElement)?.value;

  const categoryEls = document.querySelectorAll<HTMLInputElement>(".cfg-category:checked");
  const categories = Array.from(categoryEls).map((el) => el.value);

  const mode =
    document.querySelector<HTMLInputElement>('input[name="cfg-mode"]:checked')?.value || "light";
  const position =
    document.querySelector<HTMLInputElement>('input[name="cfg-position"]:checked')?.value ||
    "bottom-left";

  const primaryColor = (document.getElementById("cfg-primary-color") as HTMLInputElement)?.value;
  const acceptColor = (document.getElementById("cfg-accept-color") as HTMLInputElement)?.value;
  const rejectColor = (document.getElementById("cfg-reject-color") as HTMLInputElement)?.value;

  const config: ConfigOutput = {
    siteName,
    categories,
    theme: { mode, position, primaryColor, acceptColor, rejectColor },
  };
  if (privacyContact) config.privacyContact = privacyContact;
  if (policyUrl) config.policyUrl = policyUrl;

  return config;
}

/** Build banner preview HTML using safe escaped values. */
function buildBannerHtml(config: ConfigOutput): string {
  const isDark = config.theme.mode === "dark";
  const bg = isDark ? "#1e293b" : "#ffffff";
  const text = isDark ? "#f1f5f9" : "#1f2937";
  const muted = isDark ? "#94a3b8" : "#6b7280";
  const safeName = escapeHtml(config.siteName);
  const safePrimary = escapeHtml(config.theme.primaryColor);
  const safeAccept = escapeHtml(config.theme.acceptColor);
  const safeReject = escapeHtml(config.theme.rejectColor);

  const catHtml = config.categories
    .filter((c) => c !== "essential")
    .map(
      (c) =>
        `<span style="display:inline-block;padding:2px 8px;border-radius:4px;` +
        `font-size:11px;background:${safePrimary}20;color:${safePrimary};">` +
        `${escapeHtml(c)}</span>`,
    )
    .join(" ");

  const catSection = catHtml
    ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">${catHtml}</div>`
    : "";

  return `<div style="background:${bg};color:${text};border-radius:12px;padding:20px;
    box-shadow:0 8px 32px rgba(0,0,0,0.18);font-family:system-ui,-apple-system,sans-serif;
    font-size:14px;line-height:1.5;">
    <div style="font-weight:600;font-size:15px;margin-bottom:6px;">Cookie Consent</div>
    <div style="color:${muted};font-size:12px;margin-bottom:12px;">
      We use cookies to enhance your experience on
      <strong style="color:${text};">${safeName}</strong>.
      Choose which categories you allow.
    </div>
    ${catSection}
    <div style="display:flex;gap:8px;">
      <button style="flex:1;padding:8px 0;border:none;border-radius:8px;
        background:${safeAccept};color:#fff;font-size:13px;font-weight:500;
        cursor:pointer;">Accept All</button>
      <button style="flex:1;padding:8px 0;border:none;border-radius:8px;
        background:${safeReject};color:#fff;font-size:13px;font-weight:500;
        cursor:pointer;">Reject All</button>
    </div>
    <button style="width:100%;padding:6px 0;margin-top:6px;
      border:1px solid ${muted}40;border-radius:8px;background:transparent;
      color:${muted};font-size:12px;cursor:pointer;">Customize</button>
  </div>`;
}

/** Render the live banner preview using the current config. */
function renderPreview(config: ConfigOutput): void {
  const container = document.getElementById("preview-banner");
  if (!container) return;

  const posMap: Record<string, string> = {
    "bottom-left": "bottom:12px;left:12px;",
    "bottom-right": "bottom:12px;right:12px;",
    "bottom-center": "bottom:12px;left:50%;transform:translateX(-50%);",
    "top-center": "top:12px;left:50%;transform:translateX(-50%);",
  };
  const posStyle = posMap[config.theme.position] || posMap["bottom-left"];
  container.setAttribute("style", `${posStyle} width:340px;max-width:calc(100% - 24px);`);
  // All values are escaped via escapeHtml before insertion
  container.innerHTML = buildBannerHtml(config);
}

/** Update JSON output, script tag, and preview. */
function updateAll(): void {
  const config = buildConfig();

  const jsonStr = JSON.stringify(config, null, 2);
  const jsonOutput = document.getElementById("cfg-json-output");
  if (jsonOutput) jsonOutput.textContent = jsonStr;

  const scriptTag = document.getElementById("cfg-script-tag");
  if (scriptTag) {
    const safeJson = escapeHtml(JSON.stringify(config));
    scriptTag.textContent =
      `<script src="https://cdn.nocookie.org/cmp/latest/nocookie-cmp.min.js"\n` +
      `  data-config='${safeJson}'><\/script>`;
  }

  renderPreview(config);
}

/** Copy text to clipboard with button feedback. */
function copyToClipboard(text: string, btn: HTMLElement): void {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = original;
    }, 1500);
  });
}

/** Download text as a file. */
function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function syncColorHex(inputId: string, hexId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const hex = document.getElementById(hexId);
  if (input && hex) hex.textContent = input.value;
}

function syncAllColorHexes(): void {
  syncColorHex("cfg-primary-color", "cfg-primary-color-hex");
  syncColorHex("cfg-accept-color", "cfg-accept-color-hex");
  syncColorHex("cfg-reject-color", "cfg-reject-color-hex");
}

function init(): void {
  const formInputs = document.querySelectorAll<HTMLElement>(
    "#cfg-site-name, #cfg-contact, #cfg-policy-url, " +
      ".cfg-category, " +
      'input[name="cfg-mode"], input[name="cfg-position"], ' +
      "#cfg-primary-color, #cfg-accept-color, #cfg-reject-color",
  );
  formInputs.forEach((el) => {
    el.addEventListener("input", () => {
      syncAllColorHexes();
      updateAll();
    });
    el.addEventListener("change", () => {
      syncAllColorHexes();
      updateAll();
    });
  });

  document.getElementById("cfg-copy-btn")?.addEventListener("click", () => {
    const json = document.getElementById("cfg-json-output")?.textContent || "";
    const btn = document.getElementById("cfg-copy-btn");
    if (btn) copyToClipboard(json, btn);
  });

  document.getElementById("cfg-download-btn")?.addEventListener("click", () => {
    const json = document.getElementById("cfg-json-output")?.textContent || "";
    downloadFile(json, "nocookie-cmp-config.json");
  });

  document.getElementById("cfg-copy-script-btn")?.addEventListener("click", () => {
    const tag = document.getElementById("cfg-script-tag")?.textContent || "";
    const btn = document.getElementById("cfg-copy-script-btn");
    if (btn) copyToClipboard(tag, btn);
  });

  updateAll();
}

init();
