# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-17 · **Branch:** `docs/architecture-branch-2` · **Checkpoint:** `DEV-AUTHZ-PDP-001`

Fresh-fetch the remote branch and verify its actual HEAD, tree, CI and [current Core checkpoint](../Development/CORE_SERVICE_CHECKPOINT.md) before continuing. Latest verified executable is `54e6fd0972699e31c4650e54faa9e41086f55755`: Core Service Verify `35242938042` PASS with **65 Core/server + 13 real PostgreSQL tests**, and Database Verify `35242938026` PASS with **35 migrations / 29 verification files**.

Current executable scope includes the corrected context/identity/guard kernel, pooled PostgreSQL/RLS transaction adapter, DD-041/042 read bindings, DD-043 protected PLATFORM_GLOBAL identity/credential/SQL floor, DD-044 Clerk session-security, and the `DEV-AUTHZ-PDP-001` PLATFORM_GLOBAL Authorization persistence prerequisite. API transports and UI remain unstarted; PDP/ABAC evaluation is not claimed.

Next governed task: define deterministic executable **permission-set v1 + ABAC expression v1 grammar** with bounded data-only semantics, approved attribute namespaces, explicit schema versions, fail-closed validation, and no arbitrary JavaScript/SQL/shell/template/dynamic execution. Only after that contract is locked: Authorization read store → fail-closed PDP/ABAC evaluator → compiler boundary → Commercial validation → DD-06 transports.

Read [DEV-AUTHZ-PDP-001](../Development/AUTHORIZATION_PDP_ABAC_PERSISTENCE_PREREQUISITE.md), [DEV-CORE-MAP-001](../Development/CORE_PERSISTENCE_ADAPTER_MAP.md), DD-03, DD-16, DD-17 and DD-18 before continuing. Trusted Data Home routing remains an owner-provided dependency; do not grant directory/identity or Authorization compiler mutation rights to the app role.

One Unified Core, nine equal Industries, 41 canonical MS, exactly two Tenant mobile app classes, RBAC primary and Tenant + Industry isolation remain active. RawSourceCorpus is immutable; `main` remains unmerged at `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains open draft/review-only. UD-BACKUP-01 remains the owner's physical ZIP waiver.
