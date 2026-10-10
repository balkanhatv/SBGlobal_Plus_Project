# AI IndustryAIConfig TenantAIConfig non-widening prerequisite ownership audit

**Date:** 2026-09-28
**Baseline checkpoint:** `DEV-AI-TENANT-CONFIG-MODEL-ALLOWLIST-FLOORS-001`
**Verified entry HEAD:** `35daf71913e0e3e5e960bbbb4fc6142af18b17e1`
**Verified entry tree:** `37251442b48e242a92606a1df04f2c6da34b5ecf`
**Governed candidate:** DD-209

## Entry gate

The complete-project downstream semantic/file-coverage/adversarial audit is CLEAN / CLOSED through VC27-111 and the active projection correction is exact-head verified.

At the entry HEAD above:
- Core Service Verify run `36393516719`, Core job `108834451599`: **741/741 PASS**, zero failed/skipped; REPO-007/REPO-008/REPO-010 pass.
- PostgreSQL job `108834451280`: **512/512 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify run `36393516778`, job `108834451348`: PASS with **48 migrations / 42 verification files**.
- Web Boundary Verify run `36393516704`, job `108834450973`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. `main` is unmerged. RawSource is unchanged. DD-208 remains the latest implemented checkpoint. This artifact authorizes only the DD-209 source-complete implementation boundary below after this source-audit commit independently passes the same exact-head gate.

## Source ownership reconciled

Freshly reconciled:
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`;
- DD-119 `PersistedAITenantConfig` evidence;
- DD-120 `PersistedAIIndustryConfig` evidence;
- DD-205 IndustryAIConfig domain PromptSet relationship;
- DD-206/DD-207/DD-208 TenantAIConfig capability/provider/model allowlist floors.

Migration 0031 owns the IndustryAIConfig non-widening predicate. On an `industry_ai_config` write it:
1. requires Industry capability/provider/model/country-pack arrays to be duplicate-free non-null sets;
2. selects one TenantAIConfig for the same `tenant_id` using `ORDER BY version DESC LIMIT 1`;
3. rejects when no TenantAIConfig exists;
4. rejects `Industry.enabled = true` when the selected TenantAIConfig is disabled;
5. rejects when Industry `allowed_capabilities` is not a subset of Tenant `allowed_capabilities`;
6. rejects when Industry `allowed_provider_ids` is not a subset of Tenant `allowed_provider_ids`;
7. rejects when Industry `allowed_model_ids` is not a subset of Tenant `allowed_model_ids`.

DD-09 independently states that IndustryAIConfig cannot widen TenantAIConfig. DD-120 exposes the Industry-side id, Tenant id, Industry Context id, raw enabled flag and all three raw allowlists. DD-119 exposes the Tenant-side id, Tenant id, raw enabled flag and all three raw allowlists. No additional reader, schema, RLS, role or grant is required for re-evaluating this relationship against already-selected evidence.

## Critical temporal boundary

IndustryAIConfig does **not** persist the TenantAIConfig id/version that migration 0031 selected when the Industry row was written. Therefore a later pure Core check cannot prove which TenantAIConfig was historically used, cannot select or certify the current/latest TenantAIConfig by itself, and cannot reconstruct a historical effective configuration.

DD-209 may only re-evaluate the non-widening predicate between:
- one supplied `PersistedAIIndustryConfig`; and
- one already-selected `PersistedAITenantConfig`.

The caller remains responsible for any separately governed current/latest selection. A true DD-209 result means only that the two supplied evidence objects satisfy the source-owned same-Tenant non-widening relationship.

## Determination and locked DD-209 detailed contract

**SOURCE-COMPLETE for IndustryAIConfig -> supplied TenantAIConfig non-widening only.**

Authorize pure helper:

`matchesAIIndustryConfigTenantNonWideningFloors(industryConfig, tenantConfig)`

It returns boolean and never mutates inputs.

1. Validate both config objects and relevant UUID identities.
2. Require exact same `tenantId`.
3. Validate both raw `enabled` values as booleans.
4. Validate both capability allowlists as actual, non-sparse, duplicate-free arrays whose entries are strings. Preserve raw strings exactly; do not trim, case-fold or invent a non-empty rule.
5. Validate both Provider and Model allowlists as actual, non-sparse, duplicate-free UUID arrays.
6. If Industry is enabled, Tenant must be enabled. A disabled Industry does not require Tenant enabled.
7. Require every Industry capability to be an exact member of the supplied Tenant capability set.
8. Require every Industry Provider id to be an exact member of the supplied Tenant Provider-id set.
9. Require every Industry Model id to be an exact member of the supplied Tenant Model-id set.
10. Allow the Tenant sets to be wider than the Industry sets; empty Industry subsets are valid.
11. Do not interpret unrelated fields.

## Fixed acceptance before implementation

- **AIINDCFG-TENANT-CUR-001**: exact same-Tenant enabled Industry evidence with capability/provider/model subsets passes.
- **AIINDCFG-TENANT-CUR-002**: enabled Industry + disabled Tenant fails; disabled Industry does not widen either enabled or disabled Tenant by the enabled flag alone.
- **AIINDCFG-TENANT-CUR-003**: foreign-Tenant or malformed config identity/boolean evidence fails closed.
- **AIINDCFG-TENANT-CUR-004**: any Industry capability outside the Tenant set fails; comparison is exact raw-string membership with no normalization.
- **AIINDCFG-TENANT-CUR-005**: any Industry Provider or Model id outside the corresponding Tenant set fails.
- **AIINDCFG-TENANT-CUR-006**: duplicate, malformed or sparse capability/provider/model arrays on either side fail closed; capability entries remain raw strings and Provider/Model entries require UUID shape.
- **AIINDCFG-TENANT-CUR-007**: empty Industry subsets pass against valid Tenant sets; extra Tenant entries do not fail the subset relationship.
- **AIINDCFG-TENANT-CUR-008**: unrelated evidence remains uninterpreted, inputs remain unchanged, and the result does not claim current/latest selection or effective configuration.

Expected executable delta after a separately verified source-audit gate: Core **741 -> 749**. PostgreSQL remains **512**. Database inventory remains **48 migrations / 42 verification files**. Web behavior remains unchanged.

## Explicit exclusions / continuation

A true result does **not** implement, select, prove or authorize:
- current/latest TenantAIConfig or IndustryAIConfig selection;
- the historical TenantAIConfig version used when an IndustryAIConfig row was written;
- catalog capability/provider/model ACTIVE/currentness or runtime suitability;
- country-pack activation/currentness;
- domain PromptSet activity/applicability/member resolution beyond separately governed DD-205;
- subscription/entitlement/RBAC/permission/policy/budget/sensitivity/residency/retention evaluation;
- effective Tenant+Industry configuration merge;
- AIProvisioningSnapshot compilation/currentness;
- provider/model routing, fallback, retry or credentials;
- provider SDK dispatch, inference, embeddings, RAG, media generation, agents/tools or any AI execution;
- schema/RLS/role/grant/public route/product-policy changes.

After the DD-209 source-audit commit independently passes exact-head Core/PostgreSQL/Database/Web verification, implement only the pure helper + fixed acceptance tests + Core export. Do not promote DD-209 or open effective AI configuration/execution until the implementation and subsequent canonical promotion each pass their own governed exact-head gates.
