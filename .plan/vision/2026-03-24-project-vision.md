# Cookies Accepter — Project Vision

## Mission
Give users real control over cookie consent — the way the EU intended — without the friction of clicking through popups on every website.

## Core Idea
1. **User sets preferences once** — "I accept essential + analytics, reject marketing"
2. **Extension enforces automatically** — detects popups, clicks the right options
3. **Open standard makes it reliable** — website owners tag their consent UI for machine readability
4. **AI agents can implement the standard** — public spec file like robots.txt / llms.txt

## Deliverables (ordered by priority)

### Phase 1: Research (E001)
- Competitive landscape — what extensions exist, what do they do, what's missing
- Cookie categories — GDPR standards, common taxonomies, what CMPs use
- CMP analysis — DOM patterns of top consent platforms (CookieBot, OneTrust, etc.)
- Output: research report informing E002 design

### Phase 2: Chrome Extension (E002)
- Manifest V3 Chrome extension
- Preference configuration UI (popup/options page)
- Auto-detection of cookie popups (heuristic + known CMP patterns)
- Auto-click based on user preferences
- Status indicator showing what was accepted/rejected

### Phase 3: Open Standard
- Specification for HTML metadata tags describing cookie consent UI
- Cookie category taxonomy
- Button/action labeling convention
- Versioned specification document

### Phase 4: Website
- Cloudflare Pages site
- Standard documentation
- Implementation guide for website owners
- Extension download/install page
- AI agent instruction file at well-known URL (e.g., /.well-known/cookie-consent.json)

### Phase 5: Ecosystem
- Built-in support for top 10+ CMPs
- AI-readable spec file (like llms.txt) for automated implementation
- Community-contributed patterns
- Firefox/Safari ports

## Principles
- **User-first** — the user's preference is law
- **Open standard** — anyone can implement, no vendor lock-in
- **Progressive enhancement** — works with heuristics, better with standard tags
- **Transparency** — always show what was accepted/rejected
