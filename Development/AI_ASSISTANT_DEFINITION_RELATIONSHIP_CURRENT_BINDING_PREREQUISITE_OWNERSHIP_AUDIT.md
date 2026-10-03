# AI AssistantDefinition referenced-definition current-binding floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AI-TOOL-SET-MEMBER-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `71e62d75b84cca0efd7456175028ffe9eb714dcb`  
**Scope:** next independent source-complete AI relationship prerequisite after DD-178.

## Source reconciliation

Migration 0031 `validate_ai_relationships()`, migration 0048 fail-closed definition containment, DD-115 PromptTemplate raw reader, DD-111 ToolSet raw reader, DD-117 AssistantDefinition raw reader and current DD-178 state were reconciled.

For `assistant_definition`, migration 0031 owns two deterministic referenced-definition predicates:

1. required `prompt_template_id`:
   - referenced PromptTemplate must exist;
   - raw PromptTemplate status must be exactly `ACTIVE`;
   - PromptTemplate owner scope must contain the AssistantDefinition owner scope through `definition_contains_definition(...)`.

2. optional `tool_set_id`, when present:
   - referenced ToolSet must exist;
   - raw ToolSet status must be exactly `ACTIVE`;
   - ToolSet owner scope must contain the AssistantDefinition owner scope through the same fail-closed containment predicate.

The same trigger separately validates `allowed_capabilities` as a duplicate-free/null-free set of ACTIVE capability codes. That capability predicate is independent of the PromptTemplate/ToolSet relationship and is not part of this DD-179 floor.

The AssistantDefinition schema does not persist PromptTemplate or ToolSet versions for these references. Migration 0031 therefore does not compare referenced definition versions/effective dates here.

## Determination

One pure **AIAssistantDefinition referenced-definition current-binding necessary floor** is source-complete:

> Given one already-loaded AssistantDefinition, its already-loaded required PromptTemplate, and optional already-loaded ToolSet evidence, determine only whether migration-0031's exact id/ACTIVE/broader-or-equal containment relationships still match.

A true result is **not Assistant selection, capability authorization, prompt rendering, effective ToolSet resolution or AI execution authority**.

## Authorized DD-179 boundary

Implement:

`matchesAIAssistantDefinitionRelationshipFloors(assistant, promptTemplate, toolSet?)`.

It must:

1. require valid AssistantDefinition id and exact valid PLATFORM/TENANT/INDUSTRY owner shape;
2. require valid persisted `assistant.promptTemplateId`;
3. require valid PromptTemplate id and exact `promptTemplate.id === assistant.promptTemplateId`;
4. require raw `promptTemplate.status === 'ACTIVE'`;
5. require PromptTemplate owner shape to be valid and broader-or-equal to the AssistantDefinition owner scope under DD-170 containment;
6. when `assistant.toolSetId` is absent:
   - require `toolSet === undefined`;
7. when `assistant.toolSetId` is present:
   - require valid ToolSet id and exact `toolSet.id === assistant.toolSetId`;
   - require raw `toolSet.status === 'ACTIVE'`;
   - require ToolSet owner shape to be valid and broader-or-equal to the AssistantDefinition owner scope;
8. leave all inputs unchanged.

No AssistantDefinition capability, RAG, model policy, retention policy, version/status or timestamp field may affect this relationship floor.

## Acceptance target

- **AIASSIST-REL-CUR-001** — PLATFORM PromptTemplate + absent ToolSet can contain valid PLATFORM/TENANT/INDUSTRY assistants as hierarchy permits -> true.
- **AIASSIST-REL-CUR-002** — same-Tenant TENANT PromptTemplate contains TENANT and same-Tenant INDUSTRY assistant; foreign Tenant/PLATFORM child -> false.
- **AIASSIST-REL-CUR-003** — INDUSTRY PromptTemplate contains only exact same-Tenant Industry assistant -> true; sibling/Tenant/Platform child -> false.
- **AIASSIST-REL-CUR-004** — present ToolSet must exact-id match, be ACTIVE and contain assistant scope; absent assistant ToolSet rejects extra ToolSet evidence.
- **AIASSIST-REL-CUR-005** — wrong PromptTemplate id or non-ACTIVE PromptTemplate/ToolSet -> false.
- **AIASSIST-REL-CUR-006** — malformed AssistantDefinition/PromptTemplate/ToolSet identity or owner shape -> false.
- **AIASSIST-REL-CUR-007** — allowedCapabilities/rag/modelPolicy/retention/version/status/timestamps plus prompt content/schema/approval and ToolSet code/version remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 493 to 500. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-179 does **not**:

- validate AssistantDefinition allowed capability currentness;
- select current/latest AssistantDefinition;
- compare PromptTemplate or ToolSet versions/effective dates;
- render prompts or validate prompt variables/overrides/grounding;
- resolve effective ToolSet members;
- authorize tool permissions, entitlements or approvals;
- resolve model/retention/RAG policy;
- bind conversations/memory/runs;
- execute OperationContracts, tools, agents, providers or models;
- perform inference, RAG, embeddings or media generation;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook, SyncCursor, Integration, Outbox, Notification, Workflow or Automation execution boundaries.

## Next dependency boundary

After DD-179, AssistantDefinition PromptTemplate/ToolSet relationship currentness is re-evaluable. Assistant capability-set currentness and all runtime selection/execution remain independently governed.
