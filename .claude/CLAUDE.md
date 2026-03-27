# NoCookie

## Who is the target user?
- **End users**: people tired of cookie popups who want to set preferences once
- **Website owners**: developers who want to make their cookie consent machine-readable, or need a free open-source CMP
- **AI agents**: automated tools that implement the standard on websites

## What is the purpose of this project?
An open standard + Chrome extension + CMP plugin for automatic cookie consent management. Users configure their preferences once, and the extension handles cookie popups everywhere — respecting GDPR intent while eliminating friction. Website owners can install our CMP plugin for native extension integration, or adopt the open standard independently.

## Project Type
Monorepo with:
- Chrome extension (TypeScript, Manifest V3)
- CMP plugin (`@nocookie/cmp`, Shadow DOM, CDN + npm)
- Website (Astro, Cloudflare Pages)
- Open standard specification (`/.well-known/cookie-consent.json`)

## Tech Stack
- TypeScript (strict mode)
- pnpm (monorepo with workspaces)
- Chrome Extensions Manifest V3
- `@duckduckgo/autoconsent` (100+ CMP rules)
- Vite (extension + CMP plugin bundling)
- Astro (website)
- Cloudflare Pages (website hosting)
- GPC support (`Sec-GPC: 1` header emission)

## Packages

### `packages/cmp/` — `@nocookie/cmp`
Shadow DOM-based consent management plugin. Key modules:
- `src/core/` — config parser, consent state (cookie-based), event bus, CMP orchestrator
- `src/ui/` — banner, preference center, theme engine, icons, policy page, accessibility
- `src/integration/` — extension bridge (postMessage handshake), well-known JSON, GPC detection
- `src/shared/` — types, constants, descriptions, i18n (16 languages), icon data (JSON)
- Tests: `__tests__/` (unit, vitest), `e2e/` (integration, vitest+jsdom)
- Scripts: `scripts/generate-sri.mjs`, `scripts/generate-badge-kit.mjs`

### `packages/schema/` — `@nocookie/schema`
JSON Schema and validator for `/.well-known/cookie-consent.json`.

### `extension/` — Chrome Extension
Manifest V3 extension with autoconsent, GPC, native NoCookie CMP handshake.

### `website/` — Astro Website
Documentation site with configurator tool at `/configurator`.

## Conventions
- All code and docs in English
- Conventional Commits
- Each file ≤ 250 lines, each function ≤ 50 lines
