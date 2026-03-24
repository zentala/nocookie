# Architecture — Cookies Accepter

## System Overview

Monorepo with three main components:

```
cookies-accepter/
├── extension/     → Chrome Extension (Manifest V3, TypeScript)
├── website/       → Project website (Cloudflare Pages)
├── standard/      → Open standard specification
└── packages/      → Shared code (if needed)
```

## Components

### 1. Chrome Extension
- Detects cookie consent popups on web pages
- Reads user-configured preferences
- Automatically clicks accept/reject/customize based on preferences
- Shows cookie status indicator on pages
- Works out-of-the-box with popular CMPs (Consent Management Platforms)

### 2. Open Standard
- HTML metadata tags for machine-readable cookie consent UI
- Cookie category taxonomy (essential, functional, analytics, marketing, social)
- Button/action labeling convention
- AI-readable specification file (similar to robots.txt / llms.txt)

### 3. Website
- Standard specification documentation
- Implementation guide for website owners
- Extension download links
- AI agent instruction file hosted at well-known URL

## Data Flow

```
User configures preferences (once)
        ↓
Extension loads on page visit
        ↓
Detects cookie popup (standard tags OR heuristic for known CMPs)
        ↓
Maps user preferences to available options
        ↓
Clicks appropriate buttons automatically
        ↓
Shows status indicator (what was accepted/rejected)
```

## Key Technical Decisions
- TBD (research phase — see E001)
