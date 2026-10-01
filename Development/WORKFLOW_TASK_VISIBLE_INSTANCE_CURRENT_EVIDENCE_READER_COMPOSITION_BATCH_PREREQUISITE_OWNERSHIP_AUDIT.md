# WorkflowTask visible WorkflowInstance current-evidence reader composition prerequisite ownership audit

**Date:** 2026-10-01  
**Baseline checkpoint:** `DEV-WORKFLOW-INSTANCE-VISIBLE-DEFINITION-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `fcb16f1da1b5ad7483afd53ba29fd50cf324f472`  
**Verified entry tree:** `1010634f39976d2344b21a3592682f61b88d94e4`  
**Governed batch:** DD-358 through DD-362

## Entry gate

The DD-353…DD-357 state closure is exact-head verified:
- Core Service Verify `36907201725` / `110520610141`: **1109/1109 PASS**, zero failed/skipped.
- PostgreSQL `36907201725` / `110520610022`: **529/529 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36907201744` / `110520607036`: PASS.
- Web Boundary Verify `36907201866` / `110520612102`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of migration 0026 WorkflowTask/WorkflowInstance persistence, migration 0031 `validate_workflow_relationships()`, DD-102 raw WorkflowInstance reader, DD-103 raw WorkflowTask reader and DD-174 Workflow child→WorkflowInstance current-binding floor yields one independently source-complete **WorkflowTask visible-parent current-evidence reader composition**.

The repository already owns:
- exact RequestContext-scoped WorkflowTask read by id;
- exact RequestContext-scoped WorkflowInstance read by id;
- DD-174 exact parent id/Tenant/nullable-Industry relationship validation.

No additional persistence source or product policy is needed to read the visible task first, follow only its persisted `workflowInstanceId` under the exact same RequestContext, re-apply DD-174 and return immutable exact-reference evidence.

## Important authority boundary

This composition is not task-action authority.

Migration 0031 separately owns assignee PRINCIPAL/ROLE/ORG_UNIT integrity plus claimant/completer principal integrity. Those predicates are not part of DD-174 and are not re-resolved here.

Therefore this batch must not:
- resolve the assigned subject;
- validate claimant/completer currentness;
- interpret `permissionCode`;
- decide due/expiry;
- authorize claim/approve/reject/complete;
- infer that the parent WorkflowInstance can transition;
- mutate task or workflow state;
- emit events.

## Determination

**SOURCE-COMPLETE for one parent-first same-RequestContext WorkflowTask + visible WorkflowInstance current-binding evidence reader.**

A successful result means only:
1. the WorkflowTask was visible in the supplied RequestContext;
2. its exact referenced WorkflowInstance was visible under the same RequestContext;
3. DD-174's exact id/Tenant/nullable-Industry parent-binding floor passed.

It is **not** assignee authorization, task-action authorization or workflow execution authority.

## Locked DD-358…DD-362 contracts

### DD-358 — WorkflowTask parent-first exact read

Add `loadWorkflowTaskInstanceCurrentEvidence(...)`.

Its first action must invoke `WorkflowTaskReadPort.loadForContext` with the exact supplied:
- RequestContext object;
- WorkflowTask id.

If parent returns null:
- return null;
- do not access WorkflowInstance.

Parent dependency errors propagate unchanged.

### DD-359 — Exact referenced WorkflowInstance read under the same RequestContext

After a visible task:
- call `WorkflowInstanceReadPort.loadForContext` exactly once;
- pass the exact same RequestContext object;
- pass exactly `task.workflowInstanceId`.

Do not look up by resource, definition, state or alternate id. Do not switch context or scope.

A null WorkflowInstance returns null. Dependency errors propagate unchanged.

### DD-360 — Re-apply exact DD-174 child→parent current-binding floor

Call only `matchesWorkflowChildParentBindingFloors(task, instance)`.

If false, return null.

Do not duplicate or weaken DD-174 exact parent id/Tenant/nullable-Industry semantics.

### DD-361 — Immutable exact-reference current evidence

On success return frozen evidence containing:
- exact WorkflowTask reference;
- exact WorkflowInstance reference.

Do not clone/normalize/mutate either input.

### DD-362 — Preserve task evidence as raw and add no action/execution authority

The result must not:
- resolve PRINCIPAL/ROLE/ORG_UNIT assignment;
- validate claimant/completer currentness;
- interpret `permissionCode`;
- decide task due/expiry;
- authorize claim/approve/reject/complete;
- interpret parent `currentState` or lifecycle;
- authorize WorkflowTransition;
- mutate WorkflowTask/WorkflowInstance;
- emit events.

## Fixed acceptance before implementation

- **WFT-INSTREAD-BASE-001** exact RequestContext/id reaches WorkflowTask reader first; visible task precedes WorkflowInstance access.
- **WFT-INSTREAD-BASE-002** task null short-circuits parent access; task error propagates unchanged.
- **WFT-INSTREAD-INST-001** visible task forwards exact same RequestContext and exact persisted WorkflowInstance id once.
- **WFT-INSTREAD-INST-002** WorkflowInstance null returns null; dependency error propagates unchanged.
- **WFT-INSTREAD-FLOOR-001** exact Tenant-Core/Tenant-Industry parent binding passes DD-174; wrong parent id, Tenant, sibling Industry or Core/Industry mismatch fails closed.
- **WFT-INSTREAD-EVID-001** success preserves exact task/instance object identities in a frozen evidence envelope.
- **WFT-INSTREAD-RAW-001** assignment/state/due/claim/completion/version and parent workflow state/lifecycle evidence remain raw and unchanged.
- **WFT-INSTREAD-BOUND-001** output exposes no assignee-current, claimant-current, completer-current, due/expired, task-action, transition, execution, mutation or event authority.

Expected executable delta: Core **1109 → 1117**. PostgreSQL remains **529/529**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, UI/frontend or product-policy change.

This batch does **not** implement:
- assignee PRINCIPAL/ROLE/ORG_UNIT resolution/currentness;
- claimant/completer currentness;
- permission-code evaluation;
- task due/expiry policy;
- task claim/approve/reject/complete actions;
- parent WorkflowDefinition resolution;
- Workflow currentState/stateMachine validity;
- WorkflowTransition authorization;
- optimistic task/workflow mutation;
- event emission;
- scheduler/worker execution.

After DD-358…DD-362 implementation and targeted Core regression, run exact-head Core/PostgreSQL/Database/Web verification before canonical promotion.
