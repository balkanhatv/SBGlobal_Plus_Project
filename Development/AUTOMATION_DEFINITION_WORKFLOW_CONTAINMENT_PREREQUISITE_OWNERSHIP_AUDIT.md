# AutomationDefinition WorkflowDefinition containment prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AUTOMATION-RUN-DEFINITION-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `cb389ba2fa9a19ebf23f8501e87880d9e8987963`  
**Scope:** next independent source-complete Workflow/Automation prerequisite after DD-175.

## Source reconciliation

Migration 0026 AutomationDefinition/WorkflowDefinition persistence, migration 0031 `validate_workflow_relationships()`, migration 0048 fail-closed `definition_contains_definition()`, DD-101 raw WorkflowDefinition reader and DD-105 raw AutomationDefinition reader were reconciled.

For an AutomationDefinition with `workflow_definition_id`, migration 0031 owns one exact deterministic relationship:

- referenced WorkflowDefinition must exist;
- parent WorkflowDefinition scope must contain the AutomationDefinition scope through `core_tenancy.definition_contains_definition(...)`;
- no WorkflowDefinition status, version, effective date, code, state-machine or approval/rule semantics are checked by this relationship.

Migration 0048 defines containment exactly:
- child PLATFORM => parent must be PLATFORM with no Tenant/Industry owner;
- child TENANT => parent may be PLATFORM or same-Tenant TENANT; INDUSTRY parent is narrower and invalid;
- child INDUSTRY => parent may be PLATFORM, same-Tenant TENANT or exact same-Tenant INDUSTRY.

## Determination

One pure **optional AutomationDefinition→WorkflowDefinition containment necessary floor** is source-complete:

> Given one already-loaded AutomationDefinition and optional already-loaded WorkflowDefinition evidence, determine only whether migration-0031's exact optional reference and migration-0048 containment relation still match.

A true result is **not WorkflowDefinition selection/currentness or Automation execution authority**.

## Authorized DD-176 boundary

Implement:

`matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(automationDefinition, workflowDefinition?)`.

It must:

1. require valid AutomationDefinition id and valid owner shape;
2. if `workflowDefinitionId` is absent, require no WorkflowDefinition evidence and return true;
3. if `workflowDefinitionId` is present, require a valid UUID and a provided WorkflowDefinition with exact matching id;
4. require valid WorkflowDefinition owner shape;
5. apply exact containment:
   - Automation PLATFORM -> Workflow PLATFORM only;
   - Automation TENANT -> Workflow PLATFORM or same-Tenant TENANT;
   - Automation INDUSTRY -> Workflow PLATFORM, same-Tenant TENANT, or exact same-Tenant INDUSTRY;
6. leave all other AutomationDefinition/WorkflowDefinition evidence uninterpreted and unchanged.

## Acceptance target

- **WFA-DEF-WF-CUR-001** — unbound AutomationDefinition with no Workflow evidence -> true; extraneous Workflow evidence -> false.
- **WFA-DEF-WF-CUR-002** — PLATFORM AutomationDefinition requires exact PLATFORM WorkflowDefinition -> true; Tenant/Industry parent -> false.
- **WFA-DEF-WF-CUR-003** — TENANT AutomationDefinition accepts PLATFORM or same-Tenant TENANT parent; foreign Tenant/Industry parent -> false.
- **WFA-DEF-WF-CUR-004** — INDUSTRY AutomationDefinition accepts PLATFORM, same-Tenant TENANT or exact same-Tenant INDUSTRY parent; sibling/foreign Industry -> false.
- **WFA-DEF-WF-CUR-005** — wrong/missing/malformed WorkflowDefinition id evidence -> false.
- **WFA-DEF-WF-CUR-006** — malformed AutomationDefinition or WorkflowDefinition owner shape -> false.
- **WFA-DEF-WF-CUR-007** — status/version/effective dates/code/schema/stateMachine/approval/rule/trigger/config/condition/operation evidence remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 472 to 479. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-176 does **not**:

- require WorkflowDefinition ACTIVE/PUBLISHED status;
- compare WorkflowDefinition version or effective dates;
- choose a WorkflowDefinition by code/version/date;
- interpret Workflow state-machine/approval/rules;
- interpret Automation trigger/config/condition data;
- dispatch OperationContract or WorkflowDefinition;
- create/mutate AutomationRun or WorkflowInstance;
- emit events;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification or Workflow/Automation execution boundaries.

## Next dependency boundary

After DD-176, optional AutomationDefinition→WorkflowDefinition containment is re-evaluable. OperationContract reference execution/validation remains separately governed and must not be inferred from raw text identifiers.
