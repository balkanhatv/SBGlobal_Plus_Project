# SBGlobal Plus — Canonical Development Branch
**Current checkpoint:** `DEV-AI-RAG-CHUNK-SOURCE-BINDING-FLOORS-001`
**Updated:** 2026-09-25 · **Branch:** `docs/architecture-branch-2`

DD-194 implements only the direct RAGChunk → parent RAGSource continuity floor: exact source id/Tenant/null-safe Industry/scope/residency/retention and no sensitivity downgrade. Embedding-model eligibility, source/document ACL, RAG retrieval/grounding and AI execution remain outside this checkpoint.

Verified canonical DD-194 promotion `00dbb610b13b3729cb36dd56350a74951417c58b` / tree `e7be433a499789a64853f92f60dccbd6a89ed27f`: **604/604 Core**, **504/504 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36153346707` (jobs `108131813056`, `108131812687`), Database `36153346693` (job `108131812300`), Web `36153346769` (job `108131814405`).

DD-194 decision/acceptance/traceability are canonically promoted and the promotion HEAD is exact-head verified. This state-closure commit must pass its own Core/PostgreSQL/Database/Web gate before another DD/source audit opens.

Evidence: `Registers/DEVELOPMENT_DD194_VERIFICATION_2026-09-25.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this DD-194 state-closure HEAD with Core/PostgreSQL/Database/Web. Only after PASS, source-audit the separate RAGChunk → embedding-model current eligibility relationship; RAG retrieval and AI execution remain locked.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.


