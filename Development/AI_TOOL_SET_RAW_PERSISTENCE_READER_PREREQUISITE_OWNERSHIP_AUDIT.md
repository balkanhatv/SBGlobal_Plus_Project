# AI ToolSet raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-TOOL-DEFINITION-CATALOG-READ-001`  
**Baseline branch head:** `a1387ecedcc1463316f606fff98b2ea2aecc4c3a`  
**Scope:** next independent governed continuation after DD-110.

## Source reconciliation

The physical ToolSet schema, AI Gateway database role, platform-definition write boundary, AI architecture/design, RequestScopedSql boundary and DD-110 evidence were freshly reconciled.

Relevant source owners:

- `database/migrations/0031_document_workflow_ai_integrity.sql`
- `database/migrations/0032_platform_definition_write_boundary.sql`
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`
- `src/server/database/postgres-ai-gateway-database.ts`
- `src/server/database/request-scoped-sql.ts`
- DD-110 AI Tool Definition catalog metadata reader evidence

## Candidate determination

The next independently source-complete persistence slice is the parent `core_ai.ai_tool_set` row.

Migration 0031 owns exactly these ToolSet facts:

- `id uuid PRIMARY KEY`;
- `owner_scope` constrained by `core_config.owner_scope`;
- nullable `tenant_id` and `industry_context_id` with PLATFORM/TENANT/INDUSTRY ownership-shape checks;
- non-null raw `code` text;
- positive non-null `version`;
- non-null `status` constrained to `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`;
- non-null `created_at` and `updated_at` timestamps;
- unique scoped code/version and at most one ACTIVE row per scoped code.

The table is FORCE-RLS with `core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id)`. Tenant rows are same-Tenant visible, Industry rows require exact Industry Context, and PLATFORM rows require a trusted PLATFORM_GLOBAL context. There is no implicit Tenant fallback to a PLATFORM row.

Migration 0031 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on ToolSet persistence for Tenant/Industry authoring. Migration 0032 adds a restrictive platform-definition write floor, so PLATFORM ToolSet mutation requires `sbg_control_plane_rw`. DD-111 must not mischaracterize the AI Gateway database role as globally read-only.

Migration 0031 also uses ToolSets in persisted AssistantDefinition / AgentDefinition / AgentStep relationship-integrity checks. DD-09 states that ToolSets physically own tool bindings and that runtime tool execution separately requires current context, schema, permission, entitlement, approval, OperationContract and audit checks. Persisted ToolSet evidence therefore does not itself select or execute tools.

## Authorized implementation boundary

DD-111 may implement only a bounded exact-by-id ToolSet raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary.

Authorized returned evidence:

- `id`;
- constrained raw `ownerScope`;
- optional `tenantId`;
- optional `industryContextId`;
- raw `code`;
- positive `version`;
- constrained raw `status`;
- `createdAt` and `updatedAt` timestamps.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- owner-scope validation only against PLATFORM/TENANT/INDUSTRY;
- ownership-shape validation matching the database CHECK;
- status validation only against the exact database-owned values;
- code remains raw text without inventing a non-empty constraint;
- version is a positive safe integer;
- timestamps are valid persisted values represented as immutable ISO evidence;
- no created/updated ordering is invented because the schema does not impose one.

## Explicitly unclaimed semantics

This slice does **not** authorize or implement:

- ACTIVE/current/latest ToolSet selection;
- code/version fallback or inheritance;
- ToolSet member loading, filtering, constraint interpretation or effective-set calculation;
- tool eligibility, permission, entitlement, approval or side-effect enforcement;
- AssistantDefinition or AgentDefinition selection/binding;
- AgentStep validation/execution;
- Tool Definition execution or OperationContract dispatch;
- Tenant/Industry AI config or provisioning resolution;
- provider/model/prompt/policy/routing selection;
- credential resolution, provider SDK calls, inference, RAG or agent execution;
- ToolSet mutation APIs through the new read port;
- public/API route creation;
- migration, schema, verification SQL, role, grant, RLS or product-policy changes.

The existing schema-owned Tenant/Industry ToolSet DML authority of `sbg_ai_gateway_rw` remains unchanged and is not surfaced by the DD-111 read port. PLATFORM writes remain protected by the migration-0032 control-plane floor.

## Acceptance expectations

1. exact Industry ToolSet read returns complete immutable raw metadata;
2. sibling Industry ToolSet is hidden by FORCE-RLS and exact sibling context may read it;
3. Tenant ToolSet remains same-Tenant visible from Tenant Core and Tenant Industry contexts while raw/schema-valid values remain unstrengthened;
4. PLATFORM ToolSet is not an implicit Tenant fallback and requires trusted PLATFORM_GLOBAL context;
5. foreign-Tenant ToolSet is hidden while owning Tenant context may read it;
6. malformed id or database route/context mismatch fails closed;
7. the read port exposes no mutation/selection/execution method, existing AI Gateway DML privilege remains schema-owned, and PLATFORM ToolSet mutation remains denied to the AI Gateway role.

Acceptance IDs: `AITOOLSET-PG-001` through `AITOOLSET-PG-007`.

Exact implementation-head Core, PostgreSQL/RLS, Database Verify and Web Boundary CI must pass before canonical DD/acceptance traceability or state promotion.
