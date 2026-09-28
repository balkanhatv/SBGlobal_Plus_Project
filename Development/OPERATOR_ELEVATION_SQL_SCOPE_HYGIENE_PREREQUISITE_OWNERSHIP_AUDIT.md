# OperatorElevation SQL scope hygiene prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-OPERATOR-ELEVATION-RELATIONSHIP-INTEGRITY-001`  
**Verified synchronized basis:** `2551d5cbaf044a512596b08312a9b4074eb2db30` / tree `7b8f4a81dd0e7fbc88117dbe85e02f7e78b5350c`  
**Scope:** fail-closed pooled SQL elevation-scope hygiene while runtime elevation activation remains intentionally absent.

## Source reconciliation

Current runtime source deliberately does not carry an OperatorElevation id in
`RequestContext`.

`RequestScopedSql.withContext(...)` currently writes five transaction-local
settings and hardcodes the fifth value, `app.operator_elevation_id`, to the
empty string.

Both application-role `PostgresDatabase` and bootstrap-role
`PostgresContextBootstrapDatabase`:

- clear `app.operator_elevation_id` to empty at transaction start;
- RESET `app.operator_elevation_id` before a reusable pooled connection is
  released;
- destroy the connection if cleanup fails.

Existing RequestScopedSql tests incidentally assert the empty fifth parameter in
several scopes, while generic pooled-adapter tests do not explicitly lock the
OperatorElevation setting itself.

## Determination

One bounded security prerequisite is source-complete:

> Until a separately governed trusted activation contract exists, generic
> application/bootstrap SQL transactions must begin with no inherited operator
> elevation and must not return a connection carrying session-level elevation
> state.

This protects against stale pooled-session elevation leakage without creating
any elevation activation path.

## Authorized DD-155 boundary

Add server acceptance tests only. No production runtime source change is
authorized unless the existing implementation fails its stated hygiene
contract.

## Acceptance target

- **OPELEV-SQL-001** — application PostgresDatabase startup clear explicitly includes empty `app.operator_elevation_id`.
- **OPELEV-SQL-002** — application PostgresDatabase cleanup RESET explicitly includes `app.operator_elevation_id` before reusable release.
- **OPELEV-SQL-003** — application cleanup failure on the elevation RESET destroys the pooled connection.
- **OPELEV-SQL-004** — bootstrap PostgresContextBootstrapDatabase startup clear explicitly includes empty elevation scope.
- **OPELEV-SQL-005** — bootstrap cleanup RESET explicitly includes `app.operator_elevation_id` before reusable release.
- **OPELEV-SQL-006** — bootstrap cleanup failure on elevation RESET destroys the pooled connection.
- **OPELEV-SQL-007** — an extra/smuggled `operatorElevationId` property on a RequestContext-like object is ignored by RequestScopedSql; the fifth SQL parameter remains empty.

Expected suite delta: Core 346 -> 353. PostgreSQL remains 483.

## Explicitly unclaimed

DD-155 does **not**:

- add `operatorElevationId` to RequestContext;
- permit RequestScopedSql to populate elevation scope;
- choose/discover/mint/trust an elevation id;
- activate an elevation;
- evaluate DD-148…154 on behalf of a request;
- interpret permission profile, approval/purpose/ticket or step-up policy;
- grant access;
- emit mandatory elevation-use audit;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-155, pooled SQL elevation-off hygiene is explicitly verified.
Request-time elevation still requires a separately source-owned trusted
selection/activation contract, policy evaluation, RequestContext integration,
SQL injection and mandatory audit.
