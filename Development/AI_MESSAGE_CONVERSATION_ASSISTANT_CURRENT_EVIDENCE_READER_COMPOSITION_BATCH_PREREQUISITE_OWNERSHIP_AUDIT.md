# AIMessage → AIConversation → optional AssistantDefinition current evidence — source/prerequisite ownership audit

**Date:** 2026-10-09  
**Entry checkpoint:** DEV-AI-COST-TOKEN-USAGE-CURRENT-EVIDENCE-READER-001; DD-688…DD-692 state-closure HEAD 3d85328b2d43d76a5b01749fd3caa28695805c9b.  
**Entry gate:** Core Service Verify run 37877395187, including core-service-verify job 113649011555 and postgres-context-verify job 113649011704, both PASS; Database Verify run 37877395155 PASS; Web Boundary Verify run 37877395186 PASS. No failed/skipped status is inferred from the workflow summary alone.  
**Frozen candidate:** DD-693…DD-697.  
**Status:** SOURCE AUDIT ONLY. No implementation is authorized before this audit commit independently passes exact-head Core/PostgreSQL/Database/Web. The project is in governed Development, not production-ready.

## 1. Existing source ownership

- DD-09 §17 governs Tenant/Industry and owner-principal-private conversation history. It prohibits automatic cross-Industry history carry. Neither evidence composition nor a successful foreign-key check authorizes message/history disclosure, retention/erasure, conversation-owner currentness, or execution.
- DD-126 / migration 0012: AIMessageReadPort.loadForContext({requestContext,messageId}) loads one exact persisted message; a message's nonnull conversationId references core_ai.ai_conversation(id). Conversation-derived FORCE-RLS remains owned by the underlying database/adapter. DD-199 owns matchesAIMessageConversationBindingFloors(message,conversation?): necessary message id/conversationId and exact parent id UUID equality only.
- DD-121 / migration 0012: AIConversationReadPort.loadForContext({requestContext,conversationId}) loads one exact tenant-, Industry- and owner-principal-scoped conversation, including raw optional assistantDefinitionId and raw scope/security/retention/status fields. A visible TENANT_CORE row from an Industry RequestContext does not permit history portability.
- DD-117: AIAssistantDefinitionReadPort.loadForContext({requestContext,assistantDefinitionId}) loads one exact AssistantDefinition with read-port visibility, never a privileged alternate selection or PLATFORM_GLOBAL fallback.
- DD-185 / migration 0031: matchesAIConversationAssistantBindingFloors(conversation,assistant?) governs the optional direct Conversation→AssistantDefinition persisted relationship. Unbound requires absent assistant evidence and valid Conversation scope shape; bound requires exact assistant UUID id, raw ACTIVE status, and applicable PLATFORM/TENANT/INDUSTRY owner relationship. It does not establish a current effective Assistant, nested prompt/ToolSet binding, principal currentness or execution.
- Verified existing DD-678…DD-682 and DD-683…DD-687 readers expose the two separate edges. This proposed single composition uses the three existing scoped raw read ports and the two existing predicates directly; it must not call both pre-existing composed readers sequentially (which would read the same Conversation twice). No new database relationship is asserted.
- All three raw ports may use separate database transactions; same RequestContext identity and exact persisted identifiers do not establish one atomic cross-read snapshot or protect against subsequent changes.

**Source determination:** SOURCE-COMPLETE only for a new *internal, read-only, non-authorizing evidence envelope* over the exact two already-governed persisted edges. No new product rule, privilege, currentness predicate, scope relaxation or data access route is implied.

## 2. Frozen decisions — implementation only after this audit HEAD passes

**DD-693 — exact Message first.** Define loadAIMessageConversationAssistantCurrentEvidence({requestContext,messageId},messageReader,conversationReader,assistantReader). Invoke the existing AIMessage port exactly once using the original id and the identical RequestContext object. A null child short-circuits both parent reads. Dependency errors propagate unchanged.

**DD-694 — necessary Message→Conversation floor before further access.** Reject absent/non-object/malformed Message id or persisted conversationId with existing DD-199 UUID semantics before Conversation access. For valid child, read exactly one persisted conversationId under the identical RequestContext. Null/invisible Conversation returns null, dependency errors propagate unchanged; apply matchesAIMessageConversationBindingFloors before any Assistant read. No list/history, alternate parent, retry, rebinding or privilege elevation.

**DD-695 — unbound conversation branch.** If persisted assistantDefinitionId is undefined, apply the existing DD-185 unbound predicate with no assistant. Return frozen {message,conversation}, preserving the two raw source object references, with zero AssistantDefinition reads. Malformed Conversation id/Tenant/scope/Industry shape fails closed. A missing Assistant binding is not permission to auto-select a default Assistant.

**DD-696 — optional exact bound AssistantDefinition branch.** If assistantDefinitionId is present, validate only DD-185 necessary Conversation id/Tenant/scope shape and assistantDefinitionId UUID before a third dependency read. Then perform exactly one AssistantDefinition read of the persisted id under the *identical original RequestContext object*. Null/invisible Assistant returns null; errors propagate unchanged. Apply the existing DD-185 exact id, ACTIVE and owner-scope relationship without normalization or extra policy; mismatched/foreign/sibling Industry/invalid Assistant fails closed. Successful bound evidence is frozen {message,conversation,assistant}, retaining all three original raw object references. Do not add a PLATFORM_GLOBAL fallback when the scoped port denies a PLATFORM-owned row.

**DD-697 — evidence is not authorization.** Neither branch authorizes acting-principal owner currentness, access to message content/source refs, history/list endpoints, conversation retention/deletion decisions, effective Assistant selection, prompt/ToolSet/model-policy verification, provider/model eligibility, RAG/tool/agent usage, inference, workflow execution, mutation or events. Both original edge predicates and each port's RLS visibility remain necessary, not sufficient for a new API or execution path.

## 3. Frozen executable acceptance

- **AIMSG-CONVASTREAD-BASE-001:** Message is read first, exactly once, with original input messageId and identical RequestContext reference.
- **AIMSG-CONVASTREAD-BASE-002:** Missing Message or Message reader exception prevents both parent reads; dependency error propagates by identity.
- **AIMSG-CONVASTREAD-CHILD-001:** Malformed/missing Message id or conversationId fails closed before either parent read.
- **AIMSG-CONVASTREAD-CONV-001:** Valid Message loads exactly its persisted Conversation id once, under identical RequestContext; satisfies DD-199 exact FK equality.
- **AIMSG-CONVASTREAD-CONV-002:** Missing/invisible, mismatched/malformed Conversation or Conversation reader error fails/propagates without Assistant read, fallback or scope widening.
- **AIMSG-CONVASTREAD-UNBOUND-001:** Truly absent assistantDefinitionId with valid TENANT_CORE or TENANT_INDUSTRY Conversation returns frozen two-record evidence and makes zero Assistant reads; malformed unbound Conversation scope fails closed.
- **AIMSG-CONVASTREAD-AST-001:** Valid bound Conversation reads exactly its persisted AssistantDefinition id once under identical RequestContext; malformed bound Conversation identity/scope or id denies before third dependency read.
- **AIMSG-CONVASTREAD-AST-002:** Null/hidden Assistant, reader error, wrong id, non-ACTIVE status, foreign Tenant, sibling Industry or invalid owner scope denies/propagates; existing DD-185 applicable PLATFORM/TENANT/INDUSTRY evidence can pass only if the scoped port supplied it.
- **AIMSG-CONVASTREAD-EVID-001:** Two- and three-record result envelopes are frozen; raw object references, content/source metadata, status, retention/sensitivity, timestamps and nested Assistant metadata remain uninterpreted, unmodified and unrounded.
- **AIMSG-CONVASTREAD-BOUND-001:** No principal/history/content/retention/erasure/cross-context/current-effective-Assistant/RAG/prompt/provider/tool/agent/execution or public route authority is inferred; no snapshot-atomicity claim.

Expected Core test increment **1675 → 1685** (10 tests), subject to verified implementation; PostgreSQL **540**, database **48 migrations / 42 SQL verification files**, Web unchanged.

## 4. Scope exclusions and ordered gates

Source audit adds no TypeScript implementation, executable tests, schema/migration/RLS/grant/adapter, RequestContext/IAM/Commercial change, tRPC/REST endpoint, web/mobile/desktop UI, RawSource edit, requirement inventory change, or canonical DD-17/18/19 promotion. This file is a frozen proposed batch, not a production-ready AI surface.

**Ordered gate:** (1) this audit commit must independently pass exact-head Core/PostgreSQL/Database/Web; (2) only then implement the frozen DD-693…DD-697 reader and ten acceptance tests; (3) verify that implementation at its own exact HEAD; (4) only then promote DD-17/18/19, manifest, audit evidence and active projections; (5) separately verify canonical promotion and state closure. A failed gate stops forward work for smallest targeted forward-only correction.

Preserve **9 equal Industries, 41 Management Systems, 181 Industry tables, 2,962 original requirement IDs and exactly TENANT_STAFF_APP / TENANT_USER_APP**. Keep main and immutable RawSource unchanged, PR #2 open/draft/unmerged, no force-push or test weakening. Production readiness is NOT CLAIMED.
