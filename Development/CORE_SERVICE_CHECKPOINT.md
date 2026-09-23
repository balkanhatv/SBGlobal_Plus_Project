# CORE SERVICE CHECKPOINT — DEV-AI-INDUSTRY-CONFIG-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `2b39ea1c30a7390ed74fafa52c3cd7f8a3174a28` / tree `b4df91c5c86f2359e2059853f88094510e2bea88`: **311/311 Core**, **280/280 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `16e42728cf99b6de5bfe1a6f71d6b70123e28b4c` / tree `83de860bab4c521a11261f914206704b63231954`: Core run `35826376524` (Core job `107068901340`, PostgreSQL job `107068901501`), Database run `35826376396` (job `107068901371`), Web run `35826376433` (job `107068901052`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 120 unique DD definitions**.

## Implemented boundary

DD-120 adds an exact-by-id exact-Industry `core_ai.industry_ai_config` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. Exact Tenant+Industry FORCE-RLS, raw enablement, capability/provider/model allowlists, optional domain PromptSet, country-pack refs, localization-profile reference, positive version and updated timestamp remain persisted configuration evidence only. The reader does not select latest/current Industry configuration, merge Tenant+Industry configuration, revalidate current narrowing inputs, compile provisioning, evaluate policy/eligibility or route/execute AI. Existing migration-owned IndustryAIConfig DML authority remains unchanged.

`AIINDCFG-PG-001`…`AIINDCFG-PG-007` prove exact immutable Industry config read, Tenant Core/sibling/foreign-Tenant/PLATFORM non-visibility, exact-version separation, nullable/empty raw evidence preservation, safe missing/malformed/route-mismatch behavior, and preservation of existing database write governance without exposing mutation/latest/effective/Tenant-merge/provision/route/execute methods through the new port.

## Remaining scope

Latest/current/effective IndustryAIConfig selection, Tenant+Industry merge, current TenantAIConfig/catalog/country-pack/domain-PromptSet revalidation, effective PromptSet membership, AIProvisioningSnapshot compilation/current selection/validity, entitlement/subscription/permission/sensitivity/residency/budget/retention/prompt-policy evaluation, provider/model routing/fallback, prompt/assistant/agent/tool selection/execution, credentials, inference/embeddings/RAG/media generation and Workflow/Automation runtime semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open effective Tenant/Industry AI configuration, AIProvisioningSnapshot compilation/current-selection, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD120_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
