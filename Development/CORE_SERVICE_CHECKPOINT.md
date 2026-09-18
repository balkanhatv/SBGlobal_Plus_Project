# CORE SERVICE CHECKPOINT — DEV-AUTHZ-SOURCE-COMPILER-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — deterministic RBAC source-to-snapshot compiler

## Verified executable snapshot
- Commit: `13346932455c79637e9644f970db47052c1fe6ad`.
- Tree: `32ee41587e5569e598bc600b8d2ce9f8db602252`.
- Prior executable checkpoint: `09d81fc23d44747ac566fa4fe1957c1efe32479f` (`DEV-AUTHZ-AUDIT-001`).
- Database: **38 migrations / 32 verification files**.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory: **117 tests**; real PostgreSQL inventory: **27 tests**.

## Current source compiler boundary
DD-048 / `DEV-AUTHZ-SOURCE-COMPILER-001` closes the previously unimplemented RBAC calculation step:
- compiler reads governed role/permission source through dedicated `sbg_authorization_compiler_rw`;
- source access is SELECT-only; source mutation remains prohibited;
- TENANT_CORE uses only null-Industry assignments;
- TENANT_INDUSTRY uses only the exact target Industry Context; null never means every Industry;
- PLATFORM_GLOBAL uses only exact-principal platform role assignments;
- active/effective assignments and active role/permission definitions only;
- unscoped OrgUnit assignment may apply inside its exact Tenant/Industry scope; scoped assignment requires exact selected OrgUnit;
- role-permission version must match active role-template version;
- permission definition scope must exactly match compiled scope;
- explicit DENY wins across roles;
- non-empty role-permission constraints compile conservatively as DENY because Permission Set v1 has no constraint payload;
- canonical source produces deterministic SHA-256 fingerprint;
- publication goes only through the already verified monotonic snapshot writer;
- invalid/unavailable source attempts fail closed and invalid source attempts current-snapshot invalidation where possible.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35319924686 | 105519928448 | **PASS — 117/117** |
| Core Service Verify / postgres-context-verify | 35319924686 | 105519928725 | **PASS — 27/27** |
| Database Verify / postgres-verify | 35319924571 | 105519928057 | **PASS — 38 migrations / 32 verification files** |

All jobs asserted exact tested HEAD `13346932455c79637e9644f970db47052c1fe6ad` and tree `32ee41587e5569e598bc600b8d2ce9f8db602252`.

## Scope limits / next governed work
Next shared-Core prerequisite: **DD-06 transport-neutral idempotency runtime boundary only** — bind REQUIRED/OPTIONAL command semantics to the existing `core_integration.idempotency_record` truth with exact Tenant/Industry/actor scope, request fingerprint conflict detection, in-progress/success/final-failure state handling, and fail-closed PostgreSQL tests.

Do not start tRPC/REST adapters until idempotency and rate-limit runtime enforcement prerequisites are verified. Concrete module resource/workflow adapters, dedicated Commercial restricted-mode/UPGRADE_CTA, enforceable ABAC RESTRICT payload/reducer, PUBLIC/EXPLICIT_CROSS_CONTEXT audit paths, UI/mobile/desktop, deployment and production certification remain unfinished.

RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 stays review-only/draft.
