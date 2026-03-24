# Consent Standards & Approaches to Automating Cookie Consent: Technical Analysis

**Date**: 2026-03-24
**Type**: Standards analysis
**Status**: Complete

---

## Executive Summary

This report provides a comprehensive technical analysis of all known approaches to automating cookie consent -- from formal standards (IAB TCF, GPC, ADPC) to pragmatic tools (Consent-O-Matic, Autoconsent) to regulatory proposals (EU Digital Omnibus Art. 88b, the withdrawn ePrivacy Regulation) and the deprecated Do Not Track header. Each approach is evaluated on its technical design, strengths, weaknesses, adoption status, and lessons for building a next-generation cookie consent automation tool.

The landscape reveals a fundamental tension: formal standards that try to solve the whole problem (ADPC) fail from complexity, while simple signals (GPC, DNT) succeed at adoption but lack the granularity users need. Pragmatic rule-based tools (Consent-O-Matic, Autoconsent) work today but require constant maintenance. The regulatory direction (Art. 88b) validates the concept of machine-readable, per-purpose browser consent signals but will not materialize for 3-5 years. This gap is our opportunity.

---

## 1. IAB Transparency & Consent Framework (TCF v2.2 / v2.3)

### 1.1 What It Is

The IAB Transparency & Consent Framework is an industry-led standard created by IAB Europe (Interactive Advertising Bureau Europe) to encode user consent choices into a machine-readable string that propagates through the digital advertising supply chain. First introduced as TCF v1.0 in 2018, the current production version is v2.2, with v2.3 rolling out as of February 2026.

TCF was created to solve an ad-industry problem: when a user consents to advertising on a publisher's website, that consent signal must reach dozens or hundreds of downstream vendors (ad exchanges, DSPs, SSPs, data brokers) in milliseconds. TCF provides the encoding format and API for this.

### 1.2 How It Works Technically

**TC String**: The core artifact is the Transparency and Consent String -- a base64url-encoded binary bitfield that encodes:
- Per-purpose consent (11 purposes, each a single bit)
- Per-purpose legitimate interest flags
- Per-vendor consent (bitfield or range-encoded for thousands of vendors)
- Per-vendor legitimate interest
- Publisher restrictions
- Special feature opt-ins
- CMP metadata (ID, version, consent screen, language)
- Timestamps (creation, last update)
- Vendor list version
- **New in v2.3**: Mandatory disclosedVendors segment

The TC String is stored as a first-party cookie named `euconsent-v2` and is accessible via the `__tcfapi` JavaScript API.

**`__tcfapi` JavaScript API**:
```javascript
__tcfapi('addEventListener', 2, function(tcData, success) {
  if (success && tcData.eventStatus === 'useractioncomplete') {
    // tcData.tcString - the encoded TC String
    // tcData.purpose.consents - { 1: true, 2: false, ... }
    // tcData.vendor.consents - { vendorId: true/false, ... }
  }
});
```

Required commands: `ping`, `addEventListener`, `removeEventListener`.

**Global Vendor List (GVL)**: A centralized JSON file maintained by IAB Europe listing all registered vendors (~1,200+), their declared purposes, legal bases, and data retention policies. CMPs download the GVL to populate consent UIs.

**TCF Purposes (v2.2)**:

| ID | Purpose | Legal Basis |
|----|---------|-------------|
| 1 | Store/access information on a device | Consent only |
| 2 | Use limited data to select advertising | Consent or LI |
| 3 | Create profiles for personalised advertising | Consent only |
| 4 | Use profiles to select personalised advertising | Consent only |
| 5 | Create profiles to personalise content | Consent only |
| 6 | Use profiles to select personalised content | Consent only |
| 7 | Measure advertising performance | Consent or LI |
| 8 | Measure content performance | Consent or LI |
| 9 | Understand audiences through statistics | Consent or LI |
| 10 | Develop and improve services | Consent or LI |
| 11 | Use limited data to select content | Consent or LI |

Special Purposes (not refusable): security/fraud prevention, advertising/content delivery, privacy choice storage.

**v2.3 Key Change** (mandatory by February 28, 2026): The disclosedVendors segment becomes mandatory in the TC String, resolving ambiguity about whether a vendor was actually disclosed to the user. Failure to migrate renders consent strings invalid, potentially cutting programmatic ad revenue by 50%+.

### 1.3 Strengths

- **Wide adoption**: De facto standard across the ad-tech industry. Most major CMPs (OneTrust, Cookiebot, Didomi, Quantcast, etc.) are TCF-registered.
- **Machine-readable consent encoding**: The TC String is a compact, parseable format for consent state.
- **Granular purpose taxonomy**: 11 purposes provide finer-grained control than the typical 4-category CMP model.
- **Standardized API**: `__tcfapi` provides a consistent interface across all TCF-compliant CMPs.
- **Vendor ecosystem**: The GVL creates accountability -- vendors must register and declare their purposes.

### 1.4 Weaknesses

- **Serves ad industry, not users**: TCF was designed to facilitate data processing, not to protect privacy. The framework makes it easier for the ad industry to claim consent, not for users to withhold it.
- **Belgian DPA ruling (2022-2025)**: The Belgian Data Protection Authority found IAB Europe to be a joint controller of TC String data, violating GDPR. The Brussels Market Court upheld a EUR 250,000 fine in May 2025, confirming that the TC String constitutes personal data and that IAB Europe lacked a valid legal basis for its processing. While the ruling addresses TCF v2.0 specifically, it casts doubt on the framework's GDPR compliance.
- **Complexity**: The TC String is a complex binary format requiring specialized parsing. The specification runs to dozens of pages. Average website operators cannot understand or verify what the TC String encodes.
- **Privacy advocates' criticism**: Organizations like noyb and EDRi argue TCF creates an illusion of consent while enabling mass data sharing. Research shows most TCF consent UIs use dark patterns.
- **Read-only for extensions**: The `__tcfapi` is a read API -- extensions cannot SET consent via TCF, only read what was already stored. Extensions must interact with the CMP's own UI to set consent.
- **Legitimate interest abuse**: Before v2.2, vendors used "legitimate interest" as a legal basis for tracking purposes (3-6), bypassing consent. V2.2 closed this loophole, but enforcement remains inconsistent.

### 1.5 What We Can Learn

- **Consent encoding format**: The concept of encoding per-purpose consent into a compact, machine-readable string is sound. Our standard should support a similar concept but simpler.
- **Purpose taxonomy**: The 11-purpose model is more granular than the 4-category model most CMPs use. We should map between both.
- **API conventions**: A standardized JavaScript API for querying consent state is valuable. Our standard should define one.
- **Vendor registration model**: The GVL creates accountability. Worth considering for a future version of our standard.

### 1.6 Status

Active and widely deployed. v2.2 is current; v2.3 mandatory by February 28, 2026. Under legal scrutiny due to the Belgian DPA ruling, but the ad industry continues to invest in TCF as its primary consent infrastructure.

---

## 2. Global Privacy Control (GPC)

### 2.1 What It Is

Global Privacy Control is a browser-level HTTP signal that tells websites the user opts out of data selling and sharing. Created by a coalition including the EFF, Mozilla, Brave, DuckDuckGo, and consumer advocates, GPC is formalized as a W3C Working Draft (adopted as an official W3C Privacy Working Group work item in November 2024).

GPC was designed as the successor to Do Not Track (DNT), learning from DNT's failure by seeking legal backing from the start.

### 2.2 How It Works

**HTTP Header**:
```
Sec-GPC: 1
```
Sent with every HTTP request when the user has enabled GPC. Absence of the header (or value `0`) means no preference expressed.

**JavaScript API**:
```javascript
navigator.globalPrivacyControl // true or false
```

**Website Acknowledgment**: Sites can host `/.well-known/gpc.json`:
```json
{
  "gpc": true,
  "lastUpdate": "2025-01-01"
}
```
This indicates the site respects GPC signals, but hosting this file is not required by law.

### 2.3 Strengths

- **Simplicity**: One header, one boolean. Dead simple to implement on both browser and server side.
- **Legal recognition**: Legally enforceable in California (CCPA/CPRA), Colorado, Connecticut, and effectively recognized in 12 US states as of January 2026.
- **California AB 566**: Signed October 2025, effective January 1, 2027 -- requires ALL browsers distributed in California to include built-in GPC functionality. This forces Chrome, Safari, and Edge to implement GPC natively.
- **Browser-native**: Already shipped in Brave and DuckDuckGo (on by default), available in Firefox settings. Chrome/Safari/Edge mandated by 2027.
- **Growing adoption**: 12 US states now require businesses to honor GPC or equivalent universal opt-out mechanisms.
- **W3C standardization track**: Formal standards process adds legitimacy.

### 2.4 Weaknesses

- **Binary only**: GPC is a single opt-out signal. It cannot express per-category preferences (e.g., "allow analytics, deny marketing"). This is fundamentally insufficient for GDPR's "specific" consent requirement.
- **Opt-out only**: GPC signals "do not sell/share." It has no mechanism for opt-in or per-purpose consent. This aligns with CCPA's opt-out model but not GDPR's opt-in model.
- **Requires website cooperation**: GPC depends on websites reading and respecting the header. Without legal mandate, adoption was slow. Legal mandates are changing this, but only in certain jurisdictions.
- **No cookie category awareness**: GPC does not understand cookie categories. A site receiving `Sec-GPC: 1` must interpret what that means for its specific cookie setup.
- **EU applicability unclear**: GDPR does not explicitly reference GPC. Some EU DPAs (CNIL, ICO) view it as relevant for exercising the right to object (Art. 21), but it is not formally recognized as a consent mechanism under GDPR.

### 2.5 Legal Milestones

| Date | Event |
|------|-------|
| 2020 | GPC launched by EFF, Brave, DuckDuckGo, others |
| 2021 | California AG confirms GPC is valid CCPA opt-out |
| 2022 | Sephora fined $1.2M for ignoring GPC signals |
| 2024 | W3C Privacy Working Group adopts GPC as official work item |
| Oct 2025 | California AB 566 signed -- browsers must include GPC by Jan 2027 |
| Jan 2026 | 12 US states require GPC or equivalent |
| Jan 2027 | AB 566 takes effect -- Chrome, Safari, Edge must ship GPC |

### 2.6 What We Can Learn

- **Simplicity wins adoption**: GPC succeeded where ADPC failed because it is trivially simple. Our standard should aim for similar simplicity.
- **Legal recognition matters**: GPC's growth accelerated when states began mandating it. Aligning with regulatory direction (Art. 88b) is critical.
- **Binary is insufficient**: GPC proves that a simple signal gets adopted, but also proves that binary is not enough for the EU's per-purpose consent model. We need simplicity AND granularity.

### 2.7 Status

Active and growing. W3C Working Draft. Mandated in 12 US states. Browser manufacturers forced to implement by 2027 (AB 566). The most successful automated privacy signal to date.

---

## 3. Advanced Data Protection Control (ADPC)

### 3.1 What It Is

ADPC is a proposed protocol for per-purpose consent communication between browsers and websites. Developed by noyb (Max Schrems' privacy organization) and the Sustainable Computing Lab at the Vienna University of Economics and Business (WU Wien), ADPC was published as an "Unofficial Draft" in July 2021.

ADPC was designed specifically for the GDPR context, aiming to solve the problem that GPC cannot: expressing granular, per-purpose consent (not just binary opt-out).

### 3.2 How It Works

**Step 1 -- Website publishes consent requests** via HTTP `Link` header or HTML `<link>`:
```
Link: </consent-requests.json>; rel="consent-requests"
```

**Step 2 -- Consent requests file** (`consent-requests.json`):
```json
{
  "consentRequests": [
    { "id": "analytics", "text": "Measure website usage with analytics tools." },
    { "id": "marketing", "text": "Show personalized advertisements." }
  ]
}
```

**Step 3 -- Browser sends user decisions** via `ADPC` HTTP header:
```
ADPC: consent="analytics"; withdraw="marketing"
```

**Step 4 -- JavaScript API** (alternative):
```javascript
navigator.dataProtectionControl.request(...)
```

ADPC supports:
- `consent="id1 id2"` -- grant consent for specific purposes
- `withdraw=id` -- withdraw consent for a purpose
- `withdraw=*` -- withdraw all consent
- `object=direct-marketing` -- object to processing under Art. 21 GDPR

### 3.3 Strengths

- **Per-purpose consent**: The core design goal. ADPC can express exactly the granular, specific consent GDPR requires.
- **Bidirectional communication**: Unlike GPC (browser -> site only), ADPC supports website -> browser requests, enabling a true negotiation protocol.
- **GDPR-native design**: Built from the ground up for GDPR compliance, referencing specific GDPR articles (Art. 6, Art. 21).
- **Backed by noyb**: Max Schrems' organization provides credibility and legal expertise.
- **Conceptual alignment with Art. 88b**: The EU Digital Omnibus Article 88b envisions essentially the same system ADPC proposes.

### 3.4 Weaknesses

- **Complexity**: ADPC requires coordination across multiple layers: HTTP headers, JSON files, a JavaScript API, and browser UI. This is orders of magnitude more complex than GPC's single header.
- **No browser adoption**: Zero mainstream browsers have implemented ADPC natively. Not Chrome, Firefox, Safari, Edge, Brave, or DuckDuckGo.
- **No website adoption**: No significant website deployment exists. The specification remains theoretical.
- **Specification incomplete**: The JavaScript interface is only partially defined. Key interaction patterns are undefined.
- **No standardization track**: ADPC is not on any W3C, IETF, or other standards body track. It remains an academic proposal.
- **Chicken-and-egg problem**: Websites will not implement ADPC without browser support; browsers will not implement ADPC without website demand.

### 3.5 Why It Failed (In Practice)

ADPC failed for the same reason many technically elegant standards fail: it tried to solve the entire problem at once. The protocol requires:
1. Websites to publish structured consent request files
2. Browsers to implement a new API and UI for managing per-purpose consent
3. HTTP header negotiation between browser and server
4. JavaScript API support for dynamic interactions

Each of these requires buy-in from a different stakeholder. Without a critical mass in any one group, adoption never bootstrapped. GPC succeeded by requiring only ONE thing: a single HTTP header from the browser.

### 3.6 What We Can Learn

- **The right idea, wrong execution**: Per-purpose, machine-readable consent signals ARE the right approach. ADPC's conceptual model is sound.
- **Complexity kills adoption**: Any standard that requires coordinated adoption across browsers, websites, and servers simultaneously will fail unless mandated by law.
- **Start simpler**: A standard can start with a single JSON file (like our `/.well-known/cookie-consent.json`) and grow incrementally, rather than launching as a full protocol.
- **Potential for revival**: If Art. 88b technical standards are developed, ADPC (or something like it) could serve as a starting point. Our standard should be compatible.

### 3.7 Status

Effectively stalled/dead in practice. The specification exists but has zero real-world deployment. noyb continues to advocate for the concept but has not pushed ADPC adoption specifically. The spirit of ADPC may live on through Art. 88b's eventual technical specification.

---

## 4. Do Not Track (DNT)

### 4.1 What It Was

Do Not Track was a browser HTTP header (`DNT: 1`) proposed in 2009 and formalized as a W3C Working Draft. It communicated the user's preference not to be tracked online. Supported by all major browsers at one point.

### 4.2 How It Worked

```
DNT: 1    // Do not track
DNT: 0    // Consent to tracking
(absent)  // No preference
```

Also available via JavaScript: `navigator.doNotTrack`.

### 4.3 Why It Failed Completely

- **Voluntary compliance**: DNT had no legal backing. Websites were free to ignore it, and nearly all did. Only a handful of sites ever honored DNT.
- **No enforcement mechanism**: Without legal mandate, there was no consequence for ignoring DNT.
- **Industry opposition**: The ad industry actively opposed DNT. The Digital Advertising Alliance argued that a browser default setting could not constitute valid user consent/preference.
- **Browser default controversy**: When Microsoft set DNT to "on" by default in Internet Explorer 10 (2012), the ad industry declared default-on settings could not represent user choice, further undermining DNT.
- **W3C Working Group collapsed**: The W3C Tracking Protection Working Group could not reach consensus and was formally closed in 2019.
- **Officially deprecated**: Apple removed DNT from Safari in 2019, calling it a fingerprinting vector. Mozilla followed. W3C deprecated the specification.

### 4.4 Lessons

- **Voluntary compliance does not work**: Without legal teeth, privacy signals are ignored. This is the single most important lesson in the history of consent automation.
- **Legal backing is essential**: GPC learned this lesson and sought legal recognition from day one.
- **Default settings matter**: The Microsoft IE controversy showed that how a signal is configured (opt-in vs. default-on) affects its legitimacy.
- **Simplicity is necessary but not sufficient**: DNT was simple (single header, binary) but failed because simplicity alone does not drive adoption -- legal force does.

### 4.5 Status

Deprecated. Removed from most browsers. Superseded by GPC.

---

## 5. EU Digital Omnibus Article 88b

### 5.1 What It Proposes

The European Commission's Digital Omnibus Regulation Proposal (COM(2025) 837), published November 19, 2025, introduces Article 88b, which mandates browser-based consent signals for cookie consent. This is the most significant regulatory development in the cookie consent space since the original ePrivacy Directive.

Article 88b requires:
1. **Controllers** must ensure their online interfaces accept consent and decline signals "through automated and machine-readable means"
2. **Controllers** must respect the choices communicated via these signals
3. **Browser manufacturers** (excluding SMEs) must provide the technical means for users to set per-purpose privacy preferences
4. **Six-month block**: If a user declines consent, controllers cannot re-request for 6 months

### 5.2 How It Envisions the Future

The Commission envisions a system where:
- Users configure per-purpose cookie preferences in their browser settings once
- Browsers transmit these preferences to websites automatically via machine-readable signals
- Websites read and respect these signals -- no cookie banner needed
- Signal dimensions include: cookie purpose (functional, analytics, advertising, etc.), website category, third-party processor scope

This is conceptually identical to what ADPC proposed and what our extension implements.

### 5.3 Media Exception (Art. 88b(3))

Article 88b(3) excludes media service providers from the obligation to respect automated signals, protecting advertising-dependent journalism models. This means news sites, streaming services, and content platforms can continue using traditional cookie banners indefinitely.

**Implication for extensions**: Even after full Art. 88b implementation, extensions remain necessary for media sites. This ensures permanent relevance for cookie consent tools.

### 5.4 Timeline

| Milestone | Estimated Date |
|-----------|---------------|
| Commission proposal | November 19, 2025 (done) |
| EP committee reports / Council general approach | Q2 2026 |
| Trilogue negotiations | Q3-Q4 2026 |
| Final adoption (optimistic) | Late 2026 / early 2027 |
| Entry into force | ~2027 |
| Article 88a applies (cookie rules in GDPR) | ~2027-2028 |
| Article 88b controller obligations | ~2029 |
| Browser manufacturer obligations | ~2031 |
| Technical standards developed | ~2029-2031 |

**Realistic assessment**: Full browser signal implementation unlikely before 2029 at earliest, with 2030-2031 more probable for widespread adoption. The legislation is part of a massive package covering AI, cybersecurity, and data -- cookie provisions may be delayed by negotiations on other components.

### 5.5 What We Can Learn

- **Regulatory validation**: The EU is mandating exactly what our extension does. This is the strongest possible endorsement.
- **Per-purpose signals confirmed**: Art. 88b explicitly requires per-purpose granularity, confirming that GPC's binary model is insufficient for EU compliance.
- **3-5 year gap**: The transition window creates a multi-year opportunity for extension-based solutions.
- **Media exception**: Ensures permanent need for client-side consent tools.
- **Design for compatibility**: Our standard should be designed to evolve into (or complement) whatever Art. 88b's technical specification becomes.

### 5.6 Status

Proposed (November 2025). In EU legislative process. Adoption uncertain but likely in some form. Technical standards not yet specified. Full implementation realistically 2029-2031.

---

## 6. ePrivacy Regulation (The Failed Attempt)

### 6.1 Background

The ePrivacy Regulation was proposed by the European Commission in January 2017 as a replacement for the aging 2002 ePrivacy Directive. It was intended to modernize electronic communications privacy rules and align them with the GDPR. Article 10 of the proposal would have mandated browser-based consent management -- requiring software to offer privacy settings during installation and prevent third-party data storage by default.

### 6.2 Eight Years of Failure

The ePrivacy Regulation endured 8 years of legislative deadlock:

| Year | Event |
|------|-------|
| 2017 | Commission proposal published |
| 2017-2018 | European Parliament adopted its position |
| 2018-2021 | Council of the EU could not agree on a position (multiple presidency attempts failed) |
| 2021 | Council finally adopted a general approach (under Portuguese presidency) |
| 2021-2024 | Trilogue negotiations stalled repeatedly |
| 2024 | Commission acknowledged the proposal was outdated |
| February 2025 | Commission formally withdrew the proposal |

### 6.3 Why It Failed

- **Member state disagreements**: Countries could not agree on the scope of consent exemptions, the role of browser settings, and the treatment of metadata.
- **Industry lobbying**: The ad-tech and telecom industries lobbied heavily against strong consent requirements, particularly Article 10's browser mandate.
- **Scope creep**: The regulation covered not just cookies but all electronic communications metadata, making negotiations broader and more contentious.
- **Technological change**: By the time consensus was near, the digital landscape had shifted so dramatically (third-party cookie deprecation, privacy sandbox, AI) that the proposal was outdated.
- **GDPR overlap**: Many stakeholders argued GDPR already covered most of what ePrivacy sought to regulate, making a separate instrument redundant.

### 6.4 Article 10 -- The Vision That Never Was

Article 10 stated that:
- Software must offer users the option to prevent third parties from storing information on their terminal equipment
- Users must be informed about privacy settings during software installation
- Software must offer a setting to accept or refuse specific types of cookies

This was the closest any legislation came to mandating browser-based consent before the Digital Omnibus. Its spirit lives on in Article 88b, though with significant differences:
- Art. 10 focused on preventing storage; Art. 88b focuses on signaling preferences
- Art. 10 applied during software installation; Art. 88b applies during browsing
- Art. 88b is more granular (per-purpose, not binary)

### 6.5 What We Can Learn

- **Standards can fail politically**: Even widely supported ideas (browser-based consent) can be killed by political negotiation. Our standard should not depend on a single regulatory outcome.
- **Cookie rules now in GDPR**: With ePrivacy's withdrawal, cookie consent regulation is being folded into the GDPR via the Digital Omnibus. This simplifies the legal landscape.
- **The concept persists**: The idea of browser-managed consent has survived the ePrivacy Regulation's death and been reborn in Art. 88b. The regulatory direction is clear even if the timeline is uncertain.

### 6.6 Status

Formally withdrawn by the European Commission in February 2025. The ePrivacy Directive (2002/58/EC) remains in force. Cookie-specific provisions are being migrated to the GDPR via the Digital Omnibus.

---

## 7. Consent-O-Matic Rule System

### 7.1 What It Is

Consent-O-Matic is not a formal standard but a de facto approach to cookie consent automation developed by CAVI (Centre for Advanced Visualization and Interaction) at Aarhus University. It uses a JSON-based rule system to detect and interact with Consent Management Platforms. With 200K+ users and support for 200+ CMPs, it is the most comprehensive open-source consent automation tool.

### 7.2 How It Works

Each CMP is defined as a named JSON entry with two parts:

**Detectors**: Determine whether a specific CMP is present on the page.
- `presentMatcher`: Checks if the CMP's DOM elements exist (e.g., `#CybotCookiebotDialog`)
- `showingMatcher`: Checks if the CMP popup is actually visible
- Uses text filters, style filters, display filters, and iframe filters

**Methods**: Define actions to perform once a CMP is detected.
- `OPEN_OPTIONS`: Opens the preference/settings panel
- `DO_CONSENT`: Sets consent toggles according to user preferences
- `SAVE_CONSENT`: Clicks save/confirm buttons
- `HIDE_CMP`: Hides the CMP element if still visible

**Actions**: Atomic operations within methods:
- `click`: Click a DOM element
- `consent`: Toggle a consent checkbox/switch
- `slide`: Interact with slider controls
- `wait`: Wait for elements to appear
- `hide`: Hide DOM elements
- Conditional flows for complex CMP UIs

**Category mapping**: Consent-O-Matic maps user preferences (5 categories: functional, analytics, advertising, social, other) to each CMP's specific category structure.

### 7.3 Strengths

- **Pragmatic**: Works today with existing CMPs, no website cooperation needed
- **Community-driven**: Anyone can contribute CMP rules via GitHub PRs
- **Per-category consent**: True 5-category granularity, unlike binary reject tools
- **Conservative defaults**: Rejects when uncertain (privacy-preserving)
- **Academic backing**: Research-grounded (CHI 2022 paper on adversarial interoperability)
- **Broad coverage**: 200+ CMP rules maintained by community

### 7.4 Weaknesses

- **Manual maintenance**: Every CMP update can break rules. New CMPs require someone to write new rules. This is a fundamental scalability limitation.
- **Fragile selectors**: CSS selectors are brittle. CMP vendors can change class names, IDs, or DOM structure at any time.
- **No formal standard**: The rule format is proprietary to Consent-O-Matic. Not documented as a formal specification.
- **Detection-only**: Rules detect and interact with existing CMP UIs. If a CMP is not recognized, nothing happens.
- **Coverage gaps**: Despite 200+ rules, many smaller/custom CMPs are unsupported.

### 7.5 What We Can Learn

- **Rule-based approach works**: For the foreseeable future, CSS selector-based rules are the most reliable way to interact with existing CMPs. Our extension should use a similar approach for its CMP rule engine.
- **Community contribution model**: Consent-O-Matic's GitHub-based rule contribution workflow is effective and should be replicated.
- **Category taxonomy**: The 5-category model (functional, analytics, advertising, social, other) is well-tested and maps to the de facto industry standard.
- **Compatibility layer**: DuckDuckGo's Autoconsent already has a Consent-O-Matic compatibility layer, suggesting our extension should also be able to consume C-O-M rules.

### 7.6 Status

Active and maintained. Last significant update December 2024. ~200K+ users. ~4,000 GitHub stars. The leading open-source per-category consent tool.

---

## 8. DuckDuckGo Autoconsent

### 8.1 What It Is

Autoconsent is a JavaScript library developed by DuckDuckGo for handling cookie consent popups. It is integrated into the DuckDuckGo browser (desktop and mobile) and is available as a standalone npm package (`@duckduckgo/autoconsent`). It serves millions of users through DuckDuckGo's browser apps.

### 8.2 How It Works

**Architecture**: Autoconsent uses a content script + background worker model:
- A content script is injected into every page (running in isolated context)
- High-level orchestration controlled by a background service worker or native browser integration
- Detection, analysis, and response to cookie consent dialogs

**Three rule types**:
1. **JSON rulesets**: Declarative rules interpreted by the AutoConsent class. Similar to Consent-O-Matic but with a different format.
2. **Class-based rules**: TypeScript classes implementing the `AutoCMP` interface, enabling complex logic beyond what linear JSON rulesets allow (e.g., multi-step interactions, conditional flows).
3. **Consent-O-Matic compatibility layer**: The `ConsentOMaticCMP` class can consume rules written in Consent-O-Matic's format, giving Autoconsent access to C-O-M's 200+ CMP rules.

**DOM Actions**: Autoconsent's `dom-actions.ts` provides a library of atomic operations: click, waitForElement, elementVisible, elementExists, getAttribute, etc.

**Cosmetic Filters**: Autoconsent also supports cosmetic filters in ABP/uBO format and includes filters from Easylist Cookie for hiding consent remnants.

### 8.3 Strengths

- **Better engineering**: More modern architecture than Consent-O-Matic. TypeScript, modular design, proper testing.
- **DuckDuckGo backing**: Corporate sponsorship ensures sustained development and integration into a real browser.
- **Consent-O-Matic compatibility**: Can leverage the entire C-O-M rule library.
- **Multi-platform**: Used in DuckDuckGo browsers across desktop, Android, and iOS.
- **Active development**: Regular releases, active GitHub repository (3,500+ stars).
- **Cosmetic filtering**: Can hide consent banners that resist interaction, using ad-blocker-style cosmetic rules.

### 8.4 Weaknesses

- **Reject-only**: Autoconsent's default behavior is to reject all non-essential cookies. It does not offer per-category user configuration -- no "allow analytics, deny marketing" option.
- **No user preferences UI**: Designed as a library for browser integration, not as a standalone user-facing tool with preference management.
- **Tied to DuckDuckGo ecosystem**: While open source, the library is designed for DuckDuckGo's specific integration needs.
- **Limited API call strategy**: Primarily uses DOM interaction (clicking buttons) rather than calling CMP JavaScript APIs directly.

### 8.5 Security Consideration

A notable UXSS (Universal Cross-Site Scripting) vulnerability was discovered in DuckDuckGo's Autoconsent JS Bridge in February 2026, allowing cross-origin code execution. This highlights the security risks of injecting scripts into page context for consent management -- a risk our extension must also consider in its MAIN world executor design.

### 8.6 What We Can Learn

- **Architecture model**: The content script (isolated) + executor (main world) + background worker pattern is validated by DuckDuckGo's implementation. Our extension uses the same pattern.
- **Consent-O-Matic compatibility**: Including a C-O-M compatibility layer is a proven strategy for bootstrapping CMP coverage.
- **Security matters**: MAIN world injection carries real security risks. Our executor design must be minimal and carefully sandboxed.
- **User preferences are the gap**: Autoconsent's reject-only approach leaves an unfilled niche for per-category user configuration.

### 8.7 Status

Active and maintained. Integrated into DuckDuckGo browsers (millions of users). Available as npm package. 3,500+ GitHub stars. Reject-only, no per-category user configuration.

---

## Comparison Summary Table

| Aspect | IAB TCF | GPC | ADPC | DNT | Art. 88b | ePrivacy Reg. | Consent-O-Matic | Autoconsent |
|--------|---------|-----|------|-----|----------|---------------|-----------------|-------------|
| **Type** | Industry standard | Browser signal | Protocol proposal | Browser signal | Regulation | Regulation (withdrawn) | Extension rule system | Extension library |
| **Per-category** | Yes (11 purposes) | No (binary) | Yes (per-purpose) | No (binary) | Yes (per-purpose) | Yes (per-type) | Yes (5 categories) | No (reject-only) |
| **Direction** | Site -> Ad chain | Browser -> Site | Browser <-> Site | Browser -> Site | Browser <-> Site | Browser -> Site | Extension -> CMP UI | Extension -> CMP UI |
| **Legal force** | GDPR-adjacent | Yes (12 US states) | None | None (deprecated) | Proposed | Never adopted | None | None |
| **Adoption** | High (ad industry) | Medium (growing) | None | Dead | Proposed | Never | Medium (200K users) | High (DuckDuckGo) |
| **Status** | Active (v2.3) | Active (W3C draft) | Stalled | Deprecated | In EU legislature | Withdrawn Feb 2025 | Active | Active |
| **Complexity** | Very High | Very Low | High | Very Low | TBD | Medium | Medium | Medium |
| **User control** | Per-vendor + purpose | Binary opt-out | Per-purpose | Binary opt-out | Per-purpose (envisioned) | Per-type (envisioned) | Per-category (5) | None (reject all) |
| **Works today** | Yes (read-only) | Yes (where honored) | No | No | No | No | Yes | Yes |
| **Open source** | Spec open, GVL proprietary | Spec open | Spec open | Spec open | N/A | N/A | Yes (MIT-like) | Yes (Apache 2.0) |

---

## Key Insights

### 1. The Spectrum of Ambition vs. Adoption

There is an inverse relationship between ambition and adoption:

```
Adoption
  ^
  |  GPC -------- DNT
  |      \
  |       \   TCF (ad industry only)
  |        \
  |         C-O-M --- Autoconsent
  |
  |                          Art. 88b (future)
  |
  |                                    ADPC
  +-----------------------------------------> Ambition/Complexity
```

GPC is simple and adopted. ADPC is comprehensive and dead. The sweet spot is something with GPC's simplicity and ADPC's granularity -- which is exactly what our `/.well-known/cookie-consent.json` aims to be.

### 2. Legal Backing is the Differentiator

DNT vs. GPC proves this definitively. Same concept (browser header), same simplicity, but GPC has legal teeth and DNT did not. Our standard should be designed for eventual legal recognition under Art. 88b.

### 3. Pragmatic Tools Fill the Gap

While standards bodies debate, Consent-O-Matic and Autoconsent actually solve the problem today using CSS selectors and button clicking. Our extension must work pragmatically first (rule-based CMP handling) and standardize second (`/.well-known/cookie-consent.json`).

### 4. The 3-5 Year Window

Between now and Art. 88b's full implementation (2029-2031), there is a large window where no browser-native solution exists. Add the media exception (Art. 88b(3)), non-EU sites, and CMP compliance gaps, and extensions remain relevant for 5-7+ years.

### 5. Per-Category is the Unfilled Niche

Among tools that work today, only Consent-O-Matic offers per-category user preferences in an open-source context. Autoconsent is reject-only. Super Agent is proprietary and freemium. This is the core niche for our extension.

---

## Sources

### IAB TCF
- [IAB Europe TCF](https://iabeurope.eu/transparency-consent-framework/)
- [TCF v2.3 Transition Guide](https://iabeurope.eu/all-you-need-to-know-about-the-transition-to-tcf-v2-3/)
- [IAB TCF v2.3 -- CookieYes](https://www.cookieyes.com/blog/iab-tcf-v2-3-explained/)
- [IAB TCF v2.3 -- Usercentrics](https://usercentrics.com/knowledge-hub/iab-tcf-2-3-transparency-and-consent-framework-quick-guide/)
- [Belgian Market Court upholds EUR 250K fine -- Lewis Silkin](https://www.lewissilkin.com/en/insights/2025/05/27/iab-tcf-belgian-market-court-upholds-250-000-fine-against-iab-for-gdpr-violatio-102kyon)
- [Is the TCF illegal? -- Didomi](https://www.didomi.io/blog/tcf-iab-europe-belgian-apd-may-2025)
- [Brussels Court ruling -- DLA Piper](https://privacymatters.dlapiper.com/2025/06/eu-brussels-court-of-appeal-rules-on-iab-europe-and-the-tc-string-implications-for-gdpr-compliance/)

### GPC
- [Global Privacy Control](https://globalprivacycontrol.org/)
- [GPC W3C Working Draft](https://www.w3.org/TR/gpc/)
- [GPC in 2026 -- Didomi](https://www.didomi.io/blog/global-privacy-control-gpc-2026)
- [GPC 2026: 12 States Now Require GPC -- Seresa](https://seresa.io/blog/global-privacy-control-gpc/global-privacy-control-2026-the-signal-that-kills-your-retargeting)
- [GPC vs DNT: The 2026 Legal Difference -- Cookie Script](https://cookie-script.com/privacy-laws/global-privacy-control-vs-do-not-track)

### ADPC
- [ADPC Specification](https://www.dataprotectioncontrol.org/spec/)
- [ADPC Official Site](https://www.dataprotectioncontrol.org/)
- [noyb: New Browser Signal Could Make Cookie Banners Obsolete](https://noyb.eu/en/new-browser-signal-could-make-cookie-banners-obsolete)
- [ADPC Explained -- Secure Privacy](https://secureprivacy.ai/blog/adpc-explained-advanced-data-protection-control)
- [DNT vs GPC vs ADPC -- Secure Privacy](https://secureprivacy.ai/blog/comparing-browser-signals-dnt-vs-gpc-vs-adpc)

### EU Digital Omnibus
- [Conditional Consent: Article 88b -- TechGDPR](https://techgdpr.com/blog/conditional-consent-article-88b-consent-signalling-proposal/)
- [Digital Omnibus reshapes EU cookie rules -- Osborne Clarke](https://www.osborneclarke.com/insights/digital-omnibus-reshapes-eu-cookie-rules-leaves-banner-fatigue-largely-intact)
- [The Digital Omnibus: cookies, consent and digital advertising -- Taylor Wessing](https://www.taylorwessing.com/en/global-data-hub/2026/the-digital-omnibus-proposal/gdh---the-digital-omnibus---cookies)
- [EU Digital Omnibus -- IAPP](https://iapp.org/news/a/eu-digital-omnibus-analysis-of-key-changes)

### ePrivacy Regulation
- [EU Commission Abandons ePrivacy Regulation -- Freevacy](https://www.freevacy.com/news/politico/european-commission-to-abandon-eprivacy-regulation/6124)
- [European Commission Withdraws ePrivacy Regulation -- Hunton Andrews Kurth](https://www.hunton.com/privacy-and-information-security-law/european-commission-withdraws-eprivacy-regulation-and-ai-liability-directive-proposals)
- [ePrivacy Regulation -- Wikipedia](https://en.wikipedia.org/wiki/EPrivacy_Regulation)

### Consent-O-Matic
- [Consent-O-Matic GitHub](https://github.com/cavi-au/Consent-O-Matic)
- [Consent-O-Matic Rules.json](https://github.com/cavi-au/Consent-O-Matic/blob/master/Rules.json)
- [Consent-O-Matic Official Site](https://consentomatic.au.dk/)

### DuckDuckGo Autoconsent
- [Autoconsent GitHub](https://github.com/duckduckgo/autoconsent)
- [Autoconsent API docs](https://github.com/duckduckgo/autoconsent/blob/main/api.md)
- [Autoconsent npm](https://www.npmjs.com/package/@duckduckgo/autoconsent)
- [DuckDuckGo UXSS via Autoconsent -- Medium](https://medium.com/@dhiraj_mishra/duckduckgo-browser-uxss-via-autoconsent-js-bridge-02e3bc27a430)
