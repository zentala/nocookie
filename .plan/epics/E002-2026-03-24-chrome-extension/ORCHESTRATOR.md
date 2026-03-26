---
id: E002
title: Chrome Extension + Open Standard + Website — Execution Plan
status: planned
created: 2026-03-24
updated: 2026-03-26
waves: 7
---

# E002: Orchestrator — Wave-Organized Task Breakdown

## Overview

7 waves, 31 tasks. Each wave builds on the previous.
Complexity: S = half day, M = 1-2 days, L = 2-4 days.

**2026-03-26 update**: Added 7 new tasks (T25-T31) based on CEO review, design review,
project review, and standards implementation recommendations. Key additions: autoconsent
integration, GPC header emission, first-run onboarding, consent dashboard, online
validator/generator, accessibility audit, and loading/detecting popup state.

---

## Wave 1: Core Infrastructure

Foundation: manifest, build system, shared types, storage layer, message passing.
No CMP logic yet -- just the skeleton that everything plugs into.

- [ ] **E002-T01** — Project scaffolding and build system
  - **Description**: Initialize the extension project with TypeScript, bundler (Vite or Rollup with Chrome extension plugin), manifest.json (V3), directory structure per PLAN.md, ESLint, Prettier, Vitest for unit tests, and `.nvmrc`.
  - **Dependencies**: None
  - **Complexity**: M
  - **Output**: `pnpm dev` builds the extension, `pnpm test` runs tests, extension loads in Chrome (does nothing yet)

- [ ] **E002-T02** — Shared types, constants, and category taxonomy
  - **Description**: Define TypeScript interfaces: `UserPreferences`, `CMPRule`, `ConsentResult`, `StorageSchema`, `MessageTypes`, category enum, profile presets. These are the contracts everything else codes against.
  - **Dependencies**: E002-T01
  - **Complexity**: S
  - **Output**: `src/shared/` module with all types, exported and importable

- [ ] **E002-T03** — Chrome storage wrapper and preference management
  - **Description**: Implement typed wrapper around `chrome.storage.sync` and `chrome.storage.local`. CRUD for user preferences, domain overrides, consent log, statistics, well-known cache. Include migration logic for storage schema changes across extension updates.
  - **Dependencies**: E002-T02
  - **Complexity**: M
  - **Output**: `src/shared/storage.ts` with full test coverage

- [ ] **E002-T04** — Background service worker skeleton + message passing
  - **Description**: Implement the background service worker with message listener. Define message protocol (content -> background -> content). Handle: `CMP_DETECTED`, `CONSENT_EXECUTED`, `GET_PREFERENCES`, `UPDATE_BADGE`. Inject executor script on demand via `chrome.scripting.executeScript`.
  - **Dependencies**: E002-T02, E002-T03
  - **Complexity**: M
  - **Output**: Service worker that receives messages and dispatches responses

- [ ] **E002-T05** — Content script skeleton (detector + observer)
  - **Description**: Implement the ISOLATED world content scripts. `observer.ts`: MutationObserver watching for CMP elements on `body` direct children. `detector.ts`: placeholder detection (just DOM selector scan, no CMP-specific logic yet). Sends `CMP_DETECTED` to background. Handles SPA navigation via `popstate`/`hashchange` listeners.
  - **Dependencies**: E002-T02, E002-T04
  - **Complexity**: M
  - **Output**: Content script that detects DOM elements and communicates with background

---

## Wave 2: CMP Detection + Consent Execution

Core functionality: detect real CMPs and execute consent. Start with top 3.
Wave 2 tasks are largely parallel (one task per CMP).

**Updated**: T25 (autoconsent integration) is the foundational task for this wave.
It provides 100+ CMP coverage immediately. T08-T10 verify and customize the top 3 CMPs
on top of autoconsent rather than writing rules entirely from scratch.

- [ ] **E002-T06** — CMP rule format and rule engine
  - **Description**: Implement the rule engine that loads CMP rules (JSON), matches detection signals to rules, and selects the appropriate execution strategy. Define the rule JSON schema. Implement rule loading from `src/rules/builtin/`. Also manages the autoconsent adapter (T25) as a rule source with lower priority than native rules.
  - **Dependencies**: E002-T02, E002-T04
  - **Complexity**: M
  - **Output**: `src/background/rule-engine.ts` that accepts detection signals and returns a matched rule

- [ ] **E002-T07** — MAIN world executor framework
  - **Description**: Implement `executor.ts` that runs in MAIN world. Receives: CMP identity, user preferences, execution strategy. Supports: API calls (eval), click simulation (querySelector + click), toggle setting. Reports result via `window.postMessage`. ISOLATED content script relays result to background.
  - **Dependencies**: E002-T04, E002-T06
  - **Complexity**: M
  - **Output**: Executor that can run arbitrary consent strategies in page context

- [ ] **E002-T25** — Autoconsent library integration
  - **Description**: Integrate `@duckduckgo/autoconsent` as the primary CMP interaction engine. Build an `AutoconsentAdapter` that wraps autoconsent and translates between its action model and our preference-based model. Map our 5-category `UserPreferences` to autoconsent's opt-in/opt-out actions. Handle cases where autoconsent only supports binary consent (log as "partial"). Our native rules (T08-T10) take priority when both exist. Include unit tests for the adapter layer and preference mapping.
  - **Dependencies**: E002-T06, E002-T07
  - **Complexity**: L
  - **Output**: `src/background/autoconsent-adapter.ts` with full test coverage, 100+ CMPs handled via autoconsent

- [ ] **E002-T08** — OneTrust verification + custom per-category mapping
  - **Description**: Verify autoconsent handles OneTrust correctly. Write custom per-category preference mapping (C0001-C0005) to enable granular consent beyond autoconsent's binary reject. Write E2E test with a mock OneTrust page. If autoconsent's OneTrust handling is insufficient, write a native rule as override.
  - **Dependencies**: E002-T25
  - **Complexity**: M
  - **Output**: OneTrust per-category consent working, Playwright test passing

- [ ] **E002-T09** — Cookiebot verification + custom per-category mapping
  - **Description**: Verify autoconsent handles Cookiebot correctly. Write custom per-category preference mapping (necessary/preferences/statistics/marketing) for granular consent. Write E2E test. If autoconsent's Cookiebot handling is insufficient, write a native rule as override.
  - **Dependencies**: E002-T25
  - **Complexity**: M
  - **Output**: Cookiebot per-category consent working, Playwright test passing

- [ ] **E002-T10** — Didomi verification + custom per-category mapping
  - **Description**: Verify autoconsent handles Didomi correctly. Write custom per-category preference mapping. Must handle `didomiOnReady` callback pattern. Write E2E test. If autoconsent's Didomi handling is insufficient, write a native rule as override.
  - **Dependencies**: E002-T25
  - **Complexity**: M
  - **Output**: Didomi per-category consent working, Playwright test passing

- [ ] **E002-T26** — GPC header emission
  - **Description**: Implement Global Privacy Control signal emission. When user's profile rejects marketing cookies, use `chrome.declarativeNetRequest` to add `Sec-GPC: 1` header to all outgoing requests. Also inject `navigator.globalPrivacyControl = true` via content script in MAIN world. Add `declarativeNetRequest` permission to manifest. Add GPC toggle to Advanced settings (on by default when marketing is rejected). Include unit tests for GPC rule creation and toggle logic.
  - **Dependencies**: E002-T04, E002-T03
  - **Complexity**: S
  - **Output**: GPC header emitted on all requests when marketing cookies are rejected, toggle in settings

- [ ] **E002-T11** — Generic heuristic fallback detector
  - **Description**: Implement fallback for unknown CMPs. Scan page for: fixed/sticky overlays with cookie-related text, buttons with "Accept"/"Reject"/"Agree" text (multi-language: EN, DE, FR, ES, PL, NL, IT). Score candidates by confidence. Attempt to click most appropriate button based on user preference. Log as "heuristic" method.
  - **Dependencies**: E002-T05, E002-T07
  - **Complexity**: L
  - **Output**: Heuristic detector that handles basic consent popups on unknown CMPs

- [ ] **E002-T12** — Well-known standard reader
  - **Description**: Implement `well-known-reader.ts` in content script. Fetch `/.well-known/cookie-consent.json` for the current domain. Validate against schema. Cache in `chrome.storage.local` (24h TTL). If valid: bypass detection, use declared CMP info and selectors directly. Handle CORS, 404, invalid JSON gracefully.
  - **Dependencies**: E002-T06, E002-T07
  - **Complexity**: M
  - **Output**: Well-known reader that provides perfect detection when the file exists

---

## Wave 3: Extension UI

User-facing interfaces. Can be developed in parallel (popup + options + onboarding are independent).

**Updated**: Added T27 (onboarding), T31 (loading state). T13 now includes 6 states (added scanning).

- [ ] **E002-T13** — Popup UI
  - **Description**: Implement the extension popup per PLAN.md section 3.1. Show: current page domain, consent status (handled/none/error), categories accepted/rejected, CMP name, method used. Quick actions: profile dropdown, "override for this site" link. **Six** visual states (handled/none/attention/error/disabled/scanning). Accessible: keyboard nav, ARIA labels, no color-only indicators (use shape/icon per state: checkmark, dash, exclamation, X, gray dash, spinner). All toggles must have `role="switch"` and `aria-checked`.
  - **Dependencies**: E002-T03, E002-T04
  - **Complexity**: L
  - **Output**: Popup that reflects real consent state for the active tab, including scanning state

- [ ] **E002-T31** — Loading/detecting state in popup
  - **Description**: Implement the "Scanning..." state shown between page load and CMP detection completion. Background service worker tracks detection state per tab (idle/scanning/done). When content script starts scanning, it sends `SCAN_STARTED` message; background sets tab state to "scanning". When detection completes (CMP found or timeout), state transitions to the appropriate final state. Popup reads tab state and renders spinner + "Detecting cookie popup..." text. Configurable timeout (default 5s) after which state transitions to "No popup detected". Include: smooth transition animations, badge pulse during scanning.
  - **Dependencies**: E002-T04, E002-T13
  - **Complexity**: S
  - **Output**: Popup shows animated scanning state during CMP detection, transitions smoothly to final state

- [ ] **E002-T27** — First-run onboarding flow
  - **Description**: Implement the post-install onboarding experience per PLAN.md section 3.4. Four steps: Welcome -> Choose profile (3 visual cards: Privacy Maximum, Balanced, Accept All) -> Optional: customize categories -> Done with confirmation. Opens as a new tab via `chrome.runtime.onInstalled` listener. Profile selection saves to `chrome.storage.sync` immediately. Flag `onboardingCompleted` prevents re-showing. If closed without completing, defaults to "Privacy Maximum" (privacy-protective). Page: `src/onboarding/onboarding.html`. Accessible: full keyboard navigation, ARIA landmarks, screen reader friendly. Beautiful and confidence-inspiring (first impression).
  - **Dependencies**: E002-T03
  - **Complexity**: M
  - **Output**: Post-install onboarding that guides user to choose a privacy profile

- [ ] **E002-T14** — Options page: Preferences + Profiles
  - **Description**: Implement options page Tab 1 (Preferences). Category toggles with info expandos. Preset profile selector (Privacy Maximum, Balanced, Allow Analytics, Accept All, Custom). Changing a toggle auto-switches to Custom. Persists to `chrome.storage.sync`. Accessible: `role="switch"`, `aria-checked`, `aria-expanded` on expandos, keyboard nav.
  - **Dependencies**: E002-T03
  - **Complexity**: M
  - **Output**: Working preferences page that saves to storage

- [ ] **E002-T15** — Options page: Site Overrides + Advanced + Statistics
  - **Description**: Implement options page Tabs 2-4. Site overrides: add/edit/delete domain rules, modal for custom per-domain prefs. Advanced: auto-consent toggle, delay slider, heuristic toggle, notification toggle, logging toggle, well-known toggle, GPC toggle. Statistics: read from storage, render aggregate data with counts and percentages. About tab with links.
  - **Dependencies**: E002-T03, E002-T14
  - **Complexity**: L
  - **Output**: Complete options page with all tabs functional

- [ ] **E002-T16** — Badge/icon state management
  - **Description**: Create icon assets in **5** states x 4 sizes (16/32/48/128): default, handled, attention, error, scanning. Implement badge update logic in background service worker: set icon variant + badge text based on consent result. Clear badge on tab navigation. Handle tab switching (show correct state per tab). Add subtle pulse animation during scanning state.
  - **Dependencies**: E002-T04
  - **Complexity**: S
  - **Output**: Icon changes based on consent status per tab, including animated scanning state

---

## Wave 4: Open Standard + Remaining CMPs

Standard specification finalized. Expand CMP coverage.

**Updated**: T18/T19 now verify autoconsent coverage + write integration tests rather than
writing rules from scratch. Added T28 (consent dashboard).

- [ ] **E002-T17** — Open standard JSON schema and validator library
  - **Description**: Formalize the `cookie-consent.json` JSON Schema (per PLAN.md section 4.2). Write a TypeScript validator library that validates a JSON object against the schema, returning typed errors. This library is used by both the extension (T12) and the website validator (T21/T29). Publish schema at a stable URL.
  - **Dependencies**: E002-T12
  - **Complexity**: M
  - **Output**: `packages/schema/` with JSON schema + TS validator, full test coverage

- [ ] **E002-T18** — Additional CMP verification: Quantcast, TrustArc, CookieYes
  - **Description**: Verify autoconsent handles these 3 CMPs correctly. Write per-category preference mappings where possible. Quantcast: TCF-primary, may be limited to binary via autoconsent. TrustArc: iframe challenge, verify autoconsent handles it. CookieYes: verify `performBannerAction()` works via autoconsent. Write integration tests for each. Write native rule overrides only where autoconsent is insufficient.
  - **Dependencies**: E002-T25
  - **Complexity**: M
  - **Output**: 3 more CMPs verified with tests, total verified coverage: 6 CMPs (+ 100+ via autoconsent)

- [ ] **E002-T19** — Additional CMP verification: Complianz, Osano, consentmanager
  - **Description**: Verify autoconsent handles these 3 CMPs correctly. Write per-category preference mappings where possible. Complianz: WordPress-specific, event-driven. Osano: `cookieconsent.initialise()`. consentmanager: TCF-based. Write integration tests for each. Write native rule overrides only where autoconsent is insufficient.
  - **Dependencies**: E002-T25
  - **Complexity**: M
  - **Output**: 3 more CMPs verified with tests, total verified coverage: 9 CMPs (+ 100+ via autoconsent)

- [ ] **E002-T28** — Consent dashboard page
  - **Description**: Implement the consent dashboard per PLAN.md section 3.5. New `dashboard.html` page accessible from popup ("View consent history") and options page. Shows all sites where consent was handled, sorted by visit frequency (using `chrome.history` API, permission requested lazily). For each site: CMP detected, categories accepted/rejected, method, confidence, last handled date. Features: search by domain, filter by CMP/method/confidence/category, per-site preference override, re-consent action, export as JSON/CSV. Paginated list. Accessible: keyboard nav, ARIA, semantic HTML.
  - **Dependencies**: E002-T03, E002-T15
  - **Complexity**: L
  - **Output**: Consent dashboard with search, filter, export, and per-site actions

---

## Wave 5: Website

Static site for documentation, standard spec, and extension download page.

**Updated**: T21 now includes the validator/generator tool (T29 handles the generator
functionality specifically). Added T29 (validator/generator) and T30 (accessibility audit).

- [ ] **E002-T20** — Website scaffolding (Astro + Cloudflare Pages)
  - **Description**: Initialize Astro project with Tailwind CSS. Set up Cloudflare Pages deployment. Create layout component, navigation, footer. Landing page with hero, problem statement, solution overview, extension install CTA, standard intro. Mobile responsive (hamburger menu for nav). Privacy-respecting analytics (Plausible).
  - **Dependencies**: None (parallel with other waves)
  - **Complexity**: M
  - **Output**: Deployed landing page at chosen domain

- [ ] **E002-T21** — Standard specification page
  - **Description**: Write the v1 spec page (full specification from PLAN.md section 4). Include downloadable JSON schema. Example files for each supported CMP. Include `categorySelectors` in the field reference table and examples. Add security considerations section (api field must not be executed from untrusted sources). Sidebar navigation with mobile fallback (hamburger or bottom-sheet TOC).
  - **Dependencies**: E002-T17, E002-T20
  - **Complexity**: M
  - **Output**: `/standard/v1` spec page with downloadable schema and CMP examples

- [ ] **E002-T29** — Online validator/generator tool
  - **Description**: Build the validator/generator tool per PLAN.md section 6.4 at `/validator`. **Validator mode**: user enters URL, tool fetches `/.well-known/cookie-consent.json`, validates against schema (using `packages/schema/` library from T17), shows field-by-field results with warnings and suggestions. **Generator mode**: user selects CMP from dropdown, form pre-fills known selectors/API patterns, user fills remaining fields, live JSON preview updates in real-time, "Copy to clipboard" and "Download" buttons, deployment instructions. Runs entirely client-side. Accessible.
  - **Dependencies**: E002-T17, E002-T20
  - **Complexity**: L
  - **Output**: `/validator` page with both validator and generator modes working

- [ ] **E002-T22** — Implementation guides + AI agent instructions
  - **Description**: Write implementation guides: general quick-start, OneTrust-specific, Cookiebot-specific, WordPress guide. Write `cookie-consent-instructions.md` template for AI agents. Write the `/guide/ai` page explaining how AI agents can auto-implement the standard. All content in English.
  - **Dependencies**: E002-T20
  - **Complexity**: M
  - **Output**: 5+ guide pages published on the website

---

## Wave 6: Accessibility + Polish

Accessibility audit across all surfaces, comprehensive testing, final quality pass.

**New wave**: Split from old Wave 6 to give accessibility its own task and ensure
it covers all UI surfaces built in previous waves.

- [ ] **E002-T30** — Accessibility audit and fixes
  - **Description**: Cross-cutting accessibility pass across ALL extension UI surfaces (popup, options, onboarding, dashboard) and website pages. Audit checklist: (1) All toggles have `role="switch"`, `aria-checked`, visible focus indicators. (2) Status indicators use shape/icon differentiation, not color-only. (3) All icon-only buttons have `aria-label`. (4) All expandable sections have `aria-expanded` and `aria-controls`. (5) Keyboard navigation works throughout (Tab, Enter/Space, Escape to close modals). (6) Color contrast meets WCAG AA (4.5:1 normal text, 3:1 large text). (7) Screen reader testing with NVDA. Fix all P1 issues from design review. Document remaining P2/P3 issues.
  - **Dependencies**: E002-T13, E002-T14, E002-T15, E002-T27, E002-T28
  - **Complexity**: M
  - **Output**: All UI surfaces pass WCAG AA audit, screen reader compatible

- [ ] **E002-T23** — Comprehensive E2E test suite
  - **Description**: Playwright test suite covering: autoconsent integration with 3+ CMPs, native rule overrides for OneTrust/Cookiebot/Didomi, popup UI interactions (all 6 states), options page interactions, profile switching, domain overrides, badge state changes, well-known file reading, heuristic fallback, onboarding flow, consent dashboard, GPC header emission. Run in CI. Target: 80%+ overall coverage.
  - **Dependencies**: All previous tasks
  - **Complexity**: L
  - **Output**: Full Playwright test suite passing in CI

---

## Wave 7: Publishing

Chrome Web Store submission and launch preparation.

- [ ] **E002-T24** — Chrome Web Store preparation and publishing
  - **Description**: Create store listing: screenshots (popup states, options, onboarding, dashboard, badge states), description, privacy policy (no data collection beyond local storage). Create promotional images (440x280, 920x680, 1400x560). Set up developer account. Submit for review. Also: add precommit hook (Husky) with lint + format + test coverage check.
  - **Dependencies**: E002-T23
  - **Complexity**: M
  - **Output**: Extension published on Chrome Web Store (or submitted for review)

---

## Dependency Graph

```
Wave 1:  T01 -> T02 -> T03 -> T04 -> T05
                  |       |      |
                  v       v      v
Wave 2:         T06 <----+    T07     T26 (GPC, parallel)
                  |             |
                  v             v
                T25 (autoconsent)
                  |
           +-----+-----+
           |     |      |
           v     v      v
          T08   T09   T10         T11 (heuristic, parallel)
           |     |      |          |
           +-----+------+----------+--- T12 (well-known, parallel)
                 |
Wave 3:          +---> T13 -> T31 (loading state)
                 |     T14 -> T15
                 |     T27 (onboarding, parallel with T13-T14)
                 |     T16 (badges, parallel)
                 |
Wave 4:          +---> T17
                 |     T18, T19 (CMP verification, parallel)
                 |     T28 (dashboard)
                 |
Wave 5:  T20 (independent) ---> T21, T29 (validator/generator), T22
                 |
Wave 6:          +---> T30 (accessibility audit)
                       T23 (E2E tests)
                 |
Wave 7:          +---> T24 (publish)
```

## Parallel Opportunities

- **Wave 2**: T25 is the key dependency; T08, T09, T10 can run in parallel after T25
- **Wave 2**: T26 (GPC) can run in parallel with T06/T07/T25 (only needs T04 + T03)
- **Wave 2**: T11, T12 can run in parallel with T08-T10
- **Wave 3**: T13, T14, T27 can all run in parallel (independent UI surfaces)
- **Wave 3**: T16 can run in parallel with T13-T15
- **Wave 3**: T31 depends on T13 but is small (S)
- **Wave 4**: T18 and T19 can run in parallel
- **Wave 4**: T28 can run in parallel with T17-T19
- **Wave 5**: T20 can start during Wave 3 or 4 (no extension dependency)
- **Wave 5**: T21, T29, and T22 can run in parallel after T20 (T21 and T29 both need T17)
- **Wave 6**: T30 and T23 can partially overlap (T30 on completed surfaces while T23 covers already-tested areas)

## New Tasks Summary (T25-T31)

| Task | Name | Wave | Complexity | Source |
|------|------|------|-----------|--------|
| T25 | Autoconsent library integration | 2 | L | CEO review, project review, standards recommendations |
| T26 | GPC header emission | 2 | S | Standards recommendations, CEO review |
| T27 | First-run onboarding flow | 3 | M | CEO review, design review, legal analysis |
| T28 | Consent dashboard page | 4 | L | Design review, standards recommendations |
| T29 | Online validator/generator tool | 5 | L | Design review, CEO review |
| T30 | Accessibility audit and fixes | 6 | M | Design review (P1 items) |
| T31 | Loading/detecting state in popup | 3 | S | Design review (P1 item) |

## Estimated Timeline

| Wave | Tasks | Parallel Tracks | Est. Duration |
|------|-------|-----------------|---------------|
| 1 | T01-T05 | 1-2 | 5-7 days |
| 2 | T06-T12, T25-T26 | 3-4 | 6-8 days |
| 3 | T13-T16, T27, T31 | 3-4 | 5-7 days |
| 4 | T17-T19, T28 | 2-3 | 5-7 days |
| 5 | T20-T22, T29 | 3 | 5-7 days |
| 6 | T23, T30 | 2 | 4-6 days |
| 7 | T24 | 1 | 2-3 days |
| **Total** | **31** | | **~32-45 days** |
