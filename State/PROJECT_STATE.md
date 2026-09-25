# PROJECT_STATE — SBGlobal Plus
**Current checkpoint:** `DEV-AI-TOKEN-USAGE-CAPABILITY-BINDING-FLOORS-001`
**Updated:** 2026-09-25 · **Branch:** `docs/architecture-branch-2`

DD-197 implements only TokenUsage → AICapability exact capability-code foreign-key continuity. Capability currentness, entitlement/policy, principal currentness, model/provider compatibility, routing, billing and AI execution remain outside this checkpoint.

Verified DD-197 implementation basis `a4d12bb3a0683ad218d6b1a5c4bedccafae99cdf` / tree `51d94b76c82aff0be0b946d858f887e36ff3ac51`: **626/626 Core**, **504/504 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36159912811` (jobs `108153632327`, `108153631892`), Database `36159912926` (job `108153632353`), Web `36159912919` (job `108153632059`).

DD-197 decision/acceptance/traceability are canonically promoted in the current metadata change. The verified executable basis is the implementation HEAD above; this promotion HEAD must independently pass Core/PostgreSQL/Database/Web before another DD/source audit opens.

Evidence: `Registers/DEVELOPMENT_DD197_VERIFICATION_2026-09-25.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this DD-197 canonical promotion HEAD with Core/PostgreSQL/Database/Web. Only after PASS, source-audit the next independent TokenUsage/AI persistence relationship; principal currentness, billing and AI execution remain locked.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.


