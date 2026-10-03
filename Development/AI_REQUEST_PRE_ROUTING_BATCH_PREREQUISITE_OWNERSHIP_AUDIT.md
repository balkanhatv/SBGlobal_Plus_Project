# AIRequest pre-routing prerequisite batch ownership audit

**Date:** 2026-09-29  
**Baseline checkpoint:** `DEV-AI-PROVIDER-MODEL-CATALOG-PRE-CANDIDATE-SET-001`  
**Verified entry HEAD:** `d940e4dd6bcee4635ecaff18ce01b5a4efbdc582`  
**Verified entry tree:** `1a9a809896b490c6d5b546708056c63c9f1e5f54`  
**Governed batch:** DD-243 through DD-247

## Entry gate

The DD-238…DD-242 state closure is exact-head verified:
- Core Service Verify `36528504518` / `109276692511`: **870/870 PASS**, zero failed/skipped.
- PostgreSQL `36528504518` / `109276692395`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36528504512` / `109276692130`: PASS.
- Web Boundary Verify `36528504632` / `109276692544`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-07, DD-06, DD-09, DD-225…DD-230 and the existing AI sensitivity vocabulary yields one source-complete backend boundary:

- A-07 requires every AI use to enter the AI Gateway with server-authoritative RequestContext, entitlement, security and residency controls before routing/provider execution.
- DD-09 §3 defines the AIRequest field set exactly:
  `requestId, capabilityCode, requestContextRef, conversationId?, inputSchemaVersion, input, sensitivityClass, residencyRequirement, groundingMode, requestedOutputSchema?, latencyClass?, budgetClass?, allowedSourceScopes?, correlationId`.
- DD-09 states that the Gateway enriches from server context; clients do not supply trusted Tenant/Industry/permission facts.
- DD-06 owns canonical OperationContract `inputSchemaVersion`.
- DD-225 owns the AI operation declaration including exact `capabilityCode`.
- The existing AI model catalog contract already owns the closed sensitivity vocabulary:
  `PUBLIC | INTERNAL | CONFIDENTIAL | SENSITIVE_PERSONAL | REGULATED`.

The source does **not** define a closed vocabulary for `residencyRequirement`, `groundingMode`, `latencyClass`, `budgetClass` or `allowedSourceScopes` here. This batch therefore validates those as raw non-empty string evidence only and does not interpret them.

## Determination

**SOURCE-COMPLETE for AIRequest pre-routing contract integrity only.**

This batch may validate and project the DD-09 AIRequest envelope and bind it to the canonical AI operation capability/input-schema contract. It does not resolve RequestContext, authorize residency, evaluate grounding policy, reserve budget/quota, choose a candidate or execute AI.

## Locked DD-243…DD-247 contracts

### DD-243 — Exact AIRequest shape floor
Add `matchesAIRequestShapeFloor(request)`.

Required top-level fields:
`requestId, capabilityCode, requestContextRef, inputSchemaVersion, input, sensitivityClass, residencyRequirement, groundingMode, correlationId`.

Optional fields:
`conversationId, requestedOutputSchema, latencyClass, budgetClass, allowedSourceScopes`.

Rules:
- no unknown top-level fields;
- required string fields are non-empty exact strings;
- `inputSchemaVersion` is a positive safe integer;
- `input` and optional `requestedOutputSchema` are JSON values;
- `sensitivityClass` uses only the existing five-value sensitivity vocabulary;
- optional string fields, when present, are non-empty strings;
- `allowedSourceScopes`, when present, is a dense array of non-empty strings;
- no normalization, vocabulary invention or trusted-context enrichment.

Rejecting unknown top-level fields ensures client-supplied Tenant/Industry/permission claims cannot be smuggled beside the canonical DD-09 envelope. Arbitrary keys inside `input` remain application payload and are not interpreted as trusted context.

### DD-244 — Immutable canonical AIRequest projection
Add `projectAIRequest(request)`.

For a valid DD-243 request:
- return only the exact DD-09 fields;
- deep-clone/freeze JSON values and list evidence;
- preserve raw values exactly;
- invalid requests return `null`.

Projection is not authorization and does not dereference `requestContextRef`.

### DD-245 — AIRequest capability binding prerequisite
Add `matchesAIRequestOperationCapabilityFloor(request, declaration)`.

Require:
- valid DD-243 request;
- valid DD-225 AI operation declaration;
- exact `request.capabilityCode === declaration.ai.capabilityCode`.

No capability entitlement/policy or Provider/Model eligibility is inferred.

### DD-246 — AIRequest input-schema binding prerequisite
Add `matchesAIRequestOperationInputSchemaFloor(request, declaration)`.

Require:
- valid DD-243 request;
- valid DD-225 declaration;
- exact `request.inputSchemaVersion === declaration.operation.inputSchemaVersion`.

This does not validate the business payload against the actual schema registry; it only prevents request/version contract mismatch before later canonical DTO validation.

### DD-247 — Combined AIRequest pre-routing prerequisite floor
Add `matchesAIRequestPreRoutingPrerequisiteFloors(request, declaration)`.

Compose DD-243 + DD-245 + DD-246 only.

A true result means only that the supplied AIRequest is structurally valid and coherent with the declared operation capability/input-schema version. It is not authenticated, authorized, policy-approved, routable or executable.

## Fixed acceptance before implementation

- **AIREQ-SHAPE-001** valid exact DD-09 required/optional field set passes.
- **AIREQ-SHAPE-002** missing required or unknown top-level field fails closed.
- **AIREQ-SHAPE-003** malformed required scalar/version/JSON/sensitivity evidence fails closed.
- **AIREQ-SHAPE-004** malformed optional string/JSON/source-scope evidence fails closed.
- **AIREQ-PROJ-001** valid request projects exact DD-09 fields with deeply immutable JSON/list evidence.
- **AIREQ-PROJ-002** invalid request returns null and projection exposes no Tenant/Industry/permission/route authority.
- **AIREQ-CAP-001** exact request/declaration capability code passes.
- **AIREQ-CAP-002** mismatched or malformed capability binding fails.
- **AIREQ-SCHEMA-001** exact request/declaration input schema version passes.
- **AIREQ-SCHEMA-002** mismatched or malformed schema binding fails.
- **AIREQ-PRE-001** all DD-243/DD-245/DD-246 prerequisites pass together.
- **AIREQ-PRE-002** failure of any composed prerequisite denies.
- **AIREQ-PRE-003** inputs remain unchanged and true result grants no context resolution, policy, route, credential or execution authority.

Expected executable delta: Core **870 → 883**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, frontend or product-policy change.

This batch does **not** implement:
- RequestContext resolution or trust establishment;
- Authentication, DD-03/DD-04 Authorization or entitlement success;
- residencyRequirement authorization/region derivation;
- groundingMode semantics;
- requested output-schema business validation;
- AIPolicy/quota/budget evaluation;
- candidate/model-class mapping;
- context-window/modality suitability;
- Provider health/circuit or cost/latency preference;
- route decision/fallback/retry;
- credential/secret resolution;
- provider SDK execution;
- metering/output guardrails/final audit.

After DD-243…DD-247 implementation and targeted regression, perform the governed batch-boundary Core/PostgreSQL/Database/Web verification. Canonical synchronization occurs only after the full 5-step milestone gate.
