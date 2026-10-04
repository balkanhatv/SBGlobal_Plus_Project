# AutomationRun resource-free GuardPipeline authorization current-evidence reader prerequisite ownership audit

**Date:** 2026-10-04  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-RESOURCE-FREE-GUARD-AUTHORIZATION-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `733462194ffb6ecb49072b965f73fba4ae6487df`  
**Verified entry tree:** `096ba6c8891928fbf07aaff00d4f80bf2ae1c178`  
**Governed batch:** DD-468 through DD-472

## Entry gate

DD-463…DD-467 state closure is exact-head verified:
- Core Service Verify push run `37203027792` / job `111438413556`: **1294/1294 PASS**, fail/skip 0.
- PostgreSQL same run / job `111438413746`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database Verify push run `37203027810` / job `111438413760`: PASS; inventory remains **48 migrations / 42 SQL verification files**.
- Web Boundary Verify push run `37203027824` / job `111438413888`: PASS.
- Pull-request Core/Database/Web workflows on the same closure HEAD also passed.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-387 owns exact current AutomationRun → AutomationDefinition → optional WorkflowDefinition + exact optional canonical OperationContract registry evidence. It explicitly adds no scope/permission/commercial/GuardPipeline/dispatch/execution authority.
- DD-03/DD-04 and `GuardPipeline.authorize` already own the reusable protected-operation authorization sequence: exact RequestContext + canonical OperationContract → current Commercial → base authorization → optional resource resolution/resource authorization/business rules → durable authorization audit.
- The existing `GuardPipeline` public surface is structurally sufficient through `authorize({requestContext, operation, resourceReference?}) -> GuardResult`; no Workflow/Automation-specific PDP is source-owned or needed.
- AutomationRun persists `triggerRef`, but the current source does not define it as a canonical OperationContract `resourceReference`, raw operation input, schema-validated input or resource-resolver payload. Treating it as any of those would invent semantics.
- Therefore an OperationContract declaring `resourceResolver` cannot be safely authorized from current AutomationRun evidence alone.
- For a canonical OperationContract with no `resourceResolver`, GuardPipeline requires no resourceReference and can safely evaluate current Commercial + Authorization using the exact supplied RequestContext and exact registry OperationContract.

**SOURCE-COMPLETE:** extend exact DD-387 evidence only for resource-free canonical operations. Missing OperationContract and resource-resolved OperationContract remain frozen parent-only with zero GuardPipeline calls. A resource-free exact canonical OperationContract is authorized once through the existing GuardPipeline-compatible surface. Preserve the exact returned GuardResult as bounded evidence only.

## Frozen decisions

### DD-468 — exact DD-387 parent evidence first
Add `loadAutomationRunResourceFreeGuardAuthorizationCurrentEvidence(...)`. Invoke DD-387 first with exact supplied RequestContext, AutomationRun id and unchanged read/registry dependencies. Parent null returns null; parent dependency/registry errors propagate unchanged. No GuardPipeline access occurs before successful parent evidence.

### DD-469 — explicit resource-free branch only
Read only the exact optional `parent.operationContract`. If absent, return frozen `{ parent }` and perform zero GuardPipeline calls. If `operation.resourceResolver` is present, also return frozen parent-only evidence with zero GuardPipeline calls. Do not derive `resourceReference` from AutomationRun.triggerRef, correlationId, idempotency hash, WorkflowDefinition state machine, AutomationDefinition trigger/condition/action JSON or any other field.

### DD-470 — one exact GuardPipeline-compatible authorization call
For a present canonical OperationContract whose `resourceResolver` is absent, invoke the injected authorization port exactly once with:
- the exact supplied `requestContext`;
- the exact registry-returned `operationContract`;
- no `resourceReference` property.

Return no synthetic decision. GuardPipeline denial/dependency errors propagate unchanged.

### DD-471 — immutable exact GuardResult evidence
Successful resource-free authorization returns frozen `{ parent, guardResult }`, preserving the exact DD-387 parent and exact GuardResult reference including decisionId/restrictionSet. Inputs and nested AutomationRun/Definition/Workflow/Operation evidence remain unchanged.

### DD-472 — authorization evidence is not Automation execution authority
GuardResult proves only generic protected-operation authorization for that exact resource-free OperationContract at call time. Do not interpret triggerRef, trigger/condition/action/state-machine JSON; do not claim workflow/automation transition eligibility, idempotency/rate-limit acquisition, approval satisfaction, scheduler/worker ownership, dispatch, domain mutation/event success or execution completion. Do not use OperationExecutor because canonical raw/prepared input, rate/idempotency metadata and execution lifecycle are not source-owned by current AutomationRun evidence.

## Fixed acceptance before implementation

- **WFA-RUN-GUARD-BASE-001** exact RequestContext/id enters DD-387 first and no GuardPipeline call precedes successful parent evidence.
- **WFA-RUN-GUARD-BASE-002** DD-387 null/error short-circuits or propagates before GuardPipeline access.
- **WFA-RUN-GUARD-BRANCH-001** absent OperationContract returns frozen exact parent-only evidence with zero GuardPipeline calls.
- **WFA-RUN-GUARD-BRANCH-002** OperationContract with resourceResolver returns frozen parent-only evidence with zero GuardPipeline calls and never derives a resourceReference.
- **WFA-RUN-GUARD-AUTH-001** resource-free operation causes exactly one authorization call using exact supplied RequestContext + exact OperationContract and omits resourceReference.
- **WFA-RUN-GUARD-AUTH-002** GuardPipeline denial/dependency error propagates unchanged with no retry/fallback/synthetic allow.
- **WFA-RUN-GUARD-EVID-001** success preserves exact DD-387 parent + exact GuardResult references in a frozen envelope; nested evidence and inputs remain unchanged.
- **WFA-RUN-GUARD-BOUND-001** output exposes no trigger/condition/state-machine decision, transition/retry, idempotency/rate, approval, scheduler/worker, dispatch, mutation/event or execution-completion authority.

Expected executable delta: Core **1294 → 1302**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**. Web unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, scheduler, worker, public API, RawSource or product-policy change.

This batch does **not**:
- reinterpret `triggerRef` as resource or execution input;
- authorize resource-resolved operations;
- create a resource resolver/reference extractor;
- parse AutomationDefinition trigger/condition/action JSON;
- evaluate WorkflowDefinition state machine/approval policy/rules;
- call OperationExecutor or DomainOperationRegistry;
- acquire rate-limit/idempotency state;
- transition AutomationRun/Workflow entities;
- dispatch external/internal actions;
- emit business events or claim execution success.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-468…DD-472 and the eight fixed acceptances.
