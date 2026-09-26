# OperatorElevation selected-id binding floor prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-OPERATOR-ELEVATION-VERIFIED-PLATFORM-OPERATOR-FLOOR-001`  
**Verified synchronized basis:** `53ec1f3bc7d6441d1cff0632cd3abb5eb00b9c53` / tree `10df135babc843c6ef35e69e17b652046bc5a57c`  
**Scope:** next bounded OperatorElevation runtime prerequisite after DD-150.

## Source reconciliation

Migration 0029's ordinary application OperatorElevation current-read policy begins
with an exact selected-elevation-id predicate:

`id::text = NULLIF(current_setting('app.operator_elevation_id', true), '')`.

The same policy then requires the subject/target predicates isolated by DD-149
and the ACTIVE/time predicates isolated by DD-148.

DD-146 exposes immutable persisted `OperatorElevationMetadata.id`.
DD-150 separately owns verified interactive PLATFORM_OPERATOR identity.

## Determination

One narrow deterministic prerequisite is source-complete:

> Given already-loaded OperatorElevation metadata plus an already server-owned
> selected OperatorElevation UUID, determine only whether the selected id is the
> exact persisted row id required by migration 0029.

This helper does not decide where the selected id came from or whether it is
trusted. A later transport/control-plane selection flow must own that.

## Authorized DD-151 boundary

Implement only pure Core helper:

`matchesOperatorElevationSelectedIdFloor(metadata, selectedElevationId)`.

It must:

1. require valid UUID shape for persisted metadata id;
2. require valid UUID shape for selected elevation id;
3. require exact equality;
4. fail closed on empty, malformed, differently-cased/non-canonical-invalid,
   wrong or missing values;
5. ignore all operator/Tenant/Industry/status/time/purpose/approval/profile
   fields;
6. not mutate metadata or input.

## Acceptance target

- **OPELEV-SEL-001** — exact selected UUID matches persisted elevation id.
- **OPELEV-SEL-002** — different valid elevation UUID fails.
- **OPELEV-SEL-003** — empty selected id fails closed.
- **OPELEV-SEL-004** — malformed selected id fails closed.
- **OPELEV-SEL-005** — malformed persisted id fails closed.
- **OPELEV-SEL-006** — unrelated subject/target/time/policy fields do not affect this floor.
- **OPELEV-SEL-007** — helper mutates neither metadata nor selected-id input and exposes no selection/authorization behavior.

Expected Core suite delta: +7, from 332 to 339. PostgreSQL remains 469.

## Explicitly unclaimed

DD-151 does **not**:

- choose, discover, mint or trust an elevation id;
- accept a client-selected elevation id as authoritative;
- load an elevation row;
- verify PLATFORM_OPERATOR identity;
- evaluate DD-148 status/time;
- evaluate DD-149 subject/target binding;
- interpret permission profiles;
- decide approval/purpose/ticket or step-up policy;
- set `app.operator_elevation_id`;
- modify RequestContext/RequestScopedSql;
- grant access or return AuthorizationDecision;
- emit mandatory elevation-use audit;
- mutate elevation state;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-151, the migration-owned read predicates have independent pure floors
for selected id, subject/target and status/time, plus DD-150 verified operator
identity. Request-time elevation still requires source-owned selection/trust,
explicit floor composition, step-up/profile/approval policy, immutable
RequestContext integration, transaction-local SQL scope and mandatory audit.
