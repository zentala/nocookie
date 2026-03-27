/**
 * Generates the NoCookie Badge Kit — standalone SVG files, CSS, and README.
 *
 * Output directory: packages/cmp/badge-kit/
 *   icons/       — category icon SVGs (essential, functional, analytics, etc.)
 *   badges/      — privacy level badge SVGs (maximum, friendly, balanced, full-tracking)
 *   compliance/  — compliance badge SVGs (gdpr, gpc, standard, extension-ready)
 *   sprite.svg   — combined SVG sprite sheet
 *   badges.css   — embeddable CSS classes for HTML badge usage
 *   README.md    — usage guide
 *
 * Usage: node scripts/generate-badge-kit.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "badge-kit");

const CATEGORY_PATHS = {
  lock: "M9 11V9a3 3 0 0 1 6 0v2h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1z",
  gear: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1-4h2l.4 1.6c.3.1.6.3.9.5l1.5-.6 1 1.7-1.1 1c.1.3.1.7 0 1l1.1 1.1-1 1.7-1.5-.6c-.3.2-.6.4-.9.5L13 18h-2l-.4-1.6c-.3-.1-.6-.3-.9-.5l-1.5.6-1-1.7 1.1-1c-.1-.3-.1-.7 0-1L7.2 7.8l1-1.7 1.5.6c.3-.2.6-.4.9-.5L11 6z",
  chart: "M7 17V11h2v6H7zm4 0V7h2v10h-2zm4 0v-4h2v4h-2z",
  megaphone: "M6 10v4h2l4 4V6L8 10H6zm10.5 2A4.5 4.5 0 0 0 14 8.5v7a4.47 4.47 0 0 0 2.5-3.5z",
  share: "M16 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM8 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1.5-2.6-5-2.8m0 4.8 5-2.8",
};

const CATEGORIES = [
  { id: "essential", name: "Essential cookies", icon: "lock", color: "#6b7280" },
  { id: "functional", name: "Functional cookies", icon: "gear", color: "#2563eb" },
  { id: "analytics", name: "Analytics cookies", icon: "chart", color: "#7c3aed" },
  { id: "marketing", name: "Marketing cookies", icon: "megaphone", color: "#ea580c" },
  { id: "social-media", name: "Social media cookies", icon: "share", color: "#0ea5e9" },
];

const PRIVACY_LEVELS = [
  { id: "maximum", color: "#16a34a", label: "Privacy Maximum", text: "Essential only", path: "M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4zm-1 14l-3-3 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z" },
  { id: "friendly", color: "#2563eb", label: "Privacy Friendly", text: "Essential + Functional", path: "M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4zm0 4a4 4 0 0 1 0 8v-2a2 2 0 0 0 0-4V6z" },
  { id: "balanced", color: "#d97706", label: "Balanced", text: "Includes Analytics", path: "M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4zm-3 12l3-6 3 6H9z" },
  { id: "full-tracking", color: "#ea580c", label: "Full Tracking", text: "All categories", path: "M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4zm0 5a5 5 0 0 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 0 0 0 6 3 3 0 0 0 0-6zm0 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" },
];

const COMPLIANCE_BADGES = [
  { id: "gdpr", color: "#2563eb", label: "GDPR Compliant", text: "GDPR", icon: '<path d="M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z" fill="currentColor"/>' },
  { id: "gpc", color: "#16a34a", label: "GPC Respected", text: "GPC", icon: '<path d="M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4zm-1 14l-3-3 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z" fill="currentColor"/>' },
  { id: "standard", color: "#7c3aed", label: "Standard Compliant", text: "v1", icon: '<path d="M9 12l2 2 4-4M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill="none" stroke="currentColor" stroke-width="2"/>' },
  { id: "extension-ready", color: "#ea580c", label: "Extension Ready", text: "\u26A1", icon: '<path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor"/>' },
];

/** Wraps SVG content in a standalone SVG document with XML declaration. */
function wrapSvg(content, label) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" role="img" aria-label="${label}">`,
    `  ${content}`,
    "</svg>",
    "",
  ].join("\n");
}

/** Generates category icon SVGs into badge-kit/icons/. */
function generateCategoryIcons() {
  const dir = resolve(outDir, "icons");
  mkdirSync(dir, { recursive: true });

  for (const cat of CATEGORIES) {
    const pathData = CATEGORY_PATHS[cat.icon];
    const svg = wrapSvg(
      `<circle cx="12" cy="12" r="12" fill="${cat.color}"/>\n  <path d="${pathData}" fill="white" stroke="white" stroke-width="0.3"/>`,
      cat.name,
    );
    writeFileSync(resolve(dir, `${cat.id}.svg`), svg);
  }
  console.log(`  icons/  — ${CATEGORIES.length} category icons`);
}

/** Generates privacy level badge SVGs into badge-kit/badges/. */
function generatePrivacyBadges() {
  const dir = resolve(outDir, "badges");
  mkdirSync(dir, { recursive: true });

  for (const level of PRIVACY_LEVELS) {
    const svg = wrapSvg(
      `<path d="${level.path}" fill="${level.color}"/>`,
      `${level.label}: ${level.text}`,
    );
    writeFileSync(resolve(dir, `privacy-${level.id}.svg`), svg);
  }
  console.log(`  badges/ — ${PRIVACY_LEVELS.length} privacy level badges`);
}

/** Generates compliance badge SVGs into badge-kit/compliance/. */
function generateComplianceBadges() {
  const dir = resolve(outDir, "compliance");
  mkdirSync(dir, { recursive: true });

  for (const badge of COMPLIANCE_BADGES) {
    const content = badge.icon.replace(/currentColor/g, badge.color);
    const svg = wrapSvg(content, badge.label);
    writeFileSync(resolve(dir, `${badge.id}.svg`), svg);
  }
  console.log(`  compliance/ — ${COMPLIANCE_BADGES.length} compliance badges`);
}

/** Generates a combined SVG sprite sheet. */
function generateSpriteSheet() {
  const symbols = [];

  for (const cat of CATEGORIES) {
    const pathData = CATEGORY_PATHS[cat.icon];
    symbols.push(
      `  <symbol id="ca-icon-${cat.id}" viewBox="0 0 24 24" role="img" aria-label="${cat.name}">` +
      `<circle cx="12" cy="12" r="12" fill="${cat.color}"/>` +
      `<path d="${pathData}" fill="white" stroke="white" stroke-width="0.3"/>` +
      `</symbol>`,
    );
  }

  for (const level of PRIVACY_LEVELS) {
    symbols.push(
      `  <symbol id="ca-privacy-${level.id}" viewBox="0 0 24 24" aria-label="${level.label}">` +
      `<path d="${level.path}" fill="${level.color}"/>` +
      `</symbol>`,
    );
  }

  const sprite = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">',
    symbols.join("\n"),
    "</svg>",
    "",
  ].join("\n");

  writeFileSync(resolve(outDir, "sprite.svg"), sprite);
  console.log("  sprite.svg");
}

/** Generates the badge CSS file. */
function generateCSS() {
  const css = `/* NoCookie Badge Kit — Embeddable styles */
/* https://github.com/zentala/cookies-accepter */

/* Base badge style */
.nocookie-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.4;
  text-decoration: none;
}

/* Compliance badges */
.nocookie-badge--gdpr { background: #2563eb20; color: #2563eb; }
.nocookie-badge--gpc { background: #16a34a20; color: #16a34a; }
.nocookie-badge--standard { background: #7c3aed20; color: #7c3aed; }
.nocookie-badge--extension { background: #ea580c20; color: #ea580c; }

/* Privacy level badges */
.nocookie-privacy--maximum { background: #16a34a20; color: #16a34a; }
.nocookie-privacy--friendly { background: #2563eb20; color: #2563eb; }
.nocookie-privacy--balanced { background: #d9770620; color: #d97706; }
.nocookie-privacy--full { background: #ea580c20; color: #ea580c; }

/* Category icon badge wrappers */
.nocookie-category--essential { background: #6b728020; color: #6b7280; }
.nocookie-category--functional { background: #2563eb20; color: #2563eb; }
.nocookie-category--analytics { background: #7c3aed20; color: #7c3aed; }
.nocookie-category--marketing { background: #ea580c20; color: #ea580c; }
.nocookie-category--social-media { background: #0ea5e920; color: #0ea5e9; }
`;

  writeFileSync(resolve(outDir, "badges.css"), css);
  console.log("  badges.css");
}

/** Generates the README usage guide. */
function generateReadme() {
  const readme = `# NoCookie Badge Kit

Embeddable cookie policy icons and badges for your website.

## Category Icons

Show which cookie categories your site uses in your footer, docs, or policy page.

\`\`\`html
<img src="icons/essential.svg" width="24" alt="Essential cookies" />
<img src="icons/functional.svg" width="24" alt="Functional cookies" />
<img src="icons/analytics.svg" width="24" alt="Analytics cookies" />
<img src="icons/marketing.svg" width="24" alt="Marketing cookies" />
<img src="icons/social-media.svg" width="24" alt="Social media cookies" />
\`\`\`

## Privacy Level Badges

Show visitors how privacy-friendly your site is.

\`\`\`html
<img src="badges/privacy-maximum.svg" width="24" alt="Privacy Maximum" />
<img src="badges/privacy-friendly.svg" width="24" alt="Privacy Friendly" />
<img src="badges/privacy-balanced.svg" width="24" alt="Balanced" />
<img src="badges/privacy-full-tracking.svg" width="24" alt="Full Tracking" />
\`\`\`

## Compliance Badges

\`\`\`html
<img src="compliance/gdpr.svg" width="24" alt="GDPR Compliant" />
<img src="compliance/gpc.svg" width="24" alt="GPC Respected" />
<img src="compliance/standard.svg" width="24" alt="Standard Compliant" />
<img src="compliance/extension-ready.svg" width="24" alt="Extension Ready" />
\`\`\`

## CSS Badge Classes

Include the stylesheet and use semantic HTML badges:

\`\`\`html
<link rel="stylesheet" href="badges.css" />

<!-- Compliance badges -->
<span class="nocookie-badge nocookie-badge--gdpr">GDPR</span>
<span class="nocookie-badge nocookie-badge--gpc">GPC</span>

<!-- Privacy level badges -->
<span class="nocookie-badge nocookie-privacy--maximum">Essential Only</span>
<span class="nocookie-badge nocookie-privacy--friendly">Privacy Friendly</span>

<!-- Category badges -->
<span class="nocookie-badge nocookie-category--essential">Essential</span>
<span class="nocookie-badge nocookie-category--analytics">Analytics</span>
\`\`\`

## SVG Sprite Sheet

For multiple icons on one page, use the sprite sheet to avoid repeated downloads:

\`\`\`html
<!-- Include sprite once (hidden) -->
<div style="display:none" aria-hidden="true">
  <!-- inline or fetch sprite.svg -->
</div>

<!-- Reference individual icons -->
<svg width="24" height="24"><use href="#ca-icon-essential" /></svg>
<svg width="24" height="24"><use href="#ca-icon-analytics" /></svg>
<svg width="24" height="24"><use href="#ca-privacy-maximum" /></svg>
\`\`\`

## Regenerating

Run from the packages/cmp directory:

\`\`\`bash
pnpm build:badges
\`\`\`
`;

  writeFileSync(resolve(outDir, "README.md"), readme);
  console.log("  README.md");
}

function main() {
  mkdirSync(outDir, { recursive: true });
  console.log("Generating NoCookie Badge Kit...");

  generateCategoryIcons();
  generatePrivacyBadges();
  generateComplianceBadges();
  generateSpriteSheet();
  generateCSS();
  generateReadme();

  console.log(`\nBadge kit generated in: ${outDir}`);
}

main();
