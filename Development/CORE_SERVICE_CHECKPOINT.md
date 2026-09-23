# CORE SERVICE CHECKPOINT — DEV-API-CREDENTIAL-METADATA-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

Verified executable `031b4068685172f5a9c6c461f5ab73e237737e27` / tree `8c8a9a4c21653e7ef4d5962eaac23bdd7412acb8`: **311/311 Core**, **455/455 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `c06225eeeee9b203afafb2359d31a831408abbd0` / tree `3e07ac1bdb823753a849e79a2503dd687ee2c8d6`: Core run `35906282606` (Core job `107334685860`, PostgreSQL job `107334686239`), Database run `35906282548` (job `107334685959`), Web run `35906282562` (job `107334685244`) — SUCCESS; **145 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-145 adds one exact API Credential metadata-only persistence reader through the fixed Identity-service role. `secret_hash` is absent from the SELECT and returned contract. Tenant/Industry/principal ownership, raw key prefix/status/permission-profile/expiry/last-used/CIDR/allowed-Industry evidence, exact signed bigint credential version and timestamps remain non-authorizing persistence evidence.

`APICRED-META-PG-001`…`APICRED-META-PG-007` prove Tenant-Core metadata, Tenant-Industry exact ownership evidence, PLATFORM_GLOBAL metadata through the dedicated Identity boundary while direct app SELECT remains revoked, secret-verifier exclusion, raw nullable/CIDR evidence, signed bigint fidelity, fail-closed malformed ids, and exact-read-only port semantics.

## Remaining scope

`MachineCredentialVerifierPort`; presented-token parsing; key-prefix authentication lookup; Argon2/approved verifier comparison/parameters; CIDR enforcement at request time; lifecycle/current usability decisions; permission-profile resolution; last-used mutation; create/rotate/revoke/update/delete; credential-use audit; RequestContext authorization; public/admin transport; enumeration/search; and operator-elevation authorization remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep those credential/elevation semantics outside scope unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD145_VERIFICATION_2026-09-23.md`.
