# AIProvider catalog metadata reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline checkpoint:** `DEV-AUTOMATION-RUN-READ-001`  
**Baseline branch head:** `ac07233670928f886be55a885e2c896cee9c67de`  
**Scope:** next independent source-complete persistence slice after DD-106.

## Source reconciliation

The current Workflow/Automation persistence inventory was first re-audited before
leaving that bounded implementation family. Migration 0026 owns exactly six
`core_workflow` persistence tables:

1. `workflow_definition`;
2. `workflow_instance`;
3. `workflow_task`;
4. `workflow_transition`;
5. `automation_definition`;
6. `automation_run`.

DD-101 through DD-106 already implement the corresponding bounded PostgreSQL read
slices. Migration 0027 privileges and the broader workflow documentation do not
supply an additional persistence entity or a source-owned runtime algorithm for
active/effective definition selection, transition authorization, trigger binding,
retry/backoff/finality, replay/idempotency authorization, condition evaluation or
executor dispatch. Database mutation privilege is therefore not interpreted as
runtime semantic authority.

The next source-complete independent persistence boundary was then reconciled from:

- migration 0011 `core_ai.ai_provider` catalog schema;
- migration 0014 dedicated `sbg_ai_gateway_rw` database role;
- verification `0011_0014_ai.verify.sql`;
- migration 0031 AI integrity hardening;
- A-07 AI Platform Architecture;
- DD-09 AI / RAG / Agent Detailed Design;
- `Development/AI_GATEWAY_PREREQUISITE_OWNERSHIP_AUDIT.md`;
- `Development/CREDENTIAL_REFERENCE_METADATA_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.

## Source-owned provider catalog facts

Migration 0011 owns `core_ai.ai_provider` as a platform catalog row with:

- `id uuid PRIMARY KEY`;
- unique non-null `code`;
- non-null raw `status`;
- non-null `adapter_type`;
- non-null `supported_regions text[]`;
- non-null `supported_capabilities text[]`;
- non-null `security_class`;
- non-null `residency_metadata jsonb`;
- non-null `credential_ref`;
- non-null `health_state`;
- positive non-null `version`;
- non-null `created_at` and `updated_at`.

The provider catalog is not one of the tenant-scoped FORCE-RLS tables enumerated by
the AI verification. Migration 0014 grants `sbg_ai_gateway_rw` `SELECT` on
`ai_provider` and does not grant that role catalog mutation on `ai_provider`.
The same migration keeps the general application/worker/monitor roles away from
`core_ai` and fixes the AI Gateway role as least-privilege/NOBYPASSRLS.

Migration 0031 uses provider/model/capability catalog state as an integrity input for
tenant AI configuration and validates provider/model pairing. Those integrity rules
do not define a runtime provider-selection algorithm.

## Secret-reference boundary

DD-09 states that `AIProvider.credential_ref` is a **secret reference only**.
The existing CredentialReference metadata ownership audit already establishes that a
reusable read path must not disclose secret locators merely because a schema stores
a reference.

Accordingly, this slice MUST NOT select, return, log, normalize, resolve or expose
`credential_ref`. It also MUST NOT call a secret store or provider SDK.

The authorized persistence projection is provider **catalog metadata**, not the full
raw provider row.

## Determination

A concrete exact-by-id **AIProvider catalog metadata reader** is source-complete and
independently implementable.

A concrete AI Gateway remains **not source-complete**. This reader cannot decide that
an `ACTIVE` provider is usable for a request and cannot perform routing, fallback,
health selection, residency/sensitivity evaluation, tenant allowlist evaluation,
budget/quota evaluation, credential loading or inference.

## Authorized implementation boundary

Implement only:

1. immutable typed `AIProviderCatalogMetadata`;
2. `AIProviderCatalogMetadataReadPort.loadById(id)`;
3. a dedicated PostgreSQL AI database boundary fixed to migration 0014's
   `sbg_ai_gateway_rw` role and its existing least-privilege safety checks;
4. one parameterized exact-by-id read from `core_ai.ai_provider`;
5. schema-owned validation only for:
   - UUID id;
   - text-typed code/status/adapter/security/health values without inventing a
     non-empty constraint absent from the schema;
   - text arrays while preserving schema-allowed empty strings and nullable array
     elements rather than silently strengthening the database contract;
   - JSON residency metadata;
   - positive version;
   - valid timestamps;
6. a returned projection containing only:
   - id;
   - code;
   - raw status;
   - adapter type;
   - supported regions;
   - supported capabilities;
   - security class;
   - residency metadata;
   - raw health state;
   - version;
   - createdAt;
   - updatedAt;
7. PostgreSQL acceptance proving exact read, absent/malformed-id behavior,
   preservation of raw catalog evidence including schema-allowed empty text/array
   elements, omission of `credential_ref`, dedicated-role SELECT capability and
   absence of catalog mutation authority.

No RequestContext requirement is introduced for this global catalog read. The
reader uses the dedicated AI database role directly; it does not invent tenant
ownership or RLS over a table that the source defines as a global catalog.

## Explicitly out of scope / unclaimed

- `credential_ref` disclosure or secret retrieval;
- provider credential format or secret-store integration;
- provider/model active-version selection;
- interpreting `status='ACTIVE'` as request eligibility;
- interpreting `health_state` as a routing decision;
- tenant/Industry allowlist evaluation;
- sensitivity/residency policy evaluation;
- quota/budget reservation or accounting;
- provider/model scoring, fallback or retry behavior;
- AI provider SDK adapter implementation;
- inference, RAG, assistant, agent or tool execution;
- AIProvisioningSnapshot compilation/current-selection semantics;
- prompt/policy evaluator semantics;
- public/API route exposure;
- migration, schema, role, grant, RLS or product-policy change.

If later source evidence requires any of those behaviors, it must enter through a
separate prerequisite ownership audit rather than being inferred from this reader.
