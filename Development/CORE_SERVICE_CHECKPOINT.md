# CORE SERVICE CHECKPOINT — DEV-WORKSPACE-BOOTSTRAP-001
**Updated:** 2026-09-19  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — Tenant workspace bootstrap query

## Verified executable snapshot
- Commit: `3becd5025526b748d46e69495c2b7fb022281f68`.
- Tree: `0d55b55fd6de7b31ccaa3ef2d2bdd1009bebd9b3`.
- Core/server acceptance: **177/177 PASS**.
- Real PostgreSQL regression: **44/44 PASS**.
- Database: **41 migrations / 35 verification files PASS**.
- Next.js 15 production build, deterministic npm lock and generated-state cleanliness: **PASS**.
- Industry SQL remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## DD-059 boundary
- canonical `core.tenancy.workspace.resolve` TENANT_CORE query is registered;
- DTO accepts only optional `industrySelector`; no tenantId/client Tenant authority exists;
- trusted host/server Tenant selector still enters RequestContext before the procedure;
- existing WorkspaceService revalidates current membership, Tenant and selected Industry ownership;
- sibling-Tenant Industry selection fails closed;
- output is the existing sanitized ClientWorkspaceContext only;
- production composition explicitly enables Workspace while retaining the prior Identity query;
- no migration, REST/OpenAPI, broad UI or Industry router work was added.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35440213402 | 105889605537 | **PASS — 177/177** |
| Core Service Verify / postgres-context-verify | 35440213402 | 105889605450 | **PASS — 44/44 + DB bootstrap PASS** |
| Database Verify / postgres-verify | 35440213490 | 105889605734 | **PASS — 41 migrations / 35 verification files** |
| Web Boundary Verify / web-boundary-verify | 35440213407 | 105889605507 | **PASS — deterministic lock + Core compile + Next 15.5.25 production build + clean generated state** |

All jobs asserted exact tested HEAD `3becd5025526b748d46e69495c2b7fb022281f68` and tree `0d55b55fd6de7b31ccaa3ef2d2bdd1009bebd9b3`.

## Next governed work
Proceed only to **`core.commercial.entitlements.getCurrent`**:
- first lock a v1 client-safe projection contract from F-14/A-04/DD-04;
- do not expose subscriptionId, snapshotId, license IDs, principal bindings or unrestricted persistence records;
- re-use current Commercial state + exact RequestContext snapshot-version checks;
- bind one canonical OperationContract + exact Zod DTO + domain handler + tRPC procedure;
- preserve server-authoritative Commercial/Authorization enforcement and exact-head CI.

Do not start subscription mutation, broad UI/navigation, REST/OpenAPI, Industry routers or deployment before this Commercial query is exact-head green. RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
