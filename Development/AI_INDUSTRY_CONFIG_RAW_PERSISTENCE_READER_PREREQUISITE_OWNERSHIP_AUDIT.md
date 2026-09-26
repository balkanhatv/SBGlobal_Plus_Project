# AI IndustryAIConfig raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-TENANT-CONFIG-READ-001`  
**Baseline branch head:** `cecae9757cbdccb4db474672d5a7b4082139136a`  
**Scope:** next independent governed continuation after DD-119.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0011_ai_catalog_config.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-112 PromptSet and DD-119 TenantAIConfig reader evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.industry_ai_config` row.

Migration 0011 physically owns:

- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL`;
- `industry_context_id uuid NOT NULL`;
- `enabled boolean NOT NULL`;
- `allowed_capabilities text[] NOT NULL DEFAULT '{}'`;
- `allowed_provider_ids uuid[] NOT NULL DEFAULT '{}'`;
- `allowed_model_ids uuid[] NOT NULL DEFAULT '{}'`;
- nullable `domain_prompt_set_id uuid`;
- `country_pack_refs uuid[] NOT NULL DEFAULT '{}'`;
- nullable raw `localization_profile_ref`;
- positive `version bigint`;
- `updated_at timestamptz NOT NULL`;
- uniqueness of `(tenant_id,industry_context_id,version)`.

The table is FORCE-RLS and visible only when both Tenant and exact Industry Context match the current RequestContext. Tenant Core and PLATFORM_GLOBAL contexts do not implicitly expose IndustryAIConfig rows.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on `industry_ai_config`. DD-120 must preserve that database authority distinction; the new application port itself is read-only.

Migration 0031 adds write-time integrity:

- capability/provider/model/country-pack arrays must be duplicate-free non-null sets;
- the latest TenantAIConfig at write time must exist;
- Industry enablement cannot widen a disabled Tenant config;
- Industry capability/provider/model allowlists must be subsets of the latest Tenant config;
- every country-pack ref must be ACTIVE for the Tenant;
- optional domain PromptSet must be ACTIVE and applicable to the exact Industry Context.

Those facts describe insertion/update validity, not a persisted read-time effective configuration. IndustryAIConfig stores no TenantAIConfig version reference, so DD-120 must not reconstruct or claim the historical Tenant config used at write time.

DD-09 explicitly says IndustryAIConfig cannot widen TenantAIConfig and that `domain_prompt_set_id` references an ACTIVE applicable set. A-07 separately defines AI provisioning as a composition step. Therefore one raw IndustryAIConfig row is evidence only, not an effective merged config, current PromptSet selection or provisioning result.

## Authorized implementation boundary

DD-120 may implement only an exact-by-id immutable IndustryAIConfig persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `tenantId`;
- `industryContextId`;
- raw `enabled`;
- immutable raw `allowedCapabilities`;
- immutable raw `allowedProviderIds`;
- immutable raw `allowedModelIds`;
- nullable `domainPromptSetId`;
- immutable raw `countryPackRefs`;
- nullable raw `localizationProfileRef`;
- positive `version`;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers and UUID arrays;
- text-array entries remain raw strings without invented non-empty rules;
- strict boolean validation;
- positive safe-integer version;
- valid timestamp evidence;
- array order is preserved;
- nullable text is preserved, including schema-valid empty string.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- latest/current IndustryAIConfig selection;
- effective Tenant+Industry config merge;
- read-time revalidation against latest/current TenantAIConfig;
- current capability/provider/model/catalog eligibility;
- current country-pack activation evaluation;
- current domain PromptSet activity/applicability or PromptSet member resolution;
- `AIProvisioningSnapshot` compilation/current selection/validity;
- entitlement/subscription/permission/sensitivity/residency/budget/retention/prompt-policy evaluation;
- provider/model routing/fallback;
- prompt/assistant/agent/tool selection/execution;
- credentials, provider SDK calls, inference, embeddings, RAG or media generation;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing database DML authority remains schema-owned and separately governed; the DD-120 port is read-only.

## Acceptance expectations

1. exact owning Industry context returns complete immutable raw evidence;
2. Tenant Core and sibling Industry contexts cannot read the row; exact Industry context can;
3. foreign-Tenant Industry config is hidden while its owning Industry context may read it;
4. PLATFORM_GLOBAL context does not bypass Industry RLS;
5. exact-by-id versions remain distinct and nullable/empty raw evidence is preserved without latest/effective merge;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. database DML privilege remains schema-owned while the port exposes no mutation/latest/effective/merge/provision/route/execute method.

Acceptance IDs: `AIINDCFG-PG-001` through `AIINDCFG-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-120 traceability or state promotion.
