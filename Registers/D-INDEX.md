# D-INDEX — Current Canonical / Development Index
**Current checkpoint:** `DEV-AI-MEDIA-PROMPT-BINDING-FLOORS-001`
**Updated:** 2026-09-25 · **Branch:** `docs/architecture-branch-2`

DD-188 implements only optional AIMediaRequest → PromptTemplate exact id/version/ACTIVE/owner-scope binding. Missing, foreign or malformed binding evidence fails closed. A true result grants no principal/document access, prompt rendering, moderation or AI execution authority.

Verified implementation basis `35ffce1cd8d079596b79452e1b5a117ebcd541c0` / tree `a494cd6f4ca3cc07c74becff0cb4208091b29f7a`: **563/563 Core**, **497/497 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36118205299` (jobs `108017179259`, `108017179365`), Database `36118205364` (job `108017179491`), Web `36118205303` (job `108017179189`).

Canonical promotion and state reconciliation are in this forward-only change. Its own exact-head CI must pass independently; the hashes above name already-observed evidence, never a self-referential commit.

Evidence: `Registers/DEVELOPMENT_DD188_VERIFICATION_2026-09-25.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Source-audit the independent migration-0031 AIMediaRequest input-document scope/state/scan/sensitivity/residency relationship. Principal currentness remains blocked by missing provenance; no AI execution is authorized.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
