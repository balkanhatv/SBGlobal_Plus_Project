# OperatorElevation subject/target binding floor prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-OPERATOR-ELEVATION-TIME-STATUS-FLOOR-001`  
**Verified synchronized basis:** `daaa4d5079f5b1b501b7c52d35804a44f6abe8f4` / tree `0f2967cf9225d3169a39cedfc956b111de0c9276`  
**Scope:** next bounded runtime prerequisite after DD-148.

## Source reconciliation

Migration 0029's ordinary-application OperatorElevation current-read RLS requires,
in addition to exact selected elevation id and the DD-148 status/time floor:

- `operator_principal_id = current_principal_id()`;
- `tenant_id = current_tenant_id()`;
- `industry_context_id IS NULL OR industry_context_id = current_industry_context_id()`.

DD-05 §6–§7 owns the same operator/Tenant/optional Industry target concept.
DD-146 already exposes the persisted identifiers as immutable metadata.

## Determination

One further pure necessary predicate is source-complete:

Given already-loaded OperatorElevation metadata and already-verified server-owned
principal/Tenant/optional Industry identifiers, determine whether the persisted
subject/target fields satisfy migration 0029's exact binding floor.

A null persisted Industry target is Tenant-wide for this **elevation-record
predicate** and therefore matches either Tenant Core or a same-Tenant Industry
request. A non-null persisted Industry target requires that exact current Industry.

This helper is not an access decision and does not prove the input identifiers
were themselves resolved through a trusted request flow.

## Authorized DD-149 boundary

Implement only deterministic Core helper:

`matchesOperatorElevationSubjectTargetFloor(metadata,input)`

where input contains:
- `operatorPrincipalId`;
- `tenantId`;
- optional `industryContextId`.

It must:

1. require exact operator-principal equality;
2. require exact Tenant equality;
3. if persisted `industryContextId` exists, require exact input Industry equality;
4. if persisted `industryContextId` is absent, not require an Industry id;
5. fail closed on malformed UUID inputs or persisted identifiers;
6. not inspect status/time/purpose/ticket/approver/permission-profile fields;
7. not mutate metadata/input.

## Acceptance target

- **OPELEV-BIND-001** — exact operator + Tenant for Tenant-wide elevation matches.
- **OPELEV-BIND-002** — Tenant-wide elevation also matches same-Tenant Industry input.
- **OPELEV-BIND-003** — exact Industry-targeted elevation matches exact Industry.
- **OPELEV-BIND-004** — sibling/missing Industry fails for Industry-targeted elevation.
- **OPELEV-BIND-005** — operator or Tenant mismatch fails.
- **OPELEV-BIND-006** — malformed UUID evidence fails closed.
- **OPELEV-BIND-007** — status/time/purpose/profile evidence is ignored and inputs remain immutable.

Expected Core suite delta: +7, from 318 to 325. PostgreSQL remains 469.

## Explicitly unclaimed

DD-149 does **not**:
- select/trust an elevation id;
- establish that the principal is an authenticated interactive PLATFORM_OPERATOR;
- resolve Tenant/Industry lifecycle or Data Home;
- evaluate DD-148 time/status floor on the caller's behalf;
- interpret permission profile or approval/purpose/ticket policy;
- set `app.operator_elevation_id`;
- modify RequestContext/RequestScopedSql;
- grant access or return AuthorizationDecision;
- audit elevation use;
- mutate elevation state;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-148 + DD-149, request-time elevation remains blocked on trusted
elevation-id selection, interactive platform-operator identity binding,
permission-profile evaluation, approval/purpose policy, immutable RequestContext
integration, transaction-local SQL elevation setting and mandatory audit.
