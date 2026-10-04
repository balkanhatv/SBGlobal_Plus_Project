# AI AgentStep acting OperationContract Commercial current evidence reader prerequisite ownership audit

**Date:** 2026-10-04  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-ACTING-OPERATION-RBAC-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD/tree:** `0f79813c309b704bd93bf285c75acf0940cc0c0a` / `7ac4b069990764fe0eb1fdf4c8fc98dabfc9932e`  
**Governed batch:** DD-458 through DD-462

## Entry gate

DD-453…DD-457 is closed at its bounded evidence scope. State-closure HEAD `fc435e1ad0bbc802a126be647cc599a76b4740c8` passed Core **1278/1278**, PostgreSQL **532/532** plus full bootstrap, Database **48 migrations / 42 SQL verification files**, and Web. Closure-record HEAD `0f79813c309b704bd93bf285c75acf0940cc0c0a` subsequently passed the same push/PR gate set before this audit opened.

PR #2 remains draft/unmerged. RawSource is unchanged. `main` is not merged.

## Reconciled owners and source determination

- DD-457 owns exact DD-452 parent evidence plus a current acting-principal RBAC necessary floor for the exact canonical `OperationContract.permissionCode`. It deliberately does not create a full AuthorizationDecision or Commercial admission result.
- DD-04 §11 / `CommercialCurrentStateService` owns current Commercial runtime validation. The public boundary is `CommercialGuardPort.validateCurrent({ requestContext, operation })`.
- That Commercial guard re-reads current state, requires exact RequestContext entitlement snapshot id/version currentness, validates allowed subscription state, exact Industry license where applicable, Management-System/Seat license rules where present, and the canonical `OperationContract.entitlementRequirement` against current non-denied enabled entitlement facts.
- `CommercialGuardResult` is source-owned as either `{allowed:true}` or a normalized commercial denial carrying `SUBSCRIPTION_INVALID | LICENSE_INVALID | ENTITLEMENT_DENIED`.
- DD-09 ToolDefinition `requiredEntitlement`, AICapability `required_entitlement`, and DD-06 OperationContract `entitlementRequirement` are separate metadata surfaces. Existing source does not define a generic equality/compatibility rule among them.
- DD-04 commercial current-state validation does not itself evaluate DD-03 RBAC/ABAC, resource scope, approval satisfaction, usage-limit reservation/consumption, or operation execution.
- DD-09 step sequence requires DD-04 entitlement/limits before approval/execution, but no source permits bypassing GuardPipeline or interpreting a Commercial ALLOW as full authorization.
- AgentStep `inputRef` remains opaque and cannot supply a canonical ResourceDescriptor or usage-consumption amount.

**SOURCE-COMPLETE:** extend exact DD-457 evidence only when a canonical OperationContract is already preserved. For non-TOOL/no-OperationContract evidence, return frozen parent-only evidence and perform zero Commercial reads. For TOOL evidence, call the exact source-owned `CommercialGuardPort.validateCurrent` once with the unchanged acting RequestContext and exact canonical OperationContract. A returned denial fails closed; dependency/current-state errors propagate unchanged. Preserve successful Commercial result as necessary current admission evidence only.

## Frozen decisions

**DD-458 — reuse exact DD-457 parent first and branch only on preserved canonical OperationContract.**  
Add `loadAIAgentStepActingOperationCommercialCurrentEvidence(...)`. Invoke DD-457 first with exact supplied inputs/dependencies. Parent null/errors preserve DD-457 behavior. If the parent preserves no canonical OperationContract, return frozen `{parent}` with zero Commercial reads. This does not infer Commercial validation is unnecessary for any future execution path.

**DD-459 — call the exact current Commercial guard once.**  
For canonical TOOL evidence, call `CommercialGuardPort.validateCurrent({ requestContext: input.requestContext, operation: exactOperationContract })` exactly once. Do not reconstruct a Commercial context, read Commercial persistence directly, substitute ToolDefinition/Capability entitlement metadata, or call another operation.

**DD-460 — fail closed on current Commercial denial/error.**  
Only `commercialResult.allowed === true` passes. `SUBSCRIPTION_INVALID`, `LICENSE_INVALID` or `ENTITLEMENT_DENIED` returns null without fallback. Dependency/current-state exceptions propagate unchanged; do not coerce errors into allow/unknown.

**DD-461 — preserve exact immutable layered evidence.**  
Non-TOOL/no-operation success returns frozen `{parent}`. TOOL+Commercial success returns frozen `{parent, commercialResult}`, preserving the exact DD-457 parent, exact canonical OperationContract already nested in it, and exact Commercial result reference without clone/normalization/mutation.

**DD-462 — Commercial ALLOW remains necessary evidence only.**  
Do not equate `ToolDefinition.requiredEntitlement`, `AICapability.requiredEntitlement`, and `OperationContract.entitlementRequirement`. Do not evaluate usage limits, DD-03 ABAC/resource facts, approval satisfaction, GuardPipeline final authorization, transition, dispatch, mutation/event, provider/model routing or AI/tool execution. A Commercial ALLOW is not production/execution authority.

## Fixed acceptance before implementation

- **AISTEP-OPCOMM-BASE-001** exact DD-457 parent evidence is established first with unchanged inputs/dependencies.
- **AISTEP-OPCOMM-BASE-002** DD-457 null/error short-circuits or propagates before any Commercial call.
- **AISTEP-OPCOMM-BRANCH-001** no preserved canonical OperationContract performs zero Commercial reads and returns frozen exact parent-only evidence without inferring Commercial validation is unnecessary.
- **AISTEP-OPCOMM-READ-001** TOOL branch calls CommercialGuard exactly once with unchanged acting RequestContext and exact canonical registry OperationContract reference.
- **AISTEP-OPCOMM-READ-002** Commercial dependency/current-state errors propagate unchanged with no persistence/direct-store or metadata fallback.
- **AISTEP-OPCOMM-DENY-001** subscription/license/entitlement denial fails closed with no alternate entitlement substitution.
- **AISTEP-OPCOMM-EVID-001** successful TOOL evidence preserves exact DD-457 parent, exact nested canonical OperationContract and exact Commercial ALLOW result references unchanged.
- **AISTEP-OPCOMM-BOUND-001** output grants no entitlement-metadata compatibility, usage-limit satisfaction, full authorization, approval satisfaction, resource admission, transition, dispatch, mutation, routing or AI/tool execution authority.

Expected executable delta: Core **1278 → 1286**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, identity/session reconstruction, provider SDK, worker, scheduler or RawSource change.

This batch does **not**:
- compare or reconcile ToolDefinition/Capability/OperationContract entitlement metadata;
- read Commercial persistence directly;
- reserve or consume a usage limit;
- derive resource facts from AgentStep.inputRef;
- evaluate ABAC or resource business rules;
- claim approval satisfaction or final GuardPipeline authorization;
- transition AgentRun/AgentStep/AgentApproval;
- dispatch/mutate/emit or invoke provider/model/AI/tool execution.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-458…DD-462 and the fixed acceptances.
