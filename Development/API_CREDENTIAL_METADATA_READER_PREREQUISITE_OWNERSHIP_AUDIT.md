# API Credential metadata reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AUDIT-EVENT-READ-001`  
**Verified synchronized basis:** `5d4b3856a05ebfa26c8b8e0396f63f1fcfae5c5b` / tree `121648efe9a0a9c98ec6956641ed1656d88c1115`  
**Scope:** next independent source-complete Core persistence slice after DD-144.

## Source reconciliation

DD-03 `APICredential`, DD-16 §4, migration 0003 physical schema/FORCE-RLS,
migration 0005 platform-vs-Tenant credential scope policy, migration 0029 fixed
Identity-service role/policies/privileges, migration 0030 credential
Tenant/Industry/principal integrity, migration 0034 final PLATFORM_GLOBAL
service-principal scope floor, the existing `MachineCredentialVerifierPort`,
`PostgresIdentityDatabase`, current Identity adapters/tests and the DD-144
synchronized state were reconciled.

The remaining legacy Core table comparison also inspected
`core_authz.operator_elevation`. That table is not selected for this slice:
ordinary `RequestScopedSql` intentionally writes an empty
`app.operator_elevation_id`, while the table's current-read RLS requires an
exact elevation id plus principal/Tenant/optional-Industry/time validity.
Opening an elevation path would therefore require a separately governed
interactive elevation-resolution/authorization contract, not a raw-reader
shortcut.

## Determination

A concrete **API Credential metadata-only exact-id reader** through the existing
dedicated Identity-service database boundary is source-complete.

A concrete **machine-credential verifier is not source-complete** in this slice.
DD-16 requires a one-way Argon2id/approved verifier hash and prefix lookup, but
the current source does not pin one canonical presented-token encoding,
hash-parameter/version contract, rotation overlap rule, CIDR enforcement flow,
last-used write/audit behavior or safe verifier failure taxonomy tightly enough
to invent a production authentication adapter.

The metadata reader therefore must not select or return `secret_hash`.

## Physical source boundary

`core_identity.api_credential` owns:

- `id`;
- optional `tenant_id`;
- optional `industry_context_id`;
- `principal_id`;
- `key_prefix`;
- secret verifier `secret_hash` — **excluded from DD-145 SELECT/contract**;
- `status` = ACTIVE / SUSPENDED / REVOKED / EXPIRED;
- optional `permission_profile_id`;
- optional `expires_at`;
- optional `last_used_at`;
- optional `allowed_cidrs`;
- `credential_version bigint`;
- `created_at`;
- optional `revoked_at`;
- migration-0030 `allowed_industry_context_ids uuid[] NOT NULL DEFAULT '{}'`.

Migration 0030/0034 write-time integrity owns the physical scope/principal
constraints. Historical/read evidence is not reinterpreted as current
authorization.

## Database / privilege boundary

Migration 0029 creates the NOBYPASSRLS `sbg_identity_service_rw` path because
identity verification occurs before an application Tenant/Industry context
exists. That role receives explicit Identity-service RLS policies and
SELECT/INSERT/UPDATE on `core_identity.api_credential`; general
`sbg_app_rw`, worker and monitor roles have all direct privileges revoked.

`PostgresIdentityDatabase` already fixes the transaction role to
`sbg_identity_service_rw`, enables row security and clears all application
scope settings before service reads. DD-145 may reuse that boundary but may not
widen its role or privileges.

Because the Identity-service policy is intentionally pre-context, DD-145 is an
internal exact-id metadata read, not a caller-Tenant authorization decision and
not a transport-exposable enumeration/search surface.

## Authorized implementation boundary

Implement only:

1. immutable typed `ApiCredentialMetadata`;
2. `ApiCredentialMetadataReadPort.loadById(id)`;
3. `PostgresApiCredentialMetadataStore` through the existing
   `PostgresIdentityDatabase` / `SqlDatabase` boundary;
4. one parameterized exact UUID read;
5. metadata projection of id, physical Tenant/Industry/principal ownership,
   raw key prefix/status/permission-profile reference, expiry/last-used,
   immutable CIDR/allowed-Industry arrays, exact signed bigint credential
   version text, created/revoked timestamps;
6. **no `secret_hash` column in the SELECT or returned contract**;
7. no current-principal/session/membership/permission-profile dereference or
   revalidation during the raw metadata read;
8. Core export only as needed for the internal typed port;
9. real PostgreSQL acceptance under the fixed Identity-service role.

No migration, schema, role, grant, RLS policy, credential writer, token parser,
secret verifier, rotation/revocation workflow, authentication route or product
policy change is authorized.

## Acceptance target

- **APICRED-META-PG-001** — exact Tenant-Core credential metadata preserves physical ownership/raw evidence.
- **APICRED-META-PG-002** — exact Tenant-Industry credential preserves exact Industry plus immutable allowed-Industry evidence without widening it.
- **APICRED-META-PG-003** — PLATFORM_GLOBAL service credential metadata remains readable only through the fixed pre-context Identity-service boundary, not the general application role.
- **APICRED-META-PG-004** — `secret_hash` is absent from SELECT/contract; nullable metadata, CIDR evidence and raw key prefix/status are not reinterpreted.
- **APICRED-META-PG-005** — signed bigint credential-version evidence is preserved losslessly rather than strengthened to an invented positive/safe-JavaScript-number rule.
- **APICRED-META-PG-006** — missing exact UUID returns `null`; malformed ids fail closed before SQL.
- **APICRED-META-PG-007** — Identity schema ownership may retain SELECT/INSERT/UPDATE, while the DD-145 port exposes exact read only and no verify/create/rotate/revoke/update/delete/list/search method.

Expected PostgreSQL suite delta: +7 acceptance cases. Existing Core count remains
311 unless the new pure contract requires an additional Core-only test.

## Explicitly unclaimed

DD-145 does **not** implement `MachineCredentialVerifierPort`; parse presented
API keys; select by key prefix for authentication; expose or compare
`secret_hash`; choose Argon2 parameters; enforce CIDR at request time; decide
credential usability/currentness; resolve `permission_profile_id`; update
`last_used_at`; rotate/revoke/create credentials; audit credential use; derive
RequestContext authorization; expose credential metadata publicly; enumerate or
search credentials; or authorize operator elevation.

## Next decision

If implementation and exact-head gates pass, canonicalize as DD-145 strictly as
an **API Credential raw metadata persistence reader**. Authentication verifier
and operator-elevation behavior remain separately source-owned prerequisites.
