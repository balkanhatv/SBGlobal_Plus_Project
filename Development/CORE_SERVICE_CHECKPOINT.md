# CORE SERVICE CHECKPOINT — DEV-AI-TOOL-DEFINITION-CATALOG-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `c8a074dfc8bccf8c9deabd6ab7fa1e434be42f02` / tree `3783cd76c9cd83a9ad29a1cd33f14800b5ff3406`: **311/311 Core**, **210/210 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `4d9f53a08ce7096f44f04abee4c6f5ae75e25fe8` / tree `fc9ed9a8c8b8531045aa49552dca5b3095e67de3`: Core run `35814192221` (Core job `107032087794`, PostgreSQL job `107032087898`), Database run `35814192200` (job `107032087583`), Web run `35814192248` (job `107032087910`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 110 unique DD definitions**.

## Implemented boundary

DD-110 adds an exact-by-id global `core_ai.ai_tool_definition` catalog metadata reader through the dedicated `sbg_ai_gateway_rw` boundary. Governed `scopeClass` and `sideEffectClass`, capability/OperationContract references, permission/entitlement references, schema versions, approval-policy reference, idempotency flag, audit class, raw status/version and timestamps remain persisted catalog evidence only; they do not authorize runtime eligibility, permission/entitlement, approval, routing, invocation or execution. No Tenant/Industry RequestContext, migration, schema, verification SQL, role, grant, RLS policy, product-policy or public-route change is introduced by DD-110.

`AITOOLDEF-PG-001`…`AITOOLDEF-PG-005` prove exact immutable tool-definition metadata read, missing/malformed identifier handling, nullable/schema-valid raw evidence preservation, non-authorizing catalog facts, and SELECT-only tool-definition catalog authority through the dedicated AI role.

## Remaining scope

Tool eligibility/authorization, permission and entitlement evaluation, effective Tenant/Industry AI configuration or provisioning, ToolSet/Assistant/Agent/provider/model/prompt/policy/route selection, scope-to-resource interpretation, side-effect or approval enforcement, OperationContract/DTO execution, idempotency reservation, audit append, tool invocation, agent planning/execution, credential resolution, provider SDK/inference/RAG and Workflow/Automation runtime semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open provider/model selection, eligibility/routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant/agent/tool execution, `AIProvisioningSnapshot` compilation/current-selection, prompt/policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD110_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
