# T03: CMP DOM Patterns, Detection & Interaction Research

**Date**: 2026-03-24
**Status**: Complete
**Purpose**: Research how major Consent Management Platforms structure their DOM, expose JavaScript APIs, and how a browser extension can detect and interact with them.

---

## 1. Top CMPs by Market Share

The consent management market was valued at ~$1B in 2025, growing to ~$2.3B by 2031 (17% CAGR). The major players by adoption and market presence:

| CMP | Owner/Origin | Notable Users | TCF Support |
|-----|-------------|---------------|-------------|
| **OneTrust** | OneTrust (USA) | Enterprise leader, ~30% CMP market | Yes (TCF 2.2) |
| **Cookiebot** | Usercentrics (Denmark) | SMB leader, WordPress popular | Yes (TCF 2.2) |
| **Usercentrics** | Usercentrics (Germany) | Mid-market, merged with Cookiebot | Yes (TCF 2.2) |
| **TrustArc** | TrustArc (USA) | Enterprise, legacy "TRUSTe" brand | Yes |
| **Quantcast Choice** | Quantcast (USA) | Free, ad-tech focused | Yes (TCF 2.2) |
| **Didomi** | Didomi (France) | European enterprise | Yes (TCF 2.2) |
| **CookieYes** | CookieYes (UK) | SMB, WordPress plugin | Yes |
| **Osano** | Osano (USA) | Open-source roots | Partial |
| **Complianz** | Complianz (NL) | WordPress plugin, 1M+ installs | Yes |
| **consentmanager.net** | consentmanager (Germany) | European mid-market | Yes (TCF 2.2) |
| **Cookie-Script** | Cookie-Script | SMB | Yes |
| **CookieHub** | CookieHub | SMB | Yes |
| **Termly** | Termly (USA) | SMB | Partial |

---

## 2. Per-CMP Technical Details

### 2.1 OneTrust

**DOM Structure**: Regular `<div>` elements injected into `<body>`. No shadow DOM, no iframe for the main banner.

**Key DOM Selectors**:
```
#onetrust-consent-sdk          — outer wrapper for all OneTrust UI
#onetrust-banner-sdk           — main banner/popup
#onetrust-pc-sdk               — preference center (detail view)
#onetrust-accept-btn-handler   — "Accept All" button
#onetrust-reject-all-handler   — "Reject All" button
#onetrust-pc-btn-handler       — "Cookie Settings" / open preference center
.ot-pc-refuse-all-handler      — alternative refuse button (in preference center)
.onetrust-close-btn-handler    — close/dismiss button
#accept-recommended-btn-handler — "Accept Recommended" button
.onetrust-pc-dark-filter       — dark overlay behind preference center
```

**JavaScript API** (`window.OneTrust`):
```javascript
OneTrust.AllowAll()              // Accept all categories
OneTrust.RejectAll()             // Reject all non-essential
OneTrust.ToggleInfoDisplay()     // Open preference center
OneTrust.Close()                 // Dismiss banner, apply defaults
OneTrust.UpdateConsent("Category", "C0003:1")  // Enable category C0003
OneTrust.IsAlertBoxClosed()      // Check if user already consented
OneTrust.OnConsentChanged(cb)    // Listen for consent changes
OneTrust.GetDomainData()         // Full CMP config as JSON
```

**Global Objects**:
- `window.OneTrust` — main API namespace
- `window.OptanonWrapper` — legacy callback (empty stub)
- `window.OnetrustActiveGroups` — string of active consent group IDs (e.g., ",C0001,C0002,")

**Cookies**:
- `OptanonConsent` — stores consent preferences
- `OptanonAlertBoxClosed` — timestamp of banner dismissal

**Consent Categories**: Use IDs like `C0001` (Strictly Necessary), `C0002` (Performance), `C0003` (Functional), `C0004` (Targeting/Advertising).

**TCF**: Yes, exposes `__tcfapi`. Use `OneTrust.getVendorConsentsRequestV2()` for IAB data.

**Detection**:
```javascript
// Any of these confirms OneTrust:
typeof window.OneTrust !== 'undefined'
document.querySelector('#onetrust-consent-sdk')
document.querySelector('#onetrust-banner-sdk')
document.cookie.includes('OptanonConsent')
```

---

### 2.2 Cookiebot (Usercentrics for SMBs)

**DOM Structure**: Regular `<div>` dialog injected into `<body>`. Not in an iframe or shadow DOM.

**Key DOM Selectors**:
```
#CybotCookiebotDialog                         — main dialog container
#CybotCookiebotDialogBodyButtonAccept          — "Allow All" button
#CybotCookiebotDialogBodyButtonDecline         — "Decline" button
#CybotCookiebotDialogBodyButtonDetails         — "Show Details" / customize
#CybotCookiebotDialogBodyLevelButtonPreferences — preferences checkbox
#CybotCookiebotDialogBodyLevelButtonStatistics  — statistics checkbox
#CybotCookiebotDialogBodyLevelButtonMarketing   — marketing checkbox
#CybotCookiebotDialogBodyContentControls        — controls container
```

**JavaScript API** (`window.Cookiebot` / `window.CookieConsent`):
```javascript
Cookiebot.consent.necessary     // bool (always true)
Cookiebot.consent.preferences   // bool
Cookiebot.consent.statistics    // bool
Cookiebot.consent.marketing     // bool
Cookiebot.consented             // bool — user has given consent
Cookiebot.declined              // bool — user declined
Cookiebot.hasResponse           // bool — user has interacted

Cookiebot.show()                // Display consent dialog
Cookiebot.hide()                // Hide consent dialog
Cookiebot.renew()               // Delete consent, re-show dialog
Cookiebot.withdraw()            // Remove consent for the site
Cookiebot.submitCustomConsent(preferences, statistics, marketing)
```

**Events/Callbacks**:
```javascript
window.CookieConsentCallback_OnLoad     // Banner loaded
window.CookieConsentCallback_OnAccept   // User accepted
window.CookieConsentCallback_OnDecline  // User declined
// DOM events:
window.addEventListener('CookiebotOnAccept', handler)
window.addEventListener('CookiebotOnDecline', handler)
window.addEventListener('CookiebotOnDialogInit', handler)
window.addEventListener('CookiebotOnDialogDisplay', handler)
```

**Cookies**:
- `CookieConsent` — stores consent state (JSON-like: `{stamp:'...', necessary:true, preferences:false, statistics:false, marketing:false}`)

**Script Detection**:
```javascript
typeof window.Cookiebot !== 'undefined'
typeof window.CookieConsent !== 'undefined'  // note: generic name, may collide
document.querySelector('#CybotCookiebotDialog')
document.querySelector('script[src*="consent.cookiebot.com"]')
```

**TCF**: Yes, exposes `__tcfapi`.

---

### 2.3 Quantcast Choice

**DOM Structure**: Renders inside its own container. Uses a `<div>` with class-based selectors.

**Key DOM Selectors**:
```
.qc-cmp2-ui                    — main UI container
.qc-cmp2-summary-buttons       — button container
[class*="qc-cmp2"]             — general Quantcast elements
.qc-cmp-button                 — action buttons
.qc-cmp-secondary-button       — secondary action buttons
.qc-cmp-ui                     — legacy UI container
.qc-cmp-main-messaging         — main message area
```

**JavaScript API**: Primarily uses IAB TCF API, no proprietary global object.
```javascript
// Show consent UI programmatically:
__tcfapi('displayConsentUi', 2, function() {})

// Check consent:
__tcfapi('addEventListener', 2, function(tcData, success) {
  if (success && tcData.eventStatus === 'tcloaded') {
    console.log(tcData.purpose.consents)  // {1: true, 2: false, ...}
  }
})
```

**Detection**:
```javascript
document.querySelector('[class*="qc-cmp2"]')
document.querySelector('.qc-cmp2-ui')
// Quantcast uses the standard __tcfapi — need DOM check to distinguish from other TCF CMPs
document.querySelector('script[src*="quantcast"]')
```

**Cookies**: Standard IAB `euconsent-v2` TC string cookie.

**TCF**: Yes, primary interface.

---

### 2.4 TrustArc

**DOM Structure**: Uses a combination of regular divs and an **iframe** for the preference center. The banner itself is a div, but cookie preferences open in `truste-svc.net` iframe.

**Key DOM Selectors**:
```
#consent-banner                 — banner container (Pro version)
#consent_blackbar               — banner container (Advanced version)
#teconsent                      — "Cookie Preferences" link container
#truste-consent-track           — consent tracking iframe
.truste-consent-button          — action buttons
#truste-consent-button          — consent button
.truste-banner                  — banner wrapper
```

**JavaScript API**:
```javascript
window.truste.eu.bindMap.consentModel  // Access consent model
// No simple AllowAll/RejectAll — uses event-driven model:
// Listen via dataLayer:
window.dataLayer  // Receives "GDPR Pref Allows {category}" events
```

**Cookies**:
- `cmapi_cookie_privacy` — preference cookie
- `notice_behavior` — behavior/region cookie
- `consent_model` — consent model cookie (newer)

**Detection**:
```javascript
document.querySelector('#truste-consent-track')
document.querySelector('#consent-banner, #consent_blackbar')
typeof window.truste !== 'undefined'
document.querySelector('script[src*="truste"]')
document.cookie.includes('notice_behavior')
```

**TCF**: Yes, supports TCF.

**Note**: TrustArc is one of the harder CMPs to automate because the preference center loads in a cross-origin iframe (`truste-svc.net`), requiring iframe access or postMessage communication.

---

### 2.5 Didomi

**DOM Structure**: Regular `<div>` elements. Uses `#didomi-host` as the main container.

**Key DOM Selectors**:
```
#didomi-host                                — main container
#didomi-notice                              — notice/banner container
#didomi-notice-agree-button                 — "Agree" button
#didomi-notice-disagree-button              — "Disagree" button
#didomi-notice-learn-more-button            — "Learn More" button
#didomi-popup                               — preferences popup
.didomi-components-radio__option            — radio button options
#didomi-purpose-cookies                     — cookie purpose element
.didomi-consent-popup-preferences           — preferences container
```

**JavaScript API** (`window.Didomi`):
```javascript
Didomi.setUserAgreeToAll()           // Accept all
Didomi.setUserDisagreeToAll()        // Reject all
Didomi.getCurrentUserStatus()        // Get full consent status
Didomi.getRequiredPurposeIds()       // List of configured purposes
Didomi.isUserStatusPartial()         // Incomplete choices?
Didomi.shouldUserStatusBeCollected() // Need to show banner?
Didomi.notice.isVisible()            // Is banner showing?
Didomi.preferences.show('purposes')  // Open preference manager
Didomi.reset()                       // Clear consent, new user ID

// Must wrap calls in ready callback:
window.didomiOnReady = window.didomiOnReady || []
window.didomiOnReady.push(function(Didomi) {
  Didomi.setUserAgreeToAll()
})
```

**Global Objects**:
- `window.Didomi` — main API
- `window.didomiOnReady` — initialization callback array
- `window.didomiConfig` — configuration object
- `window.__tcfapi` — IAB TCF v2 API

**Cookies**: `didomi_token` — stores consent token.

**Detection**:
```javascript
typeof window.Didomi !== 'undefined'
typeof window.didomiOnReady !== 'undefined'
document.querySelector('#didomi-host')
document.querySelector('script[src*="didomi"]')
```

**TCF**: Yes, exposes both `__tcfapi` and legacy `__cmp`.

---

### 2.6 CookieYes

**DOM Structure**: Regular `<div>` elements.

**Key DOM Selectors**:
```
.cky-consent-container          — main banner container
.cky-consent-bar                — consent bar
.cky-btn-accept                 — accept all button
.cky-btn-reject                 — reject all button
.cky-btn-customize              — customize button
.cky-preference-center          — preference center
#ckySwitchanalytics             — analytics toggle
#ckySwitchadvertisement         — advertisement toggle
#ckySwitchfunctional            — functional toggle
#ckySwitchperformance           — performance toggle
#ckySwitchother                 — other toggle
```

**JavaScript API**:
```javascript
// Accept all:
performBannerAction("accept_all")

// Reject all:
performBannerAction("reject")

// Custom preferences (set checkboxes first, then save):
document.getElementById("ckySwitchanalytics").checked = true
performBannerAction("accept_partial")

// Get consent data (after banner loads):
document.addEventListener('cookieyes_banner_loaded', function() {
  const consent = getCkyConsent()
  // Returns: { activeLaw, categories: { necessary, functional, analytics, performance, advertisement }, isUserActionCompleted, consentID }
})
```

**Cookies**:
- `cookieyes-consent` — stores consent preferences

**Detection**:
```javascript
document.querySelector('.cky-consent-container')
typeof performBannerAction === 'function'
document.cookie.includes('cookieyes-consent')
document.querySelector('script[src*="cookieyes"]')
```

**TCF**: Partial support.

---

### 2.7 Osano (Open-Source Cookie Consent)

**DOM Structure**: Regular `<div>` elements. Uses `.cc-` prefixed CSS classes.

**Key DOM Selectors**:
```
.cc-window                      — main popup container
.cc-banner                      — banner variant
.cc-compliance                  — button container
.cc-btn                         — generic button
.cc-allow                       — allow button
.cc-deny                        — deny button
.cc-dismiss                     — dismiss button
.cc-revoke                      — revoke consent button
```

**JavaScript API**:
```javascript
// Initialize:
window.cookieconsent.initialise({
  palette: { popup: {}, button: {} },
  type: 'opt-in',
  content: { message: '...', allow: 'Allow', deny: 'Deny' },
  onStatusChange: function(status) { /* handle change */ }
})

// Status values: 'allow', 'deny', 'dismiss'
```

**Cookies**:
- `cookieconsent_status` — stores `allow`, `deny`, or `dismiss`

**Detection**:
```javascript
document.querySelector('.cc-window')
typeof window.cookieconsent !== 'undefined'
document.cookie.includes('cookieconsent_status')
```

**TCF**: No native TCF support.

---

### 2.8 Complianz (WordPress)

**DOM Structure**: Regular `<div>` elements within WordPress page.

**Key DOM Selectors**:
```
.cmplz-cookiebanner             — banner container
.cmplz-btn                      — generic button
.cmplz-accept                   — accept button
.cmplz-deny                     — deny button
.cmplz-manage-consent           — manage consent link
.cmplz-categories               — category toggles container
```

**JavaScript API**:
```javascript
// Event-driven consent:
document.addEventListener("cmplz_event_status", function(e) {
  console.log(e.detail)  // { marketing: 'allow'|'deny', statistics: '...', ... }
})

// Functional event:
document.addEventListener("cmplz_event_functional", function(e) {
  // Functional cookies always allowed
})
```

**Cookies**:
- `cmplz_consent_status` — consent status
- `cmplz_functional` — functional consent
- `cmplz_statistics` — statistics consent
- `cmplz_marketing` — marketing consent

**Detection**:
```javascript
document.querySelector('.cmplz-cookiebanner')
document.cookie.includes('cmplz_consent_status')
document.querySelector('script[src*="complianz"]')
```

**TCF**: Yes, optional TCF integration.

---

### 2.9 consentmanager.net

**DOM Structure**: Regular `<div>` elements.

**Key DOM Selectors**:
```
#cmpbox                         — main container
#cmpbox2                        — secondary container
.cmpboxbtn                      — buttons
.cmpboxbtnyes                   — accept button
.cmpboxbtnno                    — reject button
.cmpfooterlink                  — footer links
```

**JavaScript API**: Uses IAB `__cmp` (v1) and `__tcfapi` (v2).
```javascript
// Custom settings page:
// Navigate to URL with ?cmpscreencustom or #cmpscreencustom

// Check vendor consent via IAB API:
__tcfapi('addEventListener', 2, function(tcData, success) { ... })
```

**Detection**:
```javascript
document.querySelector('#cmpbox')
document.querySelector('script[src*="consentmanager"]')
```

**TCF**: Yes.

---

## 3. CMP Detection Patterns Summary

### 3.1 Detection by Global JavaScript Objects

| Object | CMP |
|--------|-----|
| `window.OneTrust` | OneTrust |
| `window.OptanonWrapper` | OneTrust (legacy) |
| `window.Cookiebot` / `window.CookieConsent` | Cookiebot |
| `window.Didomi` | Didomi |
| `window.didomiOnReady` | Didomi |
| `window.didomiConfig` | Didomi |
| `window.truste` | TrustArc |
| `window.cookieconsent` | Osano Cookie Consent |
| `window.__tcfapi` | Any TCF-compliant CMP (non-specific) |
| `window.__cmp` | IAB CMP API v1 (legacy) |

### 3.2 Detection by DOM Selectors

| Selector | CMP |
|----------|-----|
| `#onetrust-consent-sdk` | OneTrust |
| `#onetrust-banner-sdk` | OneTrust |
| `#CybotCookiebotDialog` | Cookiebot |
| `[class*="qc-cmp2"]` | Quantcast Choice |
| `.qc-cmp2-ui` | Quantcast Choice |
| `#truste-consent-track` | TrustArc |
| `#consent-banner`, `#consent_blackbar` | TrustArc |
| `#didomi-host` | Didomi |
| `#didomi-notice` | Didomi |
| `.cky-consent-container` | CookieYes |
| `.cc-window` | Osano Cookie Consent |
| `.cmplz-cookiebanner` | Complianz |
| `#cmpbox` | consentmanager.net |

### 3.3 Detection by Script URLs

| URL Pattern | CMP |
|-------------|-----|
| `cdn.cookielaw.org` / `optanon` | OneTrust |
| `consent.cookiebot.com/uc.js` | Cookiebot |
| `quantcast.mgr.consensu.org` | Quantcast Choice |
| `consent.trustarc.com` / `truste-svc.net` | TrustArc |
| `sdk.privacy-center.org` | Didomi |
| `cdn-cookieyes.com` | CookieYes |
| `complianz` (in path) | Complianz |
| `consentmanager.net` | consentmanager.net |

### 3.4 Detection by Cookie Names

| Cookie | CMP |
|--------|-----|
| `OptanonConsent` / `OptanonAlertBoxClosed` | OneTrust |
| `CookieConsent` | Cookiebot |
| `euconsent-v2` | Any TCF CMP (IAB standard) |
| `cmapi_cookie_privacy` / `notice_behavior` | TrustArc |
| `didomi_token` | Didomi |
| `cookieyes-consent` | CookieYes |
| `cookieconsent_status` | Osano |
| `cmplz_consent_status` | Complianz |

---

## 4. Existing Open-Source Projects

### 4.1 Consent-O-Matic (Aarhus University)

**Repository**: https://github.com/cavi-au/Consent-O-Matic
**Coverage**: 200+ CMPs
**License**: Open source

**Rule Format**: JSON-based with detectors + methods structure.

```json
{
  "CMPName": {
    "detectors": [{
      "presentMatcher": { "type": "css", "target": { "selector": "#banner" } },
      "showingMatcher": { "type": "css", "target": { "selector": "#banner", "displayFilter": true } }
    }],
    "methods": [
      { "name": "OPEN_OPTIONS", "action": { "type": "click", "target": { "selector": ".settings-btn" } } },
      { "name": "DO_CONSENT", "action": { "type": "consent", "consents": [
        { "type": "F", "matcher": { "type": "checkbox", "target": { "selector": "#func-checkbox" } },
          "toggleAction": { "type": "click", "target": { "selector": "#func-checkbox" } } }
      ] } },
      { "name": "SAVE_CONSENT", "action": { "type": "click", "target": { "selector": ".save-btn" } } }
    ]
  }
}
```

**Consent Type Codes**: A (Analytics), B (Marketing/Behavioral), D (Data Processing), E (Essential), F (Functionality), X (Social Media/External).

**Action Types**: `click`, `list`, `consent`, `slide`, `ifcss`, `waitcss`, `foreach`, `wait`, `hide`, `close`.

**Matcher Types**: `css` (DOM presence), `checkbox` (checkbox state).

**Methods** (executed in order): `HIDE_CMP`, `OPEN_OPTIONS`, `DO_CONSENT`, `SAVE_CONSENT`.

### 4.2 Autoconsent (DuckDuckGo)

**Repository**: https://github.com/duckduckgo/autoconsent
**npm**: `@duckduckgo/autoconsent`
**Coverage**: 100+ CMPs
**Used by**: DuckDuckGo browser apps

**Architecture**:
- Content script injected into every page (detection + action execution)
- Background service worker (orchestration, config, eval snippets)
- Message-passing between content script and background

**Rule Format**: JSON or TypeScript class-based.

```json
{
  "name": "ExampleCMP",
  "prehideSelectors": [".cookie-banner"],
  "detectCmp": [{ "exists": ".cookie-banner" }],
  "detectPopup": [{ "visible": ".cookie-banner" }],
  "optOut": [
    { "waitForThenClick": ".reject-button", "timeout": 1000 },
    { "wait": 500 }
  ],
  "optIn": [{ "click": ".accept-button" }],
  "test": [{ "visible": ".cookie-banner", "check": "none" }]
}
```

**Action Types**: `exists`, `visible`, `waitFor`, `waitForVisible`, `click`, `waitForThenClick`, `wait`, `hide`, `eval`, `if/then/else`, `any`, `negated`, `cookieContains`, `removeClass`, `setStyle`, `addStyle`.

**Selector Features**:
- Standard CSS selectors
- XPath (prefix: `xpath/`)
- Array selectors for shadow DOM and iframe piercing: `['shadow-host', 'button.accept']`

**Three rule implementation modes**:
1. JSON rulesets (declarative, covers most CMPs)
2. TypeScript classes implementing `AutoCMP` interface (complex logic)
3. Consent-O-Matic compatibility layer (`ConsentOMaticCMP`)

**Message Flow**: `init` -> `cmpDetected` -> `popupFound` -> `optIn`/`optOut` -> `optOutResult`/`optInResult` -> `autoconsentDone` -> `selfTest` -> `report`.

### 4.3 Other Notable Projects

- **Cookie-Glasses** (https://github.com/Perdu/Cookie-Glasses) — validates that IAB TCF consent strings match actual user choices
- **Ghostery** — includes CMP handling in its tracker blocking
- **IAB CMP Validator** — Chrome extension that validates TCF compliance by detecting `__tcfapi`
- **Super Agent** (super-agent.com) — commercial cookie consent auto-handler

---

## 5. Interaction Methods

### 5.1 Click Simulation

**How it works**: Find the accept/reject button via CSS selector, dispatch a click event.

```javascript
const button = document.querySelector('#onetrust-accept-btn-handler')
if (button) button.click()
```

**Pros**:
- Works universally (any CMP, even custom/unknown ones)
- Mimics real user behavior exactly
- No API knowledge needed per CMP
- Works when CMP has no public JavaScript API

**Cons**:
- Fragile: CSS selectors change across CMP versions
- Timing issues: element may not be in DOM yet, need waitFor/MutationObserver
- Some CMPs use iframes (TrustArc) requiring cross-frame access
- Shadow DOM elements not reachable with simple querySelector
- May trigger unexpected side effects if CMP has complex UI state
- Requires visual/DOM analysis per CMP to find correct selectors

### 5.2 JavaScript API Calls

**How it works**: Call the CMP's exposed API methods directly.

```javascript
// OneTrust
OneTrust.AllowAll()

// Cookiebot
Cookiebot.submitCustomConsent(false, false, false)  // reject non-essential

// Didomi
Didomi.setUserAgreeToAll()
```

**Pros**:
- More reliable than click simulation (API is the intended interface)
- Handles all internal state updates correctly
- Works even if UI is not yet rendered
- Simpler code per CMP
- Some APIs are standardized (TCF `__tcfapi`)

**Cons**:
- Requires per-CMP API knowledge
- APIs differ significantly between CMPs
- Not all CMPs expose useful public APIs
- API may require initialization/ready callbacks
- Extension runs in isolated world; page's `window` objects may not be accessible without `window.wrappedJSObject` or `main world` script injection

### 5.3 IAB TCF API (`__tcfapi`)

**How it works**: Standardized API for all TCF-compliant CMPs.

```javascript
// Check if CMP is present and loaded:
__tcfapi('ping', 2, function(pingReturn) {
  console.log(pingReturn.cmpLoaded)   // true/false
  console.log(pingReturn.cmpStatus)   // 'loaded' | 'stub'
  console.log(pingReturn.gdprApplies) // true/false
})

// Listen for consent changes:
__tcfapi('addEventListener', 2, function(tcData, success) {
  if (success) {
    // tcData.eventStatus: 'tcloaded' | 'cmpuishown' | 'useractioncomplete'
    // tcData.purpose.consents: {1: true, 2: false, ...}
    // tcData.vendor.consents: {1: true, 2: true, ...}
  }
})
```

**Pros**:
- Standardized across all TCF-compliant CMPs
- Read-only access to consent state without CMP-specific code
- Works via `postMessage` even from iframes
- Well-documented specification

**Cons**:
- Read-only: cannot SET consent via `__tcfapi` (only read/listen)
- Not all CMPs support TCF
- Still need CMP-specific code to actually accept/reject
- Stub mechanism means API may queue calls before CMP loads

### 5.4 Direct Cookie Manipulation

**How it works**: Set the consent cookies directly without interacting with the CMP UI or API.

```javascript
// Example: Set OneTrust consent cookie
document.cookie = 'OptanonConsent=groups=C0001:1,C0002:0,C0003:0,C0004:0; path=/; max-age=31536000'
document.cookie = 'OptanonAlertBoxClosed=2026-03-24T00:00:00.000Z; path=/; max-age=31536000'
```

**Pros**:
- Fastest approach (no DOM interaction needed)
- Works even before CMP loads
- Can prevent banner from appearing entirely

**Cons**:
- Cookie format is CMP-specific and may change between versions
- CMP may validate/overwrite cookies on load
- Does not trigger CMP's internal event handlers (scripts expecting consent callbacks won't fire)
- TCF consent string is cryptographically complex to forge
- May not properly update server-side consent records
- Ethically questionable: bypasses the consent mechanism entirely

### 5.5 Recommended Approach: Layered Strategy

For a browser extension, the optimal approach is a **layered strategy** combining multiple methods:

1. **Primary: CMP-specific JavaScript API** — Use `OneTrust.AllowAll()`, `Didomi.setUserAgreeToAll()`, etc. when the CMP is identified. Most reliable.
2. **Secondary: Click simulation with known selectors** — Fall back to clicking known buttons when API is unavailable. Use autoconsent/Consent-O-Matic rule databases as reference.
3. **Tertiary: TCF API for detection** — Use `__tcfapi('ping')` to detect TCF CMPs, then use CMP-specific methods to act.
4. **Last resort: Generic heuristics** — Look for buttons with text like "Accept All", "Reject All", "I Agree" in common banner patterns.

**Critical implementation detail**: Browser extensions run in an isolated world. To access `window.OneTrust`, `window.Cookiebot`, etc., you must either:
- Inject a script into the page's main world (via `chrome.scripting.executeScript` with `world: 'MAIN'`)
- Use `chrome.scripting.executeScript` to run code in the page context
- For Manifest V3: use `world: 'MAIN'` in content script registration

---

## 6. Key Technical Challenges

### 6.1 Timing
CMPs load asynchronously. The extension must wait for the CMP to initialize before interacting. Solutions: `MutationObserver`, `setInterval` polling, or `__tcfapi` stub queue.

### 6.2 Iframes
TrustArc and some others use cross-origin iframes. Extension must have `all_urls` permission and inject content scripts into iframes.

### 6.3 Shadow DOM
Some newer CMPs use shadow DOM. Standard `querySelector` cannot pierce shadow boundaries. Solutions: autoconsent's array selector notation, or recursive shadow DOM traversal.

### 6.4 SPAs (Single Page Applications)
Some SPAs re-trigger consent banners on navigation. Extension needs to re-detect on URL changes or DOM mutations.

### 6.5 Regional Variations
CMPs show different UIs based on geolocation. A user in the EU sees GDPR banners; a US user sees CCPA notices. The extension should handle both.

### 6.6 Content Security Policy
Some sites have strict CSP that blocks inline scripts. The extension's injected scripts must comply or use alternative injection methods.

---

## Sources

- [OneTrust JavaScript API](https://developer.onetrust.com/onetrust/docs/javascript-api)
- [Cookiebot API Documentation](https://support.cookiebot.com/hc/en-us/articles/360006346473)
- [Cookiebot Properties and Methods](https://cookiemagic.eu/support/cookiebot-properties-methods-events-and-callback-functions/)
- [Didomi Web SDK API](https://developers.didomi.io/cmp/web-sdk/reference/api)
- [CookieYes Banner Action API](https://www.cookieyes.com/documentation/consent-banner-action-api/)
- [CookieYes getCkyConsent API](https://www.cookieyes.com/documentation/retrieving-consent-data-using-api-getckyconsent/)
- [IAB TCF CMP API v2 Spec](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md)
- [TrustArc Integration Studio](https://choices-sb.truste-svc.net/assets/ccm-integration-studio/documentation.html)
- [Consent-O-Matic (GitHub)](https://github.com/cavi-au/Consent-O-Matic)
- [Consent-O-Matic Rules.json](https://github.com/cavi-au/Consent-O-Matic/blob/master/Rules.json)
- [DuckDuckGo Autoconsent (GitHub)](https://github.com/duckduckgo/autoconsent)
- [Autoconsent API Documentation](https://github.com/duckduckgo/autoconsent/blob/main/api.md)
- [Autoconsent OneTrust Implementation](https://github.com/duckduckgo/autoconsent/blob/main/lib/cmps/onetrust.ts)
- [Osano Cookie Consent (GitHub)](https://github.com/osano/cookieconsent)
- [Quantcast Choice Help](https://help.quantcast.com/hc/en-us/articles/360050172053)
- [consentmanager.net JavaScript API](https://help.consentmanager.net/books/cmp/chapter/javascript-api)
- [Complianz WordPress Plugin](https://wordpress.org/plugins/complianz-gdpr/)
- [Secureprivacy Best CMP 2026](https://secureprivacy.ai/blog/best-cmp-2026)
- [Usercentrics CMP Comparison](https://usercentrics.com/knowledge-hub/consent-management-platforms/)
