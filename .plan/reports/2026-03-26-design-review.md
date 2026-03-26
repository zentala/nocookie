# Design Review: NoCookie

**Date**: 2026-03-26
**Reviewer**: Senior Product Designer
**Scope**: UX, UI, information architecture, user journeys across all surfaces
**Materials reviewed**: E002 PLAN, E003 PLAN, project vision, personas report, all 5 HTML mockups

---

## 1. User Journey Analysis

### 1a. New User Installing Extension for First Time

**Current flow**: Install from Chrome Web Store -> extension icon appears -> ???

**Critical gap: No onboarding flow exists.** This is the single biggest design problem in the project. The extension has a well-designed options page with 5 tabs and a popup with 5 states, but there is zero guidance between "install" and "configure." The personas report explicitly identifies "privacy-indifferent users" (70-85% of users) who will NOT open a settings page. Without onboarding:

- Users do not know what profile they are on (default is "Balanced" but this is never communicated)
- Users do not know the extension is working until they happen to click the icon
- Users miss the value proposition within the first 30 seconds, which is when retention is won or lost

**Recommended onboarding flow**:
1. Post-install welcome tab opens automatically
2. Single question: "How much do you care about cookie privacy?" with 3 visual options (maps to Privacy Maximum / Balanced / Accept All)
3. Confirmation screen showing what the profile means in plain language
4. "You're all set" with a subtle animation of a cookie popup disappearing
5. Total time: under 15 seconds

**Priority**: P1 -- without this, user activation will be critically low.

### 1b. User Visiting a Site with Known CMP

**Current flow**: Page loads -> detector runs -> executor runs -> badge turns green -> user can click popup icon to see details.

**This is well-designed.** The popup "handled" state shows exactly the right information: domain, CMP name, method, confidence, and per-category consent breakdown. The traffic light system (green/yellow/red/gray) is intuitive.

**Issues**:
- No animation or transition feedback when consent is handled. The user has no visual confirmation that something happened in real-time. Consider a brief badge pulse or a subtle notification toast.
- The "Confidence: High" label in the popup meta line is technical jargon. Replace with nothing (if high) or "Approximate match" (if low). Only surface confidence when it is uncertain.
- The popup does not explain WHY certain categories were rejected. Adding a one-line explanation tied to the active profile ("Based on your Balanced profile") would reinforce the value proposition.

**Priority**: P2 for animation feedback, P3 for label refinements.

### 1c. User Visiting a Site with Our CMP Plugin (E003)

**Current flow (planned)**: Page loads -> CMP detects extension via handshake -> consent applied silently in <100ms -> user never sees a banner.

**This is the ideal experience and is well-designed at the protocol level.** However, the design is missing a UX consideration: what does the user SEE when this happens? If the extension silently handles consent, the user might think the site simply does not use cookies. This undermines trust and the extension's perceived value.

**Recommendation**: When the extension handshakes with our CMP, show a brief, dismissible micro-notification in the popup badge area: a subtle checkmark pulse. In the popup detail, show "Instant handshake -- this site uses the Cookie Consent Open Standard" with a small badge. This educates users about the standard and creates an "aha" moment.

**Priority**: P2.

### 1d. Website Owner Implementing Our CMP

**Current journey**: Read landing page -> "For Website Owners" card -> Quick Start Guide link -> ???

**The landing page tells the story but does not close the loop.** The "For Website Owners" audience card lists benefits but the CTA ("Quick Start Guide") leads nowhere. The implementation journey requires:
1. Understanding what the standard is
2. Knowing which CMP they currently use
3. Generating the JSON file
4. Deploying it
5. Validating it

**Steps 1-2 are covered.** Steps 3-5 have no UI. The validator is mentioned in the spec page but does not exist as a mockup. This is a critical missing surface for adoption.

**Recommendation**: Create a validator/generator mockup that:
- Accepts a URL input ("Enter your website URL")
- Auto-detects the CMP in use
- Pre-fills the JSON template
- Lets the user download the file
- Shows a "Copy to clipboard" option
- Validates an existing file if the site already has one

**Priority**: P1 for adoption -- the validator/generator is the conversion funnel for website owners.

### 1e. Developer Implementing the Standard

**Current journey**: Landing page -> "For Developers" card -> "View the Docs" -> Spec page.

**The spec page is excellent.** It follows established documentation patterns (sidebar TOC, code blocks with copy buttons, tabbed examples, field reference table). The "Quick Start" section with the minimal 3-line example is the right opening. The CMP examples with tabs for OneTrust/Cookiebot/Didomi are practical.

**Issues**:
- The spec page lacks a "Contributing" section. Developers who want to add rules for new CMPs have no guidance.
- The JSON Schema section shows the full schema inline, but the schema URL at the bottom (`nocookie.zentala.io/standard/v1/schema.json`) is not prominently featured. Developers need the schema URL upfront for IDE integration.
- No API reference page exists. The E003 CMP exposes a rich JavaScript API (`NoCookieCMP.init()`, `.on()`, `.getConsent()`, etc.) but there is no documentation mockup for it.

**Priority**: P2 for contributing section, P3 for schema URL placement, P2 for API docs page.

---

## 2. Information Architecture

### 2.1 Extension Popup

**Verdict: Well-organized.** The popup shows the right information at the right time. The layered information hierarchy (status -> categories -> profile -> actions) follows the user's likely priority order.

**Issues**:
- The "Override for this site" and "View consent history" links are text-only action buttons without visual affordances (no icons, no arrows). They read as plain text on first glance. Add a chevron icon (>) or underline.
- The profile dropdown in the popup duplicates functionality from the options page. This is correct (quick access), but the popup does not show what the profile MEANS. A tooltip or sub-text ("Essential + Functional only") would reduce confusion.
- In the "No popup detected" state, the message "This site may not use a CMP, or consent was already given" is accurate but unhelpful. Users want to know: "Is the extension working?" Add a reassurance line: "The extension is active and monitoring."

### 2.2 Options Page

**Verdict: Good structure, needs refinement.** Five tabs is appropriate for the content volume.

**Issues**:
- **Preferences tab**: The profile dropdown and category toggles work well together (profile changes toggle state, manual toggle switches to "Custom"). But the info expandable sections (the "i" buttons) are easily missed. The info text is hidden by default in a way that most users will never discover. Consider showing a condensed version inline (e.g., "Language, region, UI settings" as a subtitle under "Functional") and making the "i" button expand to the FULL detail.
- **Site Overrides tab**: The table works for a small number of overrides but will not scale. At 20+ entries, it needs search/filter. Also missing: the ability to add an override from the popup (the "Override for this site..." button) should pre-fill the domain.
- **Advanced tab**: The "Consent delay" slider has a range of 0-2000ms with no explanation of what the numbers mean for real-world behavior. Add descriptive labels: 0ms = "Fastest (may miss some popups)", 500ms = "Recommended", 2000ms = "Most reliable (popup visible briefly)".
- **Statistics tab**: Good data visualization with bar charts. However, the stat boxes use large numbers without trend indicators. Adding "12% more than last month" would make the stats meaningful rather than just decorative.
- **About tab**: Purely informational. Consider adding a "Check for updates" button and a "Share with a friend" action to drive organic growth.

### 2.3 Landing Page

**Verdict: Strong storytelling, clear structure.** The page follows the correct narrative arc: hook (hero) -> problem -> solution -> deeper explanation (standard) -> audience segmentation -> social proof (stats) -> footer.

**Issues**:
- The hero section has two CTAs: "Install for Chrome" (primary) and "View the Standard" (secondary). This is correct, but the secondary CTA targets a completely different audience (developers vs. end users). Consider making the secondary CTA "See how it works" (anchoring to the demo section) and moving "View the Standard" to the developer section below.
- The stats bar ("1.2M+ Popups Handled", "9 CMPs Supported", etc.) uses aspirational numbers for a product that does not exist yet. This is fine for a mockup, but the design should include an empty state / early-stage variant ("Join 50 early adopters" or "Built for 9 CMPs and growing").
- The "Open Standard" section is dark-themed and visually striking, which is good for differentiation. However, showing a JSON code block to end users (who are scrolling past after the hero) may alienate non-technical visitors. Consider replacing the code block with a visual diagram (website -> JSON file -> extension reads it -> no popup) for the general audience, and linking to the full spec for developers.
- **Missing section**: No testimonials or user quotes. Even placeholder testimonials establish credibility patterns for later.
- **Missing section**: No FAQ or trust signals. Users installing a browser extension want to know: "Is this safe?", "Does it collect my data?", "Is it open source?". A brief trust section before the CTA would improve conversion.

### 2.4 Spec Page

**Verdict: Excellent for its audience.** The sidebar navigation, code blocks with copy buttons, tabbed CMP examples, and field reference table follow best practices for technical documentation.

**Issues**:
- The sidebar is fixed at `top: 38px` to account for the mockup navigation bar. In production, this needs to account for the actual site navigation height.
- The sidebar disappears entirely on mobile (`display: none` at 900px). This removes all navigation for mobile users. A hamburger menu or bottom sheet with the TOC would be better.
- The `categorySelectors` field is mentioned in the full schema section but is absent from both the field reference table and the CMP examples. This is a documentation gap that will confuse implementers.
- The "Discovery Mechanisms" section lists 4 methods (convention, HTML meta, robots.txt, llms.txt) but does not recommend a primary method. Add: "The recommended method is #1 (direct convention). Methods 2-4 are supplementary."

---

## 3. Visual Design Assessment

### 3.1 Color Scheme

**Strengths**:
- Consistent use of deep indigo (`#1e1b4b`) as primary and emerald/green (`#10b981`) as accent across all surfaces. This pairing is distinctive and conveys trust (indigo) + positive action (green).
- Traffic light semantics (green/yellow/red/gray) in the popup are universally understood.
- The dark code blocks (`#0f0d2e`) on the spec page and landing page standard section create strong contrast for readability.

**Issues**:
- **P2**: The accent green (`#10b981`) on the dark indigo background in the popup header and landing page hero may not meet WCAG AA contrast for small text. Verified: #10b981 on #1e1b4b = contrast ratio ~3.2:1, which fails AA for normal text (requires 4.5:1). The hero CTA button text is white on green, which passes. But the green "hero pills" text needs checking.
- **P3**: The red state color (`#ef4444`) for rejected categories and error states is standard but could be softened for the popup to avoid alarming users when categories are rejected BY THEIR OWN CHOICE. Consider using a neutral gray for "rejected by user preference" and red only for "error."

### 3.2 Typography

**Strengths**:
- Consistent use of Inter (or system font fallback) at appropriate sizes. The popup uses 12-15px range, options page 12-16px, landing page 14-44px. All readable.
- Monospace font (Fira Code) for code blocks is a good choice.

**Issues**:
- **P3**: The popup uses 6 different font sizes (12px, 13px, 14px, 15px, plus uppercase 12px labels). This is too many for a 350px-wide surface. Consolidate to 3 sizes: 12px (meta/labels), 14px (body), 15px (status text).
- **P3**: Landing page section titles are 32px bold, which is appropriate, but the body text at 15px creates a large size jump. An 18px lead paragraph bridging the gap would improve visual hierarchy.

### 3.3 Spacing and Layout

**Strengths**:
- The popup uses consistent 14-16px padding throughout sections. Card-based layout in the options page is clean with 24px internal padding and 20px gaps.
- The landing page uses a generous 72px section padding, giving content room to breathe.

**Issues**:
- **P2**: The popup categories section uses 4px vertical padding per row, making the list feel cramped. The 18x18px category icons are small enough that misclicking on mobile (if ever ported) or with accessibility needs is a concern. Increase row padding to 8px.
- **P3**: The options page toggle rows use inconsistent patterns: some have description text below them (Advanced tab), some do not (Preferences tab). Standardize: all toggles should optionally support a description line.

### 3.4 Responsive Design

**Strengths**:
- The landing page has a `@media (max-width: 768px)` breakpoint that collapses grids to single column. Correct.
- The spec page hides the sidebar on mobile.

**Issues**:
- **P2**: The extension popup (350px wide) has no responsive behavior, which is correct for a Chrome extension popup. However, if the popup content ever exceeds the viewport height (many categories, long domain names), there is no scroll container. Add `overflow-y: auto; max-height: 500px` to the popup body.
- **P2**: The options page has `max-width: 720px` for content but the tab bar stretches full width with no max-width constraint. On very wide screens, the tabs will be far left while content is centered. Wrap both in the same max-width container.
- **P1**: The landing page nav links do not collapse on mobile. The `nav-links` flex container will overflow or wrap awkwardly on screens under 480px. Needs a hamburger menu for mobile.

### 3.5 Accessibility

**Issues**:
- **P1**: The popup status dots use color alone (green/yellow/red/gray) to convey state. The PLAN.md explicitly mentions this concern but the mockup does not address it. Add text labels or shape differentiation (checkmark for handled, exclamation for attention, X for error, dash for none).
- **P1**: The options page toggle switches use a custom CSS-only implementation. While visually clean, they lack `aria-checked` state, `role="switch"`, and visible focus indicators. Screen readers will announce them as generic checkboxes without clear on/off state.
- **P2**: The popup "gear" button has no visible label. The `title="Settings"` attribute is not announced by all screen readers. Add `aria-label="Open settings"`.
- **P2**: The info expand/collapse buttons ("i") in the options page have no `aria-expanded` state and no `aria-controls` reference. Screen reader users cannot determine which content the button controls or whether it is expanded.
- **P2**: Color contrast issue with `.domain` text (13px, `#6b7280` on `#ffffff` = 4.6:1). Passes AA for normal text by a thin margin but fails AAA. Consider darkening to `#4b5563` for comfortable readability.
- **P3**: The landing page hero pills use SVG icons with no `aria-hidden="true"` or alt text. Decorative icons should be explicitly hidden from screen readers.

---

## 4. Interaction Design

### 4.1 What Is Interactive (Good)

- Profile dropdown in popup with immediate effect
- Category toggles in options with bidirectional profile sync (toggle changes profile to "Custom", profile changes toggles)
- Tab navigation in options page
- State switcher in popup mockup (for demo purposes)
- CMP example tabs in spec page
- Copy buttons on code blocks

### 4.2 Missing Feedback States

- **P1**: No loading/pending state in the popup. Between page load and CMP detection, what does the user see? Currently, the popup would show the last state or a blank. Add a "Scanning..." state with a subtle spinner.
- **P2**: No success feedback when changing the profile dropdown. When a user switches from "Balanced" to "Privacy Maximum," the toggles update but there is no confirmation. Add a brief "Preferences updated" toast or inline confirmation.
- **P2**: No undo capability for profile changes. If a user accidentally switches to "Accept All," there is no way to revert without remembering the previous state.
- **P3**: The "Report this site" and "Report issue" buttons in the attention/error states have no follow-up. What happens after reporting? A confirmation message is needed.

### 4.3 Error Handling UX

- **P2**: The error state shows "The OneTrust API returned an unexpected error" but does not offer guidance beyond "Retry" and "Report issue." Consider adding: "You can handle this popup manually by clicking the cookie banner on the page."
- **P3**: No offline/network error handling visible. If the well-known file fetch fails, there is no user-visible indication.

### 4.4 Missing: Onboarding Flow

Already covered in section 1a. This is the highest-priority missing interaction.

### 4.5 Missing: First-Run Experience in Popup

The first time a user clicks the extension icon after install, the popup should acknowledge this is their first time and guide them to set preferences, rather than showing a potentially confusing "No popup detected" state.

---

## 5. Design System Assessment

### 5.1 Consistency

**Strengths**:
- CSS custom properties (`:root` variables) are used consistently across all mockups.
- The color palette, border radius, font family, and shadow values are shared.
- The mockup navigation bar is identical across all 5 pages, providing visual continuity.

**Issues**:
- **P2**: Variable names are not fully consistent across mockups. The popup uses `--yellow: #f59e0b` while the landing page does not define it. The spec page adds `--code-bg: #0f0d2e` and `--mono` which other pages do not have. These need to be consolidated into a single design token file.
- **P2**: Button styles are defined differently across surfaces. The popup uses `.btn-primary` and `.btn-outline`, the landing page uses `.btn-accent`, `.btn-outline`, `.btn-white`, and the options page uses `.btn-add` and `.btn-sm`. These should be unified into a consistent button system.
- **P3**: The shield icon SVG is defined slightly differently across mockups (different stroke-width, different path data). Standardize into a single SVG component.

### 5.2 Component Reuse Opportunities

Components that should be extracted into a shared design system:

1. **StatusDot/StatusIndicator** -- the colored dot + text pattern (used in popup status, options stats)
2. **Toggle/Switch** -- the custom toggle component (used in popup profile, options preferences, options advanced)
3. **CategoryRow** -- the icon + label + badge pattern (used in popup categories, options preferences)
4. **CodeBlock** -- the header + copy button + pre pattern (used in landing page, spec page)
5. **Card** -- the white rounded container (used in options page, landing page, index page)
6. **Button** -- primary/outline/ghost variants (used everywhere)
7. **BarChart** -- the horizontal bar visualization (used in options statistics)
8. **Tab** -- the tab navigation pattern (used in options page, spec page examples)

### 5.3 Suggested Design Token Organization

```
tokens/
  colors.css        -- primary, accent, semantic (success/warning/error/info), grays
  typography.css    -- font families, size scale (xs/sm/md/lg/xl/2xl), weights
  spacing.css       -- 4px base unit scale (4/8/12/16/20/24/32/40/48/64/72/80)
  borders.css       -- radius scale, border colors, border widths
  shadows.css       -- elevation levels (sm/md/lg)
  animations.css    -- durations, easing functions
```

---

## 6. Competitive Design Analysis

### 6.1 vs. Consent-O-Matic

Consent-O-Matic's popup is minimal (just a list of rules and an on/off toggle). **What they do better**: extreme simplicity. Their popup is 3 items. Ours has 5 states with multiple sections each.

**What we do better**: our popup is far more informative (shows CMP name, method, per-category breakdown). Consent-O-Matic gives zero feedback about what happened.

**Steal**: Their "it just works" simplicity should inform our default/zero-UI mode for privacy-indifferent users.

### 6.2 vs. Super Agent (Gartner/OneTrust)

Super Agent has a clean, corporate-polished UI with a blue/white scheme. **What they do better**: their preference center has a "privacy score" visualization that gamifies the experience. They also have a consent dashboard showing historical data per site.

**What we do better**: our open standard approach is a fundamentally different value proposition. Their design is locked to the OneTrust ecosystem.

**Steal**: The privacy score / privacy meter concept. A visual indicator showing "how private your browsing is" based on consent patterns would add emotional engagement.

### 6.3 vs. OneTrust Admin (CMP vendor perspective)

OneTrust's admin dashboard is enterprise-grade with complex configuration forms. **What they do better**: category management with cookie-level granularity, multi-language preview, and compliance templates.

**What we do better**: our CMP plugin (E003) targets the opposite end -- dead-simple 3-line configuration. This is a strength, not a weakness.

**Steal**: Their preview feature. Website owners implementing our CMP should be able to preview the banner before deploying it.

### 6.4 vs. uBlock Origin

Not a direct competitor, but the most popular extension for dealing with web annoyances. **What they do better**: the badge shows a count of blocked elements, providing constant passive value reinforcement.

**Steal**: The popup counter concept. Showing "1,247 popups handled" in the badge or popup header provides ongoing proof of value. This is already in the statistics tab but should be surfaced more prominently.

---

## 7. Specific Issues and Fixes

| # | Issue | Why It Matters | Fix | Priority |
|---|-------|---------------|-----|----------|
| 1 | No onboarding flow after install | Users do not configure the extension, leading to low activation | Create a 3-step onboarding tab (see 1a) | P1 |
| 2 | No validator/generator tool mockup | Website owners have no conversion funnel | Design the validator page with URL input + auto-detect + download | P1 |
| 3 | Landing page nav has no mobile hamburger | Nav overflows on small screens, broken mobile experience | Add responsive nav with hamburger menu | P1 |
| 4 | Status dots use color only | Fails WCAG, inaccessible to colorblind users | Add shape/icon differentiation per state | P1 |
| 5 | Toggle switches lack ARIA attributes | Screen reader users cannot operate the primary controls | Add `role="switch"`, `aria-checked`, focus styles | P1 |
| 6 | No loading/scanning state in popup | Users see stale state while detection is running | Add "Scanning..." state with spinner | P1 |
| 7 | Green accent on dark indigo fails contrast | Text readability issue for low-vision users | Lighten green to `#34d399` or increase font weight | P2 |
| 8 | Category rows in popup are cramped (4px padding) | Difficult to read, poor touch target size | Increase to 8px vertical padding | P2 |
| 9 | Button styles inconsistent across pages | No design system coherence | Unify into 4 button variants (primary/accent/outline/ghost) | P2 |
| 10 | Options page tab bar not width-constrained | Visual misalignment on wide screens | Wrap in same max-width container as content | P2 |
| 11 | Spec page sidebar vanishes on mobile with no replacement | Mobile users lose all navigation | Add hamburger or bottom-sheet TOC | P2 |
| 12 | No "first run" state in popup | New users see confusing "No popup detected" state | Detect first run, show welcome message with link to settings | P2 |
| 13 | No success feedback on profile change | Users uncertain if change took effect | Brief inline "Saved" confirmation | P2 |
| 14 | Hero secondary CTA targets wrong audience | "View the Standard" is for developers, not end users scrolling | Change to "See how it works" (anchor to demo section) | P2 |
| 15 | Landing page shows JSON code block to general audience | Alienates non-technical visitors | Replace with visual diagram for general section, link to spec for devs | P2 |
| 16 | `categorySelectors` missing from spec field reference table | Documentation gap confuses implementers | Add the field to the table | P2 |
| 17 | Popup action links lack visual affordance | Look like plain text, not clickable actions | Add chevron icon or underline style | P3 |
| 18 | 6 font sizes in 350px popup | Too many sizes for the viewport, visual noise | Consolidate to 3 sizes | P3 |
| 19 | Shield SVG inconsistent across mockups | Minor visual discrepancy | Standardize SVG path and attributes | P3 |
| 20 | Stats bar uses aspirational numbers | Misleading for early-stage product | Design an early-stage variant | P3 |

---

## 8. Design Recommendations (Top 10, Prioritized)

### 1. Design and build the onboarding flow (P1)
The extension needs a post-install experience. Three screens: privacy preference slider, confirmation of what it means, and "you're set." This is the highest-impact design work remaining.

### 2. Create the validator/generator tool mockup (P1)
This is the missing conversion funnel for website owners. A single-page tool that accepts a URL, auto-detects the CMP, generates the JSON file, and validates it. Without this, the "For Website Owners" story has no payoff.

### 3. Fix accessibility fundamentals (P1)
Status indicators need shape differentiation. Toggle switches need ARIA attributes. Gear button needs aria-label. These are baseline requirements, not enhancements.

### 4. Add a loading/scanning state to the popup (P1)
Between page load and CMP detection, the popup needs a "working on it" state. Without this, users opening the popup during the detection window see stale or confusing information.

### 5. Make the landing page mobile-ready (P1)
The navigation needs a hamburger menu. The hero text needs tighter sizing. The grid sections already collapse correctly, but the nav is broken on mobile.

### 6. Introduce a "popup counter" as persistent value reinforcement (P2)
Surface the "popups handled" count in the popup header or badge. This provides constant proof of value, drives word-of-mouth, and follows the uBlock Origin pattern that users already understand.

### 7. Build a shared design token file (P2)
Consolidate all CSS custom properties into a single source. Currently, each mockup defines its own subset with slight inconsistencies. This will become critical when moving from mockups to production components.

### 8. Simplify the landing page standard section for general audiences (P2)
Replace the JSON code block with a visual diagram for the scrolling audience. The code block belongs on the spec page, not the landing page where most visitors are end users.

### 9. Add a "Scanning..." / "Working..." animation to the badge icon (P2)
When the content script is actively detecting a CMP, the badge icon could show a subtle animation (pulse, spinner). This reassures users the extension is active without requiring them to open the popup.

### 10. Design a CMP banner preview tool for E003 (P2)
Website owners implementing the CMP plugin should be able to preview their banner configuration before deploying. A live preview that updates as they modify the config JSON would significantly reduce implementation friction.

### Missing UI Components Needed

1. **Onboarding wizard** (3-step post-install flow)
2. **Validator/generator page** (URL input, auto-detect, JSON output, download)
3. **Loading/scanning popup state** (spinner, "Checking this page..." text)
4. **First-run popup state** (welcome message, "Set your preferences" CTA)
5. **Toast/notification component** (for "Preferences saved", "Consent reported", etc.)
6. **Mobile navigation** (hamburger menu for landing page and spec page)
7. **Search/filter for site overrides** (for when the list grows beyond 10 entries)
8. **CMP banner preview** (live preview for E003 plugin configuration)
9. **Privacy score meter** (visual indicator of current privacy posture)
10. **Empty state for statistics** (what new users see before handling any popups)

### Suggested Design System Tokens

```css
/* Spacing scale (4px base) */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-5: 20px;  --space-6: 24px;
--space-8: 32px;  --space-10: 40px; --space-12: 48px;
--space-16: 64px; --space-18: 72px; --space-20: 80px;

/* Type scale */
--text-xs: 10px;  --text-sm: 12px;  --text-base: 14px;
--text-lg: 16px;  --text-xl: 18px;  --text-2xl: 22px;
--text-3xl: 28px; --text-4xl: 36px; --text-5xl: 44px;

/* Font weights */
--font-normal: 400; --font-medium: 500;
--font-semibold: 600; --font-bold: 700; --font-extrabold: 800;

/* Border radius */
--radius-sm: 4px; --radius-md: 6px; --radius-lg: 8px;
--radius-xl: 12px; --radius-2xl: 16px; --radius-full: 9999px;

/* Shadows (elevation) */
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
--shadow-md: 0 4px 12px rgba(0,0,0,0.1);
--shadow-lg: 0 4px 24px rgba(0,0,0,0.12);
--shadow-xl: 0 8px 32px rgba(0,0,0,0.16);

/* Transitions */
--duration-fast: 150ms; --duration-normal: 200ms; --duration-slow: 300ms;
--ease-default: ease; --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Colors - semantic */
--color-success: #10b981;  --color-warning: #f59e0b;
--color-error: #ef4444;    --color-info: #3b82f6;
--color-success-bg: #d1fae5; --color-warning-bg: #fef3c7;
--color-error-bg: #fee2e2;   --color-info-bg: #dbeafe;
```

---

## Summary

The NoCookie design is strong in its core surfaces (popup states, options page structure, spec documentation, landing page narrative). The visual language is cohesive and distinctive. The information architecture makes sense for its multiple audiences.

The critical gaps are:
1. **No onboarding** -- the most important UX flow is missing entirely
2. **No validator/generator tool** -- the adoption funnel for website owners has no endpoint
3. **Accessibility basics** -- color-only status indicators and unlabeled ARIA controls need fixing before launch
4. **No loading states** -- the extension gives no real-time feedback during CMP detection
5. **Mobile navigation** -- the landing page breaks on small screens

Addressing the P1 items above would bring the design from "good mockups" to "launch-ready product design." The P2 items refine the experience for retention and growth.
