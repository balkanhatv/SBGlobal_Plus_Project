# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-ADJUSTMENT-SOURCE-001
**Updated:** 2026-09-20  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — active Commercial adjustment-source boundary + server-owned eligibility resolver seam

## Verified executable basis
- Commit: `8b735dd19b18ae5e9f0d1d3894cd497bb56c26b0`.
- Tree: `631abc2f75e108027440771507ee85350b9eb698`.
- Core/server acceptance: **196/196 PASS**.
- Real PostgreSQL regression: **56/56 PASS**.
- Database: **45 migrations / 39 verification files PASS**.
- Next.js 15.5.25 production build, deterministic npm lock and generated-state cleanliness: **PASS**.

## DD-070 executable boundary
- `CommercialAdjustmentSourceService` requires SERVICE + TENANT_CORE and exact Subscription/source/target/effective-time binding;
- `PostgresCommercialAdjustmentSourceStore` revalidates the Tenant's authoritative current Subscription pointer/version/source PlanVersion;
- target PlanVersion + parent Plan + route policy must be ACTIVE/effective;
- only ACTIVE/effective TenantAddOn rows bound to the exact Tenant + Subscription are read;
- only ACTIVE/effective tenant overrides with ACTIVE entitlement definitions are read;
- sibling-Tenant TenantAddOn/override rows remain invisible under predicates + FORCE-RLS;
- raw `eligibility_json` and target trial/billing policy documents remain opaque;
- only the server-owned eligibility resolver seam may return ELIGIBLE/INELIGIBLE + policyVersion/evidenceReference;
- DD-069 quota deltas are parsed/scaled only after ELIGIBLE;
- no concrete eligibility, pricing, market or payment business rule is claimed.

## Zero-trust current-state audit evidence
- repository inventory: **357 files / 73 source files / 49 test files**;
- RawSourceCorpus blobs are byte-identical to the prior audited baseline;
- **9 Industries / 41 canonical Management Systems / 181 registered Industry tables** remain exact;
- all 45 migrations bootstrap cleanly and all 39 verification files pass;
- source sweep found no TODO/FIXME/HACK, eval/child-process execution, or unconstrained dynamic SQL path;
- all 49 test files have no skip/only/todo markers;
- `main` remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 is OPEN DRAFT / unmerged.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35529517700 | 106127519146 | **PASS — 196/196** |
| Core Service Verify / postgres-context-verify | 35529517700 | 106127519284 | **PASS — 56/56 + DB bootstrap PASS** |
| Database Verify / postgres-verify | 35529517714 | 106127519163 | **PASS — 45 migrations / 39 verification files** |
| Web Boundary Verify / web-boundary-verify | 35529517713 | 106127519121 | **PASS — Next 15.5.25 production build + clean generated state** |

All evidence above asserted exact tested HEAD `8b735dd19b18ae5e9f0d1d3894cd497bb56c26b0` and tree `631abc2f75e108027440771507ee85350b9eb698`.

## Remaining target-preview blockers
- deterministic DD-04 precedence over DD-068 baseline + DD-070 prepared adjustments is not yet implemented;
- LIMIT_SET/LIMIT_DELTA has no meter_code in tenant_override, so multiple target meter matches must fail closed rather than guess;
- a concrete governed production add-on eligibility resolver remains unfinished;
- compliance/security restriction inputs and usage-meter impact remain downstream;
- Billing/payment/proration and Workflow approval producer runtimes remain unfinished;
- public `core.commercial.subscription.changePlan` remains intentionally unbound.

Next: implement the bounded deterministic baseline → override → resolver-eligible add-on precedence stage only, with ambiguity fail-closed.

RawSourceCorpus immutable; `main` unmerged; PR #2 review-only/draft.
