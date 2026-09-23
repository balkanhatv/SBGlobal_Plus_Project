# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-AI-MESSAGE-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `fec7fd3a6c699f1284fe170a92ac68c1d9ecdb2e` / tree `ec0afe1fc58f3be5bf9ed34084a4cd06226a9ed5`: **311/311 Core**, **322/322 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `a3c7dafc0df0dfd01edba42f9dce85c98b9ae9c6` / tree `b66ae8e0935d65e86283624c624511555c54b2b8`: Core run `35839860371` (Core job `107112086949`, PostgreSQL job `107112086571`), Database run `35839860327` (job `107112086412`), Web run `35839860622` (job `107112087219`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 126 unique DD definitions**.

DD-126 adds an exact-by-id scoped `core_ai.ai_message` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. Message visibility remains parent-Conversation-derived FORCE-RLS and therefore Tenant/optional Industry + exact owner-principal private. The reader returns only id, Conversation id, raw role, raw content reference/encrypted content, optional immutable normalized source JSON, optional model-route UUID, created timestamp and optional deleted timestamp. It does not list/order history, interpret roles, decrypt/dereference content, authorize sources, resolve/select model routes/providers/models, evaluate retention/erasure/legal hold, reconstruct prompts or perform inference/RAG. Existing AI Gateway message DML authority remains migration-owned; the DD-126 port itself is read-only.

Read `Development/AI_MESSAGE_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` and `Registers/DEVELOPMENT_DD126_VERIFICATION_2026-09-23.md` before extending AI behavior.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open message-history runtime, decryption/source authorization, model/provider routing, retention execution, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution, prompt current-selection/policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

RawSource accepted blobs remain immutable; `main` is not merged by this continuation; PR #2 remains draft/unmerged unless explicitly authorized.
