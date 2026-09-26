# AIToolSetMember parent ToolSet binding prerequisite ownership audit

**Date:** 2026-09-26
**Baseline checkpoint:** `DEV-AI-TOOL-DEFINITION-CAPABILITY-BINDING-FLOORS-001`
**Verified closure HEAD:** `b946d5b83f0b5c4874683e5e46d5c4f68b4c016a`
**Verified tree:** `6606c374a8dba3ade49e7ff65649ecb0234cd987`

## Entry gate

DD-203 state closure is exact-head verified. Core Service Verify run `36235582518` passed Core job `108386624083` at **664/664** and PostgreSQL job `108386623978` at **504/504** plus database bootstrap PASS. Database Verify run `36235582554` / job `108386623939` passed. Web Boundary Verify run `36235582505` / job `108386623842` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0031 physically owns `core_ai.ai_tool_set_member` and defines:

`tool_set_id uuid NOT NULL REFERENCES core_ai.ai_tool_set(id)`.

The same migration's parent RLS policy makes member-row visibility depend on the referenced ToolSet being visible in the current database context. Its separate `validate_ai_relationships()` trigger for `ai_tool_set_member` checks only that the referenced ToolDefinition is ACTIVE; it does **not** strengthen the member → parent ToolSet foreign key with ToolSet ACTIVE/current/applicability semantics.

DD-113 exposes raw `PersistedAIToolSet` including `id` and owner/status metadata. DD-114 exposes raw `PersistedAIToolSetMember` including `id` and `toolSetId`. DD-176 already governs the independent member → ToolDefinition ACTIVE relationship. No existing helper governs the direct member → parent ToolSet id relationship.

Therefore the parent FK is source-complete as a narrow pure relationship floor with no new persistence reader, schema, RLS, role or grant.

## Determination and locked DD-204 detailed contract

**SOURCE-COMPLETE for AIToolSetMember → parent AIToolSet exact id foreign-key continuity only.**

Authorize pure helper:

`matchesAIToolSetMemberParentBindingFloors(member, toolSet?)`

It accepts one DD-114 `PersistedAIToolSetMember` and optional DD-113 `PersistedAIToolSet`, returns boolean and never mutates inputs.

1. Validate member `id` and `toolSetId` UUID shape.
2. Require supplied ToolSet evidence with valid ToolSet `id` UUID shape.
3. Require exact `toolSet.id === member.toolSetId`.
4. Do not evaluate ToolSet owner scope, Tenant/Industry ownership, code, version, status or timestamps.
5. Do not evaluate member ToolDefinition binding, enabled flag, constraint JSON or creation timestamp.
6. Database RLS visibility remains persistence-owned and is not reinterpreted as new Core authorization.

## Fixed acceptance before implementation

- **AITOOLMEM-SET-CUR-001**: exact parent ToolSet id passes.
- **AITOOLMEM-SET-CUR-002**: missing ToolSet evidence fails closed.
- **AITOOLMEM-SET-CUR-003**: wrong parent ToolSet id fails closed.
- **AITOOLMEM-SET-CUR-004**: malformed member id or toolSetId fails closed.
- **AITOOLMEM-SET-CUR-005**: malformed ToolSet id fails closed.
- **AITOOLMEM-SET-CUR-006**: ToolSet owner/scope/code/version/status/time evidence remains uninterpreted.
- **AITOOLMEM-SET-CUR-007**: member ToolDefinition/enabled/constraint/time evidence remains uninterpreted and inputs remain unchanged.

Expected executable delta: Core **664 → 671**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not ToolSet ACTIVE/current/applicable state, Tenant/Industry authorization, ToolDefinition validity (DD-176 owns that independently), effective membership, permission/entitlement/approval satisfaction, AgentDefinition/AgentStep authorization, OperationContract eligibility, provider/model routing, tool invocation or AI/tool execution authority. It changes no schema/RLS/role/grant/route/product policy.

After DD-204 is implemented and exact-head verified, source-audit the next independent persisted AI relationship. Complete tool execution remains separately governed.
