# AI AgentStep tool-binding current floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AI-AGENT-RUN-DEFINITION-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `7e1bc7ea49750fd211d42c10107d82a27edadb26`  
**Scope:** next independent source-complete AI relationship prerequisite after DD-181.

## Source reconciliation

Migration 0031 `validate_agent_step_approval()`, DD-131 AgentStep raw reader, DD-130 AgentRun raw reader, DD-118 AgentDefinition raw reader, DD-113 ToolSetMember raw reader, DD-110 ToolDefinition catalog reader and DD-09 Agent runtime contract were reconciled.

For every AgentStep, migration 0031 first resolves the referenced AgentRun and its referenced AgentDefinition. For a `TOOL` step, it then owns one exact deterministic tool-binding predicate:

- `tool_binding_id` must be present and reference an existing ToolSetMember;
- ToolSetMember raw `enabled` must be true;
- the member's referenced ToolDefinition must exist and raw status must be exactly `ACTIVE`;
- the member's `tool_set_id` must exactly equal the AgentDefinition persisted `allowed_tool_set_id`.

For a non-TOOL step, persisted `tool_binding_id` must be absent.

The trigger separately validates optional `approval_id` backlink to the same step/run. That approval relationship is not part of this floor.

The migration does not require the AgentDefinition itself to remain ACTIVE for the tool-binding predicate, does not require the allowed ToolSet itself to remain ACTIVE, and does not interpret ToolSetMember constraint JSON or ToolDefinition permission/entitlement/approval/OperationContract metadata. Those are separate current/runtime concerns.

## Determination

One pure **AIAgentStep tool-binding necessary floor** is source-complete:

> Given one already-loaded AgentStep, its AgentRun, the run's AgentDefinition, and when the step is TOOL the referenced ToolSetMember plus ToolDefinition, determine only whether migration-0031's persisted TOOL/non-TOOL binding relationship still matches.

A true result is **not current AgentDefinition/ToolSet selection, acting-principal authorization, permission/entitlement/approval satisfaction or tool execution authority**.

## Authorized DD-182 boundary

Implement:

`matchesAIAgentStepToolBindingFloors(step, run, definition, member?, toolDefinition?)`.

It must:

1. require valid step id and `runId`;
2. require valid run id and `agentDefinitionId`, exact `run.id === step.runId`;
3. require valid AgentDefinition id and exact `definition.id === run.agentDefinitionId`;
4. for non-TOOL step types PLAN/RAG/APPROVAL/INFERENCE:
   - require persisted `step.toolBindingId` absent;
   - require no ToolSetMember/ToolDefinition evidence;
   - return true after the parent chain validation;
5. for TOOL:
   - require valid persisted `toolBindingId`;
   - require ToolSetMember and ToolDefinition evidence;
   - require exact `member.id === step.toolBindingId`;
   - require valid `member.toolSetId` and `member.toolDefinitionId`;
   - require `member.enabled === true`;
   - require valid `toolDefinition.id` and exact `toolDefinition.id === member.toolDefinitionId`;
   - require raw `toolDefinition.status === 'ACTIVE'`;
   - require valid `definition.allowedToolSetId` and exact `member.toolSetId === definition.allowedToolSetId`;
6. fail closed for an unsupported step type or malformed binding evidence;
7. leave all inputs unchanged.

The helper must not automatically compose DD-180 ToolSet currentness or DD-181 AgentRun definition currentness beyond the exact parent-id chain needed by migration 0031.

## Acceptance target

- **AISTEP-TOOL-CUR-001** — exact TOOL step/run/definition/enabled-member/ACTIVE-tool chain in allowed ToolSet -> true.
- **AISTEP-TOOL-CUR-002** — wrong run or AgentDefinition parent id -> false.
- **AISTEP-TOOL-CUR-003** — wrong/missing ToolSetMember or wrong ToolDefinition id -> false.
- **AISTEP-TOOL-CUR-004** — disabled member, non-ACTIVE ToolDefinition, or member outside AgentDefinition allowed ToolSet -> false.
- **AISTEP-TOOL-CUR-005** — valid non-TOOL step with no persisted binding/evidence -> true; any persisted binding -> false.
- **AISTEP-TOOL-CUR-006** — malformed identifiers or unsupported step type -> false.
- **AISTEP-TOOL-CUR-007** — step approval/status/refs/timestamps/audit, run principal/membership/snapshot/resource/lifecycle/budgets, definition policy/status/version and member constraint/tool permission/entitlement/approval/OperationContract metadata remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 514 to 521. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-182 does **not**:

- revalidate DD-180 allowed ToolSet ACTIVE/currentness;
- revalidate DD-181 AgentDefinition ACTIVE/scope currentness;
- resolve effective ToolSet membership beyond the exact persisted member;
- interpret ToolSetMember constraint JSON;
- validate acting principal, membership, permission, entitlement or resource scope;
- evaluate optional AgentApproval or approval satisfaction;
- interpret side-effect/risk/idempotency/audit classes;
- validate tool input/output schemas;
- resolve or execute OperationContracts;
- mutate AgentStep/AgentRun;
- select next step or retry/resume/cancel;
- call providers/models/tools or perform inference/RAG/media;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification, Workflow or Automation execution boundaries.

## Next dependency boundary

After DD-182, the persisted AgentStep TOOL binding is re-evaluable. Optional AgentStep→AgentApproval backlink currentness may be audited independently; approval satisfaction and tool execution remain blocked.
