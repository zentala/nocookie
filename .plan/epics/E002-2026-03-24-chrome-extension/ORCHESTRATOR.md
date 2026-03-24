---
id: E002
title: Chrome Extension + Open Standard + Website — Execution Plan
status: planned
created: 2026-03-24
waves: 6
---

# E002: Orchestrator — Wave-Organized Task Breakdown

## Overview

6 waves, 24 tasks. Each wave builds on the previous.
Complexity: S = half day, M = 1-2 days, L = 2-4 days.

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

- [ ] **E002-T06** — CMP rule format and rule engine
  - **Description**: Implement the rule engine that loads CMP rules (JSON), matches detection signals to rules, and selects the appropriate execution strategy. Define the rule JSON schema. Implement rule loading from `src/rules/builtin/`.
  - **Dependencies**: E002-T02, E002-T04
  - **Complexity**: M
  - **Output**: `src/background/rule-engine.ts` that accepts detection signals and returns a matched rule

- [ ] **E002-T07** — MAIN world executor framework
  - **Description**: Implement `executor.ts` that runs in MAIN world. Receives: CMP identity, user preferences, execution strategy. Supports: API calls (eval), click simulation (querySelector + click), toggle setting. Reports result via `window.postMessage`. ISOLATED content script relays result to background.
  - **Dependencies**: E002-T04, E002-T06
  - **Complexity**: M
  - **Output**: Executor that can run arbitrary consent strategies in page context

- [ ] **E002-T08** — OneTrust rule + integration test
  - **Description**: Write OneTrust CMP rule (detection: `window.OneTrust`, `#onetrust-consent-sdk`; API actions: `OneTrust.AllowAll()`, `OneTrust.RejectAll()`, `OneTrust.UpdateConsent()`; click fallbacks). Category mapping: C0001-C0005. Write E2E test with a mock OneTrust page.
  - **Dependencies**: E002-T06, E002-T07
  - **Complexity**: M
  - **Output**: `src/rules/builtin/onetrust.json`, Playwright test passing

- [ ] **E002-T09** — Cookiebot rule + integration test
  - **Description**: Write Cookiebot CMP rule (detection: `window.Cookiebot`, `#CybotCookiebotDialog`; API: `Cookiebot.submitCustomConsent(prefs, stats, marketing)`; click fallbacks). Category mapping: necessary/preferences/statistics/marketing. Write E2E test.
  - **Dependencies**: E002-T06, E002-T07
  - **Complexity**: M
  - **Output**: `src/rules/builtin/cookiebot.json`, Playwright test passing

- [ ] **E002-T10** — Didomi rule + integration test
  - **Description**: Write Didomi CMP rule (detection: `window.Didomi`, `#didomi-host`; API: `Didomi.setUserAgreeToAll()`, `Didomi.setUserDisagreeToAll()`; click fallbacks). Must handle `didomiOnReady` callback pattern. Write E2E test.
  - **Dependencies**: E002-T06, E002-T07
  - **Complexity**: M
  - **Output**: `src/rules/builtin/didomi.json`, Playwright test passing

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

User-facing interfaces. Can be developed in parallel (popup + options are independent).

- [ ] **E002-T13** — Popup UI
  - **Description**: Implement the extension popup per PLAN.md section 3.1. Show: current page domain, consent status (handled/none/error), categories accepted/rejected, CMP name, method used. Quick actions: profile dropdown, "override for this site" link. Five visual states (handled/none/attention/error/disabled). Accessible: keyboard nav, ARIA labels, no color-only indicators.
  - **Dependencies**: E002-T03, E002-T04
  - **Complexity**: L
  - **Output**: Popup that reflects real consent state for the active tab

- [ ] **E002-T14** — Options page: Preferences + Profiles
  - **Description**: Implement options page Tab 1 (Preferences). Category toggles with info expandos. Preset profile selector (Privacy Maximum, Balanced, Allow Analytics, Accept All, Custom). Changing a toggle auto-switches to Custom. Persists to `chrome.storage.sync`. Accessible.
  - **Dependencies**: E002-T03
  - **Complexity**: M
  - **Output**: Working preferences page that saves to storage

- [ ] **E002-T15** — Options page: Site Overrides + Advanced + Statistics
  - **Description**: Implement options page Tabs 2-4. Site overrides: add/edit/delete domain rules, modal for custom per-domain prefs. Advanced: auto-consent toggle, delay slider, heuristic toggle, notification toggle, logging toggle, well-known toggle. Statistics: read from storage, render aggregate data with counts and percentages. About tab with links.
  - **Dependencies**: E002-T03, E002-T14
  - **Complexity**: L
  - **Output**: Complete options page with all tabs functional

- [ ] **E002-T16** — Badge/icon state management
  - **Description**: Create icon assets in 4 states x 4 sizes (16/32/48/128). Implement badge update logic in background service worker: set icon variant + badge text based on consent result. Clear badge on tab navigation. Handle tab switching (show correct state per tab).
  - **Dependencies**: E002-T04
  - **Complexity**: S
  - **Output**: Icon changes based on consent status per tab

---

## Wave 4: Open Standard + Remaining CMPs

Standard specification finalized. Expand CMP coverage to 6 more CMPs.

- [ ] **E002-T17** — Open standard JSON schema and validator library
  - **Description**: Formalize the `cookie-consent.json` JSON Schema (per PLAN.md section 4.2). Write a TypeScript validator library that validates a JSON object against the schema, returning typed errors. This library is used by both the extension (T12) and the website validator (T21). Publish schema at a stable URL.
  - **Dependencies**: E002-T12
  - **Complexity**: M
  - **Output**: `packages/schema/` with JSON schema + TS validator, full test coverage

- [ ] **E002-T18** — Additional CMP rules: Quantcast, TrustArc, CookieYes
  - **Description**: Write rules for 3 more CMPs. Quantcast: TCF-primary, `.qc-cmp2-ui` detection, click-based consent. TrustArc: iframe challenge, `#truste-consent-track` detection, limited API. CookieYes: `.cky-consent-container`, `performBannerAction()` API. Include E2E tests for each.
  - **Dependencies**: E002-T06, E002-T07
  - **Complexity**: L
  - **Output**: 3 more CMP rules with tests, total coverage: 6 CMPs

- [ ] **E002-T19** — Additional CMP rules: Complianz, Osano, consentmanager
  - **Description**: Write rules for 3 more CMPs. Complianz: WordPress-specific, `.cmplz-cookiebanner`, event-driven. Osano: `.cc-window`, `cookieconsent.initialise()`. consentmanager: `#cmpbox`, TCF-based. Include E2E tests for each.
  - **Dependencies**: E002-T06, E002-T07
  - **Complexity**: L
  - **Output**: 3 more CMP rules with tests, total coverage: 9 CMPs

---

## Wave 5: Website

Static site for documentation, standard spec, and extension download page.

- [ ] **E002-T20** — Website scaffolding (Astro + Cloudflare Pages)
  - **Description**: Initialize Astro project with Tailwind CSS. Set up Cloudflare Pages deployment. Create layout component, navigation, footer. Landing page with hero, problem statement, solution overview, extension install CTA, standard intro. Mobile responsive. Privacy-respecting analytics (Plausible).
  - **Dependencies**: None (parallel with other waves)
  - **Complexity**: M
  - **Output**: Deployed landing page at chosen domain

- [ ] **E002-T21** — Standard specification page + online validator
  - **Description**: Write the v1 spec page (full specification from PLAN.md section 4). Include downloadable JSON schema. Build an online validator: user enters URL, page fetches `/.well-known/cookie-consent.json`, validates against schema, shows results. Validator runs entirely client-side. Example files for each supported CMP.
  - **Dependencies**: E002-T17, E002-T20
  - **Complexity**: L
  - **Output**: `/standard/v1` page + `/validator` tool working

- [ ] **E002-T22** — Implementation guides + AI agent instructions
  - **Description**: Write implementation guides: general quick-start, OneTrust-specific, Cookiebot-specific, WordPress guide. Write `cookie-consent-instructions.md` template for AI agents. Write the `/guide/ai` page explaining how AI agents can auto-implement the standard. All content in English.
  - **Dependencies**: E002-T20
  - **Complexity**: M
  - **Output**: 5+ guide pages published on the website

---

## Wave 6: Polish, Testing, Publishing

Final quality pass, comprehensive testing, Chrome Web Store submission.

- [ ] **E002-T23** — Comprehensive E2E test suite
  - **Description**: Playwright test suite covering: all 9 CMP rules against mock pages, popup UI interactions, options page interactions, profile switching, domain overrides, badge state changes, well-known file reading, heuristic fallback. Run in CI. Target: 80%+ overall coverage.
  - **Dependencies**: All previous tasks
  - **Complexity**: L
  - **Output**: Full Playwright test suite passing in CI

- [ ] **E002-T24** — Chrome Web Store preparation and publishing
  - **Description**: Create store listing: screenshots (popup, options, badge states), description, privacy policy (no data collection beyond local storage). Create promotional images (440x280, 920x680, 1400x560). Set up developer account. Submit for review. Also: add precommit hook (Husky) with lint + format + test coverage check.
  - **Dependencies**: E002-T23
  - **Complexity**: M
  - **Output**: Extension published on Chrome Web Store (or submitted for review)

---

## Dependency Graph

```
Wave 1:  T01 -> T02 -> T03 -> T04 -> T05
                  |       |      |
                  v       v      v
Wave 2:         T06 <----+    T07
                  |             |
           +-----+-----+-------+-----+
           |     |      |      |     |
           v     v      v      v     v
          T08   T09   T10    T11   T12
           |     |      |      |     |
Wave 3:    +-----+------+------+-----+---> T13, T14 -> T15, T16
                                           |
Wave 4:                                   T17 -> T18, T19
                                           |
Wave 5:  T20 (independent) ---------> T21, T22
                                           |
Wave 6:                               T23 -> T24
```

## Parallel Opportunities

- **Wave 2**: T08, T09, T10 can run in parallel (independent CMP rules)
- **Wave 2**: T11, T12 can run in parallel with T08-T10
- **Wave 3**: T13 and T14 can run in parallel
- **Wave 3**: T16 can run in parallel with T13-T15
- **Wave 4**: T18 and T19 can run in parallel
- **Wave 5**: T20 can start during Wave 3 or 4 (no extension dependency)
- **Wave 5**: T21 and T22 can run in parallel after T20

## Estimated Timeline

| Wave | Tasks | Parallel Tracks | Est. Duration |
|------|-------|-----------------|---------------|
| 1 | T01-T05 | 1-2 | 5-7 days |
| 2 | T06-T12 | 3-4 | 5-7 days |
| 3 | T13-T16 | 2-3 | 5-7 days |
| 4 | T17-T19 | 2 | 4-6 days |
| 5 | T20-T22 | 2 | 4-6 days |
| 6 | T23-T24 | 1 | 4-6 days |
| **Total** | **24** | | **~27-39 days** |
