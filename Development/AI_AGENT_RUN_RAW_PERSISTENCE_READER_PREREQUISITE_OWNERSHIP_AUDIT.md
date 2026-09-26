# AI AgentRun raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-MEMORY-RECORD-READ-001`  
**Baseline branch head:** `02d623a2a503766841a90f8d7eb2e6f41aabd677`  
**Scope:** next independent governed continuation after DD-129.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0013_ai_agents_tools.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-118 AgentDefinition reader evidence.

## Candidate determination

The next independently source-complete parent persistence slice is one exact `core_ai.agent_run` row.

Migration 0013 physically owns:

- `id uuid PRIMARY KEY`;
- `agent_definition_id uuid NOT NULL`;
- `tenant_id uuid NOT NULL`;
- optional `industry_context_id`;
- `acting_principal_id uuid NOT NULL`;
- optional `membership_id`;
- `entitlement_snapshot_version bigint NOT NULL`;
- `permission_version bigint NOT NULL`;
- raw `requested_resource_scope_json jsonb NOT NULL`;
- constrained status `PENDING | RUNNING | WAITING_APPROVAL | SUCCEEDED | FAILED | CANCELLED`;
- raw `step_budget_class`;
- raw `token_budget_class`;
- `started_at`;
- optional `completed_at`, constrained to be no earlier than `started_at`;
- `correlation_id uuid NOT NULL`.

AgentRun FORCE-RLS requires exact Tenant + acting principal, plus exact Industry Context when the row is Industry-scoped. A Tenant-Core row with null Industry Context is same-principal/same-Tenant visible from Tenant Core or Tenant Industry contexts because the policy allows null Industry Context.

Migration 0014 grants `sbg_ai_gateway_rw` AgentRun SELECT/INSERT/UPDATE/DELETE.

Migration 0031 adds write-time integrity:

- referenced AgentDefinition must then be ACTIVE and applicable to the run Tenant/Industry scope;
- acting principal must then be active for the Tenant at `started_at`;
- optional membership must then be ACTIVE, belong to the same Tenant/principal and be valid at `started_at`.

Those historical write-time facts do not prove that the AgentDefinition, principal, membership, permission snapshot, entitlement snapshot or resource authorization remains current later.

DD-09 explicitly states that agent permissions are bounded by the acting principal's **current AccessDecision at each tool step** and that startup permission snapshot is not permanent authorization. Therefore persisted AgentRun versions/status/budget/resource-scope evidence cannot authorize resume, step execution or tool execution.

## Authorized implementation boundary

DD-130 may implement only an exact-by-id immutable AgentRun persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `agentDefinitionId`;
- `tenantId`;
- optional `industryContextId`;
- `actingPrincipalId`;
- optional `membershipId`;
- exact bigint-text `entitlementSnapshotVersion`;
- exact bigint-text `permissionVersion`;
- normalized immutable `requestedResourceScope` JSON;
- constrained raw `status`;
- raw `stepBudgetClass`;
- raw `tokenBudgetClass`;
- `startedAt`;
- optional `completedAt`;
- `correlationId`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- bigint values remain canonical decimal strings rather than JavaScript numbers;
- status validation only against the database enum;
- JSON is normalized/frozen without resource-scope interpretation;
- budget-class text remains raw text, including schema-valid empty values;
- timestamp validity and persisted completion ordering are checked;
- no current authorization or lifecycle transition semantics are invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- listing AgentRuns or selecting latest/current runs;
- interpreting status as resumable/executable authority;
- AgentRun status transitions, cancellation or resume;
- loading/planning/executing AgentSteps;
- loading or satisfying AgentApprovals;
- current AgentDefinition selection/revalidation;
- current principal/membership/permission/entitlement revalidation;
- interpreting requested resource scope as authorization;
- step/token budget evaluation or consumption;
- ToolSet/member resolution;
- tool permission/entitlement/approval checks;
- OperationContract execution;
- provider/model/prompt/RAG routing or inference;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing AI Gateway AgentRun DML authority remains schema-owned; the DD-130 application port is read-only.

## Acceptance expectations

1. exact principal-owned Industry AgentRun returns complete immutable raw evidence;
2. sibling Industry context cannot expose an Industry AgentRun;
3. another principal in the same Tenant/Industry cannot read the principal-owned run;
4. Tenant-Core AgentRun is same-principal/same-Tenant visible from Core and Industry contexts without becoming automatic cross-context continuation;
5. foreign Tenant and PLATFORM_GLOBAL contexts cannot expose the run;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. startup versions/status/resource-scope/budget evidence does not become current authorization/resume/step/tool execution authority, and the port exposes no mutation/list/steps/approvals/resume/execute method.

Acceptance IDs: `AIAGENTRUN-PG-001` through `AIAGENTRUN-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-130 traceability or state promotion.
