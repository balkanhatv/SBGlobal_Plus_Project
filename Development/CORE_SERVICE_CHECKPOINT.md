# CORE SERVICE CHECKPOINT — DEV-CORE-READS-001
**Updated:** 2026-09-16  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — Core kernel + pooled PostgreSQL + compiled-Authorization/current-industry read bindings

## Verified executable snapshot
- Commit: `7792a8a8dd9825038fbf1a96f6027c9ce730aee2`.
- Prior checkpoint: `DEV-CORE-POSTGRES-001`, executable `0ada4283959ea4abe39a0980574e2dfdcb62e508`.
- Database: **33 migrations / 27 verification files**, including 0099.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## Fresh consistency audit and targeted closure
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

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify (push) | 35062130387 | 104684488704 | **40/40 PASS** |
| Core Service Verify / postgres-context-verify (push) | 35062130387 | 104684488266 | **11/11 real PostgreSQL PASS** |
| Core Service Verify / core-service-verify (PR) | 35062134101 | 104684499602 | **PASS** |
| Core Service Verify / postgres-context-verify (PR) | 35062134101 | 104684499796 | **PASS** |
| Database Verify / postgres-verify (PR) | 35062133987 | 104684499111 | **33 migrations / 27 verification files; PASS** |

All jobs logged exact tested HEAD `7792a8a8dd9825038fbf1a96f6027c9ce730aee2`.

## Failed attempts retained
- `f5fc98a9…`: TS scope narrowing + missing immutable ownership trigger.
- `3364c355…`: those closed; PG fixture exposed UUID/text inference.
- `94d123c7…`: fixture typing closed; review found FK-safe cleanup ordering.
- `7792a8a8…`: final exact-head PASS.

No schema invariant, RLS rule, Industry model or privilege floor was weakened.

## Scope limits / next governed work
Next: **concrete provider/session-security → PDP/ABAC → Commercial validation integration behind existing Core ports → DD-06 tRPC/REST transports**.

Still unfinished: trusted Data Home directory/bootstrap adapter; concrete Clerk/Auth.js provider/session/device integration; production PDP/ABAC evaluator; Authorization compiler writer; Commercial integration; broader repositories; transports/rate limiter/idempotency; UI/mobile/desktop; deployment/production/security validation.

RawSource remains immutable. `main` remains unmerged. PR #2 stays review-only/draft. No new ORM/backend/Industry-Core fork was introduced.
