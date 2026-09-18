# CORE SERVICE CHECKPOINT — DEV-WEB-AUTH-001
**Updated:** 2026-09-19  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — first-party Clerk Bearer Authorization bridge

## Verified executable snapshot
- Commit: `ac00ce9ba8ff51928a235c5719f724b4c6d720d1`.
- Tree: `8afd73c415a3333b3ff2aa9937f899d067be5df2`.
- Core/server acceptance: **163/163 PASS**.
- Real PostgreSQL regression: **38/38 PASS**.
- Database: **40 migrations / 34 verification files PASS**.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## DD-055 boundary
- `@clerk/backend@3.18.1` is pinned with a reproducible lockfile closure.
- first-party Authorization accepts only `Bearer <Clerk token>` in this slice;
- the resolver returns only HUMAN AuthenticationInput and never infers machine/API-key semantics;
- official Clerk token verification uses a required JWT public key + non-empty `authorizedParties`;
- live Clerk Backend API `getSession` / `revokeSession` are bound through the existing ClerkBackendPort;
- only signed subject/session/factor-age data crosses the provider boundary;
- Tenant, Industry, roles, permissions, entitlements and policy facts remain server-owned Core state;
- invalid token, missing session and provider outage remain distinct fail-closed provider outcomes.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35389447249 | 105744118260 | **PASS — 163/163** |
| Core Service Verify / postgres-context-verify | 35389447249 | 105744118505 | **PASS — 38/38** |
| Database Verify / postgres-verify | 35389447186 | 105744117838 | **PASS — 40 migrations / 34 verification files** |

All jobs asserted exact tested HEAD `ac00ce9ba8ff51928a235c5719f724b4c6d720d1` and tree `8afd73c415a3333b3ff2aa9937f899d067be5df2`.

## Next governed work
Freshly resolve the remaining first-party web-runtime composition prerequisites:
1. trusted first-party selector derivation;
2. edge origin/host/request-size/CSRF policy;
3. application composition root / actual Next.js route placement.

Do not invent tenant/industry authority in headers. Do not start REST/OpenAPI or broad router expansion before these first-party composition controls are executable and exact-head green.

RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
