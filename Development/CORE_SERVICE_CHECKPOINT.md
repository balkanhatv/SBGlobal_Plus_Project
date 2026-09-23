# CORE SERVICE CHECKPOINT — DEV-AI-CONVERSATION-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `287fa3d06db72c49479b3615b296f32c9d3ea06d` / tree `2ff750905d8ce6bdb4f47befb81500e976483ce5`: **311/311 Core**, **287/287 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `713e82a6dbb313272ab3d85de8f0fe7cc82b7b95` / tree `c5edeb5f7aa6017ac9ea8f132c25563f5289386d`: Core run `35827411376` (Core job `107072092222`, PostgreSQL job `107072091951`), Database run `35827411348` (job `107072091699`), Web run `35827411353` (job `107072092327`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 121 unique DD definitions**.

## Implemented boundary

DD-121 adds an exact-by-id owner-principal-scoped `core_ai.ai_conversation` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. Tenant/principal and exact-Industry FORCE-RLS, raw scope/sensitivity/retention/status and timestamp evidence remain persisted conversation metadata only. The reader does not load messages, aggregate/carry history, select/revalidate an Assistant, execute retention/erasure, route or perform inference. Existing migration-owned conversation DML authority remains unchanged.

`AICONV-PG-001`…`AICONV-PG-007` prove exact immutable owner-principal scoped conversation read, sibling-Industry/same-Tenant-principal/foreign-Tenant/platform isolation, Tenant-Core owner visibility from same-Tenant Industry context, safe missing/malformed/route-mismatch behavior, and preservation of raw text/timestamp evidence without history/Assistant/retention/execution APIs.

## Remaining scope

Conversation listing/search/history aggregation, cross-Industry history carry-over, AIMessage/content access, retention/erasure execution, sensitivity-policy evaluation, Assistant selection/revalidation, prompt/PromptSet resolution, effective AI configuration/provisioning, provider/model routing/fallback, entitlement/permission/budget/residency evaluation, tool/agent execution, credentials, inference/embeddings/RAG and Workflow/Automation runtime semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open conversation history aggregation/message content, effective Tenant/Industry AI configuration, AIProvisioningSnapshot compilation/current-selection, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD121_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
