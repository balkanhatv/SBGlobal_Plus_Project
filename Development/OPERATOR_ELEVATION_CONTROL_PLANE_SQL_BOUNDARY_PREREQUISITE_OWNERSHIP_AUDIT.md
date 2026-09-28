# OperatorElevation fixed Control Plane SQL boundary prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-OPERATOR-ELEVATION-PERSISTED-LIFECYCLE-INTEGRITY-001`  
**Verified synchronized basis:** `7348f2a40f53dfbe0c342357d5b8fe7a0c9da621` / tree `29a1d32b0c562e9e73641fadb65218a83915118f`  
**Scope:** dedicated server-side Control Plane SQL adapter hygiene only.

## Source reconciliation

Migration 0029 creates and hardens `sbg_control_plane_rw` as a fixed NOLOGIN,
non-superuser, non-BYPASSRLS role. It grants that role explicit CRUD on
`core_authz.operator_elevation` while ordinary `sbg_app_rw` retains SELECT
only through forced RLS.

The database verification for migration 0029 already proves the physical grant
matrix. Runtime source also contains `PostgresControlPlaneDatabase`, an
internal-only adapter that:

- begins a transaction;
- executes `SET LOCAL ROLE sbg_control_plane_rw`;
- enables `SET LOCAL row_security = on`;
- verifies both runtime and login roles are not superuser/BYPASSRLS;
- clears Tenant/Industry/scope/principal/elevation transaction-local settings
  before any delegated work;
- closes leaked transaction handles after work;
- RESETs the same settings before pooled connection reuse;
- destroys a connection when rollback/cleanup fails.

No transport/controller currently uses this adapter as an OperatorElevation
activation API.

## Determination

One bounded server acceptance prerequisite is source-complete:

> Prove the fixed Control Plane SQL adapter cannot silently run under another
> role, inherit stale request/elevation scope, leak an active transaction handle
> or return a connection to the pool after cleanup failure.

This proves adapter hygiene only. It does not authorize any OperatorElevation
mutation or request-time activation.

## Authorized DD-157 boundary

Add server acceptance tests only for `PostgresControlPlaneDatabase`. No
production runtime source change is authorized unless the existing adapter
fails its documented contract.

## Acceptance target

- **OPELEV-CP-SQL-001** — transaction pins `sbg_control_plane_rw` and RLS on before delegated work.
- **OPELEV-CP-SQL-002** — startup clear includes empty Tenant/Industry/scope/principal/elevation settings before work.
- **OPELEV-CP-SQL-003** — unsafe role verification fails closed with a safe database error.
- **OPELEV-CP-SQL-004** — cleanup RESET includes `app.operator_elevation_id` before reusable release.
- **OPELEV-CP-SQL-005** — elevation RESET cleanup failure destroys the pooled connection after a committed result.
- **OPELEV-CP-SQL-006** — leaked transaction handles cannot query after the adapter returns the connection.
- **OPELEV-CP-SQL-007** — connection/setup/query failures expose only safe database codes and do not leak SQL/provider diagnostics.

Expected suite delta: Core 353 -> 360. PostgreSQL remains 490.

## Explicitly unclaimed

DD-157 does **not**:

- add create/approve/activate/revoke/expire OperatorElevation services;
- decide transition authorization;
- choose or trust an elevation id;
- populate RequestContext or RequestScopedSql elevation scope;
- interpret permission profiles/effective permissions;
- decide step-up/MFA or broader approval/purpose/ticket policy;
- grant access;
- emit mandatory elevation-use audit;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-157, the fixed Control Plane SQL adapter boundary is explicitly
verified. OperatorElevation mutation/activation still requires separately
source-owned service contracts, transition authorization, trusted selection,
policy evaluation, request-scope integration and mandatory audit.
