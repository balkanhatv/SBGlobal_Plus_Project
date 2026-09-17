# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-17 · **Branch:** `docs/architecture-branch-2` · **Checkpoint:** `DEV-AUTHZ-POLICY-GRAMMAR-001`

Fresh-fetch the remote branch and verify its actual HEAD, tree and CI before continuing. Current verified executable is `1b0f90dc900e0ab49cde2f8305f11cfadadae31c` (tree `a48a2b8cd4d9447522ca2c5721d23a85175dbfa8`): Core Service Verify `35247193977` PASS with **71/71 Core/server + 13/13 real PostgreSQL tests**, and Database Verify `35247193986` PASS with **35 migrations / 29 verification files**.

Current executable scope includes the Core context/identity/guard kernel, pooled PostgreSQL/RLS transaction adapter, DD-041/DD-042 read bindings, DD-043 protected PLATFORM_GLOBAL identity/credential/SQL floor, DD-044 Clerk session-security, `DEV-AUTHZ-PDP-001` PLATFORM_GLOBAL Authorization persistence, and `DEV-AUTHZ-POLICY-GRAMMAR-001` deterministic Permission Set v1 / ABAC Expression v1 validation. The grammar is bounded/data-only and is not a PDP evaluator or compiler.

Next governed task: implement **only the Authorization read store** for the exact tenant or platform CURRENT compiled snapshot plus applicable ACTIVE ABAC policies. Every persisted permission payload, ABAC expression and permission pattern must be validated through [DEV-AUTHZ-POLICY-GRAMMAR-001](../Development/AUTHORIZATION_POLICY_GRAMMAR_V1.md); unsupported versions, malformed active policy state, missing current snapshots, scope mismatches and dependency failures must fail closed. Only after the reader is independently verified: PDP/ABAC evaluator → dedicated compiler boundary → Commercial validation → DD-06 transports.

Read [CORE_SERVICE_CHECKPOINT](../Development/CORE_SERVICE_CHECKPOINT.md), [DEV-AUTHZ-POLICY-GRAMMAR-001](../Development/AUTHORIZATION_POLICY_GRAMMAR_V1.md), [DEV-AUTHZ-PDP-001](../Development/AUTHORIZATION_PDP_ABAC_PERSISTENCE_PREREQUISITE.md), [DEV-CORE-MAP-001](../Development/CORE_PERSISTENCE_ADAPTER_MAP.md), DD-03, DD-16, DD-17 and DD-18 before continuation.

One Unified Core, nine equal Industries, 41 canonical MS, exactly two Tenant mobile app classes, RBAC primary, ABAC narrowing-only, and Tenant + Industry isolation remain active. RawSourceCorpus is immutable; `main` remains unmerged at `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains open draft/review-only. UD-BACKUP-01 remains the owner's physical ZIP waiver.
