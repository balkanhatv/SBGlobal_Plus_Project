# CORE SERVICE CHECKPOINT — DEV-CORE-PLATFORM-SCOPE-001
**Updated:** 2026-09-17  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — prior Core/read bindings + DD-043 protected PLATFORM_GLOBAL scope floor

## Verified executable snapshot
- Commit: `3e7b2927839d289240eb389902563f5ab3d68074`.
- Prior checkpoint: `DEV-CORE-READS-001`, executable `7792a8a8dd9825038fbf1a96f6027c9ce730aee2`.
- Database: **34 migrations / 28 verification files**, including 0034 and 0099.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## Fresh consistency audit and targeted closure
0. Fresh audit found a CI-blocking DD-043 regression: tests required the protected PLATFORM_GLOBAL principal floor at RequestScopedSql, but the implementation still accepted ordinary HUMAN/API_CLIENT contexts. The SQL boundary now fails closed with `DATABASE_CONTEXT_INVALID` before transaction use. Migration/verification 0034 already enforce the matching persisted machine-credential floor.
1. `DD-040` was verified as a decision section inside DD-18, not a missing standalone file.
2. Missing truthful compiled `permissionVersion` persistence was closed by **DD-041**.
3. Missing Current Supported Industry presentation persistence was closed by **DD-042**.
4. Migration 0033 implements both owners without widening ordinary runtime writes.
5. New scoped Authorization tables preserve migration-0029 immutable ownership and forced RLS.
6. `sbg_app_rw` is SELECT-only on both new authorities; Control Plane owns presentation catalog mutation. No Authorization compiler writer role was invented.
7. Module-owned adapters avoid cross-module SQL joins.
8. Future Industry remains DD-035 promotion-gated; catalog sort order is presentation only.

## Implemented continuation
### Authorization
- `core_authz.compiled_permission_subject` scopes Tenant + optional Industry + principal + optional membership/org + scope class.
- immutable `compiled_permission_snapshot` carries role IDs, permission-set evidence, source fingerprint and monotonic version/lifecycle.
- current pointer/version is constrained; one CURRENT snapshot per subject.
- `PostgresAuthorizationContextAdapter` supplies RequestContext role IDs/permissionVersion.
- `PostgresEffectiveRoleReadAdapter` supplies effective-role reads from the same current snapshot.
- missing/mismatched current snapshot fails closed with `DEPENDENCY_UNAVAILABLE`.

### Current Supported Industry presentation
- `core_master.current_supported_industry` owns canonical display key/name/route/icon/experience package/sort/version/promotion evidence.
- baseline set remains exactly HLT/EDU/RTL/HSP/MFG/PSV/GOV/NGO/SFM.
- `PostgresIndustryPresentationCatalogAdapter` reads ACTIVE presentation.
- Tenant activation remains `core_tenancy.industry_context`; Future Industry state is not substituted.

## DD-043 executable extension
- RequestContext permits protected PLATFORM_GLOBAL only for interactive PLATFORM_OPERATOR identity or an unbound SERVICE machine credential explicitly allowlisted for PLATFORM_GLOBAL.
- persisted API credentials reject null-tenant HUMAN/API_CLIENT, PLATFORM_OPERATOR API credentials and non-allowlisted SERVICE credentials.
- RequestScopedSql independently rejects HUMAN/API_CLIENT PLATFORM_GLOBAL context before pool/transaction use; PLATFORM_OPERATOR/SERVICE only pass this scope floor and still require downstream authorization.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify (PR) | 35139097825 | 104938819674 | **PASS — 47 Core/server acceptance tests present in current tree** |
| Core Service Verify / postgres-context-verify (PR) | 35139097825 | 104938820027 | **PASS — 11 real PostgreSQL tests present in current tree** |
| Database Verify / postgres-verify (PR) | 35139097903 | 104938820048 | **PASS — 34 migrations / 28 verification files present in current tree** |
| Core Service Verify / core-service-verify + postgres-context-verify (push) | 35139093817 | 104938806183 / 104938805890 | **PASS** |

All cited current jobs asserted exact tested HEAD `3e7b2927839d289240eb389902563f5ab3d68074`.

## Failed attempts retained
- `f5fc98a9…`: TS scope narrowing + missing immutable ownership trigger.
- `3364c355…`: those closed; PG fixture exposed UUID/text inference.
- `94d123c7…`: fixture typing closed; review found FK-safe cleanup ordering.
- `7792a8a8…`: prior DEV-CORE-READS-001 exact-head PASS.
- `dcf2f0c9…` / `9c2b4398…`: DD-043 SQL-boundary acceptance exposed the missing implementation; Core CI correctly failed.
- `3e7b2927…`: targeted RequestScopedSql correction; exact-head Core and Database CI PASS.

No schema invariant, RLS rule, Industry model or privilege floor was weakened.

## Scope limits / next governed work
Next: **concrete provider/session-security → PDP/ABAC → Commercial validation integration behind existing Core ports → DD-06 tRPC/REST transports**.

Still unfinished: trusted Data Home directory/bootstrap adapter; concrete Clerk/Auth.js provider/session/device integration; production PDP/ABAC evaluator; Authorization compiler writer; Commercial integration; broader repositories; transports/rate limiter/idempotency; UI/mobile/desktop; deployment/production/security validation.

RawSource remains immutable. `main` remains unmerged. PR #2 stays review-only/draft. No new ORM/backend/Industry-Core fork was introduced.
