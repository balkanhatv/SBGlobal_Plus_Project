# WorkflowInstance WorkflowDefinition current-binding floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-NOTIFICATION-KNOWN-RELATIONSHIP-FLOORS-001`  
**Verified synchronized basis:** `7c88501f5bcc1b8e1fdb01d0f777a6077c17cb6e`  
**Scope:** next independent source-complete Workflow prerequisite after DD-172.

## Source reconciliation

Migration 0026 WorkflowDefinition/WorkflowInstance persistence, migration 0031 `validate_workflow_relationships()`, DD-101 raw WorkflowDefinition reader and DD-102 raw WorkflowInstance reader were reconciled with DD-170's fail-closed definition applicability correction.

Migration 0031 owns one exact deterministic WorkflowInstance→WorkflowDefinition relationship predicate:

- referenced WorkflowDefinition must exist;
- persisted WorkflowDefinition version must exactly equal `workflow_definition_version`;
- raw WorkflowDefinition status must be exactly `ACTIVE`;
- definition ownership must apply to the WorkflowInstance Tenant/Industry scope under the canonical PLATFORM/TENANT/INDUSTRY hierarchy.

The same trigger separately validates `created_by` through `principal_is_active_for_tenant(..., created_at)`. That identity predicate may depend on TenantMembership or request-local PLATFORM_OPERATOR elevation/current-principal/current-Tenant context and is not part of this relationship floor.

## Determination

One pure **WorkflowInstance→WorkflowDefinition current-binding necessary floor** is source-complete:

> Given one already-loaded WorkflowInstance and one already-loaded WorkflowDefinition, determine only whether the migration-0031 definition id/version/status/scope relationship still matches.

A true result is **not workflow execution, transition authorization, current-state validation or creator-principal authorization**.

## Authorized DD-173 boundary

Implement:

`matchesWorkflowInstanceDefinitionBindingFloors(instance, definition)`.

It must:

1. require valid instance id/Tenant identity and valid TENANT_CORE/TENANT_INDUSTRY ownership shape;
2. require valid definition id and exact `definition.id === instance.workflowDefinitionId`;
3. require `instance.workflowDefinitionVersion` to be a positive safe integer;
4. require exact `definition.version === instance.workflowDefinitionVersion`;
5. require raw `definition.status === 'ACTIVE'`;
6. require valid definition owner shape and canonical applicability:
   - PLATFORM => no Tenant/Industry owner; applies to Tenant-Core or Tenant-Industry;
   - TENANT => valid same Tenant, no owner Industry; applies within that Tenant;
   - INDUSTRY => valid same Tenant + exact valid Industry Context; applies only to exact Tenant-Industry instance;
7. leave all inputs unchanged.

The helper mirrors migration 0031 + DD-170 total scope semantics only.

## Acceptance target

- **WFI-DEF-CUR-001** — exact ACTIVE PLATFORM definition/version applies to Tenant-Core and Tenant-Industry -> true.
- **WFI-DEF-CUR-002** — exact ACTIVE same-Tenant TENANT definition applies to Tenant-Core and Tenant-Industry; foreign Tenant -> false.
- **WFI-DEF-CUR-003** — exact ACTIVE INDUSTRY definition applies only to exact same-Tenant Industry; sibling/Tenant-Core -> false.
- **WFI-DEF-CUR-004** — wrong definition id or missing/mismatched/non-positive definition version -> false.
- **WFI-DEF-CUR-005** — DRAFT/REVIEW/PUBLISHED/RETIRED definition -> false.
- **WFI-DEF-CUR-006** — malformed instance/definition identity or owner/scope shape -> false.
- **WFI-DEF-CUR-007** — resource/currentState/lifecycle/rowVersion/timestamps/creator and definition code/schema/stateMachine/approval/rules/effective/creator/approver evidence remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 451 to 458. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-173 does **not**:

- validate `created_by` currentness;
- select a WorkflowDefinition by code/version/date;
- interpret state-machine JSON or approval/rule policy;
- decide whether `currentState` is valid;
- authorize or execute a transition;
- claim/complete WorkflowTasks;
- mutate WorkflowInstance;
- emit events;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox or Notification execution boundaries.

## Next dependency boundary

After DD-173, WorkflowInstance definition relationship currentness is re-evaluable. Workflow creator-principal validity remains separately governed by the same identity predicate family that blocked Notification recipient replay. Workflow child-parent exact-scope relationships may be audited independently.
