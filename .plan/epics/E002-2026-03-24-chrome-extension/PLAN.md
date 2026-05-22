---
title: Chrome Extension + Open Standard + Website — Full Solution Design
status: pending
created: 2026-03-24
depends_on: E001
---

# E002: NoCookie — Solution Design

## 1. Problem Statement

Every website shows a cookie consent popup. Users click through hundreds of these per month, usually accepting everything because the alternative (customizing per-site) takes too long. The EU gave users the right to granular consent, but the UX makes that right impractical.

**Root cause**: There is no machine-readable standard for cookie consent. Each of 13+ CMPs implements consent differently. Extensions that solve this rely on manually-maintained CSS selector rules that break when CMPs update.

**Our solution**: Three complementary deliverables that attack the problem at every layer:
1. **Chrome Extension** -- set preferences once, auto-apply everywhere
2. **Open Standard** (`/.well-known/cookie-consent.json`) -- websites declare their consent UI for machines
3. **Website** -- document the standard, host the spec, drive adoption

---

## 2. Chrome Extension Architecture

### 2.1 Manifest V3 Structure

```
nocookie-extension/
  manifest.json
  src/
    background/
      service-worker.ts       -- orchestration, message routing, rule updates
      rule-engine.ts          -- CMP rule database management
      consent-log.ts          -- per-domain consent history
    content/
      detector.ts             -- CMP detection (runs in ISOLATED world)
      executor.ts             -- consent execution (injected into MAIN world)
      observer.ts             -- MutationObserver for async CMP loading + SPA nav
      well-known-reader.ts    -- fetch /.well-known/cookie-consent.json
    popup/
      popup.html
      popup.ts
      popup.css
    options/
      options.html
      options.ts
      options.css
    shared/
      types.ts                -- shared interfaces
      categories.ts           -- category taxonomy constants
      messages.ts             -- message type definitions
      storage.ts              -- chrome.storage wrapper
    rules/
      builtin/                -- bundled CMP rules (top 9 CMPs)
        onetrust.json
        cookiebot.json
        didomi.json
        quantcast.json
        trustarc.json
        cookieyes.json
        complianz.json
        osano.json
        consentmanager.json
      schema.ts               -- rule format type definitions
  assets/
    icons/                    -- 16, 32, 48, 128px icons in multiple states
  _locales/                   -- i18n messages
```

### 2.2 Manifest V3 Permissions

```json
{
  "manifest_version": 3,
  "name": "NoCookie",
  "version": "0.1.0",
  "description": "Set cookie preferences once. Auto-apply everywhere.",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "src/background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/detector.js", "src/content/observer.js"],
      "run_at": "document_idle",
      "world": "ISOLATED"
    }
  ],
  "action": {
    "default_popup": "src/popup/popup.html",
    "default_icon": {
      "16": "assets/icons/default-16.png",
      "32": "assets/icons/default-32.png",
      "48": "assets/icons/default-48.png",
      "128": "assets/icons/default-128.png"
    }
  },
  "options_page": "src/options/options.html",
  "icons": {
    "16": "assets/icons/default-16.png",
    "48": "assets/icons/default-48.png",
    "128": "assets/icons/default-128.png"
  }
}
```

### 2.3 Content Script Design

Two execution contexts are required:

**ISOLATED world (detector.ts + observer.ts)**:
- Runs automatically on every page via manifest `content_scripts`
- Sets up `MutationObserver` watching for CMP DOM elements
- Checks for known DOM selectors (`#onetrust-consent-sdk`, `#CybotCookiebotDialog`, etc.)
- Checks for known script URLs in `<script>` tags
- Sends detection results to background service worker via `chrome.runtime.sendMessage`
- Cannot access page JS objects (`window.OneTrust`, etc.) -- that is the executor's job

**MAIN world (executor.ts)**:
- Injected dynamically by the background service worker via `chrome.scripting.executeScript({ world: 'MAIN' })`
- Only injected after detection confirms a CMP is present
- Has full access to page's `window` object -- can call `OneTrust.AllowAll()`, `Cookiebot.submitCustomConsent()`, etc.
- Receives user preferences and CMP identity as parameters
- Executes the consent action and reports result back via `window.postMessage`
- The ISOLATED content script listens for this postMessage and relays to background

**Why two worlds**: Manifest V3 content scripts run in an isolated world by default. CMP JavaScript APIs live on the page's `window` object. We must inject into MAIN world to call them, but we keep detection in ISOLATED world for security (no page script can interfere with detection logic).

### 2.4 Background Service Worker

Responsibilities:
1. **Message routing** -- receives detection results from content scripts, decides action
2. **Preference lookup** -- reads user preferences from `chrome.storage.sync`
3. **Rule matching** -- matches detected CMP to a rule set
4. **Executor dispatch** -- injects MAIN world script with correct parameters
5. **Badge/icon update** -- sets extension icon state based on outcome
6. **Consent logging** -- records what happened per domain in `chrome.storage.local`
7. **Well-known check** -- triggers fetch of `/.well-known/cookie-consent.json` for the domain
8. **Rule updates** -- periodically checks for updated CMP rules (from GitHub or bundled)

Message flow:
```
Page loads
  -> detector.ts (ISOLATED): scans DOM, finds CMP
  -> chrome.runtime.sendMessage({ type: 'CMP_DETECTED', cmp: 'onetrust', domain: '...' })
  -> service-worker.ts: looks up user prefs + CMP rule
  -> chrome.scripting.executeScript({ world: 'MAIN', func: executeConsent, args: [prefs, rule] })
  -> executor.ts (MAIN): calls OneTrust.RejectAll() or custom consent
  -> window.postMessage({ type: 'CONSENT_RESULT', success: true, actions: [...] })
  -> detector.ts (ISOLATED): relays result to background
  -> service-worker.ts: updates badge, logs result
```

### 2.5 CMP Detection Engine (Layered)

Detection runs in priority order. First match wins.

**Layer 1 -- Well-Known Standard** (highest priority, most reliable):
- Fetch `https://{domain}/.well-known/cookie-consent.json`
- If exists and valid: use declared CMP type, selectors, and categories
- Cache result per domain in `chrome.storage.local` (TTL: 24h)
- This is our open standard -- gives perfect information

**Layer 2 -- JavaScript API probing** (requires MAIN world):
- Check for known global objects: `window.OneTrust`, `window.Cookiebot`, `window.Didomi`, etc.
- Most reliable detection for known CMPs
- Must be injected after page scripts have loaded
- Use a lightweight probe script (not the full executor)

**Layer 3 -- DOM selectors**:
- Check for known CMP container elements:
  - `#onetrust-consent-sdk` -> OneTrust
  - `#CybotCookiebotDialog` -> Cookiebot
  - `#didomi-host` -> Didomi
  - `.qc-cmp2-ui` -> Quantcast
  - `#truste-consent-track` -> TrustArc
  - `.cky-consent-container` -> CookieYes
  - `.cc-window` -> Osano
  - `.cmplz-cookiebanner` -> Complianz
  - `#cmpbox` -> consentmanager
- Can run from ISOLATED world
- Fast, but selectors may change across CMP versions

**Layer 4 -- Script URL detection**:
- Scan `<script>` elements for known CMP CDN URLs:
  - `cdn.cookielaw.org` -> OneTrust
  - `consent.cookiebot.com` -> Cookiebot
  - `sdk.privacy-center.org` -> Didomi
  - `quantcast.mgr.consensu.org` -> Quantcast
  - etc.
- Good secondary signal, especially before CMP DOM renders

**Layer 5 -- Autoconsent library** (broad coverage):
- If no well-known file, no native rule, and no JS API/DOM match, delegate to autoconsent
- Autoconsent covers 100+ CMPs with tested rules (see section 2.8)
- Preference mapping via `AutoconsentAdapter`
- Confidence: medium-high (autoconsent rules are actively maintained)

**Layer 6 -- Generic heuristic fallback** (lowest priority):
- Look for elements with common consent-related attributes:
  - Buttons containing text: "Accept All", "Reject All", "I Agree", "Alle akzeptieren", etc.
  - Fixed/sticky positioned overlays with cookie-related text
  - Elements with `role="dialog"` or `aria-label` containing "cookie" / "consent"
- Multi-language text matching (EN, DE, FR, ES, PL, NL, IT at minimum)
- Lowest confidence -- used only when no CMP is identified

### 2.6 Consent Execution Engine

Once a CMP is identified and user preferences are known, execution proceeds:

**Strategy 1 -- API call** (preferred):
```
OneTrust:    OneTrust.AllowAll() | OneTrust.RejectAll() | OneTrust.UpdateConsent()
Cookiebot:   Cookiebot.submitCustomConsent(prefs, stats, marketing)
Didomi:      Didomi.setUserAgreeToAll() | Didomi.setUserDisagreeToAll()
CookieYes:   performBannerAction("accept_all") | performBannerAction("reject")
```

**Strategy 2 -- Click simulation** (fallback):
- Use known button selectors from the rule database
- Wait for element visibility with `MutationObserver` + timeout
- Dispatch `click` event on the target element
- For per-category: open preference center, set toggles, click save

**Strategy 3 -- TCF API** (for TCF-compliant CMPs without specific rules):
- Use `__tcfapi('ping')` to confirm TCF CMP
- Cannot SET consent via TCF API (read-only), but can detect CMP type from ping data
- Then fall back to click simulation for that CMP type

**Strategy 4 -- Generic heuristic** (last resort):
- Find buttons by text content matching
- Priority: "Reject All" > "Decline" > "Necessary Only" > "Accept All" (based on user pref)
- Very low confidence -- log as "heuristic" in consent history

**Preference mapping**: The extension stores user preferences as 5 booleans:
```typescript
interface UserPreferences {
  essential: true;       // always true, not configurable
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  socialMedia: boolean;
}
```

Each CMP rule includes a mapping from our categories to the CMP's categories/actions:
```typescript
interface CMPRule {
  name: string;
  detection: DetectionSignals;
  categoryMapping: {
    functional: string;   // e.g., "C0003" for OneTrust, "preferences" for Cookiebot
    analytics: string;    // e.g., "C0002" for OneTrust, "statistics" for Cookiebot
    marketing: string;    // e.g., "C0004" for OneTrust, "marketing" for Cookiebot
    socialMedia?: string; // e.g., "C0005" for OneTrust
  };
  actions: {
    acceptAll: ActionSequence;
    rejectAll: ActionSequence;
    custom: ActionSequence;  // open prefs -> set toggles -> save
  };
}
```

### 2.8 Autoconsent Integration

**Architectural change**: Rather than building CMP detection and execution rules from scratch for each CMP, we wrap DuckDuckGo's `@duckduckgo/autoconsent` library as our primary CMP interaction engine. This gives us 100+ CMP rules immediately.

**Why autoconsent**: The E001 research (SUMMARY.md) explicitly recommends: "Use autoconsent as foundation -- it's more modern, has better architecture, and already includes Consent-O-Matic compatibility." Building equivalent coverage from scratch would take months and duplicate work that is already open-source and actively maintained.

**Integration architecture**:
```
Detection Priority (unchanged):
  1. /.well-known/cookie-consent.json  (our standard, highest priority)
  2. Our native CMP rules              (for CMPs we want custom handling)
  3. Autoconsent library                (100+ CMPs, bulk coverage)
  4. Generic heuristic fallback         (unknown CMPs)
```

**How it works**:
- Import `@duckduckgo/autoconsent` as a dependency
- Wrap it in an adapter layer (`AutoconsentAdapter`) that translates between autoconsent's action model and our preference-based model
- Map our 5-category `UserPreferences` to autoconsent's opt-in/opt-out actions per CMP
- Our native rules (T08-T10) take priority when both we and autoconsent have rules for a CMP
- Autoconsent handles the long tail of CMPs we have not written custom rules for

**What this changes for existing tasks**:
- T08/T09/T10 (OneTrust, Cookiebot, Didomi) become: "verify autoconsent works with this CMP + write integration tests + add custom per-category preference mapping if autoconsent's default is insufficient"
- T18/T19 (additional CMPs) become: "verify autoconsent coverage + write integration tests for these CMPs" instead of writing rules from scratch
- T06 (rule engine) still exists but now also manages the autoconsent adapter as a rule source

**Preference mapping challenge**: Autoconsent primarily supports opt-out (reject all non-essential). Our differentiator is per-category control. The adapter must:
1. Check if autoconsent's rule for a CMP supports per-category actions
2. If yes: map our categories to the CMP's categories via autoconsent
3. If no: fall back to binary accept/reject based on user profile, then log as "partial" consent

### 2.9 GPC Header Emission

**What**: When the user's profile rejects marketing cookies (Privacy Maximum, Balanced, or custom with `marketing: false`), the extension emits the Global Privacy Control signal on all requests.

**Legal significance**: GPC is legally enforceable in 12 US states (California, Colorado, Connecticut, Delaware, Indiana, Iowa, Montana, New Hampshire, New Jersey, Oregon, Tennessee, Texas). California AB 566 mandates browser-level GPC support by January 2027. Emitting GPC alongside CMP-level consent provides defense-in-depth.

**Implementation**:
1. **HTTP header**: Use `chrome.declarativeNetRequest` to add `Sec-GPC: 1` header to all outgoing requests when GPC is enabled
2. **JavaScript property**: Inject `navigator.globalPrivacyControl = true` via content script in MAIN world
3. **User control**: GPC emission is tied to the user's marketing preference. When marketing is rejected, GPC is on. Users can override this in Advanced settings.

**Manifest permission**: Requires adding `"declarativeNetRequest"` to the permissions array and `"declarativeNetRequestWithHostAccess"` for dynamic rule creation.

```typescript
// GPC rule (declarativeNetRequest)
{
  id: 1,
  priority: 1,
  action: {
    type: 'modifyHeaders',
    requestHeaders: [
      { header: 'Sec-GPC', operation: 'set', value: '1' }
    ]
  },
  condition: {
    urlFilter: '*',
    resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'script', 'image']
  }
}
```

### 2.7 User Preference Storage

Uses `chrome.storage.sync` for cross-device sync:

```typescript
interface StorageSchema {
  // Global preferences
  preferences: UserPreferences;
  profile: 'privacy-max' | 'balanced' | 'allow-analytics' | 'accept-all' | 'custom';

  // Per-domain overrides
  domainOverrides: Record<string, {
    mode: 'whitelist' | 'blacklist' | 'custom';
    preferences?: UserPreferences;
  }>;

  // Settings
  settings: {
    autoConsent: boolean;         // master on/off
    consentDelay: number;         // ms to wait before acting (default: 500)
    showNotifications: boolean;   // badge notifications
    logConsent: boolean;          // keep consent history
    enableHeuristics: boolean;    // allow generic fallback
  };
}
```

Uses `chrome.storage.local` for per-device data:

```typescript
interface LocalStorageSchema {
  // Consent history (per domain)
  consentLog: Record<string, {
    domain: string;
    cmp: string | null;
    method: 'api' | 'click' | 'tcf' | 'heuristic' | 'well-known';
    categoriesAccepted: string[];
    categoriesRejected: string[];
    timestamp: number;
    confidence: 'high' | 'medium' | 'low';
  }>;

  // Well-known cache
  wellKnownCache: Record<string, {
    data: WellKnownCookieConsent | null;
    fetchedAt: number;
    ttl: number;
  }>;

  // Statistics
  stats: {
    popupsHandled: number;
    popupsByCategory: Record<string, number>;
    popupsByCmp: Record<string, number>;
    firstInstall: number;
  };
}
```

---

## 3. Extension UI Design

### 3.1 Popup (Extension Icon Click)

The popup is the primary interaction surface. It shows the current page's status at a glance.

**Layout (top to bottom)**:

```
+--------------------------------------+
|  NoCookie          [gear]    |
+--------------------------------------+
|  example.com                         |
|  [green circle] Popup handled        |
|  CMP: OneTrust | Method: API        |
+--------------------------------------+
|  Accepted:                           |
|    [x] Essential (always on)         |
|    [x] Functional                    |
|    [ ] Analytics                     |
|    [ ] Marketing                     |
+--------------------------------------+
|  Profile: [Privacy Maximum    v]     |
+--------------------------------------+
|  [Override for this site...]         |
|  [View consent history]             |
+--------------------------------------+
```

**States**:

1. **Popup handled** (green) -- consent was auto-applied successfully
   - Shows which categories were accepted/rejected
   - Shows CMP name and method used
   - Shows confidence level if heuristic

2. **No popup detected** (gray) -- no CMP found on this page
   - "No cookie popup detected on this page"
   - Could mean: no CMP, already consented, or CMP not recognized

3. **Popup needs attention** (yellow) -- CMP found but could not auto-handle
   - "Cookie popup detected but could not be handled automatically"
   - "Click to handle manually" button
   - "Report this site" link

4. **Error** (red) -- something went wrong
   - Error description
   - "Retry" button
   - "Report issue" link

5. **Disabled** (gray, muted) -- extension is off for this domain
   - "Extension disabled for this site"
   - "Enable" button

6. **Scanning** (blue/animated) -- CMP detection is in progress
   - "Detecting cookie popup..." with a subtle spinner/pulse animation
   - Shown between page load and CMP detection completion
   - If no CMP detected after configurable timeout (default: 5s), transitions to "No popup detected"
   - Reassurance text: "The extension is actively checking this page"

**Quick actions in popup**:
- Profile dropdown (switch between presets without opening options)
- "Override for this site" -- opens inline domain-specific settings
- Gear icon -> opens full options page

### 3.2 Options/Settings Page

Full-page settings organized in tabs/sections:

**Tab 1: Preferences**

```
Cookie Preferences
==================

Profile: [dropdown: Privacy Maximum | Balanced | Allow Analytics | Accept All | Custom]

Category Toggles:
  [x] Essential        (locked, always on)    [info icon]
  [ ] Functional       [toggle]               [info icon]
  [ ] Analytics        [toggle]               [info icon]
  [ ] Marketing        [toggle]               [info icon]
  [ ] Social Media     [toggle]               [info icon]

Each [info icon] expands to show:
  - What this category includes
  - Examples of cookies in this category
  - Privacy impact (low/medium/high)
```

**Preset profiles**:

| Profile | Essential | Functional | Analytics | Marketing | Social Media |
|---------|:-:|:-:|:-:|:-:|:-:|
| Privacy Maximum | On | Off | Off | Off | Off |
| Balanced | On | On | Off | Off | Off |
| Allow Analytics | On | On | On | Off | Off |
| Accept All | On | On | On | On | On |
| Custom | On | user | user | user | user |

Selecting a preset sets the toggles. Manually changing a toggle switches profile to "Custom".

**Tab 2: Site Overrides**

```
Site-Specific Rules
===================

[+ Add override]

| Domain            | Mode       | Action        |
|-------------------|------------|---------------|
| mybank.com        | Accept All | [edit] [del]  |
| ads-heavy.com     | Reject All | [edit] [del]  |
| news-site.com     | Custom     | [edit] [del]  |

Edit modal:
  Domain: [input]
  Mode: [Whitelist (accept all) | Blacklist (reject all) | Custom | Disabled]
  Custom categories: [same toggles as main prefs]
```

**Tab 3: Advanced**

```
Advanced Settings
=================

Auto-consent: [toggle, default ON]
  When off, extension detects but does not act. Shows popup notification instead.

Consent delay: [slider 0-2000ms, default 500]
  How long to wait after CMP detection before acting.
  Lower = faster but may act before CMP is fully loaded.
  Higher = more reliable but user sees popup briefly.

Enable heuristic fallback: [toggle, default ON]
  When on, tries generic button text matching for unknown CMPs.
  When off, only acts on known CMPs.

Show notifications: [toggle, default ON]
  Badge icon updates when consent is handled.

Log consent actions: [toggle, default ON]
  Keep history of consent actions per site.

Enable well-known standard: [toggle, default ON]
  Check for /.well-known/cookie-consent.json on each domain.
```

**Tab 4: Statistics**

```
Statistics
==========

Popups handled:     1,247
  This week:          42
  This month:        189

By method:
  API call:         623 (50%)
  Click simulation: 412 (33%)
  Heuristic:        167 (13%)
  Well-known:        45 (4%)

By CMP:
  OneTrust:         312
  Cookiebot:        278
  Unknown:          167
  Didomi:           134
  ...

By category:
  Essential only:   834 (67%)
  + Functional:     245 (20%)
  + Analytics:      123 (10%)
  Accept all:        45 (3%)
```

**Tab 5: About**

- Version, links to GitHub, website, standard spec
- "Report an issue" link
- "Contribute CMP rules" link
- License information

### 3.3 Badge/Icon States

Four icon variants (each in 16/32/48/128px):

| State | Icon | Badge | Meaning |
|-------|------|-------|---------|
| Default | Shield (neutral gray) | -- | No popup on this page |
| Handled | Shield (green) | Checkmark | Consent auto-applied |
| Needs attention | Shield (yellow) | ! | Popup found, could not handle |
| Error | Shield (red) | X | Error during consent |
| Disabled | Shield (gray, muted) | -- | Extension off for this domain |

The badge text can optionally show the number of categories accepted (e.g., "1" for essential-only, "4" for all).

### 3.4 First-Run Onboarding Flow

**Why this is required**: The legal analysis (E001-T04) explicitly states that consent given on the user's behalf must be "informed" -- the user must understand what the extension does and actively choose a profile. Without onboarding, user activation is critically low (design review finding) and we risk the consent not being legally valid.

**Flow**:

```
Step 1: Welcome
+--------------------------------------+
|  [shield icon]                       |
|  Welcome to NoCookie         |
|                                      |
|  Cookie popups are about to become   |
|  a thing of the past. Let's set up   |
|  your preferences in 15 seconds.     |
|                                      |
|           [Get Started ->]           |
+--------------------------------------+

Step 2: Choose Profile
+--------------------------------------+
|  How much do you care about          |
|  cookie privacy?                     |
|                                      |
|  [card] Privacy Maximum              |
|    Only essential cookies.           |
|    Maximum privacy protection.       |
|                                      |
|  [card] Balanced (recommended)       |
|    Essential + functional cookies.   |
|    Good privacy, sites work well.    |
|                                      |
|  [card] Accept All                   |
|    Accept everything. Sites get      |
|    full functionality.               |
|                                      |
|  [link] I want to customize ->       |
+--------------------------------------+

Step 3 (optional): Customize Categories
+--------------------------------------+
|  Fine-tune your preferences          |
|                                      |
|  [x] Essential (always on)           |
|      Session, auth, security         |
|                                      |
|  [ ] Functional     [toggle]         |
|      Language, region, UI prefs      |
|                                      |
|  [ ] Analytics      [toggle]         |
|      Page views, performance         |
|                                      |
|  [ ] Marketing      [toggle]         |
|      Ad targeting, retargeting       |
|                                      |
|  [ ] Social Media   [toggle]         |
|      Social sharing, embeds          |
|                                      |
|           [Save & Continue ->]       |
+--------------------------------------+

Step 4: Done
+--------------------------------------+
|  [animated shield turning green]     |
|                                      |
|  You're all set!                     |
|                                      |
|  Profile: Balanced                   |
|  Accepting: Essential + Functional   |
|  Rejecting: Analytics, Marketing,    |
|             Social Media             |
|                                      |
|  Cookie popups will now be handled   |
|  automatically. Click the extension  |
|  icon anytime to see what happened.  |
|                                      |
|           [Start Browsing]           |
+--------------------------------------+
```

**Technical implementation**:
- Opens as a new tab via `chrome.tabs.create()` triggered by `chrome.runtime.onInstalled` listener
- Onboarding page is `src/onboarding/onboarding.html`
- Profile selection is stored to `chrome.storage.sync` immediately
- If user closes tab without completing, extension uses "Privacy Maximum" as default (privacy-protective)
- A flag `onboardingCompleted: boolean` in storage prevents re-showing on browser restart

### 3.5 Consent Dashboard Page

**What**: A dedicated `dashboard.html` page in the extension (accessible from popup "View consent history" link and options page) that shows a comprehensive view of all consent actions the extension has taken.

**Audience**: Power users, privacy enthusiasts, and anyone who wants to verify what the extension is doing on their behalf.

**Layout**:

```
+------------------------------------------------------+
|  Consent Dashboard                    [Export v]      |
+------------------------------------------------------+
|  Summary:  1,247 popups handled across 412 sites     |
|  Profile:  Balanced                                   |
+------------------------------------------------------+
|  [Search: filter by domain...] [Filter: All CMPs v]  |
+------------------------------------------------------+
|  example.com              visited 47x                 |
|    CMP: OneTrust | Method: API | Confidence: High    |
|    Accepted: Essential, Functional                    |
|    Rejected: Analytics, Marketing, Social Media       |
|    Last handled: 2 hours ago                          |
|    [Change preferences for this site]                 |
|  --------------------------------------------------- |
|  news-site.com            visited 23x                 |
|    CMP: Cookiebot | Method: Click | Confidence: High |
|    Accepted: Essential, Functional, Analytics         |
|    Rejected: Marketing                                |
|    Last handled: 1 day ago                            |
|    [Change preferences for this site]                 |
|  --------------------------------------------------- |
|  blog.example.org         visited 5x                  |
|    CMP: Unknown | Method: Heuristic | Confidence: Low|
|    Accepted: Essential only                           |
|    Last handled: 3 days ago                           |
|    [Change preferences for this site]                 |
+------------------------------------------------------+
|  Page 1 of 42            [< Prev] [Next >]           |
+------------------------------------------------------+
```

**Features**:
- **Sort**: by visit frequency (most visited first, using `chrome.history` API), by date (most recent first), by CMP, by confidence level
- **Filter**: by CMP name, by method (API/click/heuristic/well-known), by confidence, by category (e.g., "show me sites where marketing is enabled")
- **Search**: filter by domain name
- **Per-site actions**: change preferences for a specific site (creates a domain override), re-consent (clear cookies + reload), disable extension for site
- **Export**: download consent log as JSON or CSV for personal records or compliance purposes
- **Requires permission**: `chrome.history` (read-only) for visit frequency. This permission is requested lazily only when user opens the dashboard, not at install time.

**Data source**: reads from `chrome.storage.local` `consentLog` entries, enriched with `chrome.history` visit counts.

---

## 4. Open Standard Design

### 4.1 Specification: `/.well-known/cookie-consent.json`

**Design principles** (learning from ADPC's failure):
- Dead simple -- a single JSON file, no HTTP headers, no browser API
- Self-contained -- all information in one file
- Progressive -- start minimal, extend via optional fields
- Human-readable -- website owner can write it by hand in 5 minutes
- Machine-readable -- extension and AI agents can parse it trivially

**Minimal valid file** (4 lines):

```json
{
  "version": "1.0",
  "categories": ["essential", "analytics", "marketing"]
}
```

**Full specification**:

```json
{
  "version": "1.0",
  "categories": ["essential", "functional", "analytics", "marketing", "social-media"],
  "cmp": {
    "name": "onetrust",
    "version": "6.38.0"
  },
  "selectors": {
    "banner": "#onetrust-banner-sdk",
    "acceptAll": "#onetrust-accept-btn-handler",
    "rejectAll": "#onetrust-reject-all-handler",
    "preferences": "#onetrust-pc-btn-handler",
    "save": ".save-preference-btn-handler"
  },
  "categorySelectors": {
    "functional": {
      "toggle": "#ot-group-id-C0003",
      "cmpId": "C0003"
    },
    "analytics": {
      "toggle": "#ot-group-id-C0002",
      "cmpId": "C0002"
    },
    "marketing": {
      "toggle": "#ot-group-id-C0004",
      "cmpId": "C0004"
    },
    "social-media": {
      "toggle": "#ot-group-id-C0005",
      "cmpId": "C0005"
    }
  },
  "api": {
    "type": "onetrust",
    "acceptAll": "OneTrust.AllowAll()",
    "rejectAll": "OneTrust.RejectAll()",
    "setCategory": "OneTrust.UpdateConsent('Category', '{cmpId}:{value}')"
  },
  "gpc": true,
  "tcf": true,
  "contact": "privacy@example.com",
  "policyUrl": "https://example.com/cookie-policy"
}
```

### 4.2 JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Cookie Consent Declaration",
  "type": "object",
  "required": ["version", "categories"],
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+$",
      "description": "Spec version (semver major.minor)"
    },
    "categories": {
      "type": "array",
      "items": {
        "enum": ["essential", "functional", "analytics", "marketing", "social-media"]
      },
      "contains": { "const": "essential" },
      "description": "Cookie categories used on this site"
    },
    "cmp": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "version": { "type": "string" }
      }
    },
    "selectors": {
      "type": "object",
      "properties": {
        "banner": { "type": "string" },
        "acceptAll": { "type": "string" },
        "rejectAll": { "type": "string" },
        "preferences": { "type": "string" },
        "save": { "type": "string" }
      }
    },
    "categorySelectors": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "toggle": { "type": "string" },
          "cmpId": { "type": "string" }
        }
      }
    },
    "api": {
      "type": "object",
      "properties": {
        "type": { "type": "string" },
        "acceptAll": { "type": "string" },
        "rejectAll": { "type": "string" },
        "setCategory": { "type": "string" }
      }
    },
    "gpc": { "type": "boolean" },
    "tcf": { "type": "boolean" },
    "contact": { "type": "string", "format": "email" },
    "policyUrl": { "type": "string", "format": "uri" }
  }
}
```

### 4.3 Versioning Strategy

- **v1.0** -- initial spec (categories, optional selectors, optional CMP info)
- **v1.x** -- backward-compatible additions (new optional fields)
- **v2.0** -- breaking changes (if ever needed, new required fields)
- Parsers must ignore unknown fields (forward-compatible)
- `version` field uses `major.minor` only

### 4.4 Adoption Path

1. **Zero friction**: website owner creates a single JSON file, hosts at `/.well-known/`
2. **CMP plugins**: create plugins for OneTrust, Cookiebot, etc. that auto-generate the file
3. **WordPress plugin**: one-click generation for Complianz/CookieYes users
4. **AI generation**: AI agents read the spec and generate the file from existing CMP config
5. **Validator**: online tool to validate a site's cookie-consent.json

---

## 5. AI Agent Instructions File

### 5.1 Format and Location

Two complementary files:

**`/.well-known/cookie-consent.json`** -- the machine-readable standard (section 4 above).
This serves both browser extensions and AI agents.

**`/cookie-consent-instructions.md`** -- human/AI-readable implementation guide.
Similar in spirit to `llms.txt` -- a markdown file that an AI agent (like a web developer copilot) can read to understand how to implement the standard on a site.

### 5.2 Content of `cookie-consent-instructions.md`

```markdown
# Cookie Consent Implementation Instructions

This file helps AI agents implement the Cookie Consent Open Standard on this website.

## Current Setup
- CMP: OneTrust v6.38.0
- Categories: essential, functional, analytics, marketing
- TCF: enabled
- GPC: respected

## How to Generate cookie-consent.json
1. Identify the CMP in use (check for script tags, global objects)
2. Map the CMP's categories to the standard taxonomy
3. Find the banner, accept, reject, preferences selectors
4. Create /.well-known/cookie-consent.json following the schema at:
   https://nocookie.zentala.io/standard/v1/schema.json

## Quick Start
Copy this template and fill in your site's values:
[template here]
```

### 5.3 Discovery

AI agents discover the spec via:
1. Direct URL: `/.well-known/cookie-consent.json` (convention)
2. HTML meta tag: `<link rel="cookie-consent" href="/.well-known/cookie-consent.json">`
3. Reference in `robots.txt`: `Cookie-Consent: /.well-known/cookie-consent.json`
4. Reference in `llms.txt` if the site has one

---

## 6. Website Architecture

### 6.1 Site Map

```
nocookie.zentala.io/
  /                           -- Landing page (hero, what/why/how)
  /extension                  -- Download page (Chrome Web Store link, screenshots)
  /standard                   -- Standard overview (why, quick start)
  /standard/v1                -- Full v1 specification
  /standard/v1/schema.json    -- JSON Schema (downloadable)
  /standard/v1/examples       -- Example files for each CMP
  /guide                      -- Implementation guide for website owners
  /guide/onetrust             -- OneTrust-specific guide
  /guide/cookiebot            -- Cookiebot-specific guide
  /guide/wordpress            -- WordPress guide
  /guide/ai                   -- Guide for AI agents
  /validator                  -- Online validator + generator (see 6.4)
  /faq                        -- FAQ + legal information
  /blog                       -- Updates, adoption metrics, CMP coverage
  /.well-known/cookie-consent.json  -- Dog-fooding: our own site uses the standard
```

### 6.2 Tech Stack

- **Hosting**: Cloudflare Pages (static site)
- **Framework**: Astro (static site generator, minimal JS, excellent DX)
- **Styling**: Tailwind CSS
- **Validator**: client-side JS (fetch URL, validate against schema, report)
- **Analytics**: Plausible or Fathom (privacy-respecting, no cookie needed)
- **Domain**: `nocookie.zentala.io` or `cookie-consent.org` (TBD)

### 6.3 Landing Page Structure

1. **Hero**: "Set your cookie preferences once. We handle the rest."
   - Extension screenshot, install button
   - 3 bullet points: works now (extension), works better (standard), works everywhere (AI)
2. **Problem**: "You click through 50+ cookie popups per week"
3. **Solution**: Extension demo (animated GIF/video)
4. **Open Standard**: "Website owners: make consent machine-readable"
5. **For developers**: Link to spec, schema, implementation guide
6. **Stats**: (when available) "X popups handled, Y sites support the standard"
7. **Footer**: GitHub, privacy policy, contact

### 6.4 Online Validator/Generator Tool

**Location**: `nocookie.zentala.io/validator`

**Critical for adoption**: Website owners need a tool to create and validate `cookie-consent.json` files. Without this, the "For Website Owners" adoption story has no endpoint (design review finding). This is the conversion funnel for standard adoption.

**Two modes**:

**Validator mode** (default):
1. User enters a URL (e.g., `https://example.com`)
2. Tool fetches `https://example.com/.well-known/cookie-consent.json`
3. Validates against the JSON Schema
4. Shows results: valid/invalid, field-by-field breakdown, warnings for optional fields, suggestions for improvement
5. If 404: shows "No file found. Use Generator mode to create one."

**Generator mode**:
1. User selects their CMP from a dropdown (OneTrust, Cookiebot, Didomi, etc.) or "Custom/Unknown"
2. Form pre-fills known selectors and API patterns for that CMP
3. User fills in remaining fields: categories, additional selectors, policy URL, contact
4. Live preview of the JSON output updates as user fills the form
5. "Copy to clipboard" and "Download as file" buttons
6. Deployment instructions: "Place this file at `/.well-known/cookie-consent.json` on your web server"

**Implementation**: Runs entirely client-side (no backend). Uses the same `packages/schema/` validator library as the extension (T17). Built as an Astro page with interactive client-side JS.

---

## 7. Content Strategy

### 7.1 Documentation Needed

| Document | Audience | Purpose |
|----------|----------|---------|
| Standard spec (v1) | Developers | Full technical specification |
| Quick-start guide | Website owners | 5-minute implementation |
| CMP-specific guides | Website owners using specific CMPs | Step-by-step per CMP |
| WordPress guide | WP site owners | Plugin or manual setup |
| AI agent guide | AI dev tools | How to auto-implement |
| Extension user guide | End users | How to configure preferences |
| Contribution guide | OSS contributors | How to add CMP rules |
| FAQ | Everyone | Common questions |

### 7.2 Framing

**For users**: "The EU gave you the right to choose which cookies you accept. We give you the tool to exercise that right without clicking through popups."

**For website owners**: "Your visitors want control. The standard makes your consent UI machine-readable -- better UX for users who use assistive tools, and proof of compliance transparency."

**For developers**: "Like robots.txt for cookie consent. One JSON file, 5 minutes to implement, works with any CMP."

### 7.3 Non-Technical Explanation

For website owners who are not developers:
- "Create a small text file on your website that describes your cookie popup"
- "It is like a label on a food package -- lists ingredients so tools can read them"
- "Your CMP plugin may generate it automatically"
- "No code changes to your existing cookie popup needed"

---

## 8. Data Flow Diagrams

### 8.1 User Visits Page (Extension Flow)

```
User navigates to example.com
         |
         v
  [Content Script: detector.ts]
         |
    +----+----+
    |         |
    v         v
 Check      Check DOM
well-known  selectors
    |         |
    +----+----+
         |
         v
   CMP identified?
    /          \
  Yes           No
   |             |
   v             v
 Load rule    Heuristic scan
   |             |
   v             v
  [Background: service-worker.ts]
   - Read user prefs from storage
   - Check domain overrides
   - Select execution strategy
         |
         v
  [Inject executor.ts into MAIN world]
   - Call CMP API (preferred)
   - OR click simulation (fallback)
   - OR generic button matching (last resort)
         |
         v
   Report result to background
         |
         v
  [Background: update state]
   - Set badge icon (green/yellow/red)
   - Log consent action
   - Update statistics
```

### 8.2 Website Owner Implements Standard

```
Website owner decides to adopt standard
         |
         v
  Identify CMP in use (OneTrust, Cookiebot, etc.)
         |
         v
  Use generator tool OR write manually
         |
         v
  Create /.well-known/cookie-consent.json
   {
     "version": "1.0",
     "categories": ["essential", "analytics", "marketing"],
     "cmp": { "name": "cookiebot" },
     "selectors": { "acceptAll": "#CybotCookiebotDialogBodyButtonAccept", ... }
   }
         |
         v
  Deploy to web server
         |
         v
  Validate at nocookie.zentala.io/validator
         |
         v
  Extension users get perfect consent handling on this site
```

### 8.3 AI Agent Implements Standard

```
AI agent (copilot, Claude, GPT, etc.) is asked:
  "Add cookie consent machine-readability to my site"
         |
         v
  Agent reads spec at nocookie.zentala.io/standard/v1
  Agent reads /cookie-consent-instructions.md on the site
         |
         v
  Agent inspects the site:
   - Detects CMP (script tags, DOM)
   - Identifies categories from CMP config
   - Finds button selectors
         |
         v
  Agent generates /.well-known/cookie-consent.json
         |
         v
  Agent validates against schema
         |
         v
  Agent deploys the file
```

---

## 9. Ten Additional Considerations

### 9.1 Internationalization (i18n)

The extension UI must support multiple languages. The heuristic detector must match consent button text in at least: English, German, French, Spanish, Polish, Dutch, Italian, Portuguese, Swedish, Danish, Norwegian, Finnish, Czech, Romanian, Hungarian, Greek. Use `chrome.i18n` API with `_locales/` directory. CMP button text patterns must be multi-language.

### 9.2 Accessibility

The extension popup and options page must be keyboard-navigable and screen-reader friendly. Use semantic HTML, ARIA labels, sufficient color contrast. The traffic-light icon states should not rely solely on color (add shape/text distinction). The open standard should include an `aria` field for accessibility attributes of consent elements.

**Specific requirements from design review (P1)**:
- All toggle switches must have `role="switch"`, `aria-checked` state, and visible focus indicators
- Status indicators must use shape/icon differentiation per state (checkmark for handled, exclamation for attention, X for error, dash for none) -- not just color
- Gear button and all icon-only buttons must have `aria-label`
- Info expand/collapse buttons must have `aria-expanded` and `aria-controls` attributes
- All expandable sections must be keyboard-operable (Enter/Space to toggle)
- Color contrast must meet WCAG AA for all text (4.5:1 for normal text, 3:1 for large text)
- Onboarding flow must be fully keyboard-navigable

**Cross-cutting**: Accessibility is not a separate feature -- it must be applied to ALL UI work (popup, options, onboarding, dashboard). Task T30 handles the audit and fixes, but each UI task (T13-T15, T27-T28) must implement accessible markup from the start.

### 9.3 Performance Impact

The content script runs on every page. It must be lightweight:
- Detector script should be under 10KB minified
- DOM scanning should complete in under 50ms
- MutationObserver should be targeted (watch `body` direct children, not entire subtree)
- Well-known fetch should use `cache: 'force-cache'` and respect HTTP cache headers
- No impact on pages without CMPs (early exit after quick scan)

### 9.4 Update Mechanism for CMP Rules

CMP vendors update their DOM and APIs. Rules will break. Strategy:
- Ship bundled rules with extension (works offline)
- Check a GitHub-hosted `rules-manifest.json` weekly for updates
- Users can force-refresh rules from options page
- Community can submit rule updates via GitHub PRs
- Track CMP detection failure rates to identify broken rules proactively

### 9.5 Telemetry (Privacy-Respecting)

No tracking of browsing history. No PII collection. Optional, anonymous, aggregate stats:
- Extension can report (opt-in only): CMP detection counts, success/failure rates, unknown CMP encounters
- This feeds back into rule improvement prioritization
- Use differential privacy techniques if aggregating
- Default: OFF. User must explicitly opt in from settings.

### 9.6 Community Contribution Model

CMP rule contributions via GitHub:
- Rule template with documentation
- Automated testing: CI runs Playwright tests against sample pages for each rule
- Rule review checklist: detection accuracy, no false positives, handles edge cases
- Maintainer team reviews and merges
- Contributors credited in extension about page

### 9.7 Browser Compatibility Beyond Chrome

Initial target: Chrome (Manifest V3). Future expansion:
- **Firefox**: Manifest V3 with minor adaptations (Firefox supports both MV2 and MV3; some APIs differ)
- **Edge**: Uses Chromium, should work with minimal changes
- **Safari**: Web Extensions API, requires separate Apple developer account and review
- **Brave/Opera/Vivaldi**: Chromium-based, should work as-is
- Use `webextension-polyfill` if needed for cross-browser compatibility

### 9.8 Mobile Considerations

Chrome extensions do not work on mobile Chrome (Android/iOS). Alternatives:
- **Firefox Android**: supports extensions, could port there
- **Safari iOS**: supports Web Extensions since iOS 15
- **Kiwi Browser (Android)**: supports Chrome extensions
- **Long-term**: if the open standard gains adoption, mobile browsers could implement native support
- **DNS-based blocking**: for users who want mobile coverage, document how pi-hole or DNS-level blocking complements the extension

### 9.9 Enterprise Deployment

Organizations may want to deploy the extension across all employee browsers:
- Support Chrome's `ExtensionInstallForcelist` policy for managed deployment
- Support `managed_storage` manifest key for centralized preference configuration
- Group policy template for setting default profiles
- Admin can lock preferences (e.g., "Privacy Maximum" for all employees, no override)
- Compliance reporting: export consent logs per domain

### 9.10 Testing Strategy

Multi-layer testing approach:
- **Unit tests**: preference mapping, category translation, rule matching, storage logic
- **Integration tests**: content script <-> background communication, CMP detection + execution end-to-end
- **E2E tests (Playwright)**: spin up test pages with real CMP scripts, verify the extension handles them correctly
- **CMP test pages**: create a test page per supported CMP with a known configuration
- **Regression tests**: when a CMP updates, run tests against updated version
- **Snapshot testing**: capture CMP DOM state before/after consent for debugging
- **Performance benchmarks**: measure script injection time, detection latency, memory usage
- **Cross-browser tests**: verify on Chrome, Firefox, Edge at minimum

---

## 10. Acceptance Criteria

- [ ] Extension installs in Chrome (Manifest V3)
- [ ] User can configure preferences via popup and options page
- [ ] Extension auto-detects and handles consent on top 3 CMPs (OneTrust, Cookiebot, Didomi)
- [ ] Per-category consent works (not just accept-all/reject-all)
- [ ] Popup shows what was accepted/rejected on current page
- [ ] Badge icon reflects consent status
- [ ] Domain whitelist/blacklist works
- [ ] Preset profiles work
- [ ] Consent history is logged and viewable
- [ ] Statistics page shows aggregate data
- [ ] Open standard spec is published on website
- [ ] Validator tool works on website
- [ ] At least one CMP-specific implementation guide exists
- [ ] Extension handles timing issues (async CMP loading)
- [ ] Extension works on SPAs (re-detects on navigation)
- [ ] All code has 80%+ test coverage
- [ ] Extension popup and options are keyboard-accessible
- [ ] Autoconsent integration provides 100+ CMP coverage
- [ ] GPC header is emitted when marketing cookies are rejected
- [ ] First-run onboarding flow guides user to choose a profile
- [ ] Consent dashboard shows per-site consent history with search/filter
- [ ] Validator/generator tool works on the website
- [ ] Popup shows "Scanning..." state during CMP detection
- [ ] All UI passes WCAG AA accessibility audit (ARIA attributes, keyboard nav, contrast)
- [ ] Status indicators use shape/icon differentiation (not color-only)
