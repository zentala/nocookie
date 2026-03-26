# ADR 005: Emit GPC header for privacy-protective profiles

- **Status**: accepted
- **Date**: 2026-03-24
- **Epic**: E002

- **Context**: Global Privacy Control (GPC) is a W3C Working Draft for a binary privacy opt-out signal. It is legally enforceable in 12 US states and will be mandatory in California browsers by January 2027 (AB 566). GPC operates via the `Sec-GPC: 1` HTTP header and `navigator.globalPrivacyControl` JavaScript property. Our extension already manages per-category consent preferences and interacts with CMPs directly. We need to decide whether to also emit the GPC signal, and under what conditions.

- **Decision**: Emit `Sec-GPC: 1` on all outgoing HTTP requests when the user's active profile rejects marketing cookies (Privacy Maximum, Balanced, or Allow Analytics profiles). Also set `navigator.globalPrivacyControl = true` via the MAIN world content script. GPC emission is enabled by default for qualifying profiles but can be toggled off by the user in settings. Implementation uses `chrome.declarativeNetRequest` for header modification (no per-request overhead).

- **Alternatives**:
  - **Not emitting GPC**: Skip GPC entirely, rely solely on CMP interaction. Rejected because: GPC provides defense-in-depth. If CMP interaction fails (rule broken, unknown CMP, race condition), the GPC signal still communicates the user's preference. Ignoring a legally recognized signal weakens the user's privacy position. Sites that honor GPC (legally required in 12 states) would not receive the signal.
  - **Always emitting GPC regardless of profile**: Send `Sec-GPC: 1` for all users including those who chose "Accept All". Rejected because: GPC means "do not sell/share my personal data." Emitting it when the user has explicitly chosen to accept marketing cookies is contradictory and could confuse sites that honor both GPC and granular consent. The signal must reflect the user's actual preference.
  - **GPC only, no CMP interaction**: Use GPC as the sole consent mechanism. Rejected because: GPC is binary (opt-out only) and has no per-category granularity. Most sites do not honor GPC. It cannot replace direct CMP interaction for practical consent management.

- **Consequences**:
  - Legal compliance: users in California, Colorado, Connecticut, and 9 other US states get legally enforceable opt-out signals automatically.
  - Defense-in-depth: GPC works as a fallback when CMP interaction fails or when the CMP is unknown.
  - Complementary signals: sites receive both the GPC header (broad opt-out) and specific per-category consent via CMP interaction. These are not contradictory — GPC expresses the user's general preference, CMP interaction implements it specifically.
  - EU relevance: GPC is increasingly recognized by CNIL and ICO as a valid expression of the Right to Object (GDPR Art. 21). If Art. 88b standardization adopts or extends GPC, we are already compatible.
  - `chrome.declarativeNetRequest` adds the header at the network layer with no per-request performance cost.
  - User control: the toggle in settings respects users who want granular CMP control without the broad GPC signal.
