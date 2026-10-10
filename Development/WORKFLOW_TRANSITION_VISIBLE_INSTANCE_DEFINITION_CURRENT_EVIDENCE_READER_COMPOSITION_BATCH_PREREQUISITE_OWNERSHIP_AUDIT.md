# WorkflowTransition visible WorkflowInstance + WorkflowDefinition current-evidence reader prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-WORKFLOW-TASK-VISIBLE-DEFINITION-ACTING-RBAC-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `53ef56ac1b3b871eda084a68744dc0acb44101cb`  
**Verified entry tree:** `87cb69dedbe267492bf6a434c8c2151342bf6f5b`  
**Governed batch:** DD-488 through DD-492

## Entry gate

DD-483…DD-487 is fully closed at its bounded evidence scope. The closure-record HEAD `53ef56ac1b3b871eda084a68744dc0acb44101cb` passed exact-head push gates:
- Core Service Verify run `37260116927` / job `111605376286`: **1326/1326 PASS**, fail/skip 0.
- PostgreSQL same run / job `111605376396`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37260116954` / job `111605376269`: PASS, **48 migrations / 42 SQL verification files**.
- Web run `37260116941` / job `111605376229`: PASS.

PR #2 remains draft/unmerged. RawSource remains unchanged; `main` remains unmerged.

## Reconciled source owners

- DD-363…DD-367 already own exact RequestContext-scoped WorkflowTransition → current WorkflowInstance evidence. The transition remains historical evidence and the current parent may have advanced.
- DD-353…DD-357 already own same-RequestContext WorkflowInstance → visible current WorkflowDefinition evidence and DD-173 exact id/version/ACTIVE/applicability binding.
- `WorkflowDefinitionReadPort.loadForContext` is the source-owned exact definition read boundary.
- `matchesWorkflowInstanceDefinitionBindingFloors(instance, definition)` is the source-owned DD-173 current binding floor.
- The current Tenant-context definition reader owns no implicit PLATFORM_GLOBAL fallback. A hidden/absent referenced definition therefore remains fail-closed.
- Migration 0031 and DD-174 keep WorkflowTransition actor membership and transition authority separate from the child→parent relationship. Historical `fromState/actionCode/toState/expectedInstanceVersion/resultingInstanceVersion/occurredAt` are not current-transition authorization inputs here.
- WorkflowDefinition `stateMachine`, `approvalPolicy`, `ruleRefs`, effective dates and creator/approver metadata remain raw. No source-owned rule in this composition maps a historical transition `actionCode` into the current state machine or authorizes replay/transition execution.

**SOURCE-COMPLETE:** extend exact DD-367 evidence by one same-RequestContext read of the exact persisted `parent.instance.workflowDefinitionId`, then apply only DD-173 to the already-loaded current WorkflowInstance and returned WorkflowDefinition. Do not invoke the existing DD-357 reader because that would duplicate the WorkflowInstance read.

## Frozen decisions

**DD-488 — exact DD-367 parent evidence first.** Add `loadWorkflowTransitionInstanceDefinitionCurrentEvidence(...)`. Invoke DD-367 first with the exact supplied RequestContext, WorkflowTransition id, transition reader and instance reader. Parent null returns null before definition access; parent dependency errors propagate unchanged.

**DD-489 — one exact same-context WorkflowDefinition read.** After DD-367 succeeds, call `WorkflowDefinitionReadPort.loadForContext` exactly once with the identical RequestContext object and exactly `parent.instance.workflowDefinitionId`. Do not look up by code/version, switch context, retry or fall back to PLATFORM_GLOBAL. Null returns null; dependency errors propagate unchanged.

**DD-490 — exact DD-173 current definition binding.** Apply only `matchesWorkflowInstanceDefinitionBindingFloors(parent.instance, definition)`. False returns null. Do not add transition actor, historical state/version, current-state or action-code predicates.

**DD-491 — immutable layered evidence with historical/current separation.** Success returns frozen `{ parent, definition }`, preserving the exact DD-367 parent and exact WorkflowDefinition reference. The nested transition remains historical evidence; the nested WorkflowInstance and definition are current visible evidence. Do not clone, normalize or mutate any input.

**DD-492 — no actor/action/state-machine/replay/execution authority.** Preserve transition actor/from/action/to/reason/version/time/correlation, current instance lifecycle/currentState/resource fields, and definition stateMachine/approvalPolicy/ruleRefs/effective metadata raw. Do not validate actor currentness or actor-at-occurrence membership, map actionCode into stateMachine, compare historical transition state/version to current parent state/version, authorize transition/replay/task action, mutate state, emit events or execute workers.

## Fixed acceptance before implementation

- **WTR-DEFREAD-BASE-001** exact DD-367 parent chain is established first with unchanged RequestContext/id/dependencies.
- **WTR-DEFREAD-BASE-002** DD-367 null/error short-circuits or propagates before WorkflowDefinition access.
- **WTR-DEFREAD-DEF-001** exactly one WorkflowDefinition read uses the identical RequestContext and exact persisted current parent definition id, including Tenant-Core and Tenant-Industry contexts.
- **WTR-DEFREAD-DEF-002** hidden/missing definition returns null; definition errors propagate unchanged.
- **WTR-DEFREAD-FLOOR-001** exact ACTIVE/version/applicable DD-173 definition passes; status/version/Tenant/Industry mismatch fails closed.
- **WTR-DEFREAD-NOFALLBACK-001** RLS-hidden/absent referenced definition remains null with no PLATFORM_GLOBAL/context fallback.
- **WTR-DEFREAD-EVID-001** success returns frozen exact-reference `{ parent, definition }` and performs no second WorkflowInstance read.
- **WTR-DEFREAD-HISTORY-001** historical transition state/version/action/time remains raw and is not rejected merely because the current instance has advanced.
- **WTR-DEFREAD-BOUND-001** output exposes no actor-current/actor-at-occurrence, action-state-machine compatibility, transition/replay/task-action authorization, mutation/event or workflow execution authority.

Expected executable delta: Core **1326 → 1335**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, frontend, scheduler/worker or RawSource change.

This batch does **not**:
- perform a second WorkflowInstance read;
- invent PLATFORM_GLOBAL fallback;
- validate actor membership/currentness;
- map transition.actionCode into WorkflowDefinition.stateMachine;
- validate historical from/to/version against the later current parent;
- interpret approvalPolicy/ruleRefs/effective dates;
- authorize a transition or replay;
- perform optimistic state mutation;
- emit workflow events;
- dispatch/execute workflow workers.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-488…DD-492 and the fixed acceptances.
