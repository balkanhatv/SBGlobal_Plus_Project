# OperatorElevation physical RLS predicate parity prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-OPERATOR-ELEVATION-CORE-NECESSARY-FLOORS-001`  
**Verified synchronized basis:** `8347b24681e78ad2a687965c695698f2f726fa8a` / tree `e34c5ab8687bb927c21dcf11433c8cf831370740`  
**Scope:** physical PostgreSQL acceptance only after DD-152.

## Source reconciliation

Migration 0029 owns the ordinary application current-read policy for
`core_authz.operator_elevation`. Its USING predicate requires:

- exact selected row id from transaction-local `app.operator_elevation_id`;
- exact `operator_principal_id = app.principal_id`;
- exact `tenant_id = app.tenant_id`;
- persisted NULL Industry target or exact `industry_context_id = app.industry_context_id`;
- `status='ACTIVE'`;
- `starts_at <= now()`;
- `expires_at > now()`.

DD-148, DD-149 and DD-151 mirror the time/status, subject/target and selected-id
parts in pure Core. DD-150 additionally requires verified interactive
PLATFORM_OPERATOR identity, which PostgreSQL RLS itself cannot infer from an id.

The ordinary application role already has SELECT only through forced RLS.
DD-146 acceptance proves that no row is visible when elevation scope is empty.
DD-152 deliberately does not activate SQL elevation scope.

## Determination

One bounded acceptance prerequisite is source-complete:

> Prove on a real migrated PostgreSQL database that migration 0029's physical
> ordinary-application RLS current-read predicate behaves exactly as documented
> when transaction-local settings are supplied directly inside an isolated test.

This is verification only. It does not create a runtime path that selects,
trusts or injects an elevation id.

## Authorized DD-153 boundary

Add one PostgreSQL acceptance file only. It may create disposable fixtures and
set transaction-local test settings directly through `PostgresDatabase`.

It must not modify production runtime source, RequestContext, RequestScopedSql,
migrations, roles, grants or RLS.

## Acceptance target

- **OPELEV-RLS-PG-001** — exact id + principal + Tenant + ACTIVE current window makes Tenant-Core row visible.
- **OPELEV-RLS-PG-002** — exact Industry-targeted row is visible only under the exact Industry setting.
- **OPELEV-RLS-PG-003** — wrong selected elevation id yields zero rows.
- **OPELEV-RLS-PG-004** — wrong principal or Tenant yields zero rows.
- **OPELEV-RLS-PG-005** — wrong/missing Industry yields zero rows for an Industry-targeted elevation while Tenant-Core NULL-Industry behavior remains migration-owned.
- **OPELEV-RLS-PG-006** — PENDING/REVOKED/EXPIRED-by-time rows remain invisible even when id/principal/target settings match.
- **OPELEV-RLS-PG-007** — empty elevation setting keeps ordinary application visibility closed and the app role remains unable to mutate the control-plane table.

Expected suite delta: Core remains 346; PostgreSQL increases from 469 to 476.

## Explicitly unclaimed

DD-153 does **not**:

- add `operatorElevationId` to RequestContext;
- let RequestScopedSql populate `app.operator_elevation_id`;
- choose/discover/mint/trust an elevation id;
- accept client-selected ids as authoritative;
- call IdentityPort or prove PLATFORM_OPERATOR type inside PostgreSQL;
- interpret permission profiles or approval/purpose/ticket policy;
- decide step-up/MFA;
- construct AuthorizationDecision/effective permissions;
- grant business access;
- emit elevation-use audit;
- mutate elevation state.

## Next dependency boundary

After DD-153, physical RLS parity is verified but request-time elevation remains
inactive until trusted selection/source, step-up/profile/approval policy,
RequestContext integration, SQL scope injection and mandatory audit are
separately source-owned.
