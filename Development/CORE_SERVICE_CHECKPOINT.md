# CORE SERVICE CHECKPOINT — DEV-API-TRPC-HTTP-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — physical first-party tRPC Fetch API handler floor

## Verified executable snapshot
- Commit: `8b3b0417eb95391c9b4e81fa9acdcae0efcf10fe`.
- Tree: `fac8117e3d98d52d4bbf5238a24ac0dc213e3912`.
- Core/server acceptance: **157/157 PASS**.
- Real PostgreSQL regression: **38/38 PASS**.
- Database: **40 migrations / 34 verification files PASS**.
- Industry SQL remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## DD-054 boundary
- reusable `createFirstPartyTrpcFetchHandler` binds the physical Fetch API plane without inventing a Next.js app path;
- edge/auth/selector/network ports receive method/URL/Headers only and cannot access the request body;
- IdentityPort verification completes before tRPC request-info/body parsing;
- DD-06 `Authorization`, `Idempotency-Key` and advisory `X-Correlation-Id` semantics are bound;
- Tenant/Industry authority is never taken from generic headers;
- pre-tRPC failures use the shared canonical error envelope with no-store + correlation metadata;
- tRPC responses echo normalized correlation and map shared RATE_LIMITED retry metadata to HTTP `Retry-After`;
- batching is disabled in this bounded first physical floor;
- real HTTP-level tests cover nested Core success, auth-before-malformed-body denial, missing auth, rate-limit Retry-After and edge-policy denial.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35374857407 | 105697039782 | **PASS — 157/157** |
| Core Service Verify / postgres-context-verify | 35374857407 | 105697039567 | **PASS — 38/38** |
| Database Verify / postgres-verify | 35374857372 | 105697040419 | **PASS — 40 migrations / 34 verification files** |

All jobs asserted exact tested HEAD `8b3b0417eb95391c9b4e81fa9acdcae0efcf10fe` and tree `fac8117e3d98d52d4bbf5238a24ac0dc213e3912`.

## Next governed work
Freshly inspect the remaining **first-party web-runtime composition prerequisites** before adding a Next.js route:
- concrete Clerk/session/API-credential Authorization resolver ownership;
- trusted selector derivation source for first-party web;
- edge origin/host/body-size/CSRF policy ownership;
- Next.js application bootstrap/location and server composition root.

Do not invent a Next.js folder, Clerk parser or production edge values until those contracts are verified against Foundation/Architecture/DD. REST/OpenAPI, broad routers, UI/mobile/desktop and deployment remain later.

RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
