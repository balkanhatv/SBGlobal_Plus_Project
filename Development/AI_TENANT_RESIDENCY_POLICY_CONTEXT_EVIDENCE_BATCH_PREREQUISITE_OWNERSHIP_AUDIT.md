# AI Tenant residency-policy context evidence batch ownership audit

**Date:** 2026-09-29  
**Baseline checkpoint:** `DEV-AI-INDUSTRY-GATEWAY-AUTHORIZED-CATALOG-PRE-ROUTING-001`  
**Verified entry HEAD:** `905b918f7d8070da7dd85e7e4ac622a603d6a064`  
**Verified entry tree:** `bbdd157e5cf006afa37a92b6644919d8032cb6a2`  
**Governed batch:** DD-278 through DD-282

## Entry gate

The DD-273…DD-277 state closure is exact-head verified:
- Core Service Verify `36604827227` / `109531061525`: **957/957 PASS**, zero failed/skipped.
- PostgreSQL `36604827227` / `109531061564`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36604826809` / `109531064015`: PASS.
- Web Boundary Verify `36604827466` / `109531062491`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-07, DD-09, migration 0011, migration 0048, `PersistedAIPolicy`, `AIPolicyReadPort`, `PersistedAITenantConfig`, DD-263…DD-277 yields one independently source-complete evidence boundary:

- DD-09 defines `TenantAIConfig.residencyPolicyId` and `AIPolicy{id, owner_scope, tenant_id?, industry_context_id?, code, priority, effect, condition_ast_json, constraint_json, version, status}`.
- A-07 requires a policy gate before provider/model routing, but does not define an executable AIPolicy AST/constraint evaluator in this source-complete boundary.
- Migration 0011 fixes AIPolicy owner-shape invariants: PLATFORM has no Tenant/Industry owner, TENANT has Tenant only, INDUSTRY has Tenant + Industry.
- Migration 0048 defines fail-closed `definition_applies_to_scope`: PLATFORM applies broadly, TENANT only to the same Tenant, INDUSTRY only to the same Tenant + Industry target.
- `AIPolicyReadPort.loadForContext({requestContext, policyId})` is the existing contextual read surface.
- `TenantAIConfig.residencyPolicyId` is a required UUID-shaped policy reference, but migration 0011 does not add a relational FK or define condition/constraint evaluation semantics.

Therefore the source supports exact identity, owner-shape, context-applicability, Tenant-config reference binding and contextual loading only.

## Determination

**SOURCE-COMPLETE for exact TenantAIConfig residency-policy context evidence binding/loading only.**

This batch must not treat a successfully loaded policy as an ALLOW decision or as residency authorization.

## Locked DD-278…DD-282 contracts

### DD-278 — AIPolicy identity / owner-shape floor

Add `matchesAIPolicyIdentityOwnerShapeFloor(policy)`.

Require:
- valid UUID `policy.id`;
- ownerScope exactly PLATFORM, TENANT or INDUSTRY;
- PLATFORM => tenantId and industryContextId absent;
- TENANT => valid tenantId and industryContextId absent;
- INDUSTRY => valid tenantId and industryContextId;
- non-empty `code`;
- integer `priority`;
- effect exactly ALLOW, DENY or RESTRICT;
- positive integer `version`;
- non-empty `status`.

Do not interpret status value, conditionAst or constraint.

### DD-279 — AIPolicy RequestContext applicability floor

Add `matchesAIPolicyRequestContextScopeFloor(policy, requestContext)`.

Require DD-278 plus a valid Tenant-scoped target context:
- TENANT_CORE => valid Tenant id and no Industry id;
- TENANT_INDUSTRY => valid Tenant + Industry ids;
- other scope classes fail for this Tenant residency-policy evidence boundary.

Mirror migration-0048 applicability:
- PLATFORM applies to either valid Tenant target;
- TENANT requires exact target Tenant;
- INDUSTRY requires TENANT_INDUSTRY and exact Tenant + Industry.

No policy decision is evaluated.

### DD-280 — TenantAIConfig residency-policy exact-id binding

Add `matchesAITenantConfigResidencyPolicyBindingFloor(tenantConfig, policy)`.

Require:
- valid TenantAIConfig id + Tenant id;
- valid UUID `tenantConfig.residencyPolicyId`;
- DD-278 policy identity/owner shape;
- exact `policy.id === tenantConfig.residencyPolicyId`.

Do not infer scope applicability here.

### DD-281 — RequestContext + TenantAIConfig + AIPolicy relationship floor

Add `matchesAITenantResidencyPolicyContextBindingFloors(requestContext, tenantConfig, policy)`.

Require:
- valid Tenant-scoped RequestContext as DD-279;
- exact `requestContext.tenantId === tenantConfig.tenantId`;
- DD-279 policy applicability;
- DD-280 exact config→policy id binding.

A true result means only that supplied evidence is coherent.

### DD-282 — Contextual residency-policy evidence load

Add `loadAITenantResidencyPolicyContextEvidence(readPort, requestContext, tenantConfig)`.

Behavior:
- call `readPort.loadForContext` exactly once with the exact supplied RequestContext and exact `tenantConfig.residencyPolicyId`;
- dependency errors propagate unchanged;
- missing policy returns `null`;
- loaded policy failing DD-281 returns `null`;
- success returns the exact loaded `PersistedAIPolicy` object unchanged.

No policy interpretation, normalization or derived authorization is permitted.

## Fixed acceptance before implementation

- **AIRESPOL-SHAPE-001** valid PLATFORM/TENANT/INDUSTRY identity-owner shapes pass.
- **AIRESPOL-SHAPE-002** malformed UUID/owner-shape/effect/version/status evidence fails closed.
- **AIRESPOL-SCOPE-001** PLATFORM, same-Tenant TENANT and exact same-Industry INDUSTRY applicability follows migration-0048 semantics.
- **AIRESPOL-SCOPE-002** platform-global/public/cross-context target, foreign Tenant or sibling Industry fails this Tenant residency-policy evidence floor.
- **AIRESPOL-BIND-001** exact TenantAIConfig.residencyPolicyId ↔ AIPolicy.id binding passes.
- **AIRESPOL-BIND-002** malformed or mismatched config/policy identity fails.
- **AIRESPOL-CTX-001** exact RequestContext Tenant + applicable policy + config binding passes.
- **AIRESPOL-CTX-002** foreign Tenant, inapplicable owner scope or id mismatch fails.
- **AIRESPOL-LOAD-001** loader receives exact RequestContext/policyId once and returns exact loaded policy identity on valid evidence.
- **AIRESPOL-LOAD-002** missing/mismatched evidence returns null, dependency error propagates unchanged, and conditionAst/constraint/status semantics remain uninterpreted.

Expected executable delta: Core **957 → 967**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, frontend or product-policy change.

This batch does **not** implement:
- AIPolicy condition AST evaluation;
- ALLOW/DENY/RESTRICT decision composition or priority resolution;
- an ACTIVE-only AIPolicy execution rule not presently source-defined for this boundary;
- residency-policy authorization or authorized-region derivation;
- request `residencyRequirement` interpretation;
- monthly budget reservation/metering;
- effective Tenant+Industry AI configuration;
- current/latest policy selection by code/version;
- authentication or RequestContext resolution;
- AIRequest.requestContextRef binding;
- Provider health/scoring, route/fallback/retry, credential resolution or provider execution;
- output guardrails or final AI audit.

After DD-278…DD-282 implementation and targeted regression, perform the governed batch-boundary Core/PostgreSQL/Database/Web verification. Canonical synchronization occurs only after the complete five-step subsystem milestone.
