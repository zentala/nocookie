# Cookies Accepter

## Who is the target user?
- **End users**: people tired of cookie popups who want to set preferences once
- **Website owners**: developers who want to make their cookie consent machine-readable
- **AI agents**: automated tools that implement the standard on websites

## What is the purpose of this project?
An open standard + Chrome extension for automatic cookie consent management. Users configure their preferences once, and the extension handles cookie popups everywhere — respecting GDPR intent while eliminating friction.

## Project Type
Monorepo with:
- Chrome extension (TypeScript)
- Website (static, Cloudflare Pages)
- Open standard specification

## Tech Stack
- TypeScript
- pnpm (monorepo with workspaces)
- Chrome Extensions Manifest V3
- Cloudflare Pages (website)

## Conventions
- All code and docs in English
- Conventional Commits
- Each file ≤ 250 lines, each function ≤ 50 lines
