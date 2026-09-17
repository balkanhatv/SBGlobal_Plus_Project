# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-18 · **Branch:** `docs/architecture-branch-2` · **Checkpoint:** `DEV-AUTHZ-COMPILER-001`

Fresh-fetch remote branch and verify actual HEAD/tree/CI before continuation. Verified executable: `2c9157e3a1ed30f18f8014e1b04aa799f2d73d15`, tree `a1cc883564516222ed6095e692ba6bd1ec33baac`. Core Service Verify `35282382158`: **95/95 Core + 18/18 PostgreSQL** PASS. Database Verify `35282382162`: **37 migrations / 31 verification files** PASS.

Current bounded scope includes the fail-closed evaluator and the DD-041 compiler publication boundary. Migration 0037 creates only the dedicated compiler role/policies; the publication service uses exact SERVICE context, canonical v1 payloads, per-subject row locking, version+1 publication, safe invalidation and separate tenant/platform paths. It cannot mutate role/permission/ABAC source truth or delete compiled snapshots.

Next governed task: **Commercial current-state integration only**. Resolve exact current EntitlementSnapshot + underlying Subscription/License state through Commercial-owned read ports, expose only server-owned supplemental facts to Authorization, enforce version equality with RequestContext, and fail closed on stale/missing/dependency state.

Do not enable true RESTRICT until a separate governed restriction payload/reducer exists. Do not start DD-06 transports before Commercial integration is independently verified.

One Unified Core, nine equal Industries, 41 canonical MS, exactly two Tenant mobile app classes, RBAC primary, ABAC narrowing-only, and Tenant + Industry isolation remain active. RawSourceCorpus is immutable; `main` remains unmerged; PR #2 stays draft/review-only.
