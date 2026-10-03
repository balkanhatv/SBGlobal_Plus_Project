# AI Provider/Model catalog pre-candidate set batch ownership audit

**Date:** 2026-09-29  
**Baseline checkpoint:** `DEV-AI-PROVIDER-MODEL-CATALOG-CANDIDATE-FLOORS-001`  
**Verified entry HEAD:** `8038e2aefa5476d04ddcbcb336d7b6aa7923b1de`  
**Verified entry tree:** `d1ed95613a09b295073680edd6d641c4c6c2913b`  
**Governed batch:** DD-238 through DD-242

## Entry gate

The DD-231…DD-237 state-closure correction is exact-head verified:
- Core Service Verify `36523737789` / `109262054540`: **858/858 PASS**, zero failed/skipped.
- PostgreSQL `36523737789` / `109262054734`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36523737821` / `109262054803`: PASS.
- Web Boundary Verify `36523737792` / `109262054534`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

A-07 §2–3 and DD-09 §4 explicitly separate routing into:
1. mandatory security/policy/catalog filtering;
2. later cost/latency preference, health/circuit and fallback ordering;
3. provider execution only after route selection.

DD-231…DD-237 now own the source-complete pair-level Provider/Model catalog filters:
- exact snapshot-allowed raw-ACTIVE Provider;
- Provider capability support;
- already-authorized Provider region support;
- exact Model→Provider binding with raw ACTIVE Model;
- Model capability support;
- Model sensitivity ceiling;
- already-authorized Model region support.

The source still does **not** define a complete current model-class→concrete Model mapping, Provider-health state machine, cost/latency ranking algorithm, fallback ordering, credentials or SDK execution. Therefore the next source-complete backend step is only to build the finite **catalog pre-candidate set** from already-loaded Provider/Model evidence.

## Determination

**SOURCE-COMPLETE for deterministic non-ranking catalog pre-candidate set construction only.**

No candidate returned by this batch is yet routable. A returned set means only “these supplied Provider/Model pairs passed DD-237 catalog prerequisites.”

## Locked DD-238…DD-242 contracts

### DD-238 — Candidate evidence-set shape floor
Add `matchesAIProviderModelCatalogEvidenceSetFloor(providers, models)`.
Require:
- dense finite arrays;
- unique valid Provider ids;
- unique valid Model ids;
- every Model has valid Provider id;
- every Model Provider id resolves to exactly one supplied Provider.
Provider/Model catalog semantics beyond identity are uninterpreted here.

### DD-239 — Exact catalog pair projection
Add `projectAIProviderModelCatalogPair(model, provider)`.
Require exact DD-200 Model→Provider binding and return immutable `{providerId, modelId}`; invalid pair returns `null`.
This projection carries no route score/order/credential/execution authority.

### DD-240 — DD-237 pre-candidate filtering
Add `filterAIOperationProviderModelCatalogPreCandidates(input)`.
Input includes one declaration, snapshot, sensitivity class, already-authorized residency region, and supplied Provider/Model arrays.
Require DD-238 evidence-set validity before any candidate output.
For each Model, resolve its exact Provider and include the pair only when DD-237 passes.

### DD-241 — Deterministic non-ranking candidate-set canonicalization
The filtered result must be immutable, duplicate-free and canonically sorted by `providerId`, then `modelId`, solely for deterministic serialization/testing.
This order is explicitly **not** cost/latency/health/fallback preference.

### DD-242 — Empty/partial set semantics
Malformed evidence fails closed with `null`.
Valid evidence with zero passing pairs returns an immutable empty array.
Valid evidence with some rejected pairs returns only passing candidates; rejected pairs do not trigger fallback invention, Provider substitution or Model guessing.

## Fixed acceptance before implementation

- **AIROUTE-SET-SHAPE-001** valid unique Provider/Model evidence with exact Provider references passes.
- **AIROUTE-SET-SHAPE-002** sparse arrays, duplicate ids, malformed ids or orphan Model provider references fail closed.
- **AIROUTE-PAIR-001** exact Model→Provider pair projects immutable ids.
- **AIROUTE-PAIR-002** wrong/malformed pair returns null and grants no route metadata.
- **AIROUTE-SET-FILTER-001** all DD-237-passing pairs are included and failing pairs excluded.
- **AIROUTE-SET-FILTER-002** filtering is independent of input array order.
- **AIROUTE-SET-CANON-001** output is immutable, duplicate-free and canonical providerId/modelId order.
- **AIROUTE-SET-CANON-002** canonical order is not exposed as score/preference/fallback metadata.
- **AIROUTE-SET-EMPTY-001** valid zero-match evidence returns immutable empty array.
- **AIROUTE-SET-EMPTY-002** malformed evidence returns null instead of an empty success set.
- **AIROUTE-SET-BOUND-001** inputs remain unchanged.
- **AIROUTE-SET-BOUND-002** output exposes only Provider/Model ids and no model-class mapping, route decision, policy/quota, health, score, fallback, credentials or execution authority.

Expected executable delta: Core **858 → 870**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, frontend or product-policy change.

This batch does **not** implement:
- model-class→concrete Model mapping;
- current/effective TenantAIConfig or IndustryAIConfig selection;
- AIPolicy/entitlement/quota/budget evaluation;
- request context-window or modality suitability;
- Provider health/circuit eligibility;
- cost/latency scoring or preference;
- route decision creation;
- fallback ordering/retry;
- credential/secret resolution;
- provider SDK execution;
- metering/output guardrails/final audit.

After DD-238…DD-242 implementation and targeted regression, perform the governed batch-boundary Core/PostgreSQL/Database/Web verification. Canonical synchronization occurs only after the full 5-step milestone gate.
