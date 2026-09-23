# CORE SERVICE CHECKPOINT — DEV-API-CREDENTIAL-VERIFICATION-MATERIAL-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

Verified executable `9b0662aee55e710b256033561790609dbfa6eeaa` / tree `a4221561bb8260b9093451117ab411562cb2683b`: **311/311 Core**, **469/469 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `539524aaaf93ef14d72c0165163f6a5bd1c660cf` / tree `0a56b0d946e8090809f32cb4f7d41587577794fb`: Core run `35910799265` (Core job `107349828531`, PostgreSQL job `107349828859`), Database run `35910799281` (job `107349828748`), Web run `35910799187` (job `107349828182`) — SUCCESS; **147 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-147 adds the server-internal API Credential verification-material source. Exact persisted key-prefix lookup is unique and uses `PostgresIdentityDatabase`; opaque `secret_hash` never crosses into Core exports or transports. ACTIVE/SUSPENDED/REVOKED/EXPIRED rows remain raw material rather than an authentication decision.

`APICRED-VERIFY-PG-001`…`APICRED-VERIFY-PG-007` prove exact prefix lookup, Tenant/Industry/platform scope fidelity, non-active lifecycle evidence, nullable CIDR + bigint fidelity, source uniqueness, Identity-service-only access and non-verifier/read-only surface behavior.

## Remaining scope

Presented API-key wire format and parsing; prefix extraction rules; Argon2id/approved verifier comparison and parameters/library contract; CIDR/network enforcement; current lifecycle usability; permission-profile resolution; last-used mutation; credential-use/auth audit; rotation/revocation orchestration; `VerifiedMachineEvidence` construction; and `IdentityPort.verifyMachineCredential` remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next runtime prerequisite. Do not treat verifier-material availability as successful authentication.

Evidence: `Registers/DEVELOPMENT_DD147_VERIFICATION_2026-09-23.md`.
