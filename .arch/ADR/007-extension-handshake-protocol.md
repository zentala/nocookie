# ADR 007: Extension-CMP handshake via postMessage

- **Status**: accepted
- **Date**: 2026-03-27
- **Epic**: E003
- **Context**: The NoCookie Chrome extension needs to communicate user preferences to the NoCookie CMP plugin running on a website. The communication must work cross-origin (extension content script → page context), be fast (<100ms), and degrade gracefully if either side is absent.
- **Decision**: Use `window.postMessage` with a typed hello/ack protocol. The CMP sets a global marker (`window.__cookiesAccepterCMP`) and `data-ca-version` attribute on the root element. The extension detects these, sends `CA_EXTENSION_HELLO` with user preferences, and the CMP responds with `CA_EXTENSION_ACK` containing applied consent state and any conflicts (categories the extension requested but the site doesn't have). Protocol version is checked by major version only (1.x compatible with 1.y).
- **Alternatives**:
  - Custom DOM events — not visible across isolated worlds (extension content scripts run in isolated world)
  - chrome.runtime.sendMessage — requires the CMP to know the extension ID, breaks with other extensions
  - Shared cookie — too slow (cookie write → page reload → read), no real-time feedback
  - BroadcastChannel — not supported across extension/page boundary
- **Consequences**: postMessage is universally supported and works across isolated worlds. The `*` origin restriction was tightened to `window.location.origin` for security. A 2-second ACK timeout logs a warning if the CMP doesn't respond. The protocol supports forward compatibility via version field — new fields can be added without breaking older versions.
