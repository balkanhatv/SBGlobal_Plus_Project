# API Credential principal metadata reader prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-API-CREDENTIAL-CURRENT-LIFECYCLE-FLOOR-001`  
**Verified synchronized basis:** `47dfeb57dded8948f122a7c8d5c66a5add98190c` / tree `e19fbfa8247510daf2b851456444c486d0bc7e37`  
**Scope:** next bounded machine-credential prerequisite after DD-158.

## Source reconciliation

DD-03 defines `PlatformPrincipal` and requires `VerifiedMachineEvidence` to
contain machine principal type plus allowed scope classes. DD-147 verification
material contains only the credential's persisted `principalId`; it does not
contain current principal type/status/service scope metadata.

Migration 0003 owns `core_identity.platform_principal`:

- id;
- principal_type = HUMAN / API_CLIENT / SERVICE / PLATFORM_OPERATOR;
- status = PENDING / ACTIVE / SUSPENDED / REVOKED;
- auth_epoch bigint;
- service_code / owning_module for SERVICE;
- allowed_scope_classes text[].

Migration 0029 constrains allowed scope values and grants the fixed
`sbg_identity_service_rw` role SELECT/INSERT/UPDATE on the Identity directory
through a pre-context forced-RLS policy. General application writes are revoked.

Migrations 0030/0034 consume current principal type/status/allowed scopes when
validating API Credential persistence. Those triggers prove ownership of the
physical principal/scope relationship, but a raw read must not itself become
machine-authentication or authorization.

## Determination

One server-internal exact-id principal metadata source is source-complete.

It is a prerequisite to current machine-principal validation and eventual
`VerifiedMachineEvidence`, not the validation itself.

## Authorized DD-159 boundary

Implement only:

1. server-internal immutable `MachinePrincipalMetadata`;
2. exact `loadById(principalId)` read port;
3. PostgreSQL store through existing `PostgresIdentityDatabase`;
4. parameterized exact UUID lookup;
5. project only id, principal type, raw status, exact bigint auth epoch text,
   optional service code/owning module, optional immutable allowed-scope array;
6. exclude display name, email and mobile metadata;
7. do not export this server-internal material through Core/client DTOs;
8. do not reinterpret status/type/scope evidence into authentication success.

## Acceptance target

- **MACHPRINC-PG-001** — exact ACTIVE API_CLIENT principal raw metadata is readable.
- **MACHPRINC-PG-002** — exact ACTIVE SERVICE principal preserves service code, owning module and allowed scopes.
- **MACHPRINC-PG-003** — HUMAN and PLATFORM_OPERATOR principal types may be returned as raw evidence but are not accepted as machine evidence.
- **MACHPRINC-PG-004** — PENDING/SUSPENDED/REVOKED statuses remain raw evidence without current-principal decision.
- **MACHPRINC-PG-005** — nullable allowed scopes and exact signed bigint auth epoch remain lossless and immutable.
- **MACHPRINC-PG-006** — missing id returns null; malformed UUID fails closed before SQL.
- **MACHPRINC-PG-007** — fixed Identity-service role can read the directory while the DD-159 surface exposes no create/update/delete/list/search/authenticate method and no PII projection.

Expected Core count remains 367. PostgreSQL increases from 490 to 497.

## Explicitly unclaimed

DD-159 does **not**:

- decide whether the principal is currently valid for machine authentication;
- map HUMAN/PLATFORM_OPERATOR/API_CLIENT/SERVICE into final machine evidence;
- combine principal evidence with DD-158 lifecycle currentness;
- decide Tenant/Industry/PLATFORM_GLOBAL scope authorization;
- interpret credential permission profiles;
- parse credentials or compare verifier hashes;
- enforce CIDR;
- update auth epoch or credential last-used evidence;
- emit authentication audit;
- construct `VerifiedMachineEvidence`;
- implement `IdentityPort.verifyMachineCredential`;
- mutate principal or credential state;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-159, machine verification may separately source-own a pure
current-machine-principal floor and then scoped evidence composition. Presented
token parsing, hash verification, CIDR, permission-profile mapping, usage/audit
and final authentication remain blocked until explicitly owned.
