# Changelog

All notable changes to `@nocookie/cmp` will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-27

### Added

- Cookie consent banner with Shadow DOM isolation
- Preference center modal with per-category toggles
- Cookie policy page generator
- Well-known JSON generator (`/.well-known/cookie-consent.json`)
- Extension bridge for NoCookie Chrome extension handshake
- GPC (Global Privacy Control) signal detection
- Cookie policy icon system (5 category icons, privacy badges, compliance badges)
- Theme engine with light/dark/auto modes
- Standardized cookie practice descriptions for 5 categories
- Common cookie database (20+ well-known third-party cookies)
- UMD bundle with global `NoCookieCMP` for CDN usage
- ESM bundle for modern bundlers
- Extracted CSS with Shadow DOM encapsulation
- SRI hash generation for CDN integrity verification
