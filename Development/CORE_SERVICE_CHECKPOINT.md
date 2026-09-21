# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-ADJUSTMENT-PRECEDENCE-001
**Updated:** 2026-09-21  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — DD-071 deterministic adjustment precedence

## Verified executable basis
- Commit: `1c8844ec982ef91cacc3545576d102fbac3fcaf9`.
- Tree: `0792a28622e000beba2e785ce1f0a3282b1fff96`.
- Core/server acceptance: **207/207 PASS**.
- Real PostgreSQL regression: **56/56 PASS**.
- Full database bootstrap at the same feature HEAD: **46 migrations / 40 verification files PASS**.
- Next.js 15.5.25 production build: **PASS**.
- Feature-tree inventory: **363 blobs / 74 source / 50 test files**.

## DD-071 executable boundary
- consumes only DD-068 resolved baseline + DD-070 prepared adjustments;
- exact-scope DENY beats ALLOW; multiple ALLOW rows without DENY fail ambiguous;
- Tenant DENY produces Tenant deny-set; Industry DENY produces scoped disabled value;
- LIMIT_SET/LIMIT_DELTA require exactly one target meter for the exact entitlement scope; zero target fails invalid, multiple targets fail ambiguous;
- LIMIT_SET replaces with FINITE; LIMIT_DELTA requires FINITE and a valid non-negative result;
- resolver-ELIGIBLE add-ons apply after overrides and remain quota-additive only;
- TENANT/INDUSTRY_CODE/LICENSED_INDUSTRIES selectors resolve only against already-resolved limit targets;
- FINITE accumulates; ADD_ON_ONLY begins at zero; NOT_INCLUDED/UNLIMITED reject additive quota application;
- output is immutable and deterministic.

The first implementation commit `f52f0d11216792bbf87d10939865fd045aa14b33` failed TypeScript narrowing and was not promoted. Corrected `1c8844ec982ef91cacc3545576d102fbac3fcaf9` passed all feature gates above.

## Still unfinished
- concrete production add-on eligibility resolver/business rules;
- compliance/security restriction precedence;
- usage-meter target-impact evaluation;
- suspension/grace target overlay;
- final target snapshot/publication/apply gate;
- Billing/payment/proration + Workflow approval producers;
- public `core.commercial.subscription.changePlan`;
- broad REST/OpenAPI and product UI/deployment readiness.

**Next governed work:** compliance/security restriction input contract before final target preview; do not invent policy sources or producer behavior.

Evidence: `Registers/DEVELOPMENT_DD071_VERIFICATION_2026-09-21.md`.
