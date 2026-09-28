# API Credential verification-material reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-OPERATOR-ELEVATION-METADATA-READ-001`  
**Verified synchronized basis:** `c010e30914ff55a7eb16f93b5eebbb181cb62738` / tree `d218962f999afd25abbbb50ae10f03f28eb4e050`  
**Scope:** next bounded Identity runtime prerequisite after DD-146.

## Source reconciliation

DD-03 defines `verifyMachineCredential(credential)` and the APICredential
physical contract. DD-16 §4 requires verifier-style API credentials to persist
only a one-way Argon2id/approved verifier hash plus a **prefix for lookup**, with
fixed Tenant/scope, optional Industry allowlist/CIDR, rotation/revocation,
expiry policy and audit.

Migration 0003 owns:
- `core_identity.api_credential.key_prefix text NOT NULL`;
- `secret_hash text NOT NULL`;
- lifecycle/status/scope/version metadata;
- a **unique** `api_credential_key_prefix_uq` index.

Migration 0029 removes ordinary app/worker/monitor access to the credential
table and grants the dedicated NOBYPASSRLS `sbg_identity_service_rw` role
SELECT/INSERT/UPDATE through an explicit pre-context Identity policy.

Migrations 0030/0034 own final physical Tenant/Industry/service-principal scope
integrity. DD-145 already proves the fixed Identity database boundary and
non-secret exact-id metadata projection.

## Determination

A narrow **verification-material candidate lookup by exact persisted key
prefix** is source-complete.

It is a prerequisite to, not an implementation of,
`IdentityPort.verifyMachineCredential`.

The repository still does not define enough to safely invent:
- the external presented API-key wire format;
- how a raw credential string is split into prefix + verifier secret;
- exact Argon2id/approved verifier algorithm parameters and upgrade behavior;
- constant-time/algorithm library contract;
- CIDR source normalization and request-IP matching semantics;
- last-used update/audit ordering;
- rotation overlap/grace semantics;
- a complete permission-profile-to-`VerifiedMachineEvidence` mapping.

Those remain blocked.

## Authorized DD-147 boundary

Implement a **server-internal** read contract, not a Core/client DTO:

1. `ApiCredentialVerificationMaterial` stays under `src/server/identity`;
2. exact `loadByKeyPrefix(keyPrefix)` only;
3. use existing `PostgresIdentityDatabase` / `sbg_identity_service_rw`;
4. parameterized equality on the unique persisted `key_prefix`;
5. return the opaque persisted `secret_hash` plus only the persisted scope,
   status, expiry, CIDR, allowed-Industry and version evidence required by a
   later verifier;
6. preserve nullable `allowed_cidrs` as absence;
7. preserve bigint `credential_version` as signed decimal text;
8. do not export the verification material from `src/core/index.ts`;
9. do not log, serialize to transport, or expose the verifier hash.

The read may return ACTIVE, SUSPENDED, REVOKED or EXPIRED credentials and does
not itself decide usability.

## Acceptance target

- **APICRED-VERIFY-PG-001** — exact unique prefix returns opaque verifier material plus physical Tenant-Core scope evidence.
- **APICRED-VERIFY-PG-002** — Tenant-Industry candidate preserves exact Industry and allowed-Industry evidence without widening.
- **APICRED-VERIFY-PG-003** — PLATFORM_GLOBAL service credential material is readable only through the fixed Identity-service boundary.
- **APICRED-VERIFY-PG-004** — SUSPENDED/REVOKED/expired candidates remain raw material; reader does not decide authentication.
- **APICRED-VERIFY-PG-005** — nullable CIDR and exact signed bigint credential-version evidence remain lossless.
- **APICRED-VERIFY-PG-006** — unknown exact prefix returns `null`; unique-index ownership prevents ambiguous matches.
- **APICRED-VERIFY-PG-007** — ordinary app direct SELECT stays revoked and the DD-147 surface exposes no verify/authenticate/create/rotate/revoke/update/delete/list/search method.

Expected PostgreSQL suite delta: +7, from 462 to 469. Core count should remain
311 because the contract is intentionally server-internal.

## Explicitly unclaimed

DD-147 does **not**:

- implement `IdentityPort.verifyMachineCredential`;
- parse a presented credential string;
- choose a prefix length/encoding/delimiter;
- compare or validate Argon2id/other verifier hashes;
- choose crypto parameters or libraries;
- decide ACTIVE/current/expired/revoked usability;
- enforce CIDR/network policy;
- update `last_used_at`;
- emit credential-use/authentication audit;
- rotate/revoke/create/update credentials;
- resolve `permission_profile_id`;
- construct `VerifiedMachineEvidence`;
- authorize Tenant/Industry/PLATFORM_GLOBAL access;
- expose verifier material to Core DTOs, transports, logs or UI;
- change migrations, schema, roles, grants, RLS or product policy.

## Next decision

If the exact-head implementation gates pass, canonicalize DD-147 only as a
**server-internal API Credential verification-material source prerequisite**.

A later machine-verifier slice must separately source-own presented-token
format/parsing, approved verifier execution, CIDR handling, lifecycle decision,
usage/audit mutation and final `VerifiedMachineEvidence` construction.
