# DD-147 Development Verification — API Credential Verification-Material Source

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-OPERATOR-ELEVATION-METADATA-READ-001`  
**Prior synchronized/correction state basis:** `c010e30914ff55a7eb16f93b5eebbb181cb62738`

## 1. Source-first prerequisite audit

Audit commit: `5331f6c9b91879e7bde9eb5c49dc363416a37f0f`.  
Audit artifact: `Development/API_CREDENTIAL_VERIFICATION_MATERIAL_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

The audit reconciled DD-03, DD-16 §4, migration 0003's unique `key_prefix` + one-way `secret_hash`, migration 0029's fixed Identity-service role/policy/privileges, migrations 0030/0034 scope integrity, DD-145 non-secret metadata and its nullable-CIDR correction, plus the still-unimplemented `IdentityPort.verifyMachineCredential`.

The source is sufficient for exact persisted prefix lookup, but not for presented-token parsing, verifier execution, CIDR/lifecycle decision, use-audit or final machine evidence.

## 2. Bounded implementation

Implementation head: `9b0662aee55e710b256033561790609dbfa6eeaa` / tree `a4221561bb8260b9093451117ab411562cb2683b`.

Implementation surface:
- `src/server/identity/api-credential-verification-material.ts`;
- `src/server/identity/postgres-api-credential-verification-material-store.ts`;
- `tests/postgres/api-credential-verification-material-store.test.mjs`.

No Core export was added. No migration, schema, role/grant/RLS policy, IdentityPort implementation, RequestContext, transport or product policy changed.

## 3. Sensitive read boundary

The store runs only through existing `PostgresIdentityDatabase` / `sbg_identity_service_rw`, performs exact parameterized equality on the migration-owned unique key prefix, and returns opaque `secret_hash` plus persisted scope/lifecycle/version metadata.

Verifier material remains under `src/server/identity`. It is not a Core DTO and must not be logged or serialized to a transport.

ACTIVE, SUSPENDED, REVOKED and EXPIRED candidates may be returned. NULL CIDR remains absence; bigint credential version remains exact signed decimal text.

## 4. Exact implementation-head CI

- Core Service Verify run `35910454652`, Core job `107348661620`: **SUCCESS**, **311/311 Core**, 0 failed/skipped.
- Same run, PostgreSQL/RLS job `107348662088`: **SUCCESS**, **469/469 PostgreSQL**, including `APICRED-VERIFY-PG-001…007`, 0 failed/skipped.
- Database Verify run `35910454475`, job `107348664100`: **SUCCESS**.
- Web Boundary Verify run `35910454504`, job `107348660983`: **SUCCESS**.

## 5. Canonical DD / acceptance traceability

Canonical commit: `539524aaaf93ef14d72c0165163f6a5bd1c660cf` / tree `0a56b0d946e8090809f32cb4f7d41587577794fb`.

It adds exactly one DD-147 decision, one DD-147 acceptance block and one DD-147 changelog entry.

## 6. Promotion invariant gate

- Core run `35910799265`, Core job `107349828531`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL job `107349828859`: **SUCCESS**, **469/469 PostgreSQL**, including `APICRED-VERIFY-PG-001…007`.
- Database run `35910799281`, job `107349828748`: **SUCCESS**.
- Web run `35910799187`, job `107349828182`: **SUCCESS**.
- Direct DD-18 recount: **147 definitions / 147 unique / DD-001…DD-147 / no gaps / no duplicates**.
- Stable product invariants: **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirement IDs/text**.
- Database inventory remains **47 migrations / 41 SQL verification files**.

This gate authorizes `DEV-API-CREDENTIAL-VERIFICATION-MATERIAL-READ-001`; it does not implement machine authentication.

## 7. Explicitly unclaimed

DD-147 does not implement `IdentityPort.verifyMachineCredential`; parse presented API keys; choose prefix extraction format; compare hashes; choose Argon2/crypto parameters/library; enforce CIDR; decide lifecycle usability; update last-used; audit credential use; resolve permission profiles; construct `VerifiedMachineEvidence`; grant scope access; or expose verifier material outside the trusted Identity server boundary.

## 8. Safety

- Forward-only repository mutation; no force-push.
- `main` remains unmerged.
- RawSourceCorpus remains untouched.
- PR #2 remains draft/review-only unless explicitly authorized.
