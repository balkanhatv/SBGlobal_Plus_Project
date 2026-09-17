# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-18 · **Branch:** `docs/architecture-branch-2` · **Checkpoint:** `DEV-AUTHZ-READ-STORE-001`

Fresh-fetch the remote branch and verify its actual HEAD, tree and CI before continuing. Current verified executable is `4916b30359cea056a352245176dcb33f739fc0a0` (tree `16e1a322620de4a0591222356e6db3dd5f0428bf`): Core Service Verify `35252274497` PASS with **75/75 Core/server + 15/15 real PostgreSQL tests**, and Database Verify `35252274557` PASS with **36 migrations / 30 verification files**.

Current executable scope includes the Core context/identity/guard kernel, pooled PostgreSQL/RLS transaction adapter, DD-041/DD-042 read bindings, DD-043 protected PLATFORM_GLOBAL identity/credential/SQL floor, DD-044 Clerk session-security, `DEV-AUTHZ-PDP-001` PLATFORM_GLOBAL Authorization persistence, `DEV-AUTHZ-POLICY-GRAMMAR-001` deterministic Permission Set v1 / ABAC Expression v1 validation, migration 0036 PLATFORM_GLOBAL ABAC write-boundary hardening, and the governed Authorization read store.

The reader resolves exact CURRENT tenant or platform compiled snapshots, never cross-falls back between tenant and PLATFORM_GLOBAL paths, returns only ACTIVE/effective-window ABAC policies, validates stored policy payloads through the locked v1 grammar, preserves Tenant + Industry isolation and fails closed on missing/version/scope/payload/dependency errors.

Next governed task: implement **only the fail-closed `AuthorizationDecisionPort` PDP/ABAC evaluator + DD-17 AUTH acceptance**. Preserve RBAC primary semantics, explicit deny precedence and ABAC narrowing-only behavior. Only after the evaluator is independently verified: dedicated compiler boundary → Commercial validation → DD-06 transports.

Read [CORE_SERVICE_CHECKPOINT](../Development/CORE_SERVICE_CHECKPOINT.md), [DEV-AUTHZ-POLICY-GRAMMAR-001](../Development/AUTHORIZATION_POLICY_GRAMMAR_V1.md), [DEV-AUTHZ-PDP-001](../Development/AUTHORIZATION_PDP_ABAC_PERSISTENCE_PREREQUISITE.md), [DEV-CORE-MAP-001](../Development/CORE_PERSISTENCE_ADAPTER_MAP.md), DD-03, DD-16, DD-17 and DD-18 before continuation.

One Unified Core, nine equal Industries, 41 canonical MS, exactly two Tenant mobile app classes, RBAC primary, ABAC narrowing-only, and Tenant + Industry isolation remain active. RawSourceCorpus is immutable; `main` remains unmerged at `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains open draft/review-only. UD-BACKUP-01 remains the owner's physical ZIP waiver.
