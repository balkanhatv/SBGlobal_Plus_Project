# D-INDEX — Current Canonical / Development Index
**Current checkpoint:** `DEV-DOCUMENT-AI-MEDIA-REQUEST-PROVENANCE-FLOORS-001`
**Updated:** 2026-09-25 · **Branch:** `docs/architecture-branch-2`

DD-191 implements only the direct generated Document → completed AIMediaRequest persisted relationship floor: exact request id/completion, same Tenant/null-safe Industry, exact residency and generated-Document sensitivity at least request sensitivity. Provider/Model currentness, moderation/licensing interpretation, Document authorization/storage and AI execution remain outside this checkpoint.

Verified DD-191 implementation basis `8beb7af4aa00d93ed416fa331875c06ea7ec8032` / tree `b6685b9eb34dbfa823f849f3aec2620f70792a48`: **581/581 Core**, **504/504 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36132887607` (jobs `108064017168`, `108064016736`), Database `36132887608` (job `108064016630`), Web `36132887600` (job `108064016934`).

DD-191 decision/acceptance/traceability are canonically promoted in the current metadata change. The verified executable basis is the implementation HEAD above; this promotion HEAD must independently pass Core/PostgreSQL/Database/Web before another DD is opened.

Evidence: `Registers/DEVELOPMENT_DD191_VERIFICATION_2026-09-25.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify the DD-192 generated Document AIModel/AIProvider exact-pair candidate against the fixed source audit, then implement only that composite-FK relationship floor. Provider/Model currentness and AI execution remain locked.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.




## Pending source-complete candidate — DD-192

The next governed prerequisite is the generated Document → exact AIModel/AIProvider composite pair relationship only. Source audit: `Development/DOCUMENT_AI_MODEL_PROVIDER_PAIR_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md`. Provider/Model currentness, routing and execution remain outside the candidate.
