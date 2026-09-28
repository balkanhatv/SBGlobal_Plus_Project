# AI AgentStep raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-AGENT-RUN-READ-001`  
**Baseline branch head:** `4776459838cc6add9540f0d1da1e0c9127096e25`  
**Scope:** next independent governed continuation after DD-130.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0013_ai_agents_tools.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-130 AgentRun reader evidence.

## Candidate determination

The next independently source-complete child persistence slice is one exact `core_ai.agent_step` row.

Migration 0013 owns:

- `id uuid PRIMARY KEY`;
- `run_id uuid NOT NULL`;
- non-negative `ordinal integer`;
- `step_type PLAN | RAG | TOOL | APPROVAL | INFERENCE`;
- optional raw `input_ref`;
- optional raw `output_ref`;
- optional `tool_binding_id`;
- optional `approval_id`;
- status `PENDING | RUNNING | SUCCEEDED | FAILED | SKIPPED | CANCELLED`;
- `started_at`;
- optional `completed_at`, not earlier than start;
- optional `audit_ref`;
- uniqueness of `(run_id, ordinal)`.

AgentStep is FORCE-RLS with parent-derived visibility. A step is visible only when its parent AgentRun is visible, which inherits the AgentRun Tenant + acting-principal + optional exact-Industry boundary.

Migration 0031 enforces at step write time:

- parent run must exist;
- TOOL steps require a present enabled ToolSetMember whose ToolDefinition is ACTIVE and belongs to the AgentDefinition's allowed ToolSet;
- non-TOOL steps cannot carry a tool binding;
- optional approval reference must point back to the same step/run.

Those historical write-time checks do not prove that tool membership, ToolDefinition activity, current AccessDecision, entitlement, approval permission or AgentRun state remains valid later.

DD-09 states that every tool step must rebuild/verify current RequestContext and current DD-03/DD-04 authorization before OperationContract execution. Raw AgentStep persistence therefore is evidence only.

## Authorized implementation boundary

DD-131 may implement only an exact-by-id immutable AgentStep persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `runId`;
- non-negative integer `ordinal`;
- constrained raw `stepType`;
- optional raw `inputRef`;
- optional raw `outputRef`;
- optional `toolBindingId`;
- optional `approvalId`;
- constrained raw `status`;
- `startedAt`;
- optional `completedAt`;
- optional `auditRef`.

Validation stays schema-aligned only. No current/effective/executable meaning is inferred.

## Explicitly unclaimed semantics

DD-131 does **not** implement or authorize:

- listing/planning AgentSteps;
- selecting current/next step;
- AgentStep status transitions;
- interpreting refs as payloads/results;
- resolving current ToolSet/member/ToolDefinition eligibility;
- current RequestContext, permission, entitlement, approval or resource checks;
- approval satisfaction;
- OperationContract execution;
- retry/resume/cancel behavior;
- AgentRun continuation;
- provider/model/prompt/RAG routing or inference;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing AI Gateway AgentStep DML authority remains schema-owned; the DD-131 application port is read-only.

## Acceptance expectations

1. exact visible step returns complete immutable raw evidence;
2. sibling Industry cannot expose a step under an Industry AgentRun;
3. another principal in the same Tenant/Industry cannot read the step;
4. Tenant-Core run step is same-principal/same-Tenant visible from Core and Industry contexts without continuation authority;
5. foreign Tenant and PLATFORM_GLOBAL contexts cannot expose the step;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw step type/status/tool-binding/approval/audit evidence does not become current eligibility/approval/execution authority, and the port exposes no mutation/list/next/execute method.

Acceptance IDs: `AIAGENTSTEP-PG-001` through `AIAGENTSTEP-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-131 traceability or state promotion.
