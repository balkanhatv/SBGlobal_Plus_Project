# AIModel provider binding prerequisite ownership audit

**Date:** 2026-09-26
**Baseline checkpoint:** `DEV-AI-MESSAGE-CONVERSATION-BINDING-FLOORS-001`
**Verified closure HEAD:** `d80894fb8e5cddb7dfc6706a2c4238ecea9afa5b`
**Verified tree:** `68b6ffa2a836df242fc67141693912eceaabf222`

## Entry gate

DD-199 state closure is exact-head verified. Core Service Verify run `36228736872` passed Core job `108367658496` at **638/638** and PostgreSQL job `108367658664` at **504/504** plus database bootstrap PASS. Database Verify run `36228736839` / job `108367658471` passed. Web Boundary Verify run `36228736829` / job `108367658360` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0011 owns the direct global catalog foreign key:

`core_ai.ai_model.provider_id uuid NOT NULL REFERENCES core_ai.ai_provider(id)`.

DD-108 exposes the AIModel-side persisted identity evidence required by this relationship: model `id` and exact `providerId`. DD-107 exposes AIProvider `id` as raw global catalog evidence. Therefore the direct AIModel → AIProvider foreign-key continuity is source-complete without a new reader, schema, RLS policy, role or grant.

Existing TokenUsage/Document generated-media helpers that inspect a model's `providerId` prove different child→AIModel composite-pair relationships; they do not duplicate the direct AIModel → AIProvider FK.

Migration 0011 does **not** make provider status, health, credential reference, supported regions/capabilities, security class, residency metadata or provider version part of this FK. DD-107 explicitly keeps those raw catalog fields from becoming eligibility/routing/execution authority.

## Determination and locked DD-200 detailed contract

**SOURCE-COMPLETE for AIModel → AIProvider exact provider-id foreign-key continuity only.**

Authorize pure helper:

`matchesAIModelProviderBindingFloors(model, provider?)`

It accepts one already-loaded DD-108 `AIModelCatalogMetadata` and optional already-loaded DD-107 `AIProviderCatalogMetadata`, returns boolean and never mutates inputs.

1. Validate relevant AIModel `id` and `providerId` UUID shape.
2. Require supplied AIProvider evidence with valid provider `id` UUID shape.
3. Require exact `provider.id === model.providerId`.
4. Model status/version/capabilities/modalities/residency/sensitivity/cost/latency/metadata remain uninterpreted.
5. Provider code/status/adapter/regions/capabilities/security/residency/health/version/time evidence remain uninterpreted.
6. A true result grants no provider/model currentness, eligibility, routing, credential access or AI execution authority.

## Fixed acceptance before implementation

- **AIMODEL-PROV-CUR-001**: exact provider-id binding passes.
- **AIMODEL-PROV-CUR-002**: missing Provider evidence or wrong Provider id fails closed.
- **AIMODEL-PROV-CUR-003**: malformed Model id/providerId or Provider id fails closed.
- **AIMODEL-PROV-CUR-004**: Provider lifecycle/health/security/capability/residency/version/timestamp evidence is uninterpreted.
- **AIMODEL-PROV-CUR-005**: Model lifecycle/capability/modality/residency/sensitivity/cost/latency/version/metadata evidence is uninterpreted.
- **AIMODEL-PROV-CUR-006**: inputs remain unchanged and a true result exposes no current/eligible/routable/credential/execution authority.

Expected executable delta: Core **638 → 644**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not Provider ACTIVE/current/healthy state, credential-reference disclosure or secret resolution, model ACTIVE/current eligibility, provider/model capability or modality suitability, residency/sensitivity runtime policy, Tenant/Industry allow-list evaluation, provisioning snapshot validity, budget/quota, routing/fallback/retry, provider SDK dispatch, inference/embedding/RAG/media/agent/tool execution or public-route authority. It changes no schema/RLS/role/grant/route/product policy.

After DD-200 is implemented and exact-head verified, source-audit the next independent persisted AI relationship. Principal currentness remains blocked unless governing provenance changes.
