# AI ToolSetMember raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-PROMPT-SET-READ-001`  
**Baseline branch head:** `12f09943a7b55fabbd87d511743769d47ed73308`  
**Scope:** next independent governed continuation after DD-112.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `database/migrations/0032_platform_definition_write_boundary.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-110 Tool Definition metadata and DD-111 ToolSet parent-reader evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.ai_tool_set_member` row.

Migration 0031 physically owns:

- `id uuid PRIMARY KEY`;
- `tool_set_id uuid NOT NULL` referencing `core_ai.ai_tool_set(id)`;
- `tool_definition_id uuid NOT NULL` referencing `core_ai.ai_tool_definition(id)`;
- `enabled boolean NOT NULL DEFAULT true`;
- `constraint_json jsonb NOT NULL DEFAULT '{}'`;
- `created_at timestamptz NOT NULL`;
- uniqueness of `(tool_set_id,tool_definition_id)`.

The child table is FORCE-RLS. SELECT visibility is parent-derived: a member is visible only when its parent ToolSet is visible in the current PLATFORM/TENANT/INDUSTRY context.

Migration 0031 write integrity requires a referenced Tool Definition to be ACTIVE at member insert/update time. The persisted member row does not itself prove that the Tool Definition remains ACTIVE later, that the parent ToolSet is ACTIVE/current, or that the member is effective at request time.

Migration 0031 grants the AI Gateway role ToolSet-member DML and then narrows member writes through `definition_member_write_allowed('TOOL_SET', ...)`; migration 0032 additionally prevents child writes beneath protected PLATFORM parents unless current_user is `sbg_control_plane_rw`.

DD-09 describes ToolSetMember as the concrete tool binding used by AgentStep, but runtime tool execution separately requires effective ToolSet validation, schema validation, fresh RequestContext, DD-03 permission, DD-04 entitlement/limits, approval, OperationContract execution and audit/usage. Raw member persistence therefore is evidence only.

## Authorized implementation boundary

DD-113 may implement only an exact-by-id immutable ToolSetMember persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `toolSetId`;
- `toolDefinitionId`;
- raw `enabled`;
- normalized immutable JSON value from `constraint_json`;
- `createdAt`.

Validation remains schema-aligned only:

- UUID validation for all identifiers;
- strict boolean validation for `enabled`;
- JSON must remain valid JSON evidence and be normalized/frozen without interpreting constraint semantics;
- timestamp must be a valid persisted value;
- no ACTIVE/current/effective meaning is inferred.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- listing or resolving all members of a ToolSet;
- effective-member calculation;
- interpreting `constraint_json`;
- ACTIVE/current ToolSet selection;
- revalidating current ToolDefinition ACTIVE status during the read;
- tool eligibility, permission, entitlement, approval, side-effect or resource-scope enforcement;
- AgentDefinition/AgentStep binding or validation;
- Tool Definition / OperationContract execution;
- Assistant/Agent selection or runtime planning;
- AI provisioning/configuration resolution;
- provider/model/prompt/policy/routing selection;
- credentials, inference, RAG or workflow/automation runtime;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

The existing database DML authority remains schema-owned and separately governed; the DD-113 port is read-only.

## Acceptance expectations

1. exact visible member returns complete immutable raw evidence;
2. sibling-Industry parent hides its member while exact sibling context can read it;
3. Tenant-parent member is same-Tenant visible from Tenant Core and Tenant Industry contexts;
4. PLATFORM-parent member is not Tenant fallback and requires trusted PLATFORM_GLOBAL;
5. foreign-Tenant parent hides its member;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw `enabled` and `constraint_json` do not become effective/eligible/executable authority, the port exposes no mutation/list/effective/execute method, and PLATFORM-parent mutation remains protected.

Acceptance IDs: `AITOOLMEM-PG-001` through `AITOOLMEM-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-113 traceability or state promotion.
