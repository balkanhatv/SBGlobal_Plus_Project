# CORE SERVICE CHECKPOINT — DEV-AI-ASSISTANT-DEFINITION-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `cf751319c9c89ca9044a941326dc05ce2382de68` / tree `8c190ae8463e69b7bbdafa94cd83d1e4891e7455`: **311/311 Core**, **259/259 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `9af95e7b0772af0b2ebea99e422e0f6db7261cc2` / tree `e2aebb22879f9a6103535d630bea2aa740a6d6ae`: Core run `35822089332` (Core job `107055915625`, PostgreSQL job `107055915351`), Database run `35822089471` (job `107055916001`), Web run `35822089336` (job `107055915234`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 117 unique DD definitions**.

## Implemented boundary

DD-117 adds an exact-by-id scoped `core_ai.assistant_definition` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. FORCE-RLS scope, raw code/status, immutable allowed-capability set, immutable RAG-scope JSON, prompt/tool/model/retention references, positive version and timestamps remain persisted definition evidence only. The reader intentionally does not revalidate referenced capability, PromptTemplate or ToolSet current activity and does not select or execute an Assistant. Existing migration-owned AssistantDefinition DML authority remains unchanged; PLATFORM mutation remains protected by migration 0032.

`AIASSIST-PG-001`…`AIASSIST-PG-007` prove exact immutable scoped AssistantDefinition read, sibling-Industry and foreign-Tenant isolation, same-Tenant visibility, PLATFORM_GLOBAL-only platform read, safe missing/malformed/route-mismatch behavior, raw optional-reference/status preservation, and non-revalidation of now-retired referenced capability/PromptTemplate/ToolSet evidence without exposing mutation/select/render/RAG/execute methods through the new port.

## Remaining scope

ACTIVE/current/latest Assistant selection, code/version fallback, current capability eligibility/activity revalidation, PromptTemplate rendering, effective ToolSet/member resolution, RAG-scope interpretation/retrieval, model/retention policy resolution, provider/model/routing selection, conversation binding, RequestContext authorization/approval, tool/agent execution, credentials, inference/embeddings/RAG and Workflow/Automation runtime semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open Assistant current selection, capability eligibility, prompt rendering, effective ToolSet resolution, RAG execution, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, agent/tool execution, `AIProvisioningSnapshot` compilation/current-selection, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD117_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
