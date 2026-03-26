# ADR 001: Use well-known JSON instead of HTTP headers for machine-readable consent

- **Status**: accepted
- **Date**: 2026-03-24
- **Epic**: E002

- **Context**: The project needs a machine-readable standard for websites to declare their cookie consent structure so that browser extensions (and eventually browsers themselves) can handle consent automatically. The standard must be simple enough for widespread adoption, require no server-side logic, and work independently of browser vendor support. Existing approaches (ADPC headers, HTML meta tags, browser APIs) have all failed to gain traction due to adoption barriers.

- **Decision**: Define a `/.well-known/cookie-consent.json` static file that websites place at a well-known URI (RFC 8615). The file declares cookie categories, CMP type, UI selectors, and API endpoints in a structured JSON format. Extensions and tools fetch this file on first visit to a domain and cache it (24h default). When present, the file provides the highest-confidence detection path, eliminating the need for heuristic CMP detection on that site.

- **Alternatives**:
  - **HTTP headers (ADPC approach)**: ADPC uses HTTP response headers and a `consent-requests.json` linked via `Link` header. Rejected because: requires server configuration for every response, adds latency to every request, harder to debug, and ADPC has zero production adoption after 5 years. A static file requires no server logic — it can be deployed by uploading a single file.
  - **HTML meta tags**: Embedding consent metadata in `<meta>` tags in the page `<head>`. Rejected because: fragile (depends on HTML parsing timing), not discoverable without loading the full page, varies across pages on the same domain, and competing with existing meta tag conventions.
  - **Browser API (navigator.cookieConsent)**: A new browser-native JavaScript API. Rejected because: requires browser vendor adoption (Chrome, Firefox, Safari, Edge must all implement), standardization takes 3-5+ years through W3C, and provides zero value until browsers ship it. Our solution must work today.
  - **robots.txt-style plain text**: A `cookie-consent.txt` file with directive-based syntax. Rejected because: JSON is more expressive, easier to validate with schemas, and aligns with modern tooling (every CMS, build tool, and CDN can generate JSON).

- **Consequences**:
  - Simple to implement: website owners upload one static JSON file, no server config needed.
  - Discoverable: any tool can check `/.well-known/cookie-consent.json` on any domain.
  - Cacheable: static file works with CDN caching, reducing repeated fetches.
  - Extensible: JSON schema can evolve with backward-compatible additions.
  - Works today: no browser vendor support required.
  - Aligns with Art. 88b direction: when EU technical standards are specified, our schema can be mapped to the official format.
  - Precedent: follows the pattern of `/.well-known/gpc.json`, `/.well-known/security.txt`, and `robots.txt` — proven adoption patterns for machine-discoverable site metadata.
  - Limitation: websites must opt in by creating the file. The extension must still handle sites without it via CMP rules and heuristics.
