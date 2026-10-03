# AI AgentApproval raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23
**Baseline checkpoint:** `DEV-AI-AGENT-STEP-READ-001`
**Baseline branch head:** `a93ec4e72800a00675e613864a39eb37dcb6a99a`

## Source ownership

Freshly reconciled sources:
- `database/migrations/0013_ai_agents_tools.sql`
- `database/migrations/0014_ai_gateway_role.sql`
- `database/migrations/0031_document_workflow_ai_integrity.sql`
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`
- existing AI Gateway + RequestScopedSql boundaries
- DD-130 AgentRun and DD-131 AgentStep read evidence.

The next independent source-complete slice is one exact `core_ai.agent_approval` row.

Migration 0013 owns: id, run_id, step_id, tenant_id, optional industry_context_id, requested_by_agent, approval_type, required_permission, optional approver_principal_id, status `PENDING | APPROVED | REJECTED | EXPIRED`, request_summary_safe, optional approved_at, optional reason, correlation_id and created_at.

The schema requires an APPROVED row to carry both approver_principal_id and approved_at. It does not require non-empty text fields and does not impose approved_at/created_at ordering.

FORCE-RLS is Tenant/Industry scoped. Tenant must match current Tenant. Industry rows require exact current Industry Context. A Tenant-Core approval with null industry_context_id is same-Tenant visible from Tenant Core and Tenant Industry contexts. SELECT visibility is not bound to AgentRun acting_principal_id.

Migration 0031 requires the referenced step to belong to the same run, the approval Tenant/Industry to match the run, and a non-null approver principal to be active for that Tenant at the persisted approval/create time.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on agent_approval. DD-132 does not change or relabel this database authority. The new port itself is read-only.

DD-09 states that a tool cannot execute while required approval is not APPROVED, and that approval itself must be revalidated for approver permission/context. Therefore persisted APPROVED status is evidence only; it is not current approval satisfaction, AgentRun resume authority, or tool-execution authority.

## Authorized reader boundary

DD-132 may implement only exact-by-id immutable AgentApproval persistence read through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:
- id
- runId
- stepId
- tenantId
- optional industryContextId
- requestedByAgent
- approvalType
- requiredPermission
- optional approverPrincipalId
- constrained raw status
- requestSummarySafe
- optional approvedAt
- optional reason
- correlationId
- createdAt

Validation is schema-aligned only: UUID fields, strict boolean, four-value status, APPROVED approver+approvedAt shape, valid timestamps, and raw text preservation including empty strings.

## Explicitly unclaimed

DD-132 does not implement approval satisfaction, approver permission/context revalidation, current permission checks, next-step selection, AgentRun resume, tool eligibility, ToolSet/ToolDefinition execution checks, OperationContract execution, side-effect/risk policy evaluation, Workflow approval task behavior, Agent planning/execution, provider/model runtime, inference, RAG, public routes, or database-policy changes.

## Acceptance expectations

1. exact Industry approval returns immutable raw evidence;
2. sibling Industry approval is hidden while exact sibling context can read it;
3. Tenant-Core approval is same-Tenant visible from Core and Industry contexts and preserves raw nullable/empty evidence;
4. another principal in the same Tenant/Industry can read approval evidence because RLS is scope-only, without gaining approver authority;
5. foreign Tenant and PLATFORM_GLOBAL contexts cannot expose it;
6. missing id returns null; malformed id and route mismatch fail closed;
7. APPROVED/status/permission/approver evidence never becomes approval-satisfied/resume/execute authority and the read port exposes no mutation/revalidate/resume/execute methods.

Acceptance IDs: `AIAGENTAPP-PG-001` through `AIAGENTAPP-PG-007`.

Exact implementation-head Core, PostgreSQL, Database and Web CI must pass before DD-132 canonicalization or state promotion.
