# CORE SERVICE CHECKPOINT — DEV-AUTHZ-COMPILER-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — dedicated monotonic Authorization compiler write boundary; Commercial integration not yet claimed

## Verified executable snapshot
- Commit: `2c9157e3a1ed30f18f8014e1b04aa799f2d73d15`.
- Tree: `a1cc883564516222ed6095e692ba6bd1ec33baac`.
- Prior executable checkpoint: `96b051ca6feef26d3f8534ce6d3240f6843dc31e` (`DEV-AUTHZ-EVAL-001`).
- Compiler persistence prerequisite: `caaf18cdf19feb7df669fbca478c883fa3ef7642`.
- Database: **37 migrations / 31 verification files**, including 0037 and 0099.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory: **95 tests**; real PostgreSQL inventory: **18 tests**.

## Current Authorization compiler boundary
`DEV-AUTHZ-COMPILER-001` implements the DD-041 publication/invalidation write boundary:
- dedicated `sbg_authorization_compiler_rw` role is NOLOGIN, NOSUPERUSER, NOBYPASSRLS, NOINHERIT and table-scoped;
- compiler can SELECT/INSERT/UPDATE only compiled tenant/platform subject + snapshot truth; it has no DELETE and no source role-assignment/role-template/role-permission/ABAC mutation authority;
- application and Control Plane roles remain non-compiler writers;
- tenant writes stay behind existing exact Tenant/Industry FORCE RLS; PLATFORM_GLOBAL uses separate compiler RLS policies;
- application compiler service requires a trusted SERVICE RequestContext and exact target scope;
- Permission Set v1 is revalidated at publication; role IDs are unique/canonical-sorted; source fingerprints are bounded;
- publication serializes each exact subject with `FOR UPDATE`, supersedes old CURRENT before inserting the next CURRENT snapshot, advances version exactly by one, and moves the current pointer atomically;
- invalidation changes CURRENT→INVALIDATED and clears the pointer without decrementing or reusing the issued version;
- after invalidation the next publication resumes at last-issued-version + 1;
- tenant and PLATFORM_GLOBAL subject paths are separate and never cross-fallback;
- compiler DB adapter fixes the dedicated role and preserves pooled-connection cleanup/expired-handle safety.

This checkpoint is a **publication boundary**, not the role/permission source compiler algorithm itself. It does not claim a concrete Commercial fact adapter, enforceable RESTRICT payload/reducer, full resource/workflow rule integration, transport wiring, or production authorization certification.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35282382158 | 105407032089 | **PASS — 95/95** |
| Core Service Verify / postgres-context-verify | 35282382158 | 105407032426 | **PASS — 18/18** |
| Database Verify / postgres-verify | 35282382162 | 105407032144 | **PASS — 37 migrations / 31 verification files** |

All jobs asserted exact tested HEAD `2c9157e3a1ed30f18f8014e1b04aa799f2d73d15` and tree `a1cc883564516222ed6095e692ba6bd1ec33baac`.

## Scope limits / next governed work
Next governed unfinished slice: **Commercial current-state integration only** — resolve the existing current EntitlementSnapshot/Subscription/License persistence through module-owned read ports, bind its exact version/facts to guard + Authorization supplemental facts, and fail closed on stale/missing state. Do not move entitlement truth into Authorization.

True enforceable ABAC RESTRICT payload/reducer, broader resource/workflow rules, DD-06 transports/rate limiter/idempotency, UI/mobile/desktop, deployment and production readiness remain unfinished. RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 stays review-only/draft.
