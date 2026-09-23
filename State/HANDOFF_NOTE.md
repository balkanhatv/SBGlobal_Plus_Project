# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-AI-RAG-SOURCE-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `f4b5339f0c555c6d8e6a267c97114e1e98ee3ca7` / tree `2b81ef41d405db3092bdcb02d1ec70bff4643f73`: **311/311 Core**, **329/329 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `d9fae13df32c6a4c7a820cb4f8e2b5db4dd84394` / tree `9818fc5417c001c2e84fcdda627a7093a9920e6c`: Core run `35843162507` (Core job `107122846431`, PostgreSQL job `107122847008`), Database run `35843162489` (job `107122846736`), Web run `35843162523` (job `107122847563`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 127 unique DD definitions**.

DD-127 adds an exact-by-id scoped `core_ai.rag_source` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. Tenant-Core/exact Tenant-Industry FORCE-RLS, raw source/module/MS/resource metadata, optional document id/version, constrained scope/sensitivity classes, raw residency/retention/ACL/status, exact bigint-text source version, raw chunking-policy version and timestamps remain source-registration evidence only. It does not revalidate current DocumentMeta/ACL/scan/residency, select current source versions, list chunks, execute chunking policy, select embeddings, perform vector search/retrieval/ranking/grounding, compose prompts or perform inference/RAG. Existing migration-owned RAGSource DML authority remains unchanged; the DD-127 port itself is read-only.

Read `Development/AI_RAG_SOURCE_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` and `Registers/DEVELOPMENT_DD127_VERIFICATION_2026-09-23.md` before extending AI behavior.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open effective RAG retrieval/ACL evaluation, chunk/vector search, current document authorization, provider/model routing, secret resolution, fallback/retry, inference/embedding execution, prompt-policy evaluation, assistant/agent/tool execution or Workflow/Automation runtime semantics without source-owned authority.

RawSource accepted blobs remain immutable; `main` is not merged by this continuation; PR #2 remains draft/unmerged unless explicitly authorized.
