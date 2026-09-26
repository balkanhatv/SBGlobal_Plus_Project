# TenantAIConfig provider allowlist prerequisite ownership audit

**Date:** 2026-09-26
**Baseline checkpoint:** `DEV-AI-TENANT-CONFIG-CAPABILITY-ALLOWLIST-FLOORS-001`
**Verified closure HEAD:** `a2f5194c92e05724059defb93506264c14e1b071`
**Verified tree:** `cd05f0889e4040a7d1ff341133d749de1abfe240`

## Entry gate

DD-206 state closure is exact-head verified. Core Service Verify run `36253680096` passed Core job `108436326880` at **685/685** and PostgreSQL job `108436327058` at **504/504** plus database bootstrap PASS. Database Verify run `36253680100` / job `108436326800` passed. Web Boundary Verify run `36253680090` / job `108436326917` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0031 owns TenantAIConfig Provider allowlist integrity. For `core_ai.tenant_ai_config.allowed_provider_ids` it requires:
- the UUID array is non-null;
- no null members;
- duplicate-free set semantics through `core_tenancy.uuid_array_is_set(...)`;
- every allowed Provider id has a matching `core_ai.ai_provider.id`;
- every matching Provider has raw status exactly `ACTIVE`.

`uuid_array_is_set` permits an empty array. The persisted UUID type itself forbids non-UUID members; the Core helper must fail closed on malformed raw string evidence rather than invent coercion.

DD-119 exposes TenantAIConfig id, Tenant id and immutable raw `allowedProviderIds`. DD-107 exposes AIProvider id and raw status. Therefore this independent Provider relationship is source-complete without a new persistence reader, schema, RLS, role or grant.

The same migration separately validates `allowed_model_ids`: each model must be ACTIVE and its `provider_id` must be a member of `allowed_provider_ids`. That Model predicate depends on this Provider allowlist but is not part of DD-207.

## Determination and locked DD-207 detailed contract

**SOURCE-COMPLETE for TenantAIConfig Provider allowlist current binding only.**

Authorize pure helper:

`matchesAITenantConfigProviderAllowlistFloors(config, providers)`

It accepts one already-loaded DD-119 `PersistedAITenantConfig` and a finite array of already-loaded DD-107 `AIProviderCatalogMetadata`, returns boolean and never mutates inputs.

1. Validate relevant config id and Tenant id UUID shape.
2. Require `allowedProviderIds` to be an array of valid UUID strings with no duplicates; empty is valid.
3. Require Provider evidence to contain exactly one row per allowed id and no extra/duplicate Provider id evidence (helper fail-closed evidence hygiene, not a new persisted business rule).
4. Require each Provider evidence row to have a valid UUID id and raw string status.
5. Require exact id equality; no aliasing/fallback is authorized.
6. Require every referenced Provider raw status exactly `ACTIVE`.
7. Provider code/adapter/regions/capabilities/security/residency/health/version/timestamps and all unrelated TenantAIConfig fields remain uninterpreted.

## Fixed acceptance before implementation

- **AITENCFG-PROV-CUR-001**: empty Provider allowlist passes only with empty Provider evidence.
- **AITENCFG-PROV-CUR-002**: complete exact ACTIVE Provider set passes independent of evidence order.
- **AITENCFG-PROV-CUR-003**: missing, extra, duplicate or wrong-id Provider evidence fails closed.
- **AITENCFG-PROV-CUR-004**: non-ACTIVE Provider status fails; case/whitespace variants of ACTIVE are not normalized.
- **AITENCFG-PROV-CUR-005**: duplicate or malformed TenantAIConfig Provider-id entries fail closed.
- **AITENCFG-PROV-CUR-006**: malformed config identity or Provider evidence identity/status shape fails closed.
- **AITENCFG-PROV-CUR-007**: Capability/Model allowlists, enablement, policies/sensitivity/version/timestamps and Provider runtime/catalog semantics are uninterpreted; inputs remain unchanged.

Expected executable delta: Core **685 → 692**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not latest/current TenantAIConfig selection, runtime enablement, Model allowlist validity, model→provider compatibility, Provider health/credentials/security/capability/residency suitability, effective Tenant+Industry configuration, entitlement/permission/budget/prompt/retention policy satisfaction, provisioning validity, routing/fallback/retry, provider SDK dispatch or AI execution. It changes no schema/RLS/role/grant/route/product policy.

After DD-207 is implemented and exact-head verified, source-audit the dependent TenantAIConfig Model allowlist predicate. Effective AI configuration and AI execution remain separately governed.
