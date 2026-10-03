# DD-158 Development Verification — API Credential Current Lifecycle Floor

**Date:** 2026-09-24  
**Branch:** `docs/architecture-branch-2`  
**Prior promoted checkpoint:** `DEV-OPERATOR-ELEVATION-CONTROL-PLANE-SQL-BOUNDARY-001`  
**Prior synchronized state basis:** `9fe2602df7df501a224e7f8d04f16a1f2496ab5a` / tree `aff2b9866420b573eb3193cc6d844592f65b3311`

## 1. Source-first audit

Audit commit: `ab7120f47087ec4bd3dec3124f4a1d2b1c58a968`.  
Artifact: `Development/API_CREDENTIAL_CURRENT_LIFECYCLE_PREREQUISITE_OWNERSHIP_AUDIT.md`.

DD-03 requires API credential validity before later authorization gates. DD-16 owns expiry/revocation policy. Migration 0030 consumes persisted API credentials only when status is ACTIVE and optional expiry is strictly after the evaluation time.

## 2. Bounded implementation

Implementation head: `a5e1de8dec4b24de90ebebb937ad7dd684761b63` / tree `493fe33ebc29e23f67dd8dca065f97075397481a`.

Files:
- `src/server/identity/api-credential-current-lifecycle.ts`;
- `tests/server/api-credential-current-lifecycle.test.mjs`.

The helper is server-internal, pure and explicit-time based. No Core export, database, migration, RLS, role/grant, RequestContext, transport or product policy changed.

## 3. Exact implementation-head CI

- Core run `35951713366`, Core job `107481469528`: **SUCCESS**, **367/367 Core**, including `APICRED-LIFE-001…007`, 0 failed/skipped.
- Same run, PostgreSQL job `107481469737`: **SUCCESS**, **490/490 PostgreSQL**, 0 failed/skipped.
- Database run `35951713358`, job `107481469568`: **SUCCESS**.
- Web run `35951713350`, job `107481469458`: **SUCCESS**.

## 4. Canonical traceability

Canonical commit: `716e65b5296f974b608a44aac57daa8a9e740743` / tree `cf5cf9f213d8a20c081f2d36f297d818fb4ff0d7`.

Exactly one DD-158 decision, one DD-158 acceptance block and one DD-158 changelog entry were added.

## 5. Promotion invariant

- Core run `35951882595`, Core job `107481975657`: **SUCCESS**, **367/367 Core**.
- PostgreSQL job `107481975948`: **SUCCESS**, **490/490 PostgreSQL**.
- Database run `35951882648`, job `107481975808`: **SUCCESS**.
- Web run `35951882634`, job `107481975705`: **SUCCESS**.
- DD-18 recount: **158/158 unique DD-001…158, no gaps/duplicates**.
- Stable invariants: **9 Industries / 41 canonical MS / 181 Industry tables / 2,962 requirements**.
- Database inventory remains **47 migrations / 41 SQL verification files**.

This authorizes `DEV-API-CREDENTIAL-CURRENT-LIFECYCLE-FLOOR-001` only.

## 6. Explicitly unclaimed

DD-158 does not parse presented credentials; compare verifier hashes; enforce CIDR; interpret permission profiles; decide principal/scope authorization; update last-used evidence; emit credential-use audit; construct `VerifiedMachineEvidence`; implement `IdentityPort.verifyMachineCredential`; or mutate credentials.

## 7. Safety

Forward-only; no force-push; `main` unmerged; RawSource untouched; PR #2 draft/review-only.
