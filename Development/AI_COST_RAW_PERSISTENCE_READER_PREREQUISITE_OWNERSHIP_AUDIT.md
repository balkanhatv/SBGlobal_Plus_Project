# AI Cost raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-TOKEN-USAGE-READ-001`  
**Baseline branch head:** `9f33230eaf6d4cf9fab093593ca24a5f2d412a58`  
**Scope:** next independent governed continuation after DD-122.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0012_ai_rag_memory_usage.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-122 TokenUsage raw persistence evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.ai_cost` row.

Migration 0012 physically owns:

- `usage_id uuid PRIMARY KEY` referencing `core_ai.token_usage(id)`;
- non-null `cost_currency char(3)`;
- non-negative non-null PostgreSQL `bigint estimated_minor_units`;
- non-null raw `provider_rate_version` text;
- non-null raw `billable_class` text;
- optional `finalized_at` timestamp.

The table is FORCE-RLS with parent-derived visibility: an AI Cost row is visible only when its referenced TokenUsage parent is visible under TokenUsage Tenant/Industry RLS. Therefore:

- an Industry cost row is exact-Industry visible;
- a Tenant-Core cost row is same-Tenant visible from Tenant Core or Tenant Industry contexts;
- foreign-Tenant and PLATFORM_GLOBAL contexts cannot see it;
- parent `principal_id` remains attribution rather than a cost-row read ownership predicate because TokenUsage RLS itself is not principal-scoped.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on `ai_cost`. DD-123 must preserve that schema-owned DML authority while exposing only a read port.

DD-09 §18 names usage/cost as observability evidence. Neither migration 0012 nor DD-09 defines a rate application formula, currency conversion rule, invoice linkage, billable-class evaluator, finalized-cost workflow or billing-posting behavior for this reader.

## Authorized implementation boundary

DD-123 may implement only an exact-by-usage-id immutable AI Cost persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `usageId`;
- raw `costCurrency`;
- exact PostgreSQL bigint-text `estimatedMinorUnits`;
- raw `providerRateVersion`;
- raw `billableClass`;
- optional `finalizedAt`.

Validation remains schema-aligned only:

- UUID validation for `usageId`;
- `estimated_minor_units` is selected as PostgreSQL `bigint::text`, avoiding JavaScript number precision loss;
- no rate/currency/billing arithmetic is performed;
- raw currency/rate-version/billable-class text is not interpreted;
- optional finalized timestamp is preserved as evidence only.

## Explicitly unclaimed semantics

DD-123 does **not** implement or authorize:

- provider rate lookup/application;
- currency conversion;
- cost recomputation or reconciliation;
- usage aggregation or metering-window selection;
- quota/entitlement/budget evaluation;
- billable-class interpretation;
- cost finalization;
- invoice, tax, payment, dunning or ledger behavior;
- provider/model routing or eligibility;
- TokenUsage mutation;
- AI Cost mutation through the new read port;
- conversation/message/prompt content access;
- inference/RAG/media/tool/agent execution;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

## Acceptance expectations

1. exact Industry cost returns immutable raw cost evidence and exact bigint text;
2. sibling Industry cost is hidden while exact sibling context may read it;
3. Tenant-Core cost is same-Tenant visible from Tenant Core and Tenant Industry contexts;
4. parent principal attribution does not create principal-private cost visibility;
5. foreign-Tenant and PLATFORM_GLOBAL contexts cannot read the cost;
6. missing well-formed usage id returns null; malformed id and route mismatch fail closed;
7. raw currency/minor-unit/rate-version/billable/finalized evidence does not become pricing/billing/finalization/execution authority, and the read port exposes no mutation/aggregate/rate/finalize/invoice/execute methods.

Acceptance IDs: `AICOST-PG-001` through `AICOST-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-123 traceability or state promotion.
