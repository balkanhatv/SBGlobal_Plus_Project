# AI ProvisioningSnapshot TenantAIConfig binding prerequisite ownership audit

**Date:** 2026-09-28
**Baseline checkpoint:** `DEV-AI-INDUSTRY-CONFIG-COUNTRY-PACK-ACTIVATION-FLOORS-001`
**Verified entry HEAD:** `790a07d583ce433f269b0c8d28ad0441e48a693f`
**Verified entry tree:** `32de3ceddb8c3ab15033d6a49a88b2ef92460348`
**Governed candidate:** DD-211

## Entry gate

DD-210 canonical promotion and state closure are exact-head verified.

At the entry HEAD above:
- Core Service Verify run `36397940226`, Core job `108848690007`: **757/757 PASS**, zero failed/skipped.
- PostgreSQL job `108848689704`: **512/512 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify run `36397940031`, job `108848688421`: PASS with **48 migrations / 42 verification files**.
- Web Boundary Verify run `36397940489`, job `108848690375`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. `main` is unmerged. RawSource is unchanged. DD-210 is the latest governed implemented checkpoint.

## Source ownership reconciled

Freshly reconciled:
- `database/migrations/0011_ai_catalog_config.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`;
- DD-119 `PersistedAITenantConfig` raw evidence;
- DD-124 `PersistedAIProvisioningSnapshot` raw evidence;
- `Development/AI_TENANT_CONFIG_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`;
- `Development/AI_PROVISIONING_SNAPSHOT_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

Migration 0031 validates one ProvisioningSnapshot by selecting one TenantAIConfig where:
- `tenant_ai_config.tenant_id = snapshot.tenant_id`;
- `tenant_ai_config.version = snapshot.tenant_ai_config_version`.

The same predicate then rejects when:
- no exact referenced TenantAIConfig exists;
- the referenced TenantAIConfig is disabled;
- `snapshot.allowed_provider_ids` is not a subset of `tenant_ai_config.allowed_provider_ids`.

The same trigger separately checks each snapshot capability id against ACTIVE AICapability rows whose codes are allowed by the referenced TenantAIConfig. That capability relation is independently source-complete but is explicitly excluded from DD-211 so it can receive its own bounded acceptance/evidence contract.

DD-124 exposes snapshot id/Tenant/raw TenantAIConfig-version text/raw Provider ids. DD-119 exposes Tenant config id/Tenant/enabled/Provider ids/positive safe-integer version. Therefore DD-211 requires no new reader, schema, RLS, role or grant.

## Determination and locked DD-211 detailed contract

**SOURCE-COMPLETE for ProvisioningSnapshot → exact supplied TenantAIConfig version/enabled/Provider-subset binding only.**

Authorize pure helper:

`matchesAIProvisioningSnapshotTenantConfigFloors(snapshot, tenantConfig)`

It returns boolean and never mutates inputs.

1. Validate snapshot id and Tenant id UUID shape.
2. Validate snapshot `tenantAiConfigVersion` as canonical PostgreSQL bigint decimal text.
3. Validate snapshot `allowedProviderIds` as an actual dense, duplicate-free UUID array.
4. Validate Tenant config id/Tenant id UUID shape.
5. Validate Tenant config `enabled` as a strict boolean.
6. Validate Tenant config version as a positive safe integer and require exact decimal equality to `snapshot.tenantAiConfigVersion`.
7. Validate Tenant config `allowedProviderIds` as an actual dense, duplicate-free UUID array.
8. Require exact same Tenant.
9. Require referenced Tenant config `enabled === true`.
10. Require every snapshot Provider id to be an exact member of Tenant config `allowedProviderIds`.
11. Allow the referenced Tenant config Provider set to be wider; an empty snapshot Provider set is valid.
12. Do not interpret snapshot capability ids/API/model classes/commercial versions/Industry activation/packs/budget/status/validity timestamps or Tenant config capability/model/policy/sensitivity fields.

## Fixed acceptance before implementation

- **AIPROVSNAP-TENCFG-CUR-001**: exact same-Tenant referenced version, enabled Tenant config and Provider subset pass.
- **AIPROVSNAP-TENCFG-CUR-002**: TenantAIConfig version mismatch or malformed/non-canonical snapshot version text fails closed.
- **AIPROVSNAP-TENCFG-CUR-003**: foreign-Tenant or malformed snapshot/config identity evidence fails closed.
- **AIPROVSNAP-TENCFG-CUR-004**: disabled referenced Tenant config fails; raw boolean variants fail closed.
- **AIPROVSNAP-TENCFG-CUR-005**: any snapshot Provider outside the referenced Tenant config Provider set fails; empty/narrower snapshot Provider sets pass.
- **AIPROVSNAP-TENCFG-CUR-006**: duplicate, malformed, sparse or non-array Provider evidence on either side fails closed.
- **AIPROVSNAP-TENCFG-CUR-007**: Provider order does not matter and extra Tenant Provider ids do not fail the subset relationship.
- **AIPROVSNAP-TENCFG-CUR-008**: unrelated snapshot/Tenant-config fields remain uninterpreted and inputs remain unchanged.

Expected executable delta after this source-audit commit independently passes exact-head verification: Core **757 → 765**. PostgreSQL remains **512**. Database inventory remains **48 migrations / 42 verification files**. Web behavior remains unchanged.

## Critical semantic boundary

A true DD-211 result proves only that the supplied TenantAIConfig is the exact Tenant/version referenced by the snapshot, is enabled, and contains the snapshot Provider allowlist.

It does **not** prove:
- current/latest TenantAIConfig selection;
- snapshot ACTIVE/current/effective status or `validUntil`;
- capability-id validity or ACTIVE/current catalog state;
- Subscription/Entitlement/Industry activation currentness;
- pack-version currentness;
- effective Tenant+Industry AI configuration;
- permission/RBAC/policy/sensitivity/residency/budget/retention satisfaction;
- provider health/credential/runtime suitability;
- routing, fallback, SDK dispatch, inference, RAG, media, agent or tool execution.

## Explicit exclusions / continuation

DD-211 changes no schema, migration, RLS, role, grant, route, public API or product policy.

After this source-audit commit independently passes exact-head Core/PostgreSQL/Database/Web verification, implement only:
- the pure Core helper;
- the eight fixed acceptance tests;
- the Core export.

The ProvisioningSnapshot capability-id → ACTIVE AICapability + Tenant allowed-capability-code relation remains the next separately governed candidate. Commercial/Industry/version currentness and AI execution remain locked.
