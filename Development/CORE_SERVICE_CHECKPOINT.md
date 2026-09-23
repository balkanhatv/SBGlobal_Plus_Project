# CORE SERVICE CHECKPOINT — DEV-AI-COST-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `38306fac5afb1b93a7ad16123e42c14bd2062f88` / tree `ba11e9b3eec3e92a749e46b0df1913a06be3e6b4`: **311/311 Core**, **301/301 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `68bbf796d747a7a96fd5a95f91472229f3bc7729` / tree `37431df2092822ae8486869b35fb7f1300cbfcbb`: Core run `35831170612` (Core job `107083868099`, PostgreSQL job `107083868071`), Database run `35831170611` (job `107083868006`), Web run `35831170615` (job `107083867936`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 123 unique DD definitions**.

## Implemented boundary

DD-123 adds an exact-by-usage-id Tenant/Industry-scoped `core_ai.ai_cost` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. Cost visibility remains parent-derived from TokenUsage FORCE-RLS. Raw currency, exact PostgreSQL bigint-text estimated minor units, provider-rate version, billable class and optional finalized timestamp remain persisted observability evidence only. The reader does not apply rates, convert currency, aggregate usage, evaluate quota/budget, finalize costs, invoice or execute AI. Existing migration-owned Cost DML authority remains unchanged.

`AICOST-PG-001`…`AICOST-PG-007` prove exact immutable cost read, sibling-Industry isolation, same-Tenant Tenant-Core visibility, principal-attribution non-ownership, foreign-Tenant/PLATFORM isolation, safe missing/malformed/route-mismatch behavior, exact bigint-text preservation and absence of pricing/billing/finalization/execution methods on the new port.

## Remaining scope

Provider-rate lookup/application, currency conversion, cost recomputation/reconciliation/finalization, usage aggregation/metering-window selection, quota/entitlement/budget evaluation, billable-class interpretation, invoice/tax/payment/dunning/ledger behavior, provider/model routing, effective AI configuration/provisioning, prompt/conversation content access, inference/RAG/media/tool/agent execution and Workflow/Automation runtime semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open pricing/billing/finalization semantics, usage aggregation, effective Tenant/Industry AI configuration, `AIProvisioningSnapshot` compilation/current-selection, provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD123_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
