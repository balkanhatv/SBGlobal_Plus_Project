# CORE SERVICE CHECKPOINT — DEV-MACHINE-PRINCIPAL-METADATA-READ-001
**Updated:** 2026-09-24 · **Branch:** `docs/architecture-branch-2`

Verified executable `3cbed05188f21ed04ad4c1bb6964e50f6447c940` / tree `bbd14cdb2fc39fd43ef7dce8562e486f4cf2b858`: **367/367 Core**, **497/497 PostgreSQL**, Database/Web PASS. Zero failed/skipped tests.

Promotion invariant gate `3504c9f946b68e4dd49eff070bd35694e36c807f` / tree `cad82fb83e0b94771325bb7e53eacdd1604597b7`: Core run `35952927992` (Core job `107485122128`, PostgreSQL job `107485121910`), Database run `35952927996` (job `107485122074`), Web run `35952927991` (job `107485122181`) — SUCCESS; **159 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

`MACHPRINC-PG-001…007` prove exact API_CLIENT/SERVICE raw metadata, SERVICE code/module/scope preservation, HUMAN/PLATFORM_OPERATOR non-acceptance semantics, raw non-active statuses, nullable scopes + bigint auth epoch fidelity, missing/malformed id behavior and exact-read-only/no-PII surface.

## Remaining scope

Current machine-principal validity; composition with DD-158 credential lifecycle; Tenant/Industry/PLATFORM_GLOBAL scope authorization; permission-profile mapping; token parsing/hash verification; CIDR; usage mutation/audit; final `VerifiedMachineEvidence`; and `IdentityPort.verifyMachineCredential` remain unimplemented unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD159_VERIFICATION_2026-09-24.md`.
