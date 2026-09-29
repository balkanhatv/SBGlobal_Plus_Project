# AI Industry Gateway live GuardPipeline authorization batch ownership audit

**Date:** 2026-09-29  
**Baseline checkpoint:** `DEV-AI-INDUSTRY-GATEWAY-CONTEXT-ADMISSION-001`  
**Verified entry HEAD:** `a6986a32e37b62b8388d8f5a31c0bcf519942dc4`  
**Verified entry tree:** `f96174adc8351231effb6ab78cf36e8ebcba13da`  
**Governed batch:** DD-268 through DD-272

## Entry gate

The DD-263…DD-267 state closure is exact-head verified:
- Core Service Verify `36597793721` / `109507083907`: **937/937 PASS**, zero failed/skipped.
- PostgreSQL `36597793721` / `109507083662`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36597793544` / `109507082908`: PASS.
- Web Boundary Verify `36597793400` / `109507082000`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-07, DD-03, DD-04, DD-09, `RequestContext`, `OperationContract`, `GuardPipeline`, `CommercialCurrentStateService`, `AccessDecision`, and DD-263…DD-267 yields one independently source-complete live authorization composition boundary:

- A-07 requires the AI Gateway to apply verified context plus entitlement/security policy before provider/model routing.
- DD-09 states that every AI API OperationContract remains subject to DD-03/DD-04 authorization and that server context supplies trusted Tenant/Industry/permission facts.
- DD-03 canonical authorization already defines current subscription/license/entitlement, RBAC, ABAC/security/residency policy, resource scope/business-rule evaluation and durable audit as the protected operation guard chain.
- DD-04 plus `CommercialCurrentStateService.validateCurrent` already owns current subscription state, Industry/MS/seat license checks and exact OperationContract entitlement requirement against the current RequestContext entitlement snapshot.
- `GuardPipeline.authorize` already owns the current Commercial → base PDP → optional resource resolution/resource PDP/resource business rules → final durable authorization audit sequence. It fails closed on missing/stale/dependency evidence and preserves restrictions/resource evidence in `GuardResult`.
- DD-267 already proves the supplied Industry Gateway context/admission/config relationships and returns immutable non-ranking pre-routing candidates.

Therefore the AI layer does not need a new permission model or a duplicated PDP. It may invoke the existing GuardPipeline public authorization surface for the exact supplied RequestContext + `declaration.operation`, preserving optional resource reference and the returned `GuardResult`, and only continue with DD-267 candidates after successful guard completion.

## Determination

**SOURCE-COMPLETE for live GuardPipeline authorization composition before Industry AI pre-routing only.**

This batch may define a narrow port structurally matching the existing GuardPipeline public `authorize` surface and compose it with DD-267. It must not reinterpret, weaken, catch-and-allow or replace GuardPipeline semantics.

## Locked DD-268…DD-272 contracts

### DD-268 — AI Industry Gateway live authorization port
Add `AIIndustryGatewayAuthorizationPort` with the exact needed surface:

`authorize({requestContext, operation, resourceReference?}) -> Promise<GuardResult>`.

The existing `GuardPipeline` satisfies this port. No parallel authorization/PDP contract is created.

### DD-269 — Exact live authorization bridge
Add `authorizeAIIndustryGatewayOperation(authorization, declaration, requestContext, resourceReference?)`.

It must:
- call `authorization.authorize` exactly once;
- pass the exact supplied `requestContext`;
- pass the exact `declaration.operation`;
- pass `resourceReference` unchanged only when supplied;
- return the exact resolved `GuardResult` object unchanged;
- propagate GuardPipeline denial/dependency errors unchanged.

No synthetic ALLOW, decision id, restriction or resource evidence may be fabricated.

### DD-270 — Authorization-before-pre-routing composition
Add `buildAuthorizedAIIndustryGatewayPreRoutingEnvelope(input, authorization)`.

Ordering is locked:
1. await DD-269 live GuardPipeline authorization;
2. only after successful authorization, build DD-267 Industry Gateway relationship-complete pre-routing candidates;
3. if DD-267 returns `null`, return `null`;
4. otherwise return an immutable envelope containing the exact `guardResult` and immutable candidate refs.

This order prevents candidate construction from substituting for authorization.

### DD-271 — Guard evidence preservation / failure semantics
The DD-270 envelope must preserve the exact GuardResult, including any `decisionId`, `resourceDescriptor` and `restrictionSet`. GuardPipeline errors must reject/throw; they must never be converted to `null`, empty success, or a synthetic decision. A DD-267 evidence failure after successful authorization remains `null`, preserving the existing malformed-evidence distinction.

### DD-272 — Valid-empty and no-new-authority boundary
Successful live authorization plus a valid empty DD-267 candidate set returns an immutable envelope with immutable `[]` candidates and the exact GuardResult.

The envelope grants no new authority beyond the GuardPipeline result and exposes no AI-specific effective config, AIPolicy result, budget reservation, residency route, model score, fallback, credential or execution decision.

## Fixed acceptance before implementation

- **AIINDGUARD-PORT-001** existing GuardPipeline-compatible port receives exact RequestContext + declaration.operation.
- **AIINDGUARD-PORT-002** optional resourceReference is omitted when absent and passed unchanged when supplied.
- **AIINDGUARD-AUTH-001** exact GuardResult identity is returned unchanged.
- **AIINDGUARD-AUTH-002** authorization denial/dependency error propagates and is not normalized to `null`.
- **AIINDGUARD-ORDER-001** live authorization completes before DD-267 pre-routing construction is considered successful.
- **AIINDGUARD-ORDER-002** successful authorization followed by DD-267 evidence failure returns `null`.
- **AIINDGUARD-EVID-001** successful envelope preserves exact decisionId/resourceDescriptor/restrictionSet evidence.
- **AIINDGUARD-EVID-002** envelope and candidate collection are immutable; inputs remain unchanged.
- **AIINDGUARD-EMPTY-001** successful authorization + valid empty DD-267 candidates returns immutable empty success.
- **AIINDGUARD-BOUNDARY-001** output exposes no new authorization decision, effective config, AI policy, budget, residency route, score, fallback, credential or execution authority beyond the preserved GuardResult.

Expected executable delta: Core **937 → 947**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, frontend or product-policy change.

This batch does **not** implement:
- authentication or RequestContext resolution;
- AIRequest.requestContextRef dereference/identity binding;
- a new AuthorizationDecisionService/PDP or alternate Commercial guard;
- reinterpretation of GuardPipeline `RESTRICT` semantics;
- resource resolver/business-rule semantics beyond the existing GuardPipeline call;
- current/latest ProvisioningSnapshot or IndustryAIConfig selection;
- effective TenantAIConfig + IndustryAIConfig materialization;
- AI-specific `AIPolicy` evaluation beyond policy facts already governed by the existing generic GuardPipeline;
- AI monthly-budget reservation/metering or provider cost-budget enforcement;
- AI-specific residency allowed-region derivation/provider filtering;
- model-class → concrete Model mapping;
- Provider health/scoring, route/fallback/retry;
- credentials/provider execution, token metering, output guardrails or AI final audit.

After DD-268…DD-272 implementation and targeted regression, perform the governed batch-boundary Core/PostgreSQL/Database/Web verification. Canonical synchronization occurs only after the full five-step subsystem milestone.
