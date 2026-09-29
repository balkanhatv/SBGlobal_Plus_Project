# AI Provider/Model catalog-candidate prerequisite batch ownership audit

**Date:** 2026-09-29  
**Baseline checkpoint:** `DEV-AI-OPERATION-PRE-PROVIDER-FLOORS-001`  
**Verified entry HEAD:** `1df6459e3da0d6fa8972a27f7af4eae9341a3c91`  
**Verified entry tree:** `da55ae9be19ec9f45c032348c139ce2dbbff9805`  
**Governed batch:** DD-231 through DD-237

## Entry gate

The DD-225…DD-230 state-closure correction is exact-head verified:
- Core Service Verify `36519762912` / `109249832430`: **843/843 PASS**, zero failed/skipped.
- PostgreSQL `36519762912` / `109249832547`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36519762925`: PASS.
- Web Boundary Verify `36519762947`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-07, DD-09, DD-107, DD-108, DD-200, DD-223 and DD-225…230 yields a bounded next step.

A-07 owns the AI Gateway choke point and route inputs: capability, tenant policy, provider/model allowlist, sensitivity ceiling, residency, model capability/context need, entitlement/budget, latency/cost and health/fallback. DD-09 owns:
- AIProvider `supported_regions[]`, `supported_capabilities[]`, raw status and health metadata;
- AIModel `provider_id`, `capabilities[]`, `residency_regions[]`, `sensitivity_ceiling`, raw status, cost/latency/context metadata;
- AIRequest `capabilityCode`, `sensitivityClass`, `residencyRequirement`;
- the rule that routing considers capability → policy/allowlists → sensitivity → residency → model capability/context → entitlement/budget → cost/latency → health/circuit;
- the rule that fallback candidates are filtered by the same security/residency constraints before preference.

DD-223 already supplies exact ACTIVE Provider membership in the ProvisioningSnapshot allowlist. DD-200 already supplies exact AIModel → AIProvider id continuity. DD-225…230 already supplies a canonical AI operation declaration with exact capability code plus pre-provider context/snapshot/capability prerequisites.

The source does **not** yet supply a complete current model-class mapping from `AIProvisioningSnapshot.allowedModelClasses` to one concrete AIModel id, a complete runtime AIPolicy evaluator, quota/budget reservation, provider-health/circuit reducer, cost/latency scoring, fallback ordering, credential resolution or provider SDK execution.

## Determination

**SOURCE-COMPLETE for necessary Provider/Model catalog-candidate filters only.**

This batch may prove that already-supplied Provider/Model catalog evidence is compatible with the declared capability, an already-authorized residency region and a request sensitivity class. It must not select the candidate, authorize the request, invent a model-class mapping or execute AI.

## Locked DD-231…DD-237 contracts

### DD-231 — Provider capability candidate prerequisite
Add `matchesAIOperationProviderCapabilityCandidateFloor(declaration, snapshot, provider)`.
Require:
1. valid DD-225 AI declaration shape;
2. DD-223 exact ACTIVE Provider membership in the snapshot;
3. provider `supportedCapabilities` is an array whose members are only string/null as preserved by DD-107;
4. exact raw declaration capability-code membership among string entries.
Null/empty unrelated entries are not normalized into support.

### DD-232 — Provider authorized-region support prerequisite
Add `matchesAIProviderAuthorizedRegionCandidateFloor(provider, authorizedResidencyRegion)`.
The region input is already-authorized upstream policy evidence; this helper does not authorize it.
Require valid Provider id, string/null-preserving `supportedRegions` evidence, a non-empty string candidate region and exact raw membership.

### DD-233 — Model exact Provider + ACTIVE candidate prerequisite
Add `matchesAIModelProviderActiveCandidateFloor(model, provider)`.
Compose DD-200 exact Model→Provider binding and require raw Model `status === "ACTIVE"`. Provider ACTIVE/snapshot membership remains DD-231 ownership.

### DD-234 — Model capability support prerequisite
Add `matchesAIModelCapabilityCandidateFloor(declaration, model)`.
Require valid DD-225 declaration, valid Model identity, string/null-preserving Model `capabilities` evidence and exact raw declaration capability-code membership.

### DD-235 — Model sensitivity-ceiling prerequisite
Add `matchesAIModelSensitivityCandidateFloor(model, sensitivityClass)`.
Use only the existing closed sensitivity order:
`PUBLIC < INTERNAL < CONFIDENTIAL < SENSITIVE_PERSONAL < REGULATED`.
Require exact known request sensitivity and Model sensitivity ceiling, with Model ceiling rank >= request rank. No data-class policy decision is inferred.

### DD-236 — Model authorized-region support prerequisite
Add `matchesAIModelAuthorizedRegionCandidateFloor(model, authorizedResidencyRegion)`.
Require valid Model identity, string/null-preserving `residencyRegions`, a non-empty already-authorized region and exact raw membership.

### DD-237 — Combined Provider/Model catalog-candidate prerequisite floor
Add `matchesAIOperationProviderModelCatalogCandidateFloors(input)`.
Compose DD-231…DD-236 only.

A true result means only that the supplied Provider/Model catalog pair survives these necessary catalog checks. It is **not** final model eligibility, routing selection or execution authority.

## Fixed acceptance before implementation

- **AIROUTE-PROV-CAP-001** exact allowed ACTIVE Provider with exact supported capability passes.
- **AIROUTE-PROV-CAP-002** absent capability, malformed support-array evidence or disallowed/inactive Provider fails.
- **AIROUTE-PROV-REG-001** exact pre-authorized Provider region membership passes.
- **AIROUTE-PROV-REG-002** empty/unknown/non-string region or malformed Provider region evidence fails.
- **AIROUTE-MODEL-PROV-001** exact Model→Provider binding with raw ACTIVE Model passes.
- **AIROUTE-MODEL-PROV-002** wrong Provider, malformed identity or non-ACTIVE Model fails.
- **AIROUTE-MODEL-CAP-001** exact Model capability membership passes.
- **AIROUTE-MODEL-CAP-002** absent capability or malformed capability evidence fails.
- **AIROUTE-MODEL-SENS-001** every known sensitivity pair follows Model ceiling >= request sensitivity.
- **AIROUTE-MODEL-SENS-002** unknown/malformed sensitivity evidence fails closed.
- **AIROUTE-MODEL-REG-001** exact pre-authorized Model residency-region membership passes.
- **AIROUTE-MODEL-REG-002** unknown/empty/malformed region evidence fails.
- **AIROUTE-CAND-001** all DD-231…236 prerequisites pass together.
- **AIROUTE-CAND-002** failure of any composed prerequisite denies the combined candidate floor.
- **AIROUTE-CAND-003** inputs remain unchanged and true result exposes no model-class mapping, policy/quota, scoring, fallback, credential or execution authority.

Expected executable delta: Core **843 → 858**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK or product-policy change.

This batch does **not** implement:
- Authentication, RequestContext or DD-03/DD-04 Authorization success;
- AIPolicy evaluation or entitlement/quota/budget reservation;
- conversion of `residencyRequirement` into an authorized region;
- model-class → concrete AIModel mapping;
- TenantAIConfig/IndustryAIConfig effective-current selection;
- context-window or modality suitability;
- Provider health/circuit eligibility;
- cost/latency preference or scoring;
- route-decision creation, fallback ordering or retry;
- credential resolution/secret access;
- provider SDK/inference/embedding/media/RAG/agent/tool execution;
- metering, output guardrails or final audit append.

After DD-231…DD-237 implementation and targeted regression, perform the governed batch-boundary Core/PostgreSQL/Database/Web verification. Canonical synchronization occurs only after that full 7-step milestone gate.
