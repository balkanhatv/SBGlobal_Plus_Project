# WorkflowTask acting-principal current-RBAC evidence reader composition prerequisite ownership audit

**Date:** 2026-10-04  
**Baseline checkpoint:** `DEV-AUTOMATION-RUN-RESOURCE-FREE-GUARD-AUTHORIZATION-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `0486871dbfd16a00d208ea6228174df6c7dc9e10`  
**Verified entry tree:** `0521f18f8be6c88bfbb02932645ac713453e338b`  
**Governed batch:** DD-473 through DD-477

## Entry gate

DD-468…DD-472 state closure is exact-head verified:
- Core Service Verify push run `37216947955` / job `111479286203`: **1302/1302 PASS**, fail/skip 0.
- PostgreSQL same run / job `111479286392`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database Verify push run `37216947953` / job `111479286209`: PASS; inventory remains **48 migrations / 42 SQL verification files**.
- Web Boundary Verify push run `37216947932` / job `111479286013`: PASS.
- Pull-request Core/Database/Web workflows on the same closure HEAD also passed.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-362 already owns exact visible WorkflowTask → WorkflowInstance current-binding evidence under the unchanged supplied RequestContext.
- `PersistedWorkflowTask.permissionCode` is source-owned persisted raw text. The raw reader intentionally does not interpret or normalize it; schema currently permits even values that may not satisfy canonical Permission Set grammar.
- `AuthorizationReadStorePort.load({ requestContext, permissionCode })` is the existing current compiled Permission Set + applicable ACTIVE ABAC evidence read boundary. This contract accepts the exact string supplied by the caller and owns current-state/dependency failures.
- DD-03/DD-045/DD-048 plus the generic DD-450 current-Tenant RBAC selector own protected Tenant scope equality, positive safe-integer permissionVersion equality, exact ordered roleIds parity and exactly one matching Permission Set `ALLOW`.
- The generic selector currently lives in the AI folder because DD-450 first extracted it there. WorkflowTask is not an AI-owned domain. Cross-domain reuse should move the generic mechanics to Authorization ownership while keeping the existing AI import surface stable through a thin wrapper/re-export so DD-450/DD-452/DD-457 behavior cannot drift.
- WorkflowTask assignment integrity, claimant/completer integrity, task state, due/expiry and action semantics remain separately owned by database constraints and future workflow-action policy. A current RBAC ALLOW for `task.permissionCode` is therefore necessary evidence only; it is not task assignment/action authority.
- WorkflowTask has no canonical OperationContract binding in current source. CommercialGuard/GuardPipeline/OperationExecutor must not be inferred from `permissionCode` alone.
- Applicable ABAC policies returned by Authorization read remain raw evidence; task/instance resource facts are not converted into a ResourceDescriptor in this batch.

**SOURCE-COMPLETE:** extend exact DD-362 evidence with one current acting-principal Authorization read for the exact persisted WorkflowTask.permissionCode, then require only the generic protected-Tenant compiled RBAC ALLOW necessary floor. Preserve raw task/instance/ABAC evidence and add no assignment/action/transition/execution authority.

## Frozen decisions

### DD-473 — exact DD-362 WorkflowTask parent evidence first

Add `loadWorkflowTaskActingRbacCurrentEvidence(...)`. Invoke `loadWorkflowTaskInstanceCurrentEvidence(...)` first with the exact supplied RequestContext, WorkflowTask id and unchanged readers. Parent null returns null; parent dependency errors propagate unchanged. No Authorization read occurs before successful DD-362 evidence.

### DD-474 — exact persisted WorkflowTask.permissionCode read

After exact DD-362 evidence, call `AuthorizationReadStorePort.load` exactly once with:
- the exact supplied RequestContext object;
- `permissionCode === parent.task.permissionCode`.

Do not trim, lowercase, canonicalize, alias, substitute, search or fall back. In particular, do not substitute any WorkflowDefinition rule/approval metadata because none is the source-owned task permission. Authorization dependency/current-state errors propagate unchanged.

### DD-475 — Authorization-owned generic protected-Tenant RBAC floor

Move the generic DD-450 protected-Tenant current-RBAC selection mechanics into an Authorization-owned helper, preserving exact behavior:
- RequestContext and compiled snapshot scopeClass must match;
- only TENANT_CORE / TENANT_INDUSTRY protected scopes pass;
- RequestContext.permissionVersion must be a positive safe integer equal to the snapshot version;
- RequestContext.roleIds must exactly equal snapshot.roleIds in the preserved canonical order;
- exactly one Permission Set entry must match the supplied permissionCode;
- its effect must be `ALLOW`.

Missing, DENY, duplicate exact evidence, stale/missing/invalid permissionVersion or role/scope mismatch returns null. Keep `selectAICurrentTenantRbacAllow(...)` as a stable thin wrapper so all existing AI behavior/tests remain unchanged.

### DD-476 — immutable exact-reference WorkflowTask RBAC evidence

Success returns frozen `{ parent, authorizationState, permission }`, preserving:
- the exact DD-362 `{ task, instance }` parent reference;
- exact AuthorizationReadState reference;
- exact matched CompiledPermissionV1 reference;
- exact raw applicable ABAC policy array/reference.

Do not clone, normalize or mutate task, instance, RequestContext, Authorization state or permission evidence.

### DD-477 — RBAC ALLOW is not WorkflowTask action or execution authority

A success proves only a necessary current compiled-RBAC ALLOW for exact persisted `WorkflowTask.permissionCode` under the acting RequestContext at call time.

Do not:
- resolve/authorize assigned PRINCIPAL/ROLE/ORG_UNIT;
- validate claimant/completer currentness;
- decide due/expiry;
- decide claim/approve/reject/complete eligibility;
- interpret parent WorkflowInstance currentState/lifecycle or WorkflowDefinition state machine;
- evaluate ABAC/resource/commercial/entitlement facts;
- claim a full AuthorizationDecision or GuardPipeline result;
- authorize WorkflowTransition;
- mutate WorkflowTask/WorkflowInstance;
- emit events, dispatch workers or execute workflow actions.

## Fixed acceptance before implementation

- **WFT-RBAC-BASE-001** exact RequestContext/id reaches DD-362 parent first; Authorization access occurs only after successful parent evidence.
- **WFT-RBAC-BASE-002** DD-362 null/error short-circuits or propagates before Authorization access.
- **WFT-RBAC-READ-001** exactly one Authorization read receives the identical RequestContext and exact persisted WorkflowTask.permissionCode, including raw noncanonical/empty values with no caller normalization.
- **WFT-RBAC-READ-002** Authorization dependency/current-state errors propagate unchanged with no alternate permission fallback.
- **WFT-RBAC-CUR-001** exact protected Tenant scope/version/ordered-role continuity plus exactly one matching ALLOW passes and preserves the exact permission object.
- **WFT-RBAC-CUR-002** scope/version/role mismatch or missing/DENY/duplicate exact permission evidence fails closed; existing DD-450 AI callers remain green through the stable wrapper.
- **WFT-RBAC-EVID-001** success preserves exact parent/state/permission/raw-ABAC references in a frozen envelope; inputs remain unchanged.
- **WFT-RBAC-BOUND-001** output exposes no assignment-current, claimant/completer-current, due/expired, task-action, full authorization, GuardPipeline, transition, mutation/event, worker or execution authority.

Expected executable delta: Core **1302 → 1310**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**. Web unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, scheduler, worker, public API, RawSource or product-policy change.

This batch does **not**:
- change WorkflowTask persistence or permissionCode grammar;
- invent permission normalization or empty-string semantics;
- resolve assignee subjects or claimant/completer principal state;
- evaluate task due/expiry or allowed task actions;
- bind WorkflowTask to an OperationContract;
- evaluate CommercialGuard/GuardPipeline/ABAC/resource rules;
- transition Workflow state;
- dispatch or execute workflow actions.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-473…DD-477 and the eight fixed acceptances.
