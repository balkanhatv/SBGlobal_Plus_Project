# D-CHECKPOINT — DEV-AUTHZ-READ-STORE-001
**Updated:** 2026-09-18 · **Branch:** `docs/architecture-branch-2`

The current executable checkpoint is [Development/CORE_SERVICE_CHECKPOINT.md](../Development/CORE_SERVICE_CHECKPOINT.md). The locked policy grammar remains [DEV-AUTHZ-POLICY-GRAMMAR-001](../Development/AUTHORIZATION_POLICY_GRAMMAR_V1.md); the preceding PLATFORM_GLOBAL persistence prerequisite remains [DEV-AUTHZ-PDP-001](../Development/AUTHORIZATION_PDP_ABAC_PERSISTENCE_PREREQUISITE.md).

Verified executable commit: `4916b30359cea056a352245176dcb33f739fc0a0`; tree `16e1a322620de4a0591222356e6db3dd5f0428bf`.
- Core Service Verify run `35252274497`, core-service job `105307252647`: **PASS — 75/75**.
- Core Service Verify run `35252274497`, postgres-context job `105307252908`: **PASS — 15/15**.
- Database Verify run `35252274557`, postgres-verify job `105307253170`: **PASS**.
- Current inventory: **75 Core/server tests, 15 real PostgreSQL tests, 36 migrations, 30 verification files**; Industry SQL scope remains **9/41/181**.

Gate: **IMPLEMENTED / TESTED — AUTHORIZATION READ STORE; PDP/ABAC EVALUATOR NOT CLAIMED**.

Tenant and PLATFORM_GLOBAL snapshot paths are separate; the reader selects exact CURRENT snapshots and applicable ACTIVE/effective-window ABAC policies only, validates all persisted v1 policy data through the locked grammar, preserves sibling-Industry isolation and fails closed on missing/version/scope/payload/dependency errors.

Next governed action: implement **only the fail-closed `AuthorizationDecisionPort` PDP/ABAC evaluator + DD-17 AUTH acceptance**. Evaluator/compiler remain separate governed slices.

RawSourceCorpus stays immutable; `main` stays unmerged; PR #2 remains draft/review only.
