# AIMessage Conversation binding prerequisite ownership audit

**Date:** 2026-09-25
**Baseline checkpoint:** `DEV-AI-COST-TOKEN-USAGE-BINDING-FLOORS-001`
**Verified closure HEAD:** `b542fd9324f9c75f5bd0269cf08002cb20583d49`
**Verified tree:** `6a0c20759d76803c2ccc54b45faaf87dccd8df95`

## Entry gate

DD-198 state closure is exact-head verified. Core Service Verify run `36165835802` passed Core job `108173233645` at **632/632** and PostgreSQL job `108173233894` at **504/504** plus database bootstrap PASS. Database Verify run `36165835743` / job `108173233520` passed. Web Boundary Verify run `36165835764` / job `108173233790` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0012 defines `core_ai.ai_message.conversation_id uuid NOT NULL REFERENCES core_ai.ai_conversation(id)`. This requires every persisted AIMessage row to reference one existing AIConversation id.

DD Message raw persistence exposes `PersistedAIMessage.id` and `conversationId`. DD Conversation raw persistence exposes `PersistedAIConversation.id` plus its scope/principal/assistant/security/lifecycle evidence.

Migration 0031 adds no stronger AIMessage → AIConversation relationship trigger. Conversation-derived RLS visibility remains persistence-owned and is not a new pure relationship predicate.

Message role/content/source refs/model route/timestamps and Conversation Tenant/Industry/scope/owner/assistant/sensitivity/retention/status/timestamps do not participate in the direct foreign-key equality predicate.

## Determination and locked DD-199 detailed contract

**SOURCE-COMPLETE for AIMessage → AIConversation exact conversation-id parent continuity only.**

Authorize pure helper:

`matchesAIMessageConversationBindingFloors(message, conversation?)`

1. Validate AIMessage `id` and `conversationId` as UUIDs.
2. Require supplied AIConversation evidence with valid `id` UUID.
3. Require exact `conversation.id === message.conversationId`.
4. Message role/content/source/model-route/time evidence is not evaluated.
5. Conversation Tenant/Industry/scope/principal/assistant/sensitivity/retention/status/time evidence is not evaluated.
6. Malformed relevant ids fail closed; inputs remain unchanged.

## Fixed acceptance before implementation

- **AIMSG-CONV-CUR-001**: exact message conversation id and Conversation id pass.
- **AIMSG-CONV-CUR-002**: missing Conversation evidence or mismatched parent id fails closed.
- **AIMSG-CONV-CUR-003**: malformed Message id/conversation id or Conversation id fails closed.
- **AIMSG-CONV-CUR-004**: Message role/content/source/model-route/time evidence is uninterpreted.
- **AIMSG-CONV-CUR-005**: Conversation scope/principal/assistant/security/lifecycle/time evidence is uninterpreted.
- **AIMSG-CONV-CUR-006**: inputs remain unchanged and true grants no conversation authorization, model-route authority, content access or AI execution authority.

Expected executable delta: Core **632 → 638**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not acting-principal authorization, Conversation currentness/status validity, assistant binding validity, sensitivity/retention policy, content/source-ref authorization, model-route validity/currentness, moderation, retrieval/grounding or AI execution authority. It changes no schema/RLS/role/grant/route/product policy.

After DD-199 is implemented and exact-head verified, source-audit the next independent persisted AI relationship. Principal currentness remains separately blocked unless governing provenance semantics change.
