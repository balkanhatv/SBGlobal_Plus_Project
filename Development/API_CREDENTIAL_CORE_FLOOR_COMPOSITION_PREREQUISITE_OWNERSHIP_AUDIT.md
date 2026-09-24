# API Credential core necessary-floor composition prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-API-CREDENTIAL-REQUESTED-SCOPE-FLOOR-001`  
**Verified synchronized basis:** `cf85bced4d95e410d51ea220fdfddba60665e8e5` / tree `9772bf123506dce799807afcd547a7159e7b775d`  
**Scope:** next bounded machine-credential prerequisite after DD-161.

## Source reconciliation

The repository now owns three independent server-internal necessary floors:

- DD-158: current API Credential lifecycle — persisted status ACTIVE and no expiry or expiry strictly after the supplied server-owned instant;
- DD-160: current machine principal — ACTIVE API_CLIENT or structurally valid ACTIVE SERVICE;
- DD-161: requested-scope compatibility — exact principal/Tenant/Industry target rules, SERVICE requested-scope allowlists and EXPLICIT_CROSS_CONTEXT denial.

DD-147 supplies the raw credential verification material. DD-159 supplies the raw machine-principal metadata.

No source currently authorizes turning these three raw floors into secret verification, CIDR enforcement, permission-profile evaluation, usage mutation/audit or final `VerifiedMachineEvidence`.

## Determination

One pure deterministic composition prerequisite is source-complete:

> Given already-loaded API Credential verification material, its machine-principal metadata, a server-owned requested scope target and an explicit server-owned evaluation instant, determine only whether DD-158, DD-160 and DD-161 all match.

This remains a set of necessary floors, not machine authentication.

## Authorized DD-162 boundary

Implement server-internal helper:

`matchesApiCredentialCoreNecessaryFloors(material, principal, input)`.

Input contains:

- `target`: DD-161 requested-scope target;
- `evaluatedAt`: explicit server-owned instant.

The helper must:

1. compose DD-158 current lifecycle;
2. compose DD-160 current machine-principal admissibility;
3. compose DD-161 requested-scope compatibility;
4. return true only when all three return true;
5. remain deterministic and side-effect free;
6. mutate no input.

## Acceptance target

- **APICRED-CORE-001** — lifecycle + current principal + requested scope all true -> true.
- **APICRED-CORE-002** — lifecycle failure -> false.
- **APICRED-CORE-003** — current machine-principal failure -> false.
- **APICRED-CORE-004** — requested-scope failure -> false.
- **APICRED-CORE-005** — multiple failed/malformed floors remain false with no fallback.
- **APICRED-CORE-006** — PLATFORM_GLOBAL and Tenant-Industry success paths preserve the existing DD-161 scope rules when the other floors are current.
- **APICRED-CORE-007** — hash/CIDR/profile/version/use evidence remains uninterpreted and inputs are not mutated.

Expected Core/server suite delta: +7, from 381 to 388. PostgreSQL remains 497.

## Explicitly unclaimed

DD-162 does **not**:

- parse presented credentials or extract prefixes;
- compare `secretHash` or choose verifier algorithms/parameters;
- enforce CIDR/network policy;
- interpret `permissionProfileId`;
- update `lastUsedAt`, credential version or auth epoch;
- emit authentication/use audit;
- construct final `VerifiedMachineEvidence`;
- implement `IdentityPort.verifyMachineCredential`;
- mutate credential/principal state;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-162, the raw current lifecycle + current machine principal + requested-scope compatibility prerequisites can be evaluated together. Presented-token parsing/verifier execution, CIDR, permission-profile mapping, usage/audit and final machine evidence remain separate.
