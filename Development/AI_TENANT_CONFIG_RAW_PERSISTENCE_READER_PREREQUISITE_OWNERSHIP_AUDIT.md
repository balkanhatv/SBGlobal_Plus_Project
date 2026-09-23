# AI TenantAIConfig raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-AGENT-DEFINITION-READ-001`  
**Baseline branch head:** `b7c0f6ff11c4bcf00b721e3b568d2d01d54d2de9`  
**Scope:** next independent governed continuation after DD-118.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0011_ai_catalog_config.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-105/106/107/108/109 and DD-115–118 AI catalog/definition reader evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.tenant_ai_config` row.

Migration 0011 physically owns:

- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL`;
- `enabled boolean NOT NULL`;
- `allowed_capabilities text[] NOT NULL DEFAULT '{}'`;
- `allowed_provider_ids uuid[] NOT NULL DEFAULT '{}'`;
- `allowed_model_ids uuid[] NOT NULL DEFAULT '{}'`;
- `max_sensitivity_class` constrained to `PUBLIC | INTERNAL | CONFIDENTIAL | SENSITIVE_PERSONAL | REGULATED`;
- `residency_policy_id uuid NOT NULL`;
- nullable raw `monthly_budget_policy_ref`;
- `retention_policy_id uuid NOT NULL`;
- `prompt_override_policy_id uuid NOT NULL`;
- positive `version bigint`;
- `updated_at timestamptz NOT NULL`;
- uniqueness of `(tenant_id,version)`.

The table is FORCE-RLS. Visibility is exact Tenant ownership: `tenant_id=current_tenant_id()`. The same Tenant Core or Tenant Industry RequestContext may see Tenant-owned configuration; a foreign Tenant and PLATFORM_GLOBAL context may not.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on `tenant_ai_config`. DD-119 must not relabel that database role read-only; the new application port itself will be read-only.

Migration 0031 adds write-time integrity for TenantAIConfig:

- allowed capability/provider/model arrays must be duplicate-free non-null sets;
- capability codes must reference ACTIVE capabilities;
- provider IDs must reference ACTIVE providers;
- model IDs must reference ACTIVE models whose provider is included in the allowed provider set.

Those write-time invariants do not make an arbitrary persisted row the latest/effective runtime configuration. Multiple versions may exist for one Tenant, and downstream `AIProvisioningSnapshot` explicitly references a concrete `tenant_ai_config_version`.

DD-09 states that Industry configuration cannot widen TenantAIConfig and that AI provisioning composes commercial/industry/pack/config inputs into an `AIProvisioningSnapshot`. A raw TenantAIConfig row is therefore source evidence, not a compiled provisioning result or runtime authorization decision.

## Authorized implementation boundary

DD-119 may implement only an exact-by-id immutable TenantAIConfig persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `tenantId`;
- raw `enabled`;
- immutable raw `allowedCapabilities`;
- immutable raw `allowedProviderIds`;
- immutable raw `allowedModelIds`;
- constrained raw `maxSensitivityClass`;
- `residencyPolicyId`;
- nullable raw `monthlyBudgetPolicyRef`;
- `retentionPolicyId`;
- `promptOverridePolicyId`;
- positive `version`;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- text-array elements remain raw strings without invented non-empty rules;
- UUID arrays validate each persisted identifier;
- boolean remains strict boolean;
- sensitivity class validates only the database-owned vocabulary;
- version must be a positive safe integer;
- timestamp must be valid persisted evidence;
- array order is preserved; no effective-set sorting or strengthening is invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- latest/current TenantAIConfig selection by version;
- effective Tenant AI configuration resolution;
- runtime enablement or authorization from `enabled`;
- capability/provider/model eligibility evaluation;
- current catalog activity revalidation;
- IndustryAIConfig merge/narrowing resolution;
- `AIProvisioningSnapshot` compilation, current selection or validity evaluation;
- entitlement/subscription/permission evaluation;
- sensitivity/residency/budget/retention/prompt-override policy evaluation;
- provider/model routing or fallback;
- prompt/assistant/agent/tool selection or execution;
- credentials, provider SDK calls, inference, embedding, RAG or media generation;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing database DML authority remains schema-owned and separately governed; the DD-119 port is read-only.

## Acceptance expectations

1. exact Tenant config returns complete immutable raw metadata;
2. same-Tenant Tenant Core and Tenant Industry contexts can read the same row;
3. foreign-Tenant config is hidden while its owning Tenant may read it;
4. PLATFORM_GLOBAL context does not bypass Tenant RLS;
5. exact-by-id reads preserve distinct versions/raw nullable text and do not select latest/effective config;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. database DML privilege remains schema-owned while the new port exposes no mutation/latest/effective/provision/route/execute method.

Acceptance IDs: `AITENCFG-PG-001` through `AITENCFG-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-119 traceability or state promotion.
