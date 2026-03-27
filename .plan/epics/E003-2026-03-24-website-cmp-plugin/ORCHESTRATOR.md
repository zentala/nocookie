---
id: E003
title: NoCookie CMP — Task Breakdown & Execution Plan
status: done
created: 2026-03-24
---

# E003 Orchestrator: Website CMP Plugin

## Task Summary

| ID | Task | Wave | Complexity | Estimate | Status |
|----|------|------|-----------|----------|--------|
| E003-T01 | Project scaffolding & build setup | 1 | Medium | 4h | [x] |
| E003-T02 | Core types & config schema | 1 | Medium | 3h | [x] |
| E003-T03 | Consent state engine | 1 | Medium | 4h | [x] |
| E003-T04 | Event bus system | 1 | Low | 2h | [x] |
| E003-T05 | Theme engine & CSS variables | 2 | Medium | 4h | [x] |
| E003-T06 | Banner UI (first layer) | 2 | Medium | 6h | [x] |
| E003-T07 | Preference center UI (second layer) | 2 | High | 8h | [x] |
| E003-T08 | Cookie policy icon system | 2 | Medium | 6h | [x] |
| E003-T09 | Cookie policy page generator | 3 | High | 8h | [x] |
| E003-T10 | Well-known JSON generator | 3 | Low | 3h | [x] |
| E003-T11 | Extension bridge (handshake protocol) | 3 | High | 6h | [x] |
| E003-T12 | GPC signal detection & response | 3 | Low | 2h | [x] |
| E003-T13 | Internationalization (i18n) | 4 | Medium | 6h | [x] |
| E003-T14 | Accessibility audit & fixes | 4 | Medium | 4h | [x] |
| E003-T15 | CDN bundle & npm package publishing | 4 | Medium | 4h | [x] |
| E003-T16 | E2E tests with Playwright | 4 | High | 8h | [x] |
| E003-T17 | Documentation & examples | 5 | Medium | 6h | [x] |
| E003-T18 | Extension-side integration (E002 update) | 5 | Medium | 4h | [x] |
| E003-T19 | Standardized cookie practice descriptions | 2 | Medium | 5h | [x] |
| E003-T20 | Downloadable badge kit & icon publishing | 4 | Low | 3h | [x] |
| E003-T21 | Cookie practice descriptions i18n (DE/FR/ES/PL) | 4 | Medium | 6h | [x] |
| E003-T22 | Visual preview / configurator tool | 5 | High | 12h | [x] |

**Total estimate**: ~114h across 22 tasks in 5 waves.

---

## Wave 1: Foundation (T01-T04) — No Dependencies

All four tasks are independent and can run in parallel.

### E003-T01: Project Scaffolding & Build Setup
**Complexity**: Medium | **Estimate**: 4h

- [ ] Initialize `@nocookie/cmp` package with `pnpm init`
- [ ] Configure Vite in library mode (UMD + ESM outputs)
- [ ] Set up TypeScript (strict mode, path aliases)
- [ ] Configure ESLint, Prettier, Vitest
- [ ] Set up Husky pre-commit hooks (lint, format, test coverage 80%)
- [ ] Create `.nvmrc` with Node LTS version
- [ ] Create `tsconfig.json`, `vite.config.ts`
- [ ] Configure PostCSS with autoprefixer
- [ ] Set up Shadow DOM entry point structure
- [ ] Create `.gitattributes` with LF line endings
- [ ] Verify `pnpm build` produces `dist/` with UMD, ESM, and CSS outputs

**Output**: Build system that produces `nocookie-cmp.min.js`, `.esm.js`, and `.css`.

### E003-T02: Core Types & Config Schema
**Complexity**: Medium | **Estimate**: 3h

- [ ] Define all TypeScript interfaces (`CMPConfig`, `CategoryConfig`, `CookieDeclaration`, `ThemeConfig`, `BehaviorConfig`, etc.)
- [ ] Implement config parser with validation and defaults
- [ ] Create JSON Schema for config validation (`config-schema.json`)
- [ ] Implement minimal config expansion (string array to full category objects)
- [ ] Write default values for all optional fields
- [ ] Define standard category metadata (names, descriptions, icons)
- [ ] Unit tests for config parsing, validation, default merging

**Output**: `types.ts`, `constants.ts`, `config.ts` with full test coverage.

### E003-T03: Consent State Engine
**Complexity**: Medium | **Estimate**: 4h

- [ ] Implement consent cookie read/write (`ca_consent=e:1|f:0|...`)
- [ ] Implement `ConsentState` class with getters/setters per category
- [ ] Handle consent expiry (check timestamp against `behavior.consentExpiry`)
- [ ] Implement `getConsent()`, `setConsent()`, `acceptAll()`, `rejectAll()`, `reset()`
- [ ] Handle first-visit detection (no consent cookie exists)
- [ ] Implement `cookieDomain` auto-detection
- [ ] Respect `SameSite` and `Secure` cookie attributes from config
- [ ] Unit tests for all state transitions, cookie parsing, expiry logic

**Output**: `consent-state.ts` with full test coverage.

### E003-T04: Event Bus System
**Complexity**: Low | **Estimate**: 2h

- [ ] Implement typed event bus (`on`, `off`, `emit`)
- [ ] Define all event types (`consent:granted`, `consent:denied`, `consent:updated`, etc.)
- [ ] Connect event bus to consent state (auto-emit on state changes)
- [ ] Support wildcard listeners (`*` for all events)
- [ ] Unit tests for subscribe, unsubscribe, emit, wildcard

**Output**: `event-bus.ts` with full test coverage.

---

## Wave 2: UI Components & Descriptions (T05-T08, T19) — Depends on Wave 1

T05 is independent within this wave. T06, T07, T08, T19 each depend on T05 for theme/CSS infrastructure (T19 also depends on T02 for types). T06, T07, T08, T19 are otherwise independent and can run in parallel once T05 is done.

### E003-T05: Theme Engine & CSS Variables
**Complexity**: Medium | **Estimate**: 4h

- [ ] Implement theme engine that maps `ThemeConfig` to CSS custom properties
- [ ] Create base CSS with all `--ca-*` variables
- [ ] Implement light/dark/auto theme switching (prefers-color-scheme)
- [ ] Create position system (bottom-left, bottom-right, bottom-center, top-center)
- [ ] Implement Shadow DOM host with style injection
- [ ] Create animation keyframes (slide-up, fade-in, fade-out)
- [ ] Verify no CSS leakage in/out of Shadow DOM
- [ ] Unit tests for theme merging; visual tests for each position/mode

**Output**: `theme.ts`, `base.css`, `theme-light.css`, `theme-dark.css`, `animations.css`.

### E003-T06: Banner UI (First Layer)
**Complexity**: Medium | **Estimate**: 6h

- [ ] Implement banner DOM generation inside Shadow DOM
- [ ] Wire up Accept All / Reject All / Customize buttons to consent state
- [ ] Display category icons in banner (from config)
- [ ] Implement entrance/exit animations
- [ ] Implement "Learn more" link to policy URL
- [ ] Handle banner visibility logic (show on first visit, hide after consent)
- [ ] Implement configurable banner text via translations
- [ ] ARIA roles: `role="dialog"`, `aria-label`, focus management
- [ ] Keyboard navigation: Tab through buttons, Enter/Space to activate
- [ ] Responsive layout (stack buttons vertically on mobile)
- [ ] Unit tests for DOM generation; E2E tests for user flows

**Output**: `banner.ts` with accessible, responsive banner component.

### E003-T07: Preference Center UI (Second Layer)
**Complexity**: High | **Estimate**: 8h

- [ ] Implement modal overlay with preference center
- [ ] Generate category sections from config (icon, name, description, toggle)
- [ ] Implement collapsible cookie detail tables per category
- [ ] Essential category shows "Always Active" instead of toggle
- [ ] Wire toggles to consent state
- [ ] Implement Save Preferences button (saves current toggle state)
- [ ] Implement Accept All / Reject All within preference center
- [ ] Focus trap inside modal (Tab cycles within modal only)
- [ ] Escape key closes modal
- [ ] Close button in header
- [ ] Scroll behavior for many categories (max-height with overflow)
- [ ] Responsive: full-screen on mobile, centered modal on desktop
- [ ] Transition from banner to preference center (banner hides, modal opens)
- [ ] Unit tests for toggle logic; E2E tests for complete preference flow

**Output**: `preference-center.ts` with full interactive modal.

### E003-T08: Cookie Policy Icon System
**Complexity**: Medium | **Estimate**: 6h

- [ ] Design and create SVG icons for 5 categories (lock, gear, chart, megaphone, share)
- [ ] Create privacy level badges (4 levels: "Privacy Maximum", "Balanced", "Allow Analytics", "Accept All")
- [ ] Create compliance badges ("GDPR Compliant", "GPC Supported", "TCF Compatible", "Cookie Consent Standard")
- [ ] Implement icon renderer supporting sizes: xs(16), sm(20), md(24), lg(32), xl(48), xxl(64)
- [ ] Implement pill-shaped badge renderer (icon + text, color-coded)
- [ ] Dark mode variants for all icons and badges
- [ ] SVG sprite sheet for efficient loading
- [ ] Accessibility: `aria-label` on every icon, never color-only
- [ ] Export icons for use in banner, preference center, policy page
- [ ] Ensure all icons work at 16px (inline text) and 64px (policy page hero)
- [ ] Color coding consistent with design system (indigo/emerald palette)
- [ ] Unit tests for icon generation; visual snapshot tests

**Output**: `icons.ts`, `icons.css`, SVG assets, badge renderer.

### E003-T19: Standardized Cookie Practice Descriptions
**Complexity**: Medium | **Estimate**: 5h

- [ ] Create taxonomy of standardized descriptions for each cookie category (3 variants per category: default, alt 1, alt 2)
- [ ] Create per-cookie description database for common third-party cookies (_ga, _gid, _fbp, _gcl_au, fr, IDE, etc.)
- [ ] Define standard one-liner versions for banner display (short) vs full versions for preference center and policy page (long)
- [ ] Implement description selector: website owner picks from predefined OR writes custom
- [ ] Integrate descriptions into config schema (CategoryConfig gains `descriptionPreset` field)
- [ ] Wire descriptions into banner text, preference center, and policy page
- [ ] Unit tests for description lookup, fallback to default, custom override

**Output**: `descriptions.ts` with standardized cookie practice description taxonomy, integrated into config pipeline.

---

## Wave 3: Generators & Integration (T09-T12) — Depends on Wave 2

T09, T10, T11, T12 are all independent of each other. All four can run in parallel.

### E003-T09: Cookie Policy Page Generator
**Complexity**: High | **Estimate**: 8h

- [ ] Implement HTML generator from config (categories, cookies, legal text)
- [ ] List all categories with icons (category icon + name + description)
- [ ] Show each cookie: name, provider, purpose, duration, type (1st/3rd party)
- [ ] Include privacy level badge in header (computed from active categories)
- [ ] Include compliance badges
- [ ] Generate category sections with expandable cookie tables
- [ ] Include working toggle controls (connected to consent state)
- [ ] Include "Change my preferences" button that reopens the CMP preference center
- [ ] Include "How to change preferences" section
- [ ] Include "What are cookies" standard explanation
- [ ] Include "Your rights" section (GDPR text, configurable jurisdiction)
- [ ] Include contact section from config
- [ ] Include "Last updated" timestamp (auto-generated from config or build time)
- [ ] Include "Powered by" footer
- [ ] Implement injection mode (`<div id="ca-policy">`) for embedding in existing pages
- [ ] Implement standalone mode for linkable standalone HTML page
- [ ] Auto-update page content when config changes (re-render on config mutation)
- [ ] Responsive layout, print-friendly CSS
- [ ] Search/filter for sites with many cookies
- [ ] Unit tests for HTML generation; E2E tests for interactive elements

**Output**: `policy-page.ts` generating complete, embeddable/linkable cookie policy page.

### E003-T10: Well-Known JSON Generator
**Complexity**: Low | **Estimate**: 3h

- [ ] Generate `/.well-known/cookie-consent.json` from CMP config
- [ ] Include: version, categories, CMP name/version
- [ ] Include: selectors (banner, acceptAll, rejectAll, preferences, save)
- [ ] Include: API endpoints (`NoCookieCMP.acceptAll()`, etc.)
- [ ] Include: categorySelectors (toggle selectors per category)
- [ ] Include: GPC/TCF flags from behavior config
- [ ] Include: contact and policyUrl from config
- [ ] Expose via `getWellKnownJSON()` API method
- [ ] Provide build-time CLI command: `ca-cmp generate-well-known` for static sites
- [ ] Validate output against the well-known JSON schema from E002
- [ ] Unit tests for generation and schema validation

**Output**: `well-known.ts` and CLI command for static generation.

### E003-T11: Extension Bridge (Handshake Protocol)
**Complexity**: High | **Estimate**: 6h

- [ ] Implement `window.__cookiesAccepterCMP` global marker
- [ ] Set `data-ca-version` attribute on `#ca-cmp-root`
- [ ] Implement `message` event listener for `CA_EXTENSION_HELLO`
- [ ] Validate extension message version compatibility
- [ ] Apply extension preferences via `setConsent()` per category
- [ ] Cancel/hide banner if extension preferences arrive before render
- [ ] Close banner with animation if extension arrives after render
- [ ] Send `CA_EXTENSION_ACK` with applied consent state
- [ ] Handle preference conflicts (extension categories vs site categories)
- [ ] Emit `extension:detected` and `extension:applied` events
- [ ] Timeout handling: if no ACK within 2s, log warning
- [ ] Security: validate message origin, ignore malformed messages
- [ ] Integration tests simulating extension messages
- [ ] End-to-end test with actual extension (requires E003-T18)

**Output**: `extension-bridge.ts` implementing the full handshake.

### E003-T12: GPC Signal Detection & Response
**Complexity**: Low | **Estimate**: 2h

- [ ] Detect `navigator.globalPrivacyControl === true`
- [ ] Detect `Sec-GPC: 1` header (via server-side hint or `fetch` inspection)
- [ ] When GPC detected and `behavior.respectGPC` is true:
  - Auto-reject marketing and social-media categories
  - Show modified banner text: "We detected your Global Privacy Control preference"
  - Still show banner (GPC is a signal, not automatic consent/rejection)
- [ ] Emit event: `gpc:detected`
- [ ] Unit tests for GPC detection and response logic

**Output**: `gpc.ts` with detection and consent adjustment.

---

## Wave 4: Polish & Quality (T13-T16, T20-T21) — Depends on Wave 3

T13, T14, T15, T16, T20, T21 are all independent. All six can run in parallel. T20 depends on T08 (icons). T21 depends on T13 (i18n pipeline) and T19 (descriptions).

### E003-T13: Internationalization (i18n)
**Complexity**: Medium | **Estimate**: 6h

- [ ] Create translation system with fallback chain (config > detected language > en)
- [ ] Write translation files for 16 languages: en, de, fr, es, pl, nl, it, pt, sv, da, no, fi, cs, ro, hu, el
- [ ] Translate all UI strings: banner text, button labels, category names, category descriptions
- [ ] Translate legal text sections (cookie policy page)
- [ ] Auto-detect language from `<html lang>` or `navigator.language`
- [ ] Support custom translation overrides via config `translations`
- [ ] RTL support placeholder (for future Arabic/Hebrew)
- [ ] Unit tests for translation loading, fallback, override

**Output**: `i18n.ts`, 16 translation JSON files.

### E003-T14: Accessibility Audit & Fixes
**Complexity**: Medium | **Estimate**: 4h

- [ ] Run axe-core automated audit on banner, preference center, policy page
- [ ] Verify WCAG 2.1 AA compliance:
  - Color contrast ratios (4.5:1 text, 3:1 UI elements)
  - Keyboard navigation (all interactive elements reachable)
  - Screen reader announcements (ARIA live regions for state changes)
  - Focus management (focus trap in modal, return focus on close)
  - Reduced motion (respect `prefers-reduced-motion`)
- [ ] Test with NVDA/JAWS screen reader
- [ ] Test with keyboard-only navigation
- [ ] Fix any issues found
- [ ] Document accessibility features

**Output**: Accessibility-compliant CMP with audit report.

### E003-T15: CDN Bundle & npm Package Publishing
**Complexity**: Medium | **Estimate**: 4h

- [ ] Configure Vite to produce UMD bundle with global `NoCookieCMP`
- [ ] Configure ESM bundle for `import { NoCookieCMP } from '@nocookie/cmp'`
- [ ] Extract CSS into separate file
- [ ] Generate source maps
- [ ] Set up `package.json` fields: main, module, types, exports, files
- [ ] Create CDN hosting on Cloudflare R2 or Pages
- [ ] Set up versioned CDN URLs: `cdn.nocookie.zentala.io/cmp/v1/nocookie-cmp.min.js`
- [ ] Set up npm publishing pipeline (GitHub Actions)
- [ ] Set up SRI (Subresource Integrity) hashes for CDN scripts
- [ ] Create `CHANGELOG.md` for version tracking
- [ ] Test both installation methods (CDN script tag, npm import)

**Output**: Published npm package and CDN-hosted bundle.

### E003-T16: E2E Tests with Playwright
**Complexity**: High | **Estimate**: 8h

- [ ] Set up Playwright test infrastructure
- [ ] Create test page with the CMP installed (minimal config)
- [ ] Create test page with full config (all categories, all cookies)
- [ ] Test: banner appears on first visit
- [ ] Test: banner does not appear after consent given
- [ ] Test: Accept All sets all categories
- [ ] Test: Reject All sets only essential
- [ ] Test: Customize opens preference center
- [ ] Test: Per-category toggle saves correctly
- [ ] Test: Consent cookie is written correctly
- [ ] Test: Consent persists across page reload
- [ ] Test: Reset clears consent and shows banner again
- [ ] Test: GPC signal auto-rejects marketing
- [ ] Test: Extension bridge handshake (simulated messages)
- [ ] Test: Policy page renders all categories and cookies
- [ ] Test: Icons display for all categories
- [ ] Test: Dark mode applies correctly
- [ ] Test: Mobile responsive layout
- [ ] Test: Keyboard navigation through entire flow
- [ ] Test: Screen reader announcements
- [ ] Cross-browser: Chrome, Firefox, Safari (WebKit via Playwright)

**Output**: Comprehensive E2E test suite with 80%+ coverage.

### E003-T20: Downloadable Badge Kit & Icon Publishing
**Complexity**: Low | **Estimate**: 3h

- [ ] Package all category icons as standalone SVG files (individual + sprite sheet)
- [ ] Package all privacy level badges as standalone SVGs
- [ ] Package all compliance badges as standalone SVGs
- [ ] Create a CSS file with badge classes for direct HTML embedding
- [ ] Create downloadable ZIP archive with all icons, badges, and CSS
- [ ] Publish badge kit on nocookie.zentala.io as a downloadable resource
- [ ] Create usage guide: how to embed badges in site footer, README, documentation
- [ ] Ensure all SVGs are optimized (SVGO) and accessible (aria-labels, title elements)

**Output**: Downloadable badge kit ZIP + hosted badge assets on CDN.

### E003-T21: Cookie Practice Descriptions i18n (DE/FR/ES/PL)
**Complexity**: Medium | **Estimate**: 6h

- [ ] Translate all standard category descriptions (3 variants x 5 categories) into DE, FR, ES, PL
- [ ] Translate all per-cookie standard descriptions into DE, FR, ES, PL
- [ ] Translate one-liner banner versions into DE, FR, ES, PL
- [ ] Integrate description translations into the i18n pipeline from T13
- [ ] Fallback chain: config language > detected language > EN
- [ ] Unit tests for description i18n loading and fallback

**Output**: Multi-language description files for 5 languages (EN + DE/FR/ES/PL).

---

## Wave 5: Documentation, Integration & Configurator (T17-T18, T22) — Depends on Wave 4

T17, T18, and T22 are independent and can run in parallel. T22 depends on T08 (icons), T09 (policy page), T19 (descriptions), and T05 (theme) — all completed in earlier waves.

### E003-T17: Documentation & Examples
**Complexity**: Medium | **Estimate**: 6h

- [ ] Write README.md with quick start guide
- [ ] Write API reference documentation (all public methods, events, config options)
- [ ] Create example: minimal setup (CDN script tag, 3 lines)
- [ ] Create example: standard setup (npm, React app)
- [ ] Create example: full setup (all categories, custom theme, all options)
- [ ] Create example: cookie policy page integration
- [ ] Create migration guide from Cookiebot/OneTrust (what to put in config)
- [ ] Write "How it works" architecture overview
- [ ] Write "Extension integration" guide for advanced users
- [ ] Create demo page on nocookie.zentala.io showing the CMP in action
- [ ] TSDocs on all public interfaces and methods

**Output**: Complete documentation set and live demo.

### E003-T18: Extension-Side Integration (E002 Update)
**Complexity**: Medium | **Estimate**: 4h

- [ ] Add `nocookie` to extension's CMP detection rules (Layer 3: `#ca-cmp-root`)
- [ ] Implement `CA_EXTENSION_HELLO` message sending in `executor.ts`
- [ ] Implement `CA_EXTENSION_ACK` response handling
- [ ] Set consent method to `'extension-native'` in consent log
- [ ] Set confidence to `'high'` for native CMP detection
- [ ] Update popup to show "NoCookie CMP" as detected CMP name
- [ ] Add special icon/badge in popup for native CMP sites
- [ ] Integration test: extension + CMP on same test page
- [ ] Update extension's `well-known-reader.ts` to recognize our CMP in well-known file

**Output**: Extension detects and handles our CMP natively.

### E003-T22: Visual Preview / Configurator Tool
**Complexity**: High | **Estimate**: 12h

- [ ] Create web page at nocookie.zentala.io/configurator
- [ ] Implement Step 1: Basic Info form (site name, contact, policy URL, language)
- [ ] Implement Step 2: Cookie Categories configurator
  - [ ] Toggle categories on/off (essential always on)
  - [ ] Per-category: pick standard description preset or write custom
  - [ ] Per-category: add/edit/remove cookies (name, provider, duration, purpose, type)
  - [ ] Pre-built templates: "Minimal Blog", "Blog + Analytics", "Business Site", "E-commerce", "Full Stack"
- [ ] Implement Step 3: Theme configurator
  - [ ] Color pickers for primary, accept, reject colors
  - [ ] Position selector (bottom-left, bottom-right, bottom-center, top-center)
  - [ ] Light / dark / auto mode toggle
  - [ ] Border radius and font selectors
- [ ] Implement Step 4: Live Preview panel
  - [ ] Split-screen layout: config on left, preview on right
  - [ ] Preview toggles between banner, preference center, and policy page views
  - [ ] Real-time preview updates as config changes (uses actual CMP library for rendering)
  - [ ] Mobile / desktop preview toggle (viewport width simulation)
- [ ] Implement Step 5: Export panel
  - [ ] Download config JSON file
  - [ ] Copy CDN `<script>` tag to clipboard
  - [ ] Copy npm install + init code snippet
  - [ ] Download generated `cookie-consent.json` (well-known file)
  - [ ] Download badge kit (SVG icons + CSS)
  - [ ] "Validate my setup" button (checks config against JSON schema)
- [ ] Config state in URL hash for shareability (base64 encoded)
- [ ] Fully client-side (no server required, Blob URLs for downloads)
- [ ] Responsive layout for the configurator itself
- [ ] Unit tests for config generation; E2E tests for the full configurator flow

**Output**: Hosted configurator tool at nocookie.zentala.io/configurator — the primary conversion funnel for CMP adoption.

---

## Dependency Graph

```
Wave 1 (parallel, no deps):
  T01 ──┐
  T02 ──┤
  T03 ──┼── Wave 2
  T04 ──┘

Wave 2 (T05 first, then T06/T07/T08/T19 parallel):
  T05 ──┬── T06 ──┐
        ├── T07 ──┤
        ├── T08 ──┼── Wave 3
        └── T19 ──┘

Wave 3 (all parallel):
  T09 ──┐
  T10 ──┤
  T11 ──┼── Wave 4
  T12 ──┘

Wave 4 (all parallel):
  T13 ──┐
  T14 ──┤
  T15 ──┤
  T16 ──┼── Wave 5
  T20 ──┤
  T21 ──┘

Wave 5 (parallel):
  T17
  T18
  T22
```

## Critical Path

The longest sequential chain determines minimum calendar time:

```
T01 (4h) → T05 (4h) → T07 (8h) → T09 (8h) → T16 (8h) → T22 (12h)
= 44h sequential minimum on the critical path
```

With parallel execution within waves, the total calendar time is significantly less than the 114h sum. The configurator tool (T22) is now the longest Wave 5 task and extends the critical path by 6h compared to the original plan.

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Shadow DOM CSS encapsulation breaks in Safari | High | Test early in Wave 2; fallback to scoped CSS classes |
| Extension bridge timing race condition | High | Implement retry logic; banner shows briefly then auto-closes |
| Bundle size exceeds 30KB target | Medium | Tree-shake aggressively; lazy-load policy page, configurator, and i18n |
| Cookie format conflicts with existing site cookies | Medium | Use unique prefix `ca_`; configurable cookie name |
| Translation quality for 16 languages | Medium | Start with EN; community contributions for other languages |
| Configurator tool scope creep | Medium | Ship minimal configurator first (config + banner preview); add policy page preview and templates in v1.1 |
| Cookie description database maintenance | Low | Start with top 20 common cookies; community-driven expansion |
| Badge/icon adoption without standard adoption | Low | Badge kit is standalone and useful even without the extension; promotes brand awareness |
