---
id: E003
title: NoCookie CMP — Open Source Website Consent Plugin
status: planned
created: 2026-03-24
depends_on: E002
---

# E003: NoCookie CMP — Website Consent Management Plugin

## 1. Problem Statement

Website owners who want to be GDPR-compliant must install a Consent Management Platform (CMP). The current market is dominated by expensive enterprise solutions (OneTrust, Cookiebot, Osano) or low-quality free alternatives. None of them integrate natively with browser extensions, meaning users still see popups even when their preferences are already known.

**The gap**: There is no free, open-source CMP that:
- Generates standard-compliant `/.well-known/cookie-consent.json` automatically
- Integrates natively with our Chrome extension for zero-friction consent
- Provides standardized visual indicators (cookie policy icons) for transparency
- Auto-generates complete cookie policy documentation

**Our CMP closes the loop**: the extension handles existing CMPs on third-party sites; our CMP gives website owners a tool that makes the extension experience seamless on their site.

---

## 2. Goals and Scope

### 2.1 Goals

1. **Free, open-source CMP** that website owners can install in under 10 minutes
2. **Native extension integration** — users with our extension never see a popup on sites using our CMP
3. **Standard-compliant output** — auto-generates `/.well-known/cookie-consent.json`
4. **Cookie policy icons** — standardized visual indicators like Creative Commons badges, downloadable badge kit
5. **Three levels of cookie information** — quick popup banner, detailed preference center modal, full cookie policy page
6. **Standardized cookie practice descriptions** — predefined, multi-language descriptions so website owners do not write from scratch
7. **Visual configurator tool** — web-based preview/generator for website owners to configure and export their CMP setup
8. **Dead-simple configuration** — minimal JSON for common cases, extensible for advanced

### 2.2 Out of Scope

- Enterprise features (vendor management, consent receipts, audit trails, legal consulting)
- Server-side consent enforcement (blocking scripts before consent — that is a v2 goal)
- Native mobile SDKs
- IAB TCF vendor list management (we support TCF signal emission, not full TCF CMP certification)
- Admin dashboard (v1 is config-file-driven; admin UI is a future epic)

### 2.3 Acceptance Criteria

- [ ] CMP installs via npm package or CDN script tag
- [ ] Minimal config (site name + categories) produces a working consent banner
- [ ] Banner shows Accept All / Reject All / Customize on first layer
- [ ] Preference center shows per-category toggles with descriptions
- [ ] Consent stored in first-party cookie, readable by site scripts
- [ ] `/.well-known/cookie-consent.json` auto-generated from config
- [ ] Cookie policy page auto-generated from config (embeddable and linkable)
- [ ] Cookie policy page includes "last updated" timestamp and "change my preferences" button
- [ ] Cookie policy icons render for each category at all sizes (16px-64px)
- [ ] Standardized cookie practice descriptions available for all 5 categories (3 variants each)
- [ ] Per-cookie description database covers top 20 common third-party cookies
- [ ] Descriptions available in 5 languages (EN, DE, FR, ES, PL)
- [ ] Downloadable badge kit with all icons and badges (SVG + CSS)
- [ ] Visual configurator tool lets website owners preview banner, modal, and policy page
- [ ] Configurator exports config JSON, script tag, well-known file, and badge kit
- [ ] Chrome extension detects our CMP instantly and auto-applies preferences
- [ ] Extension-to-CMP handshake completes in under 100ms
- [ ] CMP is under 30KB gzipped (JS + CSS, excluding configurator)
- [ ] WCAG 2.1 AA accessible
- [ ] Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- [ ] 80%+ test coverage

---

## 3. Plugin Architecture

### 3.1 Distribution

Three installation methods, same core package:

**Method 1 — CDN Script Tag (simplest)**:
```html
<script src="https://cdn.nocookie.zentala.io/cmp/v1/nocookie-cmp.min.js"></script>
<script>
  NoCookieCMP.init({
    siteName: "My Website",
    categories: ["essential", "analytics"]
  });
</script>
```

**Method 2 — npm Package (for build systems)**:
```bash
pnpm add @nocookie/cmp
```
```typescript
import { NoCookieCMP } from '@nocookie/cmp';

NoCookieCMP.init({
  siteName: "My Website",
  categories: ["essential", "analytics", "marketing"]
});
```

**Method 3 — WordPress Plugin (future, separate epic)**:
WordPress admin panel wrapping the core JS library with a settings page.

### 3.2 Package Structure

```
@nocookie/cmp/
  src/
    core/
      config.ts              -- config parsing, validation, defaults
      consent-state.ts       -- consent storage (cookie read/write)
      category-registry.ts   -- category definitions and metadata
      event-bus.ts           -- event system for hooks
    ui/
      banner.ts              -- first-layer consent banner
      preference-center.ts   -- second-layer category toggles
      policy-page.ts         -- full cookie policy page generator
      icons.ts               -- cookie policy icon/badge renderer
      theme.ts               -- CSS variable injection, theme engine
    integration/
      extension-bridge.ts    -- handshake protocol with our Chrome extension
      well-known.ts          -- /.well-known/cookie-consent.json generator
      gpc.ts                 -- GPC signal detection and response
      tcf-signal.ts          -- TCF consent string emission (optional)
    shared/
      types.ts               -- all TypeScript interfaces
      constants.ts           -- category taxonomy, defaults
      i18n.ts                -- translation strings
  styles/
    base.css                 -- core layout, reset
    theme-light.css          -- light theme variables
    theme-dark.css           -- dark theme variables
    icons.css                -- icon sprite/SVG styles
    animations.css           -- entrance/exit transitions
  assets/
    icons/                   -- SVG icon set for categories and badges
  dist/
    nocookie-cmp.min.js     -- UMD bundle (CDN)
    nocookie-cmp.esm.js     -- ESM bundle (npm)
    nocookie-cmp.css        -- extracted CSS
```

### 3.3 JavaScript API

The CMP exposes a global `NoCookieCMP` object (or ES module export):

```typescript
/** Core CMP interface exposed to website owners and the extension */
interface NoCookieCMPAPI {
  /** Initialize the CMP with configuration */
  init(config: CMPConfig): void;

  /** Get current consent state for all categories */
  getConsent(): ConsentState;

  /** Set consent for a specific category (triggers UI update + cookie write) */
  setConsent(category: string, granted: boolean): void;

  /** Accept all non-essential categories */
  acceptAll(): void;

  /** Reject all non-essential categories */
  rejectAll(): void;

  /** Open the preference center programmatically */
  openPreferences(): void;

  /** Close all CMP UI elements */
  close(): void;

  /** Reset consent (clear cookie, show banner again) */
  reset(): void;

  /** Get the generated well-known JSON object */
  getWellKnownJSON(): WellKnownCookieConsent;

  /** Get the generated cookie policy HTML */
  getPolicyHTML(): string;

  /** Subscribe to consent events */
  on(event: CMPEvent, handler: EventHandler): void;

  /** Unsubscribe from consent events */
  off(event: CMPEvent, handler: EventHandler): void;

  /** CMP version */
  version: string;

  /**
   * Extension bridge: used by our Chrome extension for the handshake.
   * Not intended for website owner use.
   */
  __extensionBridge: ExtensionBridge;
}

type CMPEvent =
  | 'consent:granted'      // fired per-category when granted
  | 'consent:denied'       // fired per-category when denied
  | 'consent:updated'      // fired when any consent changes
  | 'consent:reset'        // fired when consent is cleared
  | 'ui:banner:show'       // fired when banner becomes visible
  | 'ui:banner:hide'       // fired when banner is dismissed
  | 'ui:preferences:open'  // fired when preference center opens
  | 'ui:preferences:close' // fired when preference center closes
  | 'extension:detected'   // fired when our extension is detected
  | 'extension:applied';   // fired when extension auto-applied prefs
```

### 3.4 DOM Structure

The CMP generates a self-contained DOM tree inside a shadow DOM root to prevent style leakage:

```html
<!-- Injected at end of <body> -->
<div id="ca-cmp-root">
  #shadow-root (open)
    <link rel="stylesheet" href="...">

    <!-- Banner (first layer) -->
    <div class="ca-banner" role="dialog" aria-label="Cookie consent">
      <div class="ca-banner__content">
        <div class="ca-banner__icons">
          <!-- Category icons showing what cookies the site uses -->
        </div>
        <p class="ca-banner__text">
          We use cookies to improve your experience.
          <a href="/cookie-policy" class="ca-banner__link">Learn more</a>
        </p>
        <div class="ca-banner__actions">
          <button class="ca-btn ca-btn--reject">Reject All</button>
          <button class="ca-btn ca-btn--customize">Customize</button>
          <button class="ca-btn ca-btn--accept">Accept All</button>
        </div>
      </div>
    </div>

    <!-- Preference Center (second layer) -->
    <div class="ca-prefs" role="dialog" aria-label="Cookie preferences" hidden>
      <div class="ca-prefs__header">
        <h2>Cookie Preferences</h2>
        <button class="ca-prefs__close" aria-label="Close">&times;</button>
      </div>
      <div class="ca-prefs__categories">
        <!-- One per category, dynamically generated -->
        <div class="ca-category">
          <div class="ca-category__header">
            <span class="ca-category__icon"><!-- SVG --></span>
            <span class="ca-category__name">Analytics</span>
            <label class="ca-toggle">
              <input type="checkbox" />
              <span class="ca-toggle__slider"></span>
            </label>
          </div>
          <div class="ca-category__details" hidden>
            <p class="ca-category__desc">...</p>
            <table class="ca-category__cookies">
              <tr><th>Cookie</th><th>Provider</th><th>Duration</th><th>Purpose</th></tr>
              <!-- rows -->
            </table>
          </div>
        </div>
      </div>
      <div class="ca-prefs__actions">
        <button class="ca-btn ca-btn--reject">Reject All</button>
        <button class="ca-btn ca-btn--save">Save Preferences</button>
        <button class="ca-btn ca-btn--accept">Accept All</button>
      </div>
    </div>
</div>
```

### 3.5 CSS Customization

Theme customization via CSS custom properties, set through the config:

```css
:host {
  /* Colors */
  --ca-color-primary: #2563eb;
  --ca-color-primary-hover: #1d4ed8;
  --ca-color-bg: #ffffff;
  --ca-color-text: #1f2937;
  --ca-color-text-secondary: #6b7280;
  --ca-color-border: #e5e7eb;
  --ca-color-overlay: rgba(0, 0, 0, 0.5);

  /* Accept/Reject button colors */
  --ca-color-accept: #16a34a;
  --ca-color-reject: #dc2626;

  /* Category icon colors */
  --ca-color-essential: #6b7280;
  --ca-color-functional: #2563eb;
  --ca-color-analytics: #7c3aed;
  --ca-color-marketing: #ea580c;
  --ca-color-social: #0ea5e9;

  /* Layout */
  --ca-border-radius: 12px;
  --ca-font-family: system-ui, -apple-system, sans-serif;
  --ca-font-size-base: 14px;
  --ca-max-width: 480px;
  --ca-z-index: 999999;

  /* Position: bottom-left | bottom-right | bottom-center | top-center */
  --ca-position: bottom-left;
}
```

Website owners override via config `theme` object or by targeting CSS variables on `#ca-cmp-root`.

### 3.6 Event System

The event bus supports both internal communication and external hooks:

```typescript
// Website owner hooks into consent changes
NoCookieCMP.on('consent:updated', (state) => {
  if (state.analytics) {
    loadGoogleAnalytics();
  }
});

// Conditional script loading pattern
NoCookieCMP.on('consent:granted', ({ category }) => {
  if (category === 'marketing') {
    loadFacebookPixel();
  }
});
```

---

## 4. Configuration Schema

### 4.1 Minimal Config (Dead Simple)

```json
{
  "siteName": "My Website",
  "categories": ["essential", "analytics"]
}
```

This is enough. The CMP will:
- Use default descriptions for "essential" and "analytics"
- Use the default light theme
- Show banner at bottom-left
- Generate default cookie policy text
- Generate `/.well-known/cookie-consent.json` with these two categories

### 4.2 Standard Config (Most Sites)

```json
{
  "siteName": "Acme Corp",
  "privacyContact": "privacy@acme.com",
  "policyUrl": "/cookie-policy",
  "categories": [
    {
      "id": "essential",
      "cookies": [
        {
          "name": "session_id",
          "provider": "Acme Corp",
          "duration": "Session",
          "purpose": "Maintains user login session"
        }
      ]
    },
    {
      "id": "analytics",
      "cookies": [
        {
          "name": "_ga",
          "provider": "Google Analytics",
          "duration": "2 years",
          "purpose": "Distinguishes unique users"
        },
        {
          "name": "_gid",
          "provider": "Google Analytics",
          "duration": "24 hours",
          "purpose": "Distinguishes unique users"
        }
      ]
    },
    {
      "id": "marketing",
      "cookies": [
        {
          "name": "_fbp",
          "provider": "Facebook",
          "duration": "3 months",
          "purpose": "Tracks visits across websites for ad delivery"
        }
      ]
    }
  ],
  "theme": {
    "mode": "auto",
    "position": "bottom-right",
    "primaryColor": "#4f46e5"
  },
  "language": "en"
}
```

### 4.3 Full Config (Advanced)

```json
{
  "$schema": "https://cdn.nocookie.zentala.io/cmp/v1/config-schema.json",
  "version": "1.0",
  "siteName": "Acme Corp",
  "siteUrl": "https://acme.com",
  "privacyContact": "privacy@acme.com",
  "dpo": "Jane Doe, DPO",
  "policyUrl": "/cookie-policy",
  "imprintUrl": "/imprint",

  "categories": [
    {
      "id": "essential",
      "name": "Strictly Necessary",
      "description": "These cookies are required for the website to function and cannot be disabled.",
      "required": true,
      "cookies": [
        {
          "name": "session_id",
          "provider": "Acme Corp",
          "providerUrl": "https://acme.com",
          "domain": ".acme.com",
          "duration": "Session",
          "purpose": "Maintains user login session",
          "type": "first-party"
        },
        {
          "name": "csrf_token",
          "provider": "Acme Corp",
          "domain": ".acme.com",
          "duration": "Session",
          "purpose": "Prevents cross-site request forgery attacks",
          "type": "first-party"
        }
      ]
    },
    {
      "id": "functional",
      "name": "Functional",
      "description": "These cookies enable enhanced functionality like remembering your preferences, language, and region settings.",
      "defaultState": false,
      "cookies": [
        {
          "name": "lang_pref",
          "provider": "Acme Corp",
          "duration": "1 year",
          "purpose": "Stores language preference"
        }
      ]
    },
    {
      "id": "analytics",
      "name": "Analytics & Performance",
      "description": "These cookies help us understand how visitors interact with the website by collecting information anonymously.",
      "defaultState": false,
      "cookies": [
        {
          "name": "_ga",
          "provider": "Google Analytics",
          "providerUrl": "https://analytics.google.com",
          "providerPrivacyUrl": "https://policies.google.com/privacy",
          "domain": ".acme.com",
          "duration": "2 years",
          "purpose": "Distinguishes unique users by assigning a randomly generated number",
          "type": "third-party"
        }
      ]
    },
    {
      "id": "marketing",
      "name": "Marketing & Advertising",
      "description": "These cookies are used to deliver advertisements that are relevant to you and your interests.",
      "defaultState": false,
      "cookies": []
    },
    {
      "id": "social-media",
      "name": "Social Media",
      "description": "These cookies enable social media features like share buttons and embedded content from social platforms.",
      "defaultState": false,
      "cookies": []
    }
  ],

  "theme": {
    "mode": "auto",
    "position": "bottom-left",
    "primaryColor": "#4f46e5",
    "acceptColor": "#16a34a",
    "rejectColor": "#dc2626",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "borderRadius": 12,
    "fontFamily": "system-ui, -apple-system, sans-serif",
    "fontSize": 14,
    "maxWidth": 480,
    "zIndex": 999999,
    "showOverlay": false,
    "animation": "slide-up"
  },

  "behavior": {
    "consentExpiry": 365,
    "showOnEveryVisit": false,
    "rejectAllOnFirstLayer": true,
    "closeOnScroll": false,
    "closeOnOutsideClick": false,
    "blockScriptsBeforeConsent": false,
    "respectGPC": true,
    "respectDNT": false,
    "emitTCFSignal": false,
    "googleConsentMode": false,
    "cookieName": "ca_consent",
    "cookieDomain": "auto",
    "cookiePath": "/",
    "cookieSecure": true,
    "cookieSameSite": "Lax"
  },

  "language": "en",
  "translations": {
    "bannerTitle": "We value your privacy",
    "bannerText": "We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. Click \"Accept All\" to consent to all cookies, or customize your preferences.",
    "acceptAll": "Accept All",
    "rejectAll": "Reject All",
    "customize": "Customize",
    "savePreferences": "Save Preferences",
    "learnMore": "Learn more",
    "cookiePolicy": "Cookie Policy",
    "poweredBy": "Powered by NoCookie"
  },

  "wellKnown": {
    "enabled": true,
    "servePath": "/.well-known/cookie-consent.json",
    "includeSelectors": true,
    "includeAPI": true
  },

  "policyPage": {
    "enabled": true,
    "path": "/cookie-policy",
    "includeIcons": true,
    "includeCookieTable": true,
    "includeToggleControls": true,
    "legalText": {
      "jurisdiction": "EU",
      "gdprReference": true,
      "eprivacyReference": true,
      "lastUpdated": "2026-03-24"
    }
  },

  "icons": {
    "showInBanner": true,
    "showInPolicy": true,
    "style": "filled",
    "size": "md"
  },

  "callbacks": {
    "onConsentUpdate": "handleConsentUpdate",
    "onBannerShow": null,
    "onBannerHide": null
  }
}
```

### 4.4 Config TypeScript Interface

```typescript
interface CMPConfig {
  /** Website name displayed in banner and policy */
  siteName: string;
  /** Privacy contact email */
  privacyContact?: string;
  /** DPO name/contact */
  dpo?: string;
  /** URL to full cookie policy page */
  policyUrl?: string;

  /**
   * Cookie categories. Can be:
   * - string array for minimal config: ["essential", "analytics"]
   * - object array for detailed config with cookie lists
   */
  categories: (string | CategoryConfig)[];

  /** Visual theme configuration */
  theme?: ThemeConfig;

  /** Behavioral settings */
  behavior?: BehaviorConfig;

  /** ISO 639-1 language code */
  language?: string;

  /** Override default translation strings */
  translations?: Partial<TranslationStrings>;

  /** Well-known file generation settings */
  wellKnown?: WellKnownConfig;

  /** Cookie policy page generation settings */
  policyPage?: PolicyPageConfig;

  /** Icon display settings */
  icons?: IconConfig;
}

interface CategoryConfig {
  /** Standard category ID: essential | functional | analytics | marketing | social-media */
  id: 'essential' | 'functional' | 'analytics' | 'marketing' | 'social-media';
  /** Display name (defaults to standard name for the ID) */
  name?: string;
  /** Category description for preference center */
  description?: string;
  /** Whether this category is always on (true for essential) */
  required?: boolean;
  /** Default state for non-required categories (false = opt-in) */
  defaultState?: boolean;
  /** Cookies in this category */
  cookies?: CookieDeclaration[];
}

interface CookieDeclaration {
  /** Cookie name (e.g., "_ga") */
  name: string;
  /** Who sets this cookie (e.g., "Google Analytics") */
  provider: string;
  /** Provider website URL */
  providerUrl?: string;
  /** Provider privacy policy URL */
  providerPrivacyUrl?: string;
  /** Cookie domain */
  domain?: string;
  /** Human-readable duration (e.g., "2 years", "Session") */
  duration: string;
  /** What this cookie does */
  purpose: string;
  /** First-party or third-party */
  type?: 'first-party' | 'third-party';
}
```

---

## 5. Cookie Policy Icons

### 5.1 Design Philosophy

Cookie policy icons work like Creative Commons badges: a standardized visual language that communicates cookie usage at a glance. Just as CC icons (BY, SA, NC, ND) instantly tell you what you can do with content, our icons instantly tell you what a site does with cookies.

### 5.2 Category Icons

Each of the five cookie categories has a dedicated icon:

| Category | Icon Shape | Color | Symbol Description |
|----------|-----------|-------|-------------------|
| **Essential** | Circle | Gray (#6b7280) | A lock — represents security, essential function. Solid, minimal, always-present feel. |
| **Functional** | Circle | Blue (#2563eb) | A gear/cog — represents functionality, customization. Suggests site features that adapt to the user. |
| **Analytics** | Circle | Purple (#7c3aed) | A bar chart — represents measurement, statistics. Three vertical bars of increasing height. |
| **Marketing** | Circle | Orange (#ea580c) | A megaphone — represents advertising, promotions. Suggests outbound communication to the user. |
| **Social Media** | Circle | Cyan (#0ea5e9) | A share/network icon — three dots connected by lines. Represents social connectivity and sharing. |

**Icon format**: Each icon is a 24x24 SVG rendered inside a circular background with the category color. The symbol is white on the colored circle. Icons scale cleanly to 16px (small inline), 24px (standard), 32px (banner), and 48px (policy page).

**Badge format**: For inline use, each icon can be rendered as a pill-shaped badge: `[icon] Category Name`. Example: `[chart icon] Analytics`. The badge has the category color as background with white text and icon.

### 5.3 Privacy Level Badges

Composite badges that summarize a site's overall cookie posture. Displayed in the cookie policy page header and optionally in the site footer.

| Badge | Visual | Meaning |
|-------|--------|---------|
| **Privacy Maximum** | Green shield with checkmark | Site uses only essential cookies. The gold standard. |
| **Privacy Friendly** | Blue shield with half-filled circle | Essential + functional only. No tracking. |
| **Balanced** | Yellow shield with balanced scale icon | Uses analytics but no marketing/social tracking. |
| **Full Tracking** | Orange shield with eye icon | Uses all cookie categories including marketing. |

The badge is rendered as a horizontal strip: `[shield icon] PRIVACY FRIENDLY — Essential + Functional only`. Color-coded left border, monochrome text.

### 5.4 Compliance Badges

Small badges indicating specific compliance features:

| Badge | Visual | Meaning |
|-------|--------|---------|
| **GDPR Compliant** | EU flag star circle + checkmark | Meets GDPR consent requirements |
| **GPC Respected** | Shield with "GPC" text | Honors Global Privacy Control signal |
| **Standard Compliant** | Our logo + "v1" | Publishes `/.well-known/cookie-consent.json` |
| **Extension Ready** | Our extension icon + lightning bolt | Native integration with NoCookie extension |

### 5.5 Visual Language Rules

- **Shape system**: All icons use circles as the base container. Badges use rounded rectangles (pills).
- **Color coding**: Consistent across all surfaces (banner, preference center, policy page, badges).
- **Size variants**: `xs` (16px), `sm` (20px), `md` (24px), `lg` (32px), `xl` (48px).
- **Accessibility**: Every icon has an `aria-label`. Color is never the sole indicator — each icon has a unique shape/symbol. Sufficient contrast ratios (4.5:1 minimum).
- **Dark mode**: In dark mode, circle backgrounds lighten slightly, symbols remain white. Badge backgrounds become semi-transparent with lighter borders.

### 5.6 Usage in Banner

The banner displays category icons as a row of small circles, providing an at-a-glance summary of what cookies the site uses:

```
+----------------------------------------------------------+
|  [lock] [chart] [megaphone]                              |
|                                                          |
|  We use essential, analytics, and marketing cookies.     |
|  Learn more                                              |
|                                                          |
|  [Reject All]  [Customize]  [Accept All]                 |
+----------------------------------------------------------+
```

---

## 6. Generated Cookie Policy Page

### 6.1 Page Structure

The CMP can generate a complete, standalone cookie policy HTML page from the configuration. This page is either:
- Injected into an existing page element (`<div id="ca-policy"></div>`)
- Served as a standalone HTML page via a build step or server-side generation

### 6.2 Page Content (top to bottom)

```
================================================================
                     COOKIE POLICY
                     Acme Corp
              Last updated: March 24, 2026
================================================================

[Privacy Level Badge: BALANCED]
[GDPR Compliant] [GPC Respected] [Standard Compliant]

----------------------------------------------------------------
OVERVIEW
----------------------------------------------------------------

This website uses cookies to provide you with the best possible
experience. Below you will find detailed information about each
type of cookie we use, why we use it, and how you can control
your preferences.

You can change your cookie preferences at any time by clicking
the "Cookie Settings" button at the bottom of any page.

----------------------------------------------------------------
COOKIE CATEGORIES
----------------------------------------------------------------

[lock icon] ESSENTIAL (Always Active)            [shield: ON]
  Strictly necessary cookies that enable core website
  functionality. These cannot be disabled.

  +----------+-----------+----------+-------------------------+
  | Cookie   | Provider  | Duration | Purpose                 |
  +----------+-----------+----------+-------------------------+
  | session  | Acme Corp | Session  | Maintains login session |
  | csrf     | Acme Corp | Session  | Security protection     |
  +----------+-----------+----------+-------------------------+

[gear icon] FUNCTIONAL                           [toggle: OFF]
  Enable enhanced functionality like language preferences
  and region settings.

  +----------+-----------+----------+-------------------------+
  | Cookie   | Provider  | Duration | Purpose                 |
  +----------+-----------+----------+-------------------------+
  | lang     | Acme Corp | 1 year   | Language preference      |
  +----------+-----------+----------+-------------------------+

[chart icon] ANALYTICS                           [toggle: OFF]
  Help us understand how visitors use our website.

  +----------+-----------+----------+-------------------------+
  | Cookie   | Provider  | Duration | Purpose                 |
  +----------+-----------+----------+-------------------------+
  | _ga      | Google    | 2 years  | Unique user identifier  |
  | _gid     | Google    | 24 hours | Session identifier      |
  +----------+-----------+----------+-------------------------+

[megaphone icon] MARKETING                       [toggle: OFF]
  Used to deliver relevant advertisements.

  No cookies declared in this category.

----------------------------------------------------------------
HOW TO CHANGE YOUR PREFERENCES
----------------------------------------------------------------

You can change your preferences at any time:

1. Click the [Cookie Settings] button in the bottom-left corner
2. Toggle each category on or off
3. Click "Save Preferences"

You can also:
- Clear all cookies by clearing your browser data
- Use the NoCookie browser extension to manage
  preferences across all websites: nocookie.zentala.io

----------------------------------------------------------------
WHAT ARE COOKIES?
----------------------------------------------------------------

Cookies are small text files stored on your device when you
visit a website. They serve various purposes from remembering
your login to analyzing site usage patterns.

[Standard legal explanation of first-party vs third-party
cookies, session vs persistent cookies]

----------------------------------------------------------------
YOUR RIGHTS
----------------------------------------------------------------

Under the EU General Data Protection Regulation (GDPR) and
ePrivacy Directive, you have the right to:

- Give or withdraw consent at any time
- Access data collected about you
- Request deletion of your data
- Lodge a complaint with a supervisory authority

----------------------------------------------------------------
CONTACT
----------------------------------------------------------------

Data Protection Officer: Jane Doe
Email: privacy@acme.com
Website: https://acme.com/imprint

----------------------------------------------------------------
POWERED BY
----------------------------------------------------------------

This cookie policy is managed by NoCookie CMP,
an open-source consent management platform.
https://nocookie.zentala.io

================================================================
```

### 6.3 Interactive Features

The generated policy page includes:
- **Live toggles**: Each category has a working toggle that updates consent in real time
- **Expandable details**: Cookie tables are collapsed by default, expandable per category
- **Search**: For sites with many cookies, a search/filter input
- **Print-friendly**: CSS `@media print` styles for clean printing
- **Responsive**: Full mobile support, tables scroll horizontally on small screens

---

## 7. Integration with Chrome Extension

### 7.1 Detection: How the Extension Knows It Is Our CMP

The extension detects our CMP via multiple signals (highest priority first):

1. **Well-known file**: `/.well-known/cookie-consent.json` with `"cmp": { "name": "nocookie" }`
2. **DOM marker**: The CMP root element `#ca-cmp-root` with `data-ca-version="1.0"`
3. **Global object**: `window.__cookiesAccepterCMP` is defined (set by our CMP script)
4. **Meta tag**: `<meta name="cmp" content="nocookie">`

The extension's `detector.ts` checks for `#ca-cmp-root` in its DOM selector scan (Layer 3). This is the fastest detection path — no network request needed.

### 7.2 Handshake Protocol

```
Extension (content script, ISOLATED world)
  |
  | 1. Detects #ca-cmp-root in DOM
  |
  | 2. Posts message to page:
  |    window.postMessage({
  |      type: 'CA_EXTENSION_HELLO',
  |      version: '1.0',
  |      preferences: { essential: true, functional: true, analytics: false, ... }
  |    }, '*')
  |
  v
CMP (extension-bridge.ts, MAIN world)
  |
  | 3. Receives CA_EXTENSION_HELLO
  | 4. Validates version compatibility
  | 5. Applies preferences via setConsent() for each category
  | 6. Hides banner (never shown to user, or shown for <50ms and auto-closed)
  | 7. Stores consent in cookie (same as if user clicked)
  |
  | 8. Posts response:
  |    window.postMessage({
  |      type: 'CA_EXTENSION_ACK',
  |      version: '1.0',
  |      applied: { essential: true, functional: true, analytics: false, ... },
  |      status: 'ok'
  |    }, '*')
  |
  v
Extension (content script, ISOLATED world)
  |
  | 9. Receives CA_EXTENSION_ACK
  | 10. Reports to background: consent handled, method: 'extension-native'
  | 11. Sets badge: green checkmark
  |
  Done. Total time: <100ms. User sees nothing.
```

### 7.3 Timing

The CMP's `extension-bridge.ts` sets up a `message` event listener immediately on script load, before rendering the banner. The sequence is:

1. CMP script loads, bridge listener is active
2. CMP queues banner render via `requestAnimationFrame` (not immediate)
3. Extension content script detects `#ca-cmp-root` (MutationObserver or DOM scan)
4. Extension sends `CA_EXTENSION_HELLO` with preferences
5. Bridge receives message, applies preferences, cancels banner render
6. Bridge sends `CA_EXTENSION_ACK`
7. Banner never appears (or appears for a single frame and is hidden)

If the extension message arrives AFTER the banner is visible (slow extension, fast page):
- Bridge still applies preferences
- Banner is closed with a brief "Preferences applied" animation (200ms fade-out)
- User sees the banner flash briefly — acceptable degradation

### 7.4 Preference Conflicts

What if the extension's preferences reference categories the site does not use?

| Scenario | Behavior |
|----------|----------|
| Extension allows analytics, site has no analytics category | Ignored silently. Only known categories are set. |
| Extension rejects marketing, site has marketing | Marketing is rejected. Site respects this. |
| Extension allows social-media, site groups it under marketing | CMP uses its own category mapping. Extension preferences are best-effort. |
| Site has custom categories not in our taxonomy | CMP maps custom categories to nearest standard category via config. |

The `CA_EXTENSION_ACK` response includes `applied` — the actual consent state after applying preferences. The extension displays this in its popup, so the user sees what was actually set (not what was requested).

### 7.5 Fallback: Extension Without Our CMP

If the site does NOT use our CMP, the extension falls back to its standard detection layers (well-known, JS API probing, DOM selectors, script URLs, heuristics). Our CMP integration is an optimization, not a requirement.

---

## 8. Comparison with Competitors

### 8.1 Feature Matrix

| Feature | **Ours** | OneTrust | Cookiebot | Osano |
|---------|:--------:|:--------:|:---------:|:-----:|
| **Price** | Free (OSS) | $$$$ (enterprise) | $$-$$$ | $-$$ |
| **Open source** | Yes (MIT) | No | No | No |
| **Extension-native** | Yes | No | No | No |
| **Auto well-known JSON** | Yes | No | No | No |
| **Cookie policy icons** | Yes | No | No | No |
| **Auto policy page** | Yes | Yes | Yes | Yes |
| **Per-category toggles** | Yes | Yes | Yes | Yes |
| **GPC support** | Yes | Partial | Partial | Yes |
| **TCF support** | Emit only | Full | Full | Full |
| **A/B testing** | No | Yes | No | Yes |
| **Vendor management** | No | Yes | Yes | Yes |
| **Geo-targeting** | No | Yes | Yes | Yes |
| **Cookie scanning** | No | Yes | Yes | Yes |
| **Legal templates** | Basic | Extensive | Moderate | Moderate |
| **Bundle size** | <30KB | ~200KB+ | ~100KB+ | ~80KB+ |
| **Self-hosted** | Yes | No (SaaS) | No (SaaS) | No (SaaS) |

### 8.2 What We Do Better

1. **Free and open source** — no pricing tiers, no feature gates, no vendor lock-in
2. **Extension-native** — zero-friction experience for users with our extension
3. **Standard-compliant output** — auto-generates `/.well-known/cookie-consent.json`
4. **Cookie policy icons** — visual language for cookie categories, unprecedented
5. **Lightweight** — under 30KB vs 80-200KB for competitors
6. **Self-hosted** — no SaaS dependency, no third-party scripts, no data leaving the site
7. **Privacy by design** — no tracking pixels, no analytics on the CMP itself

### 8.3 What We Do Not Do (and Why)

1. **Enterprise vendor management** — we are not targeting compliance teams at Fortune 500s
2. **Automated cookie scanning** — requires server infrastructure; recommend CookieServe or similar
3. **Geo-targeting** — adds complexity; suggest using existing CDN/server logic for regional rules
4. **Full TCF CMP certification** — requires IAB registration, ongoing compliance costs
5. **Legal compliance consulting** — we provide tools, not legal advice

### 8.4 Positioning

**"The CMP for the modern, privacy-respecting web."**

Target audience: independent developers, small-to-medium businesses, open-source projects, privacy-conscious site owners. People who want GDPR compliance without paying enterprise CMP prices and without adding 200KB of third-party JavaScript to their site.

---

## 9. UI Mockup Descriptions

### 9.1 Banner (First Layer)

Position: fixed at bottom-left of viewport, floating above content.

```
+----------------------------------------------------+
|                                                    |
|  [lock] [chart] [megaphone]                        |
|                                                    |
|  We use cookies to enhance your experience.        |
|  Learn more about our cookie policy.               |
|                                                    |
|  +-------------+ +------------+ +-------------+   |
|  | Reject All  | | Customize  | | Accept All  |   |
|  +-------------+ +------------+ +-------------+   |
|                                                    |
+----------------------------------------------------+
```

Visual details:
- White card with subtle shadow (`box-shadow: 0 4px 24px rgba(0,0,0,0.12)`)
- Rounded corners (12px)
- Category icons as small colored circles in the top-left
- "Learn more" is an underlined link to the policy page
- "Reject All" is outlined/ghost button (secondary style)
- "Customize" is outlined button with gear icon
- "Accept All" is solid green button (primary action)
- Max width: 480px
- Entrance animation: slides up from bottom with 300ms ease-out
- Semi-transparent backdrop overlay is OFF by default (configurable)

### 9.2 Preference Center (Second Layer)

Opens as a modal overlay, centered on screen.

```
+----------------------------------------------------------+
|  Cookie Preferences                              [X]     |
+----------------------------------------------------------+
|                                                          |
|  [lock] Essential                      [Always Active]   |
|  > Required for the site to function.                    |
|  v [Expand to see 2 cookies]                             |
|                                                          |
|  --------------------------------------------------------|
|                                                          |
|  [gear] Functional                     [ OFF toggle ]    |
|  > Enables language prefs, chat widgets.                 |
|  v [Expand to see 1 cookie]                              |
|                                                          |
|  --------------------------------------------------------|
|                                                          |
|  [chart] Analytics                     [ OFF toggle ]    |
|  > Helps us understand site usage.                       |
|  v [Expand to see 2 cookies]                             |
|    +--------+--------+--------+-----------------------+  |
|    | _ga    | Google | 2 yrs  | Unique user ID        |  |
|    | _gid   | Google | 24 hrs | Session ID            |  |
|    +--------+--------+--------+-----------------------+  |
|                                                          |
|  --------------------------------------------------------|
|                                                          |
|  [megaphone] Marketing                 [ OFF toggle ]    |
|  > Relevant ads and promotions.                          |
|  v [Expand to see 1 cookie]                              |
|                                                          |
+----------------------------------------------------------+
|  [Reject All]      [Save Preferences]      [Accept All]  |
+----------------------------------------------------------+
```

Visual details:
- Centered modal, max-width 600px, max-height 80vh with scroll
- Header with title and close button
- Each category is a collapsible section with icon, name, toggle, description
- Essential category shows "Always Active" label instead of toggle
- Cookie table appears when section is expanded
- Toggle switches use smooth animation (200ms)
- Three action buttons at bottom: Reject All (ghost), Save (primary blue), Accept All (green)
- Focus trap: Tab key cycles through modal elements only
- Escape key closes modal

### 9.3 Cookie Policy Page

Full-width page content, designed to be injected into the site's existing layout.

```
================================================================

  COOKIE POLICY                    [BALANCED badge]
  Acme Corp                  [GDPR] [GPC] [Standard]
  Last updated: March 24, 2026

================================================================

  [Overview paragraph text...]

  ============================================================

  COOKIE CATEGORIES

  +------------------------------------------------------+
  | [lock] Essential                   [Always Active]   |
  |   Required for the site to function.                 |
  |                                                      |
  |   Cookie    Provider    Duration    Purpose           |
  |   -------   --------   --------   ----------------   |
  |   session   Acme Corp  Session    Login session       |
  |   csrf      Acme Corp  Session    Security            |
  +------------------------------------------------------+

  +------------------------------------------------------+
  | [chart] Analytics                  [OFF toggle]      |
  |   Helps us understand how visitors use our site.     |
  |                                                      |
  |   Cookie    Provider    Duration    Purpose           |
  |   -------   --------   --------   ----------------   |
  |   _ga       Google      2 years    Unique user ID    |
  |   _gid      Google      24 hours   Session ID        |
  +------------------------------------------------------+

  [More categories...]

  ============================================================

  HOW TO CHANGE PREFERENCES
  [Instructions + "Cookie Settings" button]

  WHAT ARE COOKIES?
  [Standard explanation]

  YOUR RIGHTS (GDPR)
  [Legal text about rights]

  CONTACT
  [DPO info, email]

  ============================================================
  Powered by NoCookie CMP (open source)
  nocookie.zentala.io
================================================================
```

### 9.4 Cookie Badges on Site

Website owners can embed category badges anywhere on their site:

```html
<div class="ca-badges">
  <!-- Auto-generated by CMP -->
  <span class="ca-badge ca-badge--essential">[lock] Essential</span>
  <span class="ca-badge ca-badge--analytics">[chart] Analytics</span>
</div>
```

Renders as small pill-shaped badges:

```
  [lock Essential]  [chart Analytics]  [megaphone Marketing]
```

Each badge is color-coded to its category. Clicking a badge opens the preference center
scrolled to that category's section.

The privacy level badge for the footer:

```
  [green shield] PRIVACY FRIENDLY — Essential + Functional only
```

---

## 10. Constraints and Technical Decisions

### 10.1 Shadow DOM

The CMP renders inside an open Shadow DOM to prevent CSS leakage between the host page and the CMP. This is critical — the CMP must look consistent regardless of the host site's CSS.

Open shadow DOM (not closed) because:
- Our extension needs to query elements inside the shadow root
- Debugging and testing tools need access
- Website owners may want to style-override (documented, not encouraged)

### 10.2 Consent Cookie Format

Consent is stored as a first-party cookie:

```
ca_consent=e:1|f:0|a:1|m:0|s:0|t:1711324800|v:1
```

Fields:
- `e` = essential (always 1)
- `f` = functional (0/1)
- `a` = analytics (0/1)
- `m` = marketing (0/1)
- `s` = social-media (0/1)
- `t` = timestamp (unix)
- `v` = config version

Compact format keeps cookie size minimal. Readable by site-side scripts without the CMP loaded.

### 10.3 Build Tooling

- **Bundler**: Vite (fast, supports library mode, tree-shaking)
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Linting**: ESLint + Prettier
- **CSS**: PostCSS with autoprefixer, minification
- **Target**: ES2020+ (modern browsers only — no IE11)

### 10.4 Internationalization

Built-in translation strings for 16 languages (same set as the extension). Website owners can override any string via the `translations` config key.

The CMP auto-detects language from:
1. Config `language` field (explicit)
2. `<html lang="xx">` attribute
3. `navigator.language`

---

## 11. Standardized Cookie Practice Descriptions

### 11.1 Design Philosophy

Website owners should not need to write cookie descriptions from scratch. The CMP provides a taxonomy of standardized, human-readable descriptions for each cookie category and common cookie practices. This mirrors how Creative Commons provides standardized legal text — website owners pick from predefined descriptions or write custom ones.

### 11.2 Category Descriptions (Standard Library)

Each category comes with a default description in multiple languages. Website owners can:
1. Use the default description as-is (zero effort)
2. Select from alternative predefined descriptions (light customization)
3. Write fully custom descriptions (full control)

**Essential**:
- Default: "These cookies are strictly necessary for the website to function. They enable core features like security, network management, and account access. You cannot disable these cookies."
- Alt 1: "Required cookies that keep the site working. Without them, pages would not load correctly."
- Alt 2: "Core cookies for basic website operation, security, and user authentication."

**Functional**:
- Default: "These cookies enable enhanced functionality and personalization, such as remembering your language preference, region, or display settings."
- Alt 1: "Cookies that remember your preferences so you do not have to set them every visit."
- Alt 2: "Used to provide features like live chat, video playback, and custom themes."

**Analytics**:
- Default: "These cookies help us understand how visitors interact with our website by collecting information anonymously. This helps us improve the site."
- Alt 1: "We use analytics to measure which pages are popular and how visitors navigate the site."
- Alt 2: "Performance cookies that help us diagnose issues and understand usage patterns."

**Marketing**:
- Default: "These cookies are used to deliver advertisements relevant to you and your interests. They may also limit the number of times you see an ad and measure the effectiveness of advertising campaigns."
- Alt 1: "We share browsing data with advertising partners to show you relevant ads across the web."
- Alt 2: "Used for targeted advertising and measuring ad campaign performance."

**Social Media**:
- Default: "These cookies enable social media features such as share buttons and embedded content from platforms like Facebook, Twitter, and Instagram."
- Alt 1: "Allow you to share content on social networks and enable embedded social media widgets."
- Alt 2: "Connect your browsing to your social media accounts for sharing and interaction features."

### 11.3 Per-Cookie Practice Descriptions

For common third-party cookies, the CMP includes a database of standardized descriptions:

| Cookie | Provider | Standard Description |
|--------|----------|---------------------|
| `_ga` | Google Analytics | "Distinguishes unique visitors by assigning a randomly generated number" |
| `_gid` | Google Analytics | "Identifies unique visitors within a 24-hour window" |
| `_fbp` | Facebook | "Tracks visits across websites for ad delivery and retargeting" |
| `_gcl_au` | Google Ads | "Stores conversion data for Google Ads click attribution" |
| `fr` | Facebook | "Delivers targeted advertisements based on browsing behavior" |
| `IDE` | Google DoubleClick | "Used for targeted advertising and ad campaign measurement" |

This database is extensible — website owners can contribute descriptions for new cookies.

### 11.4 Multi-Language Support

All standard descriptions ship in at least 5 languages for v1:
- English (EN)
- German (DE)
- French (FR)
- Spanish (ES)
- Polish (PL)

Additional languages added in the same i18n pipeline as UI strings (T13).

### 11.5 Usage Across Surfaces

The standardized descriptions appear in:
1. **Banner** — short category summary (one-line version)
2. **Preference Center** — full category description + per-cookie purpose
3. **Cookie Policy Page** — complete descriptions with provider links and legal context

---

## 12. Visual Preview / Configurator Tool

### 12.1 Purpose

A web-based tool where website owners can configure their CMP and see a live preview of what their banner, preference center, and cookie policy page will look like. This is the primary conversion funnel for CMP adoption — a website owner arrives, configures their setup, and leaves with everything they need to deploy.

### 12.2 Tool Features

**Step 1 — Basic Info**:
- Site name, privacy contact email, policy URL
- Language selection

**Step 2 — Cookie Categories**:
- Toggle which categories the site uses (essential is always on)
- For each category: pick a standard description or write custom
- For each category: add cookies (name, provider, duration, purpose)
- Pre-populated templates for common setups ("Blog with analytics", "E-commerce with marketing", etc.)

**Step 3 — Theme**:
- Color picker for primary color, accept/reject button colors
- Position selector (bottom-left, bottom-right, bottom-center, top-center)
- Light / dark / auto mode toggle
- Border radius slider
- Font family selector

**Step 4 — Live Preview**:
- Split-screen: config on left, preview on right
- Preview toggles between: banner view, preference center view, policy page view
- Preview updates in real-time as config changes
- Mobile / desktop preview toggle

**Step 5 — Export**:
- Download config JSON file
- Copy `<script>` tag for CDN installation
- Copy npm install command + init code
- Download generated `cookie-consent.json` (well-known file)
- Download badge kit (SVG icons + CSS)
- One-click "Validate my setup" (checks config against schema)

### 12.3 Technical Implementation

- Built as a standalone page on nocookie.zentala.io
- Uses the actual CMP library for preview rendering (not a mockup)
- Config state managed in URL hash for shareability (e.g., `nocookie.zentala.io/configurator#config=base64...`)
- No server required — all client-side
- Export generates downloadable files via Blob URLs

### 12.4 Templates

Pre-built configurations for common site types:

| Template | Categories | Cookies Included |
|----------|-----------|-----------------|
| **Minimal Blog** | Essential only | session, CSRF |
| **Blog + Analytics** | Essential, Analytics | session, CSRF, _ga, _gid |
| **Business Site** | Essential, Functional, Analytics | session, CSRF, lang, _ga, _gid |
| **E-commerce** | Essential, Functional, Analytics, Marketing | session, cart, _ga, _gid, _fbp |
| **Full Stack** | All 5 categories | Common cookies per category |

---

## 13. Future Considerations (Not in Scope for E003)

- **Admin dashboard**: Web-based configuration UI instead of JSON config
- **Server-side script blocking**: Intercept third-party scripts before consent
- **Automated cookie scanning**: Detect cookies without manual declaration
- **WordPress plugin**: Dedicated WP plugin wrapping the JS core
- **Shopify app**: Integration for e-commerce sites
- **Google Tag Manager template**: GTM community template
- **Consent receipts**: Cryptographic proof of consent for compliance audits
- **A/B testing**: Banner layout/copy optimization (enterprise feature)
