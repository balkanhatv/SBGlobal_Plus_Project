# CORE SERVICE CHECKPOINT — DEV-AI-MODEL-CATALOG-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `e1e53969a3a2869e2c4612e45c65a7a3c66d2d58` / tree `f057bef288113ff61bd3575239cbabc44c756c9a`: **311/311 Core**, **200/200 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **537 blobs / 217 Markdown / 139 source / 79 test files**.

Corrected promotion invariant gate `392c928ac72c58a4347fd4ceaa89b9c90afd8d71` / tree `06a231745bfc2765be9eae4120195e9b627407b9`: Core run `35745883068` (Core job `106807278646`, PostgreSQL job `106807279082`), Database run `35745883189` (job `106807278122`), Web run `35745883110` (job `106807277653`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 108 unique DD definitions**.

## Implemented boundary

DD-108 adds an exact-by-id global `core_ai.ai_model` catalog metadata reader through the dedicated `sbg_ai_gateway_rw` boundary. `providerId`, raw status, capabilities, modality, sensitivity, residency, cost, latency and metadata values remain catalog evidence only; they do not authorize active/current/eligible/preferred model selection, provider/model routing, fallback/retry, credential resolution, inference/embedding, RAG, assistant, agent/tool, tenant/industry AI-policy, quota/budget or other concrete AI Gateway execution semantics. No Tenant/Industry RequestContext, migration, schema, verification SQL, role, grant, RLS policy or product-policy change is introduced by DD-108.

`AIMODEL-PG-001`…`AIMODEL-PG-005` prove exact immutable metadata read, missing/malformed identifier handling, schema-valid raw evidence preservation, non-authorizing catalog facts, exact provider relation evidence and SELECT-only model-catalog authority through the dedicated AI role.

## Remaining scope

Active/current/eligible/preferred model selection, provider/model routing, health/capability/modality/sensitivity/residency decisions, credential resolution, tenant/industry allowlists, quota/budget execution, scoring/fallback/retry, provider SDK/inference/embedding, `AIProvisioningSnapshot` compilation/current-selection, prompt/policy evaluation, RAG/assistant/agent/tool execution and Workflow/Automation execution/mutation semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice. Do not open provider/model selection, eligibility, routing, secret resolution, fallback/retry, inference/embedding, RAG, assistant, agent/tool execution, `AIProvisioningSnapshot` compilation/current-selection, prompt/policy evaluation or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD108_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
