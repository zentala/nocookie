# E001 Research Summary — Cookies Accepter

**Date**: 2026-03-24
**Status**: Complete

---

## Executive Summary

There is a **clear market gap** for our project. No existing solution combines:
1. Open-source, per-category cookie consent management
2. An open standard for machine-readable cookie metadata
3. AI agent instructions for automated implementation

The closest competitor (Consent-O-Matic) is excellent but limited by manual rule maintenance. Our approach — an open standard + extension + AI-readable spec — addresses the root cause.

---

## 1. Competitive Landscape

### Key Players

| Extension | Per-Category | Open Source | Approach | Gap |
|-----------|:---:|:---:|---|---|
| **Consent-O-Matic** | Yes (5 cat) | Yes (MIT) | CSS selector rules for 200+ CMPs | Manual rules, no standard |
| **I Still Don't Care About Cookies** | No | Yes (GPL) | Accept all / hide | No user choice |
| **Super Agent** | Yes (3 cat) | No | Proprietary | Paid, closed |
| **CookieBlock** | Yes (4 cat) | Yes (MIT) | ML cookie classification | Doesn't dismiss popups |
| **DuckDuckGo Autoconsent** | No | Yes | Rules + TS classes, 100+ CMPs | Reject-only, no user config |

### Our Differentiators
1. **Open standard** — no one has created a lightweight `robots.txt`-style standard for cookie consent
2. **AI-readable spec** — no `llms.txt` equivalent exists for cookies
3. **Per-category + open source** — only Consent-O-Matic does this, but without a standard
4. **Layered detection** — API-first approach (not just CSS selectors)

---

## 2. Cookie Category Taxonomy

### De Facto Standard: 4+1 Categories

| # | Category | Consent Required | Description |
|---|----------|:---:|---|
| 1 | **Essential** | No | Session, auth, CSRF, load balancing, consent storage |
| 2 | **Functional** | Yes | Language, region, chat widgets, preferences |
| 3 | **Analytics** | Yes | Google Analytics, page views, bounce rates |
| 4 | **Marketing** | Yes | Ad targeting, retargeting, cross-site tracking |
| 5 | **Social Media** | Yes | Social sharing, embeds (often merged with Marketing) |

### IAB TCF v2.2 Mapping
- Essential → Special Purposes 1-3 (not refusable)
- Functional → Purpose 11
- Analytics → Purposes 7, 8, 9, 10
- Marketing → Purposes 1, 2, 3, 4
- Content Personalization → Purposes 5, 6

### Recommended User Preference Profiles

| Profile | Essential | Functional | Analytics | Marketing |
|---------|:---:|:---:|:---:|:---:|
| **Privacy Maximum** (Reject All) | On | Off | Off | Off |
| **Essential + Functional** | On | On | Off | Off |
| **Allow Analytics** | On | On | On | Off |
| **Accept All** | On | On | On | On |

---

## 3. CMP Technical Landscape

### Top 9 CMPs Analyzed

| CMP | Market | JS API | TCF | Detection Method |
|-----|--------|:---:|:---:|---|
| **OneTrust** | Enterprise leader ~30% | `OneTrust.AllowAll()` | Yes | `#onetrust-consent-sdk` |
| **Cookiebot** | SMB leader | `Cookiebot.submitCustomConsent()` | Yes | `#CybotCookiebotDialog` |
| **Didomi** | EU enterprise | `Didomi.setUserAgreeToAll()` | Yes | `#didomi-host` |
| **CookieYes** | SMB | `performBannerAction()` | Partial | `.cky-consent-container` |
| **Quantcast** | Ad-tech | `__tcfapi` only | Yes | `.qc-cmp2-ui` |
| **TrustArc** | Enterprise | Limited (iframe) | Yes | `#truste-consent-track` |
| **Complianz** | WordPress | Event-driven | Optional | `.cmplz-cookiebanner` |
| **Osano** | Open-source | `cookieconsent.initialise()` | No | `.cc-window` |
| **consentmanager** | EU mid-market | `__tcfapi` | Yes | `#cmpbox` |

### Recommended Interaction Strategy (Layered)

1. **Primary**: CMP-specific JavaScript API (most reliable)
2. **Secondary**: Click simulation with known selectors
3. **Tertiary**: IAB TCF `__tcfapi` for detection
4. **Fallback**: Generic heuristics (button text matching)

### Key Technical Challenges
- **Timing**: CMPs load async → need MutationObserver / polling
- **Iframes**: TrustArc uses cross-origin iframes
- **Shadow DOM**: Some newer CMPs use shadow boundaries
- **Isolated world**: Extension must inject into main world for API access
- **SPAs**: Re-detection needed on route changes

---

## 4. Standards Landscape

| Standard | Per-Category | Adoption | Status |
|----------|:---:|:---:|---|
| **IAB TCF v2.2** | Yes (11 purposes) | High (ad industry) | Active |
| **GPC** | No (binary) | Growing | W3C Draft, mandated in CA by 2027 |
| **ADPC** (noyb) | Yes (per-purpose) | Zero | Stalled unofficial draft |
| **DNT** | No | Dead | Deprecated |

### The Gap We Fill
**No lightweight standard exists for websites to declare cookie categories in a machine-readable format.** ADPC tried but failed due to complexity. We can create something simpler — a `/.well-known/cookie-consent.json` approach.

---

## 5. Open-Source Rule Databases

Two major open-source rule databases we can leverage:

### Consent-O-Matic Rules
- 200+ CMPs covered
- JSON format with `presentMatcher`, `showingMatcher`, `methods`
- Category codes: A (Analytics), B (Marketing), D (Data), E (Essential), F (Functional), X (Social)

### DuckDuckGo Autoconsent
- 100+ CMPs covered
- JSON + TypeScript classes
- Has Consent-O-Matic compatibility layer
- Actions: `exists`, `visible`, `click`, `waitForThenClick`, `eval`, etc.

**Recommendation**: Use autoconsent as foundation — it's more modern, has better architecture, and already includes Consent-O-Matic compatibility.

---

## 6. Recommendations for E002

### Architecture
1. **Manifest V3** Chrome extension
2. **Content script** in main world (for CMP API access)
3. **Background service worker** for orchestration
4. **Options page** for preference configuration
5. **Popup** for quick status view

### Detection Strategy
1. Check for known global JS objects (fastest)
2. Check for known DOM selectors
3. Check for known script URLs
4. Fall back to generic popup detection

### Consent Strategy
1. If CMP has JS API → call it directly
2. If not → click simulation with known selectors
3. Map user's 4-category preferences to CMP's format
4. Store consent state per-domain

### Standard Specification
1. Define `/.well-known/cookie-consent.json` format
2. Include: categories used, button selectors, CMP type
3. Make it dead simple (unlike ADPC which was too complex)
4. Publish AI agent instructions alongside

### What to Build First
1. Extension with support for top 3 CMPs (OneTrust, Cookiebot, Didomi)
2. Preference UI with 4 category toggles
3. Status indicator (popup showing what was accepted)
4. Then expand CMP support using autoconsent rules
