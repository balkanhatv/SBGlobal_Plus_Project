# AutomationRun PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `23b0dd0c51244521e6af98e5b8ef76f6694d77cf`  
**Scope:** next independent source-complete Workflow/Automation persistence slice after DD-105.

## Source reconciliation

DD-05 §3B, migration 0026 `automation_run` schema/FORCE-RLS, migration 0027 dedicated Workflow worker privileges, migration 0031 AutomationRun-to-eligible-AutomationDefinition integrity and the existing DD-102/DD-105 exact-by-id PostgreSQL reader patterns were reconciled.

The persisted contract is exact:

- every AutomationRun is Tenant-owned and may additionally carry an Industry Context;
- `automation_definition_id` is required and migration 0031 rejects a run whose referenced AutomationDefinition is missing, inactive or outside the run scope;
- `trigger_ref` and `idempotency_key_hash` are required raw text persistence evidence;
- status is `PENDING | RUNNING | SUCCEEDED | FAILED | CANCELLED`;
- `started_at` is required; optional `completed_at` may not precede `started_at`;
- `correlation_id` is required and `last_error_code` is optional raw evidence;
- unique `(tenant_id, COALESCE(industry_context_id, zero_uuid), automation_definition_id, idempotency_key_hash)` prevents duplicate persisted run identity for the same scoped automation/idempotency hash;
- FORCE-RLS requires the current Tenant and admits Tenant-Core rows to same-Tenant Industry contexts while Industry rows remain exact-Industry only;
- `sbg_workflow_worker_rw` has SELECT/INSERT/UPDATE on AutomationRun. The repository does not define a canonical run-state transition machine, retry scheduler, trigger executor or status-mutation service in this slice.

## Determination

A concrete **exact-by-id raw AutomationRun reader** is source-complete.

Automation execution/state mutation is **not** source-complete in this slice. Persisted status, trigger reference, idempotency hash, timestamps, correlation id and last-error code are evidence only. They must not become trigger interpretation, retry/finality authority, state-transition authorization, OperationContract dispatch or WorkflowDefinition execution.

## Authorized implementation boundary

Implement:

1. a typed Core `PersistedAutomationRun` / `AutomationRunReadPort` contract;
2. `PostgresAutomationRunStore` through the existing `PostgresWorkflowDatabase` + `RequestScopedSql` boundary;
3. exact-by-id parameterized reads;
4. strict UUID/status/timestamp validation and persisted `completedAt >= startedAt` revalidation;
5. raw `triggerRef`, `idempotencyKeyHash` and optional `lastErrorCode` preservation;
6. null for RLS-hidden/absent rows;
7. real PostgreSQL acceptance for exact Industry visibility, sibling Industry isolation, same-Tenant Tenant-Core visibility, foreign-Tenant isolation, raw evidence fidelity, malformed/route mismatch fail-closed behavior and source-owned worker catalog privilege posture.

The reader must not:

- select or create a run;
- derive or interpret a trigger from `trigger_ref`;
- treat the idempotency hash as an authorization/replay decision;
- choose or authorize a run-status transition;
- schedule retry/backoff/finality;
- evaluate AutomationDefinition trigger/config/condition data;
- dispatch an OperationContract or WorkflowDefinition;
- mutate AutomationRun;
- change migrations, roles, grants, RLS policies, routes or product policy.

No migration, role, grant, RLS policy, scheduler, trigger consumer, retry engine, route or product-policy change is authorized.

Acceptance namespace: `WFA-RUN-PG-001…007`.
