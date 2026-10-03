# AI TenantAIConfig request/candidate prerequisite batch ownership audit

**Date:** 2026-09-29  
**Baseline checkpoint:** `DEV-AI-REQUEST-PRE-ROUTING-FLOORS-001`  
**Verified entry HEAD:** `45e36bd48e521409f1f401c7120f226f9c972a06`  
**Verified entry tree:** `44426488fd63e62fc8f57469cdba10b0bf231c4e`  
**Governed batch:** DD-248 through DD-252

## Entry gate

The DD-243…DD-247 state closure is exact-head verified:
- Core Service Verify `36554555824` / `109360473501`: **883/883 PASS**, zero failed/skipped.
- PostgreSQL `36554555824` / `109360473803`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36554555853` / `109360473676`: PASS.
- Web Boundary Verify `36554555827` / `109360473125`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-07, DD-09, DD-119, DD-206…DD-208, DD-211, DD-238…DD-247 yields one independently source-complete backend boundary:

- A-07 requires the Gateway to apply Tenant AI policy/config and sensitivity constraints before provider/model routing.
- DD-09 `TenantAIConfig` owns `enabled`, `allowed_capabilities[]`, `allowed_provider_ids[]`, `allowed_model_ids[]`, `max_sensitivity_class`, `residency_policy_id`, optional monthly budget policy and retention/prompt policy references.
- DD-09 `AIRequest` owns exact `capabilityCode` and `sensitivityClass`.
- DD-206…DD-208 already establish the persisted capability/provider/model allowlist integrity predicates.
- DD-211 already proves that a supplied TenantAIConfig is the exact same-Tenant/version config referenced by a ProvisioningSnapshot, is enabled and contains the snapshot Provider allowlist.
- DD-243…DD-247 already prove exact AIRequest envelope integrity and operation capability/input-schema coherence.
- DD-238…DD-242 already produce deterministic non-ranking Provider/Model pre-candidate refs from supplied catalog evidence.

The source does **not** define current/latest TenantAIConfig selection, an effective Tenant+IndustryAIConfig merge, residency-policy-id → region interpretation, monthly budget semantics, plan quota reservation, model-class → concrete Model mapping, Provider health scoring, cost/latency ranking, fallback order, credential resolution or provider execution.

## Determination

**SOURCE-COMPLETE for TenantAIConfig-constrained request/candidate prerequisites only.**

This batch may:
1. require exact request capability membership in the supplied TenantAIConfig capability allowlist;
2. require request sensitivity to be no higher than the supplied TenantAIConfig max sensitivity;
3. compose those with DD-247 request integrity and DD-211 exact snapshot→TenantAIConfig binding;
4. filter already-built DD-242 pre-candidate refs by exact TenantAIConfig Provider/Model allowlists;
5. combine the request/config prerequisite with that non-ranking allowlist filter.

It must not select the config, interpret residency/budget policy, choose a candidate or execute AI.

## Locked DD-248…DD-252 contracts

### DD-248 — AIRequest TenantAIConfig capability prerequisite
Add `matchesAIRequestTenantConfigCapabilityFloor(request, tenantConfig)`.

Require:
- valid DD-243 AIRequest shape;
- valid TenantAIConfig id/Tenant id;
- dense duplicate-free raw string `allowedCapabilities`;
- exact `request.capabilityCode` membership.

No normalization, entitlement inference or catalog lookup is performed.

### DD-249 — AIRequest TenantAIConfig sensitivity prerequisite
Add `matchesAIRequestTenantConfigSensitivityFloor(request, tenantConfig)`.

Use only the existing closed sensitivity order:
`PUBLIC < INTERNAL < CONFIDENTIAL < SENSITIVE_PERSONAL < REGULATED`.

Require request sensitivity rank <= exact TenantAIConfig `maxSensitivityClass`. This is a necessary ceiling check only, not a full data-class policy/redaction decision.

### DD-250 — Bound request/TenantAIConfig prerequisite
Add `matchesAIRequestTenantConfigPrerequisiteFloors(request, declaration, snapshot, tenantConfig)`.

Compose:
- DD-247 request/declaration pre-routing integrity;
- DD-211 exact snapshot→TenantAIConfig same-Tenant/version/enabled/Provider-subset binding;
- DD-248 capability membership;
- DD-249 sensitivity ceiling.

A true result does not select current/latest config and does not authorize routing.

### DD-251 — TenantAIConfig Provider/Model pre-candidate allowlist filter
Add `filterAITenantConfigProviderModelPreCandidates(candidates, tenantConfig)`.

Require:
- dense finite candidate array;
- each candidate has exact UUID `providerId` and `modelId`;
- duplicate candidate pairs fail closed;
- TenantAIConfig Provider/Model id arrays are dense duplicate-free UUID sets.

Return an immutable canonical providerId/modelId-sorted subset containing only candidates whose Provider **and** Model ids are exact TenantAIConfig allowlist members.

Malformed evidence returns `null`; valid zero-match evidence returns immutable `[]`.

Canonical order is serialization determinism only, never routing preference.

### DD-252 — Combined TenantAIConfig-constrained pre-routing set
Add `buildAITenantConfigConstrainedPreRoutingSet(input)`.

Require DD-250 request/config prerequisites. Then apply DD-251 to the supplied DD-242 pre-candidate refs.

The returned immutable set means only “still eligible to continue into remaining policy/residency/model-class/health/scoring/routing stages.” It is not a route decision.

## Fixed acceptance before implementation

- **AITENREQ-CAP-001** exact request capability membership passes.
- **AITENREQ-CAP-002** missing, duplicate or malformed Tenant capability evidence fails closed.
- **AITENREQ-SENS-001** every known sensitivity pair follows config ceiling >= request sensitivity.
- **AITENREQ-SENS-002** unknown/malformed sensitivity/config evidence fails closed.
- **AITENREQ-BIND-001** DD-247 + exact DD-211 + capability + sensitivity prerequisites pass together.
- **AITENREQ-BIND-002** config version/Tenant/enablement/capability/sensitivity failure denies.
- **AITENROUTE-ALLOW-001** exact Provider+Model allowlist candidates return immutable canonical refs.
- **AITENROUTE-ALLOW-002** valid partial candidate evidence returns only exact allowlisted Provider+Model pairs.
- **AITENROUTE-ALLOW-003** malformed/duplicate/sparse candidate or config allowlist evidence returns null.
- **AITENROUTE-ALLOW-004** valid empty or zero-match evidence returns immutable empty array.
- **AITENROUTE-PRE-001** combined request/config prerequisite plus candidate allowlist filter returns the expected set.
- **AITENROUTE-PRE-002** request/config prerequisite failure returns null rather than an empty success set.
- **AITENROUTE-PRE-003** inputs remain unchanged and output exposes no policy decision, score, fallback, credential or execution authority.

Expected executable delta: Core **883 → 896**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, frontend or product-policy change.

This batch does **not** implement:
- latest/current TenantAIConfig selection;
- effective TenantAIConfig + IndustryAIConfig merge;
- `residencyPolicyId` or request `residencyRequirement` interpretation;
- monthly budget policy, entitlement quota or usage reservation;
- RequestContextRef dereference/trust;
- DD-03/DD-04 Authentication/Authorization success;
- model-class → concrete Model mapping;
- context-window/modality suitability;
- Provider health/circuit state;
- cost/latency scoring, preference, route selection, fallback or retry;
- credential/secret resolution;
- provider SDK execution;
- metering, output guardrails or final audit append.

After DD-248…DD-252 implementation and targeted regression, perform the governed batch-boundary Core/PostgreSQL/Database/Web verification. Canonical synchronization occurs only after the full five-step subsystem milestone.
