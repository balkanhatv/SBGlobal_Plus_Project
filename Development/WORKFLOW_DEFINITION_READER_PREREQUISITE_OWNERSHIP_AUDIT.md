# WorkflowDefinition PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `46615c59c505c1220099a24117e870776012fa8f`  
**Scope:** next independent source-complete Workflow persistence slice after DD-100.

## Source reconciliation

Migration 0026 `workflow_definition` schema/FORCE-RLS owner-scope policy,
migration 0027 dedicated Workflow worker privileges, migration 0031
creator/approver relationship integrity and current raw-definition reader patterns
were reconciled.

The raw persistence contract is exact:

- owner scope is `PLATFORM | TENANT | INDUSTRY`;
- owner shape is enforced by tenant/industry nullability;
- code + positive version identify a version within owner scope;
- lifecycle status is persisted
  `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`;
- positive schema version, state-machine JSON, approval-policy JSON and rule-ref array
  are persisted evidence;
- creator is required and approver optional;
- effectiveFrom/effectiveTo are optional and the database only constrains
  effectiveTo > effectiveFrom when both exist;
- creator/approver scope integrity is database-triggered;
- FORCE-RLS uses `row_visible_to_current_context`: PLATFORM rows require
  PLATFORM_GLOBAL context, Tenant rows require the Tenant, and Industry rows require
  the exact Industry Context;
- `sbg_workflow_worker_rw` has SELECT on WorkflowDefinition and does not own the
  definition catalog.

## Determination

A concrete **exact-by-id raw WorkflowDefinition reader** is source-complete.

Definition selection and execution are not source-complete in this slice. The reader
must not choose an ACTIVE version, apply effective-date selection, interpret the
state-machine JSON, execute approval policy/rules, authorize transitions or create
WorkflowInstances.

## Authorized implementation boundary

Implement:

1. a Core typed `PersistedWorkflowDefinition` / `WorkflowDefinitionReadPort`;
2. dedicated `PostgresWorkflowDatabase` fixed to the existing
   `sbg_workflow_worker_rw` NOBYPASSRLS role;
3. `PostgresWorkflowDefinitionStore` using `RequestScopedSql`;
4. one exact read by definition UUID;
5. owner-scope / UUID / enum / positive-integer / JSON / array / timestamp shape
   validation and immutable result, without inventing non-empty text or timestamp
   ordering beyond persisted schema;
6. real PostgreSQL acceptance proving exact Industry isolation, Tenant same-Tenant
   visibility, PLATFORM_GLOBAL-only visibility and raw lifecycle/JSON/effective-date
   fidelity.

No active-version/effective-date selector, workflow engine, approval/rule evaluator,
transition authorization, mutation, route, migration, role, grant or RLS change is
authorized.

Acceptance: WFD-PG-001…007.
