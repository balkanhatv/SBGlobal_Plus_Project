# CORE SERVICE CHECKPOINT — DEV-AI-TENANT-CONFIG-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `20f7f4929eaef9a5eee23fd601efa35c44c35139` / tree `63685b07fb9ac60f63aa8b081130fb905e4b327b`: **311/311 Core**, **273/273 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `1ea88e19e17b1157a55133e3f6dbf7e5fe4c0360` / tree `02a7ea6d3a22e35a149f01f140d8d352345359fd`: Core run `35825278568` (Core job `107065518567`, PostgreSQL job `107065518916`), Database run `35825278683` (job `107065518957`), Web run `35825278656` (job `107065519027`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 119 unique DD definitions**.

## Implemented boundary

DD-119 adds an exact-by-id Tenant-scoped `core_ai.tenant_ai_config` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. Tenant FORCE-RLS, raw enablement, capability/provider/model allowlists, sensitivity ceiling, policy references, positive version and updated timestamp remain persisted configuration evidence only. The reader does not select latest/current/effective Tenant configuration, compile provisioning, evaluate eligibility/policy or route/execute AI. Existing migration-owned TenantAIConfig DML authority remains unchanged.

`AITENCFG-PG-001`…`AITENCFG-PG-007` prove exact immutable Tenant config read, same-Tenant Core/Industry visibility, foreign-Tenant isolation, PLATFORM_GLOBAL non-bypass, exact-version separation, safe missing/malformed/route-mismatch behavior, and preservation of existing database write governance without exposing mutation/latest/effective/provision/route/execute methods through the new port.

## Remaining scope

Latest/current/effective TenantAIConfig selection, current catalog revalidation, IndustryAIConfig merge/narrowing, AIProvisioningSnapshot compilation/current selection/validity, entitlement/subscription/permission/sensitivity/residency/budget/retention/prompt-override evaluation, provider/model routing/fallback, prompt/assistant/agent/tool selection/execution, credentials, inference/embeddings/RAG/media generation and Workflow/Automation runtime semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open latest/effective Tenant/Industry AI configuration, AIProvisioningSnapshot compilation/current-selection, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD119_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
