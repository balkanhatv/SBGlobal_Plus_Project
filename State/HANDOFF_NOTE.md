# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-AI-ASSISTANT-DEFINITION-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `cf751319c9c89ca9044a941326dc05ce2382de68` / tree `8c190ae8463e69b7bbdafa94cd83d1e4891e7455`: **311/311 Core**, **259/259 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `9af95e7b0772af0b2ebea99e422e0f6db7261cc2` / tree `e2aebb22879f9a6103535d630bea2aa740a6d6ae`: Core run `35822089332` (Core job `107055915625`, PostgreSQL job `107055915351`), Database run `35822089471` (job `107055916001`), Web run `35822089336` (job `107055915234`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 117 unique DD definitions**.

DD-117 adds an exact-by-id scoped `core_ai.assistant_definition` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. FORCE-RLS scope, raw code/status, immutable allowed-capability set, immutable RAG-scope JSON, prompt/tool/model/retention references, positive version and timestamps remain persisted definition evidence only. The reader intentionally does not revalidate referenced capability, PromptTemplate or ToolSet current activity and does not select or execute an Assistant. Existing migration-owned AssistantDefinition DML authority remains unchanged; PLATFORM mutation remains protected by migration 0032.

Read `Development/AI_ASSISTANT_DEFINITION_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` and `Registers/DEVELOPMENT_DD117_VERIFICATION_2026-09-23.md` before extending AI behavior.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open Assistant current selection, capability eligibility, prompt rendering, effective ToolSet resolution, RAG execution, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, agent/tool execution, `AIProvisioningSnapshot` compilation/current-selection, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

RawSource accepted blobs remain immutable; `main` is not merged by this continuation; PR #2 remains draft/unmerged unless explicitly authorized.
