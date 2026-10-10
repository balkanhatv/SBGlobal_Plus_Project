# AI AgentDefinition ToolSet current-binding floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AI-ASSISTANT-DEFINITION-RELATIONSHIP-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `63d8a2ea68f950fe2ad67c63f0d3a979615d3990`  
**Scope:** next independent source-complete AI relationship prerequisite after DD-179.

## Source reconciliation

Migration 0031 `validate_ai_relationships()`, migration 0048 fail-closed definition containment, DD-111 ToolSet raw reader, DD-118 AgentDefinition raw reader and current DD-179 state were reconciled.

For `agent_definition`, migration 0031 owns one exact deterministic relationship predicate:

- `allowed_tool_set_id` must reference an existing ToolSet;
- referenced ToolSet raw status must be exactly `ACTIVE`;
- ToolSet owner scope must contain the AgentDefinition owner scope through `definition_contains_definition(...)`.

AgentDefinition persists no ToolSet version/effective-date reference for this binding. Migration 0031 therefore does not compare those fields.

AgentDefinition `objective_class`, `max_risk_class`, `approval_policy_id`, `budget_policy_id`, version/status and timestamps are independent evidence and are not part of this relationship predicate.

## Determination

One pure **AIAgentDefinition→AIToolSet current-binding necessary floor** is source-complete:

> Given one already-loaded AgentDefinition and one already-loaded ToolSet, determine only whether migration-0031's exact id/ACTIVE/broader-or-equal containment relationship still matches.

A true result is **not Agent selection, risk/approval/budget policy authorization, effective ToolSet resolution or Agent/tool execution authority**.

## Authorized DD-180 boundary

Implement:

`matchesAIAgentDefinitionToolSetBindingFloors(agent, toolSet)`.

It must:

1. require valid AgentDefinition id and exact valid PLATFORM/TENANT/INDUSTRY owner shape;
2. require valid persisted `agent.allowedToolSetId`;
3. require valid ToolSet id and exact `toolSet.id === agent.allowedToolSetId`;
4. require raw `toolSet.status === 'ACTIVE'`;
5. require valid ToolSet owner shape and broader-or-equal containment of AgentDefinition scope under DD-170;
6. leave all inputs unchanged.

No AgentDefinition objective/risk/approval/budget/version/status/timestamp field or ToolSet code/version/timestamp field may affect the result.

## Acceptance target

- **AIAGENT-TOOLSET-CUR-001** — ACTIVE PLATFORM ToolSet contains valid PLATFORM/TENANT/INDUSTRY AgentDefinitions as hierarchy permits -> true.
- **AIAGENT-TOOLSET-CUR-002** — ACTIVE same-Tenant TENANT ToolSet contains TENANT and same-Tenant INDUSTRY AgentDefinitions; foreign Tenant/PLATFORM child -> false.
- **AIAGENT-TOOLSET-CUR-003** — ACTIVE INDUSTRY ToolSet contains only exact same-Tenant Industry AgentDefinition -> true; sibling/Tenant/Platform child -> false.
- **AIAGENT-TOOLSET-CUR-004** — wrong ToolSet id -> false.
- **AIAGENT-TOOLSET-CUR-005** — DRAFT/REVIEW/PUBLISHED/RETIRED ToolSet -> false.
- **AIAGENT-TOOLSET-CUR-006** — malformed AgentDefinition/ToolSet identity or owner shape -> false.
- **AIAGENT-TOOLSET-CUR-007** — objective/risk/approval/budget/version/status/timestamps plus ToolSet code/version remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 500 to 507. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-180 does **not**:

- select current/latest AgentDefinition;
- compare ToolSet versions/effective dates;
- resolve effective ToolSet members;
- interpret objective/risk classes;
- resolve approval/budget policy;
- authorize AgentRun creation or AgentStep execution;
- validate acting principal/membership;
- authorize tool permissions, entitlements or approvals;
- execute OperationContracts, tools, agents, providers or models;
- perform inference/RAG/embeddings/media;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification, Workflow or Automation execution boundaries.

## Next dependency boundary

After DD-180, AgentDefinition ToolSet currentness is re-evaluable. AgentRun→AgentDefinition scope/currentness and acting-principal/membership predicates remain independently governed.
