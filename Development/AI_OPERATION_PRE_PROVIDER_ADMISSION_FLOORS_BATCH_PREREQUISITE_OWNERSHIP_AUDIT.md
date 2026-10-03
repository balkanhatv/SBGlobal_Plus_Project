# AI OperationContract pre-provider prerequisite batch ownership audit

**Date:** 2026-09-28  
**Baseline checkpoint:** `DEV-AI-PROVISIONING-SNAPSHOT-ADMISSION-FLOORS-001`  
**Verified entry HEAD:** `a05723235d1c08dea2a8cb3a56e814e37c681449`  
**Verified entry tree:** `36d8ed6c5f3a472e2eab8f569fa290549230a122`  
**Governed batch:** DD-225 through DD-230

## Entry gate

The DD-219…DD-224 ProvisioningSnapshot lifecycle/admission batch state closure is exact-head verified:
- Core Service Verify `36469192026` / `109086849798`: **831/831 PASS**, zero failed/skipped.
- PostgreSQL `36469192026` / `109086849328`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36469192097` / `109086850162`: PASS.
- Web Boundary Verify `36469192087` / `109086849847`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Freshly reconciled:
- A-07 §§1–5: every AI use enters one Gateway; verified RequestContext and DD-03/DD-04 remain authoritative; provisioning is necessary but execution remains live-authorized;
- DD-09 §§2A–4: every AI API OperationContract declares API class, capability, permission/entitlement, scope, schema versions, streaming/rate/data-class/residency/audit metadata; clients do not supply trusted Tenant/Industry/permission facts;
- DD-06 canonical `OperationContract`: permission, optional entitlement, scope, schema versions, rate class and audit class already have one Core owner;
- DD-220…DD-224: current snapshot lifecycle, exact API-class, ACTIVE capability, ACTIVE Provider and exact model-class membership are necessary admission prerequisites only;
- DD-109 capability metadata: exact id/code/status and required-entitlement metadata are evidence, not authorization;
- `RequestContext` remains DD-02/DD-03 resolved server context.

The DD-09 AI declaration must not create parallel permission, entitlement, scope, schema, rate or audit authority beside the existing Core OperationContract. The canonical normalization therefore reuses the Core fields directly:
- DD-09 `requiredPermission` ← `OperationContract.permissionCode`;
- `requiredEntitlement` ← `OperationContract.entitlementRequirement`;
- `scopeClass` ← `OperationContract.scopeClass`;
- `requestSchemaVersion` ← `inputSchemaVersion`;
- `responseSchemaVersion` ← `outputSchemaVersion`;
- `ratePolicyRef` ← current symbolic `rateClass`;
- `auditClass` ← `OperationContract.auditClass`.

AI-only declaration metadata therefore owns only `apiAccessClass`, `capabilityCode`, `streamingMode`, `dataClassCeiling`, and `residencyPolicyRef`. Except for the already-canonical API access-class vocabulary, these raw strings are not assigned new vocabularies or runtime meaning in this batch.

## Determination

**SOURCE-COMPLETE for a pre-provider prerequisite boundary only.**

A concrete AI Gateway, provider/model router, policy evaluator, quota reservation, residency/sensitivity decision, credential resolver and provider SDK remain source-incomplete or separately governed. This batch may only prove that an AI operation declaration is structurally coherent with the canonical Core contract and that known ProvisioningSnapshot/capability prerequisites are satisfied before later authorization/routing stages.

## Locked DD-225…DD-230 contracts

### DD-225 — AI OperationContract declaration shape floor
Add `matchesAIOperationContractDeclarationShapeFloor(declaration)`.
It validates only canonical Core OperationContract shape plus the five AI-only metadata fields. API class uses the exact four DD-09 values. No new streaming/data-class/residency vocabulary is invented.

### DD-226 — deterministic DD-09 declaration projection
Add `projectAIOperationContractDeclaration(declaration)`.
For a valid declaration it returns an immutable projection of all DD-09-declared fields, deriving permission/entitlement/scope/schema/rate/audit from the canonical Core OperationContract. Invalid declarations return `null`. The projection does not authorize.

### DD-227 — exact RequestContext scope prerequisite
Add `matchesAIOperationRequestContextScopeFloor(declaration, requestContext)`.
It requires a valid declaration and exact `requestContext.scopeClass === operation.scopeClass`. It does not authenticate, resolve, enrich or authorize RequestContext; upstream DD-02/DD-03 remains authoritative.

### DD-228 — snapshot lifecycle + API-class prerequisite
Add `matchesAIOperationSnapshotAdmissionFloor(declaration, snapshot, evaluatedAt)`.
It composes DD-220 current-lifecycle admission and DD-221 exact API-class membership for the declared API class. It does not select the snapshot, evaluate permission/entitlement or route.

### DD-229 — snapshot capability binding prerequisite
Add `matchesAIOperationCapabilityAdmissionFloor(declaration, snapshot, capability)`.
It requires exact `declaration.ai.capabilityCode === capability.code` and DD-222 exact ACTIVE capability-id membership. Capability `requiredEntitlement` and `defaultPolicyClass` remain evidence for later guards/policy and are not evaluated here.

### DD-230 — combined pre-provider prerequisite floor
Add `matchesAIOperationPreProviderPrerequisiteFloors(input)`.
It composes DD-225, DD-227, DD-228 and DD-229 only. A true result means “eligible to continue into the still-governed live authorization/policy/routing pipeline”; it never means authorized, routable or executable.

## Fixed acceptance before implementation

- **AIOP-SHAPE-001** valid canonical Core + AI-only declaration shape passes.
- **AIOP-SHAPE-002** unknown API class, malformed Core enum/schema/array shape, or non-string AI-only metadata fails closed.
- **AIOP-PROJ-001** projection maps DD-09 permission/entitlement/scope/schema/rate/audit fields only from the canonical Core OperationContract and preserves AI-only fields exactly.
- **AIOP-PROJ-002** projection is immutable, invalid declaration returns null, and no parallel Tenant/Industry/permission authority is created.
- **AIOP-SCOPE-001** exact declared/request scope matches; mismatched or malformed RequestContext scope fails.
- **AIOP-SNAP-001** valid current lifecycle plus exact allowed API class passes.
- **AIOP-SNAP-002** inactive/not-yet-valid/expired lifecycle or absent/invalid API class fails closed.
- **AIOP-CAP-001** exact declaration capability code + exact allowed ACTIVE capability id passes.
- **AIOP-CAP-002** wrong code, inactive/malformed capability, or absent capability id fails closed.
- **AIOP-PRE-001** all known declaration/context/snapshot/capability prerequisites pass together.
- **AIOP-PRE-002** failure of any composed prerequisite fails the combined floor.
- **AIOP-PRE-003** inputs remain unchanged and a true result exposes no provider/model, policy/quota, credential or execution authority.

Expected executable delta: Core **831 → 843**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, secret access or product-policy change.

This batch does **not** implement:
- Authentication or RequestContext resolution;
- DD-03/DD-04 permission/entitlement/ABAC guard success;
- AIPolicy AST evaluation;
- quota/budget reservation or usage metering;
- sensitivity/redaction/residency evaluation;
- Provider health/credentials/circuit state;
- concrete model-class → model mapping;
- Provider/Model selection, ranking, fallback or retry;
- prompt/RAG/assistant/agent/tool execution;
- provider calls, output guardrails or final audit append.

After DD-225…DD-230 implementation and targeted regression, perform the governed batch-boundary Core/PostgreSQL/Database/Web verification. Canonical promotion/state synchronization occurs only after that batch gate, per the current substantial-batch cadence.
