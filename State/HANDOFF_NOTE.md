# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-AI-PROMPT-SET-MEMBER-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `33649045e4cf6de2f043614ad07c26ed957ca241` / tree `9749a789be340dffc7b7e502715a5619e8f06624`: **311/311 Core**, **238/238 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `c487cb825494bc53fc794202dbe691c8d050f61c` / tree `6e0943855ddcce4cd3dd7bf0f59d24a55a1a7784`: Core run `35819342841` (Core job `107047649300`, PostgreSQL job `107047649020`), Database run `35819342753` (job `107047648783`), Web run `35819342805` (job `107047648893`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 114 unique DD definitions**.

DD-114 adds an exact-by-id scoped `core_ai.ai_prompt_set_member` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. Child-row visibility remains parent-derived FORCE-RLS. The reader returns only member id, PromptSet id, PromptTemplate id, raw integer priority, raw enabled flag and created timestamp. It does not calculate effective membership, order/select prompts, revalidate execution eligibility, render a PromptTemplate or execute a prompt. Existing database DML privileges remain migration-owned; PLATFORM-parent writes remain protected by existing definition-member/control-plane policies.

Read `Development/AI_PROMPT_SET_MEMBER_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` and `Registers/DEVELOPMENT_DD114_VERIFICATION_2026-09-23.md` before extending AI behavior.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open effective PromptSet membership, prompt rendering/composition, IndustryAIConfig current resolution, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution, `AIProvisioningSnapshot` compilation/current-selection, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

RawSource accepted blobs remain immutable; `main` is not merged by this continuation; PR #2 remains draft/unmerged unless explicitly authorized.
