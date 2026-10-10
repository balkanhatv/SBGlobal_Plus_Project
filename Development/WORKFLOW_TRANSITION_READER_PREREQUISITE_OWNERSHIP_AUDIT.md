# WorkflowTransition PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `f35aba5b2c3114448fd60e296eeff0a8129a0c04`  
**Scope:** next independent source-complete Workflow persistence slice after DD-103.

## Source reconciliation

Migration 0026 `workflow_transition` schema/parent FORCE-RLS policy, migration
0027 append-only Workflow worker privileges, migration 0031 parent-scope + actor
integrity, DD-102 WorkflowInstance persistence and the dedicated Workflow PostgreSQL
boundary were reconciled.

The persisted transition contract is exact:

- transition belongs to one Tenant plus optional exact Industry Context through its
  parent WorkflowInstance;
- fromState, actionCode and toState are persisted raw text;
- actorPrincipalId is required and must be an active Tenant principal at occurredAt;
- reasonCode is optional raw text;
- expectedInstanceVersion is bigint > 0;
- resultingInstanceVersion is bigint > expectedInstanceVersion;
- occurredAt and correlationId are required evidence;
- FORCE-RLS visibility is inherited from the visible parent WorkflowInstance;
- `sbg_workflow_worker_rw` has SELECT/INSERT but not UPDATE/DELETE on transition
  evidence, making runtime transition rows append-only to that worker role.

## Determination

A concrete **exact-by-id raw WorkflowTransition reader** is source-complete.

This slice is not transition authority. Persisted from/action/to/version evidence
records what happened; it must not be used by this reader to decide what may happen
next, validate a requested transition against WorkflowDefinition state-machine JSON,
perform optimistic WorkflowInstance mutation, execute approval/rules, mutate tasks or
emit downstream events.

## Authorized implementation boundary

Implement:

1. Core typed `PersistedWorkflowTransition` / `WorkflowTransitionReadPort`;
2. `PostgresWorkflowTransitionStore` through existing
   `PostgresWorkflowDatabase` + `RequestScopedSql`;
3. one exact read by transition UUID;
4. schema-owned UUID/timestamp validation;
5. raw from/action/to/reason text preservation, including empty strings where schema
   permits;
6. expected/resulting bigint versions preserved as positive decimal text, with the
   schema-owned resulting > expected invariant revalidated without JS-number
   coercion;
7. null for parent-RLS-hidden / absent rows;
8. real PostgreSQL acceptance proving exact Industry isolation, Tenant Core
   same-Tenant visibility, foreign-Tenant isolation, large-version fidelity and
   append-only UPDATE/DELETE denial.

No transition selector, state-machine/rule evaluator, WorkflowInstance mutation,
task mutation, event emission, route, migration, role, grant or RLS change is
authorized.

Acceptance: WTR-PG-001…007.
