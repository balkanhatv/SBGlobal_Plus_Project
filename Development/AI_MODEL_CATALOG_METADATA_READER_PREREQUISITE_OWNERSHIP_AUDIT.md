# AI Model Catalog Metadata Reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline checkpoint:** `DEV-AI-PROVIDER-CATALOG-READ-001`  
**Baseline branch head:** `9a937db49c2ddac27beba74b25a54b8837ee08b9`  
**Scope:** next independent governed continuation after DD-107.

## Source reconciliation

The current AI catalog schema, dedicated AI Gateway database role, AI architecture, detailed AI design, AI integrity migration, DD-107 provider-catalog reader and current branch state were reconciled before implementation.

Relevant source owners:

- `database/migrations/0011_ai_catalog_config.sql`
- `database/migrations/0014_ai_gateway_role.sql`
- `database/migrations/0031_document_workflow_ai_integrity.sql`
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`
- `Development/AI_GATEWAY_PREREQUISITE_OWNERSHIP_AUDIT.md`
- DD-107 AI Provider Catalog Metadata Reader implementation and verification evidence.

## Candidate determination

The next independently source-complete persistence slice is the global `core_ai.ai_model` catalog row.

The source-owned persisted fields are:

- `id`
- `provider_id`
- `model_code`
- `display_name`
- `capabilities`
- `context_window_class`
- `input_modalities`
- `output_modalities`
- `residency_regions`
- `sensitivity_ceiling`
- `cost_class`
- `latency_class`
- `status`
- `version`
- `metadata_json`

`AIModel` is explicitly defined as registry data. Migration 0014 grants the dedicated `sbg_ai_gateway_rw` role SELECT on `core_ai.ai_model` and does not grant catalog INSERT/UPDATE/DELETE authority. The table is a global catalog and is not a tenant FORCE-RLS table.

Migration 0031 additionally owns provider/model pair integrity through a unique `(id,provider_id)` relationship used by downstream foreign keys. It also consumes active model rows in integrity predicates. Those database predicates are integrity constraints only; they do not define live request routing, current-version selection, provider preference, fallback, health behavior, entitlement, residency decision, or inference execution semantics.

## Authorized implementation boundary

DD-108 may implement a bounded exact-by-id AI Model catalog metadata reader through the existing dedicated AI database boundary.

Authorized returned evidence:

- `id`
- `providerId`
- `modelCode`
- `displayName`
- raw `capabilities`
- raw `contextWindowClass`
- raw `inputModalities`
- raw `outputModalities`
- raw `residencyRegions`
- raw `sensitivityCeiling`
- raw `costClass`
- raw `latencyClass`
- raw `status`
- `version`
- raw `metadata`

Validation must remain schema-aligned only:

- UUID for `id` and `provider_id`;
- text fields remain text without inventing non-empty or enumerated constraints not owned by the table;
- text arrays preserve schema-valid empty strings and nullable elements returned by PostgreSQL instead of silently strengthening persistence evidence;
- `sensitivity_ceiling` may be checked only against the exact database-owned CHECK values;
- version is a positive safe integer;
- `metadata_json` is normalized only as JSON evidence and must not become executable routing configuration.

No tenant/industry `RequestContext` is invented for this global catalog read.

## Explicitly unclaimed semantics

This slice does **not** authorize or implement:

- active/current model version selection;
- interpreting raw `status='ACTIVE'` as request eligibility;
- provider/model selection or ranking;
- provider health interpretation;
- capability suitability decisions;
- context-window sizing decisions;
- input/output modality authorization;
- sensitivity/residency runtime decisions;
- tenant or industry allowlist evaluation;
- model-class mapping (`fast`, `balanced`, `reasoning`, `embedding`);
- cost/latency scoring or preference;
- fallback, retry, replay or circuit behavior;
- quota/budget enforcement;
- credential resolution or provider SDK invocation;
- inference, embedding, rerank, RAG, assistant, agent or tool execution;
- AIProvisioningSnapshot compilation/current-selection;
- prompt/policy evaluator execution;
- public/API route creation;
- schema, migration, role, grant, RLS or product-policy changes.

## Acceptance expectations

The implementation must prove at minimum:

1. exact-by-id metadata read returns the persisted catalog evidence and immutable result;
2. missing ID returns `null` and malformed UUID fails closed;
3. schema-valid empty text / nullable-array evidence is preserved rather than strengthened;
4. raw ACTIVE/status/capability/sensitivity/cost/latency metadata does not become routing or execution authority;
5. provider/model relationship evidence is preserved exactly, while the dedicated AI role remains SELECT-only for `core_ai.ai_model` and the reader exposes no mutation methods.

Exact implementation-head Core, PostgreSQL/RLS, Database Verify and Web Boundary CI must pass before canonical DD/acceptance traceability or state promotion.
