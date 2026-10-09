# AIConversation → optional AssistantDefinition → required PromptTemplate / optional ToolSet current evidence — source/prerequisite ownership audit

**Date:** 2026-10-09  
**Entry checkpoint:** `DEV-AI-MESSAGE-CONVERSATION-ASSISTANT-CURRENT-EVIDENCE-READER-001`; DD-693…DD-697 state-closure HEAD `29e616ffcb876784b04dec44ca643a75acd79d01`.  
**Exact entry verification:** [Core Service Verify 37879627400](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37879627400) (Core 1685/1685, PostgreSQL 540/540, 0 failed/skipped); [Database Verify 37879627409](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37879627409) (48 migrations / 42 SQL verification files); [Web Boundary Verify 37879627399](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37879627399), all PASS at the same exact HEAD. GitHub job logs confirm checkout and independent execution at this SHA.  
**Frozen candidate:** DD-698…DD-702, internal Core read-only evidence composition.  
**Status:** **SOURCE AUDIT ONLY**. This file neither implements nor promotes any DD. It must independently pass exact-HEAD Core/PostgreSQL/Database/Web before any implementation.

## 1. Source / dependency ownership

- DD-09 §§2, 3, 8, 17: conversation owner-principal privacy, no automatic cross-Industry history carry, PromptTemplate lifecycle, RAG/AI Gateway authorization. Success of a relationship predicate does not permit history, content, inference, prompt rendering, tool execution or retention/erasure.
- DD-121 / migration 0012: `AIConversationReadPort.loadForContext({requestContext,conversationId})` returns one exact persisted Conversation under existing PostgreSQL scoped visibility. `ownerPrincipalId`, `status`, `sensitivityClass`, retention and timestamps are raw evidence, not a new permission rule.
- DD-117: `AIAssistantDefinitionReadPort.loadForContext({requestContext,assistantDefinitionId})` returns one exact scoped raw definition; no privileged lookup, default-by-code selection or PLATFORM_GLOBAL fallback.
- DD-115: `AIPromptTemplateReadPort.loadForContext({requestContext,promptTemplateId})` returns one exact scoped PromptTemplate with raw version, status, template text, approval and owner scope; this audit does not authorize rendering or disclosure to a caller.
- DD-111: `AIToolSetReadPort.loadForContext({requestContext,toolSetId})` returns one exact scoped ToolSet with raw version/status/owner scope. It does not enumerate members or authorize actions.
- DD-185 / migration 0031: `matchesAIConversationAssistantBindingFloors(conversation,assistant?)` owns the optional exact Conversation→AssistantDefinition id, ACTIVE and applicable PLATFORM/TENANT/INDUSTRY relationship. An absent binding must remain absent, not cause default Assistant selection.
- DD-179 / migrations 0031 and 0048: `matchesAIAssistantDefinitionRelationshipFloors(assistant,promptTemplate,toolSet?)` owns the referenced mandatory ACTIVE PromptTemplate and optional ACTIVE ToolSet exact-id plus broader-or-equal definition containment. It does not check Assistant capability currentness, versions, approval/effective prompt selection, ToolSet members, or execution.
- DD-678…DD-682 and DD-693…DD-697 implement already-verified *different* compositions. This candidate must read a Conversation once and then its persisted Assistant, PromptTemplate, optional ToolSet directly. It must **not** chain those readers and reread the same record, silently equate the two floor predicates, or claim a cross-read atomic database snapshot.

**Source determination:** SOURCE-COMPLETE **only** for an internal, non-authorizing evidence envelope that combines both already-governed direct relationship floors, reusing the exact existing read ports and the original RequestContext. No product rule, authorization surface, SQL permission, scope widening, principal currentness or migration is proposed.

## 2. Frozen implementation boundary — not authorized until audit HEAD passes

**DD-698 — exact scoped Conversation first.** New internal function `loadAIConversationAssistantReferencesCurrentEvidence({requestContext,conversationId},conversationReader,assistantReader,promptTemplateReader,toolSetReader)`. Read one exact Conversation under the identical original RequestContext object. Null short-circuits all further reads; dependency error propagates unchanged. Validate required persisted Conversation UUID/Tenant/scope shape before child dependency access. Do not list, join or traverse other conversations.

**DD-699 — unbound branch.** When `assistantDefinitionId` is exactly `undefined`, evaluate the existing DD-185 unbound branch with no Assistant, and return frozen `{conversation}` containing the original raw reference. Zero Assistant/PromptTemplate/ToolSet reads. Invalid Conversation scope/identity fails closed; a missing binding never authorizes fallback selection.

**DD-700 — bound AssistantDefinition.** Require a well-formed exact persisted AssistantDefinition UUID and Conversation shape before another read. Perform exactly one DD-117 scoped Assistant read with the persisted id and original RequestContext. Null/invisible Assistant fails closed; errors propagate unchanged. Require existing DD-185 exact id/ACTIVE/applicability. Only then continue; do not invent current effective selection or probe a different scope.

**DD-701 — mandatory PromptTemplate.** Validate exact `assistant.promptTemplateId` UUID before any Prompt read. Read once with DD-115 under identical RequestContext; null/invisible Template fails closed and errors propagate unchanged. The DD-179 exact-id/ACTIVE/definition-containment predicate must eventually succeed; PromptTemplate version/content/approval metadata remain untouched and uninterpreted.

**DD-702 — optional ToolSet + evidence boundary.** If `assistant.toolSetId` is exactly `undefined`, do **not** read a ToolSet; require DD-179 with the supplied Assistant and PromptTemplate and absent ToolSet, return frozen `{conversation,assistant,promptTemplate}`. If present, validate exact UUID before ToolSet access, read precisely that id once under the same RequestContext, reject null/invisible/mismatched/non-ACTIVE/wrong-scope ToolSet by DD-179, and return frozen `{conversation,assistant,promptTemplate,toolSet}`. Both envelopes keep original object references. Dependency errors propagate without retry, impersonation or fallback. No public API or combined atomic snapshot is asserted.

## 3. Frozen executable acceptance (proposal)

- **AICONV-ASTREF-BASE-001:** original conversationId used once under the identical RequestContext object; missing Conversation short-circuits all dependencies.
- **AICONV-ASTREF-BASE-002:** Conversation reader errors preserve error identity, with no subsequent reads.
- **AICONV-ASTREF-UNBOUND-001:** valid TENANT_CORE/INDUSTRY unbound Conversation returns frozen one-record evidence with no dependency reads or default Assistant.
- **AICONV-ASTREF-UNBOUND-002:** malformed Conversation id, Tenant, scope or Industry shape rejects before bound dependency read.
- **AICONV-ASTREF-AST-001:** bound Assistant exact persisted id read once, same RequestContext; DD-185 ACTIVE/applicable relationship accepted.
- **AICONV-ASTREF-AST-002:** malformed/missing/wrong-id/invisible/non-ACTIVE/foreign-Tenant/sibling-Industry Assistant fails or propagates without Prompt/ToolSet reads.
- **AICONV-ASTREF-PROMPT-001:** mandatory PromptTemplate exact persisted id read once, unchanged RequestContext; DD-179 ACTIVE/containment accepts applicable PLATFORM/TENANT/INDUSTRY Template.
- **AICONV-ASTREF-PROMPT-002:** absent/invisible/malformed/wrong-id/inactive/foreign/sibling PromptTemplate or reader exception fails/propagates; never read ToolSet when Prompt prerequisite fails.
- **AICONV-ASTREF-TOOL-001:** absent ToolSet id performs zero ToolSet reads; present valid id reads exactly once and DD-179 denies wrong-id/inactive/foreign/sibling ToolSet; preserve raw references in frozen three-/four-record envelope.
- **AICONV-ASTREF-BOUND-001:** all metadata remains raw, no version/approval/capability/member/currentness/owner/history/content/retention/effective-Assistant/model/provider/entitlement/RAG/tool/agent/inference/API/UI/write authority, and no atomicity assumption.

Projected Core delta **+10 acceptance tests** (1685 → 1695) *only if implemented and independently verified*. PostgreSQL **540**, database inventory **48 migrations / 42 SQL verification files**, Web unchanged, subject to future exact-HEAD evidence; these are targets, not results.

## 4. Ordered gates and invariant preservation

1. Commit this **source audit only**; independently obtain Core/PostgreSQL/Database/Web PASS at this exact audit HEAD. If any gate fails, STOP and fix the smallest root cause forward-only.
2. Only after (1), implement the frozen internal reader and exact tests with no SQL/RLS/grant/role changes and no test weakening. Independently verify implementation HEAD.
3. Only after (2), promote canonical DD-17/18/19, development manifest and active projection state without historical replacement; verify promotion exact HEAD separately.
4. Only after (3), publish final checkpoint closure and independently verify its HEAD before the next batch. Never claim production readiness from these bounded read checks.

Preserve **9 equal Industries / 41 canonical Management Systems / 181 Industry tables / 2,962 original source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as the two Tenant app classes. RawSource immutable; `main` untouched; PR #2 open/draft/unmerged; no force-push, requirement invention, API/UI execution or role-specific mobile binaries. **Production readiness NOT CLAIMED.**
