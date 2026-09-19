# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-PUBLICATION-001
**Updated:** 2026-09-19  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — atomic Commercial Subscription/snapshot/outbox/audit publication floor

## Verified executable snapshot
- Commit: `a810af51c93dba5959d4b26502c47100afd631fa`.
- Tree: `5b4b662acdc450a9878101652e2bd0ce98404da4`.
- Core/server acceptance: **182/182 PASS**.
- Real PostgreSQL regression: **47/47 PASS**.
- Database: **44 migrations / 38 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock and generated-state cleanliness: **PASS**.

## DD-065 executable boundary
- internal `CommercialPublicationService` requires SERVICE + TENANT_CORE + current Commercial snapshot context;
- compiled publication input is bounded/normalized; future effective time, duplicate scope and invalid facts fail closed;
- dedicated `PostgresCommercialTransitionCompilerDatabase` uses only `sbg_commercial_transition_compiler_rw`;
- migration 0044 grants only same-Tenant Tenant-record SELECT needed for authoritative residency;
- store re-locks exact Subscription/current snapshot and checks expected Subscription version, source PlanVersion and RequestContext snapshot id/version;
- target PlanVersion/Plan/route and entitlement definitions/Industry Context ownership are revalidated;
- one transaction advances Subscription plan/version, appends transition, supersedes old snapshot, publishes new immutable snapshot/facts, writes both DD-063 outbox events and Commercial audit;
- stale/invalid/privilege/RLS/evidence failure rolls back the entire publication;
- public `core.commercial.subscription.changePlan` remains unbound.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35459763237 | 105941403543 | **PASS — 182/182** |
| Core Service Verify / postgres-context-verify | 35459763237 | 105941403548 | **PASS — 47/47 + DB bootstrap PASS** |
| Database Verify / postgres-verify | 35459763287 | 105941403404 | **PASS — 44 migrations / 38 verification files** |
| Web Boundary Verify / web-boundary-verify | 35459763310 | 105941403756 | **PASS — Next 15.5.25 production build + clean generated state** |

All primary jobs asserted exact tested HEAD `a810af51c93dba5959d4b26502c47100afd631fa` and tree `5b4b662acdc450a9878101652e2bd0ce98404da4`.

## Remaining blocker before public changePlan
Implement the **physical DD-062 plan-change evidence layer** only:
- immutable/versioned PlanChangeAssessment persistence;
- blocking impact codes + remediation state/evidence bound to exact assessment version;
- route-resolution state bound to SELF_SERVE / SALES_ASSISTED producer ownership;
- Billing/approval producer handoff/evidence references with no Commercial money calculation;
- server-owned NEXT_RENEWAL effectiveAt;
- exact Tenant/Subscription/source/target/timing/version binding;
- no client-supplied payment/approval/remediation proof becomes authority.

Only after that layer is real and tested may the public REQUIRED-idempotency `core.commercial.subscription.changePlan` command call the verified DD-065 publication primitive.

RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
