# CORE SERVICE CHECKPOINT — DEV-AI-PROVIDER-CATALOG-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `b75b6b2fe93be4dcea2ff5ed9020e66acde03e08` / tree `2a80273e064e7cce7bb8dcb82b6e2f25493f4e9c`: **311/311 Core**, **190/190 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **531 blobs / 214 Markdown / 137 source / 78 test files**.

Promotion invariant gate `0a230cd6828a84fd6112ee00b1a75333d65ec1c4`: Core run `35726430207`, Database run `35726430210`, Web run `35726430254` — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements**.

## Implemented boundary

DD-107 adds an exact-by-id global `core_ai.ai_provider` catalog metadata reader through the dedicated `sbg_ai_gateway_rw` boundary. `credential_ref` is deliberately absent from the SQL projection and returned contract. Raw status/health and catalog metadata remain evidence only and do not authorize provider/model selection, eligibility, routing, fallback/retry, secret resolution, SDK/inference, RAG, assistant, agent/tool, tenant/industry AI-policy, budget/quota, or other concrete AI Gateway execution semantics. DD-101–106 exhaust the six Workflow/Automation raw persistence readers; their execution/mutation semantics remain unclaimed. No migration, verification SQL, role, grant, RLS policy, or product-policy change is introduced by DD-107.

`AIPROV-PG-001`…`AIPROV-PG-005` prove exact metadata read and immutability, missing/malformed identifier handling, schema-valid empty/null evidence preservation, non-authorizing raw status/health, secret-reference non-disclosure, and SELECT-only provider-catalog authority through the dedicated AI role.

## Remaining scope

Concrete AI Gateway provider/model selection, routing, eligibility, health-based decisions, credential retrieval/resolution, tenant/industry allowlists, sensitivity/residency decisions, quota/budget execution, scoring/fallback/retry, provider SDK/inference, `AIProvisioningSnapshot` compilation/current-selection, prompt/policy evaluation, RAG/assistant/agent/tool execution and Workflow/Automation execution/mutation semantics remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete AI persistence slice. Do not pre-authorize ai_model or open concrete AI Gateway provider/model selection, routing, secret resolution, fallback/retry, inference, RAG, assistant, agent/tool execution, AIProvisioningSnapshot current-selection, prompt/policy evaluation, or Workflow/Automation runtime semantics without source-owned authority.

Evidence: `Registers/DEVELOPMENT_DD107_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
