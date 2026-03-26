# Architecture — NoCookie

## System Overview

Four components in a monorepo, connected by an open standard:

```
nocookie/
├── extension/      → Chrome Extension (Manifest V3, TypeScript)
├── cmp-plugin/     → CMP widget for websites (@nocookie/cmp)
├── website/        → Project website (Astro, Cloudflare Pages)
└── standard/       → Open standard specification
```

### Component Interaction

```
Website Owner installs CMP plugin
  → plugin serves /.well-known/cookie-consent.json
  → plugin renders consent banner (Shadow DOM)

User visits site with extension installed
  → extension detects CMP (6-layer engine)
  → if our CMP plugin: instant handshake (<100ms), auto-apply prefs
  → if third-party CMP: API call / click simulation / autoconsent
  → badge updates, consent logged to dashboard
```

---

## 1. Chrome Extension

### Architecture: Dual-World Content Scripts

Manifest V3 requires content scripts in an isolated world. CMP APIs live on
the page's `window` object. Solution: two execution contexts.

**ISOLATED world** (detector.ts + observer.ts):
- Runs on every page via manifest `content_scripts`
- MutationObserver watches for CMP DOM elements
- Checks DOM selectors, script URLs, well-known file
- Sends detection results to background service worker
- Cannot access page JS objects

**MAIN world** (executor.ts):
- Injected dynamically by background worker via `chrome.scripting.executeScript`
- Only injected after detection confirms a CMP is present
- Full access to `window` — calls `OneTrust.AllowAll()`, `Cookiebot.submitCustomConsent()`, etc.
- Reports results via `window.postMessage` back to ISOLATED script

### Background Service Worker

Responsibilities:
1. Message routing — receives detection from content scripts
2. Preference lookup — reads from `chrome.storage.sync`
3. Rule matching — matches detected CMP to rule set
4. Executor dispatch — injects MAIN world script
5. Badge/icon update — reflects consent outcome
6. Consent logging — per-domain history in `chrome.storage.local`
7. Well-known check — fetches `/.well-known/cookie-consent.json`
8. GPC header emission — sends `Sec-GPC: 1` when user rejects marketing

### 6-Layer Detection Engine

Detection runs in priority order. First match wins.

| Layer | Method | World | Confidence |
|-------|--------|-------|------------|
| 1 | `/.well-known/cookie-consent.json` | Network | Highest |
| 2 | JS API probing (`window.OneTrust`, etc.) | MAIN | High |
| 3 | DOM selectors (`#onetrust-consent-sdk`, etc.) | ISOLATED | High |
| 4 | Script URL detection (CDN patterns) | ISOLATED | Medium-High |
| 5 | Autoconsent library (100+ CMPs) | ISOLATED | Medium-High |
| 6 | Generic heuristic (button text, dialog roles) | ISOLATED | Low |

### Consent Execution Strategies

1. **API call** (preferred) — direct CMP JS API (`OneTrust.RejectAll()`, etc.)
2. **Click simulation** — known button selectors from rule database
3. **TCF API** — detect CMP type via `__tcfapi`, then click simulation
4. **Autoconsent** — delegated to `@duckduckgo/autoconsent` adapter
5. **Generic heuristic** — button text matching as last resort

### Autoconsent Integration

Wraps DuckDuckGo's `@duckduckgo/autoconsent` as the primary bulk CMP handler.
An `AutoconsentAdapter` translates between autoconsent's opt-in/opt-out model
and our 5-category preference model. Our native rules take priority when both
systems have rules for the same CMP.

### UI Components

- **Popup** — quick preference toggle, current site status
- **Options page** — full preference configuration, profile presets
- **Consent dashboard** — per-domain consent history, statistics
- **First-run onboarding** — guided setup on install

### Data Model

```typescript
interface UserPreferences {
  essential: true;       // always true
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  socialMedia: boolean;
}
```

---

## 2. CMP Plugin (@nocookie/cmp)

### Distribution

- CDN script tag (simplest)
- npm package (`@nocookie/cmp`)
- WordPress plugin (future)

### Architecture

- **Shadow DOM isolation** — all UI rendered inside Shadow DOM to prevent style leakage
- **Three UI layers**: consent banner, preference center modal, full cookie policy page
- **Cookie policy icons** — standardized visual indicators (like Creative Commons badges)
- **Event bus** — pub/sub system for consent lifecycle events

### Extension Handshake Protocol

When our extension is present, the CMP detects it and skips the popup:

```
Extension loads on page
  → content script dispatches CustomEvent('ca-extension-present')
  → CMP plugin listens, responds with CustomEvent('ca-cmp-ready')
  → extension sends user preferences via postMessage
  → CMP applies preferences silently, fires 'extension:applied' event
  → no popup shown to user
```

Handshake target: under 100ms.

### Integration Features

- Auto-generates `/.well-known/cookie-consent.json` from config
- GPC signal detection and response (`Sec-GPC: 1`)
- TCF consent string emission (optional)
- Standardized cookie practice descriptions (5 languages: EN, DE, FR, ES, PL)
- Downloadable badge kit (SVG icons for all categories)

### Size Budget

Under 30KB gzipped (JS + CSS, excluding visual configurator).

---

## 3. Open Standard

### Well-Known Endpoint

Websites serve `/.well-known/cookie-consent.json` describing their consent UI:

- CMP type and version
- Available cookie categories with descriptions
- Button selectors and actions
- Category-to-CMP mapping

This gives the extension perfect information — no heuristics needed.

### Cookie Categories Taxonomy

Five standard categories: essential, functional, analytics, marketing, socialMedia.
Each CMP rule maps its internal categories to this taxonomy.

---

## 4. Website

- **Framework**: Astro (static site generation)
- **Hosting**: Cloudflare Pages
- **Content**: standard specification, implementation guides, extension download
- **Tools**: visual configurator for website owners to generate CMP config
- **Validator**: online tool to validate `/.well-known/cookie-consent.json` files

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Manifest V3 | Required for Chrome Web Store, future-proof |
| Dual-world content scripts | Security (detection) + capability (execution) |
| Autoconsent integration | 100+ CMP rules immediately, actively maintained |
| Shadow DOM for CMP plugin | Style isolation from host site |
| `/.well-known/` standard | Established convention (robots.txt, security.txt) |
| GPC support | Legal signal in some jurisdictions, complements consent |
| Astro for website | Fast static site, good DX, Cloudflare Pages compatible |
| pnpm monorepo | Strict hoisting, faster installs, workspace support |

See `.arch/ADR/` for detailed decision records.
