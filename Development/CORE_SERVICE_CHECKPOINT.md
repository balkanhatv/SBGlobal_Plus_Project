# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-PLAN-CHANGE-EVIDENCE-001
**Updated:** 2026-09-20  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — governed plan-change evidence persistence + producer isolation

## Verified executable snapshot
- Commit: `b77f6ce8cd7fcf0617369a0786dea15113a7b72b`.
- Tree: `2130302dc137399724da7082a7212dc3d75db2fe`.
- Core/server acceptance: **184/184 PASS**.
- Real PostgreSQL regression: **49/49 PASS**.
- Database: **45 migrations / 39 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock and generated-state cleanliness: **PASS**.

## DD-066 executable boundary
- immutable/versioned TENANT_CORE `plan_change_assessment` persists exact Subscription/source/target/timing/version/route bindings;
- DB insert guard rechecks current Subscription version/source PlanVersion and ACTIVE target PlanVersion/Plan/route policy;
- assessment versions are contiguous and cannot silently rebind the core source/target tuple;
- remediation evidence is append-only, versioned and Commercial-producer-bound;
- SELF_SERVE route resolution is append-only through the dedicated Billing evidence role only;
- SALES_ASSISTED route resolution is append-only through the Workflow worker boundary only;
- SATISFIED NEXT_RENEWAL requires server-owned effectiveAt;
- evidence tables are FORCE-RLS, immutable-scope enrolled and hidden from general app/worker/control-plane mutation;
- `PlanChangeEvidenceService` is SERVICE/TENANT_CORE-only and fixes producer ownership by method;
- real PostgreSQL acceptance proves stale Subscription rejection, remediation→reassessment binding, producer separation and evidence immutability.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35486746600 | 106014414422 | **PASS — 184/184** |
| Core Service Verify / postgres-context-verify | 35486746600 | 106014414488 | **PASS — 49/49 + DB bootstrap PASS** |
| Database Verify / postgres-verify | 35486746558 | 106014414210 | **PASS — 45 migrations / 39 verification files** |
| Web Boundary Verify / web-boundary-verify | 35486746551 | 106014414305 | **PASS — Next 15.5.25 production build + clean generated state** |

All primary jobs asserted exact tested HEAD `b77f6ce8cd7fcf0617369a0786dea15113a7b72b` and tree `2130302dc137399724da7082a7212dc3d75db2fe`.

## Remaining blockers before public changePlan
DD-066 provides the persistence/producer-isolation substrate; it does **not** manufacture business truth.

Still required:
- server-owned impact + entitlement-diff evaluator from actual current usage/licensing/target-plan facts;
- server-owned remediation verification rather than accepting a precomputed evidence reference as business truth;
- actual Billing/payment/proration/no-charge producer runtime for SELF_SERVE;
- actual Workflow/approval producer runtime for SALES_ASSISTED;
- internal apply gate that selects only current SATISFIED evidence and deterministic compiler output before invoking DD-065 publication;
- only then bind REQUIRED-idempotency `core.commercial.subscription.changePlan` through OperationExecutor/tRPC/Next.

RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
