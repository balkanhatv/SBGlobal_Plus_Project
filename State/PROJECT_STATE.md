# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-AI-PROMPT-TEMPLATE-READ-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified executable `fb7785401fce27a04bf4c2c08ea80889ae23e862` / tree `275d190e367608c59c6fd059591a67a0fb9cfdb0`: **311/311 Core**, **245/245 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `a6f7fb3a648b138f7a8f7351010d82efd22a2547` / tree `7f4dcd45ccf671f86b93db0216c2ae2990d858b2`: Core run `35820283077` (Core job `107050457264`, PostgreSQL job `107050457139`), Database run `35820283083` (job `107050457103`), Web run `35820283086` (job `107050457195`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 115 unique DD definitions**.

DD-115 adds an exact-by-id scoped `core_ai.prompt_template` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. FORCE-RLS scope, raw code/template text, positive version, immutable variable-schema JSON, grounding flag, ordered override fields, lifecycle status, creator/optional approver references and timestamps remain persisted evidence only. The new port is read-only; it does not select ACTIVE/current versions, satisfy approval, validate/render templates, authorize overrides or execute prompts. Existing migration-owned PromptTemplate DML authority remains unchanged, while PLATFORM mutation remains protected by migration 0032.

Invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables**, **2,962 unchanged source requirement IDs/text**, and contiguous **ADR-001–020 / DD-001–115**.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open PromptTemplate rendering/execution, effective PromptSet membership, IndustryAIConfig current resolution, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution, `AIProvisioningSnapshot` compilation/current-selection, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD115_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs remain immutable; `main` is not merged by this continuation; PR #2 remains draft/unmerged unless explicitly authorized.
