# Workflow child parent-scope current-binding prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-WORKFLOW-INSTANCE-DEFINITION-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `2655d34ba81216c2dafa78b396dd993d16e1b169`  
**Scope:** next independent source-complete Workflow prerequisite after DD-173.

## Source reconciliation

Migration 0026 WorkflowTask/WorkflowTransition/WorkflowInstance persistence, migration 0031 `validate_workflow_relationships()`, DD-102 raw WorkflowInstance reader, DD-103 raw WorkflowTask reader and DD-104 raw WorkflowTransition reader were reconciled.

For both `workflow_task` and `workflow_transition`, migration 0031 owns the same deterministic parent relationship:

- referenced WorkflowInstance must exist;
- parent WorkflowInstance Tenant id must exactly equal the child Tenant id;
- parent nullable Industry Context must be exactly equal to the child nullable Industry Context using SQL `IS DISTINCT FROM` semantics.

WorkflowTask then performs separate assignee PRINCIPAL/ROLE/ORG_UNIT, claimant and completer validation. WorkflowTransition separately validates actor principal currentness. Those identity/authorization predicates are not part of this parent-scope floor.

## Determination

One pure **Workflow child→WorkflowInstance current-binding necessary floor** is source-complete for either PersistedWorkflowTask or PersistedWorkflowTransition:

> Given one already-loaded child and one already-loaded WorkflowInstance, determine only whether migration-0031's exact parent id/Tenant/nullable-Industry relationship still matches.

A true result is **not task-action, assignee, actor, transition or workflow execution authorization**.

## Authorized DD-174 boundary

Implement:

`matchesWorkflowChildParentBindingFloors(child, instance)`

where `child` is `PersistedWorkflowTask | PersistedWorkflowTransition`.

It must:

1. require valid child id, Tenant id and WorkflowInstance id UUIDs;
2. require child Industry Context, when present, to be a valid UUID;
3. require valid WorkflowInstance id/Tenant identity and valid TENANT_CORE/TENANT_INDUSTRY ownership shape;
4. require exact `instance.id === child.workflowInstanceId`;
5. require exact `instance.tenantId === child.tenantId`;
6. require exact nullable Industry Context equality:
   - child Industry absent => parent must be TENANT_CORE with Industry absent;
   - child Industry present => parent must be TENANT_INDUSTRY with exact Industry id;
7. leave all inputs unchanged.

## Acceptance target

- **WFCH-PARENT-CUR-001** — Tenant-Core task exact parent id/Tenant/absent Industry -> true.
- **WFCH-PARENT-CUR-002** — Tenant-Industry task exact parent id/Tenant/Industry -> true.
- **WFCH-PARENT-CUR-003** — Tenant-Core transition exact parent -> true.
- **WFCH-PARENT-CUR-004** — Tenant-Industry transition exact parent -> true.
- **WFCH-PARENT-CUR-005** — wrong parent id, foreign Tenant, sibling Industry or Core/Industry mismatch -> false.
- **WFCH-PARENT-CUR-006** — malformed child/parent UUID or parent ownership shape -> false.
- **WFCH-PARENT-CUR-007** — task assignment/state/due/claim/completion and transition from/action/to/actor/version/reason/time evidence remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 458 to 465. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-174 does **not**:

- validate task assignee PRINCIPAL/ROLE/ORG_UNIT currentness;
- validate claimant/completer currentness;
- validate transition actor currentness;
- decide task due/expiry or permitted actions;
- interpret permissionCode;
- validate transition against WorkflowDefinition/state machine/rules;
- mutate WorkflowInstance/Task;
- emit events;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox or Notification execution boundaries.

## Next dependency boundary

After DD-174, exact Workflow child→parent scope currentness is re-evaluable. Assignee/actor identity and Workflow execution remain separately governed.
