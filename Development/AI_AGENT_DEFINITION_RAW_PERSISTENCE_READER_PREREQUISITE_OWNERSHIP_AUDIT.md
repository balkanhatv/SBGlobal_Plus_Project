# AI AgentDefinition raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-ASSISTANT-DEFINITION-READ-001`  
**Baseline branch head:** `588f8b8d2dce4623227b20eac065c5f9a853fb63`  
**Scope:** next independent governed continuation after DD-117.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0013_ai_agents_tools.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `database/migrations/0032_platform_definition_write_boundary.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-111 ToolSet and DD-117 AssistantDefinition reader evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.agent_definition` row.

Migration 0013 physically owns:

- `id uuid PRIMARY KEY`;
- `owner_scope` constrained by `core_config.owner_scope`;
- nullable `tenant_id` and `industry_context_id` with exact PLATFORM/TENANT/INDUSTRY ownership shape;
- non-null raw `code` text;
- non-null raw `objective_class` text;
- non-null `allowed_tool_set_id`;
- non-null raw `max_risk_class` text;
- non-null `approval_policy_id`;
- non-null `budget_policy_id`;
- positive non-null `version`;
- non-null raw `status` text;
- non-null `created_at` / `updated_at`;
- unique scoped code/version.

Migration 0031 adds the ToolSet foreign key and one-ACTIVE-version-per-scoped-code index.

At AgentDefinition insert/update time, migration 0031 requires `allowed_tool_set_id` to reference an ACTIVE ToolSet at the same or broader applicable definition scope. That is write-time relationship integrity only. A persisted AgentDefinition row does not prove that its ToolSet remains ACTIVE later, that the AgentDefinition is currently selected, or that a run/step/request is authorized to execute it.

`objective_class`, `max_risk_class`, `approval_policy_id`, `budget_policy_id`, and raw `status` are persisted fields without reader-owned runtime interpretation in migrations 0013/0031. DD-118 must preserve them as evidence only.

Migration 0014 gives `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on AgentDefinition persistence for governed Tenant/Industry authoring. Migration 0032 protects PLATFORM definition mutation behind `sbg_control_plane_rw`.

DD-09 explicitly separates AgentDefinition from AgentRun/AgentStep/AgentApproval runtime. Acting-principal authorization is rebuilt/current at tool steps; startup snapshots are not permanent authorization. Tool execution separately requires tool-set membership, schema, RequestContext, permission, entitlement, approval, OperationContract execution and audit.

## Authorized implementation boundary

DD-118 may implement only an exact-by-id immutable AgentDefinition persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- constrained raw `ownerScope`;
- optional `tenantId`;
- optional `industryContextId`;
- raw `code`;
- raw `objectiveClass`;
- `allowedToolSetId`;
- raw `maxRiskClass`;
- `approvalPolicyId`;
- `budgetPolicyId`;
- positive `version`;
- raw `status`;
- `createdAt`;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID validation for persisted identifiers;
- owner scope exactly PLATFORM/TENANT/INDUSTRY with exact ownership-shape validation;
- version is a positive safe integer;
- code/objective/risk/status remain raw text without invented non-empty/enumeration constraints;
- timestamps must be valid persisted values;
- no current ToolSet activity, agent selectability, approval satisfaction, budget sufficiency or execution authority is inferred.

## Explicitly unclaimed semantics

DD-118 does **not** implement or authorize:

- ACTIVE/current/latest AgentDefinition selection;
- code/version fallback or inheritance;
- current ToolSet activity/applicability revalidation;
- effective ToolSet-member resolution;
- objective-class interpretation or planning policy;
- risk-class interpretation;
- approval-policy resolution or approval satisfaction;
- budget-policy resolution or budget enforcement;
- AgentRun creation/selection;
- AgentStep planning/validation/execution;
- AgentApproval creation/evaluation;
- acting-principal permission/entitlement evaluation;
- Tool Definition / OperationContract execution;
- Assistant selection or binding;
- provider/model/prompt/policy/routing selection;
- credentials, inference, embeddings or RAG;
- AgentDefinition mutation through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing Tenant/Industry AgentDefinition DML remains schema-owned; PLATFORM writes remain protected by migration 0032.

## Acceptance expectations

1. exact Industry AgentDefinition returns complete immutable raw evidence;
2. sibling Industry AgentDefinition is hidden while exact sibling context may read it;
3. Tenant AgentDefinition is same-Tenant visible from Tenant Core and Tenant Industry contexts, preserving schema-valid raw text fields;
4. PLATFORM AgentDefinition is not Tenant fallback and requires trusted PLATFORM_GLOBAL;
5. foreign-Tenant AgentDefinition is hidden;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. persisted ToolSet/objective/risk/approval/budget/status evidence does not become current selection/authorization/approval/budget/tool-execution authority, the port exposes no mutation/select/plan/approve/execute method, and PLATFORM mutation remains protected.

Acceptance IDs: `AIAGENTDEF-PG-001` through `AIAGENTDEF-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-118 traceability or state promotion.
