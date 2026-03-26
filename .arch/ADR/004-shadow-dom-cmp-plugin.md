# ADR 004: Shadow DOM for CMP plugin UI isolation

- **Status**: accepted
- **Date**: 2026-03-24
- **Epic**: E003

- **Context**: The NoCookie CMP plugin (E003) renders consent UI (banner, preference center modal, cookie policy section) on third-party websites. The plugin's CSS must not interfere with the host page's styles, and the host page's CSS must not break the plugin's layout. This is a well-known problem for any widget injected into arbitrary websites — CSS has global scope by default, and specificity conflicts are inevitable.

- **Decision**: Render all CMP plugin UI elements inside Shadow DOM containers. Each major UI component (banner, preference center, cookie policy embed) gets its own shadow root attached to a minimal host element. Plugin styles are scoped within the shadow boundary. The plugin uses `open` mode shadow roots to allow the extension to detect and interact with the CMP via `shadowRoot` property access.

- **Alternatives**:
  - **Regular DOM with high-specificity CSS**: Inject UI directly into the page DOM, using highly specific selectors (e.g., `#nocookie-banner .ca-btn`) and `!important` overrides. Rejected because: no amount of specificity can prevent all conflicts on arbitrary host pages. CSS custom properties, inherited styles (font-family, color, line-height), and `* { }` selectors on the host page leak through. This is the approach most CMPs use and it is a constant source of visual bugs.
  - **iframe isolation**: Render UI inside a same-origin or srcdoc iframe. Rejected because: iframes create cross-origin issues for consent storage (cookies set inside an iframe may be third-party cookies, which browsers increasingly block). Iframes also cause accessibility problems (screen readers handle iframe boundaries inconsistently), break keyboard focus management, and make responsive sizing difficult (iframe height must be communicated via postMessage).
  - **CSS-in-JS with unique class names**: Generate unique class names (like CSS Modules or styled-components) to avoid collisions. Rejected because: protects our styles from the host but does not protect us from the host's styles (inherited properties still leak in). Also adds runtime overhead and bundle size.

- **Consequences**:
  - Complete style isolation: host page CSS cannot affect plugin UI, plugin CSS cannot affect host page.
  - Inherited CSS properties (font-family, color, line-height) must be explicitly reset at the shadow root level using `all: initial` or a CSS reset within the shadow tree.
  - Slightly more complex DOM manipulation: `querySelector` does not pierce shadow boundaries by default. The extension must use `element.shadowRoot.querySelector()` to interact with plugin elements.
  - Event retargeting: events from inside the shadow DOM are retargeted when they cross the shadow boundary. Event listeners on the host page see the shadow host as the event target, not the internal element. This is desirable for encapsulation.
  - `open` mode allows the Chrome extension to detect and interact with our CMP — the extension checks for our shadow host element and accesses its `shadowRoot` for the fastest possible handshake (target: under 100ms).
  - Bundle size impact: minimal — Shadow DOM is a browser-native API, no polyfill needed for modern browsers.
