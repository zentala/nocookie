# Domain Definitions — NoCookie

Ubiquitous language for the NoCookie project. All team members, agents, and documentation use these terms consistently.

---

## Consent & Privacy Standards

### CMP (Consent Management Platform)
A software component that websites embed to collect, store, and manage user cookie consent. Examples: OneTrust, Cookiebot, Didomi, Quantcast, TrustArc, CookieYes, Complianz, Osano, consentmanager. In our project, we both interact with third-party CMPs (via the extension) and provide our own CMP (the website plugin, E003).

### Cookie Category
A classification grouping cookies by purpose. Our project uses a five-category taxonomy validated by Consent-O-Matic's 200K+ user base:
- **Essential** — strictly necessary for the site to function (always on, not user-configurable)
- **Functional** — enhance user experience (language preferences, personalization, content recommendations)
- **Analytics** — measure site usage and performance (page views, session duration, audience statistics)
- **Marketing** — track users across sites for advertising (ad targeting, retargeting, conversion tracking)
- **Social Media** — enable social sharing, embedded content, and social login features

### Consent String / TC String
A base64url-encoded binary bitfield defined by IAB TCF that encodes per-purpose and per-vendor consent choices. Stored as a first-party cookie named `euconsent-v2` and accessible via the `__tcfapi` JavaScript API. In our project, we read TC Strings to understand existing consent state on TCF-compliant sites but do not generate them.

### TCF (Transparency & Consent Framework)
An industry-led standard by IAB Europe (v2.2/v2.3) for encoding user consent into machine-readable strings that propagate through the ad-tech supply chain. Defines 11 purposes and a Global Vendor List of 1,200+ registered vendors. In our project, we map TCF's 11 purposes to our 5-category taxonomy and detect TCF CMPs via the `__tcfapi` ping command.

### GPC (Global Privacy Control)
A W3C Working Draft specification for a binary opt-out signal transmitted via the `Sec-GPC: 1` HTTP header and `navigator.globalPrivacyControl` JavaScript property. Legally enforceable in 12 US states; mandatory in California browsers by January 2027 (AB 566). In our project, we emit GPC when the user's profile rejects marketing cookies.

### ADPC (Advanced Data Protection Control)
A specification by noyb/WU Vienna for granular, per-purpose consent signals via HTTP headers and a JavaScript API. Supports both consent and objection under GDPR Articles 6 and 21. Effectively stalled as of 2026 — zero browser adoption, no W3C/IETF track. In our project, ADPC is a potential future integration (v2) if revived under Art. 88b standardization.

---

## Legal & Regulatory

### GDPR (General Data Protection Regulation)
EU Regulation 2016/679 governing personal data processing. Relevant articles for our project: Art. 6 (lawfulness of processing), Art. 7 (conditions for consent), Art. 12-14 (transparency), Art. 21 (right to object), Art. 25 (data protection by design and by default). The Digital Omnibus proposes adding Art. 88a-88b for cookie-specific rules.

### ePrivacy Directive
EU Directive 2002/58/EC (amended by 2009/136/EC), the legal basis for cookie consent requirements. Its replacement (ePrivacy Regulation) was withdrawn in February 2025 after 8 years of deadlock. Cookie rules are now being folded into the GDPR via the Digital Omnibus.

### Art. 88b (Digital Omnibus)
Proposed new GDPR article from the EU Digital Omnibus Proposal (COM(2025) 837). Mandates that websites accept machine-readable browser consent signals (24 months after entry into force) and that browser manufacturers provide per-purpose privacy preference UI (48 months). Includes a media exemption. Realistic full implementation: 2029-2031. Our project is designed as a bridge solution for the transition gap.

### Well-Known URI
A standardized URL path prefix (`/.well-known/`) defined by RFC 8615 for machine-discoverable metadata. Examples: `/.well-known/gpc.json` (GPC), `/.well-known/security.txt`. In our project, we define `/.well-known/cookie-consent.json` as the location where websites declare their cookie categories, CMP details, and UI selectors.

---

## Extension Architecture

### Content Script
JavaScript injected by the extension into web pages. Chrome extensions support two execution worlds:
- **ISOLATED world** — runs in a separate JavaScript context; can access the DOM but not the page's `window` object. Used for safe CMP detection via DOM selectors.
- **MAIN world** — runs in the page's JavaScript context; can access `window.OneTrust`, `window.Cookiebot`, `__tcfapi`, etc. Used for CMP API execution.

### Service Worker (Background)
The extension's persistent orchestrator running as a Manifest V3 service worker. Handles message routing between content scripts and popup/options UI, manages the CMP rule database, coordinates consent logging, and modifies HTTP headers (GPC emission) via `chrome.declarativeNetRequest`.

### Detection Layer
The multi-layered system that identifies which CMP (if any) is present on a page. Layers are checked in priority order:
1. **Well-Known file** — `/.well-known/cookie-consent.json` (highest confidence)
2. **JS globals** — `window.OneTrust`, `window.Cookiebot`, `__tcfapi`, etc.
3. **DOM selectors** — CMP-specific HTML elements and containers
4. **Script URLs** — CDN URLs of known CMP scripts
5. **Heuristic fallback** — multi-language text matching on button labels (lowest confidence)

### Execution Strategy
The method used to apply the user's consent preferences to a detected CMP. Two strategies, in priority order:
1. **API call** — invoke the CMP's JavaScript API directly (e.g., `OneTrust.RejectAll()`, `Cookiebot.submitCustomConsent()`). More reliable, faster, less likely to break on CMP updates.
2. **Click simulation** — programmatically click DOM elements (buttons, toggles, checkboxes). Fallback when no API is available.

### Heuristic Fallback
A generic detection and interaction strategy for unknown CMPs. Matches consent-related button text in 16+ languages ("Accept All", "Alle akzeptieren", "Tout accepter", "Zaakceptuj wszystkie") weighted by proximity to common consent indicators (`role="dialog"`, `aria-label*="cookie"`, fixed/sticky positioning). Low confidence — used only when no CMP is identified by rules.

### Domain Override
A per-domain consent preference that overrides the user's global profile. Modes: Accept All, Reject All, Custom (per-category), Disabled (extension off for this site). Stored in `chrome.storage.sync` keyed by domain. Supports wildcards (e.g., `*.google.com`). Required by EDPB Guidelines 05/2020 for "specific" per-controller consent.

---

## CMP Plugin (E003)

### Shadow DOM
A browser API for encapsulated DOM subtrees with scoped styling. In our CMP plugin context, all UI elements (banner, preference center, policy page) render inside a Shadow DOM to prevent host page CSS from breaking our layout and prevent our CSS from leaking into the host page.

### Cookie Policy Icons / Badges
Standardized visual indicators (similar to Creative Commons badges) that communicate a site's cookie practices at a glance. Each cookie category gets a distinct icon. Available as a downloadable badge kit (SVG + CSS) for website owners to display on their sites.

### Consent Dashboard
The options page UI (extension) or preference center (CMP plugin) where users view and manage their consent state. Includes per-domain consent history log showing: which CMP was detected, what method was used, which categories were accepted/rejected, confidence level, and timestamp.

---

## Tools & Integrations

### Autoconsent
DuckDuckGo's open-source library (`@duckduckgo/autoconsent`) for automated CMP interaction. Provides rules for 100+ CMPs and a `ConsentOMaticCMP` compatibility class for Consent-O-Matic rules. In our project, we wrap autoconsent as our primary CMP interaction engine and layer our own rules on top.

---

## User-Facing Concepts

### Profile (Privacy Profile)
A preset combination of cookie category preferences. Four built-in profiles:
- **Privacy Maximum** — essential only (default, GDPR Art. 25 compliant)
- **Balanced** — essential + functional
- **Allow Analytics** — essential + functional + analytics
- **Accept All** — all categories (requires explicit user confirmation)

### Onboarding Flow
The first-run experience that guides new users through choosing a privacy profile. Explains each cookie category in plain language, shows what each profile allows/blocks, and requires an active choice. No silent accept-all behavior. Ensures consent expressed via the extension is genuinely informed.
