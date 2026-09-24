# CORE SERVICE CHECKPOINT — DEV-API-CREDENTIAL-REQUESTED-SCOPE-FLOOR-001
**Updated:** 2026-09-24 · **Branch:** `docs/architecture-branch-2`

Verified executable `3c9fad6e0df4e0f2b1c048ee49fff5767ecbb6c7` / tree `f338bb14bef9e1919bd5aa455013a8d90a289c10`: **381/381 Core**, **497/497 PostgreSQL**, Database/Web PASS. Zero failed/skipped tests.

Promotion invariant gate `dc1891c8dea75ce257729dd320cb6086716ecda1` / tree `85a6f0794c352a44f1ce282511ce803620c4896b`: Core run `35954596377` (Core job `107490107603`, PostgreSQL job `107490107434`), Database run `35954596379` (job `107490107463`), Web run `35954596384` (job `107490107321`) — SUCCESS; **161 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

`APICRED-SCOPE-001…007` prove PLATFORM_GLOBAL/Tenant-Core/Tenant-Industry requested-scope compatibility, same-Tenant allowlisted Industry widening only where explicitly persisted, SERVICE requested-scope allowlists, fail-closed mismatches/malformed targets, EXPLICIT_CROSS_CONTEXT denial, and non-interpretation/non-mutation of lifecycle/hash/CIDR/profile/version/use/currentness evidence.

## Remaining scope

Composition with DD-158 credential lifecycle and DD-160 current-principal floors; presented-token format/parsing; verifier hash execution and crypto governance; CIDR/network enforcement; permission-profile mapping; usage mutation/audit; final `VerifiedMachineEvidence`; and `IdentityPort.verifyMachineCredential` remain unimplemented unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD161_VERIFICATION_2026-09-24.md`.
