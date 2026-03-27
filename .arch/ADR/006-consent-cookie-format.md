# ADR 006: Compact consent cookie format

- **Status**: accepted
- **Date**: 2026-03-27
- **Epic**: E003
- **Context**: The CMP needs to persist per-category consent in a first-party cookie. The format must be compact (cookie size limits), human-debuggable, and support expiry checking without server-side logic.
- **Decision**: Use a pipe-delimited key:value format — `ca_consent=e:1|f:0|a:0|m:0|s:0|ts:1711324800000`. Single-letter keys map to categories (e=essential, f=functional, a=analytics, m=marketing, s=social-media). Values are 0/1. A `ts` field stores the consent timestamp for client-side expiry checking.
- **Alternatives**:
  - JSON in cookie value — more readable but larger, needs URL encoding, exceeds 4KB limit faster
  - localStorage — not sent to server, breaks server-side consent checks, cleared by browser cleanup
  - Multiple cookies (one per category) — simpler per-cookie but multiplies cookie count, harder to manage expiry atomically
  - Base64-encoded bitfield — most compact but not human-debuggable
- **Consequences**: Cookie is ~45 bytes (well under limits). Parsing requires a custom parser (implemented in `consent-state.ts`). Adding new categories requires mapping new single-letter keys. Timestamp-based expiry allows client-side revalidation without server calls.
