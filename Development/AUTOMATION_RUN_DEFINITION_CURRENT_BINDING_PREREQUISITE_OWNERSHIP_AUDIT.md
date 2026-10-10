# AutomationRun AutomationDefinition current-binding floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-WORKFLOW-CHILD-PARENT-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `f13f6a67f943582deebf7ebef079e24166051cbe`  
**Scope:** next independent source-complete Workflow/Automation prerequisite after DD-174.

## Source reconciliation

Migration 0026 AutomationDefinition/AutomationRun persistence, migration 0031 `validate_workflow_relationships()`, DD-105 raw AutomationDefinition reader and DD-106 raw AutomationRun reader were reconciled with DD-170's total fail-closed definition applicability semantics.

For `automation_run`, migration 0031 owns one deterministic relationship predicate:

- referenced AutomationDefinition must exist;
- raw AutomationDefinition status must be exactly `ACTIVE`;
- definition ownership must apply to the AutomationRun Tenant/Industry scope under the canonical PLATFORM/TENANT/INDUSTRY hierarchy.

AutomationRun does **not** persist an AutomationDefinition version, and migration 0031 does not compare definition version/effective dates for this relationship. Those semantics must not be invented.

## Determination

One pure **AutomationRun→AutomationDefinition current-binding necessary floor** is source-complete:

> Given one already-loaded AutomationRun and one already-loaded AutomationDefinition, determine only whether migration-0031's exact definition id/ACTIVE/scope relationship still matches.

A true result is **not trigger execution, run-state transition, retry/finality or OperationContract/Workflow dispatch authority**.

## Authorized DD-175 boundary

Implement:

`matchesAutomationRunDefinitionBindingFloors(run, definition)`.

It must:

1. require valid AutomationRun id, Tenant id and AutomationDefinition id UUIDs;
2. require run Industry Context, when present, to be a valid UUID;
3. require valid definition id and exact `definition.id === run.automationDefinitionId`;
4. require raw `definition.status === 'ACTIVE'`;
5. require valid definition owner shape and canonical applicability:
   - PLATFORM => no Tenant/Industry owner; applies to Tenant-Core or Tenant-Industry run;
   - TENANT => valid same Tenant, no owner Industry; applies within that Tenant;
   - INDUSTRY => valid same Tenant + exact valid Industry Context; applies only to exact Industry run;
6. leave all inputs unchanged.

The helper must not compare definition version, schemaVersion or effective dates because the migration-owned run relationship does not.

## Acceptance target

- **WFA-RUN-DEF-CUR-001** — exact ACTIVE PLATFORM definition applies to Tenant-Core and Tenant-Industry runs -> true.
- **WFA-RUN-DEF-CUR-002** — exact ACTIVE same-Tenant TENANT definition applies to Core/Industry; foreign Tenant -> false.
- **WFA-RUN-DEF-CUR-003** — exact ACTIVE INDUSTRY definition applies only to exact same-Tenant Industry; sibling/Tenant-Core -> false.
- **WFA-RUN-DEF-CUR-004** — wrong definition id -> false.
- **WFA-RUN-DEF-CUR-005** — DRAFT/REVIEW/PUBLISHED/RETIRED definition -> false.
- **WFA-RUN-DEF-CUR-006** — malformed run/definition identity or owner shape -> false.
- **WFA-RUN-DEF-CUR-007** — definition version/effective dates/trigger/config/condition/operation/workflow refs plus run trigger/idempotency/status/time/error evidence remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 465 to 472. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-175 does **not**:

- select an AutomationDefinition version or effective-date winner;
- interpret EVENT/SCHEDULE/MANUAL trigger config;
- evaluate condition rules;
- authorize run-state transitions;
- schedule retry/backoff/finality;
- dispatch OperationContract or WorkflowDefinition;
- mutate AutomationRun;
- emit events;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification or Workflow execution boundaries.

## Next dependency boundary

After DD-175, AutomationRun definition currentness is re-evaluable. AutomationDefinition→WorkflowDefinition containment may be audited independently where raw evidence is complete; runtime execution remains blocked.
