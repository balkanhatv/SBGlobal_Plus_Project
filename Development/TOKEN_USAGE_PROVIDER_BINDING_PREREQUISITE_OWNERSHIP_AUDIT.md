# TokenUsage provider binding prerequisite ownership audit

**Date:** 2026-09-26
**Baseline checkpoint:** `DEV-AI-MODEL-PROVIDER-BINDING-FLOORS-001`
**Verified closure HEAD:** `61bd4777b501cc06c3a13a3691c54cedad06c057`
**Verified tree:** `81914f767f2a240ed30207e93cfb53334a04ee39`

## Entry gate

DD-200 state closure is exact-head verified. Core Service Verify run `36230002411` passed Core job `108371232143` at **644/644** and PostgreSQL job `108371232238` at **504/504** plus database bootstrap PASS. Database Verify run `36230002405` / job `108371232064` passed. Web Boundary Verify run `36230002426` / job `108371232249` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0012 persists:

`core_ai.token_usage.provider_id uuid NOT NULL REFERENCES core_ai.ai_provider(id)`.

DD-122 exposes TokenUsage persisted `id`, Tenant/optional Industry, exact `providerId`, exact `modelId` and observability evidence. DD-107 exposes AIProvider raw catalog `id` and other provider metadata. Therefore the direct TokenUsage → AIProvider foreign-key continuity is source-complete without a new reader, schema, RLS policy, role or grant.

DD-196 already mirrors a different persisted relationship: TokenUsage `(model_id, provider_id)` → AIModel `(id, provider_id)` composite pair. Its explicit boundary says no separate Provider row is required for that pair predicate. DD-200 mirrors AIModel → AIProvider direct FK continuity. Neither decision duplicates the independent TokenUsage `provider_id` → AIProvider `id` FK owned by migration 0012.

Migration 0012 does **not** make provider status, health, credentials, supported regions/capabilities, security class, residency metadata or version part of this direct FK.

## Determination and locked DD-201 detailed contract

**SOURCE-COMPLETE for TokenUsage → AIProvider exact provider-id foreign-key continuity only.**

Authorize pure helper:

`matchesAITokenUsageProviderBindingFloors(usage, provider?)`

It accepts one already-loaded DD-122 `PersistedAITokenUsage` and optional already-loaded DD-107 `AIProviderCatalogMetadata`, returns boolean and never mutates inputs.

1. Validate relevant TokenUsage `id`, Tenant, optional Industry and `providerId` UUID shape.
2. Require supplied AIProvider evidence with valid Provider `id` UUID shape.
3. Require exact `provider.id === usage.providerId`.
4. TokenUsage model/capability/principal/units/time/correlation evidence remains uninterpreted.
5. Provider code/status/adapter/regions/capabilities/security/residency/health/version/time evidence remains uninterpreted.
6. A true result grants no Provider currentness, health, credential, capability, routing, billing or AI execution authority.

## Fixed acceptance before implementation

- **AIUSAGE-PROV-CUR-001**: exact TokenUsage provider-id binding passes.
- **AIUSAGE-PROV-CUR-002**: missing Provider evidence or wrong Provider id fails closed.
- **AIUSAGE-PROV-CUR-003**: malformed TokenUsage id/Tenant/optional Industry/providerId or Provider id fails closed.
- **AIUSAGE-PROV-CUR-004**: Provider lifecycle/health/security/capability/residency/version/timestamp evidence is uninterpreted.
- **AIUSAGE-PROV-CUR-005**: TokenUsage model/capability/principal/units/time/correlation evidence is uninterpreted.
- **AIUSAGE-PROV-CUR-006**: inputs remain unchanged and a true result exposes no current/eligible/routable/credential/billing/execution authority.

Expected executable delta: Core **644 → 650**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not Provider ACTIVE/current/healthy state, credential-reference disclosure or secret resolution, AIModel continuity/currentness, capability eligibility, provider/model compatibility, principal currentness, Tenant/Industry allowlisting, budget/quota, cost/billing validity, routing/fallback/retry, provider SDK dispatch or AI execution authority. It changes no schema/RLS/role/grant/route/product policy.

After DD-201 is implemented and exact-head verified, source-audit the next independent persisted AI relationship. Principal currentness remains blocked unless governing provenance changes.
