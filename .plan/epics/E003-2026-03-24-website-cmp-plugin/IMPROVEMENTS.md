# E003 Improvements

## 2026-03-26 — Wave 1 (T01-T04)

### T01: Scaffolding
- `vite-plugin-dts` was added to devDependencies but unused (removed in follow-up commit)
- PostCSS config uses `.cjs` extension — consider aligning with ESM (`postcss.config.ts` or inline in vite.config.ts)
- `src/index.ts` placeholder types were basic — replaced properly in T02

### T02: Types & Config
- `ConsentState` is typed as `{ [categoryId: string]: boolean }` — loose index signature, could be `Record<CategoryId, boolean>` for stricter typing
- JSON Schema (`config-schema.json`) should be validated against actual configs in tests
- No runtime validation for color hex strings in ThemeConfig — accepts any string

### T03: Consent State
- Tests use `cookieSecure: false` because jsdom rejects Secure cookies on non-HTTPS — production behavior for Secure flag not directly tested
- Cookie domain auto-detection relies on `window.location.hostname` — no SSR fallback
- No event emission on consent changes yet (will be wired in later integration task)

### T04: Event Bus
- No `once()` method — might be needed for extension handshake (one-time detection)
- Wildcard handler type is `any` — could be more strictly typed with overloads
- No max listener count / leak detection warning

## 2026-03-27 — Wave 2 (T05-T08, T19)

### T05: Theme Engine
- `darkenColor()` helper is a simple string manipulation — no proper color space conversion
- Auto theme uses `matchMedia('prefers-color-scheme: dark')` — no cleanup on theme change (only on destroy)
- CSS is built as string concatenation — no minification, could benefit from a CSS template literal approach
- Position styles use fixed 16px offset — not configurable

### T06: Banner UI
- Banner CSS uses `?raw` import for Shadow DOM injection — adds Vite-specific coupling
- `learnMore` text is hardcoded because `TranslationStrings` doesn't have a dedicated field for it
- Category icon dots are just colored circles (placeholders) — T08 icons not yet integrated into banner
- No animation for banner exit — only entrance animation applied
- `vite-env.d.ts` was created for `?raw` imports — should be in a shared location

### T07: Preference Center
- Split into two files (`preference-center.ts` + `preference-center-dom.ts`) to stay under 250 lines — good separation but unusual pattern
- Focus trap implementation is basic — doesn't handle dynamically added focusable elements
- Re-entrancy guard needed (`isOpen` flag) to prevent infinite recursion with EventBus
- No transition animation between banner close and preference center open
- Cookie table doesn't show cookie `type` (first-party/third-party) column

### T08: Icon System
- SVG paths are hardcoded strings — no external SVG files, makes editing harder
- Sprite sheet uses `<symbol>` but no `<use>` references are wired up in other components yet
- Privacy level badges don't account for custom categories (only standard 5)
- No dark mode variant logic in icon renderer — relies on CSS only

### T19: Cookie Descriptions
- `descriptionPreset` field not added to `CategoryConfig` type — kept as loose parameter instead
- Only 20 common cookies in database — expandable but limited
- No validation that `DescriptionPreset` value is valid (accepts any string, falls back to default)
- Short descriptions are all ~30 chars — could be even shorter for very narrow banners

## 2026-03-27 — Wave 3 (T09-T12)

### T09: Policy Page Generator
- Policy page HTML is generated as string — no DOM diffing, re-render replaces entire content
- XSS escaping via `escapeHtml()` — good, but should verify all user inputs are escaped
- "Change my preferences" button requires NoCookieCMP to be available globally — not modular
- Standalone page generates full HTML with inline CSS — large output, no shared stylesheet
- No search/filter for sites with many cookies (plan mentioned it but it's a later optimization)
- Cookie type column defaults to "First-party" if not specified — may be inaccurate

### T10: Well-Known JSON Generator
- CMP homepage hardcoded to "https://nocookie.zentala.io" — should be configurable
- Version string hardcoded to "0.1.0" — should read from package.json or config
- `toJSON()` uses `JSON.stringify(null, 2)` — 2-space indent is good but not configurable
- Category selectors use `input[data-category-id="..."]` — must match actual DOM from preference center
- No validation against @nocookie/schema — could import and validate at build time

### T11: Extension Bridge
- 2-second ACK timeout may be too short for slow pages — should be configurable
- `window.__cookiesAccepterCMP` marker uses `any`-typed global — could use proper declaration merging
- Version compatibility only checks major version — minor version differences silently accepted
- `postMessage` sends to `*` origin — could be more restrictive but harder to configure
- Bridge test file is 314 lines — exceeds 250-line limit slightly

### T12: GPC Detection
- Only rejects marketing and social-media — some interpretations of GPC include analytics too
- `navigator.globalPrivacyControl` might not exist in TypeScript types — needs type assertion
- No re-detection on navigation (SPA) — assumes single check on init
- Doesn't modify banner text yet — just returns GPCResult for caller to use
