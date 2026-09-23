# CORE SERVICE CHECKPOINT — DEV-AI-PROMPT-SET-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `14cf54776df8446f1a83c66c834421cf5119614c` / tree `b1163db6fc833ec5810bbb049da0bee6728f7a2e`: **311/311 Core**, **224/224 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `7e4d5e18aabb8a2a8950ebb0eeba46ab6713bc19` / tree `4a8136c832137f604c032a4f8342da47b19fa1bf`: Core run `35817372068` (Core job `107041678390`, PostgreSQL job `107041678174`), Database run `35817372133` (job `107041678241`), Web run `35817372062` (job `107041678180`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 112 unique DD definitions**.

## Implemented boundary

DD-112 adds an exact-by-id owner-scoped `core_ai.ai_prompt_set` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. PLATFORM/TENANT/INDUSTRY ownership, raw code, positive version, constrained lifecycle status and timestamps remain persisted definition evidence only; they do not select an ACTIVE/current PromptSet, resolve members, select/render PromptTemplates, resolve IndustryAIConfig prompt binding or execute prompts. Existing schema-owned Tenant/Industry PromptSet DML privileges of `sbg_ai_gateway_rw` remain unchanged, while migration-0032 continues to protect PLATFORM PromptSet writes behind the control-plane role.

`AIPROMPTSET-PG-001`…`AIPROMPTSET-PG-007` prove exact scoped raw PromptSet read, sibling-Industry and foreign-Tenant isolation, same-Tenant visibility, PLATFORM_GLOBAL-only platform read, safe missing/malformed/route-mismatch behavior, and preservation of existing database write governance without exposing mutation/selection/render/execution methods through the new port.

## Remaining scope

ACTIVE/current/latest PromptSet selection, code/version fallback, PromptSet member loading/priority/enabled filtering, effective prompt-set calculation, PromptTemplate approval/publication/selection/rendering, IndustryAIConfig domain-prompt resolution, Assistant/system prompt composition, prompt-governance precedence evaluation, provider/model/policy/routing selection, tool/agent execution, credentials, inference/RAG/media generation and Workflow/Automation runtime semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open PromptSet-member effective selection, prompt rendering/composition, IndustryAIConfig prompt resolution, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution, `AIProvisioningSnapshot` compilation/current-selection, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD112_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
