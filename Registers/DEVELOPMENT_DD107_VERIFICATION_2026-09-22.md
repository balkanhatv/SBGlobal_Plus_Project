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

DD-101 through DD-106 cover those six raw persistence reads. No seventh Workflow/Automation persistence entity was found, and database privileges over those tables do not create source authority for execution/mutation semantics such as selector precedence, legal transition matrices, retry/replay authorization, trigger execution, condition evaluation, executor dispatch, or OperationContract dispatch.

The next independently source-complete slice was therefore the global `core_ai.ai_provider` catalog metadata read, without claiming concrete AI Gateway runtime semantics.

## Secret-Reference Boundary

`AIProvider.credential_ref` is source-defined as a secret reference. Existing credential-reference governance does not authorize reusable readers to expose sensitive secret locators merely because persistence stores such a reference.

DD-107 deliberately excludes `credential_ref` from the SQL projection, returned core contract, normalization/validation output, logs, and any resolution or retrieval path. No secret-store integration or credential resolution is introduced.

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

The store performs an exact-by-id read from `core_ai.ai_provider` through the dedicated `sbg_ai_gateway_rw` role. It preserves schema-valid raw catalog evidence without converting status/health into routing or execution authority. No tenant/industry `RequestContext` was invented for this global catalog read.

## Implementation-Head CI Evidence

Exact implementation head: `b75b6b2fe93be4dcea2ff5ed9020e66acde03e08`.

### Core Service Verify

- Workflow run: `35697472320`
- Core job: `106647432209`
- Result: **311 / 311 PASS**, 0 failures
- Requirement preservation: **2,962 / 2,962 canonical Requirement IDs + source text preserved**

### PostgreSQL / RLS

- Workflow run: `35697472320`
- PostgreSQL/RLS job: `106647432487`
- Result: **190 / 190 PASS**, 0 failures
- TAP plan: `1..190`
- DD-107 acceptance tests: `AIPROV-PG-001` through `AIPROV-PG-005`

### Database Verify

- Workflow run: `35697472248`
- Result: **PASS**
- Migrations verified: **47**
- Verification SQL files: **41**
- Canonical invariants: **9 industries / 41 Management Systems / 181 registered Industry tables**

### Web Boundary Verify

- Workflow run: `35697472439`
- Result: **PASS**

## Acceptance Contracts

- `AIPROV-PG-001` — exact metadata read, immutable/frozen evidence, `credential_ref` absent, persisted credential sentinel cannot leak.
- `AIPROV-PG-002` — missing exact ID returns `null`; malformed UUID fails closed.
- `AIPROV-PG-003` — schema-valid empty text and nullable/empty array evidence is preserved.
- `AIPROV-PG-004` — raw `ACTIVE`/status/health evidence does not become selection, eligibility, routing, fallback, credential, generation, or execution authority.
- `AIPROV-PG-005` — dedicated AI role can SELECT but has no provider-catalog INSERT/UPDATE/DELETE authority; UPDATE is rejected and reader exposes no mutation API.

## Canonical Traceability

Canonical DD/acceptance traceability was appended only after implementation-head CI succeeded:

- Canonical commit: `df62215a900f9b0f72465ee6629864145fb7e34a`
- Canonical tree: `9fe306e8817a65f1ee35d48dcb34cfae1573184d`
- `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` — DD-107 decision
- `DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md` — `AIPROV-PG-001…005`

The one-time canonical helper workflow self-removed after producing the canonical commit.

## Connector-Authored Invariant Gate

Register/invariant-gate head: `0a230cd6828a84fd6112ee00b1a75333d65ec1c4`.

- Core Service Verify run `35726430207` — **SUCCESS**
  - Core job `106741093806`
  - **311 / 311 PASS**
  - **9 industries / 41 canonical Management Systems / 181 registered Industry tables**
  - **2,962 / 2,962 source requirements preserved**
- PostgreSQL/RLS job `106741094034` — **SUCCESS**, full PostgreSQL/RLS suite including `AIPROV-PG-001…005`
- Database Verify run `35726430210` — **SUCCESS**
  - DB job `106741099577`
  - **47 migrations / 41 verification SQL files PASS**
- Web Boundary Verify run `35726430254` — **SUCCESS**

The gate did not authorize any new runtime semantics; it only revalidated the implementation and repository invariants before state promotion.

## State / Checkpoint Promotion

Promoted checkpoint: `DEV-AI-PROVIDER-CATALOG-READ-001`.

- State-promotion commit: `469c44e02d01978b50feef8c2982d7602f97b137`
- State-promotion tree: `3e9168b879ef9d4c06d4512fa041bf11feb4d28d`
- Executable evidence basis remains the already-verified implementation commit/tree `b75b6b2fe93be4dcea2ff5ed9020e66acde03e08` / `2a80273e064e7cce7bb8dcb82b6e2f25493f4e9c`; the state commit is not used as self-referential executable evidence.
- Gate-head `0a230cd6828a84fd6112ee00b1a75333d65ec1c4` → state-head `469c44e02d01978b50feef8c2982d7602f97b137` compare shows **exactly nine net modified files** and no helper artifact:
  1. `DetailedDesign/DD-CHECKPOINT.md`
  2. `DetailedDesign/DD-INDEX.md`
  3. `DetailedDesign/DD-PHASE_STATE.md`
  4. `Development/CORE_SERVICE_CHECKPOINT.md`
  5. `Development/DEVELOPMENT_STATE.md`
  6. `State/HANDOFF_NOTE.md`
  7. `State/PHASE_SUMMARY.md`
  8. `State/PROJECT_MANIFEST.json`
  9. `State/PROJECT_STATE.md`
- The one-time state workflow and helper script self-removed from the final state tree.

The promoted state records DD-101–106 as the exhausted raw Workflow/Automation persistence reader family and directs the next step to a **fresh source audit of the next independent source-complete AI persistence slice**. It does not pre-authorize `ai_model` or any runtime behavior.

## Explicitly Unclaimed Runtime Semantics

DD-107 does **not** claim or implement:

- credential-reference disclosure, secret retrieval, credential resolution, or secret-store integration;
- provider/model active-version selection or request eligibility;
- health-based routing, provider scoring, fallback, retry, replay, or finality;
- tenant/industry allowlists, sensitivity/residency decisions, budget/quota execution;
- provider SDK adapters or inference execution;
- RAG, assistant, agent, or tool execution;
- `AIProvisioningSnapshot` compilation/current-selection;
- prompt/policy evaluator execution;
- public/API routing for this reader;
- Workflow/Automation execution or mutation semantics.

## Security / Schema Boundary

DD-107 introduces no migration, schema, role-definition, grant, RLS-policy, or product-policy change. Existing schema-owned privileges are not reinterpreted as runtime semantic authority.

## Final Promotion Gate Status

- Canonical DD-107 traceability: **COMPLETE**
- Implementation-head CI: **GREEN**
- Connector-authored invariant gate: **GREEN**
- State/checkpoint promotion to `DEV-AI-PROVIDER-CATALOG-READ-001`: **COMPLETE**
- Nine-file promotion diff / helper self-removal verification: **PASS**
- Final exact promotion-head CI: **TRIGGERED BY THIS CONNECTOR-AUTHORED REGISTER UPDATE; MUST PASS BEFORE DD-107 IS DECLARED CLOSED**
- Final safety verification (`main`, RawSource, helper absence, no unintended schema/security-policy change): **MUST BE RECONFIRMED AFTER FINAL EXACT-HEAD CI**

DD-107 MUST NOT be declared closed until the exact head created by this register update passes Core Service, PostgreSQL/RLS, Database and Web verification and the final safety checks remain clean.
