# Standards Implementation Recommendations for NoCookie

**Date**: 2026-03-24
**Type**: Implementation recommendations
**Status**: Complete

---

## Purpose

This document translates findings from the consent standards analysis into concrete implementation decisions for the NoCookie extension and open standard. Each recommendation identifies what concept to borrow, which standard it comes from, how to implement it, and its priority.

---

## 1. Must Implement (Directly Borrowed, Proven Concepts)

These are concepts from existing standards/tools that are validated by real-world usage and should be in our v1.0.

### 1.1 Five-Category Consent Taxonomy

**Source**: Consent-O-Matic (5 categories), de facto CMP industry standard (4-5 categories)

**What**: User preferences organized into: Essential (always on), Functional, Analytics, Marketing, Social Media.

**How to implement**:
- Store as `UserPreferences` interface with 5 booleans
- Essential is always `true` and not user-configurable
- Each CMP rule includes a `categoryMapping` that maps our categories to the CMP's internal IDs (e.g., `analytics -> C0002` for OneTrust, `analytics -> statistics` for Cookiebot)
- Provide 4 preset profiles: Privacy Maximum, Balanced, Allow Analytics, Accept All

**Why this taxonomy**: Consent-O-Matic validated it with 200K+ users. It maps cleanly to every major CMP's category structure. It is granular enough for meaningful user control without being overwhelming (unlike TCF's 11 purposes).

**Priority**: MUST HAVE (v1.0)

### 1.2 CMP-Specific Rule Engine (JSON Rules)

**Source**: Consent-O-Matic rule format, DuckDuckGo Autoconsent rule format

**What**: A JSON-based rule database where each CMP has detection signals, category mappings, and action sequences.

**How to implement**:
```typescript
interface CMPRule {
  name: string;
  detection: {
    domSelectors: string[];     // Layer 3: DOM element selectors
    scriptUrls: string[];       // Layer 4: CDN script URLs
    jsGlobals: string[];        // Layer 2: window.X objects
  };
  categoryMapping: {
    functional: string;
    analytics: string;
    marketing: string;
    socialMedia?: string;
  };
  actions: {
    acceptAll: ActionSequence;
    rejectAll: ActionSequence;
    custom: ActionSequence;
  };
}
```
- Ship bundled rules for top 9 CMPs (OneTrust, Cookiebot, Didomi, Quantcast, TrustArc, CookieYes, Complianz, Osano, consentmanager)
- Support community rule contributions via GitHub PRs
- Weekly rule update check against a hosted manifest

**Priority**: MUST HAVE (v1.0)

### 1.3 Consent-O-Matic Compatibility Layer

**Source**: DuckDuckGo Autoconsent's `ConsentOMaticCMP` class

**What**: Ability to consume rules in Consent-O-Matic's JSON format, giving immediate access to 200+ CMP rules.

**How to implement**:
- Build a `ConsentOMaticAdapter` that translates C-O-M rule format (detectors, methods with OPEN_OPTIONS/DO_CONSENT/SAVE_CONSENT/HIDE_CMP) into our internal `CMPRule` format
- Import C-O-M's `Rules.json` as a secondary rule source
- Our native rules take priority when both exist for a CMP
- Autoconsent proved this approach works

**Priority**: MUST HAVE (v1.0) -- this gives us 200+ CMPs from day one

### 1.4 CMP API Calls Over Click Simulation

**Source**: TCF `__tcfapi`, CMP vendor documentation (OneTrust, Cookiebot, Didomi APIs)

**What**: Prefer calling CMP JavaScript APIs directly rather than simulating button clicks.

**How to implement**:
- For each CMP rule, define API call strategies when available:
  - OneTrust: `OneTrust.AllowAll()`, `OneTrust.RejectAll()`, `OneTrust.UpdateConsent()`
  - Cookiebot: `Cookiebot.submitCustomConsent(prefs, stats, marketing)`
  - Didomi: `Didomi.setUserAgreeToAll()`, `Didomi.setUserDisagreeToAll()`
  - CookieYes: `performBannerAction("accept_all")`, `performBannerAction("reject")`
- Fall back to click simulation only when API is unavailable
- API calls are more reliable, faster, and less likely to break on CMP updates

**Why**: Click simulation is fragile (depends on exact DOM structure). API calls interact with the CMP's intended interface. TCF's `__tcfapi` demonstrates that standardized APIs are more reliable than DOM scraping.

**Priority**: MUST HAVE (v1.0)

### 1.5 GPC Signal Emission

**Source**: Global Privacy Control (W3C draft)

**What**: Emit the `Sec-GPC: 1` HTTP header alongside our CMP-level consent management.

**How to implement**:
- When user's profile is "Privacy Maximum" or "Balanced" (rejecting marketing), set GPC header
- Use `chrome.declarativeNetRequest` to add `Sec-GPC: 1` header to all outgoing requests
- Also set `navigator.globalPrivacyControl = true` via content script in MAIN world
- Respect user toggle in settings (enable/disable GPC emission)

**Why**: GPC is legally enforceable in 12 US states and will be mandatory in browsers by 2027 (AB 566). Emitting GPC alongside CMP interaction provides defense-in-depth: even if CMP interaction fails, the site receives the GPC signal.

**Priority**: MUST HAVE (v1.0)

### 1.6 Privacy-Protective Defaults

**Source**: Lessons from DNT failure, GDPR Art. 25 (privacy by default), legal risk analysis

**What**: Out-of-the-box behavior rejects all non-essential cookies. Users must actively choose to accept additional categories.

**How to implement**:
- Default profile: "Privacy Maximum" (essential only)
- First-run onboarding wizard explains categories and lets user choose a profile
- No silent accept-all behavior ever
- Changing to "Accept All" requires explicit user confirmation

**Why**: "I Don't Care About Cookies" faced criticism for defaulting to accept-all. Our legal risk analysis identifies privacy-protective defaults as the primary mitigation for consent validity risks. GDPR Art. 25 requires privacy by default.

**Priority**: MUST HAVE (v1.0)

### 1.7 Per-Domain Override Capability

**Source**: EDPB Guidelines 05/2020 (consent must be "specific" per-controller), legal risk analysis

**What**: Allow users to set different consent preferences for different domains.

**How to implement**:
- `domainOverrides` in `chrome.storage.sync` keyed by domain
- Override modes: Accept All, Reject All, Custom (per-category), Disabled (extension off)
- UI: "Override for this site" in popup, full list in options page
- Wildcard domain support (e.g., `*.google.com`)

**Why**: EDPB emphasizes that consent must be "specific" -- meaning per-purpose AND per-controller. A blanket "accept analytics everywhere" setting could be challenged as insufficiently specific. Per-domain overrides strengthen the legal argument that user consent is genuine and specific.

**Priority**: MUST HAVE (v1.0)

---

## 2. Should Implement (Good Ideas, Moderate Effort)

These concepts add significant value and should be in v1.x releases.

### 2.1 `/.well-known/cookie-consent.json` Standard

**Source**: Original concept, inspired by GPC's `/.well-known/gpc.json`, ADPC's `consent-requests.json`, and `robots.txt` convention

**What**: A machine-readable JSON file at `/.well-known/cookie-consent.json` where websites declare their cookie categories, CMP details, and UI selectors.

**How to implement**:
- Fetch on first visit to a domain (cache 24h in `chrome.storage.local`)
- Parse and validate against JSON schema
- When present, use declared selectors/API info instead of heuristic detection
- Publish specification on project website
- Create validator tool

**Why**: This is our key differentiator. It turns a fragile extension into a standards-based solution. It aligns with Art. 88b's eventual requirement for machine-readable consent. Unlike ADPC, it requires zero browser support -- just a single file on a web server.

**Priority**: SHOULD HAVE (v1.1) -- the extension works without it, but the standard is our strategic differentiator

### 2.2 TCF Purpose-to-Category Mapping

**Source**: IAB TCF v2.2 purpose taxonomy

**What**: Map TCF's 11 purposes to our 5-category model so the extension can handle TCF-compliant CMPs correctly.

**How to implement**:
```typescript
const TCF_TO_CATEGORY_MAP = {
  // Marketing / Advertising
  1: 'marketing',   // Store/access information on a device
  2: 'marketing',   // Use limited data to select advertising
  3: 'marketing',   // Create profiles for personalised ads
  4: 'marketing',   // Use profiles to select personalised ads
  // Content Personalization -> Functional
  5: 'functional',  // Create profiles to personalise content
  6: 'functional',  // Use profiles to select personalised content
  // Analytics / Performance
  7: 'analytics',   // Measure ad performance
  8: 'analytics',   // Measure content performance
  9: 'analytics',   // Understand audiences through statistics
  10: 'analytics',  // Develop and improve services
  // Functional
  11: 'functional', // Use limited data to select content
};
```
- Use `__tcfapi('ping')` to detect TCF CMPs
- Read current consent state via `addEventListener`
- Cannot set consent via TCF API (read-only), but use TCF ping to identify the CMP type, then execute via CMP-specific rules

**Priority**: SHOULD HAVE (v1.1)

### 2.3 Consent History Dashboard

**Source**: Transparency principles from GDPR Art. 12-14, legal risk mitigation (informed consent)

**What**: A per-domain log of what the extension did: which CMP was detected, what method was used, which categories were accepted/rejected, confidence level.

**How to implement**:
- Store in `chrome.storage.local` keyed by domain
- Log entry: `{ domain, cmp, method, categoriesAccepted, categoriesRejected, timestamp, confidence }`
- Display in options page "Statistics" tab
- Export as JSON for user review
- Auto-prune entries older than 90 days (configurable)

**Why**: Transparency strengthens the legal argument that the user is "informed" about what consent is being given/refused on their behalf. It also helps users understand the extension's behavior and identify sites that need attention.

**Priority**: SHOULD HAVE (v1.1)

### 2.4 Multi-Language Heuristic Text Matching

**Source**: Consent-O-Matic's multi-language support, Autoconsent's text matching

**What**: Generic fallback detector that matches consent button text in 16+ languages.

**How to implement**:
- Build text pattern database: "Accept All", "Reject All", "Alle akzeptieren", "Tout accepter", "Zaakceptuj wszystkie", etc.
- Match against button/link elements in cookie-related dialogs
- Weight by proximity to common consent indicators (`role="dialog"`, `aria-label*="cookie"`, fixed/sticky positioning)
- Multi-language priority: EN, DE, FR, ES, PL, NL, IT, PT, SV, DA, NO, FI, CS, RO, HU, EL
- Low confidence -- used only when no CMP is identified by rules

**Priority**: SHOULD HAVE (v1.1)

### 2.5 MutationObserver for Async CMP Loading and SPA Navigation

**Source**: Autoconsent architecture, SPA navigation handling patterns

**What**: Watch for CMP elements that load asynchronously (common with lazy-loaded CMPs) and re-detect on single-page application navigation.

**How to implement**:
- `MutationObserver` on `document.body` direct children (not full subtree for performance)
- Watch for `childList` additions matching known CMP container selectors
- Re-scan on `popstate`, `hashchange`, and History API `pushState`/`replaceState` monkey-patching
- Timeout after 10 seconds of watching (configurable via `consentDelay` setting)

**Priority**: SHOULD HAVE (v1.0 -- needed for real-world reliability)

---

## 3. Consider for v2 (Ambitious but Valuable)

These concepts are forward-looking and should be planned for future versions.

### 3.1 ADPC Header Emission (When Available)

**Source**: ADPC specification

**What**: When our standard detects that a site publishes ADPC `consent-requests`, respond with ADPC-formatted headers alongside our own mechanisms.

**How to implement**:
- Check for `Link: </consent-requests.json>; rel="consent-requests"` header in responses
- If present, fetch and parse the consent-requests file
- Map ADPC purpose IDs to our categories
- Emit `ADPC: consent="analytics"; withdraw="marketing"` header on subsequent requests
- Use `chrome.declarativeNetRequest` for header modification

**Why**: If ADPC is revived as part of Art. 88b standardization, early support positions our extension as a reference implementation. The effort is moderate if ADPC adoption materializes.

**Priority**: CONSIDER for v2 -- only if ADPC shows signs of adoption

### 3.2 CMP Plugin Auto-Generators for the Standard

**Source**: Original concept, inspired by WordPress plugin ecosystem

**What**: WordPress plugins and CMP vendor integrations that auto-generate `/.well-known/cookie-consent.json` from existing CMP configuration.

**How to implement**:
- WordPress plugin for Complianz/CookieYes: reads CMP config, generates JSON file
- OneTrust integration guide: script that reads `OptanonConsent` structure and generates file
- Cookiebot integration: reads Cookiebot dashboard settings and generates file
- AI agent instructions file (`cookie-consent-instructions.md`) for LLM-assisted generation

**Why**: Adoption of the standard depends on making implementation trivially easy. Auto-generation removes the manual step entirely.

**Priority**: CONSIDER for v2

### 3.3 Google Consent Mode v2 Integration

**Source**: Google Consent Mode v2

**What**: Map our category preferences to Google Consent Mode signals for sites using Google's consent infrastructure.

**How to implement**:
```typescript
const CATEGORY_TO_GOOGLE_CONSENT = {
  marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
  analytics: ['analytics_storage'],
  functional: ['functionality_storage', 'personalization_storage'],
};
```
- Detect Google Consent Mode via `gtag('consent', 'default', ...)` calls
- Set Google consent state via `gtag('consent', 'update', { ... })`

**Why**: Google Consent Mode is increasingly required for Google Ads and Analytics. Supporting it ensures our extension works correctly on Google-heavy sites.

**Priority**: CONSIDER for v2

### 3.4 Article 88b Signal Format Compatibility

**Source**: EU Digital Omnibus Art. 88b (once technical standards are specified)

**What**: When the EU's Art. 88b technical specification is published (estimated 2028-2029), implement support for the official signal format.

**How to implement**:
- Monitor EU standardization body activities (CEN, CENELEC, ETSI)
- Design our `cookie-consent.json` schema to be mappable to whatever format emerges
- Add Art. 88b signal emission alongside our existing mechanisms
- Potentially submit our standard as input to the standardization process

**Why**: Art. 88b is the endgame. If our standard influences or aligns with the official specification, our project becomes a reference implementation rather than a competing standard.

**Priority**: CONSIDER for v2-v3 (timing dependent on EU legislative process)

### 3.5 ML-Assisted CMP Detection

**Source**: CookieBlock (ETH Zurich) ML approach concept, applied to UI detection rather than cookie classification

**What**: Use a lightweight ML model to identify consent popup elements in unknown CMPs.

**How to implement**:
- Train a classifier on DOM features of known consent popups (position, size, text content, button arrangement, overlay behavior)
- Ship as a small TensorFlow.js or ONNX model (<1MB)
- Use as Layer 5 fallback (below rules, above text heuristics)
- Collect feedback: if user reports misdetection, feed into model improvement

**Why**: Closes the coverage gap for custom/unknown CMPs without manual rule writing. CookieBlock proved ML can work for cookie classification at 84% accuracy; applying similar techniques to UI detection could achieve better results since consent popups have strong visual/structural patterns.

**Priority**: CONSIDER for v2 -- requires significant ML engineering effort

---

## 4. Explicitly Avoid (Things That Failed for Good Reasons)

These are concepts or approaches that failed in other standards/tools, and we should not repeat their mistakes.

### 4.1 Voluntary Compliance Without Enforcement

**Source**: DNT failure

**What to avoid**: Designing any part of our system that depends on website voluntary compliance to function.

**Our approach instead**: The extension works whether or not websites adopt our standard. The standard is additive (makes things better) not required (blocks function without it). We do not assume websites will cooperate -- we interact with their existing CMPs regardless.

### 4.2 Complex Multi-Party Protocol Requiring Simultaneous Adoption

**Source**: ADPC failure

**What to avoid**: A standard that requires browsers, websites, AND servers to all implement something simultaneously before any value is delivered.

**Our approach instead**: Each component delivers value independently:
- Extension works without the standard (uses CMP rules)
- Standard works without the extension (other tools can read it)
- Website documents the standard (useful even without extension or standard adoption)
- Each layer can be adopted incrementally by different stakeholders

### 4.3 Accept-All as Default Behavior

**Source**: "I Don't Care About Cookies" controversy, Avast acquisition backlash

**What to avoid**: Defaulting to accepting all cookies. This creates reputational risk, potential dark pattern accusations, and undermines the extension's privacy credibility.

**Our approach instead**: Default to "Privacy Maximum" (essential only). Users must actively choose to accept additional categories. First-run onboarding ensures users make a conscious choice.

### 4.4 Serving Industry Over Users

**Source**: IAB TCF criticism, Belgian DPA ruling

**What to avoid**: Building tools or standards that primarily serve data processors rather than data subjects. TCF's design makes consent easier to OBTAIN, not easier to WITHHOLD.

**Our approach instead**: Every design decision prioritizes user privacy. The extension's goal is to implement the user's genuine preferences, not to maximize consent rates for publishers. Conservative defaults. Transparency about what is accepted/rejected. No data sharing with third parties.

### 4.5 Opaque Proprietary Systems

**Source**: Super Agent (proprietary, freemium), "I Don't Care About Cookies" (acquired by Avast, privacy concerns)

**What to avoid**: Closed-source consent handling where users cannot verify what the extension does. Freemium models that limit privacy protection behind a paywall. Acquisition by companies with data monetization histories.

**Our approach instead**: Fully open source (MIT or Apache 2.0). All rule files publicly auditable. No telemetry by default. No freemium limitations. No server-side dependency for core functionality.

### 4.6 Relying on a Single Regulatory Outcome

**Source**: ePrivacy Regulation's 8-year failure

**What to avoid**: Building a strategy that only works if a specific piece of legislation passes.

**Our approach instead**: The extension provides value regardless of Art. 88b's fate:
- If Art. 88b passes: extension becomes a bridge/reference implementation
- If Art. 88b fails: the problem persists and our extension is more needed than ever
- If Art. 88b is weakened: media exemption and compliance gaps ensure extensions remain relevant

### 4.7 Binary-Only Signals for EU Context

**Source**: GPC's limitation, EDPB guidance on specific consent

**What to avoid**: Implementing only binary "accept all / reject all" without per-category granularity.

**Our approach instead**: Five-category granularity as the core feature. Binary shortcuts ("Accept All" / "Reject All") exist for convenience but per-category control is the primary interaction model. This aligns with GDPR's "specific" consent requirement and differentiates us from Autoconsent (reject-only) and GPC (binary).

---

## Implementation Priority Matrix

| Concept | Source | Priority | Version | Effort |
|---------|--------|----------|---------|--------|
| 5-category taxonomy | Consent-O-Matic | Must | v1.0 | Low |
| CMP rule engine (JSON) | C-O-M + Autoconsent | Must | v1.0 | Medium |
| C-O-M compatibility layer | Autoconsent | Must | v1.0 | Medium |
| CMP API calls | TCF, CMP vendors | Must | v1.0 | Medium |
| GPC signal emission | GPC | Must | v1.0 | Low |
| Privacy-protective defaults | DNT lessons, GDPR | Must | v1.0 | Low |
| Per-domain overrides | EDPB guidelines | Must | v1.0 | Medium |
| MutationObserver (async/SPA) | Autoconsent | Should | v1.0 | Medium |
| `/.well-known/cookie-consent.json` | Original + ADPC + GPC | Should | v1.1 | Medium |
| TCF purpose mapping | IAB TCF | Should | v1.1 | Low |
| Consent history dashboard | GDPR transparency | Should | v1.1 | Medium |
| Multi-language heuristics | C-O-M + Autoconsent | Should | v1.1 | Medium |
| ADPC header emission | ADPC | Consider | v2 | Medium |
| CMP auto-generators | Original | Consider | v2 | High |
| Google Consent Mode v2 | Google | Consider | v2 | Medium |
| Art. 88b signal format | EU Digital Omnibus | Consider | v2-v3 | Unknown |
| ML-assisted detection | CookieBlock concept | Consider | v2 | High |

---

## Summary

Our implementation strategy is: **borrow proven concepts, combine them better, and design for the future.**

- **v1.0**: Rule-based CMP handling (proven by Consent-O-Matic/Autoconsent) + per-category preferences (proven by Consent-O-Matic) + GPC emission (proven by legal adoption) + privacy defaults (proven by regulatory requirements)
- **v1.1**: Open standard + TCF integration + heuristic fallback + transparency dashboard
- **v2+**: ADPC compatibility + Art. 88b alignment + ML detection + auto-generators

Each version builds on validated concepts from existing standards while adding our unique contribution: a simple, file-based open standard that bridges the gap between pragmatic extensions and the browser-native future the EU is building.
