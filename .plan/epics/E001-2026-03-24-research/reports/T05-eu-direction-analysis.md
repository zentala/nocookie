# T05: EU Direction Analysis — Browser-Based Consent Signals

**Date**: 2026-03-24
**Epic**: E001 - Research
**Status**: Complete

---

## Executive Summary

The EU is moving decisively toward mandating browser-based cookie consent signals. The Digital Omnibus Proposal (November 2025) introduces Article 88b, which would require websites to accept machine-readable consent signals from browsers, and require browser manufacturers to provide the technical means for users to set per-purpose privacy preferences. The ePrivacy Regulation has been formally abandoned after 8 years of deadlock (withdrawn February 2025), with cookie rules being folded into the GDPR instead.

**However, the realistic timeline for full implementation is 2029-2031.** The legislation must still pass through European Parliament and Council, technical standards must be developed, and phased implementation periods of 24-48 months apply. This creates a **3-5 year transition window** where cookie consent extensions like ours fill a genuine gap.

**Recommendation: PROCEED with the project**, but design it to evolve toward becoming a bridge/reference implementation for the upcoming EU standard, not as a permanent standalone solution.

---

## 1. EU Digital Omnibus Proposal (November 2025)

### 1.1 What It Proposes

The European Commission published the Digital Omnibus Regulation Proposal (COM(2025) 837, procedure 2025/0360(COD)) on November 19, 2025. It fundamentally restructures cookie consent rules by:

1. **Moving cookie rules from the ePrivacy Directive into the GDPR** (new Article 88a)
2. **Mandating machine-readable browser consent signals** (new Article 88b)
3. **Expanding consent-exempt categories** (Article 88a exemptions)
4. **Introducing a 6-month re-consent cooling period** (Article 88a(4))

The Commission estimates EU citizens spend approximately **334 million hours per year** on cookie banners, explicitly citing "consent fatigue and the proliferation of cookie banners" as the problem.

### 1.2 Article 88a — Cookie Rules Move to GDPR

Article 88a permits device storage/access without consent for:

| Category | Description | Scope |
|----------|-------------|-------|
| Communication transmission | Carrying electronic communications over networks | Broad |
| Strictly necessary services | Services explicitly requested by the user | Narrow |
| Audience measurement | Aggregated usage statistics | Very narrow — controller's own service, internal use only |
| Security | Maintaining or restoring service security | Narrow, some ambiguity |

**Key limitation**: The audience measurement exemption is extremely narrow. Cross-platform analytics tools (including most ad-tech solutions) remain firmly consent-dependent. This means cookie banners do not simply disappear — they become less frequent but still required for advertising, cross-site tracking, and third-party analytics.

**Implementation**: 6-18 months after entry into force (sources vary; likely 6 months for 88a, 18 months for full ePrivacy integration).

### 1.3 Article 88b — Browser Consent Signals

Article 88b is the most significant provision for our project. It requires:

1. **Controllers** must ensure their online interfaces allow data subjects to give consent and decline consent "through automated and machine-readable means"
2. **Controllers** must respect the choices communicated via these automated signals
3. **Browser manufacturers** (excluding SMEs) must provide the technical means for users to set per-purpose privacy preferences
4. **Six-month block**: If a user declines consent, the controller cannot re-request consent for the same purpose for at least 6 months

**Media exemption**: Article 88b(3) excludes media service providers from the obligation to respect automated signals, protecting advertising-dependent journalism models. This is a significant carve-out — news sites, streaming services, and similar media outlets can continue using traditional consent banners.

**Implementation timeline from entry into force**:
- **24 months**: Controllers must accept and respect automated browser signals
- **48 months**: Browser manufacturers must provide the technical means for signal transmission

**Technical standards**: Article 88b delegates specification to implementing acts and EU standardisation bodies. No standard has been selected or developed yet. The Commission expects standardisation bodies to develop the protocols.

### 1.4 How Browser Consent Signals Would Work (Conceptual)

The proposal does not specify the technical mechanism, but analysis from TechGDPR and others suggests signals could operate across three dimensions:

- **Cookie purpose**: functional, analytics, advertising, social media, personalization
- **Website category**: e-commerce, news, government, banking, healthcare
- **Third-party processor scope**: first-party only, exclude specific companies, named providers

Example user configuration: "Allow functional cookies everywhere. Allow analytics on shopping sites, first-party only. Deny all advertising cookies."

This is conceptually identical to what our extension does — a critical alignment.

### 1.5 Realistic Timeline for Adoption

| Milestone | Estimated Date | Status |
|-----------|---------------|--------|
| Commission proposal tabled | November 19, 2025 | Done |
| EP committee assignment (ITRE + LIBE) | Q1 2026 | Done |
| EP committee reports + Council general approach | Q2 2026 | In progress |
| Trilogue negotiations | Q3-Q4 2026 | Expected |
| Final adoption (optimistic) | Late 2026 / early 2027 | Uncertain |
| Entry into force | ~2027 | Depends on adoption |
| Article 88a applies (cookie rules in GDPR) | ~2027-2028 | 6 months after EIF |
| Article 88b applies (controllers accept signals) | ~2029 | 24 months after EIF |
| Browser manufacturers must provide signals | ~2031 | 48 months after EIF |
| Technical standards developed and deployed | ~2029-2031 | Unknown |

**Important caveats**:
- The Digital Omnibus is a massive package covering AI, cybersecurity, and data. Cookie rules are one part of complex negotiations.
- The AI components face pressure for faster adoption (August 2026 deadline for AI Act rules), but cookie provisions could be delayed.
- Civil society (EDRi, noyb) has significant objections to other parts of the package, which could slow negotiations.
- The media exemption in Article 88b(3) is politically contentious.

**Realistic assessment**: Full browser signal implementation is unlikely before 2029 at the earliest, with 2030-2031 more probable for widespread adoption.

---

## 2. ePrivacy Regulation — Status

### 2.1 Formally Abandoned

The ePrivacy Regulation, proposed in January 2017 as a replacement for the 2002 ePrivacy Directive, has been **formally withdrawn** by the European Commission in February 2025, after 8 years of legislative deadlock. The Commission cited:
- Lack of agreement among legislators
- The proposal's outdated nature due to technological and legal advancements
- Impossibility of reaching compromise between Parliament and Council positions

### 2.2 Article 10 of the (Now-Withdrawn) ePrivacy Regulation

Article 10 of the original ePrivacy Regulation proposal stated that software placed on the market must offer the option to prevent third parties from storing information on a user's terminal equipment and must inform users about privacy settings during installation. This provision was the closest existing legislative text to mandating browser-based consent.

Article 10 was never adopted. Its spirit has been partially carried forward into Article 88b of the Digital Omnibus, though with important differences:
- Article 10 focused on preventing storage; Article 88b focuses on signaling preferences
- Article 10 applied during software installation; Article 88b applies during browsing
- Article 88b is more granular (per-purpose, not binary)

### 2.3 What Replaces the ePrivacy Regulation

Rather than a standalone regulation, cookie consent rules are now being folded into the GDPR via the Digital Omnibus. The ePrivacy Directive (2002/58/EC, as amended by 2009/136/EC) remains in force but will have its cookie provisions superseded by GDPR Articles 88a-88b once adopted.

---

## 3. ADPC (Advanced Data Protection Control)

### 3.1 What ADPC Is

ADPC was developed by noyb (specifically Max Schrems' team) and the Sustainable Computing Lab at the Vienna University of Economics and Business (WU Vienna). Published in 2021, it is a specification for automated browser-to-website communication of privacy preferences.

Key features:
- **Per-purpose consent signals** (not binary like GPC)
- **HTTP header-based protocol** (similar to GPC's `Sec-GPC` header)
- **JavaScript API** for website-side interaction
- **Supports both consent and objection** under GDPR Articles 6 and 21
- **Granular**: can express consent for specific purposes on specific websites

### 3.2 Current Status: Effectively Stalled

As of March 2026, ADPC has:
- A published specification on dataprotectioncontrol.org
- A proof-of-concept browser extension on GitHub
- Academic papers and presentations
- **Zero production browser adoption**
- **No formal regulatory recognition**
- **No W3C or IETF standardization track**
- **No CMP integration**

The specification remains "more proposal than enforced reality." No mainstream browser (Chrome, Firefox, Safari, Edge) has implemented ADPC natively.

### 3.3 ADPC's Relationship to the Digital Omnibus

The Digital Omnibus Article 88b does not reference ADPC specifically, but the conceptual model is remarkably similar: per-purpose, machine-readable consent signals transmitted via browser. If the EU standardisation bodies need to develop a technical standard for Article 88b, ADPC (or something very like it) could serve as a starting point.

**Potential ADPC revival**: If European regulators formalize requirements for granular, purpose-specific signals under Article 88b, ADPC could be revived as a candidate standard. However, GPC (which has more momentum in the US) could also be extended to serve this purpose.

### 3.4 noyb's Current Position

noyb has been highly critical of the Digital Omnibus overall, calling it "deregulation, not simplification" and stating the proposed changes "would lead to multiple conflicts with the EU's Charter of Fundamental Rights." However, noyb supports the concept of browser-based consent signals (they created ADPC for this purpose).

noyb's criticism focuses on:
- Weakening of personal data definitions
- Broad AI training exemptions
- Reduced data subject rights
- The media exemption in Article 88b(3)

noyb published a detailed V3 report with specific recommendations for each article. Their position is nuanced: they support browser signals in principle but oppose many other aspects of the Digital Omnibus package.

**Belgian DPA setback (June 2025)**: The Belgian DPA dismissed 16 noyb cookie complaints, criticizing noyb's use of automated software to both detect non-compliance and generate complaints. This may weaken noyb's enforcement leverage on cookie issues specifically.

---

## 4. EDPB (European Data Protection Board)

### 4.1 Cookie Banner Task Force (January 2023)

The EDPB Cookie Banner Task Force report, adopted in January 2023, remains the most authoritative guidance on cookie consent. Key conclusions:

- **Reject button required**: A "vast majority" of EU DPAs agree that an "Accept" button without a corresponding "Reject" button on the first layer violates EU cookie rules
- **Equal prominence**: Deceptive practices using different button colors/contrast to highlight "Accept All" are prohibited
- **Easy withdrawal**: Consent withdrawal must be as easy as giving consent (e.g., hovering button, persistent icon)
- **No pre-ticked boxes**: Confirmed by CJEU Planet49 ruling

### 4.2 EDPB on Browser-Level Consent

The EDPB has not issued specific guidance on automated consent tools or browser extensions. However:

- **Guidelines 05/2020 on Consent** emphasize that consent must be "specific" (per-purpose, per-controller), which could be read as skepticism toward blanket browser settings
- **Guidelines 02/2023 on Article 5(3)** (final version October 2024) expanded the technical scope of the "cookie rule" to cover new tracking methods, but did not address automated consent tools
- The EDPB's general position favors user empowerment and has not opposed the concept of browser-based consent

### 4.3 No Opposition to Consent Extensions

Importantly, neither the EDPB nor any national DPA has ever issued guidance opposing cookie consent extensions. The 7+ year track record of extensions like Consent-O-Matic operating without regulatory challenge suggests tacit acceptance.

---

## 5. GPC (Global Privacy Control) in EU Context

### 5.1 Current W3C Status

GPC was adopted as an official work item of the W3C Privacy Working Group in November 2024. It is currently a Working Draft on the W3C Recommendation track, actively progressing through formal standardization.

### 5.2 US Adoption (Strong and Growing)

As of January 2026, **12 US states** require businesses to honor GPC or equivalent universal opt-out mechanisms: California, Colorado, Connecticut, Delaware, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, and Texas.

**California AB 566 (Opt Me Out Act)**: Signed October 2025, effective January 1, 2027. Requires all browsers to include built-in GPC functionality. This is the most significant GPC milestone — it makes browser-level privacy signals mandatory for any browser distributed in California.

### 5.3 EU Recognition (Limited but Growing)

GDPR does not explicitly reference GPC. However:
- **CNIL (France)** and **ICO (UK)** increasingly view GPC as a valid way for users to exercise their Right to Object (Article 21 GDPR)
- Under GDPR, a user's privacy preference expressed via a recognized standard could constitute valid consent withdrawal
- The Digital Omnibus Article 88b concept is compatible with GPC, though GPC is binary (opt-out only) while 88b envisions per-purpose granularity

### 5.4 GPC's Limitation for EU Purposes

GPC is a binary signal: "do not sell/share my personal data." It does not support:
- Per-purpose consent (functional vs. analytics vs. marketing)
- Opt-in signals (only opt-out)
- Per-controller preferences

This makes GPC insufficient as the sole standard for Article 88b compliance, which requires granular, per-purpose signaling. The EU will likely need something more like ADPC or a new standard that extends GPC's approach.

### 5.5 California AB 566's Influence on EU

AB 566 creates significant pressure on browser manufacturers (Google, Apple, Mozilla, Microsoft) to implement native privacy signal functionality by January 2027. Once browsers have this capability for California compliance, extending it to EU requirements becomes much easier. This is arguably the most important external accelerator for Article 88b implementation.

---

## 6. Critical Analysis: Does Our Project Make Sense?

### 6.1 The Transition Gap (2026-2031)

The single most important finding is the **massive gap between the EU's stated direction and actual implementation**:

| Year | What Happens | Cookie Consent Extensions Needed? |
|------|-------------|:---:|
| 2026 | Digital Omnibus in legislative process | **YES** — nothing changes yet |
| 2027 | Possible adoption; CA AB 566 takes effect | **YES** — EU rules not yet applicable |
| 2028 | Article 88a may apply (cookie rules in GDPR) | **YES** — signals not yet mandatory |
| 2029 | Article 88b controller obligations may begin | **PARTIALLY** — signals emerging but incomplete |
| 2030 | Standards still developing; partial adoption | **PARTIALLY** — some sites comply, many don't |
| 2031+ | Browser obligations kick in; widespread adoption | **LESS** — but media sites exempt, legacy sites remain |

**Even in the most optimistic scenario**, cookie consent extensions remain useful for at least 3-4 years. In realistic scenarios, 5-7 years.

### 6.2 Why Extensions Remain Useful Even After Article 88b

1. **Media exemption**: Article 88b(3) excludes media service providers. News sites, streaming services, and content platforms can continue using traditional banners indefinitely. Extensions will always be needed for these sites.

2. **Non-EU sites**: Sites outside the EU's jurisdiction will not implement Article 88b signals. Extensions remain valuable for global browsing.

3. **Compliance gap**: Research shows only 11.8% of CMPs currently meet minimal legal requirements. Compliance with new Article 88b obligations will be gradual and imperfect.

4. **Legacy CMP infrastructure**: Millions of sites use existing CMPs (OneTrust, Cookiebot, etc.) that will need significant updates. The transition will take years.

5. **Standard fragmentation**: Multiple competing standards may emerge (GPC, ADPC, proprietary solutions), creating interoperability gaps that extensions can bridge.

6. **Cookie walls**: Some sites block access without full consent. Extensions help users navigate these (legally questionable but persistent) practices.

### 6.3 Strategic Positioning Options

**Option A: Bridge Solution (Recommended)**
Build the extension now to solve today's problem. Design the open standard to be compatible with Article 88b's eventual technical specification. Position the project as a "reference implementation" and "bridge" that works today and evolves into the EU standard tomorrow.

- **Pros**: Immediate utility, regulatory alignment, potential to influence the standard
- **Cons**: Eventual partial obsolescence (which is acceptable)
- **Timeline**: 3-5 years of strong relevance, then gradual transition to complementary role

**Option B: Standard-First Approach**
Focus on contributing to the Article 88b standardization process rather than building an extension.

- **Pros**: Maximum long-term influence
- **Cons**: No immediate product, standardization is slow and political, may not succeed
- **Timeline**: 3-5 years before any impact

**Option C: Extension-Only (Not Recommended)**
Build the extension without the open standard component.

- **Pros**: Faster to market
- **Cons**: Competes with existing extensions (Consent-O-Matic, autoconsent), no differentiation, no long-term strategic value

### 6.4 Civil Society Concerns

EDRi (European Digital Rights) has called the Digital Omnibus "a major rollback of EU digital protections," arguing it:
- Shifts device access rules into GDPR with broad exceptions
- Narrows personal data definitions
- Allows unchecked use of personal data for AI training
- Reduces transparency obligations

The browser signal provision is called "the one positive element" by EDRi, but they note it "applies only after two years and does not cover many media sites."

These concerns could slow or modify the legislation, further extending the transition period.

---

## 7. Competitive Landscape Update

### 7.1 How Competitors Are Responding

No major cookie consent extension has publicly pivoted toward Article 88b compatibility. This presents an opportunity:

- **Consent-O-Matic**: Continues CSS selector approach. No public roadmap for standard integration.
- **DuckDuckGo Autoconsent**: Built into DuckDuckGo browser. May eventually implement native signals if/when standards emerge.
- **CookieBlock**: ML-based classification. Research project, not actively maintained.
- **Super Agent**: Proprietary. No public stance on EU regulatory changes.

### 7.2 Browser Manufacturer Responses

- **Google Chrome**: No public statement on Article 88b. Privacy Sandbox/Topics API is Google's preferred approach. AB 566 compliance will force some GPC implementation.
- **Mozilla Firefox**: Already supports GPC. Likely receptive to EU consent signals.
- **Apple Safari**: Strong privacy stance. ITP already blocks third-party cookies. May implement consent signals proactively.
- **Brave**: Already supports GPC natively. Likely early adopter of any EU standard.

---

## 8. Conclusions and Recommendations

### 8.1 Should We Proceed?

**YES — proceed with the project.** The rationale:

1. **3-5 year minimum gap** before EU browser signals are widely implemented
2. **Media exemption** ensures extensions remain relevant even after Article 88b
3. **Our open standard differentiator** aligns directly with where the EU is heading
4. **No competitor** is positioning for the Article 88b transition
5. **California AB 566** accelerates browser-level privacy signals, creating momentum we can ride

### 8.2 How to Position

1. **Frame as "Article 88b today"**: Market the extension as delivering the browser-based consent experience that the EU has promised but won't deliver for years
2. **Design the open standard for Article 88b compatibility**: Use the same conceptual model (per-purpose, machine-readable, controller-respecting signals)
3. **Engage with standardization**: Monitor EU standardization body activities; submit our standard as input when the Article 88b technical specification process begins
4. **Support both GPC and granular signals**: Emit GPC headers for US compliance while providing granular EU-style per-purpose signals
5. **Build for graceful obsolescence**: Design the extension so that as native browser signals emerge, it can detect and defer to them, filling gaps only where needed

### 8.3 Timeline-Adjusted Roadmap

| Phase | Timing | Focus |
|-------|--------|-------|
| **Phase 1** (now) | 2026 | Extension MVP with top CMP support |
| **Phase 2** | 2026-2027 | Open standard specification; GPC header support |
| **Phase 3** | 2027-2028 | Engage EU standardization; expand CMP coverage |
| **Phase 4** | 2028-2029 | Adapt to emerging Article 88b standards |
| **Phase 5** | 2029-2031 | Transition to bridge/complement role for native browser signals |

### 8.4 Risk: What If the Digital Omnibus Fails?

The Digital Omnibus could:
- Be significantly amended (likely)
- Have Article 88b weakened or delayed (possible)
- Fail entirely (unlikely but not impossible — the ePrivacy Regulation failed after 8 years)

If Article 88b fails or is indefinitely delayed, our extension becomes **more valuable, not less** — the problem of cookie consent fatigue doesn't disappear, and our solution remains the only approach that combines an open standard with automated consent management.

### 8.5 Final Verdict

**The project is well-timed and strategically sound.** We are building what the EU wants to mandate but cannot deliver for years. The open standard component is our key differentiator — it positions us not as "another consent extension" but as a proto-standard that could influence or complement the Article 88b technical specification.

The worst-case scenario (EU mandates native browser signals that fully work) still gives us 3-5 years of relevance plus the media exemption gap. The best-case scenario (our standard informs Article 88b implementation) gives us lasting influence on EU privacy infrastructure.

**Proceed. Build the bridge.**

---

## Sources

### EU Digital Omnibus Proposal
- [Conditional Consent: Article 88b Consent Signalling Proposal — TechGDPR](https://techgdpr.com/blog/conditional-consent-article-88b-consent-signalling-proposal/)
- [Digital Omnibus Reshapes EU Cookie Rules — Osborne Clarke](https://www.osborneclarke.com/insights/digital-omnibus-reshapes-eu-cookie-rules-leaves-banner-fatigue-largely-intact)
- [Proposed Cookie Exceptions and Browser Signal Mandates — Cassie/Syrenis](https://syrenis.com/resources/blog/proposed-new-cookie-exceptions-and-browser-signal-mandates/)
- [The Digital Omnibus: Cookies, Consent and Digital Advertising — Taylor Wessing](https://www.taylorwessing.com/en/global-data-hub/2026/the-digital-omnibus-proposal/gdh---the-digital-omnibus---cookies)
- [Understanding the Digital Omnibus Regulation — Iubenda](https://www.iubenda.com/en/help/188546-digital-omnibus-regulation-gdpr-guide)
- [EU Digital Omnibus: Analysis of Key Changes — IAPP](https://iapp.org/news/a/eu-digital-omnibus-analysis-of-key-changes)
- [Digital Omnibus Regulation Proposal — European Parliament Legislative Train](https://www.europarl.europa.eu/legislative-train/theme-a-new-plan-for-europe-s-sustainable-prosperity-and-competitiveness/file-digital-package)
- [2025 EU Digital Omnibus Package: Practical Guide — Kennedys Law](https://www.kennedyslaw.com/en/thought-leadership/article/2026/the-2025-european-commission-eu-digital-omnibus-package-a-practical-guide-and-explainer/)
- [How the Digital Omnibus Proposes to Change the GDPR — Compliance & Risks](https://www.complianceandrisks.com/blog/how-the-digital-omnibus-proposes-to-change-the-gdpr/)
- [Browser Signal Consent Will Kill Your Cookie Banner by 2027 — Seresa](https://seresa.io/blog/global-privacy-control-gpc/browser-signal-consent-will-kill-your-cookie-banner-by-2027)

### ePrivacy Regulation
- [EU Commission Abandons ePrivacy Regulation — Freevacy](https://www.freevacy.com/news/politico/european-commission-to-abandon-eprivacy-regulation/6124)
- [European Commission Withdraws ePrivacy Regulation — Hunton Andrews Kurth](https://www.hunton.com/privacy-and-information-security-law/european-commission-withdraws-eprivacy-regulation-and-ai-liability-directive-proposals)
- [ePrivacy Regulation — Wikipedia](https://en.wikipedia.org/wiki/EPrivacy_Regulation)
- [ePrivacy (RP 2026) — Interoperable Europe Portal](https://interoperable-europe.ec.europa.eu/collection/rolling-plan-ict-standardisation/eprivacy-rp-2026)

### ADPC and noyb
- [noyb: New Browser Signal Could Make Cookie Banners Obsolete](https://noyb.eu/en/new-browser-signal-could-make-cookie-banners-obsolete)
- [ADPC Specification](https://www.dataprotectioncontrol.org/spec/)
- [ADPC Official Site](https://www.dataprotectioncontrol.org/)
- [noyb Digital Omnibus Report V3](https://noyb.eu/en/digital-omnibus-report-v3-analysis-select-gdpr-and-eprivacy-proposals-commission)
- [noyb: Open Letter — Digital Omnibus Brings Deregulation](https://noyb.eu/en/open-letter-digital-omnibus-brings-deregulation-not-simplification)
- [Belgian DPA Decision on noyb Cookie Complaints — Clifford Chance](https://www.cliffordchance.com/insights/resources/blogs/talking-tech/en/articles/2025/07/belgian-dpa-decision-on-noyb-cookie-complaints.html)

### Civil Society
- [EDRi: Digital Omnibus Is a Major Rollback of EU Digital Protections](https://edri.org/our-work/commissions-digital-omnibus-is-a-major-rollback-of-eu-digital-protections/)

### EDPB
- [EDPB Cookie Banner Task Force Report (January 2023)](https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en)
- [EDPB Guidelines 02/2023 on Technical Scope of Art. 5(3)](https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf)

### GPC and California AB 566
- [GPC W3C Working Draft](https://www.w3.org/TR/gpc/)
- [Global Privacy Control Official Site](https://globalprivacycontrol.org/)
- [GPC in 2026 — Didomi](https://www.didomi.io/blog/global-privacy-control-gpc-2026)
- [GPC vs DNT: The 2026 Legal Difference — Cookie Script](https://cookie-script.com/privacy-laws/global-privacy-control-vs-do-not-track)
- [DNT vs GPC vs ADPC: Comparing Browser Privacy Signals — Secure Privacy](https://secureprivacy.ai/blog/comparing-browser-signals-dnt-vs-gpc-vs-adpc)

### Legislative Timeline
- [EU Digital Omnibus — Hogan Lovells](https://www.hoganlovells.com/en/publications/eu-digital-omnibus-where-simplification-is-likely-and-what-businesses-should-plan-for)
- [Introduction to the Digital Omnibus Package — Bird & Bird](https://www.twobirds.com/en/insights/2025/introduction-to-the-the-european-commission%E2%80%99s-digital-omnibus-package)
- [EU Digital Omnibus — Sidley Austin](https://www.sidley.com/en/insights/newsupdates/2025/12/eu-digital-omnibus-the-european-commission-proposes-important-changes-to-the-eus-digital-rulebook)
