# AIMemoryRecord AssistantDefinition current-binding prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AI-CONVERSATION-ASSISTANT-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `dbdde08355d53cad8579776a061022f6d76229a7`  
**Scope:** next independent source-complete AI relationship prerequisite after DD-185.

## Source reconciliation

Migration 0012 AIMemoryRecord persistence, migration 0031 `validate_ai_relationships()`, DD-117 AssistantDefinition raw reader, DD-129 AIMemoryRecord raw reader and DD-170 total fail-closed definition applicability semantics were reconciled.

For an AIMemoryRecord carrying optional `assistant_definition_id`, migration 0031 owns one deterministic relationship predicate:

- if `assistant_definition_id` is absent, no AssistantDefinition relationship is required;
- if present, the referenced AssistantDefinition must exist;
- its id must exactly equal the persisted `assistant_definition_id`;
- raw AssistantDefinition status must be exactly `ACTIVE`;
- AssistantDefinition ownership must apply to the memory Tenant/optional Industry scope under the canonical PLATFORM/TENANT/INDUSTRY hierarchy.

The same trigger separately validates optional `principal_id` currentness and optional `supersedes_id` exact owner/scope/class continuity. Those predicates are not part of this floor.

## Determination

One pure **AIMemoryRecord→optional AssistantDefinition current-binding necessary floor** is source-complete:

> Given one already-loaded AIMemoryRecord and optional already-loaded AssistantDefinition evidence, determine only whether migration-0031's optional assistant id/ACTIVE/scope relationship still matches.

A true result is **not principal authorization, current-memory selection, supersession resolution, retention/ACL authority or AI execution authority**.

## Authorized DD-186 boundary

Implement:

`matchesAIMemoryAssistantBindingFloors(memory, assistant?)`.

It must:

1. require valid memory id and Tenant id UUIDs;
2. require memory Industry Context, when present, to be a valid UUID;
3. when `memory.assistantDefinitionId` is absent:
   - require `assistant === undefined`;
   - return true after memory identity/scope validation;
4. when present:
   - require valid persisted assistant id UUID;
   - require AssistantDefinition evidence;
   - require valid AssistantDefinition id;
   - require exact `assistant.id === memory.assistantDefinitionId`;
   - require raw `assistant.status === 'ACTIVE'`;
   - require valid owner shape and canonical applicability:
     - PLATFORM => no Tenant/Industry owner; applies to Tenant-Core or Tenant-Industry memory;
     - TENANT => valid same Tenant, no owner Industry; applies within that Tenant;
     - INDUSTRY => valid same Tenant + exact valid Industry Context; applies only when memory has that exact Industry Context;
5. fail closed for malformed evidence or unexpected AssistantDefinition evidence on an unbound memory;
6. leave all inputs unchanged.

DD-186 must not silently compose DD-179 AssistantDefinition nested PromptTemplate/ToolSet currentness because migration 0031 does not re-evaluate those nested relationships for AIMemoryRecord writes.

## Acceptance target

- **AIMEM-AST-CUR-001** — unbound valid memory + no AssistantDefinition evidence -> true.
- **AIMEM-AST-CUR-002** — exact ACTIVE PLATFORM AssistantDefinition applies to Tenant-Core and Tenant-Industry memory -> true.
- **AIMEM-AST-CUR-003** — exact ACTIVE same-Tenant TENANT AssistantDefinition applies to Core/Industry; foreign Tenant -> false.
- **AIMEM-AST-CUR-004** — exact ACTIVE INDUSTRY AssistantDefinition applies only to exact same-Tenant Industry memory; sibling/Tenant-Core -> false.
- **AIMEM-AST-CUR-005** — wrong assistant id or non-ACTIVE status -> false.
- **AIMEM-AST-CUR-006** — malformed memory/assistant identity/owner shape or unexpected assistant evidence for unbound memory -> false.
- **AIMEM-AST-CUR-007** — principal/memoryClass/content/source/sensitivity/retention/ACL/status/timestamps/expiry/supersedes plus Assistant capability/RAG/prompt/tool/model/retention/version/timestamps remain uninterpreted; DD-179 is not auto-composed; inputs unchanged.

Expected Core delta: +7 tests, from 542 to 549. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-186 does **not**:

- validate memory principal currentness;
- resolve supersession chains;
- decide current/latest memory;
- evaluate expiry against wall clock;
- enforce retention/legal hold/erasure;
- interpret ACL policy or acting-principal authorization;
- decrypt/dereference memory content/source;
- carry Tenant-Core memory across Industry experiences;
- select current Assistant versions;
- compose DD-179;
- resolve prompt/RAG/model/provider/tool policy;
- execute inference/RAG/tools/agents;
- mutate AIMemoryRecord;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification, Workflow, Automation or Agent execution boundaries.

## Next dependency boundary

After DD-186, AIMemoryRecord optional AssistantDefinition currentness is re-evaluable. Memory supersession continuity is a separate persisted relationship and may be audited independently; principal and runtime semantics remain blocked.
