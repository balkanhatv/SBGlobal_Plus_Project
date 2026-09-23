# OperatorElevation metadata reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-API-CREDENTIAL-METADATA-READ-001`  
**Verified synchronized basis:** `25e7311935ea1ace23fab853f4a47fc5f8c6d2c3` / tree `6c13098cf3079b7111f830197330a86d54e0458a`  
**Post-DD-145 remainder audit:** `196a2497af27c8cf3cc586e45ea104fd5af4dada`  
**Scope:** first source-owned runtime prerequisite after the independent raw application-reader inventory is exhausted.

## Source reconciliation

DD-05 §7, DD-16 §17 and migration 0029 were reconciled with the current
RequestContext / RequestScopedSql path and the repository's fixed-role database
adapter pattern.

Migration 0029 already owns a dedicated non-login, non-superuser,
NOBYPASSRLS role:

- `sbg_control_plane_rw`.

It also owns a dedicated `operator_elevation_control_policy` that permits that
role to read/control `core_authz.operator_elevation` without depending on the
ordinary application transaction-local `app.operator_elevation_id` predicate.

The same migration gives the Control Plane schema usage plus
SELECT/INSERT/UPDATE/DELETE on OperatorElevation. The ordinary application role
has SELECT, but its row visibility requires exact transaction-local elevation
id + principal + Tenant/optional Industry + active time window.

## Determination

A concrete **OperatorElevation metadata-only exact-id reader through a fixed
Control Plane database boundary** is source-complete.

This is intentionally different from enabling operator elevation inside normal
Tenant requests.

The current application `RequestScopedSql` continues to set
`app.operator_elevation_id` to empty, and DD-146 must not change that.

## Physical source boundary

`core_authz.operator_elevation` owns:

- id;
- operator principal id;
- Tenant id;
- optional Industry Context id;
- raw purpose code;
- optional ticket reference;
- optional approved-by principal id;
- starts-at;
- expires-at;
- raw constrained status = PENDING / ACTIVE / REVOKED / EXPIRED;
- permission-profile id;
- created-at;
- optional revoked-at.

Physical checks guarantee expiry after start and revoked timestamp consistency.
Those checks remain database-owned evidence; the reader does not convert them
into current authorization.

## Authorized infrastructure prerequisite

Implement a narrowly fixed `PostgresControlPlaneDatabase` using the same
repository pattern as existing fixed-role database adapters:

1. begin one transaction;
2. `SET LOCAL ROLE sbg_control_plane_rw`;
3. require runtime and login roles to be non-superuser / non-BYPASSRLS;
4. `SET LOCAL row_security = on`;
5. clear application Tenant/Industry/scope/principal/elevation settings before work;
6. expose only the generic internal `SqlDatabase` transaction contract;
7. reset scope settings before returning pooled connections;
8. no automatic write retry.

This class does not itself create a Control Plane API or authorize any action.

## Authorized DD-146 reader boundary

Implement only:

1. immutable typed `OperatorElevationMetadata`;
2. `OperatorElevationMetadataReadPort.loadById(id)`;
3. `PostgresOperatorElevationMetadataStore` using the fixed Control Plane database;
4. one parameterized exact UUID read;
5. projection of all persisted non-secret metadata listed above;
6. immutable returned record;
7. real PostgreSQL acceptance under the fixed `sbg_control_plane_rw` role.

The reader may return PENDING, future, EXPIRED or REVOKED rows. It must not
filter by current time or status, because that would turn raw evidence into an
authorization decision.

## Acceptance target

- **OPELEV-META-PG-001** — exact Tenant-Core elevation metadata preserves raw ownership/purpose/profile/time evidence.
- **OPELEV-META-PG-002** — exact Tenant-Industry target remains exact and does not become sibling/cross-context authority.
- **OPELEV-META-PG-003** — PENDING/future, EXPIRED and REVOKED rows remain readable as historical/control-plane metadata without current-usability semantics.
- **OPELEV-META-PG-004** — nullable approver/ticket/revocation and schema-valid empty purpose text remain raw evidence.
- **OPELEV-META-PG-005** — fixed Control Plane role can read metadata while ordinary app visibility remains blocked without a verified elevation session setting.
- **OPELEV-META-PG-006** — missing exact UUID returns `null`; malformed ids fail closed before SQL.
- **OPELEV-META-PG-007** — schema-owned Control Plane DML does not become DD-146 mutation/approval/authorization authority; the port is exact-read only.

Expected PostgreSQL suite delta: +7, from 455 to 462. Core count should remain
311 unless a new pure contract test is required.

## Explicitly unclaimed

DD-146 does **not**:

- resolve/select an elevation for an incoming request;
- accept client input directly into `app.operator_elevation_id`;
- modify `RequestContext`, `ContextResolutionInput` or `RequestScopedSql`;
- decide ACTIVE/current/effective elevation;
- enforce or interpret `permission_profile_id`;
- decide whether approval is required/satisfied;
- validate ticket/purpose policy;
- create/approve/revoke/expire elevations;
- grant Tenant or Industry access;
- bypass persistent role/membership rules;
- emit the mandatory operator-elevation audit trail;
- expose a public/admin route or UI;
- change migrations, roles, grants, RLS or product policy.

## Next decision

If exact-head implementation gates pass, canonicalize DD-146 strictly as an
**OperatorElevation Control Plane metadata reader prerequisite**.

A later elevation-activation/runtime slice must still separately source-own:
trusted elevation selection, interactive PLATFORM_OPERATOR identity binding,
Tenant/Industry target bootstrap order, permission-profile evaluation,
approval/purpose policy, revocation/expiry race handling, immutable
RequestContext injection, transaction-local `app.operator_elevation_id`, and
mandatory audit behavior.
