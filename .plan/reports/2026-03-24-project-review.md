# Project Review — NoCookie

**Reviewer**: Senior Technical Reviewer (Claude Opus 4.6)
**Date**: 2026-03-24
**Scope**: Full project review — research, design, architecture, mockups, strategy

---

## 1. Bugs and Errors

### 1.1 Factual Errors in Research

- **T01 report, line 13**: States Consent-O-Matic has "200K+ users" and a "4.2-4.8/5 rating." The rating range is suspiciously wide (0.6 gap). This likely conflates ratings across different browser stores without clarifying that distinction.

- **SUMMARY.md, line 29**: DuckDuckGo Autoconsent is described as "Reject-only, no user config." This is partially incorrect. Autoconsent does have configurable modes in DuckDuckGo's browser settings. The library itself supports both opt-in and opt-out actions depending on CMP rule configuration. What is true is that DuckDuckGo's own browser defaults to reject-only behavior.

- **T01 report, line 88**: States ISTDCAC fork was "from v3.4.3." This version number was not verifiable from public sources and may be inaccurate. The fork was made from the last open-source version before the Avast acquisition, but the exact version should be verified.

### 1.2 Inconsistencies Between Documents

- **ARCHITECTURE.md vs. PLAN.md**: ARCHITECTURE.md (line 28) describes the standard as "HTML metadata tags for machine-readable cookie consent UI" while PLAN.md section 4 defines it as `/.well-known/cookie-consent.json` (a JSON file, not HTML meta tags). The ARCHITECTURE.md is outdated and contradicts the actual design. **Must be updated.**

- **ARCHITECTURE.md vs. PLAN.md directory structure**: ARCHITECTURE.md shows `packages/` as "Shared code (if needed)" but PLAN.md section 2.1 defines the extension structure under `nocookie-extension/` (flat). The PLAN.md also introduces `packages/schema/` in T17. These two visions of the repo layout are inconsistent.

- **README.md vs. PLAN.md**: README.md (line 16) says "Open Standard -- a set of HTML metadata tags" but the actual standard design in PLAN.md is a `.well-known` JSON file. README needs updating.

- **Vision document vs. PLAN.md**: Vision (line 33) lists phases sequentially (Phase 2: Extension, Phase 3: Standard, Phase 4: Website). But PLAN.md and ORCHESTRATOR.md treat all three as part of a single epic (E002) with interleaved waves. This is not necessarily wrong, but the vision implies a more sequential approach than the actual plan delivers.

- **Category count inconsistency**: PLAN.md section 2.6 defines `UserPreferences` with 5 categories (essential, functional, analytics, marketing, socialMedia). The JSON schema in section 4.2 allows exactly these 5 values in `categories`. But the SUMMARY.md (line 60) shows preference profiles with only 4 categories (no Social Media column). The options page mockup correctly shows all 5.

- **PLAN.md line 279 vs. line 237**: The `domainOverrides` uses `mode: 'whitelist' | 'blacklist' | 'custom'` but the options mockup (extension-options.html, line 175) shows "Disabled" as a mode, which is not in the type definition. Add `'disabled'` to the union type.

### 1.3 Missing or Broken References

- **index.html mockup, line 233**: References "T05 -- EU direction (in progress)" but T05 is actually complete (status: Complete in the report file).

- **BACKLOG.md**: Only 5 items. No reference to enterprise deployment, mobile considerations, or telemetry -- all discussed in PLAN.md section 9. These should be backlog items or at minimum referenced.

- **No T02 or T03 reports were provided for review**, though the index mockup references them. Either they were not written or not included in the review scope.

### 1.4 HTML/CSS Issues in Mockups

- **extension-popup.html, line 217**: The state switcher button matching logic uses `includes()` with hardcoded strings. The "Handled" button active state works by matching `id === 'handled'` against `b.textContent.toLowerCase()`, but `"handled".toLowerCase()` is `"handled"` which is checked via `includes`. This works but is fragile. If button labels change, the highlighting breaks.

- **standard-spec.html, line 291**: `showExample()` uses `event.target` directly (implicit global `event`). This is non-standard; it works in Chrome but fails in Firefox strict mode. Should pass `event` as a parameter: `onclick="showExample('onetrust', event)"`.

- **standard-spec.html, lines 26-27**: The sidebar is `position: fixed` with `top: 0`, but the mockup navigation bar is also `position: sticky; top: 0; z-index: 9999`. The sidebar renders **behind** the mockup nav and overlaps from pixel 0. In production (without the mockup nav) this would be fine, but there is also no accounting for the sidebar starting below a page navigation bar.

- **landing-page.html, lines 253-261**: The stats section shows "1.2M+ Popups Handled" and "340+ Sites with Standard." These are fictional numbers for a project that does not exist yet. While acceptable for a mockup, there is no mechanism to replace these with real data or hide them until meaningful. The landing page should have a "coming soon" variant or conditional display.

- **extension-options.html**: No keyboard focus indicators beyond browser defaults. The toggle switches (`.switch`) are implemented with `<label>` wrapping `<input type="checkbox">`, which is correct, but the info buttons (`<button class="info-btn">`) have no `aria-expanded` attribute to communicate state to screen readers.

- **extension-popup.html**: The emoji characters used for category icons (lock, check, cross at lines 118-122) may not render consistently across operating systems. Consider using SVG icons instead.

---

## 2. Design Critique

### 2.1 Is the Solution Over-Engineered?

**Partially yes.** The project attempts three deliverables simultaneously (extension + open standard + website) in a single epic. This is ambitious but creates a risk of delivering nothing well rather than one thing excellently.

The open standard (`cookie-consent.json`) is a compelling idea, but it faces a chicken-and-egg problem: no website will adopt it without users demanding it, and users will not demand it without seeing value. **The extension must work perfectly without the standard.** The standard is a long-term play, not a launch requirement.

**The `api` field in the standard is problematic.** Including JavaScript expressions as strings in a JSON file (`"acceptAll": "OneTrust.AllowAll()"`) is essentially asking websites to publish executable code in a metadata file. This is unusual and potentially confusing. It conflates a declaration of what exists with instructions on how to interact. The `selectors` field has the same issue to a lesser degree -- it is useful but fragile (selectors change with CMP versions). A simpler standard that just declares categories and CMP name would be more robust and more likely to be adopted.

### 2.2 Simpler Approaches Being Missed

1. **Fork autoconsent instead of building from scratch.** DuckDuckGo's autoconsent library already has 100+ CMP rules, a well-tested execution framework, and active maintenance. The PLAN.md mentions using it as a "foundation" (SUMMARY.md line 130) but the actual architecture in PLAN.md section 2 is entirely custom. Building a new CMP detection/execution engine from scratch is the single biggest risk in this project. Recommendation: wrap autoconsent, add the preference UI layer on top, and focus effort on the standard + UX.

2. **The website can be a GitHub Pages README for v1.** Building an Astro + Cloudflare Pages site with a validator tool is nice-to-have but not MVP. The spec can live as a markdown file on GitHub. The validator can be a CLI tool or a simple HTML page.

3. **Skip the AI agent instructions file (`cookie-consent-instructions.md`).** The JSON standard itself is AI-readable. A separate markdown instructions file adds complexity for minimal gain. AI agents can read the JSON schema directly.

### 2.3 Is the Open Standard Too Complex?

The standard has a good minimal form (just `version` + `categories`), which is well-designed. But the full spec tries to be both a declaration ("these are our categories") and an instruction manual ("here is how to interact with our CMP"). These are different concerns.

**Recommendation**: Split into two levels:
- **Level 1 (Declaration)**: `version`, `categories`, `cmp.name`, `gpc`, `tcf`, `policyUrl` -- what the site uses
- **Level 2 (Integration)**: `selectors`, `categorySelectors`, `api` -- how to interact

Level 1 is what most sites would adopt. Level 2 is for power users and CMP vendors who want to provide perfect integration.

### 2.4 Is the Extension Architecture Sound?

**Yes, the core architecture is solid.** The two-world content script approach (ISOLATED for detection, MAIN for execution) is the correct design for Manifest V3. The layered detection strategy is well-thought-out. The message flow between content scripts and service worker is standard best practice.

**Concerns:**
- The well-known fetch (Layer 1 of detection) runs on every page load. This adds a network request per domain. The 24h cache mitigates this, but the initial request will be a 404 on >99.9% of domains for the foreseeable future. Consider making this opt-in or lower priority than DOM detection.
- Layer 2 (JS API probing) requires injecting a script into MAIN world before detection is confirmed. This is a performance concern -- injecting into every page just to check for `window.OneTrust` is wasteful. Consider checking DOM selectors first (Layer 3) since they run in ISOLATED world and are cheaper.

### 2.5 Task Breakdown Assessment

**Wave 1 (T01-T05) is too sequential.** T01 through T05 form a strict chain where each depends on the previous. In practice, T02 (types) and T01 (scaffolding) could be done together, and T04 (service worker) and T05 (content script) could be parallelized once T02 is done.

**Wave 2 tasks T08/T09/T10 are correctly parallelized** -- good.

**Missing tasks:**
- No task for onboarding/first-run experience. The legal analysis (T04 report) recommends requiring users to configure preferences during onboarding. This is important enough to be its own task.
- No task for GPC header emission, mentioned in T05 EU direction analysis as a recommendation.
- No privacy policy writing task (mentioned in T24 but deserves its own task given legal analysis recommendations).

---

## 3. Strategic Feedback

### 3.1 EU Direction (Art. 88b) Impact on Scope

The EU direction analysis is excellent and the conclusion is correct: the 3-5 year gap before Article 88b implementation justifies building now. However, the analysis should influence prioritization more strongly:

- **The open standard should be designed to be a candidate input to Article 88b standardization.** This means it needs to be submitted to a standards body (W3C Community Group or IETF draft) sooner rather than later. Add this to the roadmap.
- **GPC integration should be Phase 1, not an afterthought.** GPC is legally mandated in 12 US states and will be required in all major browsers by January 2027. Emitting GPC headers alongside consent management gives the extension immediate legal relevance in the US market.

### 3.2 Standard vs. Extension Focus

**Focus 80% on the extension, 20% on the standard for launch.** The extension delivers immediate user value. The standard is a differentiator for positioning but has no user value until websites adopt it. The adoption path requires the extension to be successful first.

The ORCHESTRATOR.md allocates Wave 4 (T17-T19) and Wave 5 (T20-T22) to the standard and website. This is appropriate as long as the extension is shippable after Wave 3.

### 3.3 Competitive Positioning

The positioning is mostly correct. The claim "no one has created a lightweight robots.txt-style standard for cookie consent" is accurate. The gap between Consent-O-Matic (good but manual rules) and our approach (standard + extension) is real.

**One risk**: if DuckDuckGo decides to open-source a per-category preference UI on top of autoconsent, they immediately have a more complete solution with more CMP coverage. The defense against this is the open standard, which DuckDuckGo is unlikely to create.

### 3.4 What Is the Real MVP?

**A Chrome extension that handles the top 3 CMPs with per-category preferences and a clean popup UI.** That is:
- Wave 1 (scaffolding) + Wave 2 (T06-T10, skip T11 heuristics and T12 well-known) + Wave 3 (T13 popup + T14 preferences, skip T15 advanced/stats + T16 badges)

**This could ship in 1-2 weeks, not 27-39 days.**

Then iterate: add heuristics, add more CMPs, add the standard, add the website.

**Concrete 1-week MVP scope:**
1. Project scaffolding with Vite + TypeScript (1 day)
2. Shared types + storage wrapper (0.5 day)
3. Service worker + content script skeleton (1 day)
4. Rule engine + executor framework (1 day)
5. OneTrust + Cookiebot + Didomi rules (1.5 days, parallel)
6. Popup UI (handled/none states only) + basic preferences (1 day)
7. Testing + polish (1 day)

Total: ~7 working days for a functional extension that handles 3 CMPs.

---

## 4. UX/Design Feedback

### 4.1 Extension Popup

**Strengths:**
- Clean, information-dense layout that uses space well
- Five states cover all user scenarios
- Category acceptance/rejection display is clear and scannable

**Issues:**
- The "Override for this site" action is text-only link at the bottom. For the most privacy-conscious users, per-site override is a primary action. Consider making it more prominent.
- The profile dropdown in the popup allows switching profiles globally from a single page's context. This is powerful but potentially confusing -- a user might change profile to fix one site and forget it affects all sites. Add a visual warning: "This changes your default for all sites."
- No "undo" action. If the extension auto-handled consent and the user wants to change what was accepted, there is no "re-do consent" button. The user would have to clear cookies for the domain and reload. This should be called out.
- The "Needs Attention" state offers "Handle manually" but does not explain what that does. Does it open the CMP? Does it let the user click through the popup themselves?

### 4.2 Options Page

**Strengths:**
- Tab organization is logical and complete
- Profile presets with auto-switching to "Custom" on manual toggle is excellent UX
- Info expandos for each category are helpful for informed consent

**Issues:**
- The Site Overrides tab (extension-options.html) has a plain table with Edit/Delete buttons but no inline editing. The "Add Override" button triggers an `alert()`. In production, this needs a modal or inline form. The mockup does not prototype this interaction, which is the most complex UI flow on the options page.
- The Statistics tab shows data but has no "Clear data" or "Export" option. Users concerned with privacy may want to delete their consent logs.
- The Consent Delay slider (0-2000ms) defaults to 500ms. This is a technical setting that most users should never touch. Consider hiding it behind an "Advanced" toggle within the Advanced tab itself, or removing it entirely and using adaptive delay based on CMP load timing.
- No search/filter on the Site Overrides table. With 50+ overrides, this becomes unusable.

### 4.3 Landing Page

**Strengths:**
- Strong hero with clear value proposition
- Problem section effectively uses emotional resonance (popup fatigue)
- The "robots.txt for cookie consent" analogy is excellent and memorable
- Code block showing the minimal JSON is persuasive for developers

**Issues:**
- The landing page has no section explaining what data the extension collects. Given that this is a privacy tool, a "We respect your privacy" section with explicit guarantees (no tracking, local-only, open source) should be above the fold or at minimum before the footer.
- The stats bar shows "1.2M+ Popups Handled." These are aspirational numbers on a project that does not exist yet. In v1, either hide this section or show "0 -- help us get started" with a more honest tone.
- No testimonials or social proof section. For a privacy extension, endorsement from privacy researchers (like the Consent-O-Matic team at Aarhus University) or organizations (EFF, noyb) would be powerful. Add this as a future section.
- The mobile responsive breakpoint (768px) collapses all grids to single column. The step numbers (CSS counters) still render correctly, which is good.

### 4.4 Standard Spec Page

**Strengths:**
- Sidebar TOC with scroll-tracking is professional documentation UX
- Code blocks with copy buttons are practical
- CMP example tabs let developers see relevant examples quickly
- The callout box with the robots.txt analogy is well-placed

**Issues:**
- The "categorySelectors" field is in the PLAN.md specification (section 4.1) but is NOT shown in the spec page mockup's "Full Schema" code block. This is a significant omission -- it is arguably the most useful field for per-category consent.
- The Field Reference table lists `categorySelectors` but the example code never shows it. Add an example.
- No section on security considerations. The `api` field contains JavaScript expressions. The spec page should explicitly warn that consumers of this file must validate and sanitize these values rather than executing them directly from untrusted sources.
- The sidebar disappears on mobile (`display: none` at 900px) with no hamburger menu or alternative navigation. This is a documentation page where navigation matters. Add a collapsible menu or top-of-page TOC for mobile.

---

## 5. Missing Considerations

### 5.1 Security

- **The `api` field in cookie-consent.json is a code injection vector.** If the extension naively executes the `api.acceptAll` string from any domain's well-known file, a malicious site could inject arbitrary JavaScript. The extension MUST either: (a) only use the `api` field from trusted/verified sources, (b) use a safelist of known API patterns and reject unknown ones, or (c) never execute untrusted api strings and only use them for known CMP type matching. This is not discussed anywhere in the PLAN.md or architecture docs.

- **Content script injection timing**: If the service worker injects the MAIN world executor via `chrome.scripting.executeScript` and the page has a Content Security Policy (CSP) that blocks inline scripts, the injection may fail silently. The PLAN.md does not discuss CSP handling.

### 5.2 Edge Cases and Failure Modes

- **Cookie walls**: Some sites block content unless all cookies are accepted. The legal analysis mentions this (T04, section 6.2) but the extension design has no specific handling. If the user's preference is "reject marketing" and the site has a cookie wall, the extension will reject, the site will block access, and the user will be stuck. The extension should detect cookie walls and offer a per-site "accept all to access this site" prompt.

- **Race conditions**: CMPs often load asynchronously. The MutationObserver approach is correct, but what happens if the CMP loads, the extension acts, and then the CMP re-renders (common in SPAs or with delayed consent checks)? The extension could end up in a loop: detect -> act -> CMP resets -> detect -> act. The design needs a per-domain cooldown or "already handled" flag.

- **Multiple CMPs on one page**: Some sites load both a TCF CMP and a custom cookie banner. The extension needs a strategy for this (act on the first detected? prefer the TCF one?).

- **Consent revocation**: If a user changes their preferences after visiting a site, the extension has no way to revoke previously given consent. The consent log records what was done, but there is no "go back and revoke consent on sites I already accepted." This is a known limitation but should be documented.

### 5.3 Business Model

Not discussed anywhere. If this is a purely open-source hobby project, that is fine. But if there is any aspiration for sustainability, consider:
- **No monetization plan is needed for v1**, but the project should avoid patterns that make monetization impossible later (e.g., do not promise "no server communication ever" if you might want a rule update service later).
- The Backlog mentions "Analytics dashboard for website owners (adoption metrics)" -- this could be a SaaS offering if the standard gains adoption.

### 5.4 Growth/Adoption Strategy Gaps

- **No Chrome Web Store ASO strategy.** The extension needs keywords, category selection, and a compelling short description. Current README description is functional but not compelling for store discovery.
- **No content marketing plan.** The blog section on the website is mentioned but no content strategy. Blog posts comparing the extension to Consent-O-Matic, explaining the open standard, or covering EU cookie law changes would drive organic traffic.
- **No outreach to CMP vendors.** The PLAN.md recommends CMP plugins to auto-generate cookie-consent.json (section 4.4, points 2-3), but no task exists for contacting CMP vendors. OneTrust and Cookiebot might be interested in supporting the standard if it reduces friction for their customers.
- **No academic outreach.** The Consent-O-Matic team at Aarhus University and the CookieBlock team at ETH Zurich are natural allies. Reaching out to them early could lead to collaboration, endorsement, or integration.

### 5.5 Testing Gaps

- The PLAN.md mentions E2E tests with "mock CMP pages" (T08-T10) but does not specify how these mock pages are created. Building realistic CMP mocks that match production behavior is non-trivial. Consider using real CMP scripts in test pages (many CMPs have free tiers) or capturing and replaying CMP DOM snapshots.
- No mention of testing on pages with ad blockers active. Many privacy-conscious users run uBlock Origin alongside cookie consent extensions. The extension should not conflict with ad blockers that may also hide cookie banners via CSS.

---

## 6. Top 10 Improvement Proposals

### P1. Adopt autoconsent as the CMP interaction layer (Priority: P1, Effort: M)
**What**: Instead of building custom CMP rules from scratch, integrate DuckDuckGo's autoconsent library as the foundation for CMP detection and interaction. Build the preference UI and standard support on top.
**Why**: Autoconsent covers 100+ CMPs with tested rules. Building equivalent coverage from scratch would take months. The research summary already recommends this (SUMMARY.md line 130) but the PLAN.md ignores it.
**Impact**: Reduces Wave 2 scope from 7 tasks to 2-3. Dramatically accelerates time-to-market.

### P2. Ship a 1-week MVP (Priority: P1, Effort: M)
**What**: Cut scope to: scaffolding + types + storage + service worker + content scripts + 3 CMP rules + popup (2 states) + basic preferences. No heuristics, no well-known, no website, no standard spec, no statistics, no advanced settings.
**Why**: 27-39 days before any user can install the extension is too long. Ship something usable, get feedback, iterate.
**Impact**: Real users providing real feedback within 2 weeks instead of 2 months.

### P3. Fix ARCHITECTURE.md and README.md inconsistencies (Priority: P1, Effort: S)
**What**: Update ARCHITECTURE.md to reflect the actual design (JSON well-known file, not HTML meta tags). Update README.md similarly. Ensure all documents agree on the technical approach.
**Why**: Anyone reading the project documentation gets contradictory information. This undermines credibility and causes confusion for contributors.

### P4. Address the api field security concern (Priority: P1, Effort: S)
**What**: Document in PLAN.md that `api` field values from cookie-consent.json MUST NOT be executed from untrusted sources. Implement a safelist approach: the extension only executes known API patterns (e.g., `OneTrust.AllowAll()`) and ignores unknown strings. The `api.type` field determines which safelist to use.
**Why**: Without this, the open standard creates a code injection vector. A malicious site could serve a cookie-consent.json with arbitrary JavaScript in the `api` fields.

### P5. Add onboarding/first-run task to ORCHESTRATOR.md (Priority: P2, Effort: S)
**What**: Create E002-T25 for a first-run experience that requires users to choose a privacy profile before the extension starts acting. Show a brief explanation of what each category means.
**Why**: Legal analysis (T04) explicitly recommends "Force users to make an active choice during extension setup." This is a legal risk mitigation that is missing from the task breakdown.

### P6. Add GPC header support to Wave 2 (Priority: P2, Effort: S)
**What**: The extension should emit the `Sec-GPC: 1` header when the user's profile is Privacy Maximum or any profile that rejects marketing. Use `chrome.declarativeNetRequest` to add the header.
**Why**: GPC is legally mandated in 12 US states and gives the extension immediate legal leverage. The EU direction analysis recommends this. Currently not in any task.

### P7. Split the open standard into two levels (Priority: P2, Effort: S)
**What**: Level 1 (declaration): version, categories, cmp name, gpc, tcf, policyUrl. Level 2 (integration): selectors, categorySelectors, api. Market Level 1 as the "5-minute adoption" target. Level 2 is optional for power users.
**Why**: The current standard tries to be both a declaration and an instruction manual. Most website owners will only adopt the simplest version. Making Level 1 explicitly sufficient reduces adoption friction.

### P8. Add cookie wall detection and handling (Priority: P2, Effort: M)
**What**: When the extension rejects cookies and the site subsequently blocks access (detected via page content analysis or user report), offer a popup action: "This site requires cookies to access. Accept all for this site?" with a one-click override.
**Why**: Cookie walls are common on news sites (the exact sites exempted from Article 88b). Without this, users will disable the extension site-by-site, reducing its value.

### P9. Add "re-consent" action to popup (Priority: P3, Effort: S)
**What**: In the "Handled" popup state, add a "Change consent" button that clears the site's cookies and reloads the page, allowing the CMP to re-appear so the extension can re-apply with potentially different preferences.
**Why**: Users who change their global preferences have no way to retroactively apply them to already-consented sites. This is a common scenario.

### P10. Plan for standard submission to W3C Community Group (Priority: P3, Effort: M)
**What**: After the v1 standard is published, create a W3C Community Group (free, open process) to give the standard institutional legitimacy. Draft a W3C Community Group Report.
**Why**: The EU direction analysis identifies Article 88b standardization as a strategic opportunity. A W3C CG gives the standard legitimacy when EU standardization bodies begin work. Without institutional backing, it remains "some person's JSON file."

---

## 7. Quick Wins

These can be fixed in the current session with minimal effort:

1. **Update ARCHITECTURE.md**: Replace "HTML metadata tags" with "JSON file at `/.well-known/cookie-consent.json`". Update the data flow to match PLAN.md section 8. Add key technical decisions from the research phase (Manifest V3, two-world content scripts, layered detection).

2. **Update README.md line 16**: Change "a set of HTML metadata tags" to "a JSON file (`/.well-known/cookie-consent.json`) that website owners can implement to make cookie consent machine-readable."

3. **Fix index.html mockup line 233**: Change "T05 -- EU direction (in progress)" to "T05 -- EU direction."

4. **Add `'disabled'` to domain override mode type** in PLAN.md section 2.7 `StorageSchema`, line 279: change `'whitelist' | 'blacklist' | 'custom'` to `'whitelist' | 'blacklist' | 'custom' | 'disabled'`.

5. **Add BACKLOG items** from PLAN.md section 9: onboarding flow, GPC header support, cookie wall detection, consent revocation, ad blocker compatibility testing, CMP vendor outreach.

6. **Add `categorySelectors` to standard-spec.html mockup**: The Full Schema code block is missing this field that appears in the PLAN.md specification.

7. **Fix `showExample()` in standard-spec.html**: Pass `event` explicitly instead of relying on implicit global.

---

## Summary

The NoCookie project has exceptionally thorough research, strong legal grounding, and a well-reasoned strategic position. The research reports are among the best I have seen for a project at this stage -- comprehensive, well-sourced, and actionable.

The main risks are:
1. **Scope creep**: Three deliverables (extension + standard + website) in one epic, 24 tasks, 27-39 days. Ship the extension first.
2. **Not-Invented-Here**: Building CMP rules from scratch when autoconsent exists with 100+ rules.
3. **Security gap**: The `api` field in the standard needs explicit security design.
4. **Document inconsistencies**: ARCHITECTURE.md and README.md describe a different technical approach than the actual design.

The strongest assets are:
1. The "robots.txt for cookies" positioning -- simple, memorable, technically sound.
2. The EU regulatory tailwind -- perfectly timed with Article 88b.
3. The research depth -- competitors, legal landscape, and EU direction are thoroughly analyzed.
4. The mockup quality -- professional, interactive, and comprehensive.

**Recommended next action**: Fix the quick wins (30 minutes), then cut scope to a 1-week MVP extension (3 CMPs + popup + preferences), and ship.
