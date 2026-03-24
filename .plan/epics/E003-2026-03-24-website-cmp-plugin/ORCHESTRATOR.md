---
id: E003
title: Cookies Accepter CMP — Task Breakdown & Execution Plan
status: planned
created: 2026-03-24
---

# E003 Orchestrator: Website CMP Plugin

## Task Summary

| ID | Task | Wave | Complexity | Estimate | Status |
|----|------|------|-----------|----------|--------|
| E003-T01 | Project scaffolding & build setup | 1 | Medium | 4h | [ ] |
| E003-T02 | Core types & config schema | 1 | Medium | 3h | [ ] |
| E003-T03 | Consent state engine | 1 | Medium | 4h | [ ] |
| E003-T04 | Event bus system | 1 | Low | 2h | [ ] |
| E003-T05 | Theme engine & CSS variables | 2 | Medium | 4h | [ ] |
| E003-T06 | Banner UI (first layer) | 2 | Medium | 6h | [ ] |
| E003-T07 | Preference center UI (second layer) | 2 | High | 8h | [ ] |
| E003-T08 | Cookie policy icon system | 2 | Medium | 6h | [ ] |
| E003-T09 | Cookie policy page generator | 3 | High | 8h | [ ] |
| E003-T10 | Well-known JSON generator | 3 | Low | 3h | [ ] |
| E003-T11 | Extension bridge (handshake protocol) | 3 | High | 6h | [ ] |
| E003-T12 | GPC signal detection & response | 3 | Low | 2h | [ ] |
| E003-T13 | Internationalization (i18n) | 4 | Medium | 6h | [ ] |
| E003-T14 | Accessibility audit & fixes | 4 | Medium | 4h | [ ] |
| E003-T15 | CDN bundle & npm package publishing | 4 | Medium | 4h | [ ] |
| E003-T16 | E2E tests with Playwright | 4 | High | 8h | [ ] |
| E003-T17 | Documentation & examples | 5 | Medium | 6h | [ ] |
| E003-T18 | Extension-side integration (E002 update) | 5 | Medium | 4h | [ ] |

**Total estimate**: ~88h across 18 tasks in 5 waves.

---

## Wave 1: Foundation (T01-T04) — No Dependencies

All four tasks are independent and can run in parallel.

### E003-T01: Project Scaffolding & Build Setup
**Complexity**: Medium | **Estimate**: 4h

- [ ] Initialize `@cookies-accepter/cmp` package with `pnpm init`
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

**Output**: Build system that produces `cookies-accepter-cmp.min.js`, `.esm.js`, and `.css`.

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

## Wave 2: UI Components (T05-T08) — Depends on Wave 1

T05 is independent within this wave. T06, T07, T08 each depend on T05 for theme/CSS infrastructure. T06, T07, T08 are otherwise independent and can run in parallel once T05 is done.

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
- [ ] Create privacy level badges (4 levels: maximum, friendly, balanced, full tracking)
- [ ] Create compliance badges (GDPR, GPC, Standard, Extension Ready)
- [ ] Implement icon renderer supporting sizes: xs(16), sm(20), md(24), lg(32), xl(48)
- [ ] Implement pill-shaped badge renderer (icon + text, color-coded)
- [ ] Dark mode variants for all icons and badges
- [ ] SVG sprite sheet for efficient loading
- [ ] Accessibility: `aria-label` on every icon, never color-only
- [ ] Export icons for use in banner, preference center, policy page
- [ ] Unit tests for icon generation; visual snapshot tests

**Output**: `icons.ts`, `icons.css`, SVG assets, badge renderer.

---

## Wave 3: Generators & Integration (T09-T12) — Depends on Wave 2

T09, T10, T11, T12 are all independent of each other. All four can run in parallel.

### E003-T09: Cookie Policy Page Generator
**Complexity**: High | **Estimate**: 8h

- [ ] Implement HTML generator from config (categories, cookies, legal text)
- [ ] Include privacy level badge in header (computed from active categories)
- [ ] Include compliance badges
- [ ] Generate category sections with expandable cookie tables
- [ ] Include working toggle controls (connected to consent state)
- [ ] Include "How to change preferences" section with button to open preference center
- [ ] Include "What are cookies" standard explanation
- [ ] Include "Your rights" section (GDPR text, configurable jurisdiction)
- [ ] Include contact section from config
- [ ] Include "Powered by" footer
- [ ] Implement injection mode (`<div id="ca-policy">`) and standalone mode
- [ ] Responsive layout, print-friendly CSS
- [ ] Search/filter for sites with many cookies
- [ ] Unit tests for HTML generation; E2E tests for interactive elements

**Output**: `policy-page.ts` generating complete cookie policy page.

### E003-T10: Well-Known JSON Generator
**Complexity**: Low | **Estimate**: 3h

- [ ] Generate `/.well-known/cookie-consent.json` from CMP config
- [ ] Include: version, categories, CMP name/version
- [ ] Include: selectors (banner, acceptAll, rejectAll, preferences, save)
- [ ] Include: API endpoints (`CookiesAccepterCMP.acceptAll()`, etc.)
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

## Wave 4: Polish & Quality (T13-T16) — Depends on Wave 3

T13, T14, T15, T16 are all independent. All four can run in parallel.

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

- [ ] Configure Vite to produce UMD bundle with global `CookiesAccepterCMP`
- [ ] Configure ESM bundle for `import { CookiesAccepterCMP } from '@cookies-accepter/cmp'`
- [ ] Extract CSS into separate file
- [ ] Generate source maps
- [ ] Set up `package.json` fields: main, module, types, exports, files
- [ ] Create CDN hosting on Cloudflare R2 or Pages
- [ ] Set up versioned CDN URLs: `cdn.cookies-accepter.org/cmp/v1/cookies-accepter-cmp.min.js`
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

---

## Wave 5: Documentation & Extension Integration (T17-T18) — Depends on Wave 4

T17 and T18 are independent and can run in parallel.

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
- [ ] Create demo page on cookies-accepter.org showing the CMP in action
- [ ] TSDocs on all public interfaces and methods

**Output**: Complete documentation set and live demo.

### E003-T18: Extension-Side Integration (E002 Update)
**Complexity**: Medium | **Estimate**: 4h

- [ ] Add `cookies-accepter` to extension's CMP detection rules (Layer 3: `#ca-cmp-root`)
- [ ] Implement `CA_EXTENSION_HELLO` message sending in `executor.ts`
- [ ] Implement `CA_EXTENSION_ACK` response handling
- [ ] Set consent method to `'extension-native'` in consent log
- [ ] Set confidence to `'high'` for native CMP detection
- [ ] Update popup to show "Cookies Accepter CMP" as detected CMP name
- [ ] Add special icon/badge in popup for native CMP sites
- [ ] Integration test: extension + CMP on same test page
- [ ] Update extension's `well-known-reader.ts` to recognize our CMP in well-known file

**Output**: Extension detects and handles our CMP natively.

---

## Dependency Graph

```
Wave 1 (parallel, no deps):
  T01 ──┐
  T02 ──┤
  T03 ──┼── Wave 2
  T04 ──┘

Wave 2 (T05 first, then T06/T07/T08 parallel):
  T05 ──┬── T06 ──┐
        ├── T07 ──┼── Wave 3
        └── T08 ──┘

Wave 3 (all parallel):
  T09 ──┐
  T10 ──┤
  T11 ──┼── Wave 4
  T12 ──┘

Wave 4 (all parallel):
  T13 ──┐
  T14 ──┤
  T15 ──┼── Wave 5
  T16 ──┘

Wave 5 (parallel):
  T17
  T18
```

## Critical Path

The longest sequential chain determines minimum calendar time:

```
T01 (4h) → T05 (4h) → T07 (8h) → T09 (8h) → T16 (8h) → T17 (6h)
= 38h sequential minimum on the critical path
```

With parallel execution within waves, the total calendar time is significantly less than the 88h sum.

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Shadow DOM CSS encapsulation breaks in Safari | High | Test early in Wave 2; fallback to scoped CSS classes |
| Extension bridge timing race condition | High | Implement retry logic; banner shows briefly then auto-closes |
| Bundle size exceeds 30KB target | Medium | Tree-shake aggressively; lazy-load policy page and i18n |
| Cookie format conflicts with existing site cookies | Medium | Use unique prefix `ca_`; configurable cookie name |
| Translation quality for 16 languages | Medium | Start with EN; community contributions for other languages |
