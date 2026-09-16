# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-17 · **Branch:** `docs/architecture-branch-2` · **Checkpoint:** `DEV-CORE-PLATFORM-SCOPE-001`

Fresh-fetch the remote branch and verify its actual HEAD, tree, CI and [current Core checkpoint](../Development/CORE_SERVICE_CHECKPOINT.md) before continuing. Latest verified executable is `3e7b2927839d289240eb389902563f5ab3d68074`: Core Service Verify and Database Verify PASS with the current 47 Core/server + 11 PostgreSQL test inventory and 34 migrations / 28 verification files.

Current scope includes the corrected context/identity/guard kernel, pooled PostgreSQL/RLS transaction adapter, DD-041/042 read bindings, and DD-043 protected PLATFORM_GLOBAL scope floor. API transports and UI remain unstarted.

Next governed task: Concrete provider/session-security integration behind the existing Core Identity/Security ports, then PDP/ABAC, Commercial validation, and DD-06 transports.

Read [DEV-CORE-MAP-001](../Development/CORE_PERSISTENCE_ADAPTER_MAP.md) and DD-040 first. Trusted Data Home routing is an owner-provided dependency; do not grant directory/identity access to the app role. Select an available model by authorization/data-contract reasoning and TypeScript/PostgreSQL capability; no model switch has been performed.

One Unified Core, nine equal Industries, 41 canonical MS, exactly two Tenant mobile app classes, RBAC primary and Tenant + Industry isolation remain active. RawSourceCorpus is immutable; main remains unmerged; PR #2 is draft/review only. UD-BACKUP-01 remains the owner's physical ZIP waiver.
