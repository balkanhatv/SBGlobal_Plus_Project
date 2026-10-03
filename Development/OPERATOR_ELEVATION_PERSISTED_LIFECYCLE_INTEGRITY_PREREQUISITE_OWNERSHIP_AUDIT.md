# OperatorElevation persisted lifecycle/time/scope integrity prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-OPERATOR-ELEVATION-SQL-SCOPE-HYGIENE-001`  
**Verified synchronized basis:** `eb3b85b66cc5a5996f2fb51a613c22116a2a01a2` / tree `22e31275f30e07c5a3ba965d16e44c8d282c99b3`  
**Scope:** next bounded PostgreSQL integrity acceptance after DD-155.

## Source reconciliation

Migration 0029 owns the persisted OperatorElevation table constraints:

- `expires_at > starts_at`;
- `revoked_at IS NULL OR revoked_at >= created_at`;
- `status <> 'REVOKED' OR revoked_at IS NOT NULL`;
- status is one of `PENDING | ACTIVE | REVOKED | EXPIRED`;
- Tenant + optional Industry ownership columns are protected by the generic
  `immutable_scope_ownership` BEFORE UPDATE trigger attached to every scoped
  Core/Industry table, including `core_authz.operator_elevation`.

Migration 0031 separately owns operator/approver relationship integrity and was
verified by DD-154. DD-155 verifies pooled SQL elevation-off hygiene.

## Determination

One bounded acceptance prerequisite is source-complete:

> Prove the persisted time/lifecycle constraints and immutable Tenant/Industry
> ownership of OperatorElevation on a real migrated PostgreSQL database.

This is persistence integrity only. It does not define lifecycle APIs, who may
transition state, or when request-time activation is authorized.

## Authorized DD-156 boundary

Add one PostgreSQL acceptance file only. No production runtime source,
migration, RLS, role/grant, RequestContext or RequestScopedSql change is
authorized unless the existing database contract fails.

## Acceptance target

- **OPELEV-LIFE-PG-001** — a valid PENDING elevation with `expires_at > starts_at` persists.
- **OPELEV-LIFE-PG-002** — equal or reversed start/expiry is rejected.
- **OPELEV-LIFE-PG-003** — `revoked_at < created_at` is rejected.
- **OPELEV-LIFE-PG-004** — REVOKED without `revoked_at` is rejected.
- **OPELEV-LIFE-PG-005** — REVOKED with `revoked_at >= created_at` persists.
- **OPELEV-LIFE-PG-006** — persisted `tenant_id` cannot be changed by UPDATE.
- **OPELEV-LIFE-PG-007** — persisted `industry_context_id` cannot be changed by UPDATE.

Expected suite delta: Core remains 353; PostgreSQL increases 483 -> 490.

## Explicitly unclaimed

DD-156 does **not**:

- implement create/approve/activate/revoke/expire APIs;
- decide who may transition lifecycle state;
- define automatic expiry mutation;
- trust/select an elevation id;
- activate request-time elevation;
- interpret permission profiles;
- decide step-up/MFA or broader approval/purpose/ticket policy;
- inject RequestContext/SQL elevation scope;
- grant access;
- emit mandatory elevation-use audit;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-156, persisted lifecycle/time/scope integrity is explicitly verified.
Request-time elevation remains blocked on trusted activation/source, governed
policy evaluation, RequestContext/SQL activation and mandatory audit.
