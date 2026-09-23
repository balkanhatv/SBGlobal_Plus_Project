# AI ProvisioningSnapshot raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-COST-READ-001`  
**Baseline branch head:** `336261c76fc0999b311abd9c5cdf08dc0548446b`  
**Scope:** next independent governed continuation after DD-123.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0011_ai_catalog_config.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-119 TenantAIConfig and DD-120 IndustryAIConfig raw-read evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.ai_provisioning_snapshot` row.

Migration 0011 physically owns:

- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL`;
- nullable `industry_context_id`;
- positive `version bigint`;
- raw `subscription_version bigint`;
- raw `entitlement_snapshot_version bigint`;
- nullable `industry_activation_version bigint`;
- non-null `ms_pack_versions jsonb`;
- non-null `country_pack_versions jsonb`;
- raw `tenant_ai_config_version bigint`;
- `allowed_capability_ids uuid[] NOT NULL`;
- `allowed_api_classes text[] NOT NULL`;
- `allowed_provider_ids uuid[] NOT NULL`;
- `allowed_model_classes text[] NOT NULL`;
- nullable raw `budget_policy_ref`;
- status enum `ACTIVE | SUPERSEDED | REVOKED`;
- `compiled_at`;
- nullable `valid_until`, constrained only to be later than `compiled_at` when present.

The table is FORCE-RLS. Tenant-Core snapshot rows are same-Tenant visible from Tenant Core and Tenant Industry contexts; Industry snapshot rows require the exact Industry Context; foreign-Tenant and PLATFORM_GLOBAL contexts do not bypass the policy. No principal id participates in snapshot RLS.

Migration 0031 adds write-time integrity:

- ms/country pack versions must be JSON objects;
- capability/provider/API/model-class sets must be duplicate-free/non-null;
- API classes must be within the four governed access classes;
- referenced TenantAIConfig version must exist and be enabled;
- allowed providers/capabilities cannot widen that persisted TenantAIConfig;
- Industry snapshot activation version must match the then-active Industry Context;
- Tenant-Core snapshot must not carry an Industry activation version;
- EntitlementSnapshot version must then be CURRENT;
- Subscription version must then equal the Tenant's current Subscription version.

Those checks prove persistence-time consistency only. A raw reader must not reinterpret a later `ACTIVE` status, `valid_until`, commercial/config version references or allowlists as current/effective authorization without a separate source-owned selector/revalidator.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on ProvisioningSnapshot persistence. DD-124 must preserve that database-owned authority while exposing only a read port.

A-07 says provisioning composes commercial/config/permission inputs into a snapshot but execution remains subject to live Gateway authorization. DD-09 states that a capability/API class absent from the effective snapshot denies execution, but it does not authorize an exact-by-id persistence reader to select which stored snapshot is current or effective.

## Authorized implementation boundary

DD-124 may implement only an exact-by-id immutable ProvisioningSnapshot persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `tenantId`;
- optional `industryContextId`;
- exact positive bigint-text `version`;
- raw bigint-text `subscriptionVersion`;
- raw bigint-text `entitlementSnapshotVersion`;
- optional raw bigint-text `industryActivationVersion`;
- normalized immutable object `msPackVersions`;
- normalized immutable object `countryPackVersions`;
- raw bigint-text `tenantAiConfigVersion`;
- immutable UUID `allowedCapabilityIds`;
- immutable constrained `allowedApiClasses`;
- immutable UUID `allowedProviderIds`;
- immutable raw text `allowedModelClasses`;
- optional raw `budgetPolicyRef`;
- constrained raw status;
- `compiledAt`;
- optional `validUntil`.

Bigint values are selected as text to avoid JavaScript precision loss. The reader may validate only database-owned persisted shapes; it may not perform commercial/config/catalog revalidation.

## Explicitly unclaimed semantics

DD-124 does **not** implement or authorize:

- selecting ACTIVE/current/latest ProvisioningSnapshot;
- evaluating `valid_until` against wall-clock time;
- compilation or recompilation;
- stale-source detection/revalidation against current Subscription, EntitlementSnapshot, TenantAIConfig or Industry activation;
- Tenant+Industry config merge;
- effective capability/API/provider/model-class eligibility;
- permission/entitlement/budget/residency/sensitivity evaluation;
- provider/model route/fallback selection;
- prompt/Assistant/Agent/Tool selection or execution;
- inference/embedding/RAG/media generation;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing ProvisioningSnapshot DML authority remains schema-owned and separately governed; the DD-124 application port is read-only.

## Acceptance expectations

1. exact Industry snapshot returns complete immutable raw evidence, including exact bigint text and frozen maps/sets;
2. sibling Industry snapshot is hidden while exact sibling context may read it;
3. Tenant-Core snapshot is same-Tenant visible from Tenant Core and Tenant Industry contexts and may preserve non-ACTIVE status/raw values;
4. same-scope visibility is not principal-private because ProvisioningSnapshot RLS has no principal predicate;
5. foreign-Tenant and PLATFORM_GLOBAL contexts cannot read the snapshot;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw status/validity/allowlists/version references do not become current/effective/authorized/routable authority, and the read port exposes no mutation/current-selector/compile/revalidate/authorize/route/execute methods.

Acceptance IDs: `AIPROVSNAP-PG-001` through `AIPROVSNAP-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-124 traceability or state promotion.
