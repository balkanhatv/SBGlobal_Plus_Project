# AIConversation AssistantDefinition current-binding prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AI-AGENT-APPROVAL-PARENT-SCOPE-CURRENT-FLOORS-001`  
**Verified synchronized basis:** `03c634ce69978238133a35c29b65c363176629fa`  
**Scope:** next independent source-complete AI relationship prerequisite after DD-184.

## Source reconciliation

Migration 0012 AIConversation persistence, migration 0031 `validate_ai_relationships()`, DD-117 AssistantDefinition raw reader, DD-121 AIConversation raw reader and DD-170 total fail-closed definition applicability semantics were reconciled.

For an AIConversation carrying optional `assistant_definition_id`, migration 0031 owns one exact deterministic relationship predicate:

- if `assistant_definition_id` is absent, no AssistantDefinition relationship is required;
- if present, the referenced AssistantDefinition must exist;
- its id must exactly equal the persisted `assistant_definition_id`;
- raw AssistantDefinition status must be exactly `ACTIVE`;
- AssistantDefinition ownership must apply to the conversation Tenant/Industry scope under the canonical PLATFORM/TENANT/INDUSTRY hierarchy.

The same trigger separately validates `owner_principal_id` with `principal_is_active_for_tenant(..., created_at)`. That identity/current-context predicate is not part of this floor.

DD-179 separately re-evaluates AssistantDefinition's own PromptTemplate/ToolSet relationships. Migration 0031 does not re-run those nested relationships when validating an AIConversation, so DD-185 must not silently compose DD-179.

## Determination

One pure **AIConversation→optional AssistantDefinition current-binding necessary floor** is source-complete:

> Given one already-loaded AIConversation and optional already-loaded AssistantDefinition evidence, determine only whether migration-0031's optional assistant id/ACTIVE/scope relationship still matches.

A true result is **not conversation-owner authorization, effective assistant selection, prompt/tool currentness or AI execution authority**.

## Authorized DD-185 boundary

Implement:

`matchesAIConversationAssistantBindingFloors(conversation, assistant?)`.

It must:

1. require valid conversation id and Tenant id UUIDs;
2. require valid conversation scope shape:
   - TENANT_CORE => Industry Context absent;
   - TENANT_INDUSTRY => valid Industry Context UUID;
3. when `conversation.assistantDefinitionId` is absent:
   - require `assistant === undefined`;
   - return true after conversation identity/scope validation;
4. when present:
   - require a valid assistant id UUID;
   - require AssistantDefinition evidence;
   - require valid AssistantDefinition id;
   - require exact `assistant.id === conversation.assistantDefinitionId`;
   - require raw `assistant.status === 'ACTIVE'`;
   - require valid owner shape and canonical applicability:
     - PLATFORM => no Tenant/Industry owner; applies to Tenant-Core or Tenant-Industry conversation;
     - TENANT => valid same Tenant, no owner Industry; applies within that Tenant;
     - INDUSTRY => valid same Tenant + exact valid Industry Context; applies only to exact Tenant-Industry conversation;
5. fail closed for malformed evidence or unexpected AssistantDefinition evidence on an unbound conversation;
6. leave all inputs unchanged.

## Acceptance target

- **AICONV-AST-CUR-001** — unbound valid conversation + no AssistantDefinition evidence -> true.
- **AICONV-AST-CUR-002** — exact ACTIVE PLATFORM AssistantDefinition applies to Tenant-Core and Tenant-Industry conversations -> true.
- **AICONV-AST-CUR-003** — exact ACTIVE same-Tenant TENANT AssistantDefinition applies to Core/Industry; foreign Tenant -> false.
- **AICONV-AST-CUR-004** — exact ACTIVE INDUSTRY AssistantDefinition applies only to exact same-Tenant Industry; sibling/Tenant-Core -> false.
- **AICONV-AST-CUR-005** — wrong assistant id or non-ACTIVE status -> false.
- **AICONV-AST-CUR-006** — malformed conversation/assistant identity/scope/owner shape or unexpected evidence for unbound conversation -> false.
- **AICONV-AST-CUR-007** — owner principal, sensitivity/retention/status/timestamps and Assistant capability/RAG/prompt/tool/model/retention/version/timestamps remain uninterpreted; DD-179 is not auto-composed; inputs unchanged.

Expected Core delta: +7 tests, from 535 to 542. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-185 does **not**:

- validate conversation owner-principal currentness;
- select a current AssistantDefinition by code/version/effective time;
- compose DD-179 nested PromptTemplate/ToolSet currentness;
- resolve PromptSet/rendering/RAG/model/provider/tool policy;
- interpret sensitivity/retention/erasure;
- load conversation messages/history;
- perform cross-Industry history carry-over;
- execute inference/RAG/tools/agents;
- mutate AIConversation;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification, Workflow, Automation or AI runtime execution boundaries.

## Next dependency boundary

After DD-185, the persisted optional AIConversation→AssistantDefinition relationship is re-evaluable. Owner-principal currentness and effective AI runtime selection/execution remain separate prerequisites.
