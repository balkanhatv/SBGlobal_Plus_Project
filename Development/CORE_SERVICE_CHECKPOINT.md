# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-ATOMIC-APPLY-EVIDENCE-001
**Updated:** 2026-09-21  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — DD-078 atomic persisted-evidence publication binding

## Verified executable basis
- Commit: `8fa3963f691ccc8d4d913c880556bea5512cc0a3`.
- Tree: `e79fedbecc4560ebcd5a5d5c876dd4870e7a5699`.
- Core/server acceptance: **265/265 PASS**.
- Real PostgreSQL regression: **63/63 PASS**.
- Full database bootstrap: **47 migrations / 41 verification files PASS**.
- Next.js 15.5.25 production build: **PASS**.
- Database Verify: **PASS**.
- Feature-tree inventory: **393 blobs / 153 Markdown / 81 source / 57 test files**.

## DD-078 executable boundary
- DD-065 internal publication now requires exact DD-066 assessment id/version;
- publication acquires a Tenant+assessment transaction lock before evidence validation;
- DD-066 assessment/remediation/route inserts acquire the same transaction lock via migration 0047;
- latest assessment version, exact Subscription/source/target/version and source fingerprint are revalidated inside the publication transaction;
- blockers/PENDING remediation deny publication; SATISFIED reassessment requires prior Commercial remediation evidence;
- current target route policy id/version/route enablement is revalidated;
- latest route resolution must be SATISFIED and Billing-owned for SELF_SERVE or Workflow-owned for SALES_ASSISTED;
- NEXT_RENEWAL effectiveAt must be reached and exactly equal publication effectiveAt;
- all existing DD-065 Subscription/current snapshot/fact/Industry/outbox/audit checks remain in the same mutation transaction;
- compiler role retains read-only DD-066 evidence authority; only lock-helper EXECUTE was added.

## Still unfinished
- concrete production DD-076 assessment evaluator;
- DD-066 assessment-write orchestration from DD-076;
- actual Billing/payment/proration producer runtime;
- actual Workflow approval producer runtime;
- production usage period/reservation semantics;
- concrete compliance/security resolver;
- remaining snapshot-fact/source metadata/fingerprint producer mapping where not yet governed;
- public `core.commercial.subscription.changePlan`;
- broad product UI/REST/OpenAPI/deployment readiness.

**Next governed work:** source-audit the missing production assessment producer chain. Prefer the smallest source-governed bridge from DD-076 prepared assessment to DD-066 persistence; do not invent blocker vocabulary, diff schema, fingerprint algorithm, route chooser, Billing or Workflow decisions.

Evidence: `Registers/DEVELOPMENT_DD078_VERIFICATION_2026-09-21.md`.
