# AI Capability Catalog Metadata Reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline checkpoint:** `DEV-AI-MODEL-CATALOG-READ-001`  
**Baseline branch head:** `c5de5b889c35354da1cb0851dca81f6963b92b49`  
**Scope:** next independent governed continuation after DD-108.

## Source reconciliation

The current AI catalog schema, dedicated AI Gateway database role, AI architecture, detailed AI design, AI integrity hardening, DD-107 provider-catalog reader, DD-108 model-catalog reader, and the current branch state were reconciled before implementation.

Relevant source owners:

- `database/migrations/0011_ai_catalog_config.sql`
- `database/migrations/0014_ai_gateway_role.sql`
- `database/migrations/0031_document_workflow_ai_integrity.sql`
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`
- `Development/AI_GATEWAY_PREREQUISITE_OWNERSHIP_AUDIT.md`
- DD-107 AI Provider Catalog Metadata Reader implementation/verification evidence
- DD-108 AI Model Catalog Metadata Reader implementation/verification evidence

## Candidate determination

The next independently source-complete persistence slice is the global `core_ai.ai_capability` catalog row.

Migration 0011 and DD-09 own exactly these persisted capability facts:

- `id uuid PRIMARY KEY`;
- unique non-null `code`;
- non-null `category` constrained to `CHAT`, `EMBEDDING`, `EXTRACTION`, `CLASSIFICATION`, `RERANK`, `OCR`, `IMAGE`, `VIDEO`, `AUDIO`, `PRESENTATION`, `DOCUMENT_INTELLIGENCE`, `AGENT`, `TOOL`, or `API`;
- nullable `required_entitlement` text;
- non-null `default_policy_class` text;
- positive non-null `schema_version`;
- non-null raw `status` text.

Migration 0014 grants the dedicated `sbg_ai_gateway_rw` role `SELECT` on `core_ai.ai_capability` and does not grant catalog `INSERT`, `UPDATE`, or `DELETE` authority. The table is a global catalog and is not a tenant FORCE-RLS table.

Migration 0031 consumes capability code/id plus `status='ACTIVE'` in database integrity predicates for Tenant AI configuration, provisioning snapshots, assistants, and related relationships. Those predicates constrain persisted relationships; they do not define request-time entitlement evaluation, live capability authorization, provider/model selection, routing, prompt/policy evaluation, quota/budget behavior, or execution.

A-07 and DD-09 explicitly keep execution behind the AI Gateway context, entitlement, policy, sensitivity/residency, provisioning, metering, guardrail, and audit pipeline. A persisted capability row therefore remains catalog evidence rather than standalone execution authority.

## Authorized implementation boundary

DD-109 may implement only a bounded exact-by-id AI Capability catalog metadata reader through the existing dedicated AI database boundary.

Authorized returned evidence:

- `id`;
- `code`;
- raw constrained `category`;
- nullable raw `requiredEntitlement`;
- raw `defaultPolicyClass`;
- positive `schemaVersion`;
- raw `status`.

Validation must remain schema-aligned only:

- UUID validation for `id`;
- category validation only against the exact database-owned CHECK values;
- text values remain text without inventing non-empty constraints absent from the schema;
- `required_entitlement` preserves `NULL` versus text exactly;
- `schema_version` is a positive safe integer;
- raw status remains raw text and is not interpreted as request eligibility.

No Tenant/Industry `RequestContext` is invented for this global catalog read.

## Explicitly unclaimed semantics

This slice does **not** authorize or implement:

- interpreting `status='ACTIVE'` as request-time capability eligibility or permission;
- entitlement lookup/evaluation from `required_entitlement`;
- evaluating or applying `default_policy_class`;
- Tenant/Industry `allowed_capabilities` resolution or effective/current AI configuration selection;
- `AIProvisioningSnapshot` compilation, current/effective selection, or authorization;
- provider/model active/current/eligible/preferred selection or routing;
- capability-to-provider/model matching or suitability decisions;
- sensitivity/residency runtime decisions;
- quota/budget reservation, usage accounting, or billing behavior;
- credential resolution, provider SDK calls, inference, embedding, rerank, OCR, media generation, RAG, assistant, agent, or tool execution;
- prompt/policy evaluator execution;
- Workflow/Automation execution or mutation semantics;
- public/API route creation;
- schema, migration, verification SQL, role, grant, RLS, or product-policy changes.

## Acceptance expectations

The implementation must prove at minimum:

1. exact-by-id read returns the complete authorized persisted capability metadata as an immutable result;
2. missing ID returns `null` and malformed UUID fails closed;
3. schema-valid empty text and nullable `required_entitlement` evidence are preserved rather than strengthened;
4. raw `ACTIVE`, `required_entitlement`, and `default_policy_class` values do not become eligibility, entitlement, policy, routing, or execution authority;
5. the dedicated AI role remains SELECT-only for `core_ai.ai_capability` and the bounded reader exposes no mutation methods.

Acceptance IDs: `AICAP-PG-001` through `AICAP-PG-005`.

Exact implementation-head Core, PostgreSQL/RLS, Database Verify, and Web Boundary CI must pass before canonical DD/acceptance traceability or state promotion.
