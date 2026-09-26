# AI MediaRequest raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-PROVISIONING-SNAPSHOT-READ-001`  
**Baseline branch head:** `cb2ece404eb36d332b15618062087cd51ae4fb2c`  
**Scope:** next independent governed continuation after DD-124.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0011_ai_catalog_config.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-115 PromptTemplate raw-read and DD-124 ProvisioningSnapshot raw-read evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.ai_media_request` row.

Migration 0011 physically owns:

- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL`;
- nullable `industry_context_id`;
- `principal_id uuid NOT NULL`;
- raw `capability_code` referencing `core_ai.ai_capability(code)`;
- media type enum `IMAGE | SVG | ICON | INFOGRAPHIC | PRESENTATION | VIDEO | ANIMATION | VOICE | AUDIO`;
- nullable `prompt_template_id`;
- nullable integer `prompt_version`;
- nullable bigint `brand_config_version`;
- nullable raw `localization_profile_ref`;
- non-null `input_document_refs uuid[]`;
- constrained sensitivity class `PUBLIC | INTERNAL | CONFIDENTIAL | SENSITIVE_PERSONAL | REGULATED`;
- raw `residency_requirement`;
- raw `moderation_policy_ref`;
- raw `status`;
- `created_at`;
- nullable `completed_at`, constrained only to be at or after `created_at`.

The table is FORCE-RLS. SELECT visibility is Tenant/Industry scoped: same Tenant plus either Tenant-Core row or exact Industry Context. The SELECT policy does not predicate on `principal_id`; principal equality exists only in the write `WITH CHECK`. Therefore same-scope active principals may read the same persisted request, while sibling Industry, foreign Tenant and PLATFORM_GLOBAL contexts cannot bypass the row policy.

Migration 0031 adds write-time integrity:

- the referenced request principal must be active for the Tenant at `created_at`;
- `input_document_refs` must be a duplicate-free/non-null UUID set;
- when a prompt reference is present, `prompt_version` is required and must match an ACTIVE, same-or-broader applicable PromptTemplate at write time;
- `prompt_version` without a prompt id is rejected;
- each input document must then be ACTIVE, CLEAN, exact Tenant/Industry scoped, no more sensitive than the request, and in the exact requested residency region.

Those checks prove persistence-time relationship integrity only. A raw reader must not reinterpret historical prompt/document evidence, raw status or `completed_at` as a current media-generation, moderation, completion or publication decision.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on MediaRequest persistence. DD-125 must preserve that database-owned authority while exposing only a read port.

DD-09/A-07 state that media generation remains behind the AI Gateway/provider registry and successful output must enter Document/Media governance with provenance, moderation/licensing metadata and DocumentMeta registration. An AIMediaRequest row alone is therefore request evidence, not output/publication authority.

## Authorized implementation boundary

DD-125 may implement only an exact-by-id immutable MediaRequest persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `tenantId`;
- optional `industryContextId`;
- `principalId` attribution;
- raw `capabilityCode`;
- constrained raw `mediaType`;
- optional `promptTemplateId`;
- optional raw safe-integer `promptVersion`;
- optional exact bigint-text `brandConfigVersion`;
- optional raw `localizationProfileRef`;
- immutable UUID `inputDocumentRefs`;
- constrained raw `sensitivityClass`;
- raw `residencyRequirement`;
- raw `moderationPolicyRef`;
- raw `status`;
- `createdAt`;
- optional `completedAt`.

Validation remains schema/integrity-aligned only. Bigint evidence is selected as text to avoid JavaScript precision loss. The reader does not perform current prompt/document/principal/catalog revalidation.

## Explicitly unclaimed semantics

DD-125 does **not** implement or authorize:

- media generation or provider/model selection;
- prompt loading, rendering, current-version selection or prompt-policy evaluation;
- current input-document ACL/state/scan/sensitivity/residency revalidation;
- moderation execution or interpretation of `moderation_policy_ref`;
- treating raw `status` or `completed_at` as a governed completion/publication verdict;
- generated-output creation or DocumentMeta registration;
- provenance/licensing/usage-metadata generation;
- brand/localization profile resolution;
- capability/entitlement/permission/budget/residency authorization;
- retry/fallback/routing behavior;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing MediaRequest DML authority remains schema-owned and separately governed; the DD-125 application port is read-only.

## Acceptance expectations

1. exact Industry MediaRequest returns complete immutable raw evidence, including exact bigint-text brand version and frozen input-document refs;
2. sibling Industry request is hidden while exact sibling context may read it;
3. Tenant-Core request is same-Tenant visible from Tenant Core and Tenant Industry contexts and preserves nullable/raw values;
4. MediaRequest SELECT visibility is not principal-private even though writes require the current principal;
5. foreign-Tenant and PLATFORM_GLOBAL contexts cannot read the request;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw prompt/document/status/moderation/completion evidence does not become generation/moderation/publication/execution authority, and the read port exposes no mutation/render/generate/moderate/publish/route/execute methods.

Acceptance IDs: `AIMEDIAREQ-PG-001` through `AIMEDIAREQ-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-125 traceability or state promotion.
