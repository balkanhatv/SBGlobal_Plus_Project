# COMMERCIAL FINAL TARGET-PREVIEW MATERIALIZATION SOURCE AUDIT

**Date:** 2026-09-21  
**Baseline:** `5a6f03d3e800a5640acb40c59239c531fdb5587a` / `38246a07e1cb68fca45aa3345db969a70d8a6183`  
**Scope:** deterministic composition after DD-071…DD-074.

## Governing evidence

- DD-071 already materializes the post-baseline/license/override/eligible-add-on entitlement and limit preview.
- DD-072 normalizes compliance/security as exact existing entitlement DENY targets only; F-14/DD-04 require those restrictions to narrow and deny-wins.
- DD-069/DD-071 already define scope-aware DENY representation: Tenant DENY → Tenant-wide deny set; Industry DENY → exact type-specific disabled scoped fact.
- DD-073 produces exact-target usage impact evidence without changing target limits or choosing remediation.
- DD-074 produces lifecycle posture metadata and explicitly forbids rewriting entitlement facts/limits.
- DD-04 runtime/publication boundaries require current Subscription and snapshot revalidation at apply/runtime; snapshot facts alone are not final access authority.

## Safe DD-075 composition

DD-075 may therefore deterministically:
1. revalidate one exact target PlanVersion binding across DD-072 and DD-073 evidence;
2. apply each DD-072 DENY using the already-governed DD-069 representation;
3. preserve DD-071 limits unchanged;
4. revalidate that DD-073 impact exactly covers those target limits and that its status matches the used-value comparison;
5. attach the canonical DD-074 lifecycle posture without entitlement mutation;
6. preserve policy/evidence references and deterministic ordering.

## Deliberate boundary

This output is a **final target preview**, not a publishable EntitlementSnapshot payload and not apply authority.

DD-075 does not:
- interpret a concrete compliance/security policy source;
- select usage periods or resolve outstanding reservations;
- synthesize DD-066 `blockingImpactCodes` or remediation state;
- convert NOT_INCLUDED/ADD_ON_ONLY markers into persisted snapshot-fact policy;
- compute a source fingerprint;
- select `effective_from/effective_to`, source IDs or publication metadata;
- authorize Billing/Workflow evidence;
- call DD-065 publication;
- bind public `core.commercial.subscription.changePlan`.

Those remain separate governed producers/orchestration steps.
