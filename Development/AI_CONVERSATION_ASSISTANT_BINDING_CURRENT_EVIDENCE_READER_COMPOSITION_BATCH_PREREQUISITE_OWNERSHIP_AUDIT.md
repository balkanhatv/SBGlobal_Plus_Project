# AIConversation optional AssistantDefinition current-binding evidence — source/prerequisite ownership audit

**Date:** 2026-10-08
**Completed entry batch:** DD-673…DD-677; state consistency correction verified independently before this source audit.
**Frozen candidate:** DD-678…DD-682
**Status:** Source-audit only. Implementation requires this source-audit commit to pass its own exact-head Core/PostgreSQL/Database/Web gates.

## Entry verification

Entry correction HEAD `ff3b00e9947b2670550f0498649266efca239b72` / tree `411996d9f9e1c6ba5ea50d9e7c3497a80067189d` passed Core run `37804882009` / job `113406429803` **1649/1649**, PostgreSQL job `113406430248` **540/540** (zero failed/skipped; full bootstrap), Database run `37804882026` / job `113406429806` **48/42 PASS**, Web run `37804881973` / job `113406429462` **PASS**. The stale DD-208 PR description and secondary active manifest projections were reconciled before this batch. DD-677 feature proof remains unchanged. PR #2 is draft/unmerged; main and RawSource are unchanged.

## Source owners and determination

- DD-09 §17 owns conversation Tenant/Industry/principal ownership and the prohibition on automatic cross-Industry history carry. A relationship read is not history access or AI execution.
- DD-121 and migration 0012 own `AIConversationReadPort.loadForContext({requestContext,conversationId})`: one exact UUID, owner-principal + Tenant/Industry FORCE-RLS, raw immutable conversation metadata and optional persisted `assistantDefinitionId`. Same-Tenant Tenant-Core visibility from an Industry request is not permission to carry history.
- DD-117 owns `AIAssistantDefinitionReadPort.loadForContext({requestContext,assistantDefinitionId})`: one exact id, current scoped visibility, raw immutable metadata. PLATFORM definitions are not implicit Tenant fallback; a null scoped lookup must not trigger a PLATFORM_GLOBAL context or privileged read.
- Migration 0031 `validate_ai_relationships` for `ai_conversation` and DD-185 own the optional direct Assistant relationship. `matchesAIConversationAssistantBindingFloors(conversation,assistant?)` requires valid conversation id/Tenant/scope shape, absent binding with no assistant evidence, or exact assistant id + raw ACTIVE + applicable PLATFORM/TENANT/INDUSTRY owner shape.
- Owner-principal currentness and DD-179 nested Assistant PromptTemplate/ToolSet validation are independent. The existing DD-185 boundary explicitly excludes both; this composition cannot turn relationship evidence into either authority.

**Determination:** SOURCE-COMPLETE for an internal read-only composition of two existing ports and one existing direct relationship predicate. No new product rule, SQL policy, status meaning, AI route or execution permission is introduced. The pure PLATFORM applicability case does not widen the actual read port's RLS visibility.

## Frozen decisions

**DD-678 — exact scoped conversation evidence first.** Add `loadAIConversationAssistantBindingCurrentEvidence({requestContext,conversationId},conversationReader,assistantReader)`. Call the conversation port exactly once with the original RequestContext object and conversation id. Null short-circuits before AssistantDefinition access; dependency errors propagate unchanged.

**DD-679 — unbound conversation branch.** If the persisted `assistantDefinitionId` is absent, apply only the existing DD-185 predicate without assistant evidence. Valid TENANT_CORE or TENANT_INDUSTRY shape returns frozen `{conversation}` with the exact record reference; malformed id/Tenant/scope fails closed. Perform zero assistant reads.

**DD-680 — exact optional AssistantDefinition read.** For a present binding, validate the existing UUID and conversation scope-shape prerequisites before dependency access, then read the exact persisted assistant id once under the identical RequestContext object. Missing/invisible AssistantDefinition returns null; dependency errors propagate unchanged. No alternate id, code/version selection, retries, context switch, privileged read or visibility fallback.

**DD-681 — direct relationship and immutable evidence.** Reapply `matchesAIConversationAssistantBindingFloors` to the exact returned conversation/assistant records. Require only DD-185 exact id, raw ACTIVE and applicable owner relationship. Return frozen `{conversation,assistant}` preserving references and raw owner, status, retention, sensitivity, timestamps, version and policy fields. Do not mutate/normalize the records or interpret conversation status/timestamp order.

**DD-682 — evidence-only boundary.** The result does not authorize conversation-owner activity, history/message disclosure, retention/erasure, Assistant selection, nested prompt/ToolSet validation, cross-context history carry, RAG, provider/model/tool/agent execution, route mounting or mutation. RLS remains enforced by the original ports; this Core composition adds no read privilege.

## Fixed executable acceptance

- **AICONV-ASTREAD-BASE-001:** one exact conversation read first; preserve input id/context and read order.
- **AICONV-ASTREAD-BASE-002:** missing conversation and conversation dependency errors short-circuit before assistant access.
- **AICONV-ASTREAD-UNBOUND-001:** valid Core/Industry unbound rows return frozen exact conversation-only evidence with zero assistant reads.
- **AICONV-ASTREAD-UNBOUND-002:** malformed unbound id/Tenant/scope combinations fail closed before assistant access.
- **AICONV-ASTREAD-READ-001:** bound row reads the exact persisted assistant once with the same RequestContext object; no implicit context rebinding.
- **AICONV-ASTREAD-READ-002:** malformed bound identity/scope/id, null/invisible assistant and assistant dependency errors deny/propagate without fallback.
- **AICONV-ASTREAD-FLOOR-001:** DD-185 ACTIVE exact applicable PLATFORM/TENANT/INDUSTRY relationships pass on supplied evidence; Tenant-Core rows remain Tenant-Core even when the request context is Industry-scoped.
- **AICONV-ASTREAD-FLOOR-002:** wrong assistant id, non-ACTIVE status, malformed owner, foreign Tenant, sibling Industry or Industry assistant for Tenant-Core conversation fails closed.
- **AICONV-ASTREAD-EVID-001:** envelope is frozen; both raw references, raw conversation status/retention/sensitivity/timestamps and assistant metadata are unchanged.
- **AICONV-ASTREAD-BOUND-001:** no history/owner/retention/erasure/current-Assistant/cross-context/prompt/RAG/provider/tool/AI-execution authority is returned or inferred.

Expected Core **1649 → 1659** (10 new contract tests). PostgreSQL **540** and Database **48 migrations / 42 verification files** unchanged.

## Exclusions and next gate

No schema, RLS, grants/roles, database adapter, RequestContext identity resolution, principal-currentness rule, REST/tRPC route, UI, worker, provider SDK, RawSource or requirement inventory change. No status or timestamp semantics beyond DD-185.

This source-audit HEAD must pass Core/PostgreSQL/Database/Web before implementation. If any gate fails, stop forward work and apply the smallest forward-only correction. Implementation then requires its own exact-head verification before canonical promotion and state closure. PR #2 stays draft/unmerged; main is unchanged; no force-push or production readiness claim.
