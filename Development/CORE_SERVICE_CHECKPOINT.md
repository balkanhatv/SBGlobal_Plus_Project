# CORE SERVICE CHECKPOINT
**Current checkpoint:** `DEV-AI-TOKEN-USAGE-MODEL-PROVIDER-PAIR-FLOORS-001`
**Updated:** 2026-09-25 · **Branch:** `docs/architecture-branch-2`

DD-196 implements only TokenUsage → AIModel exact model-id/provider-id composite-pair continuity. Provider/Model currentness, principal currentness, capability eligibility, runtime routing, billing and AI execution remain outside this checkpoint.

Verified canonical DD-196 promotion `a4366228f1194d751a555be609a282879b4cb2d3` / tree `4a8b456750f8a356ac6ff87c02323798c93a6079`: **619/619 Core**, **504/504 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36157948796` (jobs `108147040398`, `108147040927`), Database `36157948614` (job `108147039962`), Web `36157948344` (job `108147039209`).

DD-196 decision/acceptance/traceability are canonically promoted and the promotion HEAD is exact-head verified. This state-closure commit must pass its own Core/PostgreSQL/Database/Web gate before another DD/source audit opens.

Evidence: `Registers/DEVELOPMENT_DD196_VERIFICATION_2026-09-25.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify the DD-197 TokenUsage capability-code binding candidate against the fixed source audit, then implement only exact persisted capability-code continuity. Capability currentness, principal currentness, billing and AI execution remain locked.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.


## Pending source-complete candidate — DD-197

The next governed prerequisite is the TokenUsage → AICapability exact capability-code foreign-key continuity relationship only. Source audit: `Development/AI_TOKEN_USAGE_CAPABILITY_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md`. Capability currentness, principal currentness, billing and AI execution remain outside the candidate.
