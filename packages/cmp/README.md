# @nocookie/cmp

Open-source Consent Management Platform plugin with Shadow DOM isolation.
Native integration with the [NoCookie browser extension](https://github.com/zentala/cookies-accepter).

## Quick Start

### CDN (simplest)

```html
<script src="https://cdn.nocookie.zentala.io/cmp/v1/nocookie-cmp.min.js"></script>
<script>
  NoCookieCMP.init({
    siteName: "My Website",
    categories: ["essential", "analytics"],
  });
</script>
```

### npm / pnpm

```bash
pnpm add @nocookie/cmp
```

```typescript
import { NoCookieCMP } from "@nocookie/cmp";

NoCookieCMP.init({
  siteName: "My Website",
  categories: ["essential", "analytics"],
});
```

## Features

- **Shadow DOM isolation** - no CSS conflicts with your site
- **16 languages** - EN, DE, FR, ES, PL, NL, IT, PT, SV, DA, NO, FI, CS, RO, HU, EL
- **Light / Dark / Auto theme** - matches user preference or explicit choice
- **WCAG 2.1 AA accessible** - keyboard navigation, focus traps, ARIA labels
- **GPC signal support** - respects `navigator.globalPrivacyControl`
- **Extension handshake protocol** - auto-applies preferences from NoCookie extension
- **Cookie policy page generator** - embeddable or standalone HTML
- **Well-known JSON generator** - machine-readable `/.well-known/cookie-consent.json`
- **Standardized cookie descriptions** - i18n-ready category descriptions

## Configuration

### Minimal

```javascript
NoCookieCMP.init({
  siteName: "My Website",
  categories: ["essential", "analytics"],
});
```

Categories can be simple strings (`"essential"`, `"functional"`, `"analytics"`,
`"marketing"`, `"social-media"`) or full objects with overrides.

### Standard

```javascript
NoCookieCMP.init({
  siteName: "My Website",
  policyUrl: "/privacy",
  categories: ["essential", "functional", "analytics", "marketing"],
  theme: {
    mode: "auto",
    position: "bottom-right",
    primaryColor: "#2563eb",
  },
  behavior: {
    consentExpiry: 365,
    respectGPC: true,
    rejectAllOnFirstLayer: true,
  },
  language: "en",
});
```

### Full

```javascript
NoCookieCMP.init({
  siteName: "Acme Corp",
  privacyContact: "privacy@acme.com",
  dpo: "dpo@acme.com",
  policyUrl: "/privacy-policy",
  siteUrl: "https://acme.com",
  imprintUrl: "/imprint",

  categories: [
    "essential",
    "functional",
    {
      id: "analytics",
      name: "Analytics & Performance",
      description: "We use analytics to understand how visitors use our site.",
      cookies: [
        {
          name: "_ga",
          provider: "Google Analytics",
          providerUrl: "https://analytics.google.com",
          providerPrivacyUrl: "https://policies.google.com/privacy",
          domain: ".acme.com",
          duration: "2 years",
          purpose: "Distinguishes users for analytics reporting",
          type: "third-party",
        },
      ],
    },
    "marketing",
    "social-media",
  ],

  theme: {
    mode: "auto",
    position: "bottom-left",
    primaryColor: "#2563eb",
    acceptColor: "#16a34a",
    rejectColor: "#dc2626",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    borderRadius: 12,
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 14,
    maxWidth: 480,
    zIndex: 999999,
    showOverlay: false,
    animation: "slide-up",
  },

  behavior: {
    consentExpiry: 365,
    showOnEveryVisit: false,
    rejectAllOnFirstLayer: true,
    closeOnScroll: false,
    closeOnOutsideClick: false,
    blockScriptsBeforeConsent: false,
    respectGPC: true,
    respectDNT: false,
    emitTCFSignal: false,
    googleConsentMode: false,
    cookieName: "ca_consent",
    cookieDomain: "auto",
    cookiePath: "/",
    cookieSecure: true,
    cookieSameSite: "Lax",
  },

  language: "en",
  translations: {
    bannerTitle: "We value your privacy",
    bannerDescription: "Choose which cookies you allow on this website.",
  },

  wellKnown: {
    enabled: true,
    categories: ["essential", "analytics", "marketing"],
  },

  policyPage: {
    enabled: true,
    title: "Cookie Policy",
    intro: "This page explains how we use cookies.",
  },
});
```

## API Reference

### `NoCookieCMP.init(config)`

Initialize the CMP. Must be called before any other method.
Returns the CMP instance for chaining.

```typescript
const cmp = NoCookieCMP.init({ siteName: "My Site", categories: ["essential"] });
```

**Parameters:**

| Property         | Type                           | Required | Description                     |
| ---------------- | ------------------------------ | -------- | ------------------------------- |
| `siteName`       | `string`                       | Yes      | Display name of the website     |
| `categories`     | `(string \| CategoryConfig)[]` | Yes      | Consent categories to present   |
| `policyUrl`      | `string`                       | No       | URL to your privacy policy      |
| `siteUrl`        | `string`                       | No       | Main site URL                   |
| `privacyContact` | `string`                       | No       | Privacy contact email           |
| `dpo`            | `string`                       | No       | Data Protection Officer contact |
| `imprintUrl`     | `string`                       | No       | Legal imprint URL               |
| `theme`          | `ThemeConfig`                  | No       | Visual theme options            |
| `behavior`       | `BehaviorConfig`               | No       | Consent handling behavior       |
| `language`       | `string`                       | No       | UI language (default: `"en"`)   |
| `translations`   | `Partial<TranslationStrings>`  | No       | Translation overrides           |
| `wellKnown`      | `WellKnownConfig`              | No       | Well-known endpoint config      |
| `policyPage`     | `PolicyPageConfig`             | No       | Cookie policy page config       |
| `icons`          | `IconConfig`                   | No       | Icon overrides per category     |

### `NoCookieCMP.getConsent()`

Returns the current consent state as an object mapping each `CategoryId` to a boolean.

```typescript
const consent = NoCookieCMP.getConsent();
// { essential: true, analytics: false, marketing: false, ... }
```

### `NoCookieCMP.setConsent(category, granted)`

Set consent for a specific category. Emits `consent:granted` or `consent:denied`.

```typescript
NoCookieCMP.setConsent("analytics", true);
```

### `NoCookieCMP.acceptAll()`

Grant consent to all categories. Emits `consent:updated`.

### `NoCookieCMP.rejectAll()`

Reject all non-essential categories. Essential cookies remain active.

### `NoCookieCMP.openPreferences()`

Programmatically open the preference center modal.

### `NoCookieCMP.close()`

Close the banner and/or preference center.

### `NoCookieCMP.reset()`

Clear all stored consent and show the banner again. Emits `consent:reset`.

### `NoCookieCMP.on(event, handler)`

Subscribe to a CMP event. See [Events](#events) for the full list.

```typescript
NoCookieCMP.on("consent:updated", (payload) => {
  console.log("Consent changed:", payload.state);
});
```

### `NoCookieCMP.off(event, handler)`

Unsubscribe a handler from an event.

### `NoCookieCMP.getWellKnownJSON()`

Generate the `/.well-known/cookie-consent.json` object for the current configuration.

```typescript
const json = NoCookieCMP.getWellKnownJSON();
// Serve this at /.well-known/cookie-consent.json
```

### `NoCookieCMP.getPolicyHTML()`

Generate HTML for a cookie policy page based on the current config.
All user-provided strings are escaped internally to prevent XSS.

```typescript
const policyHTML = NoCookieCMP.getPolicyHTML();
document.getElementById("policy").textContent = policyHTML;
```

## Events

Subscribe with `NoCookieCMP.on(event, handler)`.

| Event                  | Payload                 | Description                     |
| ---------------------- | ----------------------- | ------------------------------- |
| `consent:granted`      | `{ category, granted }` | A specific category was granted |
| `consent:denied`       | `{ category, granted }` | A specific category was denied  |
| `consent:updated`      | `{ state, changes[] }`  | Consent state changed (bulk)    |
| `consent:reset`        | none                    | All consent was cleared         |
| `ui:banner:show`       | none                    | Banner became visible           |
| `ui:banner:hide`       | none                    | Banner was hidden               |
| `ui:preferences:open`  | none                    | Preference center opened        |
| `ui:preferences:close` | none                    | Preference center closed        |
| `extension:detected`   | none                    | NoCookie extension detected     |
| `extension:applied`    | `{ state }`             | Extension preferences applied   |
| `gpc:detected`         | none                    | GPC signal detected             |

Use `"*"` to listen to all events:

```typescript
NoCookieCMP.on("*", (event, payload) => {
  console.log(event, payload);
});
```

## Categories

Five standard categories are supported:

| ID             | Name                    | Required | Default   |
| -------------- | ----------------------- | -------- | --------- |
| `essential`    | Strictly Necessary      | Yes      | Always on |
| `functional`   | Functional              | No       | Off       |
| `analytics`    | Analytics & Performance | No       | Off       |
| `marketing`    | Marketing & Advertising | No       | Off       |
| `social-media` | Social Media            | No       | Off       |

Pass category IDs as strings for defaults, or objects for customization:

```javascript
categories: [
  "essential",
  {
    id: "analytics",
    name: "Custom Analytics Name",
    description: "Custom description text.",
    cookies: [{ name: "_ga", provider: "Google", duration: "2 years", purpose: "Analytics" }],
  },
];
```

## Theming

### Theme Options

| Property          | Type                                                                 | Default            | Description            |
| ----------------- | -------------------------------------------------------------------- | ------------------ | ---------------------- |
| `mode`            | `"light" \| "dark" \| "auto"`                                        | `"light"`          | Color scheme           |
| `position`        | `"bottom-left" \| "bottom-right" \| "bottom-center" \| "top-center"` | `"bottom-left"`    | Banner position        |
| `primaryColor`    | `string`                                                             | `"#2563eb"`        | Accent color (hex)     |
| `acceptColor`     | `string`                                                             | `"#16a34a"`        | Accept button color    |
| `rejectColor`     | `string`                                                             | `"#dc2626"`        | Reject button color    |
| `backgroundColor` | `string`                                                             | `"#ffffff"`        | Banner background      |
| `textColor`       | `string`                                                             | `"#1f2937"`        | Text color             |
| `borderRadius`    | `number`                                                             | `12`               | Corner radius in px    |
| `fontFamily`      | `string`                                                             | `"system-ui, ..."` | Font family            |
| `fontSize`        | `number`                                                             | `14`               | Base font size in px   |
| `maxWidth`        | `number`                                                             | `480`              | Max banner width in px |
| `zIndex`          | `number`                                                             | `999999`           | CSS z-index            |
| `showOverlay`     | `boolean`                                                            | `false`            | Show page overlay      |
| `animation`       | `"slide-up" \| "fade-in" \| "none"`                                  | `"slide-up"`       | Entrance animation     |

## Cookie Policy Page

Generate and embed a cookie policy page:

```javascript
// Get sanitized HTML (all user strings are escaped internally)
const policyHTML = NoCookieCMP.getPolicyHTML();

// Use the CMP's inject method for safe DOM insertion
NoCookieCMP.injectPolicy(document.getElementById("cookie-policy"));
```

The generated page includes category descriptions, cookie tables,
legal text (GDPR/ePrivacy), privacy badges, and a "Change my preferences" button.

## Extension Integration

The CMP integrates with the NoCookie browser extension via a `window.postMessage` handshake:

1. **CMP loads** and sets `window.__cookiesAccepterCMP` marker with version and protocol info
2. **Extension detects** the marker and sends a `CA_EXTENSION_HELLO` message with user preferences
3. **CMP receives** the hello, validates the protocol version, and applies the preferences
4. **CMP sends** `CA_EXTENSION_ACK` back with the applied state and any conflicts
5. **Banner is hidden** automatically when extension preferences are applied

When the extension is present, the user never sees a cookie banner -- their global
preferences are applied silently. The `extension:detected` and `extension:applied`
events fire so your code can react accordingly.

### GPC Signal

When `behavior.respectGPC` is `true` (default) and the browser sends
`navigator.globalPrivacyControl = true`, the CMP auto-rejects `marketing`
and `social-media` categories while leaving `analytics`, `functional`,
and `essential` untouched.

## i18n

### Supported Languages

English (en), German (de), French (fr), Spanish (es), Polish (pl),
Dutch (nl), Italian (it), Portuguese (pt), Swedish (sv), Danish (da),
Norwegian (no), Finnish (fi), Czech (cs), Romanian (ro), Hungarian (hu),
Greek (el).

### Custom Translations

Override specific strings while keeping the rest:

```javascript
NoCookieCMP.init({
  siteName: "My Site",
  categories: ["essential", "analytics"],
  language: "de",
  translations: {
    bannerTitle: "Datenschutz-Einstellungen",
    acceptAll: "Alle akzeptieren",
  },
});
```

## Well-Known Endpoint

Enable machine-readable consent configuration at `/.well-known/cookie-consent.json`:

```javascript
NoCookieCMP.init({
  // ...
  wellKnown: { enabled: true },
});

// Get the JSON to serve at your well-known endpoint
const json = NoCookieCMP.getWellKnownJSON();
```

The well-known file includes CMP metadata, category definitions, DOM selectors,
JavaScript API references, and signal flags (GPC, TCF) -- enabling browsers,
extensions, and AI agents to discover consent configuration without parsing the DOM.

## Browser Support

Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ (all modern browsers with Shadow DOM v1 support).

## License

[MIT](../../LICENSE)
