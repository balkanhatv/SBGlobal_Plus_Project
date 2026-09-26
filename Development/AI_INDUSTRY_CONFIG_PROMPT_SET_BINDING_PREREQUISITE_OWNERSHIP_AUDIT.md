# AI IndustryConfig domain PromptSet binding prerequisite ownership audit

**Date:** 2026-09-26
**Baseline checkpoint:** `DEV-AI-TOOL-SET-MEMBER-PARENT-BINDING-FLOORS-001`
**Verified closure HEAD:** `5d93f4a44636c8e1541d252c8cc24a9e93803a21`
**Verified tree:** `9076190c75b4b5a1b133a41517914a3068b149da`

## Entry gate

DD-204 state closure is exact-head verified. Core Service Verify run `36247745913` passed Core job `108419970222` at **671/671** and PostgreSQL job `108419970342` at **504/504** plus database bootstrap PASS. Database Verify run `36247745827` / job `108419970235` passed. Web Boundary Verify run `36247745802` / job `108419969929` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0031 adds `industry_ai_config_prompt_set_fk` from optional `core_ai.industry_ai_config.domain_prompt_set_id` to `core_ai.ai_prompt_set(id)`.

The same migration's `validate_ai_configuration()` adds the current relationship predicate when `domain_prompt_set_id` is present:
- referenced PromptSet id must exist;
- raw PromptSet `status` must equal `ACTIVE`;
- `definition_applies_to_scope(owner_scope, tenant_id, industry_context_id, config.tenant_id, config.industry_context_id)` must hold.

For an Industry-scoped config this applicability means:
- PLATFORM PromptSet applies;
- TENANT PromptSet applies only for the same Tenant;
- INDUSTRY PromptSet applies only for the same Tenant and exact Industry Context.

DD-120 exposes all IndustryAIConfig-side evidence required here: id, Tenant id, Industry Context id and optional `domainPromptSetId`. DD-112 exposes all PromptSet-side evidence: id, owner scope, optional Tenant/Industry ownership and raw status. Therefore this relationship is source-complete without a new reader, schema, RLS, role or grant.

The same IndustryAIConfig trigger separately validates allowlist shape/non-widening, TenantAIConfig state, country-pack activation and other configuration semantics. Those are independent and excluded from DD-205.

## Determination and locked DD-205 detailed contract

**SOURCE-COMPLETE for IndustryAIConfig → optional domain PromptSet current binding only.**

Authorize pure helper:

`matchesAIIndustryConfigDomainPromptSetBindingFloors(config, promptSet?)`

It accepts one DD-120 `PersistedAIIndustryConfig` and optional DD-112 `PersistedAIPromptSet`, returns boolean and never mutates inputs.

1. Validate relevant config id/Tenant id/Industry Context id and optional domain PromptSet id UUID shape.
2. If `domainPromptSetId` is absent, require no supplied PromptSet evidence.
3. If `domainPromptSetId` is present, require supplied PromptSet evidence with valid id and canonical owner shape.
4. Require exact `promptSet.id === config.domainPromptSetId`.
5. Require raw `promptSet.status === "ACTIVE"` with no normalization.
6. Require PromptSet applicability to the config's exact Tenant+Industry:
   - PLATFORM always applies;
   - TENANT only for same Tenant;
   - INDUSTRY only for same Tenant + exact Industry Context.
7. Unrelated IndustryAIConfig enabled/allowlist/country-pack/localization/version/update evidence and PromptSet code/version/timestamps remain uninterpreted.

## Fixed acceptance before implementation

- **AIINDCFG-PROMPT-CUR-001**: unbound config passes only with no PromptSet evidence; unexpected evidence fails.
- **AIINDCFG-PROMPT-CUR-002**: exact referenced ACTIVE PLATFORM PromptSet applies.
- **AIINDCFG-PROMPT-CUR-003**: exact referenced ACTIVE same-Tenant TENANT PromptSet applies; foreign Tenant fails.
- **AIINDCFG-PROMPT-CUR-004**: exact referenced ACTIVE same-Tenant/exact-Industry PromptSet applies; sibling/foreign Industry fails.
- **AIINDCFG-PROMPT-CUR-005**: missing evidence, wrong PromptSet id or non-ACTIVE/raw status variant fails closed.
- **AIINDCFG-PROMPT-CUR-006**: malformed config identity/domain id or malformed PromptSet id/owner shape fails closed.
- **AIINDCFG-PROMPT-CUR-007**: unrelated config/PromptSet semantics are uninterpreted and inputs remain unchanged.

Expected executable delta: Core **671 → 678**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not current/latest IndustryAIConfig selection, TenantAIConfig merge/non-widening, country-pack activation, allowlist/catalog validity, effective PromptSet membership, prompt-template currentness/rendering, entitlement/permission/budget/residency/retention policy, provider/model routing, assistant/agent/tool authorization or AI execution. It changes no schema/RLS/role/grant/route/product policy.

After DD-205 is implemented and exact-head verified, source-audit the next independent persisted AI relationship. Complete effective AI configuration and execution remain separately governed.
