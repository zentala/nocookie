# T02: Cookie Categories, GDPR Consent Standards & Legal Framework

**Date**: 2026-03-24
**Type**: Research report
**Epic**: E001 — Research Phase

---

## 1. Legal Framework

### 1.1 Two Overlapping Regulations

Cookie consent in the EU is governed by **two complementary regulations**:

| Regulation | Scope | Key Provision |
|---|---|---|
| **ePrivacy Directive** (2002/58/EC, amended 2009/136/EC) | Access to/storage of information on user devices | Art. 5(3): prior consent required before placing non-essential cookies |
| **GDPR** (2016/679) | Processing of personal data | Defines what constitutes valid consent (Art. 4(11), Art. 7); applies when cookies process personal data |

The ePrivacy Directive is the **lex specialis** — it specifically governs cookies/trackers. GDPR provides the general consent framework and enforcement teeth. Both must be satisfied simultaneously.

### 1.2 What Constitutes Valid Consent (GDPR Art. 4(11), Art. 7)

Consent must be:

| Requirement | Meaning |
|---|---|
| **Freely given** | No detriment for refusing; no bundling with service access (cookie walls are controversial) |
| **Specific** | Per-purpose consent; users must be able to accept analytics while rejecting marketing |
| **Informed** | Clear explanation of what cookies do, who uses them, for how long |
| **Unambiguous indication** | Affirmative action required (click, toggle). Silence, pre-ticked boxes, inactivity, scrolling, or continued browsing do NOT constitute consent (Recital 32 GDPR) |
| **Withdrawable** | Must be as easy to withdraw consent as to give it |
| **Prior** | Non-essential cookies must be blocked until consent is obtained |

### 1.3 Which Cookies Require Consent?

| Category | Consent Required? | Legal Basis |
|---|---|---|
| **Strictly necessary** | No | ePrivacy Art. 5(3) exemption — "strictly necessary to provide an information society service explicitly requested by the user" |
| **All other cookies** | Yes | Prior, informed, specific consent required |

### 1.4 Strictly Necessary Cookie Examples (Exempt from Consent)

These cookies are exempt because they are essential to deliver a service the user explicitly requested:

- Session/authentication cookies (login state)
- Shopping cart cookies (e-commerce)
- Load-balancing cookies (server distribution)
- CSRF protection tokens (security)
- Cookie consent preference storage (remembering the user's consent choice itself)
- Multimedia player session cookies
- UI customization for current session (e.g., language selected by the user)

**Important**: Even exempt cookies must be disclosed in a cookie policy. A consent banner is not required solely for strictly necessary cookies, but users must be informed.

### 1.5 Enforcement Trends (2024-2026)

- **Intensified enforcement** of prior consent — regulators penalize sites that fire cookies before consent.
- **Dark pattern crackdowns** — CNIL (France) fined publishers for making "Accept" visually dominant over "Reject."
- **EDPB task force** concluded that if "Accept All" appears on a layer, "Reject All" must appear on the same layer.
- **CNIL formally requires** "Reject All" on the first layer of the banner.
- Some DPAs (not all) are more lenient and allow "Reject All" on a second layer, but the trend is toward first-layer requirements.

---

## 2. Standard Cookie Categories

### 2.1 De Facto Industry Standard (4-5 Categories)

There is no single legally mandated taxonomy, but a **de facto standard of 4-5 categories** has emerged across major CMPs. The names vary slightly but the concepts are consistent:

| # | Cookiebot | OneTrust | CookieYes | Common Name | Consent Required? |
|---|---|---|---|---|---|
| 1 | Necessary | Strictly Necessary (C0001) | Necessary | **Essential / Strictly Necessary** | No |
| 2 | Preferences | Functional (C0003) | Functional | **Functional / Preferences** | Yes |
| 3 | Statistics | Performance (C0002) | Analytics | **Analytics / Statistics / Performance** | Yes |
| 4 | Marketing | Targeting (C0004) | Advertisement | **Marketing / Advertising / Targeting** | Yes |
| 5 | — | Social Media (C0005) | — | **Social Media** (sometimes merged with Marketing) | Yes |

**Note**: CookieYes uses 5 categories (splitting Analytics and Performance). OneTrust has a 5th "Social Media" category. Cookiebot sticks to 4. The core 4-category model is the most common.

### 2.2 Category Definitions

#### Essential / Strictly Necessary
- Required for basic website functionality
- Examples: session management, authentication, CSRF tokens, load balancing, consent storage
- Always active; cannot be disabled by the user
- No consent required (ePrivacy Art. 5(3) exemption)

#### Functional / Preferences
- Enable enhanced functionality and personalization
- Examples: language preferences, region selection, chat widgets, form auto-fill, video player preferences
- Not strictly necessary but improve user experience
- Consent required

#### Analytics / Statistics / Performance
- Collect data about how visitors use the website
- Examples: Google Analytics, Matomo, page view counts, bounce rates, traffic sources, error logging
- Used to understand and improve the site
- Consent required
- Can be first-party or third-party

#### Marketing / Advertising / Targeting
- Track users across websites to build profiles and deliver targeted ads
- Examples: Google Ads, Facebook Pixel, retargeting cookies, ad frequency caps
- Almost always third-party
- Consent required
- Most privacy-invasive category

#### Social Media (Optional 5th Category)
- Enable social sharing, embedded content, social login
- Examples: Facebook Like button, Twitter embeds, LinkedIn widgets
- Often merged with Marketing since social platforms also track users
- Consent required

### 2.3 OneTrust Category IDs

OneTrust uses standardized category identifiers that are referenced in integrations:

| Category ID | Name | Always Active? |
|---|---|---|
| C0001 | Strictly Necessary | Yes |
| C0002 | Performance | No |
| C0003 | Functional | No |
| C0004 | Targeting | No |
| C0005 | Social Media | No |

OneTrust also supports custom categories and maintains a database of 45+ million pre-categorized cookies.

---

## 3. IAB TCF v2.2 Purpose Taxonomy

The IAB Transparency & Consent Framework defines a more granular, **purpose-based taxonomy** used primarily in the advertising ecosystem.

### 3.1 TCF Purposes (1-11)

| ID | Purpose Name | Legal Basis Options |
|---|---|---|
| 1 | Store and/or access information on a device | Consent only |
| 2 | Use limited data to select advertising | Consent or Legitimate Interest |
| 3 | Create profiles for personalised advertising | Consent only |
| 4 | Use profiles to select personalised advertising | Consent only |
| 5 | Create profiles to personalise content | Consent only |
| 6 | Use profiles to select personalised content | Consent only |
| 7 | Measure advertising performance | Consent or Legitimate Interest |
| 8 | Measure content performance | Consent or Legitimate Interest |
| 9 | Understand audiences through statistics or combinations of data | Consent or Legitimate Interest |
| 10 | Develop and improve services | Consent or Legitimate Interest |
| 11 | Use limited data to select content | Consent or Legitimate Interest |

**Key change in v2.2**: Legitimate Interest was removed as a legal basis for Purposes 3, 4, 5, and 6 (all personalization purposes). These now require explicit consent.

### 3.2 Special Purposes (Not Refusable)

| ID | Special Purpose | Legal Basis |
|---|---|---|
| 1 | Ensure security, prevent and detect fraud, and fix errors | Legitimate Interest |
| 2 | Deliver and present advertising and content | Legitimate Interest |
| 3 | Save and communicate privacy choices | Legitimate Interest |

Special purposes operate under legitimate interest and cannot be refused by users — they are essential operational functions.

### 3.3 Features (Informational Only)

Features require no consent and cannot be refused. They describe data processing techniques:

| ID | Feature |
|---|---|
| 1 | Match and combine data from other data sources |
| 2 | Link different devices |
| 3 | Identify devices based on information transmitted automatically |

### 3.4 Special Features (Consent Required)

| ID | Special Feature | Legal Basis |
|---|---|---|
| 1 | Use precise geolocation data | Consent only |
| 2 | Actively scan device characteristics for identification | Consent only |

### 3.5 Mapping TCF Purposes to Standard Cookie Categories

| Standard Category | Approximate TCF Purposes |
|---|---|
| Essential / Necessary | Special Purposes 1-3 (not refusable) |
| Functional / Preferences | Purpose 11 (limited data for content), partially Purpose 8 |
| Analytics / Statistics | Purposes 7, 8, 9, 10 |
| Marketing / Advertising | Purposes 1, 2, 3, 4 |
| Content Personalization | Purposes 5, 6 |

This mapping is approximate. TCF is more granular than the standard 4-category model, which is why TCF-compliant CMPs show purpose-level toggles in addition to (or instead of) category-level toggles.

---

## 4. Cookie Consent UI Patterns

### 4.1 Minimal Compliant UI (GDPR + EDPB/CNIL Guidance)

A minimal GDPR-compliant cookie banner must include:

| Element | Required? | Notes |
|---|---|---|
| "Accept All" button | Yes (if offering bulk option) | Enables all non-essential cookies |
| "Reject All" button | Yes (same layer as Accept) | CNIL requires first-layer; EDPB majority agrees |
| "Customize" / "Manage Preferences" link | Yes | Opens granular selection |
| Informational text | Yes | Brief explanation of cookie usage + link to cookie policy |
| Equal visual weight of Accept/Reject | Yes | Same size, color, prominence. Unequal = dark pattern |

### 4.2 Common UI Layers

**Layer 1 — Banner (first impression)**:
- Brief informational text
- "Accept All" button
- "Reject All" button (required on same layer by CNIL and most DPAs)
- "Customize" / "Manage Preferences" link/button

**Layer 2 — Preference Center (granular control)**:
- Category-level toggles (Essential locked on, others default OFF)
- Description of each category
- "Save Preferences" button
- Optional: link to full cookie declaration

**Layer 3 — Cookie Declaration (detailed)**:
- Full list of cookies per category
- Cookie name, provider, purpose, expiry, type (1st/3rd party)

### 4.3 Granularity Levels in Practice

| Level | What User Controls | Used By |
|---|---|---|
| **Binary** | Accept All / Reject All only | Simplest approach; compliant if both options on first layer |
| **Category toggles** | 4-5 switches (necessary, functional, analytics, marketing) | Most common: Cookiebot, OneTrust, CookieYes |
| **Purpose toggles** | 11 TCF purposes individually | TCF-compliant CMPs (advertising-heavy sites) |
| **Vendor toggles** | Individual vendor on/off | TCF CMPs; often hundreds of vendors |
| **Combined** | Categories + purposes + vendors in nested UI | Enterprise CMPs like OneTrust, Usercentrics |

### 4.4 Non-Compliant Patterns (Dark Patterns to Avoid)

| Pattern | Why Non-Compliant |
|---|---|
| Pre-ticked boxes/toggles for non-essential cookies | Recital 32 GDPR: silence/inactivity is not consent |
| "Accept" prominent, "Reject" hidden or styled differently | Not freely given; manipulative |
| "Reject" only on second layer, "Accept" on first | Violates CNIL guidance and EDPB majority position |
| Cookie wall (block access until Accept) | Debated; EDPB says generally not freely given unless genuine equivalent alternative |
| Scrolling or continued browsing = consent | Explicitly non-compliant per GDPR |
| "Legitimate Interest" for tracking purposes | v2.2 removed LI for personalization purposes 3-6 |
| Confusing or misleading category names | Violates "informed" consent requirement |

---

## 5. Technical Standards

### 5.1 IAB TCF Consent String (TC String)

The TC String is the core technical artifact of the TCF framework.

**Storage**: First-party cookie named `euconsent-v2`

**Format**: Base64url-encoded binary data (no padding `=` characters)

**Key fields encoded in the string**:
- TCF version number
- Consent creation timestamp
- Last updated timestamp
- CMP ID (registered with IAB)
- CMP version
- Consent screen number
- Consent language (ISO 639-1)
- Vendor list version
- Purpose consents (bitfield — one bit per purpose 1-11)
- Purpose legitimate interests (bitfield)
- Vendor consents (bitfield or range-encoded)
- Vendor legitimate interests
- Publisher restrictions
- Special feature opt-ins

**Parsing**: The Base64-decoded byte stream must be read as an **unaligned bit-stream**. Standard Base64 decoding produces bytes, but TCF fields are bit-aligned, not byte-aligned.

### 5.2 The `__tcfapi` JavaScript API

```javascript
__tcfapi(command, version, callback, parameter)
```

**Required commands**:

| Command | Purpose |
|---|---|
| `ping` | Check CMP loaded status and GDPR applicability; returns `PingReturn` object |
| `addEventListener` | Register callback invoked when TC String changes; receives `TCData` + success boolean |
| `removeEventListener` | Unregister a previously registered listener |

**Optional commands**:

| Command | Purpose |
|---|---|
| `getInAppTCData` | Retrieve TC data for mobile in-app contexts |
| `getVendorList` | Fetch the Global Vendor List by version |

**Usage pattern** (recommended by IAB):
```javascript
__tcfapi('addEventListener', 2, function(tcData, success) {
  if (success && tcData.eventStatus === 'useractioncomplete') {
    // User has made their consent choices
    // tcData.tcString contains the encoded TC String
    // tcData.purpose.consents is an object: { 1: true, 2: false, ... }
    // tcData.vendor.consents is an object: { vendorId: true/false, ... }
  }
});
```

**Important**: Vendors must use `addEventListener` (not the deprecated `getTCData`) per TCF v2.2 spec.

### 5.3 Consent Data Storage Across CMPs

| CMP | Cookie/Storage Name | Format | Notes |
|---|---|---|---|
| IAB TCF | `euconsent-v2` | Base64url-encoded TC String | Standardized across all TCF CMPs |
| Cookiebot | `CookieConsent` | JSON-encoded object | Contains `{necessary: true, preferences: true/false, statistics: true/false, marketing: true/false}` |
| OneTrust | `OptanonConsent` | URL-encoded key-value pairs | Contains group consent: `groups=C0001:1,C0002:0,C0003:0,C0004:0` |
| CookieYes | `cookieyes-consent` | JSON or key-value | Contains category consent states |
| Usercentrics | `uc_user_interaction`, `uc_settings` | JSON | Contains service-level consent |

### 5.4 Google Consent Mode v2

Major CMPs now also integrate with Google Consent Mode v2, which maps cookie categories to Google's consent signals:

| Google Signal | Maps To | Default (no consent) |
|---|---|---|
| `ad_storage` | Marketing/Advertising cookies | denied |
| `analytics_storage` | Analytics cookies | denied |
| `ad_user_data` | Sharing user data for ads | denied |
| `ad_personalization` | Personalized advertising | denied |
| `functionality_storage` | Functional cookies | granted |
| `personalization_storage` | Personalization cookies | granted |
| `security_storage` | Security cookies | granted |

---

## 6. User Preference Mapping

### 6.1 "I Only Want Essential Cookies" — Technical Translation

When a user clicks "Reject All" or only enables "Necessary" cookies, here is what that means across different systems:

| System | Technical State |
|---|---|
| **Cookiebot** | `CookieConsent = {necessary: true, preferences: false, statistics: false, marketing: false}` |
| **OneTrust** | `OptanonConsent groups=C0001:1,C0002:0,C0003:0,C0004:0` |
| **CookieYes** | `necessary: yes, functional: no, analytics: no, performance: no, advertisement: no` |
| **IAB TCF** | All 11 purposes = 0 (no consent); all vendor consents = 0; Special Purposes remain active |
| **Google Consent Mode** | `ad_storage: denied, analytics_storage: denied, ad_user_data: denied, ad_personalization: denied` |

### 6.2 Common User Preference Profiles

| User Choice | Essential | Functional | Analytics | Marketing | TCF Purposes Consented |
|---|---|---|---|---|---|
| Reject All | On | Off | Off | Off | None (0 of 11) |
| Essential Only | On | Off | Off | Off | None (0 of 11) |
| Essential + Functional | On | On | Off | Off | 11 |
| Essential + Analytics | On | Off | On | Off | 7, 8, 9, 10 |
| Accept All | On | On | On | On | All (1-11) + Special Features 1-2 |

### 6.3 Implications for a Cookie Auto-Accepter Extension

A browser extension that automatically handles cookie consent must understand:

1. **The banner detection problem**: No universal standard for banner HTML/CSS. Each CMP uses different selectors, button labels, and DOM structures.

2. **Category mapping**: User preferences ("I want analytics but not marketing") must map to different technical formats per CMP.

3. **CMP-specific APIs**: Rather than clicking buttons, the extension could call CMP APIs directly:
   - `Cookiebot.submitCustomConsent(preferences, statistics, marketing)`
   - `OneTrust.UpdateConsent(categoryId, consentStatus)`
   - `__tcfapi('addEventListener', 2, callback)` for TCF-based CMPs

4. **The "Reject All" shortcut**: For "essential only" the simplest approach is finding and clicking the "Reject All" button, as the result is identical across all CMPs — only strictly necessary cookies remain.

5. **Consent persistence**: After the extension sets preferences, the CMP stores them in its cookie. Subsequent page loads should respect stored consent without showing the banner again.

---

## 7. Key Takeaways

1. **There are effectively 4 standard cookie categories** across the industry: Essential, Functional, Analytics, Marketing. Some CMPs add a 5th (Social Media). This is the de facto standard.

2. **IAB TCF is more granular** with 11 purposes, 3 special purposes, 3 features, and 2 special features. It is primarily used by sites with heavy ad-tech integrations.

3. **Only strictly necessary cookies are exempt** from consent. Everything else requires prior, informed, specific, freely-given consent.

4. **"Reject All" on the first layer** is the emerging regulatory norm (CNIL mandates it, EDPB majority supports it).

5. **Consent storage varies by CMP** but follows predictable patterns: Cookiebot uses `CookieConsent`, OneTrust uses `OptanonConsent`, TCF uses `euconsent-v2`.

6. **For a cookie auto-accepter**, the most practical approach is a combination of: (a) detecting the CMP in use, (b) using CMP-specific APIs or button selectors, and (c) mapping user category preferences to the CMP's format.

---

## Sources

- [GDPR Cookie Consent Requirements for 2025 — SecurePrivacy](https://secureprivacy.ai/blog/gdpr-cookie-consent-requirements-2025)
- [Navigating the GDPR and Cookies — Usercentrics](https://usercentrics.com/knowledge-hub/gdpr-cookies/)
- [EU Cookie Compliance Explained — Usercentrics](https://usercentrics.com/knowledge-hub/eu-cookie-compliance/)
- [ePrivacy Directive — Cloudflare](https://www.cloudflare.com/learning/privacy/what-is-eprivacy-directive/)
- [ePrivacy Directive — Cookie Information](https://cookieinformation.com/what-is-the-eprivacy-directive/)
- [TCF v2.2 — IAB Europe](https://iabeurope.eu/transparency-consent-framework/)
- [IAB TCF v2.2 Purposes/Features Summary — Didomi](https://support.didomi.io/iab-tcf-v2.2-purposes/features-summary)
- [IAB Purposes (GDPR TCF) — Sourcepoint](https://docs.sourcepoint.com/hc/en-us/articles/19387918202131-IAB-purposes-GDPR-TCF)
- [Understanding TCF v2.2 — IAB Europe](https://iabeurope.eu/understanding-the-upcoming-transparency-consent-framework-v2-2/)
- [IAB TCF CMP API v2 — GitHub](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md)
- [TC String Consent Format — GitHub](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20Consent%20string%20and%20vendor%20list%20formats%20v2.md)
- [What is a TC String — TC-String.com](https://www.tc-string.com/blog/what-is-a-tc-string)
- [OneTrust Cookie Categories — Developer API](https://developer.onetrust.com/onetrust/reference/getcategorizedcookieswithcookieidsusingget)
- [OneTrust/CookiePro Categories — Ben Luong](https://www.benluong.com/onetrust-cookiepro-categories/)
- [Cookiebot Cookie Categories — Support](https://support.cookiebot.com/hc/en-us/articles/360003783574-Customizing-the-cookie-categories)
- [CookieYes Cookie Categories — Documentation](https://www.cookieyes.com/documentation/implement-prior-consent-using-cookieyes/)
- [CookieYes Strictly Necessary Cookies](https://www.cookieyes.com/blog/cookie-consent-exemption-for-strictly-necessary-cookies/)
- [Dark Patterns in Cookie Consent — CookieYes](https://www.cookieyes.com/blog/dark-patterns-in-cookie-consent/)
- [GDPR Cookie Consent UX — Germain UX](https://germainux.com/2025/11/30/gdpr-cookie-consent-ux-in-2025-banners-and-preference-centers-that-comply-without-killing-engagement/)
- [Consent Banner Best Practices — Cookiebot](https://support.cookiebot.com/hc/en-us/articles/4401873267090-Consent-banner-best-practices-for-GDPR-compliance)
- [EDPB Cookie Banner Guidelines — DLA Piper](https://privacymatters.dlapiper.com/2023/11/eu-new-edpb-guidelines-on-the-scope-of-the-cookie-rule/)
- [EDPB Cookie Banner Guidance — WSGR](https://www.wsgrdataadvisor.com/2023/03/edpb-issues-guidance-on-cookie-banners/)
- [CNIL Cookie Enforcement — Matomo](https://matomo.org/blog/2025/09/cookie-regulation-cnil/)
- [Reject Button Required — TermsFeed](https://www.termsfeed.com/blog/cookie-consent-decline-reject/)
- [IAB TCF v2.3 Transition — IAB Europe](https://iabeurope.eu/all-you-need-to-know-about-the-transition-to-tcf-v2-3/)
