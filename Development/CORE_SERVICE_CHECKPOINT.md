# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-USAGE-IMPACT-001
**Updated:** 2026-09-21  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — DD-073 bounded usage-meter target-impact

## Verified executable basis
- Commit: `d982eb59098e4dc51586a2cf5e92771909566ea4`.
- Tree: `ad4b22497f93956337f6a86e0fa4f76a13bec46a`.
- Core/server acceptance: **225/225 PASS**.
- Real PostgreSQL regression: **56/56 PASS**.
- Full database bootstrap at the same feature HEAD: **46 migrations / 40 verification files PASS**.
- Next.js 15.5.25 production build: **PASS**.
- Database Verify: **PASS**.
- Feature-tree inventory: **371 blobs / 143 Markdown / 76 source / 52 test files**.

## DD-073 executable boundary
- BR-SUB-04 current-usage-vs-target comparison is implemented only over server-selected authoritative measurements;
- SERVICE + TENANT_CORE context is mandatory before usage-source execution;
- source receives exact target PlanVersion, effectiveAt and deterministic DD-071 target limits;
- FINITE compares persisted selected `used_value` against the target limit;
- DD-071 NOT_INCLUDED and still-ADD_ON_ONLY are zero included target capacity for this comparison;
- UNLIMITED is non-blocking and requires no selected measurement;
- every bounded target requires exactly one selected measurement; missing/unknown/multiple-period targets fail closed;
- non-zero `reserved_value` fails closed because downgrade reservation semantics are not governed;
- result is immutable/deterministic and reports `WITHIN_TARGET | EXCEEDS_TARGET | UNLIMITED` plus aggregate blocking usage.

## Deliberately unfinished
- concrete PostgreSQL current-period selector for `usage_meter`;
- governed treatment/reconciliation of outstanding `reserved_value`;
- concrete production add-on eligibility resolver;
- concrete governed compliance/security restriction source/resolver;
- application of prepared DD-072 restrictions;
- suspension/grace lifecycle overlay;
- final target snapshot/publication/apply orchestration;
- Billing/payment/proration + Workflow approval producers;
- public `core.commercial.subscription.changePlan`;
- broad REST/OpenAPI and product UI/deployment readiness.

**Next governed work:** source-audit F-14 §2/§6 + DD-04 lifecycle semantics and implement only a deterministic lifecycle target-overlay prerequisite if the source is sufficient. Final target preview remains blocked on concrete restriction authority/application and production usage-period/reservation binding.

Evidence: `Registers/DEVELOPMENT_DD073_VERIFICATION_2026-09-21.md`.
