# T01: Existing Cookie Consent Extensions & Standards Research

**Date**: 2026-03-24
**Epic**: E001 - Research
**Status**: Complete

---

## 1. Extension Comparison Table

| Extension | Approach | Per-Category | Open Source | License | Users (approx.) | Rating | Actively Maintained | Price |
|-----------|----------|:------------:|:-----------:|---------|:----------------:|:------:|:-------------------:|-------|
| **Consent-O-Matic** | Fill consent forms per user prefs | Yes (5 categories) | Yes | MIT-like | 200K+ | 4.2-4.8/5 | Yes (Dec 2024) | Free |
| **I Don't Care About Cookies** | Hide/accept popups | No | Was open, now Avast-owned | Proprietary | 1M+ | 4.7/5 | Yes (Avast) | Free |
| **I Still Don't Care About Cookies** | Hide/accept popups (fork) | No | Yes | GPL-3.0 | 300K+ | 3.8/5 | Yes (Dec 2025) | Free |
| **Super Agent** | Fill consent forms per user prefs | Yes (3 categories) | No | Proprietary | 100K+ | ~4.0/5 | Yes | Freemium (40/week free, then $1.19/mo) |
| **CookieBlock** | ML-classify & block cookies | Yes (4 categories) | Yes | MIT | ~50K | ~4.0/5 | No (last: Aug 2022) | Free |
| **Ninja Cookie** | Auto-reject non-essential cookies | No | No | Proprietary | ~100K | ~4.0/5 | Partially | Free |
| **Cookie AutoDelete** | Delete cookies after tab close | N/A (different approach) | Yes | MIT | 500K+ | 4.5/5 | Minimal | Free |

---

## 2. Detailed Extension Analysis

### 2.1 Consent-O-Matic

- **Chrome Web Store**: https://chromewebstore.google.com/detail/consent-o-matic/mdjildafknihdffpkfmmpnpoiajfjnjd
- **GitHub**: https://github.com/cavi-au/Consent-O-Matic (~4K stars, 1,315 commits)
- **Developer**: CAVI (Centre for Advanced Visualization and Interaction), Aarhus University
- **Browsers**: Chrome, Firefox, Edge, Opera, Safari

**What it does**: Automatically fills out cookie consent popups based on user-configured preferences. Users set preferences once; the extension applies them across all supported sites.

**Detection method**: CSS selector-based rules stored in JSON files. Each supported CMP has a rule set with:
- `presentMatcher` / `showingMatcher` for detecting popup presence
- Text filters, style filters, display filters, iframe filters
- Rules for interacting with checkboxes, buttons, consent toggles
- Supports 200+ CMPs (Cookiebot, OneTrust, TrustArc, QuantCast, UserCentrics, etc.)

**Per-category consent**: Yes -- 5 categories:
1. Functional cookies
2. Analytics
3. Targeted advertising
4. Social media
5. Others

Users toggle each category on/off. When a website's categories don't align perfectly, defaults to the most privacy-preserving option.

**Key strengths**:
- Academic project with research backing
- Community-contributed rules (anyone can add CMP support)
- True per-category consent (closest to what a privacy-conscious user would want)
- Conservative defaults (rejects when uncertain)

**Limitations**:
- Requires manual rule creation for each CMP -- no AI/ML
- New/custom CMPs are unsupported until someone writes rules
- No standardized detection; each CMP needs its own rule set

---

### 2.2 I Don't Care About Cookies (IDCAC)

- **Chrome Web Store**: https://chromewebstore.google.com/detail/i-dont-care-about-cookies/fihnjjcciajhdojfnbdddfaoknhalnja
- **Website**: https://www.i-dont-care-about-cookies.eu/
- **Developer**: Originally Daniel Kladnik, acquired by Avast (Gen Digital Inc.) in September 2022

**What it does**: Removes or hides cookie consent popups. Primarily accepts all cookies to dismiss the banner.

**Detection method**: Combination of CSS rules, custom element hiding, and site-specific scripts. Maintained pattern database.

**Per-category consent**: No. Primarily "accept all" or "hide banner."

**Key concerns post-acquisition**:
- Avast has a history of collecting and selling browsing data (Jumpshot scandal, 2020)
- Extension now proprietary; no community oversight
- Recent reviews report declining effectiveness
- Privacy-conscious users have migrated to the community fork

---

### 2.3 I Still Don't Care About Cookies (ISTDCAC)

- **Chrome Web Store**: https://chromewebstore.google.com/detail/i-still-dont-care-about-c/edibdbjcniadpccecjdfdjjppcpchdlm
- **GitHub**: https://github.com/OhMyGuus/I-Still-Dont-Care-About-Cookies (~4.1K stars, 39 contributors)
- **License**: GPL-3.0

**What it does**: Same as IDCAC (debloated fork from v3.4.3). Removes Avast telemetry. Community-maintained.

**Detection method**: Same CSS/script pattern approach as original. Uses a backend API at `api.istilldontcareaboutcookies.com` (C#/.NET) for rule delivery. Faster iteration on new site support via GitHub contributions.

**Per-category consent**: No. Same "accept all / hide" approach.

**Key strengths over original**: Open source, no telemetry, faster community updates, actively maintained (last release Dec 2025).

---

### 2.4 Super Agent

- **Chrome Web Store**: https://chromewebstore.google.com/detail/superagent-automatic-cook/neooppigbkahgfdhbpbhcccgpimeaafi
- **Website**: https://super-agent.com/
- **Browsers**: Chrome, Firefox, Edge, Opera

**What it does**: Automatically fills cookie consent forms based on user preferences.

**Per-category consent**: Yes -- 3 categories:
1. Advertising
2. Functional
3. Performance

Automatically opts out of cookies not clearly within these categories.

**Pricing**: Freemium model:
- Free: 40 popups/week
- Unlimited: $1.19/month or $11.99/year

**Key concerns**:
- Not open source -- proprietary
- Freemium model limits free usage
- Unknown detection methodology (likely pattern-based)
- Less transparency than academic/open-source alternatives

---

### 2.5 CookieBlock

- **GitHub**: https://github.com/dibollinger/CookieBlock (222 stars)
- **Developer**: ETH Zurich (Information Security Group)
- **License**: MIT
- **Browsers**: Chrome, Firefox, Edge, Opera (no Safari)

**What it does**: Uses machine learning to classify cookies by purpose and blocks those that violate user preferences. Does NOT interact with consent popups -- operates at the cookie level directly.

**Detection method**: ML-based cookie classification using XGBoost decision tree forests.
- 4 separate classifiers (one per category)
- Feature extraction from cookie attributes (name, domain, path, expiry, etc.)
- 84.4% mean validation accuracy
- Deletes 90%+ of tracking cookies
- 85% of websites function without impairment

**Per-category consent**: Yes -- 4 categories:
1. Strictly Necessary
2. Functionality
3. Analytics
4. Advertising/Tracking

**Key strengths**:
- ML-based approach -- works on any site regardless of CMP
- Does not depend on consent popup interaction
- Academic research backing (ETH Zurich)
- Enforces consent at the technical level (deletes cookies), not UI level

**Limitations**:
- NOT actively maintained (last commit August 2022)
- 84.4% accuracy means some misclassification
- Can break site functionality for ~15% of sites
- Does not dismiss the consent popup itself (popup still shows)
- Different approach entirely: blocks cookies after-the-fact rather than filling consent forms

---

### 2.6 Ninja Cookie

- **Website**: https://ninja-cookie.com/
- **Browsers**: Chrome, Firefox, Edge

**What it does**: Automatically rejects non-essential cookies by interacting with cookie banners.

**Detection method**: Pattern-based, with support for custom rule lists.

**Per-category consent**: No. Binary reject approach.

**Key info**: Not open source. Free. Limited documentation. Custom rules possible but not community-driven at scale.

---

### 2.7 Cookie AutoDelete

- **GitHub**: https://github.com/Cookie-AutoDelete/Cookie-AutoDelete
- **License**: MIT
- **Browsers**: Chrome, Firefox

**What it does**: Completely different approach -- deletes cookies after tab closes, domain changes, or browser restarts. Whitelist/greylist support.

**Not a consent manager**: Does not interact with consent popups at all. Manages cookie lifecycle after they are set.

---

## 3. Key Question: Per-Category Preference Extensions

**Question**: Is there any extension that lets users set per-category preferences (essential, analytics, marketing, etc.) and auto-applies them?

**Answer**: Yes, three extensions offer this:

| Extension | Categories | How It Works |
|-----------|-----------|-------------|
| **Consent-O-Matic** | 5 (functional, analytics, advertising, social, other) | Fills consent forms via CSS selector rules for 200+ CMPs |
| **Super Agent** | 3 (advertising, functional, performance) | Fills consent forms (proprietary, freemium) |
| **CookieBlock** | 4 (necessary, functionality, analytics, advertising) | ML-classifies and blocks cookies directly (does NOT fill consent forms) |

**Consent-O-Matic is the only free, open-source extension with true per-category consent form filling.** However, it relies on manually-maintained CSS rules per CMP, so coverage depends on community contributions.

**No extension uses AI/LLM to understand arbitrary consent popups.** All pattern-based extensions require pre-built rules for each CMP. CookieBlock's ML approach classifies cookies, not consent UI.

---

## 4. Standards for Machine-Readable Cookie Consent

### 4.1 IAB Transparency and Consent Framework (TCF)

- **Spec**: https://iabeurope.eu/transparency-consent-framework/
- **Version**: TCF v2.2 (current), v2.3 (rolling out)
- **GitHub**: https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework

**What it is**: Industry standard for encoding user consent choices into a machine-readable "TC String" that propagates through the ad-tech supply chain.

**How it works**:
- Consent Management Platforms (CMPs) registered with IAB collect user consent
- User choices are encoded into a TC String (base64-encoded bitfield)
- TC String contains: per-vendor consent, per-purpose consent, legitimate interest flags
- Stored in cookies and passed via `__tcfapi` JavaScript API
- Global Vendor List (GVL) maintained by IAB Europe defines all registered vendors

**Purposes defined by TCF**:
1. Store and/or access information on a device
2. Select basic ads
3. Create a personalised ads profile
4. Select personalised ads
5. Create a personalised content profile
6. Select personalised content
7. Measure ad performance
8. Measure content performance
9. Apply market research to generate audience insights
10. Develop and improve products

**Relevance**: TCF is the de facto standard for cookie consent metadata. Extensions like Consent-O-Matic interact with TCF-compliant CMPs. However, TCF is ad-industry-driven and serves vendor interests, not necessarily user privacy.

---

### 4.2 Global Privacy Control (GPC)

- **Spec**: https://www.w3.org/TR/gpc/ (W3C draft)
- **Website**: https://globalprivacycontrol.org/

**What it is**: A browser-level HTTP signal telling websites the user opts out of data selling/sharing.

**Technical mechanism**:
- HTTP header: `Sec-GPC: 1`
- JavaScript API: `navigator.globalPrivacyControl === true`
- Binary signal (opt-out only, no per-category control)

**Website publishing**: Sites can host `/.well-known/gpc.json`:
```json
{
  "gpc": true,
  "lastUpdate": "2025-01-01"
}
```
This indicates the site respects GPC signals.

**Legal status**:
- California: legally enforceable under CCPA/CPRA
- AB 566 (signed October 2025): mandates all major browsers must include GPC by January 1, 2027
- Colorado Privacy Act: recognizes GPC as valid opt-out mechanism

**Browser support**:
- Brave, DuckDuckGo: on by default
- Firefox: available in settings
- Chrome, Safari: not yet (mandated by 2027 under AB 566)

**Limitation**: Binary signal only -- cannot express per-category preferences.

---

### 4.3 Advanced Data Protection Control (ADPC)

- **Spec**: https://www.dataprotectioncontrol.org/spec/ (Unofficial Draft, July 2021)
- **GitHub**: https://github.com/Data-Protection-Control/ADPC
- **Backed by**: noyb (Max Schrems' privacy organization), Sustainable Computing Lab

**What it is**: A proposed protocol for per-purpose consent communication between browsers and websites. The most ambitious attempt at solving the cookie consent problem at the protocol level.

**How it works**:

1. **Website publishes consent requests** via HTTP `Link` header or HTML `<link>`:
   ```
   Link: </consent-requests.json>; rel="consent-requests"
   ```

2. **Consent requests file** lists purposes:
   ```json
   {
     "consentRequests": [
       { "id": "analytics", "text": "Measure website usage with analytics tools." },
       { "id": "marketing", "text": "Show personalized advertisements." }
     ]
   }
   ```

3. **Browser sends user decisions** via `ADPC` HTTP header:
   ```
   ADPC: consent="analytics"; withdraw="marketing"
   ```

4. **JavaScript API** alternative:
   ```js
   navigator.dataProtectionControl.request(...)
   ```

**Per-purpose consent**: Yes -- this is the core design goal. Supports:
- `consent="id1 id2"` -- grant consent for specific purposes
- `withdraw=id` -- withdraw consent for a purpose
- `withdraw=*` -- withdraw all consent
- `object=direct-marketing` -- object to processing

**Current status**:
- Unofficial Draft (July 2021)
- Proof-of-concept browser extension exists
- NO mainstream browser implementation
- NO significant website adoption
- Specification is incomplete (JS interface partially defined)

**This is the closest thing to a "standard for per-category cookie consent metadata"** but it has not gained traction.

---

### 4.4 Do Not Track (DNT) -- Deprecated

- Was a browser HTTP header (`DNT: 1`)
- Largely ignored by websites
- Officially deprecated by W3C
- Superseded by GPC

---

### 4.5 Comparison of Consent Signal Standards

| Standard | Per-Category | Direction | Adoption | Legal Force | Status |
|----------|:------------:|-----------|:--------:|:-----------:|--------|
| **IAB TCF** | Yes (10 purposes + vendors) | Site -> Ad ecosystem | High (ad industry) | GDPR-adjacent | Active (v2.3) |
| **GPC** | No (binary) | Browser -> Site | Medium (growing) | Yes (CA, CO) | W3C Draft, legally mandated |
| **ADPC** | Yes (per-purpose) | Browser <-> Site | None | Designed for GDPR | Unofficial Draft (stalled) |
| **DNT** | No (binary) | Browser -> Site | Dead | None | Deprecated |

---

## 5. AI Agent / Machine-Readable Consent Files

### 5.1 Existing Standards Landscape

| Convention | Purpose | Cookie Consent Relevance |
|------------|---------|:------------------------:|
| `robots.txt` | Control search engine crawlers | None |
| `sitemap.xml` | Index pages for search engines | None |
| `llms.txt` | Guide LLM access to site content | None |
| `/.well-known/gpc.json` | Indicate GPC signal support | Partial (binary only) |
| `ads.txt` | Authorized digital sellers | None |
| `security.txt` | Security contact info | None |
| `humans.txt` | Team credits | None |

### 5.2 The Gap: No Machine-Readable Cookie Consent Metadata Standard

**There is no widely adopted standard for websites to publish machine-readable cookie consent preferences/requirements** in a way that browser extensions or AI agents could consume.

The closest attempts:
- **ADPC**: Designed exactly for this (websites publish `consent-requests.json`), but adoption is essentially zero
- **IAB TCF**: Provides machine-readable consent encoding, but serves the ad ecosystem, not end users
- **GPC / `.well-known/gpc.json`**: Only indicates whether a site respects opt-out; not a cookie category declaration

### 5.3 What Would Be Ideal

A hypothetical `/.well-known/cookie-consent.json` or similar file where websites declare:
- What cookie categories they use (essential, analytics, marketing, social, etc.)
- What each category does (human-readable + machine-readable)
- Which CMPs they use
- Whether they honor GPC/ADPC signals

This does not exist. The ADPC spec comes closest but has failed to gain adoption.

---

## 6. Key Findings & Opportunities

### 6.1 Market Gaps

1. **No AI-powered consent handling**: All extensions use static rules or ML cookie classification. None use LLMs/AI to understand arbitrary consent popup UIs dynamically.

2. **Per-category consent is rare**: Only Consent-O-Matic (open source) and Super Agent (proprietary/freemium) offer this. CookieBlock offers it at the cookie level but does not interact with consent UIs.

3. **Rule maintenance is the bottleneck**: Consent-O-Matic supports 200+ CMPs via manual CSS rules. New CMPs require community contributions. An AI approach could eliminate this.

4. **No standard for consent metadata**: ADPC was designed for this but stalled. A simpler standard (like `llms.txt` for cookies) could gain adoption if lightweight enough.

5. **GPC is becoming mandatory**: California's AB 566 mandates browser-level GPC by 2027. Extensions that integrate with GPC signals will become more relevant.

### 6.2 Technical Approaches in Use

| Approach | Used By | Pros | Cons |
|----------|---------|------|------|
| CSS selector rules per CMP | Consent-O-Matic, IDCAC, ISTDCAC | Precise, reliable | Manual maintenance, incomplete coverage |
| ML cookie classification | CookieBlock | Works on any site | Doesn't dismiss popup, 84% accuracy |
| Pattern matching + backend API | ISTDCAC, Super Agent | Faster rule updates | Requires server infrastructure |
| Browser HTTP signal | GPC, ADPC | Universal, no per-site rules | Requires website cooperation |

### 6.3 Competitive Landscape Summary

- **Privacy-first, open-source, per-category**: Consent-O-Matic is the only real option, but limited by manual rule maintenance
- **Just make popups go away**: ISTDCAC (open source fork) is the leading choice
- **AI/LLM opportunity**: No existing extension uses AI to dynamically understand and fill consent forms -- this is an open niche

---

## Sources

- [Consent-O-Matic - GitHub](https://github.com/cavi-au/Consent-O-Matic)
- [Consent-O-Matic - Chrome Web Store](https://chromewebstore.google.com/detail/consent-o-matic/mdjildafknihdffpkfmmpnpoiajfjnjd)
- [I Don't Care About Cookies - Avast Acquisition](https://www.i-dont-care-about-cookies.eu/whats-new/acquisition/)
- [I Still Don't Care About Cookies - GitHub](https://github.com/OhMyGuus/I-Still-Dont-Care-About-Cookies)
- [Super Agent](https://super-agent.com/)
- [CookieBlock - ETH Zurich](https://infsec.ethz.ch/research/software/cookieblock.html)
- [CookieBlock - GitHub](https://github.com/dibollinger/CookieBlock)
- [Ninja Cookie](https://ninja-cookie.com/)
- [Cookie AutoDelete - GitHub](https://github.com/Cookie-AutoDelete/Cookie-AutoDelete)
- [IAB TCF - GitHub](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework)
- [Global Privacy Control](https://globalprivacycontrol.org/)
- [GPC - W3C Spec](https://www.w3.org/TR/gpc/)
- [Sec-GPC - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-GPC)
- [ADPC Specification](https://www.dataprotectioncontrol.org/spec/)
- [ADPC - GitHub](https://github.com/Data-Protection-Control/ADPC)
- [llms.txt](https://llmstxt.org/)
- [AlternativeTo - Consent-O-Matic Alternatives](https://alternativeto.net/software/consent-o-matic/)
- [Avast Takes Over IDCAC](https://malware.guide/article/avast-takes-over-browser-extension-i-dont-care-about-cookies/)
- [ETH Zurich - CookieBlock News](https://ethz.ch/en/news-and-events/eth-news/news/2022/03/automatically-filter-and-block-cookies.html)
- [noyb - ADPC Announcement](https://noyb.eu/en/new-browser-signal-could-make-cookie-banners-obsolete)
- [DNT vs GPC vs ADPC Comparison](https://secureprivacy.ai/blog/comparing-browser-signals-dnt-vs-gpc-vs-adpc)
