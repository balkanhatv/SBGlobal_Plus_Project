# TenantAIConfig capability allowlist prerequisite ownership audit

**Date:** 2026-09-26
**Baseline checkpoint:** `DEV-AI-INDUSTRY-CONFIG-PROMPT-SET-BINDING-FLOORS-001`
**Verified closure HEAD:** `c646a2e8cccdf3274c05fb325ecf60dc3a77fcfc`
**Verified tree:** `5f83eb01494c1fe397c980568909c0bd0bfd8479`

## Entry gate

DD-205 state closure is exact-head verified. Core Service Verify run `36251609669` passed Core job `108430565249` at **678/678** and PostgreSQL job `108430565119` at **504/504** plus database bootstrap PASS. Database Verify run `36251609768` / job `108430565638` passed. Web Boundary Verify run `36251609786` / job `108430565733` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0031 owns TenantAIConfig allowlist integrity. For `core_ai.tenant_ai_config.allowed_capabilities` it requires:
- the array is non-null;
- no null members;
- duplicate-free exact text values through `core_tenancy.text_array_is_set(...)`;
- every allowed capability code has a matching `core_ai.ai_capability.code`;
- every matching capability has raw status exactly `ACTIVE`.

`text_array_is_set` permits an empty array; it does not trim, case-fold or otherwise normalize values.

DD-119 exposes TenantAIConfig id, Tenant id and immutable raw `allowedCapabilities`. DD-109 exposes AICapability id, exact code and raw status. Therefore this independent capability relationship is source-complete without a new persistence reader, schema, RLS, role or grant.

The same migration separately validates allowed Provider ids and allowed Model ids/model→provider membership. Those are different predicates and are explicitly excluded from DD-206.

## Determination and locked DD-206 detailed contract

**SOURCE-COMPLETE for TenantAIConfig capability allowlist current binding only.**

Authorize pure helper:

`matchesAITenantConfigCapabilityAllowlistFloors(config, capabilities)`

It accepts one already-loaded DD-119 `PersistedAITenantConfig` and a finite array of already-loaded DD-109 `AICapabilityCatalogMetadata`, returns boolean and never mutates inputs.

1. Validate relevant config id and Tenant id UUID shape.
2. Require `allowedCapabilities` to be an array of exact strings with no duplicates; empty is valid.
3. Require capability evidence to contain exactly one row per allowed code and no extra/duplicate code evidence (helper fail-closed evidence hygiene, not a new persisted business rule).
4. Require each capability evidence row to have a valid UUID id and exact string code.
5. Require exact code equality with no trimming/case-folding/fallback.
6. Require every referenced capability raw status exactly `ACTIVE`.
7. Capability category/required-entitlement/default-policy/schema-version and all unrelated TenantAIConfig fields remain uninterpreted.

## Fixed acceptance before implementation

- **AITENCFG-CAP-CUR-001**: empty allowlist passes only with empty capability evidence.
- **AITENCFG-CAP-CUR-002**: complete exact ACTIVE capability set passes independent of evidence order.
- **AITENCFG-CAP-CUR-003**: missing, extra, duplicate or wrong-code evidence fails closed.
- **AITENCFG-CAP-CUR-004**: non-ACTIVE capability status fails; case/whitespace variants of ACTIVE are not normalized.
- **AITENCFG-CAP-CUR-005**: duplicate or malformed TenantAIConfig capability entries fail closed.
- **AITENCFG-CAP-CUR-006**: malformed config identity or capability evidence identity/code shape fails closed.
- **AITENCFG-CAP-CUR-007**: Provider/Model allowlists, enablement, policy refs, sensitivity/version/timestamps and Capability category/entitlement/policy/schema semantics are uninterpreted; inputs remain unchanged.

Expected executable delta: Core **678 → 685**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not latest/current TenantAIConfig selection, runtime enablement, Provider or Model allowlist validity, model→provider compatibility, effective Tenant+Industry config, entitlement/permission/budget/residency/sensitivity/retention/prompt policy satisfaction, provisioning validity, provider/model routing, Assistant/Agent/Tool authorization or AI execution. It changes no schema/RLS/role/grant/route/product policy.

After DD-206 is implemented and exact-head verified, source-audit the next independent TenantAIConfig Provider/Model or other persisted AI relationship. Effective AI configuration and AI execution remain separately governed.
