# WorkflowTask visible WorkflowDefinition + acting-principal current-RBAC evidence reader composition prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-WORKFLOW-TASK-VISIBLE-DEFINITION-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `b95bc78dc3144ac87f8e8dc59ae9dbb1a6fc3faa`  
**Verified entry tree:** `dff8e70e4447da61f39df02bdd2c7ee4217ec765`  
**Governed batch:** DD-483 through DD-487

## Entry gate

DD-478…DD-482 state closure and closure-record HEAD are exact-head verified:
- Core Service Verify push run `37258660386` / job `111600983647`: **1318/1318 PASS**, fail/skip 0.
- PostgreSQL same run / job `111600983774`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database Verify push run `37258660360` / job `111600983956`: PASS; inventory remains **48 migrations / 42 SQL verification files**.
- Web Boundary Verify push run `37258660395` / job `111600983661`: PASS.
- Pull-request Core/Database/Web workflows on the same closure-record HEAD also passed.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-482 already owns exact visible WorkflowTask → WorkflowInstance → same-context current WorkflowDefinition evidence. Its output preserves exact DD-362 parent evidence and exact WorkflowDefinition reference.
- DD-477 independently owns one current acting-principal RBAC necessary floor for the exact persisted `WorkflowTask.permissionCode`, but it starts again from DD-362 and does not include WorkflowDefinition evidence.
- `AuthorizationReadStorePort.load({ requestContext, permissionCode })` is the existing current compiled Permission Set + applicable ACTIVE ABAC evidence read boundary.
- DD-475 owns the generic Authorization-domain protected-Tenant current RBAC selector `selectCurrentTenantRbacAllow(...)`: exact scope equality, positive safe-integer permissionVersion parity, exact ordered roleIds parity, exactly one matching Permission Set entry and `ALLOW`.
- Reusing DD-477 directly after DD-482 would re-read WorkflowTask and WorkflowInstance already preserved by DD-482. This batch therefore composes exact DD-482 parent evidence with one Authorization read only; it does not re-read task, instance or definition.
- WorkflowTask assignment/current claimant/completer, task state, due/expiry, task action eligibility and transition authority remain separately governed.
- WorkflowDefinition effectiveFrom/effectiveTo, stateMachine, approvalPolicy and ruleRefs remain raw/uninterpreted. This batch does not convert definition metadata into task-action rules.
- WorkflowTask still has no canonical OperationContract binding. `permissionCode` alone must not be treated as GuardPipeline/CommercialGuard/OperationExecutor authority.
- Applicable ABAC policies remain raw evidence; task/instance/definition facts are not converted into a ResourceDescriptor.

**SOURCE-COMPLETE:** extend exact DD-482 visible-definition evidence with one acting-principal Authorization read for the exact persisted `WorkflowTask.permissionCode`, then require only DD-475 current protected-Tenant compiled RBAC ALLOW necessary evidence. Preserve exact task/instance/definition/Authorization/ABAC references and add no assignment/action/transition/execution authority.

## Frozen decisions

### DD-483 — exact DD-482 visible-definition evidence first

Add `loadWorkflowTaskDefinitionActingRbacCurrentEvidence(...)`. Invoke `loadWorkflowTaskDefinitionCurrentEvidence(...)` first with the exact supplied RequestContext, WorkflowTask id and unchanged task/instance/definition readers. Parent null returns null; parent dependency errors propagate unchanged. No Authorization read occurs before successful DD-482 evidence.

### DD-484 — one exact persisted WorkflowTask.permissionCode Authorization read

After DD-482 evidence, call `AuthorizationReadStorePort.load` exactly once with:
- the identical supplied RequestContext object;
- `permissionCode === parent.parent.task.permissionCode`.

Do not trim, lowercase, canonicalize, alias, substitute, search or fall back. Do not derive permission from WorkflowDefinition stateMachine/approvalPolicy/ruleRefs. Authorization dependency/current-state errors propagate unchanged.

### DD-485 — exact DD-475 current protected-Tenant RBAC floor

Apply `selectCurrentTenantRbacAllow(input.requestContext, authorizationState, parent.parent.task.permissionCode)`.

Require exact protected Tenant scope equality, positive safe-integer permissionVersion equality, exact ordered roleIds parity and exactly one matching canonical Permission Set `ALLOW`. Missing/DENY/duplicate exact permission evidence, stale/missing/invalid permissionVersion or scope/role mismatch fails closed.

### DD-486 — immutable exact-reference definition + RBAC evidence

Success returns frozen `{ parent, authorizationState, permission }`, preserving:
- exact DD-482 parent reference;
- exact nested WorkflowTask and WorkflowInstance references;
- exact WorkflowDefinition reference;
- exact AuthorizationReadState reference;
- exact matched CompiledPermissionV1 reference;
- exact raw applicable ABAC policies/reference.

Do not clone, normalize or mutate any input/evidence object.

### DD-487 — definition + RBAC evidence is not task-action or workflow execution authority

A success proves only:
1. DD-482 visible/current WorkflowTask→WorkflowInstance→WorkflowDefinition evidence;
2. a current compiled RBAC ALLOW necessary floor for exact persisted WorkflowTask.permissionCode.

Do not:
- resolve assigned PRINCIPAL/ROLE/ORG_UNIT currentness;
- validate claimant/completer currentness;
- decide due/expiry;
- authorize claim/approve/reject/complete;
- interpret WorkflowDefinition effective dates, stateMachine, approvalPolicy or ruleRefs;
- validate WorkflowInstance.currentState against the definition;
- authorize WorkflowTransition;
- evaluate ABAC/resource/commercial/entitlement facts;
- claim a full AuthorizationDecision or GuardPipeline result;
- bind the task to an OperationContract;
- mutate WorkflowTask/WorkflowInstance;
- emit events, dispatch workers or execute workflow logic.

## Fixed acceptance before implementation

- **WFT-DEFRBAC-BASE-001** exact RequestContext/id reaches DD-482 parent first; Authorization access occurs only after successful parent evidence.
- **WFT-DEFRBAC-BASE-002** DD-482 null/error short-circuits or propagates before Authorization access.
- **WFT-DEFRBAC-READ-001** exactly one Authorization read receives the identical RequestContext and exact persisted `parent.parent.task.permissionCode`, including raw noncanonical/empty values with no caller normalization.
- **WFT-DEFRBAC-READ-002** Authorization dependency/current-state errors propagate unchanged with no WorkflowDefinition-derived or alternate permission fallback.
- **WFT-DEFRBAC-CUR-001** exact protected Tenant scope/version/ordered-role continuity plus exactly one matching ALLOW passes and preserves the exact permission object.
- **WFT-DEFRBAC-CUR-002** scope/version/role mismatch or missing/DENY/duplicate exact permission evidence fails closed.
- **WFT-DEFRBAC-EVID-001** success preserves exact DD-482 parent, exact definition, Authorization state, permission and raw ABAC references in a frozen envelope; inputs remain unchanged.
- **WFT-DEFRBAC-BOUND-001** output exposes no assignment-current, claimant/completer-current, due/expired, task-action, effective-date/state-machine validity, full authorization, GuardPipeline, transition, mutation/event, worker or execution authority.

Expected executable delta: Core **1318 → 1326**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**. Web unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, scheduler, worker, public API, RawSource or product-policy change.

This batch does **not**:
- add another WorkflowTask/WorkflowInstance/WorkflowDefinition read after DD-482;
- normalize WorkflowTask.permissionCode;
- derive permission from WorkflowDefinition policy/rule metadata;
- resolve task assignee/claimant/completer identity;
- evaluate task due/expiry or allowed task actions;
- evaluate WorkflowDefinition effective-date/state-machine semantics;
- bind WorkflowTask to an OperationContract;
- evaluate CommercialGuard/GuardPipeline/ABAC/resource rules;
- authorize WorkflowTransition;
- mutate state, emit events or execute workflow logic.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-483…DD-487 and the eight fixed acceptances.
