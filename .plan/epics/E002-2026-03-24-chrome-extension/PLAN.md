---
id: E002
title: Chrome Extension — Auto Cookie Consent
status: planned
created: 2026-03-24
depends_on: E001
---

# E002: Chrome Extension

## Goal
Build a Chrome extension (Manifest V3) that automatically handles cookie consent popups based on user-configured preferences.

## Scope (preliminary — will be refined after E001 research)
- Extension popup UI for configuring preferences
- Cookie category selector (essential, functional, analytics, marketing, social)
- Auto-detection of cookie consent popups
- Auto-click based on preferences
- Support for top CMPs out-of-the-box
- Status indicator on visited pages

## Depends On
E001 research results — especially:
- CMP DOM patterns (for detection)
- Cookie category taxonomy (for preference UI)
- Competitive gaps (for differentiation)

## Acceptance Criteria
- [ ] Extension installs in Chrome
- [ ] User can configure cookie preferences
- [ ] Auto-detects and handles popups on top 5 CMPs
- [ ] Shows what was accepted/rejected
- [ ] Works on popular websites (test list TBD after E001)
