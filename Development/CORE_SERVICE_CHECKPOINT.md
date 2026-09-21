# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-RESTRICTION-INPUT-001
**Updated:** 2026-09-21  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — DD-072 compliance/security restriction input boundary

## Verified executable basis
- Commit: `b0ff514b4063b648f8869a7e12008a68ebd8fe5a`.
- Tree: `d7b28ba1310bc77283cc479002052fbde2febe7b`.
- Core/server acceptance: **216/216 PASS**.
- Real PostgreSQL regression: **56/56 PASS**.
- Full database bootstrap at the same feature HEAD: **46 migrations / 40 verification files PASS**.
- Next.js 15.5.25 production build: **PASS**.
- Feature-tree inventory: **367 blobs / 75 source / 51 test files**.

## DD-072 executable boundary
- requires a resolved SERVICE + TENANT_CORE RequestContext before resolver execution;
- gives the server-owned resolver only the exact target PlanVersion id plus the immutable DD-071 intermediate preview;
- rebinds resolver output to that exact target PlanVersion and requires bounded policyVersion/evidenceReference;
- v1 accepts only exact existing entitlement **DENY** targets, optionally exact-Industry scoped, with a controlCode;
- missing targets, selector fan-out/guessing, ALLOW, numeric/opaque effects, duplicate control-target tuples, malformed evidence and stale target binding fail closed;
- resolver dependency failure never becomes an implicit empty/allow-like restriction set;
- output is immutable and deterministic.

DD-072 deliberately adds **no database table/migration/role**, legal or regulatory business rule, numeric security cap, generic RESTRICT reducer or client-supplied policy authority. It prepares restriction authority only; it does not yet apply the prepared denies to produce a final target preview.

DD-071 remains the verified predecessor. Its failed `f52f0d1…` compile attempt stays historical/non-promoted; corrected DD-071 feature basis `1c8844ec982ef91cacc3545576d102fbac3fcaf9` remains preserved in history.

## Still unfinished
- concrete production add-on eligibility resolver/business rules;
- concrete governed compliance/security restriction source/resolver;
- application of prepared DD-072 denies to the DD-071 preview;
- usage-meter target-impact evaluation;
- suspension/grace lifecycle overlay;
- final target snapshot/publication/apply gate;
- Billing/payment/proration + Workflow approval producers;
- public `core.commercial.subscription.changePlan`;
- broad REST/OpenAPI and product UI/deployment readiness.

**Next governed work:** usage-meter target-limit impact can proceed as an independent prerequisite only after source-contract recheck; final target preview remains blocked on a concrete governed restriction resolver plus restriction application. Do not invent policy sources or producer behavior.

Evidence: `Registers/DEVELOPMENT_DD072_VERIFICATION_2026-09-21.md`.
