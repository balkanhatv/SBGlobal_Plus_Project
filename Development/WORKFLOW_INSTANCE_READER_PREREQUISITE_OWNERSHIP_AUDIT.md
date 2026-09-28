# WorkflowInstance PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `da092113f66fbacc6bbb6cebb19bed169fb574ae`  
**Scope:** next independent source-complete Workflow persistence slice after DD-101.

## Source reconciliation

Migration 0026 `workflow_instance` schema/FORCE-RLS policy, migration 0027
dedicated Workflow worker privileges, migration 0031 definition/version/scope and
creator relationship integrity, DD-101's dedicated Workflow PostgreSQL boundary and
the current raw-reader discipline were reconciled.

The persisted instance contract is exact:

- scope is `TENANT_CORE | TENANT_INDUSTRY`;
- Tenant Industry scope requires exact Industry Context;
- WorkflowDefinition id + positive definition version are persisted and the database
  trigger requires that exact ACTIVE definition version to be applicable to the
  instance Tenant/Industry scope;
- `resource_type`, `resource_id` and `current_state` are raw text evidence;
- lifecycle is persisted `OPEN | WAITING | COMPLETED | CANCELLED`;
- `row_version` is persisted bigint with default 1 but no positive-value CHECK, so a
  raw reader must not invent one;
- `started_at` is required and optional `completed_at` is database-constrained to
  be >= startedAt when present;
- `created_by` must be an active Tenant principal at createdAt;
- FORCE-RLS is Tenant + exact Industry Context, while Tenant Core rows remain
  same-Tenant visible;
- `sbg_workflow_worker_rw` already has SELECT/INSERT/UPDATE on WorkflowInstance.

## Determination

A concrete **exact-by-id raw WorkflowInstance reader** is source-complete.

This slice is not Workflow execution authority. `currentState`, lifecycle,
rowVersion and timestamps are persisted evidence only. The reader must not decide
which transition is allowed, interpret WorkflowDefinition state-machine JSON,
evaluate approval/rule policy, claim/complete tasks, perform optimistic transition
writes or emit workflow events.

## Authorized implementation boundary

Implement:

1. Core typed `PersistedWorkflowInstance` / `WorkflowInstanceReadPort`;
2. `PostgresWorkflowInstanceStore` through existing
   `PostgresWorkflowDatabase` + `RequestScopedSql`;
3. one exact read by instance UUID;
4. schema-owned UUID/scope/enum/positive definition-version/timestamp validation;
5. raw text preservation for resource/current-state fields, including empty strings
   because the schema does not forbid them;
6. `row_version` preserved as canonical signed decimal text without inventing a
   positivity rule;
7. null for RLS-hidden / absent rows;
8. real PostgreSQL acceptance proving exact Industry isolation, Tenant Core
   same-Tenant visibility, foreign-Tenant isolation and raw lifecycle/state/version
   fidelity.

No transition selector, state-machine interpreter, approval/rule evaluator,
task mutation, optimistic transition command, event emission, route, migration,
role, grant or RLS change is authorized.

Acceptance: WFI-PG-001…007.
