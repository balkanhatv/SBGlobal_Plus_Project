# AI ToolSetMember ToolDefinition current-binding floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AI-PROMPT-SET-MEMBER-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `d2adf149ef33b2226ab6e0f608e5a5cc468fd4c3`  
**Scope:** next independent source-complete AI relationship prerequisite after DD-177.

## Source reconciliation

Migration 0031 `validate_ai_relationships()`, DD-110 ToolDefinition catalog metadata reader, DD-113 ToolSetMember raw reader and current DD-177 state were reconciled.

For `ai_tool_set_member`, migration 0031 owns one exact deterministic referenced-tool predicate:

- the referenced `core_ai.ai_tool_definition` row must exist;
- its id must be the member's persisted `tool_definition_id`;
- its raw status must be exactly `ACTIVE`.

The write-time trigger does not require the parent ToolSet itself to be ACTIVE in this branch and does not interpret the member's `enabled` flag or `constraint_json` as execution authority.

DD-110 exposes exact-by-id immutable ToolDefinition metadata including id, raw status, scope class, permission/entitlement, approval/idempotency/audit and OperationContract reference. DD-113 exposes ToolSetMember id, parent ToolSet id, ToolDefinition id, raw enabled flag, raw constraint JSON and creation time.

## Determination

One pure **AIToolSetMember→AIToolDefinition current-binding necessary floor** is source-complete:

> Given one already-loaded ToolSetMember and one already-loaded ToolDefinition catalog row, determine only whether migration-0031's exact referenced-tool id/ACTIVE relationship still matches.

A true result is **not effective ToolSet membership, tool eligibility, permission/entitlement/approval satisfaction or OperationContract execution authority**.

## Authorized DD-178 boundary

Implement:

`matchesAIToolSetMemberDefinitionBindingFloors(member, definition)`.

It must:

1. require valid member id, ToolSet id and ToolDefinition id UUIDs;
2. require valid ToolDefinition id UUID;
3. require exact `definition.id === member.toolDefinitionId`;
4. require raw `definition.status === 'ACTIVE'`;
5. leave all inputs unchanged.

No other ToolDefinition or ToolSetMember field may affect the result.

## Acceptance target

- **AITOOLMEM-DEF-CUR-001** — exact referenced ACTIVE ToolDefinition -> true.
- **AITOOLMEM-DEF-CUR-002** — wrong ToolDefinition id -> false.
- **AITOOLMEM-DEF-CUR-003** — missing/malformed member id -> false.
- **AITOOLMEM-DEF-CUR-004** — malformed ToolSet id or ToolDefinition id on member -> false.
- **AITOOLMEM-DEF-CUR-005** — malformed ToolDefinition id -> false.
- **AITOOLMEM-DEF-CUR-006** — non-ACTIVE raw statuses -> false.
- **AITOOLMEM-DEF-CUR-007** — member enabled/constraint/createdAt and definition capability/operation/scope/permission/entitlement/schema/side-effect/approval/idempotency/audit/version/timestamps remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 486 to 493. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-178 does **not**:

- decide whether a member is effective because `enabled=true`;
- interpret `constraint_json`;
- validate current/ACTIVE parent ToolSet;
- list or resolve effective ToolSet members;
- authorize tool permissions, entitlements or approvals;
- interpret side-effect class, idempotency or audit policy;
- resolve/execute OperationContract;
- validate AgentDefinition/AgentStep membership;
- invoke tools, agents, providers or models;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification, Workflow or Automation execution boundaries.

## Next dependency boundary

After DD-178, ToolSetMember referenced-tool currentness is re-evaluable. Effective member resolution and runtime tool execution remain separately governed. AssistantDefinition/AgentDefinition prompt/tool-set containment relationships may be audited independently where raw evidence is complete.
