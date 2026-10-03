# AI ProvisioningSnapshot capability binding prerequisite ownership audit

**Date:** 2026-09-28
**Baseline checkpoint:** `DEV-AI-PROVISIONING-SNAPSHOT-TENANT-CONFIG-FLOORS-001`
**Verified entry HEAD:** `982ecf2b4311d3524cac276ffc3d673915d97090`
**Verified entry tree:** `708d7b16b83de15741af87d7e6a5be5ec6e83eba`
**Governed candidate:** DD-212

## Entry gate

DD-211 canonical promotion and state closure are exact-head verified.

At the entry HEAD above:
- Core Service Verify run `36400477719`, Core job `108856866756`: **765/765 PASS**, zero failed/skipped.
- PostgreSQL job `108856866468`: **512/512 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify run `36400477817`, job `108856867146`: PASS.
- Web Boundary Verify run `36400477769`, job `108856866658`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. `main` is unmerged. RawSource is unchanged. DD-211 is the latest governed implemented checkpoint.

## Source ownership reconciled

Freshly reconciled:
- `database/migrations/0011_ai_catalog_config.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- DD-109 `AICapabilityCatalogMetadata` raw catalog evidence;
- DD-119 `PersistedAITenantConfig` raw Tenant config evidence;
- DD-124 `PersistedAIProvisioningSnapshot` raw snapshot evidence;
- DD-211 exact ProvisioningSnapshot → TenantAIConfig version/enabled/Provider-subset binding.

Migration 0031 checks each `snapshot.allowed_capability_ids[]` entry by requiring an `core_ai.ai_capability` row where:
- `capability.id = allowed_capability_id`;
- raw `capability.status = 'ACTIVE'`;
- exact raw `capability.code` is a member of the exact TenantAIConfig `allowed_capabilities` selected by snapshot Tenant + `tenant_ai_config_version`.

DD-124 exposes snapshot id/Tenant/TenantAIConfig version/allowedCapabilityIds. DD-119 exposes Tenant id/version/allowedCapabilities. DD-109 exposes capability id/code/raw status. No new persistence reader, schema, RLS, role or grant is required.

## Determination and locked DD-212 detailed contract

**SOURCE-COMPLETE for ProvisioningSnapshot allowedCapabilityIds → exact supplied ACTIVE AICapability ids whose exact codes are allowed by the exact supplied referenced TenantAIConfig.**

Authorize pure helper:

`matchesAIProvisioningSnapshotCapabilityFloors(snapshot, tenantConfig, capabilities)`

It returns boolean and never mutates inputs.

1. Validate snapshot id/Tenant id UUID shape.
2. Validate snapshot `tenantAiConfigVersion` as canonical positive bigint decimal text.
3. Validate snapshot `allowedCapabilityIds` as an actual dense, duplicate-free UUID array.
4. Validate Tenant config id/Tenant id UUID shape and positive safe-integer `version`.
5. Validate Tenant config `allowedCapabilities` as an actual dense, duplicate-free raw-string array.
6. Require exact same Tenant and exact decimal version match so capability membership is evaluated against the exact config row referenced by the snapshot. DD-211 remains the separately governed enabled/Provider-subset proof.
7. Require `capabilities` to be an array with exactly one evidence row per snapshot allowedCapabilityId and no extras.
8. Validate each capability id UUID, `code` as raw string, and `status` as raw string.
9. Require each capability id to match exactly one snapshot allowedCapabilityId.
10. Require raw capability status exactly `ACTIVE`; no trim/case normalization.
11. Require each exact capability code to be an exact member of Tenant config `allowedCapabilities`; no trim/case normalization and no invented non-empty rule.
12. Evidence order does not matter.
13. Do not interpret capability category/requiredEntitlement/defaultPolicyClass/schemaVersion, snapshot Provider/API/model/commercial/Industry/packs/budget/status/validity fields, or Tenant enabled/provider/model/policy/sensitivity fields.

## Fixed acceptance before implementation

- **AIPROVSNAP-CAP-CUR-001**: exact same-Tenant/version referenced config + complete ACTIVE capability-id/code evidence passes.
- **AIPROVSNAP-CAP-CUR-002**: foreign Tenant or wrong/malformed config version binding fails closed.
- **AIPROVSNAP-CAP-CUR-003**: missing, extra, duplicate or wrong capability-id evidence fails closed.
- **AIPROVSNAP-CAP-CUR-004**: PENDING-like/INACTIVE/retired/custom, case/whitespace `ACTIVE` variants or malformed status fail closed.
- **AIPROVSNAP-CAP-CUR-005**: capability code outside Tenant allowedCapabilities or case/whitespace variant fails; exact raw empty string may match only if both sides contain it.
- **AIPROVSNAP-CAP-CUR-006**: malformed/sparse/duplicate snapshot capability ids, malformed Tenant capability allowlist, malformed capability id/code evidence or non-array evidence fail closed.
- **AIPROVSNAP-CAP-CUR-007**: empty snapshot capability set passes only with empty capability evidence; evidence order is irrelevant.
- **AIPROVSNAP-CAP-CUR-008**: unrelated snapshot/Tenant/capability fields remain uninterpreted and inputs remain unchanged.

Expected executable delta after this source-audit commit independently passes exact-head verification: Core **765 → 773**. PostgreSQL remains **512**. Database inventory remains **48 migrations / 42 verification files**. Web behavior remains unchanged.

## Critical semantic boundary

A true DD-212 result proves only the source-owned capability-id → ACTIVE capability + exact code-in-referenced-Tenant-config relation against supplied evidence.

It does **not** prove:
- DD-211's enabled/Provider-subset relation unless DD-211 is separately true;
- snapshot ACTIVE/current/latest/unexpired status;
- capability required-entitlement satisfaction or default-policy application;
- current Subscription/Entitlement/Industry activation;
- effective Tenant+Industry AI configuration or snapshot compilation/currentness;
- API/model-class suitability;
- permission/RBAC/policy/sensitivity/residency/budget/retention;
- Provider/model routing, credentials, health, SDK dispatch, inference, embeddings, RAG, media, agents/tools or other AI execution.

## Explicit exclusions / continuation

DD-212 changes no schema, migration, RLS, role, grant, route, public API or product policy.

After this source-audit commit independently passes exact-head Core/PostgreSQL/Database/Web verification, implement only:
- the pure Core helper;
- the eight fixed acceptance tests;
- the Core export.

Commercial version and Industry activation predicates remain separately governed candidates. Do not open effective provisioning or execution until their own source-complete gates exist.
