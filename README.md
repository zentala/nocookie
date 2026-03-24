# Cookies Accepter

An open standard and Chrome extension that automatically manages cookie consent on websites — based on your personal preferences.

## The Problem

The EU gave users the right to decide about their privacy. But in practice, cookie popups are just annoying interruptions. Users click "Accept All" just to get rid of them — defeating the purpose of GDPR consent.

## The Solution

**Cookies Accepter** lets you decide *once* what your cookie preferences are, then automatically applies them everywhere:

- **Chrome Extension** — automatically handles cookie consent popups based on your configured preferences
- **Open Standard** — a set of HTML metadata tags that website owners can implement to make cookie consent machine-readable
- **Website** — documentation, implementation guides, and the standard specification
- **AI Agent Instructions** — a public file that AI agents can read to implement the standard on any website

## How It Works

1. You configure your cookie preferences once (e.g., "essential only", "accept all", or a custom mix)
2. The extension detects cookie consent popups on websites
3. It automatically clicks the right buttons based on your preferences
4. Works out-of-the-box with popular consent management platforms (CookieBot, OneTrust, etc.)
5. Website owners can adopt the open standard for perfect compatibility

## Cookie Categories

The standard supports common consent categories:
- **Essential** — required for the site to function
- **Functional** — remember preferences, language, region
- **Analytics** — anonymous usage statistics
- **Marketing** — personalized ads, tracking across sites
- **Social Media** — social sharing, embedded content

## Project Structure

This is a monorepo containing:
- `extension/` — Chrome extension
- `website/` — project website and documentation
- `standard/` — the open standard specification

## Status

Early development — research phase.

## License

MIT
