# ADR 003: Dual-world content script architecture (ISOLATED + MAIN)

- **Status**: accepted
- **Date**: 2026-03-24
- **Epic**: E002

- **Context**: The extension must both detect CMP presence on a page (by examining DOM elements) and execute consent actions (by calling CMP JavaScript APIs like `OneTrust.RejectAll()`, `Cookiebot.submitCustomConsent()`, or `__tcfapi`). Chrome Manifest V3 content scripts run in one of two worlds: ISOLATED (separate JS context, can read DOM but not page's `window`) or MAIN (page's JS context, full access to `window` but no extension APIs). We need a strategy that provides both DOM access for detection and `window` access for API execution without compromising security.

- **Decision**: Use a dual-world architecture:
  - **ISOLATED world** content script (`detector.ts`) handles CMP detection via DOM selectors, MutationObserver setup, and well-known file fetching. Communicates with the service worker via `chrome.runtime.sendMessage`.
  - **MAIN world** content script (`executor.ts`) is injected only when needed to call CMP JavaScript APIs (e.g., `window.OneTrust`, `window.Cookiebot`, `__tcfapi`). Also sets `navigator.globalPrivacyControl = true` for GPC.
  - Communication between the two worlds uses `window.postMessage` with a unique message prefix to avoid collisions.

- **Alternatives**:
  - **All MAIN world**: Run everything in the page's JavaScript context. Rejected because: MAIN world scripts have no access to extension APIs (`chrome.runtime`, `chrome.storage`), cannot communicate directly with the service worker, and are exposed to the page's JavaScript (a malicious page could detect or interfere with the extension). Security risk is unacceptable for a privacy tool.
  - **All ISOLATED world**: Run everything in the isolated context. Rejected because: ISOLATED world cannot access page JavaScript globals (`window.OneTrust`, `window.Cookiebot`, `__tcfapi`). These APIs are the most reliable way to interact with CMPs — API calls are preferred over click simulation (see ADR 002). Restricting ourselves to ISOLATED world forces reliance on fragile click simulation for all CMP interactions.
  - **Single MAIN world script with chrome.runtime workaround**: Inject a MAIN world script and relay messages to background via DOM events. Rejected because: adds complexity equivalent to the dual-world approach without the security benefits of ISOLATED detection.

- **Consequences**:
  - Secure detection: the ISOLATED world script cannot be tampered with by page JavaScript.
  - Full API access: the MAIN world script can call any CMP JavaScript API directly.
  - GPC property: `navigator.globalPrivacyControl` can only be set from MAIN world.
  - More complex message passing: ISOLATED-to-MAIN communication requires `window.postMessage`, ISOLATED-to-background uses `chrome.runtime.sendMessage`. Two communication channels to maintain.
  - MAIN world injection must be conditional (only when API execution is needed) to minimize the security surface.
  - Performance: two scripts load instead of one, but the MAIN world script is small and injected on-demand.
