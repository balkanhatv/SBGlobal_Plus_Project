# HANDOFF_NOTE — SBGlobal Plus
**Current checkpoint:** `DEV-AI-RAG-CHUNK-EMBEDDING-MODEL-ELIGIBILITY-FLOORS-001`
**Updated:** 2026-09-25 · **Branch:** `docs/architecture-branch-2`

DD-195 implements only the RAGChunk → embedding AIModel current eligibility floor: exact model id, raw ACTIVE status and sufficient sensitivity ceiling. Provider currentness/routing, source/document ACL, RAG retrieval/grounding and AI execution remain outside this checkpoint.

Verified canonical DD-195 promotion `86d2ff17963374f2274293c822c9f69428f7bcbb` / tree `ead643a6807f224ffe394624b33e582d8720e0a1`: **612/612 Core**, **504/504 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36155996203` (jobs `108140558057`, `108140558676`), Database `36155996177` (job `108140558352`), Web `36155996311` (job `108140558739`).

DD-195 decision/acceptance/traceability are canonically promoted and the promotion HEAD is exact-head verified. This state-closure commit must pass its own Core/PostgreSQL/Database/Web gate before another DD/source audit opens.

Evidence: `Registers/DEVELOPMENT_DD195_VERIFICATION_2026-09-25.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify the DD-196 TokenUsage Model/Provider exact-pair candidate against the fixed source audit, then implement only that composite-FK continuity floor. Principal currentness, runtime routing, billing and AI execution remain locked.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.

Fetch the branch again before continuation. Verify this state-closure commit against all four CI jobs before opening another DD.


## Pending source-complete candidate — DD-196

The next governed prerequisite is TokenUsage → AIModel exact model-id/provider-id composite-pair continuity only. Source audit: `Development/AI_TOKEN_USAGE_MODEL_PROVIDER_PAIR_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md`. Principal currentness, provider/model runtime routing, billing and AI execution remain outside the candidate.
