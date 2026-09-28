# AI IndustryAIConfig CountryPack activation prerequisite ownership audit

**Date:** 2026-09-28
**Baseline checkpoint:** `DEV-AI-INDUSTRY-CONFIG-TENANT-NON-WIDENING-FLOORS-001`
**Verified entry HEAD:** `458c0ac43b757c0a08de17a3af316decb4beb2de`
**Verified entry tree:** `46e1735e901f0650965e23f893958cb456aa5eea`
**Governed candidate:** DD-210

## Entry gate

DD-209 canonical promotion and state closure are exact-head verified.

At the entry HEAD above:
- Core Service Verify run `36395707214`, Core job `108841467950`: **749/749 PASS**, zero failed/skipped.
- PostgreSQL job `108841467500`: **512/512 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify run `36395707093`, job `108841465685`: PASS with **48 migrations / 42 verification files**.
- Web Boundary Verify run `36395707268`, job `108841465992`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. `main` is unmerged. RawSource is unchanged. DD-209 is the latest governed implemented checkpoint.

## Source ownership reconciled

Freshly reconciled:
- `database/migrations/0001_core_bootstrap.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-05_DATA_MODEL_AND_DATABASE_DESIGN.md`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- DD-120 `PersistedAIIndustryConfig` raw evidence;
- DD-138 `PersistedTenantCountryPackActivation` raw evidence;
- `Development/TENANT_COUNTRY_PACK_ACTIVATION_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

Migration 0001 physically owns `core_config.tenant_country_pack_activation` with:
- primary key `id`;
- `tenant_id`;
- `country_pack_id`;
- lifecycle `status` in `PENDING | ACTIVE | DISABLED`;
- uniqueness of `(tenant_id,country_pack_id)`.

Migration 0031 validates every `IndustryAIConfig.country_pack_refs[]` entry by requiring an activation row where:
- `activation.tenant_id = IndustryAIConfig.tenant_id`;
- `activation.country_pack_id = referenced pack id`;
- raw `activation.status = 'ACTIVE'`.

The same migration already separately validates country-pack reference array set shape. DD-120 exposes the Industry config id/Tenant/Industry and raw `countryPackRefs`; DD-138 exposes activation id/Tenant/CountryPack/status. Therefore no new persistence reader, schema, RLS, role or grant is required.

## Determination and locked DD-210 detailed contract

**SOURCE-COMPLETE for IndustryAIConfig CountryPack refs → exact supplied ACTIVE same-Tenant TenantCountryPackActivation evidence.**

Authorize pure helper:

`matchesAIIndustryConfigCountryPackActivationFloors(industryConfig, activations)`

It returns boolean and never mutates inputs.

1. Validate Industry config id, Tenant id and Industry Context id UUID shape.
2. Validate `countryPackRefs` as an actual dense, duplicate-free UUID array.
3. Require `activations` to be an array with exactly one evidence row per referenced CountryPack and no extra evidence rows.
4. Validate every activation id, Tenant id and CountryPack id UUID shape.
5. Require activation status to be one of the persisted vocabulary values and exactly `ACTIVE` for every referenced row; no case/whitespace normalization.
6. Require every activation `tenantId === industryConfig.tenantId`.
7. Require every activation `countryPackId` to match exactly one referenced CountryPack id.
8. Require complete one-to-one evidence coverage independent of evidence order.
9. Do not interpret activation override JSON, timestamps, rowVersion, Industry enabled/allowlists/domain PromptSet/localization/version/timestamps, or CountryPack catalog state.

The exact-evidence-set rule is an application evidence-completeness boundary for this pure helper; it does not add a new persisted database uniqueness rule beyond the already-owned `(tenant_id,country_pack_id)` uniqueness.

## Fixed acceptance before implementation

- **AIINDCFG-PACK-CUR-001**: empty CountryPack refs pass only with empty activation evidence.
- **AIINDCFG-PACK-CUR-002**: exact complete same-Tenant ACTIVE activation set passes independent of evidence order.
- **AIINDCFG-PACK-CUR-003**: missing, extra, duplicate or wrong CountryPack activation evidence fails closed.
- **AIINDCFG-PACK-CUR-004**: PENDING, DISABLED, case/whitespace status variants or malformed status fail closed.
- **AIINDCFG-PACK-CUR-005**: foreign-Tenant activation evidence fails even when CountryPack id matches.
- **AIINDCFG-PACK-CUR-006**: malformed Industry identity/ref arrays or malformed activation identity evidence fails closed; sparse ref arrays fail.
- **AIINDCFG-PACK-CUR-007**: activation evidence order does not matter; each referenced pack must still have exactly one match.
- **AIINDCFG-PACK-CUR-008**: unrelated config/activation fields remain uninterpreted and inputs remain unchanged.

Expected executable delta after this source-audit commit independently passes exact-head verification: Core **749 → 757**. PostgreSQL remains **512**. Database inventory remains **48 migrations / 42 verification files**. Web behavior remains unchanged.

## Critical semantic boundary

A true DD-210 result proves only the migration-0031 activation relation against the supplied evidence. It does **not** prove:
- current/effective/primary Tenant CountryPack selection;
- CountryPack catalog `ACTIVE` state, effective dates or version currentness;
- that CountryPack defaults, localization, currency, tax, language or reference data were materialized/applied;
- Industry activation/subscription/entitlement/permission authority;
- effective Tenant+Industry AI configuration;
- AIProvisioningSnapshot compilation/currentness;
- provider/model routing or AI execution.

DD-138 deliberately preserves PENDING/DISABLED/raw override/timestamp/rowVersion evidence without applying semantics. DD-210 interprets only the exact same-Tenant CountryPack-id + raw ACTIVE relationship owned by migration 0031.

## Explicit exclusions / continuation

DD-210 changes no schema, migration, RLS, role, grant, route, public API or product policy.

After this source-audit commit independently passes exact-head Core/PostgreSQL/Database/Web verification, implement only:
- the pure Core helper;
- the eight fixed acceptance tests;
- the Core export.

Do not promote DD-210 or open effective AI configuration/provisioning/execution until the implementation and later canonical promotion each pass their own governed exact-head gates.
