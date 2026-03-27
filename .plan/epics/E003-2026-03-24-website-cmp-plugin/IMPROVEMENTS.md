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

## 2026-03-27 — Wave 4 (T13-T16, T20-T21)

### T13: i18n
- 16 languages in 4 translation files — large payload if all loaded at once, consider lazy loading
- Translation quality for non-major languages (FI, RO, HU, EL) may be lower — needs native review
- `FullTranslations` extends `TranslationStrings` but adds incompatible fields — type widening issue
- No plural form support — some languages need singular/plural variants
- RTL support is just a placeholder comment — no actual implementation for Arabic/Hebrew

### T14: Accessibility
- Accept button contrast (#16a34a on white) is 3.05:1 — passes only as "large text" (bold 14px+), not standard text
- AccessibilityManager event-to-announcement mapping is hardcoded — not configurable
- No automated axe-core tests (plan mentioned it) — only manual CSS/ARIA verification
- Screen reader testing with NVDA/JAWS not feasible in CI — documented but untested

### T15: CDN & npm Publishing
- `tsc --emitDeclarationOnly` fails when i18n module imports aren't complete — build chain fragile
- SRI hashes regenerate on every build — should be pinned for specific releases
- No actual CDN deployment configured — just URL patterns documented
- CHANGELOG is manually maintained — consider conventional-changelog automation
- Source map files are generated but `files` in package.json doesn't explicitly include them

### T16: E2E Tests
- E2E tests use jsdom + manual component orchestration, NOT real Playwright browser tests
- No actual `NoCookieCMP.init()` integration — components manually wired in test helpers
- Missing: cross-browser testing, real screenshot comparison, network interception
- E2E helper duplicates what will be the real `init()` logic — coupling risk
- 50 E2E tests run fast (~300ms) but don't test real browser rendering

### T20: Badge Kit
- SVG generation duplicated between `icons.ts` and `generate-badge-kit.mjs` — DRY violation
- Badge kit is gitignored — needs CI to regenerate on release
- No SVGO optimization applied — raw SVGs may have unnecessary whitespace
- No automated test that badge-kit script produces valid SVGs (only existence check)

### T21: Description i18n
- Translation files are per-language (~200 lines each) — manageable but adds to bundle
- Cookie purpose translations only cover top 10 cookies (not all 20 in EN database)
- No mechanism for community translations — need contribution workflow
- Fallback chain is language-level only — no regional fallback (pt-BR → pt → en)

## 2026-03-27 — Wave 5 (T17-T18, T22)

### T17: Documentation
- README documents the intended public API but `NoCookieCMP.init()` doesn't fully orchestrate all components yet
- Example HTML files reference CDN URLs that don't exist yet (cdn.nocookie.zentala.io)
- No live demo page on the website — examples are standalone HTML files
- API reference is in README rather than separate generated docs (TSDoc → HTML)

### T18: Extension Integration
- Extension sends `postMessage` to `*` origin — same concern as CMP side
- `cmp-names.ts` centralizes CMP data but it's manually maintained — could be auto-generated
- NoCookie CMP detection is first in priority order — may cause issues if other CMPs also present
- No integration test that runs both CMP and extension together

### T22: Configurator
- Mock banner preview doesn't use actual CMP library — HTML/CSS is duplicated
- No cookie detail editor per category — deferred to future version
- No pre-built templates — deferred
- No URL hash state sharing — deferred
- No policy page preview — only banner preview
- Configurator client script is vanilla TS — could benefit from a reactive framework for form state

## Cross-Cutting Issues (Entire Epic)

### HIGH PRIORITY — Must fix before v1.0
1. **No `NoCookieCMP.init()` orchestration** — individual components work but the top-level init() that creates ThemeEngine + Banner + PreferenceCenter + etc. is still a placeholder. This is the #1 blocker for real usage.
2. **No real Playwright E2E tests** — "E2E" tests use jsdom, not real browsers. Need actual browser tests.
3. **Consent state ↔ Event bus not wired** — ConsentStateManager doesn't emit events on state changes. Manual emit() calls needed.
4. **Banner doesn't integrate real icons** — uses colored dots, not the SVG icons from T08.
5. **`tsc --emitDeclarationOnly` build step fragile** — depends on all imports resolving correctly.

### MEDIUM PRIORITY — Should fix for v1.0
6. **SVG generation duplicated** — icons.ts and generate-badge-kit.mjs have the same SVG paths.
7. **Accept button color contrast** — #16a34a on white is 3.05:1, needs darker green for AA compliance.
8. **Extension bridge test file exceeds 250 lines** (314 lines).
9. **Cookie descriptions not wired into banner/preference center** — descriptions module exists but isn't used by UI components yet.
10. **i18n not wired into components** — translations exist but banner/preference center still use config.translations directly.

### LOW PRIORITY — Nice to have
11. EventBus needs `once()` method for one-time listeners.
12. Lazy loading for translations (16 languages = large bundle).
13. CDN deployment pipeline not configured.
14. npm publishing pipeline not configured.
15. Community translation contribution workflow needed.
16. Configurator could use actual CMP library for preview instead of mock HTML.
