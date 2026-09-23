# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-AI-AGENT-DEFINITION-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `5875b5ddf7b6a5b80f40cbb30dcc21015b96805e` / tree `c4468cd7975eafb9f4fc95c042d55f20824d0a9e`: **311/311 Core**, **266/266 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `fabf46efd14a74d4f2d7d1383bfc96af3de8322a` / tree `d5b096b14b83198ef50b3b0cde553b53a53aa2d0`: Core run `35822809880` (Core job `107058085907`, PostgreSQL job `107058085730`), Database run `35822809882` (job `107058085633`), Web run `35822809806` (job `107058085407`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 118 unique DD definitions**.

DD-118 adds an exact-by-id scoped `core_ai.agent_definition` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. FORCE-RLS scope, raw code/objective/risk/status, allowed ToolSet, approval-policy and budget-policy references, positive version and timestamps remain persisted definition evidence only. The reader intentionally does not revalidate the referenced ToolSet current activity and does not select, authorize, approve, budget or execute an Agent. Existing migration-owned AgentDefinition DML authority remains unchanged; PLATFORM mutation remains protected by migration 0032.

Read `Development/AI_AGENT_DEFINITION_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` and `Registers/DEVELOPMENT_DD118_VERIFICATION_2026-09-23.md` before extending AI behavior.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open AgentRun/AgentStep/AgentApproval runtime, agent planning/execution, effective ToolSet resolution, approval/budget semantics, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, `AIProvisioningSnapshot` compilation/current-selection, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

RawSource accepted blobs remain immutable; `main` is not merged by this continuation; PR #2 remains draft/unmerged unless explicitly authorized.
