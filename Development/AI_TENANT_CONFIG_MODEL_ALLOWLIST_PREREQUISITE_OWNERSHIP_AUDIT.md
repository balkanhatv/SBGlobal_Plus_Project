# TenantAIConfig Model allowlist prerequisite ownership audit

**Date:** 2026-09-26
**Baseline checkpoint:** `DEV-AI-TENANT-CONFIG-PROVIDER-ALLOWLIST-FLOORS-001`
**Verified closure HEAD:** `86238e0471a28460277c7bf3ce5435a7029ffdac`
**Verified tree:** `f8fa90bb6c1b43260727e4d0e11ab816b79b5bea`

## Entry gate

DD-207 state closure is exact-head verified. Core Service Verify run `36255432310` passed Core job `108441207688` at **692/692** and PostgreSQL job `108441207556` at **504/504** plus database bootstrap PASS. Database Verify run `36255432296` / job `108441207432` passed. Web Boundary Verify run `36255432308` / job `108441207518` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0031 owns the TenantAIConfig Model allowlist predicate:

- `allowed_model_ids` must satisfy `core_tenancy.uuid_array_is_set(...)`, so the list is non-null, null-free and duplicate-free;
- for every exact Model id in `allowed_model_ids`, an exact `core_ai.ai_model` row must exist;
- the referenced Model raw status must be exactly `ACTIVE`;
- the referenced Model `provider_id` must be a member of the same TenantAIConfig `allowed_provider_ids` array.

DD-119 exposes TenantAIConfig `id`, `tenantId`, raw `allowedProviderIds` and raw `allowedModelIds`. DD-108 exposes AIModel `id`, `providerId` and raw `status`. DD-207 separately governs the Provider allowlist's exact Provider-row/raw-ACTIVE relationship, but DD-208 requires no Provider row to re-evaluate the Model predicate itself.

No additional persistence reader, schema, RLS, role or grant is required.

## Determination and locked DD-208 detailed contract

**SOURCE-COMPLETE for the TenantAIConfig Model allowlist current-binding predicate only.**

Authorize pure helper:

`matchesAITenantConfigModelAllowlistFloors(config, models)`

It accepts one DD-119 `PersistedAITenantConfig` and an already-loaded array of DD-108 `AIModelCatalogMetadata`, returns boolean and never mutates inputs.

1. Validate config id/Tenant id plus duplicate-free UUID `allowedProviderIds` and `allowedModelIds`.
2. Empty Model allowlists require empty Model evidence.
3. Require exact one-row-per-allowed-model evidence: no missing, extra or duplicate Model ids.
4. Validate Model id/provider-id/status shape.
5. Require exact Model id membership in `allowedModelIds`.
6. Require raw Model status exactly `ACTIVE`, with no trimming/case-folding/fallback.
7. Require each Model `providerId` to be an exact member of config `allowedProviderIds`.
8. Model code/capabilities/modalities/residency/sensitivity/cost/latency/version/metadata and unrelated TenantAIConfig semantics remain uninterpreted.

## Fixed acceptance before implementation

- **AITENCFG-MODEL-CUR-001**: empty Model allowlist passes only with empty Model evidence.
- **AITENCFG-MODEL-CUR-002**: complete exact ACTIVE Model evidence set passes independent of evidence order when every Model provider is allowlisted.
- **AITENCFG-MODEL-CUR-003**: missing, extra, duplicate or wrong-id Model evidence fails closed.
- **AITENCFG-MODEL-CUR-004**: raw Model status must equal ACTIVE exactly.
- **AITENCFG-MODEL-CUR-005**: Model provider must be an exact member of config allowedProviderIds; no Provider row evidence is required.
- **AITENCFG-MODEL-CUR-006**: duplicate/malformed allowedModelIds or allowedProviderIds entries fail closed.
- **AITENCFG-MODEL-CUR-007**: malformed config identity or Model id/provider-id/status shape fails closed.
- **AITENCFG-MODEL-CUR-008**: unrelated config/catalog semantics remain uninterpreted and inputs remain unchanged.

Expected executable delta: Core **692 → 700**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not current/latest TenantAIConfig selection, config enablement, Provider-row validity/currentness, Provider health/credentials/security/capability/residency suitability, Model capability/modality/residency/sensitivity suitability, effective Tenant+Industry configuration, budget/quota/entitlement/permission/prompt/retention policy, provisioning, routing/fallback/retry, provider SDK dispatch or AI execution. It changes no schema/RLS/role/grant/route/product policy.

After DD-208 is implemented and exact-head verified, source-audit the next independent Tenant/Industry AI configuration relationship. Effective configuration and AI execution remain separately governed.
