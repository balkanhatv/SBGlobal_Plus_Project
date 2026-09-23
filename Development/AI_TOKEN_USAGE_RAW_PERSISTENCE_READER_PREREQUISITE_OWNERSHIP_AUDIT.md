# AI TokenUsage raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-CONVERSATION-READ-001`  
**Baseline branch head:** `31cd17af9705697c75f140ab21ce076ad6a3a718`  
**Scope:** next independent governed continuation after DD-121.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0011_ai_catalog_config.sql`;
- `database/migrations/0012_ai_rag_memory_usage.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-107/108 provider/model catalog evidence and DD-121 conversation boundary.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.token_usage` row.

Migration 0012 physically owns:

- `id uuid PRIMARY KEY`;
- non-null `tenant_id` and optional `industry_context_id`;
- optional `principal_id`;
- non-null `capability_code`;
- non-null `provider_id`;
- non-null `model_id`;
- non-negative PostgreSQL `numeric` `input_units` and `output_units`;
- optional non-negative `media_units`;
- non-null `occurred_at`;
- non-null `correlation_id`.

Migration 0031 adds exact model/provider pair integrity through `FOREIGN KEY (model_id,provider_id) REFERENCES core_ai.ai_model(id,provider_id)`.

The table is FORCE-RLS. Visibility is Tenant/Industry scoped only:

- exact Tenant is required;
- a Tenant-Core row (`industry_context_id IS NULL`) is visible from the same Tenant Core or Tenant Industry context;
- an Industry row is visible only in the exact Industry Context;
- PLATFORM_GLOBAL and foreign-Tenant contexts cannot see Tenant usage.

`principal_id` is attribution evidence, not a read-visibility predicate. A different active current principal in the same authorized Tenant/Industry context can read the row if the Tenant/Industry RLS predicate permits it.

Migration 0031 validates only a non-null usage principal at write time: if present, it must be active for the Tenant at `occurred_at`. The persisted row does not prove that principal remains active later.

Provider/model/capability foreign keys and the model/provider pair prove persisted referential identity only. A historical usage row does not mean that provider/model/capability is currently ACTIVE, eligible, routable, preferred or permitted for a new request.

Migration 0014 gives `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on `token_usage`. DD-122 must preserve that schema-owned write authority while exposing only a read port.

DD-09 §18 owns usage/cost as observability evidence and explicitly forbids raw sensitive prompts as metric/log labels. DD-122 reads no prompt/message content.

## Authorized implementation boundary

DD-122 may implement only an exact-by-id immutable TokenUsage persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `tenantId`;
- optional `industryContextId`;
- optional `principalId`;
- raw `capabilityCode`;
- `providerId`;
- `modelId`;
- exact decimal-string `inputUnits`;
- exact decimal-string `outputUnits`;
- optional exact decimal-string `mediaUnits`;
- `occurredAt`;
- `correlationId`.

Validation remains schema-aligned only:

- UUID validation for persisted identifiers;
- numeric evidence is selected as PostgreSQL text and validated as non-negative decimal text, avoiding JavaScript floating-point precision loss;
- optional principal/media evidence stays optional;
- no unit conversion, aggregation, pricing, cost or quota interpretation is introduced;
- no provider/model/capability current-state lookup is performed;
- timestamps must be valid persisted values.

## Explicitly unclaimed semantics

DD-122 does **not** implement or authorize:

- provider/model/capability selection, eligibility, routing, fallback or health interpretation;
- current provider/model/capability status revalidation;
- entitlement/permission/budget/quota/limit decisions;
- aggregation, metering windows, rate-card application, cost computation or billing;
- `ai_cost` loading or finalization;
- conversation/message linkage or prompt/content access;
- inference, embeddings, media generation, RAG or agent/tool execution;
- TokenUsage mutation through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

## Acceptance expectations

1. exact Industry TokenUsage returns immutable raw usage evidence with exact decimal strings;
2. sibling Industry usage is hidden while exact sibling context may read it;
3. Tenant-Core usage is same-Tenant visible from Tenant Core and Tenant Industry contexts;
4. `principal_id` remains attribution rather than RLS ownership: another active principal in the same Tenant/Industry context can read the row;
5. foreign-Tenant and PLATFORM_GLOBAL contexts cannot read Tenant usage;
6. missing well-formed id returns null; malformed id and route mismatch fail closed;
7. historical provider/model/capability/unit evidence does not become current routing/eligibility/billing/execution authority, and the read port exposes no mutation/aggregate/cost/route/execute method.

Acceptance IDs: `AIUSAGE-PG-001` through `AIUSAGE-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-122 traceability or state promotion.
