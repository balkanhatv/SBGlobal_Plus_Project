# AI AgentStep resource-free GuardPipeline authorization current evidence reader prerequisite ownership audit

**Date:** 2026-10-04  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-ACTING-OPERATION-COMMERCIAL-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD/tree:** `f8663d345a879db9e51adc9a82a8fe3a9d3eff15` / `43faae7a175b56d80abf142c9ea6f38e016367c1`  
**Governed batch:** DD-463 through DD-467

## Entry gate

DD-458…DD-462 is closed at its bounded evidence scope. State-closure HEAD `01ab894328b91b8c0ceefc071bca4533ae3ec00c` passed Core **1286/1286**, PostgreSQL **532/532** plus full bootstrap, Database **48 migrations / 42 SQL verification files**, and Web. Closure-record HEAD `f8663d345a879db9e51adc9a82a8fe3a9d3eff15` subsequently passed push and pull-request Core/PostgreSQL/Database/Web gates.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged. `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of DD-03, DD-04, DD-06, DD-09, the canonical `OperationContract`, `GuardPipeline`, the earlier DD-268…DD-272 live authorization bridge, and DD-462 yields one independently source-complete next composition boundary:

- DD-462 already preserves exact DD-457 parent evidence plus current Commercial ALLOW evidence for the exact canonical OperationContract under the unchanged acting RequestContext.
- `GuardPipeline.authorize({ requestContext, operation, resourceReference? })` is the existing source-owned live protected-operation authorization surface. It owns scope assertion, current Commercial validation, base AuthorizationDecision, optional resource resolution/resource AuthorizationDecision/resource business rules, durable authorization audit, and exact `GuardResult` evidence.
- The existing AI Industry Gateway DD-268…DD-272 contract already establishes that AI code must reuse the exact GuardPipeline public authorization surface rather than creating a parallel PDP.
- AgentStep `inputRef` is opaque. No governing source maps it to a canonical `resourceReference` for an arbitrary OperationContract.
- Therefore a preserved OperationContract with `resourceResolver` cannot be fully authorized from the current AgentStep evidence without inventing resource-reference semantics.
- A canonical OperationContract with no `resourceResolver` needs no resource reference; the existing GuardPipeline can authorize it using only the exact acting RequestContext + exact canonical OperationContract.
- DD-04 §6 defines usage-limit concepts, but the current canonical `OperationContract` type does not carry `meterCode`, `limitEntitlementCode`, consumption amount, or reservation strategy. The current CommercialGuard validates subscription/license/entitlement state but does not perform usage reservation/consumption. Therefore usage-limit satisfaction remains separately source-incomplete for this AgentStep execution path and must not be inferred from a GuardPipeline ALLOW.

**SOURCE-COMPLETE:** extend exact DD-462 evidence only. If no canonical OperationContract is preserved, return frozen parent-only evidence and perform zero GuardPipeline calls. If the canonical OperationContract declares a `resourceResolver`, also return frozen parent-only evidence with zero GuardPipeline calls because no source-owned resource reference exists. Only for a canonical OperationContract with no `resourceResolver`, invoke the exact live GuardPipeline authorization surface once with the unchanged acting RequestContext and exact canonical OperationContract, omitting `resourceReference`. Preserve the exact returned GuardResult.

## Frozen decisions

**DD-463 — exact DD-462 parent first and explicit resource-free branch.**  
Add `loadAIAgentStepResourceFreeGuardAuthorizationCurrentEvidence(...)`. Invoke DD-462 first with exact supplied inputs/dependencies. Parent null returns null; parent dependency errors propagate unchanged. No canonical OperationContract returns frozen `{parent}` with zero GuardPipeline calls. Canonical operations with `resourceResolver` also return frozen `{parent}` with zero GuardPipeline calls; this is not authorization success and does not mean resource authorization is unnecessary.

**DD-464 — reuse the existing GuardPipeline-compatible port only.**  
Define a narrow AI composition port structurally matching the existing `GuardPipeline.authorize({requestContext, operation, resourceReference?}) -> Promise<GuardResult>` surface. No parallel access decision/PDP/commercial/resource-rule contract is created.

**DD-465 — exact one live authorization call for resource-free operations.**  
For an exact canonical OperationContract with `resourceResolver === undefined`, call `authorize` exactly once with `requestContext === input.requestContext`, `operation === exact canonical OperationContract`, and omit `resourceReference`. Return/retain the exact GuardResult object. GuardPipeline denial/dependency/audit errors propagate unchanged; do not convert them to null, ALLOW or synthetic evidence.

**DD-466 — immutable layered evidence and no duplicate reinterpretation.**  
Resource-free success returns frozen `{ parent, guardResult }`, preserving exact DD-462 parent and exact GuardResult identity. Parent-only branches return frozen `{parent}`. Do not reinterpret decisionId, restrictionSet, resourceDescriptor, Commercial evidence, RBAC evidence or approval evidence.

**DD-467 — GuardPipeline success is not complete AI execution admission.**  
The preserved GuardResult is authoritative current generic GuardPipeline evidence for that exact resource-free operation at the time of the call. It does not prove Agent approval satisfaction, DD-04 usage-limit reservation/consumption, AI budget/quota, provider/model routing, credential availability, tool dispatch, state transition, mutation/event success, output guardrails or AI execution completion. Do not synthesize missing resource facts or usage metadata.

## Fixed acceptance before implementation

- **AISTEP-GUARD-BASE-001** exact DD-462 parent evidence is established first with unchanged inputs/dependencies.
- **AISTEP-GUARD-BASE-002** DD-462 null/error short-circuits or propagates before GuardPipeline access.
- **AISTEP-GUARD-BRANCH-001** no canonical OperationContract performs zero GuardPipeline calls and returns frozen exact parent-only evidence.
- **AISTEP-GUARD-BRANCH-002** canonical OperationContract with resourceResolver performs zero GuardPipeline calls and returns frozen exact parent-only evidence without inferring authorization success.
- **AISTEP-GUARD-AUTH-001** resource-free branch invokes GuardPipeline-compatible authorization exactly once with exact acting RequestContext + exact canonical OperationContract and no resourceReference.
- **AISTEP-GUARD-AUTH-002** GuardPipeline denial/dependency/audit errors propagate unchanged and are not normalized to null/allow.
- **AISTEP-GUARD-EVID-001** resource-free success preserves exact DD-462 parent and exact GuardResult reference in a frozen envelope; inputs remain unchanged.
- **AISTEP-GUARD-BOUND-001** output exposes no synthetic resource reference, approval-satisfaction, usage-limit/budget satisfaction, dispatch, transition, mutation/event, provider/model routing, credential or AI/tool execution authority.

Expected executable delta: Core **1286 → 1294**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, identity/session reconstruction, provider SDK, worker, scheduler or RawSource change.

This batch does **not**:
- define DD-04 usage-meter current-period/limit binding or reserve/consume/release semantics;
- add meterCode/limitEntitlementCode/consumption/reservation metadata to OperationContract;
- derive resourceReference from AgentStep.inputRef;
- authorize operations that require a resourceResolver;
- reinterpret GuardPipeline Commercial/RBAC/ABAC/resource-rule decisions;
- claim persisted AgentApproval is fully satisfied for execution;
- route provider/model, resolve credentials, dispatch tools or invoke AI/provider execution;
- transition AgentRun/AgentStep/AgentApproval or emit domain events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-463…DD-467 and the fixed acceptances.
