# AI AgentApproval parent/scope current-binding prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-APPROVAL-BACKLINK-CURRENT-FLOORS-001`  
**Verified synchronized basis:** `4598e99e0e2468761dddf23189edc8394cc821de`  
**Scope:** next independent source-complete AI relationship prerequisite after DD-183.

## Source reconciliation

Migration 0031 `validate_agent_step_approval()`, DD-130 AgentRun raw reader, DD-131 AgentStep raw reader and DD-132 AgentApproval raw reader were reconciled.

For an AgentApproval write, migration 0031 owns one deterministic parent/scope predicate:

- referenced AgentRun must exist;
- referenced AgentStep must exist;
- referenced AgentStep `run_id` must exactly equal AgentApproval `run_id`;
- AgentRun `tenant_id` must exactly equal AgentApproval `tenant_id`;
- AgentRun nullable `industry_context_id` must be exactly equal to AgentApproval nullable `industry_context_id` using SQL `IS DISTINCT FROM` semantics.

The same trigger separately checks a non-null `approver_principal_id` through `principal_is_active_for_tenant(..., COALESCE(approved_at, created_at))`. That identity/current-context predicate is not part of this parent/scope floor.

DD-09 further requires current approval/permission/context revalidation before tool execution. Persisted approval status or approver evidence therefore does not authorize AgentRun resume or tool execution.

## Determination

One pure **AgentApproval→AgentRun/AgentStep parent/scope necessary floor** is source-complete:

> Given one already-loaded AgentApproval, its already-loaded AgentRun and already-loaded AgentStep, determine only whether migration-0031's parent id/run/Tenant/nullable-Industry relationship still matches.

A true result is **not approval satisfaction, approver authorization, AgentRun resume or tool execution authority**.

## Authorized DD-184 boundary

Implement:

`matchesAIAgentApprovalParentScopeFloors(approval, run, step)`.

It must:

1. require valid approval id/run id/step id/Tenant id UUIDs;
2. require approval Industry Context, when present, to be a valid UUID;
3. require valid AgentRun id/Tenant id and optional valid Industry Context;
4. require valid AgentStep id/run id;
5. require exact `run.id === approval.runId`;
6. require exact `step.id === approval.stepId`;
7. require exact `step.runId === approval.runId`;
8. require exact `run.tenantId === approval.tenantId`;
9. require exact nullable Industry equality:
   - approval Industry absent => run Industry absent;
   - approval Industry present => run carries exact same valid Industry id;
10. leave all inputs unchanged.

## Acceptance target

- **AIAPP-PARENT-CUR-001** — exact Tenant-Core approval/run/step chain -> true.
- **AIAPP-PARENT-CUR-002** — exact Tenant-Industry approval/run/step chain -> true.
- **AIAPP-PARENT-CUR-003** — wrong run id or step id -> false.
- **AIAPP-PARENT-CUR-004** — step belongs to a different run -> false.
- **AIAPP-PARENT-CUR-005** — foreign Tenant, sibling Industry or Core/Industry mismatch -> false.
- **AIAPP-PARENT-CUR-006** — malformed approval/run/step identifiers or Industry ids -> false.
- **AIAPP-PARENT-CUR-007** — approval status/type/permission/approver/time/reason/correlation, run principal/membership/versions/resource/status/budgets and step type/tool/approval/status/timestamps/audit remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 528 to 535. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-184 does **not**:

- decide whether approval is APPROVED/current/satisfied;
- validate approver principal currentness or permission/context;
- validate requiredPermission;
- validate AgentDefinition or AgentRun execution currentness;
- resume/cancel AgentRun;
- authorize ToolSetMember/ToolDefinition/OperationContract execution;
- mutate AgentApproval/AgentRun/AgentStep;
- call providers/models/tools or perform inference/RAG/media;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification, Workflow, Automation or AI runtime execution boundaries.

## Next dependency boundary

After DD-184, AgentApproval parent/scope currentness is re-evaluable. Approval satisfaction and approver-currentness remain separate blocked semantics requiring their own source-complete evidence.
