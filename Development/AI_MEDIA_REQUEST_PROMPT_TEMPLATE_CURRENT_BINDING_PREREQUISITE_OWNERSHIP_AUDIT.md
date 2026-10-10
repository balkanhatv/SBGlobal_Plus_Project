# AIMediaRequest PromptTemplate current-binding prerequisite ownership audit

**Date:** 2026-09-25  
**Baseline checkpoint:** `DEV-AI-MEMORY-SUPERSESSION-CONTINUITY-FLOORS-001`  
**Verified closure basis:** `21c6301844d651221c87196fcadc0a8b45067eda` / tree `5c35b6d886a6bd5a6cb56123ba2889dd60e3dfa7`  
**Prior dependency audit:** `Development/AI_MEMORY_PRINCIPAL_CURRENTNESS_REMAINING_BOUNDARY_AUDIT.md`  
**Scope:** next independent source-complete migration-0031 relationship after the blocked AIMemoryRecord principal-currentness re-evaluation.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0011_ai_catalog_config.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `database/migrations/0048_definition_scope_fail_closed.sql`;
- `Development/AI_MEDIA_REQUEST_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` / DD-125;
- `Development/AI_PROMPT_TEMPLATE_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` / DD-115;
- `Development/DEFINITION_SCOPE_APPLICABILITY_FAIL_CLOSED_AUDIT.md` / DD-170;
- current `PersistedAIMediaRequest` and `PersistedAIPromptTemplate` contracts.

Migration 0031 owns one direct optional AIMediaRequest→PromptTemplate relationship:

- when `prompt_template_id` is present, `prompt_version` is required;
- the referenced PromptTemplate must exist at exactly that id;
- the PromptTemplate persisted version must equal `prompt_version`;
- its raw status must be `ACTIVE`;
- its PLATFORM/TENANT/INDUSTRY owner must apply to the request Tenant/optional Industry Context through `core_tenancy.definition_applies_to_scope()`;
- when `prompt_template_id` is absent, a non-null `prompt_version` is rejected.

DD-170 already corrected the shared applicability predicate to a total fail-closed boolean. The owner hierarchy is therefore source-owned: PLATFORM applies broadly, TENANT only within its Tenant, and INDUSTRY only to its exact same-Tenant Industry target.

DD-125 exposes exact persisted request id/Tenant/optional Industry plus optional prompt id/version. DD-115 exposes exact PromptTemplate id/version/status/owner scope. No missing request-local provenance is required for this relationship.

The same migration separately validates request principal currentness and input-document state/scope/security/residency. Those predicates are not part of this floor.

## Determination

One pure **AIMediaRequest→optional PromptTemplate exact id/version/ACTIVE/scope current-binding necessary floor** is source-complete.

> Given one already-loaded AIMediaRequest and optional already-loaded PromptTemplate evidence, determine only whether migration-0031's direct prompt binding still matches.

A true result is not prompt selection, rendering, approval, media-generation authorization or execution authority.

## Authorized DD-188 boundary

Implement:

`matchesAIMediaRequestPromptTemplateBindingFloors(request, promptTemplate?)`.

It must:

1. require valid request id and Tenant UUIDs;
2. require request Industry Context id, when present, to be a valid UUID;
3. when `promptTemplateId` is absent:
   - require `promptVersion` absent;
   - require no PromptTemplate evidence;
   - return true after relevant request-shape validation;
4. when `promptTemplateId` is present:
   - require a valid UUID;
   - require `promptVersion` to be a safe integer;
   - require PromptTemplate evidence;
   - require valid PromptTemplate id and exact id equality;
   - require a positive safe-integer PromptTemplate version and exact version equality;
   - require raw PromptTemplate status `ACTIVE`;
   - require canonical owner shape and PLATFORM/TENANT/INDUSTRY applicability to the request Tenant/optional Industry;
5. fail closed for malformed relevant evidence, orphan promptVersion, missing bound evidence or unexpected prompt evidence on an unbound request;
6. leave all inputs unchanged.

The helper must not auto-compose principal currentness, input-document integrity, prompt approval, PromptSet membership or any AI execution semantics.

## Acceptance target

- **AIMEDIA-PROMPT-CUR-001** — unbound request requires neither promptVersion nor PromptTemplate evidence.
- **AIMEDIA-PROMPT-CUR-002** — exact ACTIVE PLATFORM PromptTemplate id/version applies to Tenant-Core and Tenant-Industry requests.
- **AIMEDIA-PROMPT-CUR-003** — exact ACTIVE TENANT PromptTemplate applies only within the same Tenant.
- **AIMEDIA-PROMPT-CUR-004** — exact ACTIVE INDUSTRY PromptTemplate applies only to the exact same-Tenant Industry request and not Tenant-Core/sibling Industry.
- **AIMEDIA-PROMPT-CUR-005** — id/version/status mismatch or missing required prompt evidence fails closed.
- **AIMEDIA-PROMPT-CUR-006** — malformed request/prompt ownership or orphan promptVersion/unexpected evidence fails closed.
- **AIMEDIA-PROMPT-CUR-007** — principal/document/brand/localization/sensitivity/residency/moderation/status/completion/prompt-content semantics remain uninterpreted; inputs remain unchanged.

Expected Core delta: +7 tests, from 556 to 563. PostgreSQL remains 497; database inventory remains 48 migrations / 42 SQL verification files.

## Explicitly unclaimed

DD-188 does **not**:

- re-evaluate request-principal currentness;
- re-evaluate input Document ACL/state/scan/sensitivity/residency;
- select current/latest PromptTemplate by code;
- validate PromptTemplate creator/approver currentness or approval satisfaction;
- render `systemTemplate`;
- execute `variableSchema` or interpret override fields/grounding;
- compose PromptSet/Assistant/IndustryAIConfig prompt policy;
- resolve brand/localization/moderation policy;
- decide capability/permission/entitlement/budget;
- select provider/model or perform inference/media generation;
- create/register generated output;
- mutate request/prompt state;
- change SQL/RLS/roles/grants/routes/product policy.

## Next dependency boundary

After exact-head verification and canonical promotion, source-audit another independent migration-0031 AIMediaRequest relationship. Principal currentness remains blocked by its separately recorded provenance boundary.

RawSource remains unchanged. `main` remains unmerged. PR #2 remains draft/unmerged.
