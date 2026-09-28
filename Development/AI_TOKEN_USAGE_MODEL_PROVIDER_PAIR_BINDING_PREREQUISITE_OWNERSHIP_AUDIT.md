# AI TokenUsage model/provider pair binding prerequisite ownership audit

**Date:** 2026-09-25
**Baseline checkpoint:** `DEV-AI-RAG-CHUNK-EMBEDDING-MODEL-ELIGIBILITY-FLOORS-001`
**Verified closure HEAD:** `de5e2ef52099edccdea625008f4d4e03fea74c85`
**Verified tree:** `7a3c6204c7a6496ad288933755f28f6eb89de32a`

## Entry gate

DD-195 state closure is exact-head verified. Core Service Verify run `36156464923` passed Core job `108142101077` at **612/612** and PostgreSQL job `108142101659` at **504/504** plus database bootstrap PASS. Database Verify run `36156464908` / job `108142099608` passed. Web Boundary Verify run `36156464738` / job `108142099918` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0012 persists non-null `core_ai.token_usage.provider_id` and `model_id`. Migration 0031 adds:

`FOREIGN KEY (model_id, provider_id) REFERENCES core_ai.ai_model(id, provider_id)`.

DD-122 exposes TokenUsage `id`, Tenant/optional Industry, `providerId` and `modelId` as immutable raw evidence. DD-108 exposes AIModel `id` and `providerId`. Therefore the composite pair relationship is source-complete without a new reader, schema, RLS, role or grant.

This FK proves only that the persisted TokenUsage model/provider pair pointed to one AIModel row carrying the same provider id at write time/current storage integrity. It does not prove that the Model or Provider is currently ACTIVE, healthy, eligible, routable, entitled, resident-compatible or approved for new execution.

Migration 0031 separately checks a non-null TokenUsage principal with `principal_is_active_for_tenant(..., occurred_at)`. That principal-currentness predicate is **not** part of DD-196 and remains subject to the existing request/elevation provenance limitation class.

TokenUsage `capability_code` also has its own foreign key to AICapability and is a separate relationship.

## Determination and locked DD-196 detailed contract

**SOURCE-COMPLETE for TokenUsage → AIModel exact model/provider pair continuity only.**

Authorize pure helper:

`matchesAITokenUsageModelProviderBindingFloors(usage, model?)`

It accepts one DD-122 `PersistedAITokenUsage` and optional DD-108 `AIModelCatalogMetadata`, returns boolean and never mutates inputs.

1. Validate relevant TokenUsage id/Tenant/optional Industry/model/provider UUID shape.
2. Require supplied model evidence with valid model id/provider id shape.
3. Require exact `model.id === usage.modelId`.
4. Require exact `model.providerId === usage.providerId`.
5. Model status/version/capabilities/modalities/residency/sensitivity/cost/latency/metadata remain uninterpreted.
6. TokenUsage principal/capability/units/occurredAt/correlation evidence remain uninterpreted.
7. No separate Provider row is required and no runtime/currentness/routing semantics are inferred.

## Fixed acceptance before implementation

- **AIUSAGE-MODEL-CUR-001**: exact TokenUsage Model/Provider pair passes.
- **AIUSAGE-MODEL-CUR-002**: missing model evidence or wrong Model id fails closed.
- **AIUSAGE-MODEL-CUR-003**: Model provider id must exactly equal TokenUsage provider id.
- **AIUSAGE-MODEL-CUR-004**: malformed relevant usage/model identity or pair shape fails closed.
- **AIUSAGE-MODEL-CUR-005**: Model runtime/catalog semantics are uninterpreted and no Provider evidence is required.
- **AIUSAGE-MODEL-CUR-006**: TokenUsage principal/capability/unit/time/correlation evidence is uninterpreted.
- **AIUSAGE-MODEL-CUR-007**: inputs remain unchanged and a true result grants no routing, authorization, billing or execution authority.

Expected executable delta: Core **612 → 619**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not Provider/Model ACTIVE/current/health/credential status, capability/modality/residency/sensitivity eligibility, entitlement, principal currentness, routing/fallback, quota/budget, cost/billing, inference, embeddings, media, RAG, tool or agent execution. It changes no schema/RLS/role/grant/route/product policy.

After DD-196 is implemented and exact-head verified, source-audit the independent TokenUsage capability-code relationship or another source-owned AI persistence relationship.
