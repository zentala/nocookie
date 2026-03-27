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
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "badge-kit");

// Single source of truth: icon-data.json (shared with src/shared/icon-data.ts)
const jsonPath = resolve(__dirname, "..", "src", "shared", "icon-data.json");
const iconData = JSON.parse(readFileSync(jsonPath, "utf-8"));

const CATEGORY_PATHS = iconData.categoryPaths;
const CATEGORIES = iconData.categories;
const PRIVACY_LEVELS = iconData.privacyLevels;
const COMPLIANCE_BADGES = iconData.complianceBadges;

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
.nocookie-badge--gpc { background: #15803d20; color: #15803d; }
.nocookie-badge--standard { background: #7c3aed20; color: #7c3aed; }
.nocookie-badge--extension { background: #ea580c20; color: #ea580c; }

/* Privacy level badges */
.nocookie-privacy--maximum { background: #15803d20; color: #15803d; }
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
