# DATABASE CHECKPOINT
**Current checkpoint:** `DEV-AI-TOKEN-USAGE-CAPABILITY-BINDING-FLOORS-001`
**Updated:** 2026-09-25 · **Branch:** `docs/architecture-branch-2`

DD-197 implements only TokenUsage → AICapability exact capability-code foreign-key continuity. Capability currentness, entitlement/policy, principal currentness, model/provider compatibility, routing, billing and AI execution remain outside this checkpoint.

Verified canonical DD-197 promotion `9dcd28bb1db8bd3aa547fcba89f858b66a417646` / tree `4bd47e39825df89f0e0ef4ed0b09a917af92ebea`: **626/626 Core**, **504/504 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36160640520` (jobs `108156046969`, `108156046939`), Database `36160640556` (job `108156046913`), Web `36160640528` (job `108156046797`).

DD-197 decision/acceptance/traceability are canonically promoted and the promotion HEAD is exact-head verified. This state-closure commit must pass its own Core/PostgreSQL/Database/Web gate before another DD/source audit opens.

Evidence: `Registers/DEVELOPMENT_DD197_VERIFICATION_2026-09-25.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify the DD-198 AICost → TokenUsage exact usage-id binding candidate against the fixed source audit, then implement only that parent foreign-key continuity. Pricing/billing/finalization, principal currentness and AI execution remain locked.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.

Database evidence is clean bootstrap plus bounded real PostgreSQL acceptance, not production upgrade, rollback, load, penetration, recovery or operational certification. No migration, RLS, role or grant changes are introduced.


## Pending source-complete candidate — DD-198

The next governed prerequisite is the AICost → TokenUsage exact usage-id primary-key/foreign-key continuity relationship only. Source audit: `Development/AI_COST_TOKEN_USAGE_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md`. Pricing/billing/finalization, principal currentness and AI execution remain outside the candidate.
