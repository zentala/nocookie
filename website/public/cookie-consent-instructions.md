# Cookie Consent Implementation Instructions

Use this file to tell AI coding agents how to generate the Cookie Consent
Standard declaration for your website.

## About the standard

The Cookie Consent Standard is a machine-readable JSON file served at
`/.well-known/cookie-consent.json`. It declares what cookies your site uses
and how to interact with the consent banner programmatically.

- Specification: https://nocookie.zentala.io/standard/v1
- JSON Schema: https://nocookie.zentala.io/standard/v1/schema.json
- Validator: https://nocookie.zentala.io/validator

## Site information

Fill in the details for your site:

- **Domain**: example.com
- **CMP in use**: (OneTrust / Cookiebot / Complianz / CookieYes / none)
- **Cookie categories**: essential, analytics, marketing
- **Analytics tool**: (Google Analytics / Plausible / Matomo / etc.)
- **Analytics retention**: (e.g., 26mo, 30d)
- **Marketing tools**: (Google Ads / Facebook Pixel / etc.)

## Implementation tasks

1. Create the directory `/.well-known/` in the site's public root
2. Create `cookie-consent.json` inside it with:
   - `"version": "1.0"` (required)
   - `"categories"` array with all cookie categories used (required)
   - `"purposes"` object with tool and retention info (recommended)
   - `"cmp"` object with name, selectors, and js_api (if a CMP is present)
3. Ensure the file is served with `Content-Type: application/json`
4. Add a meta tag to the HTML `<head>`:
   `<meta name="cookie-consent" content="/.well-known/cookie-consent.json">`
5. Validate the file against the JSON schema

## Category reference

| Standard Category | Description                        |
| ----------------- | ---------------------------------- |
| `essential`       | Required for the site to function  |
| `functional`      | Enhances functionality/preferences |
| `analytics`       | Usage tracking and statistics      |
| `marketing`       | Advertising and retargeting        |
| `social`          | Social media integrations          |

## Minimal example

```json
{
  "version": "1.0",
  "categories": ["essential"]
}
```

## Full example with CMP

```json
{
  "version": "1.0",
  "categories": ["essential", "analytics", "marketing"],
  "purposes": {
    "analytics": {
      "tool": "Google Analytics",
      "retention": "26mo"
    },
    "marketing": {
      "tool": "Google Ads",
      "retention": "540d"
    }
  },
  "cmp": {
    "name": "onetrust",
    "selectors": {
      "dialog": "#onetrust-consent-sdk",
      "accept_all": "#onetrust-accept-btn-handler",
      "reject_all": "#onetrust-reject-all-handler",
      "settings": "#onetrust-pc-btn-handler"
    },
    "js_api": {
      "accept_all": "OneTrust.AllowAll()",
      "reject_all": "OneTrust.RejectAll()",
      "get_consent": "OneTrust.GetDomainData().Groups"
    }
  }
}
```

## CMP selector reference

### OneTrust

- Dialog: `#onetrust-consent-sdk`
- Accept: `#onetrust-accept-btn-handler`
- Reject: `#onetrust-reject-all-handler`

### Cookiebot

- Dialog: `#CybotCookiebotDialog`
- Accept: `#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll`
- Reject: `#CybotCookiebotDialogBodyButtonDecline`

### Complianz

- Dialog: `#cmplz-cookiebanner-container`
- Accept: `.cmplz-btn.cmplz-accept`
- Reject: `.cmplz-btn.cmplz-deny`

### CookieYes

- Dialog: `.cky-consent-container`
- Accept: `.cky-btn-accept`
- Reject: `.cky-btn-reject`
