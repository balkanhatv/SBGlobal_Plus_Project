# AI IndustryAIConfig request/candidate prerequisite batch ownership audit

**Date:** 2026-09-29  
**Baseline checkpoint:** `DEV-AI-TENANT-CONFIG-REQUEST-CANDIDATE-FLOORS-001`  
**Verified entry HEAD:** `3c631f5e9233b371f05b6155f4c076512666d3e6`  
**Verified entry tree:** `78b25f7c5d9fd1de4336e572a10d6542bf558a30`  
**Governed batch:** DD-253 through DD-257

## Entry gate

The DD-248…DD-252 state closure is exact-head verified:
- Core Service Verify `36562780733` / `109387368623`: **896/896 PASS**, zero failed/skipped.
- PostgreSQL `36562780733` / `109387368767`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36562780606` / `109387368139`: PASS.
- Web Boundary Verify `36562780722` / `109387368488`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-07, DD-09, DD-120, DD-205, DD-209…DD-211, DD-238…DD-252 and migration 0031 yields one independently source-complete backend boundary:

- A-07 requires Tenant/context AI configuration and policy constraints to be applied before provider/model routing.
- DD-09 `IndustryAIConfig` owns exact Tenant + Industry Context, `enabled`, capability allowlist, Provider/Model overrides constrained by Tenant policy, optional domain PromptSet, CountryPack refs, localization reference and version.
- DD-09 `AIProvisioningSnapshot` owns the exact Tenant plus optional Industry Context of the provisioned execution scope.
- DD-120 exposes raw IndustryAIConfig evidence only and explicitly does not select latest/current/effective configuration.
- DD-209 proves only that a supplied IndustryAIConfig does not widen a supplied same-Tenant TenantAIConfig.
- DD-248…DD-252 already prove the request/Tenant-config prerequisites and produce an immutable non-ranking Tenant-config-constrained Provider/Model pre-candidate set.
- Migration 0031 requires Industry capability/Provider/Model allowlists to be duplicate-free sets and non-widening versus Tenant configuration, but IndustryAIConfig persists no TenantAIConfig id/version and AIProvisioningSnapshot persists no IndustryAIConfig id/version.

The source does **not** define current/latest IndustryAIConfig selection, historical write-time Tenant-config reconstruction, an effective Tenant+Industry config materialization, or a persisted IndustryAIConfig version binding in the ProvisioningSnapshot. Those authorities must not be invented.

## Determination

**SOURCE-COMPLETE for supplied IndustryAIConfig-constrained Industry-scope request/candidate prerequisites only.**

This batch may:
1. require a supplied IndustryAIConfig to be enabled and exactly same-Tenant/same-Industry as the supplied Industry-scoped ProvisioningSnapshot;
2. require exact request capability membership in the supplied IndustryAIConfig capability allowlist;
3. re-use DD-209 to require the supplied IndustryAIConfig not to widen the supplied TenantAIConfig;
4. narrow an already Tenant-constrained Provider/Model pre-candidate set through exact IndustryAIConfig Provider/Model allowlists;
5. combine those prerequisites without selecting a config, ranking a candidate or executing AI.

It must not infer that the supplied IndustryAIConfig is current/latest/effective.

## Locked DD-253…DD-257 contracts

### DD-253 — IndustryAIConfig snapshot-scope/enabled prerequisite
Add `matchesAIIndustryConfigSnapshotScopeFloor(snapshot, industryConfig)`.

Require:
- valid snapshot id/Tenant id and an explicit valid Industry Context id;
- valid IndustryAIConfig id/Tenant id/Industry Context id and boolean enablement;
- exact same Tenant;
- exact same Industry Context;
- `industryConfig.enabled === true`.

A Tenant-Core snapshot cannot satisfy this Industry-scoped floor. No IndustryAIConfig version binding or current/latest inference is allowed.

### DD-254 — AIRequest IndustryAIConfig capability prerequisite
Add `matchesAIRequestIndustryConfigCapabilityFloor(request, industryConfig)`.

Require:
- valid DD-243 AIRequest shape;
- valid IndustryAIConfig identity;
- dense duplicate-free raw string `allowedCapabilities`;
- exact `request.capabilityCode` membership.

No normalization, entitlement inference or effective-config merge is performed.

### DD-255 — IndustryAIConfig Provider/Model pre-candidate allowlist filter
Add `filterAIIndustryConfigProviderModelPreCandidates(candidates, industryConfig)`.

Require:
- dense finite candidate array;
- each candidate has exact UUID `providerId` and `modelId`;
- duplicate candidate pairs fail closed;
- IndustryAIConfig Provider/Model id arrays are dense duplicate-free UUID sets.

Return an immutable canonical providerId/modelId-sorted subset containing only candidates whose Provider **and** Model ids are exact IndustryAIConfig allowlist members.

Malformed evidence returns `null`; valid zero-match evidence returns immutable `[]`.

Canonical order is serialization determinism only, never routing preference.

### DD-256 — Bound request/IndustryAIConfig prerequisite floor
Add `matchesAIRequestIndustryConfigPrerequisiteFloors(request, declaration, snapshot, tenantConfig, industryConfig)`.

Compose:
- DD-250 request + exact snapshot-bound TenantAIConfig prerequisite;
- DD-209 supplied Industry→Tenant non-widening;
- DD-253 exact Industry snapshot scope + Industry config enabled state;
- DD-254 exact request capability membership in Industry config.

A true result does not select current/latest IndustryAIConfig and does not authorize routing.

### DD-257 — Combined IndustryAIConfig-constrained pre-routing set
Add `buildAIIndustryConfigConstrainedPreRoutingSet(input)`.

First build the DD-252 TenantAIConfig-constrained pre-routing set from the supplied request/declaration/snapshot/Tenant config/catalog pre-candidates. Require DD-256 Industry prerequisites. Then apply DD-255 to the Tenant-constrained set.

The returned immutable set means only “still eligible to continue into remaining policy/residency/model-class/health/scoring/routing stages.” It is not a route decision.

## Fixed acceptance before implementation

- **AIINDREQ-SCOPE-001** exact same-Tenant/same-Industry enabled Industry config passes.
- **AIINDREQ-SCOPE-002** Tenant-Core snapshot, foreign Tenant, sibling Industry or disabled Industry config fails closed.
- **AIINDREQ-SCOPE-003** malformed snapshot/config identity or enablement evidence fails closed.
- **AIINDREQ-SCOPE-004** unrelated version/config fields stay uninterpreted; inputs remain unchanged.
- **AIINDREQ-CAP-001** exact request capability membership passes.
- **AIINDREQ-CAP-002** missing, duplicate or malformed Industry capability evidence fails closed.
- **AIINDROUTE-ALLOW-001** exact Provider+Model allowlist candidates return immutable canonical refs.
- **AIINDROUTE-ALLOW-002** valid partial candidate evidence returns only exact Industry-allowlisted Provider+Model pairs.
- **AIINDROUTE-ALLOW-003** malformed/duplicate/sparse candidate or Industry allowlist evidence returns null.
- **AIINDROUTE-ALLOW-004** valid empty or zero-match evidence returns immutable empty array.
- **AIINDREQ-BIND-001** DD-250 + DD-209 + DD-253 + DD-254 prerequisites pass together.
- **AIINDREQ-BIND-002** Tenant/config/scope/enablement/non-widening/capability failure denies.
- **AIINDROUTE-PRE-001** combined Tenant + Industry constrained request/candidate path returns the expected set.
- **AIINDROUTE-PRE-002** request/config prerequisite failure returns null rather than an empty success set.
- **AIINDROUTE-PRE-003** inputs remain unchanged and output exposes no policy decision, score, fallback, credential or execution authority.

Expected executable delta: Core **896 → 911**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, frontend or product-policy change.

This batch does **not** implement:
- latest/current IndustryAIConfig selection;
- effective TenantAIConfig + IndustryAIConfig materialization;
- historical write-time TenantAIConfig reconstruction;
- IndustryAIConfig version binding to ProvisioningSnapshot;
- DD-210 CountryPack activation currentness composition;
- DD-205 domain PromptSet currentness/composition;
- localization/prompt resolution;
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

After DD-253…DD-257 implementation and targeted regression, perform the governed batch-boundary Core/PostgreSQL/Database/Web verification. Canonical synchronization occurs only after the full five-step subsystem milestone.
