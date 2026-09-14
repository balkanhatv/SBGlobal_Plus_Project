# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-14 · **Branch:** `docs/architecture-branch-2` · **Checkpoint:** `DEV-CORE-POSTGRES-001`

Fresh-fetch the remote branch and verify its actual HEAD, tree, CI and [current Core checkpoint](../Development/CORE_SERVICE_CHECKPOINT.md) before continuing. The verified executable snapshot is `0ada4283959ea4abe39a0980574e2dfdcb62e508`: **40 Core tests + 7 real PostgreSQL tests PASS**, plus the full database regression. This handoff's publication SHA must be read from Git; it is not substituted for the recorded code evidence.

Current scope includes the corrected context/identity/guard kernel and the concrete pooled PostgreSQL/RLS transaction adapter. The earlier Database-only checkpoint remains historical persistence evidence. API transports and UI remain unstarted.

Next governed task: Specify the exact Authorization compiled-permission snapshot/version persistence contract and the Current Supported Industry presentation catalog contract, then implement their module-owned read adapters. Do not infer missing fields, broaden database grants, or join across module ownership.

Read [DEV-CORE-MAP-001](../Development/CORE_PERSISTENCE_ADAPTER_MAP.md) and DD-040 first. Trusted Data Home routing is an owner-provided dependency; do not grant directory/identity access to the app role. Select an available model by authorization/data-contract reasoning and TypeScript/PostgreSQL capability; no model switch has been performed.

One Unified Core, nine equal Industries, 41 canonical MS, exactly two Tenant mobile app classes, RBAC primary and Tenant + Industry isolation remain active. RawSourceCorpus is immutable; main remains unmerged; PR #2 is draft/review only. UD-BACKUP-01 remains the owner's physical ZIP waiver.
