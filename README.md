# Cookies Accepter

An open standard, Chrome extension, and CMP plugin that automatically manages cookie consent on websites — based on your personal preferences.

## The Problem

The EU gave users the right to decide about their privacy. But in practice, cookie popups are just annoying interruptions. Users click "Accept All" just to get rid of them — defeating the purpose of GDPR consent.

## The Solution

**Cookies Accepter** lets you decide *once* what your cookie preferences are, then automatically applies them everywhere:

- **Chrome Extension** — automatically handles cookie consent popups based on your configured preferences, with a consent dashboard showing what was accepted/rejected across all sites
- **Open Standard** — a `/.well-known/cookie-consent.json` file that website owners can serve to make cookie consent machine-readable
- **CMP Plugin** — a free, open-source Consent Management Platform widget for website owners, natively integrated with the extension
- **Website** — documentation, implementation guides, standard specification, and a visual configurator tool
- **AI Agent Instructions** — a public file that AI agents can read to implement the standard on any website

## How It Works

1. You configure your cookie preferences once (e.g., "essential only", "accept all", or a custom mix)
2. The extension detects cookie consent popups using a 6-layer detection engine
3. It automatically applies your preferences via CMP APIs, click simulation, or autoconsent
4. Works out-of-the-box with 100+ consent management platforms via autoconsent integration
5. Website owners can adopt the open standard or install our CMP plugin for seamless compatibility

## Cookie Categories

The standard supports common consent categories:
- **Essential** — required for the site to function
- **Functional** — remember preferences, language, region
- **Analytics** — anonymous usage statistics
- **Marketing** — personalized ads, tracking across sites
- **Social Media** — social sharing, embedded content

## Project Structure

This is a monorepo containing:
- `extension/` — Chrome extension (Manifest V3, TypeScript)
- `cmp-plugin/` — open-source CMP widget for website owners (`@cookies-accepter/cmp`)
- `website/` — project website and documentation (Astro, Cloudflare Pages)
- `standard/` — the open standard specification (`/.well-known/cookie-consent.json`)

## Status

Research complete. Full design complete for Chrome extension (31 tasks, 7 waves) and CMP plugin (22 tasks, 5 waves). Ready for implementation.

## License

MIT
