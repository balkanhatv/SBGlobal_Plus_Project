# DD-145 Development Verification — API Credential Metadata-Only Reader

**Date:** 2026-09-23  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-AUDIT-EVENT-READ-001`  
**Prior DD-144 synchronized state basis:** `5d4b3856a05ebfa26c8b8e0396f63f1fcfae5c5b`

## 1. Source-first ownership audit

Fresh legacy Core persistence reconciliation selected `core_identity.api_credential` metadata as the next source-complete bounded slice.

Audit commit: `8545a72ab4334c78b0416f7fc217f938c8be779d`.  
Audit artifact: `Development/API_CREDENTIAL_METADATA_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

The audit reconciled DD-03 APICredential, DD-16 §4, migration 0003 physical schema/FORCE-RLS, migration 0005 platform-vs-Tenant scope policy, migration 0029 fixed Identity-service role/policies/privileges, migration 0030 Tenant/Industry/principal integrity, migration 0034 final PLATFORM_GLOBAL service-principal floor, the existing `MachineCredentialVerifierPort`, `PostgresIdentityDatabase`, and current Identity adapters/tests.

`core_authz.operator_elevation` was also inspected and rejected for this slice because ordinary `RequestScopedSql` intentionally sets an empty `app.operator_elevation_id`; opening it would require a separately governed interactive elevation-resolution/authorization path.

## 2. Bounded implementation

Implementation head: `031b4068685172f5a9c6c461f5ab73e237737e27` / tree `8c8a9a4c21653e7ef4d5962eaac23bdd7412acb8`.

Implementation surface:
- `src/core/identity/api-credential-metadata.ts`;
- `src/server/identity/postgres-api-credential-metadata-store.ts`;
- `tests/postgres/api-credential-metadata-store.test.mjs`;
- `src/core/index.ts` export.

The SQL projection excludes `secret_hash`. No migration, schema, role/grant/RLS policy, credential writer, verifier, route or product policy changed.

## 3. Read/security boundary

The reader accepts one exact API Credential UUID and executes only through `PostgresIdentityDatabase`, which fixes `sbg_identity_service_rw`, enables row security and clears application scope before work.

Returned metadata is limited to persisted non-secret evidence: optional Tenant/Industry ownership, principal id, raw key prefix/status, optional permission-profile/expiry/last-used, immutable CIDR and allowed-Industry arrays, exact signed bigint credential-version text, created time and optional revoked time.

This is pre-context internal metadata. PLATFORM_GLOBAL service credential metadata is readable through the trusted Identity boundary while direct `sbg_app_rw` SELECT remains revoked.

## 4. Exact implementation-head CI

Exact tested implementation head: `031b4068685172f5a9c6c461f5ab73e237737e27` / tree `8c8a9a4c21653e7ef4d5962eaac23bdd7412acb8`.

- Core Service Verify run `35905928107`, Core job `107333488825`: **SUCCESS**, **311/311 Core**, 0 failed/skipped.
- Same run, PostgreSQL/RLS job `107333488626`: **SUCCESS**, **455/455 PostgreSQL**, including `APICRED-META-PG-001…007`, 0 failed/skipped.
- Database Verify run `35905928128`, job `107333488814`: **SUCCESS**.
- Web Boundary Verify run `35905928025`, job `107333488364`: **SUCCESS**.

## 5. Canonical DD / acceptance traceability

Canonical DD/acceptance commit: `c06225eeeee9b203afafb2359d31a831408abbd0` / tree `3e07ac1bdb823753a849e79a2503dd687ee2c8d6`.

It adds exactly one DD-145 decision, one DD-145 acceptance block and one DD-145 changelog entry.

## 6. Promotion invariant gate

- Core run `35906282606`, Core job `107334685860`: **SUCCESS**, **311/311 Core**.
- Same run, PostgreSQL job `107334686239`: **SUCCESS**, **455/455 PostgreSQL**, including `APICRED-META-PG-001…007`.
- Database run `35906282548`, job `107334685959`: **SUCCESS**.
- Web run `35906282562`, job `107334685244`: **SUCCESS**.
- Direct DD-18 recount: **145 definitions / 145 unique / DD-001…DD-145 / no gaps / no duplicates**.
- Stable product invariants: **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirement IDs/text**.
- Database inventory remains **47 migrations / 41 SQL verification files**.

This gate authorizes `DEV-API-CREDENTIAL-METADATA-READ-001`; it does not expand DD-145 semantics.

## 7. Explicitly unclaimed

DD-145 does not implement `MachineCredentialVerifierPort`; parse presented API keys; select by key prefix for authentication; expose or compare `secret_hash`; choose Argon2/hash parameters; enforce CIDR at request time; decide credential currentness/usability; resolve permission profiles; update last-used evidence; create/rotate/revoke/update/delete credentials; audit credential use; derive RequestContext authorization; expose public/admin credential metadata; enumerate/search credentials; or authorize operator elevation.

## 8. Safety

- Forward-only repository mutation; no force-push.
- `main` remains unmerged.
- RawSourceCorpus remains untouched.
- PR #2 remains draft/review-only unless explicitly authorized.


## 9. Post-promotion nullable CIDR fidelity correction

Fresh source reconciliation after DD-146 promotion found one DD-145 fidelity defect: migration 0003 declares `allowed_cidrs cidr[]` nullable, while the initial metadata parser required an array. Schema-valid SQL NULL therefore failed instead of remaining absence.

Correction commit: `14b69ad4c66d78340c0bd020d65ff1f444b7c02c` / tree `35d7e5dafb39c53384f817cfba3a8d56ffd048ec`.

The correction:
- changes `ApiCredentialMetadata.allowedCidrs` to optional;
- preserves PostgreSQL NULL as absence;
- keeps non-null CIDR arrays immutable;
- updates `APICRED-META-PG-004` to exercise a real NULL row;
- does not select `secret_hash`, implement machine verification, enforce CIDRs, mutate credentials or change database schema/RLS/privileges.

Exact correction-head CI:
- Core run `35909155774`, job `107344302164`: **SUCCESS**, **311/311**.
- PostgreSQL job `107344301757`: **SUCCESS**, **462/462**, corrected `APICRED-META-PG-004` PASS.
- Database run `35909155819`, job `107344301870`: **SUCCESS**.
- Web run `35909155798`, job `107344301871`: **SUCCESS**.

DD-145 canonical scope remains metadata-only.
