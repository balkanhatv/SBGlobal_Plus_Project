# DEVELOPMENT DD-107 VERIFICATION — 2026-09-22

## Scope

This register records governed verification and promotion evidence for **DD-107 — AI Provider Catalog Metadata Reader**.

The slice is intentionally bounded to a source-complete, exact-by-id, global AI provider catalog metadata read through the dedicated PostgreSQL AI Gateway role. It does **not** authorize or implement concrete AI Gateway runtime selection, routing, secret resolution, provider SDK/inference execution, tenant AI policy evaluation, or Workflow/Automation execution semantics.

## Baseline

- Prior promoted checkpoint: `DEV-AUTOMATION-RUN-READ-001`
- Prior DD-106 final head: `ac07233670928f886be55a885e2c896cee9c67de`
- DD-107 prerequisite/source audit: `Development/AI_PROVIDER_CATALOG_METADATA_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`
- Audit commit: `0958787009f437b20038c9352e65ae3f3b8535f0`
- Audit tree: `f425942be3e64d97403ea2ddcfbfcafbc2dd1207`

## Source-Authority Finding

The Workflow/Automation raw PostgreSQL persistence family is exhausted at the six already-covered tables:

1. `core_workflow.workflow_definition`
2. `core_workflow.workflow_instance`
3. `core_workflow.workflow_task`
4. `core_workflow.workflow_transition`
5. `core_workflow.automation_definition`
6. `core_workflow.automation_run`

DD-101 through DD-106 cover those six raw persistence reads. No seventh Workflow/Automation persistence entity was found, and source authority remains insufficient to infer execution/mutation semantics such as selector precedence, legal run-transition matrices, retry/replay authorization, executor dispatch, trigger execution, condition evaluation, or OperationContract dispatch.

The next independently source-complete slice was therefore the global `core_ai.ai_provider` catalog metadata read, without claiming concrete AI Gateway runtime semantics.

## Secret-Reference Boundary

`AIProvider.credential_ref` is source-defined as a secret reference. Existing credential-reference governance does not authorize reusable readers to expose sensitive secret locators merely because a schema stores such a reference.

DD-107 therefore deliberately excludes `credential_ref` from:

- the SQL projection,
- the returned core contract,
- normalization/validation output,
- logs,
- any resolution or retrieval path.

No secret store integration or credential resolution is introduced.

## Implementation Basis

- Implementation commit: `b75b6b2fe93be4dcea2ff5ed9020e66acde03e08`
- Implementation tree: `2a80273e064e7cce7bb8dcb82b6e2f25493f4e9c`
- Commit message: `feat(ai): add bounded provider catalog metadata reader`

Implementation files:

- `src/core/ai/provider-catalog-metadata.ts`
- `src/server/database/postgres-ai-gateway-database.ts`
- `src/server/ai/postgres-ai-provider-catalog-metadata-store.ts`
- `tests/postgres/ai-provider-catalog-metadata-store.test.mjs`
- `src/core/index.ts` export update

The store performs an exact-by-id read from `core_ai.ai_provider` through the dedicated `sbg_ai_gateway_rw` role. It preserves raw schema evidence such as status/health text, nullable array elements, empty array strings, JSON metadata, version, and timestamps without converting those values into routing or execution authority.

No tenant/industry `RequestContext` was invented for this global catalog read.

## Implementation-Head CI Evidence

Exact implementation head: `b75b6b2fe93be4dcea2ff5ed9020e66acde03e08`.

### Core Service Verify

- Workflow run: `35697472320`
- Core job: `106647432209`
- Result: **311 / 311 PASS**, 0 failures
- Requirement preservation validation: **2,962 canonical Requirement IDs + source text preserved**
- Requirement source coverage: **2,962 / 2,962**
- Module-ID coverage: **2,962 / 2,962**
- Capability coverage: **2,962 / 2,962**

### PostgreSQL / RLS

- Workflow run: `35697472320`
- PostgreSQL/RLS job: `106647432487`
- Result: **190 / 190 PASS**, 0 failures
- TAP plan: `1..190`
- DD-107 acceptance tests occupy test positions 184–188:
  - `AIPROV-PG-001`
  - `AIPROV-PG-002`
  - `AIPROV-PG-003`
  - `AIPROV-PG-004`
  - `AIPROV-PG-005`

### Database Verify

- Workflow run: `35697472248`
- Result: **PASS**
- Migrations verified: **47**
- Verification SQL files: **41**
- Canonical industry invariant: **9 industries**
- Canonical Management System invariant: **41 Management Systems**
- Registered Industry table invariant: **181 tables**

### Web Boundary Verify

- Workflow run: `35697472439`
- Result: **PASS**

## Acceptance Contracts

### AIPROV-PG-001 — exact metadata read and secret-reference exclusion

Exact provider metadata is read by provider ID; persisted evidence is preserved and returned data is immutable/frozen. `credential_ref` is absent from the projection/contract, and a credential sentinel inserted into persistence cannot leak through the reader.

### AIPROV-PG-002 — missing and malformed ID behavior

A missing provider returns `null`; a malformed UUID fails closed.

### AIPROV-PG-003 — schema evidence preservation

Schema-allowed empty text values and nullable/empty array elements are preserved rather than strengthened into undocumented validation rules.

### AIPROV-PG-004 — raw catalog state is not runtime authority

Raw `ACTIVE`/status/health evidence does not become provider selection, eligibility, routing, fallback, credential, generation, or execution authority.

### AIPROV-PG-005 — dedicated role read boundary

The dedicated AI role can SELECT the catalog record but does not receive INSERT/UPDATE/DELETE catalog mutation authority. An UPDATE attempt is rejected, and the reader exposes no mutation method.

## Canonical Traceability

Canonical DD/acceptance traceability was appended after implementation-head CI succeeded:

- Canonical commit: `df62215a900f9b0f72465ee6629864145fb7e34a`
- Canonical tree: `9fe306e8817a65f1ee35d48dcb34cfae1573184d`
- `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` — DD-107 decision
- `DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md` — AIPROV-PG-001…005

The one-time canonical helper workflow self-removed after producing the canonical commit.

## Explicitly Unclaimed Runtime Semantics

DD-107 does **not** claim or implement:

- credential-reference disclosure, secret retrieval, or credential resolution;
- provider credential format/store integration;
- active-version/provider/model selection semantics;
- treating provider status or health as request eligibility;
- health-based routing;
- tenant/industry allowlist evaluation;
- sensitivity/residency policy evaluation;
- quota/budget execution;
- provider scoring, fallback, retry, or replay semantics;
- provider SDK adapters or inference execution;
- RAG, assistant, agent, or tool execution;
- `AIProvisioningSnapshot` compilation/current-selection semantics;
- prompt/policy evaluator execution;
- public/API routing for this reader;
- Workflow/Automation execution or mutation semantics.

## Security / Schema Boundary

DD-107 introduces no migration, schema, role-definition, grant, RLS-policy, or product-policy change. Existing schema-owned privileges are not reinterpreted as runtime semantic authority.

## Promotion Gate Status

- Canonical DD-107 traceability: **COMPLETE**
- Implementation-head CI: **GREEN**
- Connector-authored invariant gate: **PENDING on this register head**
- State/checkpoint promotion to `DEV-AI-PROVIDER-CATALOG-READ-001`: **PENDING invariant-gate success**
- Final exact promotion-head CI: **PENDING**
- Final safety verification: **PENDING**

The checkpoint MUST NOT be treated as promoted until the pending invariant gate, state synchronization, exact final-head CI, and safety verification are complete.
