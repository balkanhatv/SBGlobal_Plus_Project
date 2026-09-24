# API Credential current lifecycle floor prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-OPERATOR-ELEVATION-CONTROL-PLANE-SQL-BOUNDARY-001`  
**Verified synchronized basis:** `9fe2602df7df501a224e7f8d04f16a1f2496ab5a` / tree `aff2b9866420b573eb3193cc6d844592f65b3311`  
**Scope:** next bounded machine-credential prerequisite after DD-147 verifier-material lookup.

## Source reconciliation

DD-03 canonical evaluation requires the API credential itself to be valid before
entitlement/RBAC/ABAC evaluation. DD-16 §4 requires API credential
rotation/revocation/expiry policy.

Migration 0003 owns persisted credential statuses:
`ACTIVE | SUSPENDED | REVOKED | EXPIRED`.

Migration 0030 contains a concrete persisted API Credential consumption
predicate that accepts the credential only when:

- `credential.status='ACTIVE'`; and
- `credential.expires_at IS NULL OR credential.expires_at > evaluation time`.

DD-147 already owns an internal exact-prefix verification-material source with
raw `status` and optional `expiresAt`.

The repository still does not source-own presented-token encoding, prefix
extraction, verifier-hash comparison parameters/library, CIDR matching,
permission-profile interpretation, usage mutation/audit or final
`VerifiedMachineEvidence`.

## Determination

One deterministic server-internal prerequisite is source-complete:

> Given already-loaded API Credential verification material and an explicit
> server-owned evaluation instant, determine only whether the persisted status
> and optional expiry satisfy the current lifecycle floor.

This is a necessary authentication predicate only.

## Authorized DD-158 boundary

Implement server-internal helper:

`matchesApiCredentialCurrentLifecycleFloor(material, evaluatedAt)`.

It must:

1. require `material.status === 'ACTIVE'`;
2. accept absent `expiresAt`;
3. require non-null `expiresAt > evaluatedAt`;
4. treat exact expiry boundary as expired;
5. use explicit evaluation time, never call system clock internally;
6. fail closed on malformed evaluation or persisted expiry timestamps;
7. leave verification material unchanged.

## Acceptance target

- **APICRED-LIFE-001** — ACTIVE with no expiry matches.
- **APICRED-LIFE-002** — ACTIVE before future expiry matches.
- **APICRED-LIFE-003** — exact expiry boundary fails.
- **APICRED-LIFE-004** — after expiry fails.
- **APICRED-LIFE-005** — SUSPENDED/REVOKED/EXPIRED statuses fail regardless of expiry.
- **APICRED-LIFE-006** — malformed evaluation or persisted expiry fails closed.
- **APICRED-LIFE-007** — helper ignores hash/CIDR/profile/scope/version/use metadata and mutates nothing.

Expected Core/server suite delta: +7, from 360 to 367. PostgreSQL remains 490.

## Explicitly unclaimed

DD-158 does **not**:

- parse presented credentials or extract key prefixes;
- compare `secretHash` or choose verifier algorithm/parameters/library;
- enforce CIDR/network policy;
- interpret `permissionProfileId`;
- decide Tenant/Industry/PLATFORM_GLOBAL scope authorization;
- validate principal/membership/service scope;
- update `lastUsedAt`;
- emit credential-use/authentication audit;
- construct `VerifiedMachineEvidence`;
- implement `IdentityPort.verifyMachineCredential`;
- rotate/revoke/create/update credentials;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-158, machine verification still requires source-owned presented-token
format/parsing, approved verifier execution, CIDR semantics, principal/scope and
permission-profile mapping, usage/audit behavior and final machine evidence.
