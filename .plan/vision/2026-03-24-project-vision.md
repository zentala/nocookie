# Cookies Accepter — Project Vision

## Mission
Give users real control over cookie consent — the way the EU intended — without the friction of clicking through popups on every website.

## Core Idea
1. **User sets preferences once** — "I accept essential + analytics, reject marketing"
2. **Extension enforces automatically** — detects popups, clicks the right options
3. **Open standard makes it reliable** — website owners serve `/.well-known/cookie-consent.json` for machine readability
4. **CMP plugin closes the loop** — free, open-source consent widget that integrates natively with the extension
5. **AI agents can implement the standard** — public spec file like robots.txt / llms.txt

## Deliverables (ordered by priority)

### Phase 1: Research (E001) — COMPLETE
- Competitive landscape — what extensions exist, what do they do, what's missing
- Cookie categories — GDPR standards, common taxonomies, what CMPs use
- CMP analysis — DOM patterns of top consent platforms (CookieBot, OneTrust, etc.)
- Output: 5 research reports informing E002 and E003 design

### Phase 2: Chrome Extension (E002) — DESIGNED, 31 tasks
- Manifest V3 Chrome extension with dual-world content scripts
- 6-layer CMP detection engine (well-known, JS API, DOM, scripts, autoconsent, heuristic)
- Preference configuration UI (popup/options page)
- Consent dashboard — per-domain history of what was accepted/rejected
- First-run onboarding wizard
- GPC header emission (`Sec-GPC: 1`) when marketing rejected
- Autoconsent integration for 100+ CMPs out of the box
- Cookie policy icons — standardized visual indicators for each category

### Phase 3: CMP Plugin (E003) — DESIGNED, 22 tasks
- Free, open-source CMP widget for website owners
- Shadow DOM isolation, three UI layers (banner, preference center, policy page)
- Native extension handshake — users with extension never see popup
- Auto-generates `/.well-known/cookie-consent.json` from config
- Standardized cookie practice descriptions (5 languages)
- Downloadable badge kit (SVG icons for categories, like Creative Commons)
- Visual configurator tool — web-based preview/generator for configuration

### Phase 4: Website
- Astro static site on Cloudflare Pages
- Standard specification documentation
- Implementation guide for website owners
- Extension download/install page
- Online validator for `/.well-known/cookie-consent.json`
- Visual configurator tool hosted here
- AI agent instruction file at well-known URL

### Phase 5: Open Standard Formalization
- Versioned specification for `/.well-known/cookie-consent.json`
- Cookie category taxonomy
- Button/action labeling convention
- Submission to relevant standards bodies

### Phase 6: Ecosystem
- Built-in support for top 10+ CMPs (native rules)
- AI-readable spec file (like llms.txt) for automated implementation
- Community-contributed CMP patterns database
- Firefox/Safari extension ports
- WordPress CMP plugin wrapper

## Principles
- **User-first** — the user's preference is law
- **Open standard** — anyone can implement, no vendor lock-in
- **Progressive enhancement** — works with heuristics, better with standard tags, best with our CMP
- **Transparency** — always show what was accepted/rejected (consent dashboard)
- **Privacy by default** — GPC support, reject-all as easy as accept-all
