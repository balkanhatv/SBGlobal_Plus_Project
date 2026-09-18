# CORE SERVICE CHECKPOINT — DEV-API-TRPC-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — bounded first-party tRPC query adapter floor

## Verified executable snapshot
- Commit: `565165ae72e1da4d93ddff645bae2735219f28ff`.
- Tree: `ec1af13574be83ca05a156d3c2dbe116f3e469e7`.
- Core/server acceptance: **152/152 PASS**.
- Real PostgreSQL regression: **38/38 PASS**.
- Database: **40 migrations / 34 verification files PASS**.
- Industry SQL remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## DD-053 boundary
- `@trpc/server@11.19.0` is pinned and lockfile-backed.
- First-party tRPC procedures bind fixed OperationContract IDs.
- Procedures must use the exact Zod DTO objects already registered by DD-052.
- tRPC parses the DTO once; `OperationSchemaRegistry.prepareInput` performs deterministic canonical JSON/resource extraction without a second Zod transform.
- Protected tRPC context preflights through the existing IdentityPort and passes original AuthenticationInput into DD-02 RequestContext for authoritative current-state validation.
- shared DD-052 envelope/error projection remains authoritative; tRPC adds only transport status semantics.
- `core.identity.roles.listEffective` is the first real nested procedure and delegates execution through the existing OperationExecutor.
- routers do not implement Commercial, Authorization, rate, idempotency, resource, database or domain business rules.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35371608565 | 105686647373 | **PASS — 152/152** |
| Core Service Verify / postgres-context-verify | 35371608565 | 105686647724 | **PASS — 38/38** |
| Database Verify / postgres-verify | 35371608561 | 105686650061 | **PASS — 40 migrations / 34 verification files** |

All jobs asserted exact tested HEAD `565165ae72e1da4d93ddff645bae2735219f28ff` and tree `ec1af13574be83ca05a156d3c2dbe116f3e469e7`.

## Next governed work
Implement only the **physical first-party tRPC HTTP/fetch handler boundary** for the primary Next.js plane:
- one server-owned request adapter into the existing tRPC router/context factory;
- bounded header/authenticity extraction only;
- server-generated/validated request + correlation IDs;
- idempotency key and trusted rate-subject extraction only from governed transport inputs;
- response/error serialization via tRPC + shared DD-052 projection;
- no route-local business logic;
- no REST/OpenAPI and no broad router expansion.

Do not start broad Core/Industry routes, REST/OpenAPI, UI, mobile, desktop or deployment before this handler floor passes exact-head CI. RawSourceCorpus remains immutable; `main` unmerged; PR #2 draft/review-only.
