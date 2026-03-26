# ADR 002: Wrap autoconsent instead of writing custom CMP rules from scratch

- **Status**: accepted
- **Date**: 2026-03-24
- **Epic**: E002

- **Context**: The extension must interact with dozens of different CMPs, each with unique DOM structures, JavaScript APIs, and consent flows. Writing and maintaining interaction rules for every CMP from scratch is expensive and error-prone. Existing open-source libraries have already solved this problem at scale. We need a strategy that gives us broad CMP coverage from day one while allowing custom rules for cases where existing libraries fall short.

- **Decision**: Wrap DuckDuckGo's `@duckduckgo/autoconsent` library as the primary CMP interaction engine. Autoconsent provides rules for 100+ CMPs and includes a `ConsentOMaticCMP` compatibility class that can consume Consent-O-Matic's rule format (adding 200+ more CMPs). Our own native rules take priority when both exist for a CMP, allowing us to override autoconsent behavior where needed. We also layer our detection system on top (well-known file, JS globals, DOM selectors) to identify CMPs before delegating execution to autoconsent or our own rules.

- **Alternatives**:
  - **Custom rules only (Consent-O-Matic approach)**: Write all CMP interaction rules ourselves using CSS selectors and click sequences. Rejected because: Consent-O-Matic's maintainers spend significant effort keeping up with CMP changes across 200+ rules. We cannot match this maintenance burden as a smaller project. Starting from zero would mean months before achieving useful CMP coverage.
  - **ML-based detection (CookieBlock approach)**: Use machine learning to classify and interact with consent UIs. Rejected for v1 because: CookieBlock's ML classifies cookies (84% accuracy) but does not interact with consent UI elements. Training a model for UI interaction requires labeled training data we do not have. ML adds complexity, model size, and unpredictable failure modes. Considered for v2 as a supplementary detection layer.
  - **Fork autoconsent**: Fork the library and maintain our own copy. Rejected because: forking severs us from upstream improvements and community contributions. Wrapping preserves the ability to pull updates while adding our own logic.

- **Consequences**:
  - 100+ CMPs supported immediately at launch via autoconsent's built-in rules.
  - 200+ additional CMPs via Consent-O-Matic compatibility layer.
  - Community-maintained rules: DuckDuckGo and Consent-O-Matic communities update rules when CMPs change.
  - Our custom rules override autoconsent when we need different behavior (e.g., per-category granularity instead of reject-all).
  - Dependency on an external library: if autoconsent is abandoned, we inherit maintenance. Mitigated by the fact that it is MIT-licensed and we can fork if necessary.
  - Autoconsent is reject-focused (designed for DuckDuckGo's privacy browser). We must extend it to support granular per-category consent, which is our differentiator over autoconsent's binary reject-all approach.
