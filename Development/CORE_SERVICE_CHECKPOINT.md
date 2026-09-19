# CORE SERVICE CHECKPOINT — DEV-WEB-COMPOSITION-001
**Updated:** 2026-09-19  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — concrete Next.js first-party server composition

## Verified executable snapshot
- Commit: `a440c80ee0d4b97301a310d3ea7574feaf6efa30`.
- Tree: `981980fe35b2e0c6a366c3dc45cac5ec2f19aa47`.
- Core/server acceptance: **172/172 PASS**.
- Real PostgreSQL regression: **44/44 PASS**.
- Database: **41 migrations / 35 verification files PASS**.
- Next.js 15 production build + generated-state cleanliness: **PASS**.
- Industry SQL remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## DD-058 boundary
- governed package boundary pins Next.js 15.5.25 + React/ReactDOM 19.3.0 on Node 22+;
- `src/server/app/first-party-web-composition.ts` composes existing identity/context/commercial/authorization/rate/idempotency/DTO/domain/tRPC services only;
- `src/app/api/trpc/[trpc]/route.ts` is a Node-runtime GET/POST transport boundary with no route-local business/security logic;
- trusted host binding remains selector-only and RequestContext revalidates Tenant/membership/Industry truth;
- machine/API credentials remain outside this Clerk Bearer first-party human route;
- runtime secrets and cell routing facts have no source defaults;
- Core `tsconfig.json` and Next `tsconfig.web.json` are separate governed compiler boundaries;
- NodeNext `.js` imports stay canonical while Next resolves TypeScript sources through `extensionAlias`;
- npm lock verification and Web CI are read-only; CI does not push generated files.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35438688233 | 105885645174 | **PASS — 172/172** |
| Core Service Verify / postgres-context-verify | 35438688233 | 105885644915 | **PASS — 44/44 + DB bootstrap PASS** |
| Database Verify / postgres-verify | 35438688091 | 105885644667 | **PASS — 41 migrations / 35 verification files** |
| Web Boundary Verify / web-boundary-verify | 35438688076 | 105885644638 | **PASS — deterministic lock + Core compile + Next production build + clean generated state** |

All jobs asserted exact tested HEAD `a440c80ee0d4b97301a310d3ea7574feaf6efa30`; Web evidence asserted tree `981980fe35b2e0c6a366c3dc45cac5ec2f19aa47`.

## Next governed work
Bind the already-designed `WorkspaceService` as the second concrete first-party Core query, **`core.tenancy.workspace.resolve`**, before any broad UI/navigation work:
- DD-02 remains Tenant authority: no `tenantId` or parallel Tenant-authority DTO field;
- host/domain/membership facts supply the trusted Tenant selector before RequestContext resolution;
- the procedure DTO may carry only optional `industrySelector`;
- return only the existing sanitized `ClientWorkspaceContext`;
- revalidate current membership/Tenant/Industry state through existing services;
- bind one canonical OperationContract + exact Zod DTO + domain registry handler + tRPC procedure;
- add executor/transport tests and keep server enforcement authoritative.

Do not start broad UI screens, REST/OpenAPI, Industry routers or deployment before this workspace bootstrap is exact-head green. RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
