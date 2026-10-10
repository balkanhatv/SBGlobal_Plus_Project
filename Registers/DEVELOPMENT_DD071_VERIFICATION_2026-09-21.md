# DD-071 DEVELOPMENT VERIFICATION — 2026-09-21

**Checkpoint:** `DEV-COMMERCIAL-ADJUSTMENT-PRECEDENCE-001`  
**Feature executable:** `1c8844ec982ef91cacc3545576d102fbac3fcaf9`  
**Feature tree:** `0792a28622e000beba2e785ce1f0a3282b1fff96`

## Scope
Implemented the bounded deterministic Commercial adjustment precedence stage defined by DD-071:
- DD-068 resolved PlanVersion baseline remains authoritative;
- DD-070 prepared active adjustments are the only adjustment input;
- DENY beats ALLOW at exact entitlement scope;
- multiple competing ALLOW rows fail ambiguous;
- LIMIT_SET/LIMIT_DELTA require exactly one target meter because persisted overrides have no meter_code;
- resolver-ELIGIBLE quota add-ons apply after overrides and are additive only;
- FINITE targets accumulate; explicit ADD_ON_ONLY starts from zero; NOT_INCLUDED/UNLIMITED are not additive v1 targets;
- missing targets, ambiguous meters, value-type mismatch and invalid numeric results fail closed;
- output is immutable/deterministically sorted.

Not implemented/claimed: production eligibility business logic, compliance/security restriction stage, usage impact, subscription overlay, final snapshot/publication, Billing/payment/proration, Workflow approval, public changePlan.

## Failed attempt retained in history
Commit `f52f0d11216792bbf87d10939865fd045aa14b33` was **not promoted**. Core/Web compilation exposed a TypeScript union-narrowing defect in the LIMIT_DELTA branch. It was corrected without changing business semantics in `1c8844ec982ef91cacc3545576d102fbac3fcaf9`.

## Verified evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35563971430 | 106222014138 | **PASS — 207/207, fail 0, skipped 0** |
| Core Service Verify / postgres-context-verify | 35563971430 | 106222014294 | **PASS — DB bootstrap + 56/56 PostgreSQL** |
| Web Boundary Verify / web-boundary-verify | 35563971387 | 106222014047 | **PASS — Next.js 15.5.25 production build** |

The Core/PostgreSQL/Web jobs assert exact tested commit `1c8844ec982ef91cacc3545576d102fbac3fcaf9` and tree `0792a28622e000beba2e785ce1f0a3282b1fff96`. The governed promotion/state commit is required to re-run all checkpoint-triggered workflows, including Database Verify, before final current-state promotion.
