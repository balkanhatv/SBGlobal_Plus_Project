# API Credential requested-scope floor prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-CURRENT-MACHINE-PRINCIPAL-FLOOR-001`  
**Verified synchronized basis:** `7acfa70bfc9ba0488ea7b729a75a00c3aed0b0ee` / tree `e6281e06db44002d97e53728aaae9e2f64854d7b`  
**Scope:** next bounded machine-credential prerequisite after DD-160.

## Source reconciliation

DD-03 owns the runtime machine-scope rules:

- final `VerifiedMachineEvidence` exposes fixed Tenant binding, allowed Industry
  Context ids and allowed scope classes;
- the machine scope allowlist is enforced again during RequestContext resolution;
- `PLATFORM_GLOBAL` does not grant Tenant scope;
- `TENANT_CORE` does not grant `TENANT_INDUSTRY`;
- generic machine evidence grants no `EXPLICIT_CROSS_CONTEXT` authority.

Migration 0034 owns persisted API Credential scope integrity:

- platform-global credential: no Tenant, no Industry, no Tenant Industry allowlist,
  SERVICE principal only, and SERVICE must allow `PLATFORM_GLOBAL`;
- Tenant-Core credential: exact Tenant, no persisted Industry;
- Tenant-Industry credential: exact Tenant + persisted Industry;
- a Tenant-Core credential may carry exact same-Tenant
  `allowed_industry_context_ids`;
- an Industry-scoped credential cannot widen to a sibling Industry;
- SERVICE principal must be allowlisted for the credential's persisted scope.

Migration 0030's idempotency actor predicate demonstrates consumption semantics:
an Industry operation may use either the exact Industry credential or a
Tenant-Core credential whose allowed-Industry list contains that exact Industry.

RequestContextService then independently requires the final machine evidence
`allowedScopeClasses` to contain the **requested** scope and requires exact
allowed-Industry membership. Therefore a SERVICE principal allowed only
`TENANT_CORE` cannot use a Tenant-Core credential to gain
`TENANT_INDUSTRY` runtime access.

DD-147 supplies raw credential scope evidence; DD-159 supplies raw principal
type/scope metadata; DD-160 separately owns current machine-principal
admissibility.

## Determination

One deterministic server-internal requested-scope prerequisite is source-complete:

> Given already-loaded API Credential verification material, its DD-159 principal
> metadata and a server-owned requested scope target, determine only whether the
> persisted credential/principal scope evidence is compatible with that target.

This is a necessary scope predicate only.

## Authorized DD-161 boundary

Implement server-internal helper:

`matchesApiCredentialRequestedScopeFloor(material, principal, target)`.

The target contains:

- `scopeClass: PLATFORM_GLOBAL | TENANT_CORE | TENANT_INDUSTRY | EXPLICIT_CROSS_CONTEXT`;
- optional `tenantId`;
- optional `industryContextId`.

It must:

1. require `principal.id === material.principalId`;
2. validate UUID shape for present credential/principal/request target ids;
3. PLATFORM_GLOBAL requires no requested Tenant/Industry, no persisted
   Tenant/Industry/allowed-Industry ids, principal type SERVICE and
   `allowedScopeClasses` containing `PLATFORM_GLOBAL`;
4. TENANT_CORE requires exact requested/persisted Tenant equality, no requested
   Industry and no persisted credential Industry; SERVICE additionally requires
   requested-scope allowlist entry `TENANT_CORE`;
5. TENANT_INDUSTRY requires exact requested/persisted Tenant and a requested
   Industry, then either exact persisted Industry equality or Tenant-Core
   credential allowlist membership; SERVICE additionally requires requested
   scope allowlist entry `TENANT_INDUSTRY`;
6. API_CLIENT does not invent SERVICE allowlist requirements;
7. EXPLICIT_CROSS_CONTEXT always fails;
8. malformed target shapes fail closed;
9. leave material, principal and target unchanged.

## Acceptance target

- **APICRED-SCOPE-001** — allowlisted platform SERVICE + platform credential matches PLATFORM_GLOBAL only.
- **APICRED-SCOPE-002** — Tenant-Core API_CLIENT/SERVICE exact Tenant target matches, with SERVICE requiring TENANT_CORE allowlist.
- **APICRED-SCOPE-003** — exact Tenant-Industry credential matches exact Tenant/Industry, with SERVICE requiring TENANT_INDUSTRY allowlist.
- **APICRED-SCOPE-004** — Tenant-Core credential may reach only an explicitly allowed exact Industry; SERVICE still requires TENANT_INDUSTRY requested-scope allowlist.
- **APICRED-SCOPE-005** — principal-id mismatch, Tenant mismatch, sibling/non-allowlisted Industry and invalid platform shape fail closed.
- **APICRED-SCOPE-006** — EXPLICIT_CROSS_CONTEXT and malformed UUID/target shapes fail closed.
- **APICRED-SCOPE-007** — lifecycle/hash/CIDR/profile/version/use/currentness evidence is not interpreted and inputs are not mutated.

Expected Core/server suite delta: +7, from 374 to 381. PostgreSQL remains 497.

## Explicitly unclaimed

DD-161 does **not**:

- evaluate DD-158 lifecycle or DD-160 current-principal floor on the caller's behalf;
- verify the principal's current status;
- parse presented credentials or compare verifier hashes;
- enforce CIDR/network policy;
- interpret `permissionProfileId`;
- update `lastUsedAt` or auth epoch;
- emit authentication/use audit;
- construct final `VerifiedMachineEvidence`;
- implement `IdentityPort.verifyMachineCredential`;
- mutate principal/credential state;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-161, current credential lifecycle, current machine principal and
requested-scope compatibility can be composed as raw necessary floors. Presented
token parsing/verifier execution, CIDR, permission-profile mapping, usage/audit
and final machine evidence remain separate.
