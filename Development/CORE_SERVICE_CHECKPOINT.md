# CORE SERVICE CHECKPOINT — DEV-API-CREDENTIAL-CURRENT-LIFECYCLE-FLOOR-001
**Updated:** 2026-09-24 · **Branch:** `docs/architecture-branch-2`

Verified executable `a5e1de8dec4b24de90ebebb937ad7dd684761b63` / tree `493fe33ebc29e23f67dd8dca065f97075397481a`: **367/367 Core**, **490/490 PostgreSQL**, Database/Web PASS. Zero failed/skipped tests.

Promotion invariant gate `716e65b5296f974b608a44aac57daa8a9e740743` / tree `cf5cf9f213d8a20c081f2d36f297d818fb4ff0d7`: Core run `35951882595` (Core job `107481975657`, PostgreSQL job `107481975948`), Database run `35951882648` (job `107481975808`), Web run `35951882634` (job `107481975705`) — SUCCESS; **158 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

`APICRED-LIFE-001…007` prove ACTIVE/no-expiry, ACTIVE/future-expiry, exact-boundary expiry, after-expiry denial, non-ACTIVE denial, malformed-time fail closed and non-interpretation/non-mutation of unrelated verifier material.

## Remaining scope

Presented credential wire format/prefix extraction; verifier-hash comparison and approved algorithm/library/parameters; CIDR/network enforcement; principal/service/membership validation; Tenant/Industry/PLATFORM_GLOBAL scope composition; permission-profile mapping; last-used mutation; credential-use/authentication audit; final `VerifiedMachineEvidence`; rotation/revocation workflow remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next runtime prerequisite. Do not treat DD-158 lifecycle success as machine authentication.

Evidence: `Registers/DEVELOPMENT_DD158_VERIFICATION_2026-09-24.md`.
