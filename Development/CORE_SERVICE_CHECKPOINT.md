# CORE SERVICE CHECKPOINT — DEV-AI-PROVISIONING-SNAPSHOT-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `93db1dae4bbc10909c51232d94dc13aec247ec69` / tree `5a7510fab07a19407e1127e1999af93a5e858844`: **311/311 Core**, **308/308 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `d6ade8bf87ddc37588a3a3d34cff515113461302` / tree `3760b41f7e38855d2fd8eae63e5592c89eb31ccb`: Core run `35832764410` (Core job `107088983081`, PostgreSQL job `107088982864`), Database run `35832764430` (job `107088983127`), Web run `35832764276` (job `107088981999`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 124 unique DD definitions**.

## Implemented boundary

DD-124 adds an exact-by-id Tenant/Industry-scoped `core_ai.ai_provisioning_snapshot` raw persistence reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. Snapshot FORCE-RLS, exact bigint-text commercial/config/activation/version references, frozen MS/country pack maps, governed/raw allowlists, optional budget-policy reference, raw status and compile/valid-until timestamps remain persisted evidence only. The reader does not select a current snapshot, evaluate wall-clock validity, compile/recompile provisioning, revalidate stale source versions, authorize capabilities or route/execute AI. Existing migration-owned ProvisioningSnapshot DML authority remains unchanged.

`AIPROVSNAP-PG-001`…`AIPROVSNAP-PG-007` prove exact immutable snapshot read, sibling-Industry and foreign-Tenant isolation, same-Tenant Tenant-Core visibility, principal non-ownership, exact bigint-text preservation, frozen maps/sets, safe missing/malformed/route-mismatch behavior, and absence of current-selector/compile/revalidate/authorize/route/execute methods on the new port.

## Remaining scope

Current/latest ProvisioningSnapshot selection, wall-clock validity evaluation, snapshot compilation/recompilation, current Subscription/EntitlementSnapshot/TenantAIConfig/Industry-activation revalidation, effective Tenant+Industry configuration merge, capability/API/provider/model-class eligibility, permission/entitlement/budget/residency/sensitivity evaluation, provider/model routing/fallback, prompt/Assistant/Agent/Tool selection/execution, credentials, inference/embedding/RAG/media generation and Workflow/Automation runtime semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open ProvisioningSnapshot compilation/current-selection, effective eligibility/authorization/routing, provider/model selection, secret resolution, fallback/retry, inference/embedding, RAG, media generation, assistant/agent/tool execution, prompt-policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD124_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
