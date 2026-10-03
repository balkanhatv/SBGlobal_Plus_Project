# AI Industry Gateway context/admission pre-routing batch ownership audit

**Date:** 2026-09-29  
**Baseline checkpoint:** `DEV-AI-INDUSTRY-CONFIG-RELATIONSHIP-PRE-ROUTING-001`  
**Verified entry HEAD:** `2d0c7fd37ed346cddc65b254461db1aec9974ff2`  
**Verified entry tree:** `69c61ee44b99e908ee5cb0f453b93f7ae36f0f07`  
**Governed batch:** DD-263 through DD-267

## Entry gate

The DD-258…DD-262 state closure is exact-head verified:
- Core Service Verify `36594862104` / `109497031347`: **924/924 PASS**, zero failed/skipped.
- PostgreSQL `36594862104` / `109497031705`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36594862496` / `109497031242`: PASS.
- Web Boundary Verify `36594862063` / `109497033487`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-07, DD-09, DD-02/DD-03 boundary language, the canonical RequestContext contract, migration 0011 snapshot RLS, DD-220…DD-230, DD-243…DD-247 and DD-258…DD-262 yields one independently source-complete **composition of supplied verified context and already-governed admission evidence**:

- A-07 requires AI Gateway context checking before entitlement/policy/routing and explicitly names Tenant + Industry Context as part of the verified RequestContext.
- DD-09 states that Gateway enrichment comes from server context and clients do not supply trusted Tenant/Industry/permission facts.
- `RequestContext` owns supplied `tenantId`, `industryContextId` and `scopeClass`; it does **not** expose an authoritative identifier that can be matched to AIRequest.`requestContextRef`.
- Migration 0011 RLS restricts `ai_provisioning_snapshot` reads/writes to the current Tenant and, for Industry rows, the current Industry Context.
- DD-230 already composes verified RequestContext scope-class equality, snapshot current lifecycle, API-class admission and exact ACTIVE capability admission. It explicitly does not authenticate/authorize the context or evaluate live policy/quota/routing.
- DD-261 already composes request/Tenant/Industry config prerequisites with the relationship-complete supplied IndustryAIConfig.
- DD-262 already produces the immutable non-ranking relationship-complete Industry-constrained pre-routing set.

This batch may therefore compose **exact supplied Industry RequestContext scope with the supplied Industry-scoped snapshot**, then combine that fact with DD-230/DD-261/DD-262. No new policy or routing semantics are required.

## Determination

**SOURCE-COMPLETE for supplied verified Industry RequestContext + snapshot/admission + relationship-complete pre-routing composition only.**

The batch must fail closed when the supplied RequestContext is not an exact TENANT_INDUSTRY context for the supplied snapshot.

## Locked DD-263…DD-267 contracts

### DD-263 — Verified RequestContext ↔ Industry provisioning snapshot scope floor

Add `matchesAIRequestContextIndustrySnapshotScopeFloor(requestContext, snapshot)`.

Require:
- a supplied RequestContext object;
- `scopeClass === "TENANT_INDUSTRY"`;
- valid UUID `requestContext.tenantId` and `requestContext.industryContextId`;
- valid UUID snapshot id/Tenant id/Industry Context id;
- exact Tenant equality;
- exact Industry Context equality.

This function does not authenticate the context, select the current snapshot, inspect permission/entitlement facts or dereference AIRequest.`requestContextRef`.

### DD-264 — Industry operation gateway admission floor

Add `matchesAIIndustryOperationGatewayAdmissionFloors(declaration, requestContext, snapshot, capability, evaluatedAt)`.

Return true only when:
- DD-263 exact supplied context/snapshot Industry scope passes; and
- DD-230 operation pre-provider prerequisites pass.

A true result means only supplied verified context + current supplied snapshot/API/capability admission prerequisites. It is not authorization.

### DD-265 — AIRequest + Industry operation gateway admission floor

Add `matchesAIRequestIndustryGatewayAdmissionFloors(request, declaration, requestContext, snapshot, capability, evaluatedAt)`.

Return true only when:
- DD-247 request integrity passes; and
- DD-264 Industry operation gateway admission passes.

No relationship between AIRequest.`requestContextRef` and RequestContext is inferred.

### DD-266 — Relationship-complete Industry gateway prerequisite floor

Add `matchesAIRequestIndustryGatewayRelationshipPrerequisiteFloors(request, declaration, requestContext, snapshot, capability, tenantConfig, industryConfig, promptSet, activations, evaluatedAt)`.

Return true only when:
- DD-265 passes; and
- DD-261 relationship-complete request/Tenant/Industry config prerequisites pass.

This remains a necessary prerequisite only.

### DD-267 — Industry Gateway relationship-complete pre-routing set

Add `buildAIIndustryGatewayRelationshipPreRoutingSet(input)`.

First build DD-262 relationship-complete Industry-constrained candidates. Require DD-266. Return the same immutable candidate refs only when both pass.

The output remains non-ranking pre-routing evidence and grants no provider/model route or execution authority.

## Fixed acceptance before implementation

- **AIINDGW-CTX-001** exact TENANT_INDUSTRY RequestContext Tenant+Industry equals snapshot Tenant+Industry and passes.
- **AIINDGW-CTX-002** TENANT_CORE/other scope, missing ids, foreign Tenant or sibling Industry fails closed.
- **AIINDGW-CTX-003** malformed context/snapshot identities fail closed while unrelated trusted-context fields remain uninterpreted and inputs unchanged.
- **AIINDGW-ADM-001** DD-263 + DD-230 valid admission passes.
- **AIINDGW-ADM-002** context/snapshot scope, lifecycle, API class or capability admission failure denies.
- **AIINDGW-REQ-001** DD-247 request integrity plus DD-264 admission passes.
- **AIINDGW-REQ-002** request capability/schema integrity or gateway admission failure denies.
- **AIINDGW-REL-001** DD-265 plus DD-261 relationship-complete supplied Industry prerequisites pass.
- **AIINDGW-REL-002** context/admission/request/config/PromptSet/CountryPack prerequisite failure denies.
- **AIINDGW-PRE-001** full relationship-complete Industry Gateway path returns the expected immutable candidate set.
- **AIINDGW-PRE-002** any gateway/relationship prerequisite failure returns null rather than empty success.
- **AIINDGW-PRE-003** valid empty DD-262 candidate evidence remains immutable empty success when all gateway prerequisites pass.
- **AIINDGW-PRE-004** inputs remain unchanged and output exposes no auth decision, entitlement decision, effective config, policy, score, fallback, credential, route or execution authority.

Expected executable delta: Core **924 → 937**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, frontend or product-policy change.

This batch does **not** implement:
- authentication or RequestContext resolution/verification;
- AIRequest.`requestContextRef` dereference or identity binding;
- requestId/correlationId equivalence assumptions between AIRequest and RequestContext;
- current/latest ProvisioningSnapshot selection;
- current/latest IndustryAIConfig selection or IndustryAIConfig version binding;
- effective TenantAIConfig + IndustryAIConfig materialization;
- DD-03/DD-04 live permission/authorization/entitlement/quota decisions;
- policy AST/effect/priority evaluation;
- residency-policy authorization or authorized-region derivation;
- monthly budget reservation/metering;
- model-class → concrete Model mapping;
- Provider health/scoring, route/fallback/retry;
- credentials/provider execution, metering, guardrails or final audit.

After DD-263…DD-267 implementation and targeted regression, perform the governed batch-boundary Core/PostgreSQL/Database/Web verification. Canonical synchronization occurs only after the full five-step subsystem milestone.
