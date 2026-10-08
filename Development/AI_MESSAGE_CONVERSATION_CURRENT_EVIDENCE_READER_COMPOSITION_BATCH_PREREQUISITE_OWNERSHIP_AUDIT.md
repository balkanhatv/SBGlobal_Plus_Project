# AIMessage → AIConversation current direct-binding evidence — source/prerequisite ownership audit

**Date:** 2026-10-08
**Completed entry batch:** DD-678…DD-682 state closure at `bc982b6ac6b9254ddcb9aeea1a769f6349689510` (exact-head Core/PostgreSQL/Database/Web confirmed).
**Frozen candidate:** DD-683…DD-687
**Status:** Source-audit only; implementation requires this audit commit's own exact-head Core/PostgreSQL/Database/Web gates.

## Source ownership and explicit limitation

- DD-09 §17 governs Tenant/Industry/principal-private conversation history, retention/sensitivity, and prohibition on automatically carrying history across Industries.
- DD-126 and migration `0012_ai_rag_memory_usage.sql` own `AIMessageReadPort.loadForContext({requestContext,messageId})`: one exact message with persisted UUID `id` and nonnull `conversationId` foreign key referencing `core_ai.ai_conversation(id)`. The message row is FORCE-RLS and its visibility derives from its scoped, principal-private parent Conversation. No generic history/list endpoint is granted.
- DD-121 and migration 0012 own `AIConversationReadPort.loadForContext({requestContext,conversationId})`: one exact scoped conversation with owner-principal/Tenant/Industry FORCE-RLS and raw status, retention, sensitivity and optional AssistantDefinition id. Same-Tenant TENANT_CORE visibility from an Industry context is not cross-context history authority.
- DD-199 owns existing pure `matchesAIMessageConversationBindingFloors(message,conversation?)`, enforcing only valid message id, conversationId and parent id UUIDs plus `conversation.id === message.conversationId`. No role/content/source, parent Tenant/Industry/principal/status/retention or message deletion/currentness rule is part of this direct FK floor. Parent visibility must be determined by the existing scoped read port.
- Migration 0031 does not add an extra message→conversation relationship predicate. Neither this composition nor its tests add one.

**Determination:** SOURCE-COMPLETE for internal read-only composition of the two existing exact scoped ports and DD-199 direct foreign-key predicate. Evidence does not grant current Conversation authorization, message/history disclosure, model routing or AI execution.

## Frozen decisions

**DD-683 — exact scoped AIMessage first.** Add `loadAIMessageConversationCurrentEvidence({requestContext,messageId},messageReader,conversationReader)`. Read one exact message under original RequestContext and persisted id; a null child returns null before parent access. Dependency errors propagate unchanged.

**DD-684 — validate child necessary linkage before another read.** Check only DD-199 necessary child UUID identity and nonnull conversationId. Malformed/null/undefined/non-UUID ids fail closed without the second dependency read. Do not interpret message role/content/deletedAt/model-route/source evidence.

**DD-685 — one exact same-context AIConversation read.** For valid child, invoke `conversationReader.loadForContext` exactly once with identical RequestContext reference and persisted `message.conversationId`. Null/invisible parent returns null; dependency errors propagate unchanged. No lookup by conversation code, elevation, cross-context rebinding, fallback, search/list or history enumeration.

**DD-686 — reuse DD-199 equality and immutable raw evidence.** Apply the existing `matchesAIMessageConversationBindingFloors` to the exact returned message/Conversation, including malformed parent id and wrong-id fail-closed cases. Frozen success `{message,conversation}` preserves exact source object references, raw message content/role/source/model route/times, and raw conversation owner/scope/status/Assistant/retention/sensitivity/times. Do not normalize, clone or interpret fields outside DD-199.

**DD-687 — no authorization escalation.** This reader adds no Conversation owner-principal currentness, history/list/message-content disclosure, decryption, source dereferencing, retention/erasure decisions, role authorization, Assistant selection, provider/model routing, RAG, prompt assembly, inference, tool/agent action, mutation or events. Both original ports retain RLS and context authority. Relationship evidence alone is not a permitted user-facing history endpoint.

## Frozen executable acceptance

- **AIMSG-CONVREAD-BASE-001:** exact message read first; preserve input id and same RequestContext reference.
- **AIMSG-CONVREAD-BASE-002:** null message and message-reader error preclude Conversation lookup; errors propagate.
- **AIMSG-CONVREAD-CHILD-001:** malformed/null/missing message id/conversationId fails closed with no parent read.
- **AIMSG-CONVREAD-READ-001:** valid child performs exactly one parent read of persisted conversationId under identical RequestContext.
- **AIMSG-CONVREAD-READ-002:** missing/invisible parent or read error returns null/propagates without context widening, retries or fallback.
- **AIMSG-CONVREAD-FLOOR-001:** exact DD-199 FK equality passes; mismatched/invalid parent id fails closed.
- **AIMSG-CONVREAD-EVID-001:** frozen envelope preserves exact raw message+Conversation references, including opaque deleted/status/timestamp order.
- **AIMSG-CONVREAD-BOUND-001:** result grants no owner/history/content/retention/erasure/route/prompt/RAG/provider/tool/agent/AI execution authority.

Expected Core count **1659 → 1667** (8 fixed contract tests); PostgreSQL **540**, Database **48 migrations / 42 SQL verification files**, Web unchanged.

## Explicit exclusions and next gate

No schema, SQL trigger, FORCE-RLS policy, role/grant, migration, adapter, RequestContext resolution, IAM/Commercial policies, tRPC/REST endpoint, web/mobile/desktop UI, RawSource or requirement inventory change. No new product status vocabulary or historic/current semantics. A successful direct relationship read is still not a history-access grant.

Source-audit exact HEAD must independently pass Core/PostgreSQL/Database/Web before implementation. Then implement only frozen acceptance and verify exact implementation HEAD; canonical DD-17/18/19/manifest/register promotion and separately verified closure must follow. Keep PR #2 open/draft/unmerged, main and RawSource unchanged, no force-push or test weakening.
