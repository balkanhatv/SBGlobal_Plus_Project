# WorkflowTask PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `bda33252f12bad88d33190b010102681922c0d21`  
**Scope:** next independent source-complete Workflow persistence slice after DD-102.

## Source reconciliation

Migration 0026 `workflow_task` schema/parent FORCE-RLS policy, migration 0027
Workflow worker privileges, migration 0031 parent-scope and assignee/claimant/
completer integrity, DD-102 WorkflowInstance persistence and the existing dedicated
Workflow PostgreSQL boundary were reconciled.

The persisted task contract is exact:

- task type is `APPROVAL | REVIEW | ACTION`;
- assigned subject type is `PRINCIPAL | ROLE | ORG_UNIT`;
- permission code is persisted raw text;
- task state is
  `PENDING | CLAIMED | APPROVED | REJECTED | COMPLETED | CANCELLED | EXPIRED`;
- optional dueAt, claimedBy, completedBy and completedAt are persisted evidence;
- completedAt may be non-null only for terminal task states listed by the schema;
- `row_version` is bigint with default 1 and no positivity CHECK;
- parent WorkflowInstance scope must exactly match the task Tenant/Industry scope;
- assignee PRINCIPAL/ROLE/ORG_UNIT scope integrity is database-triggered;
- claimant/completer must be active Tenant principals when written;
- FORCE-RLS visibility is inherited from the RLS-visible parent WorkflowInstance;
- `sbg_workflow_worker_rw` already has SELECT/INSERT/UPDATE on WorkflowTask.

## Determination

A concrete **exact-by-id raw WorkflowTask reader** is source-complete.

This slice is not task-action authority. The reader must not decide whether the
resolved principal matches the assigned subject, whether dueAt is effective/expired,
whether a task may be claimed/approved/rejected/completed, whether a permission code
authorizes an action, or whether the parent WorkflowInstance can transition.

## Authorized implementation boundary

Implement:

1. Core typed `PersistedWorkflowTask` / `WorkflowTaskReadPort`;
2. `PostgresWorkflowTaskStore` through the existing
   `PostgresWorkflowDatabase` + `RequestScopedSql`;
3. one exact read by task UUID;
4. schema-owned UUID/enum/timestamp validation only;
5. raw permission text preservation, including empty string because schema does not
   forbid it;
6. `row_version` preserved as canonical signed decimal text without invented
   positivity;
7. null for parent-RLS-hidden / absent rows;
8. real PostgreSQL acceptance proving exact Industry isolation, Tenant Core
   same-Tenant visibility, foreign-Tenant isolation and raw assignment/state/due/
   claim/completion/version fidelity.

No assignee matcher, due/expiry reducer, claim/approve/reject/complete action,
permission evaluator, parent transition authorization, event emission, route,
migration, role, grant or RLS change is authorized.

Acceptance: WFT-PG-001…007.
