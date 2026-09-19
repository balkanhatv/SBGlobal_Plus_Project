# CORE SERVICE CHECKPOINT — DEV-CONTEXT-BOOTSTRAP-001
**Updated:** 2026-09-19  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — pre-context Tenant directory bootstrap

## Verified executable snapshot
- Commit: `b244187e69eee37ce05e5739df4680b3f0511b54`.
- Tree: `ea017bd7a4ac31226c349dfeaa63a3faae8b97e9`.
- Core/server acceptance: **168/168 PASS**.
- Real PostgreSQL regression: **44/44 PASS**.
- Database: **41 migrations / 35 verification files PASS**.
- Industry SQL remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## DD-057 boundary
- dedicated `sbg_context_bootstrap_ro` NOLOGIN/NOBYPASSRLS role;
- SELECT-only access to DataHome, Tenant, Industry Context, OrgUnit, Tenant Membership and Current Supported Industry presentation truth;
- no provider-link, API-credential secret, device/session-security or PlatformPrincipal directory access;
- human Tenant resolution requires an exact active membership and explicit selector when multiple memberships exist;
- machine-bound Tenant resolution stays exact to the bound Tenant;
- Industry resolution is exact inside the resolved Tenant; sibling-Tenant Industry IDs cannot cross-resolve;
- OrgUnit root-to-leaf path is derived server-side;
- DataHome/routingVersion is read from the server directory before tenant-scoped SQL;
- bootstrap database adapter enforces the dedicated runtime role and read-only transaction behavior.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35395873206 | 105764448946 | **PASS — 168/168** |
| Core Service Verify / postgres-context-verify | 35395873206 | 105764448659 | **PASS — 44/44** |
| Database Verify / postgres-verify | 35395873225 | 105764448413 | **PASS — 41 migrations / 35 verification files** |

All jobs asserted exact tested HEAD `b244187e69eee37ce05e5739df4680b3f0511b54` and tree `ea017bd7a4ac31226c349dfeaa63a3faae8b97e9`.

## Next governed work
Revalidated F-01/A-10/DD-14 require Next.js server capabilities as the default authenticated web/API placement. Implement only the **concrete Next.js 15 server composition root + one tRPC route bootstrap**:
- pin the governed Next.js 15 + React 19 package boundary;
- add a server composition root that wires existing Clerk/Identity, trusted selector/edge/body policy, TenantContext bootstrap, RequestContext, Commercial, Authorization, idempotency/rate, DTO/domain registries and tRPC router through existing adapters;
- mount one concrete App Router tRPC route without route-local business/security logic;
- environment/secrets are required runtime configuration, never source defaults;
- add build/type/test evidence for the new web boundary.

Do not start broad UI screens, REST/OpenAPI, broad Industry routers or deployment before this composition floor is exact-head green. RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
