# OperatorElevation current time/status floor prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-API-CREDENTIAL-VERIFICATION-MATERIAL-READ-001`  
**Verified synchronized basis:** `53fc179a492c29226787f0391b25474690981ff3` / tree `960e33da430733bb69fed9caa360c8b03e9e553f`  
**Scope:** next bounded runtime prerequisite after DD-147.

## Source reconciliation

DD-05 §6–§7, DD-16 §17, migration 0029 and the current DD-146
`OperatorElevationMetadata` contract were reconciled.

Migration 0029 owns an exact ordinary-application current-read predicate. In
addition to exact elevation/principal/Tenant/optional Industry binding, that
predicate requires:

- `status='ACTIVE'`;
- `starts_at <= now()`;
- `expires_at > now()`.

The time boundary is explicit and asymmetric: start is inclusive; expiry is
exclusive.

## Determination

One narrow pure runtime prerequisite is source-complete:

Given already-loaded OperatorElevation metadata and an explicit server-owned
evaluation instant, determine only whether the persisted status/time fields
satisfy the migration-owned current-read time/status floor.

This result is a necessary predicate only. It is not an authorization or access
decision and does not establish principal/Tenant/Industry/profile/purpose
eligibility.

## Authorized DD-148 boundary

Implement only a deterministic Core helper:

`matchesOperatorElevationCurrentTimeStatusFloor(metadata, evaluatedAt)`.

It must:

1. require persisted `status === 'ACTIVE'`;
2. require `startsAt <= evaluatedAt`;
3. require `expiresAt > evaluatedAt`;
4. use an explicit evaluation instant rather than calling the system clock;
5. fail closed on malformed evaluation/persisted timestamps;
6. leave the input metadata unchanged.

## Acceptance target

- **OPELEV-WIN-001** — ACTIVE strictly inside the window matches.
- **OPELEV-WIN-002** — exact start boundary matches.
- **OPELEV-WIN-003** — exact expiry boundary does not match.
- **OPELEV-WIN-004** — PENDING/REVOKED/EXPIRED status never matches even when timestamps surround the evaluation instant.
- **OPELEV-WIN-005** — before-start and after-expiry instants do not match.
- **OPELEV-WIN-006** — malformed evaluation or persisted timestamps fail closed.
- **OPELEV-WIN-007** — helper does not inspect or resolve principal/Tenant/Industry/purpose/ticket/approver/permission-profile fields and does not mutate metadata.

Expected Core suite delta: +7 tests. PostgreSQL count remains 469.

## Explicitly unclaimed

DD-148 does **not**:

- select or load an elevation;
- decide exact principal/Tenant/Industry target match;
- interpret `permission_profile_id`;
- decide approval/purpose/ticket policy;
- accept client-controlled time as trusted authority;
- set `app.operator_elevation_id`;
- modify RequestContext or RequestScopedSql;
- grant access or return an AuthorizationDecision;
- create/approve/activate/revoke/expire elevations;
- emit the mandatory elevation-use audit trail;
- change migrations, RLS, roles, grants or product policy.

## Next dependency boundary

After this floor, request-time OperatorElevation remains blocked on trusted
elevation selection, interactive PLATFORM_OPERATOR identity binding, exact target
binding, permission-profile evaluation, approval/purpose policy, immutable
RequestContext injection, transaction-local elevation scope and mandatory audit.
