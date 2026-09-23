# CORE SERVICE CHECKPOINT — DEV-AI-TOKEN-USAGE-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `bb4dd51ee9732be8ae95e14c72ef1d60c7bac8cb` / tree `2a3a032a2ea72191878d432c15269cdc563f7dc4`: **311/311 Core**, **294/294 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `ac679e24feb8dc12cc494bca4bd8d0e2fb9724f9` / tree `cf44eda351e6ada82e0213ecc6963408d94d0919`: Core run `35829783643` (Core job `107079469547`, PostgreSQL job `107079469612`), Database run `35829783632` (job `107079469285`), Web run `35829783642` (job `107079469687`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 122 unique DD definitions**.

## Implemented boundary

DD-122 adds an exact-by-id Tenant/Industry-scoped `core_ai.token_usage` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. FORCE-RLS scope, optional principal attribution, capability/provider/model references, PostgreSQL numeric-text input/output/media units, occurrence timestamp and correlation id remain historical usage evidence only. Principal attribution is not a TokenUsage read-ownership predicate. The reader does not revalidate current catalog status, select routes, aggregate usage, evaluate quota/entitlement, compute/load cost or execute AI. Existing migration-owned TokenUsage DML authority remains unchanged.

`AIUSAGE-PG-001`…`AIUSAGE-PG-007` prove exact immutable scoped TokenUsage read, sibling-Industry/foreign-Tenant/PLATFORM isolation, Tenant-Core same-Tenant visibility, principal-attribution non-ownership, exact PostgreSQL numeric-text evidence, safe missing/malformed/route-mismatch behavior, and historical catalog evidence without routing/billing/quota/execution methods through the new port.

## Remaining scope

Usage aggregation/meter windows, ai_cost loading/finalization, rate-card/cost/billing computation, current capability/provider/model eligibility/routing/fallback, entitlement/permission/budget/quota evaluation, conversation/message/prompt content access, effective Tenant/Industry AI configuration, AIProvisioningSnapshot compilation/current selection, credentials, inference/embeddings/RAG/media generation, assistant/agent/tool execution and Workflow/Automation runtime semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open usage aggregation/billing semantics, conversation history/message content, effective Tenant/Industry AI configuration, AIProvisioningSnapshot compilation/current-selection, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD122_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
