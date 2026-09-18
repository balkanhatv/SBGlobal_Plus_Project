# CORE SERVICE CHECKPOINT — DEV-WEB-EDGE-001
**Updated:** 2026-09-19  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — trusted first-party web selector + edge/body security floor

## Verified executable snapshot
- Commit: `6bd1887c5d39a6298b99bbae0589154615684089`.
- Tree: `b512cbbb55ab9588815d8e22c345d2c0ccb69a32`.
- Core/server acceptance: **168/168 PASS**.
- Real PostgreSQL regression: **38/38 PASS**.
- Database: **40 migrations / 34 verification files PASS**.
- Industry SQL remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## DD-056 boundary
- exact server-configured host binding produces only non-authoritative Tenant/optional Industry/OrgUnit selectors;
- generic `X-Tenant-Id` / `X-Industry-Context-Id` headers are ignored as authority;
- DD-02 RequestContext remains authoritative for Tenant membership/current state and Industry ownership;
- HTTPS + exact host + allowed Origin + cross-site browser policy are executable;
- only GET/POST are accepted in this first-party tRPC web floor;
- declared Content-Length can be rejected pre-auth as an early size signal;
- an authenticated streamed body is hard-capped before tRPC/schema parsing, so missing Content-Length cannot bypass the application ceiling;
- JSON POST policy is explicit;
- Bearer-authenticated web does not invent a cookie-CSRF token contract; future cookie auth must satisfy DD-16 separately.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35391473666 | 105750578096 | **PASS — 168/168** |
| Core Service Verify / postgres-context-verify | 35391473666 | 105750578347 | **PASS — 38/38** |
| Database Verify / postgres-verify | 35391473678 | 105750581458 | **PASS — 40 migrations / 34 verification files** |

All jobs asserted exact tested HEAD `6bd1887c5d39a6298b99bbae0589154615684089` and tree `b512cbbb55ab9588815d8e22c345d2c0ccb69a32`.

## Next governed work
Implement the **first-party web application composition root / concrete Next.js route bootstrap** only after revalidating F-01/A-10/DD-14:
- actual Next.js 15 / React 19 package boundary and directory ownership;
- one server composition root that instantiates Clerk/Identity, selector, edge/body, context, guard, idempotency, rate, DTO/domain registry and tRPC router dependencies;
- one concrete tRPC route mounted through the verified Fetch handler;
- no duplicate business/security logic in the route;
- environment/secrets supplied through deployment configuration, never source.

Do not start broad UI screens, REST/OpenAPI, or broad Industry routers before this composition floor is exact-head green. RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
