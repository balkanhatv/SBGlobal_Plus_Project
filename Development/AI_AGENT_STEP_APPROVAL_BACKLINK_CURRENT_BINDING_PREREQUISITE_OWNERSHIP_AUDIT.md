# AI AgentStep approval-backlink current-binding prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-TOOL-BINDING-CURRENT-FLOORS-001`  
**Verified synchronized basis:** `34441fd07185dabf27ad9b2f60f908325e2ee462`  
**Scope:** next independent source-complete AI relationship prerequisite after DD-182.

## Source reconciliation

Migration 0031 `validate_agent_step_approval()`, DD-131 AgentStep raw reader and DD-132 AgentApproval raw reader were reconciled.

For an AgentStep carrying optional `approval_id`, migration 0031 owns one exact deterministic backlink predicate:

- if `approval_id` is absent, no approval backlink is required;
- if `approval_id` is present, the referenced AgentApproval must exist;
- AgentApproval `id` must exactly equal the persisted step `approval_id`;
- AgentApproval `run_id` must exactly equal the AgentStep `run_id`;
- AgentApproval `step_id` must exactly equal the AgentStep `id`.

The separate AgentApproval trigger validates approval Tenant/Industry scope against AgentRun and optionally validates the approver principal at approval/create time. DD-09 further requires current approval/permission/context revalidation before tool execution. Those semantics are not part of the step backlink floor.

## Determination

One pure **AgentStep→AgentApproval optional backlink necessary floor** is source-complete:

> Given one already-loaded AgentStep and optional already-loaded AgentApproval evidence, determine only whether migration-0031's persisted approval backlink still points to the same step and same run.

A true result is **not approval satisfaction, approver authorization, AgentRun resume or tool execution authority**.

## Authorized DD-183 boundary

Implement:

`matchesAIAgentStepApprovalBacklinkFloors(step, approval?)`.

It must:

1. require valid AgentStep id and run id UUIDs;
2. when `step.approvalId` is absent:
   - require `approval === undefined`;
   - return true after step identity validation;
3. when `step.approvalId` is present:
   - require valid approval id UUID;
   - require AgentApproval evidence;
   - require valid approval `id`, `runId`, `stepId`;
   - require exact `approval.id === step.approvalId`;
   - require exact `approval.runId === step.runId`;
   - require exact `approval.stepId === step.id`;
4. fail closed for malformed evidence or unexpected approval evidence on an unbound step;
5. leave all inputs unchanged.

## Acceptance target

- **AISTEP-APP-CUR-001** — valid step without approval id and no approval evidence -> true.
- **AISTEP-APP-CUR-002** — exact approval id + same run + same step -> true.
- **AISTEP-APP-CUR-003** — wrong approval id -> false.
- **AISTEP-APP-CUR-004** — approval same id but wrong run or wrong step backlink -> false.
- **AISTEP-APP-CUR-005** — unexpected approval evidence for unbound step -> false.
- **AISTEP-APP-CUR-006** — malformed step/approval identifiers -> false.
- **AISTEP-APP-CUR-007** — step type/tool/status/timestamps/audit and approval Tenant/Industry/requestedBy/type/permission/approver/status/summary/time/reason/correlation evidence remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 521 to 528. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-183 does **not**:

- decide whether approval is APPROVED/current/satisfied;
- validate AgentApproval Tenant/Industry against AgentRun;
- validate approver principal or current permission/context;
- validate requiredPermission satisfaction;
- resume/cancel AgentRun;
- authorize ToolSetMember/ToolDefinition or OperationContract execution;
- interpret approval summary/reason;
- mutate AgentStep/AgentApproval;
- call providers/models/tools or perform inference/RAG/media;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification, Workflow, Automation or AI runtime execution boundaries.

## Next dependency boundary

After DD-183, the optional persisted AgentStep approval backlink is re-evaluable. AgentApproval own run/step/scope relationship and current approval satisfaction remain separate prerequisites.
