# AI AgentRun AgentDefinition current-binding floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AI-AGENT-DEFINITION-TOOL-SET-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `6884217293a7dde18ad9274129fbe72cebc50194`  
**Scope:** next independent source-complete AI relationship prerequisite after DD-180.

## Source reconciliation

Migration 0031 `validate_ai_relationships()`, migration 0048 fail-closed definition applicability, DD-118 AgentDefinition raw reader, DD-130 AgentRun raw reader, DD-09 Agent runtime contract and current DD-180 state were reconciled.

For `agent_run`, migration 0031 owns one deterministic AgentDefinition relationship predicate:

- `agent_definition_id` must reference an existing AgentDefinition;
- referenced AgentDefinition raw status must be exactly `ACTIVE`;
- AgentDefinition owner scope must apply to the run Tenant/optional Industry scope through `definition_applies_to_scope(...)`.

The same trigger separately validates acting-principal currentness at `started_at`, and optional `membership_id` separately against Tenant/principal/status/validity. Those identity predicates are not part of this definition relationship floor.

AgentRun persists no AgentDefinition version. Migration 0031 therefore does not compare definition version/effective dates for this relationship.

DD-09 additionally states that acting-principal authorization is rebuilt/current at each tool step; startup permission/entitlement snapshots are not permanent execution authority.

## Determination

One pure **AIAgentRun→AIAgentDefinition current-binding necessary floor** is source-complete:

> Given one already-loaded AgentRun and one already-loaded AgentDefinition, determine only whether migration-0031's exact definition id/ACTIVE/scope relationship still matches.

A true result is **not principal/membership authorization, AgentRun resumability, budget/resource authorization, AgentStep or tool execution authority**.

## Authorized DD-181 boundary

Implement:

`matchesAIAgentRunDefinitionBindingFloors(run, definition)`.

It must:

1. require valid AgentRun id, Tenant id and `agentDefinitionId` UUIDs;
2. require run Industry Context, when present, to be a valid UUID;
3. require valid AgentDefinition id and exact `definition.id === run.agentDefinitionId`;
4. require raw `definition.status === 'ACTIVE'`;
5. require valid AgentDefinition owner shape and canonical applicability:
   - PLATFORM => no Tenant/Industry owner; applies to Tenant-Core or Tenant-Industry run;
   - TENANT => valid same Tenant, no owner Industry; applies within that Tenant;
   - INDUSTRY => valid same Tenant + exact valid Industry Context; applies only to exact Industry run;
6. leave all inputs unchanged.

No AgentDefinition code/objective/ToolSet/risk/approval/budget/version/timestamps field, and no AgentRun acting-principal/membership/snapshot/resource/status/budget/time/correlation field, may affect the result beyond the relationship evidence explicitly listed above.

## Acceptance target

- **AIARUN-DEF-CUR-001** — exact ACTIVE PLATFORM definition applies to Tenant-Core and Tenant-Industry runs -> true.
- **AIARUN-DEF-CUR-002** — exact ACTIVE same-Tenant TENANT definition applies to Core/Industry; foreign Tenant -> false.
- **AIARUN-DEF-CUR-003** — exact ACTIVE INDUSTRY definition applies only to exact same-Tenant Industry; sibling/Tenant-Core -> false.
- **AIARUN-DEF-CUR-004** — wrong definition id -> false.
- **AIARUN-DEF-CUR-005** — non-ACTIVE definition status -> false.
- **AIARUN-DEF-CUR-006** — malformed run/definition identity or owner shape -> false.
- **AIARUN-DEF-CUR-007** — acting principal/membership/snapshots/resource scope/run status/budgets/timestamps/correlation and definition policy/version/ToolSet evidence remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 507 to 514. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-181 does **not**:

- validate acting-principal currentness;
- validate optional TenantMembership currentness;
- evaluate permission/entitlement snapshots;
- interpret requested resource scope as authorization;
- select current/latest AgentDefinition by code/version/effective date;
- compose DD-180 ToolSet currentness automatically;
- interpret AgentRun lifecycle/resume/cancel status;
- enforce step/token budgets;
- create/plan/execute AgentSteps;
- resolve AgentApprovals;
- authorize ToolSet members or tool permissions/entitlements/approvals;
- execute OperationContracts/tools/providers/models;
- perform inference/RAG/embeddings/media;
- mutate AgentRun;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification, Workflow or Automation execution boundaries.

## Next dependency boundary

After DD-181, AgentRun definition currentness is re-evaluable. Acting-principal and optional membership currentness remain independently governed; AgentStep/tool execution remains blocked unless separately source-owned.
