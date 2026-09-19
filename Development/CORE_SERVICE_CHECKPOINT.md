# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-ENTITLEMENTS-QUERY-001
**Updated:** 2026-09-19  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — client-safe current Commercial entitlement query

## Verified executable snapshot
- Commit: `3bb86bc4b1b313c6bee8c8d65406992bb6b28cc7`.
- Tree: `07ebd925d3c0176907ebd257e0cdecb5d0f3840e`.
- Core/server acceptance: **180/180 PASS**.
- Real PostgreSQL regression: **44/44 PASS**.
- Database: **41 migrations / 35 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock and governed generated-state cleanliness: **PASS**.
- Industry SQL remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## DD-060 boundary
- canonical `core.commercial.entitlements.getCurrent` TENANT_CORE query is registered;
- exact v1 input is strict empty `{}`; no Tenant/Industry/client scope authority is accepted;
- permission is `core.commercial.entitlement.view`; rate class AUTH_STANDARD; STANDARD audit; no idempotency;
- current Commercial state is re-read and must match RequestContext snapshot id/version exactly;
- output exposes only snapshotVersion, canonical subscriptionState and sorted enabled non-denied entitlement values;
- snapshotId, subscriptionId, license IDs/tokens, principal/Industry bindings, raw deny-set/source metadata and persistence internals are excluded;
- false/zero/empty facts are omitted; SET values are deterministic sorted unique strings; invalid/duplicate/over-bound state fails closed;
- existing GuardPipeline remains authoritative, so restricted subscription states are not widened by this self-view query;
- production Next composition enables Identity + Workspace + Commercial query through the same OperationExecutor/tRPC route.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35441330280 | 105892504783 | **PASS — 180/180** |
| Core Service Verify / postgres-context-verify | 35441330280 | 105892504808 | **PASS — 44/44 + DB bootstrap PASS** |
| Database Verify / postgres-verify | 35441330254 | 105892504603 | **PASS — 41 migrations / 35 verification files** |
| Web Boundary Verify / web-boundary-verify | 35441330294 | 105892504754 | **PASS — deterministic lock + Core compile + Next 15.5.25 production build + clean generated state** |

All jobs asserted exact tested HEAD `3bb86bc4b1b313c6bee8c8d65406992bb6b28cc7` and tree `07ebd925d3c0176907ebd257e0cdecb5d0f3840e`.

## Next governed work
Audit the prerequisite chain for **`core.commercial.subscription.changePlan`** before writing any mutation:
- verify DD-04 lifecycle/impact/remediation/proration semantics are implementation-deterministic for this command;
- verify write-side Commercial repository/least-privilege DB role and entitlement recompilation/publication boundaries exist;
- verify event/outbox + idempotency + expectedVersion contracts are physically bindable;
- if any prerequisite is absent or ambiguous, implement only that blocking prerequisite first;
- do not invent payment/proration/provider behavior or bypass workflow/Commercial compiler ownership.

Do not start broad UI/navigation, REST/OpenAPI, Industry routers or deployment from this checkpoint. RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
