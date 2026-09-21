# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-IMMUTABILITY-AUDIT-CORRECTION-001
**Updated:** 2026-09-21  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — DD-070 preserved; PlanVersion/runtime-enum audit correction verified

## Verified executable basis
- Commit: `ffe74ed8c3169c77b3a1135e615ae5d07a711e1e`.
- Tree: `db85be98f256fd856635fc178ab3220b97d01ba3`.
- Core/server acceptance: **199/199 PASS**.
- Real PostgreSQL regression: **56/56 PASS**.
- Database: **46 migrations / 40 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock and generated-state cleanliness: **PASS**.

## Current governed boundary
DD-070 remains the latest feature slice: active same-Tenant TenantAddOn/override source reads plus the server-owned eligibility resolver seam. The 2026-09-21 audit correction adds no pricing/eligibility rule; it enforces the already-governed immutable published PlanVersion contract and fail-closed runtime Commercial enum/value-type validation.

The exact-tree audit covered **359 blobs / 73 source / 49 tests**, preserved RawSourceCorpus, and revalidated **9 Industries / 41 canonical MS / 181 Industry tables**. ADR-001…020 and DD-001…070 remain contiguous.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35558948195 | 106207964142 | **PASS — 199/199** |
| Core Service Verify / postgres-context-verify | 35558948195 | 106207964247 | **PASS — 56/56 + DB bootstrap** |
| Database Verify / postgres-verify | 35558948164 | 106207964280 | **PASS — 46 migrations / 40 verification files** |
| Web Boundary Verify / web-boundary-verify | 35558948165 | 106207964260 | **PASS — Next 15.5.25 build + clean generated state** |

## Remaining target-preview blockers
- deterministic DD-04 precedence over DD-068 baseline + DD-070 prepared adjustments is not yet implemented;
- LIMIT_SET/LIMIT_DELTA has no meter_code in tenant_override, so non-unique target meter mapping must fail closed;
- concrete production add-on eligibility resolver/business rules remain unfinished;
- compliance/security restriction inputs and usage-meter target impact remain downstream;
- Billing/payment/proration and Workflow approval producer runtimes remain unfinished;
- public `core.commercial.subscription.changePlan` remains intentionally unbound.

**Next:** implement only deterministic baseline → override → resolver-eligible add-on precedence with ambiguity fail-closed.

Evidence register: `Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-21.md`.  
RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
