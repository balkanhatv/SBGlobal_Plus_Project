# API Credential current machine-principal floor prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-MACHINE-PRINCIPAL-METADATA-READ-001`  
**Verified synchronized basis:** `3bcb5dfeed05e1670ad9aaf72047db820eb7ae16` / tree `5f6c0e46eafc31004500a761cf114971cf3d2f8d`  
**Scope:** next bounded machine-credential prerequisite after DD-159.

## Source reconciliation

DD-03 defines final `VerifiedMachineEvidence.principalType` as
`API_CLIENT | SERVICE`; HUMAN and PLATFORM_OPERATOR are not machine-evidence
principal types. DD-03 also says Platform Operators cannot substitute API
credentials for interactive platform identity/elevation.

Migration 0030's API Credential integrity trigger requires the referenced
PlatformPrincipal to exist and be `ACTIVE`, explicitly rejects
`PLATFORM_OPERATOR`, and separately enforces SERVICE allowed-scope
compatibility. DD-159 now owns raw current principal type/status/service metadata.

The migration permits persisted HUMAN API credentials when Tenant membership
conditions are satisfied, but the canonical runtime machine-evidence contract
does not permit HUMAN as `VerifiedMachineEvidence`. Therefore persistence
admissibility must not be confused with runtime machine-principal acceptance.

## Determination

One deterministic server-internal prerequisite is source-complete:

> Given already-loaded DD-159 machine-principal metadata, determine only whether
> the principal is currently admissible as a machine-evidence principal type.

This is a necessary authentication predicate only.

## Authorized DD-160 boundary

Implement server-internal helper:

`matchesCurrentMachinePrincipalFloor(metadata)`.

It must:

1. require `metadata.status === 'ACTIVE'`;
2. accept only `principalType === 'API_CLIENT'` or `'SERVICE'`;
3. reject HUMAN and PLATFORM_OPERATOR even when ACTIVE;
4. for SERVICE, require non-empty persisted `serviceCode` and `owningModule`
   because migration 0003 owns those structural requirements;
5. not interpret `allowedScopeClasses` as requested-scope authorization;
6. ignore auth epoch beyond preserving it as metadata;
7. leave metadata unchanged.

## Acceptance target

- **MACHPRINC-CUR-001** — ACTIVE API_CLIENT matches.
- **MACHPRINC-CUR-002** — ACTIVE SERVICE with required service metadata matches.
- **MACHPRINC-CUR-003** — HUMAN and PLATFORM_OPERATOR fail even when ACTIVE.
- **MACHPRINC-CUR-004** — PENDING/SUSPENDED/REVOKED fail regardless of type.
- **MACHPRINC-CUR-005** — SERVICE missing/empty service code or owning module fails closed.
- **MACHPRINC-CUR-006** — allowed scopes and auth epoch do not create acceptance or scope authorization.
- **MACHPRINC-CUR-007** — helper is deterministic, side-effect free and does not mutate metadata.

Expected Core/server suite delta: +7, from 367 to 374. PostgreSQL remains 497.

## Explicitly unclaimed

DD-160 does **not**:

- evaluate DD-158 API Credential lifecycle on the caller's behalf;
- decide credential Tenant/Industry/PLATFORM_GLOBAL compatibility;
- decide SERVICE requested-scope compatibility from `allowedScopeClasses`;
- validate HUMAN membership for persisted credential administration;
- parse presented credentials or compare verifier hashes;
- enforce CIDR;
- interpret permission profiles;
- update auth epoch or credential use;
- emit authentication audit;
- construct `VerifiedMachineEvidence`;
- implement `IdentityPort.verifyMachineCredential`;
- mutate principal/credential state;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-160, machine verification can separately source-own persisted credential
scope + SERVICE scope compatibility and then compose current credential/principal
floors. Verifier execution, CIDR, permission-profile mapping, usage/audit and
final machine evidence remain separate.
