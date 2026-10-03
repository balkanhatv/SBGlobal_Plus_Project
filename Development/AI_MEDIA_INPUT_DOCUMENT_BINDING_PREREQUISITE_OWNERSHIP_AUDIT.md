# AIMediaRequest input-document binding prerequisite ownership audit

**Date:** 2026-09-25
**Baseline checkpoint:** `DEV-AI-MEDIA-PROMPT-BINDING-FLOORS-001`
**Verified correction HEAD:** `4d9b609756d4c97417214eeadc54aa7531d57fdb`
**Verified tree:** `fa01068c39b18241399c5c28e9c71ea7ae67f57b`

## Entry gate and source ownership

Correction-HEAD Core 565/565, PostgreSQL 497/497, Database 48 migrations / 42 verification files and Web passed. Exact runs: 36121218741 (jobs 108026901271 / 108026901423), 36121218700 (108026901298), 36121218744 (108026901307). All logs assert the HEAD/tree above. RawSource and main are unchanged; PR #2 is draft/unmerged.

Sources reconciled before implementation: F-05; A-07; DD-08/DD-09; migrations 0011 and 0031 (`sensitivity_rank`, `uuid_array_is_set`, `validate_ai_relationships` AIMediaRequest branch); DD-125 `PersistedAIMediaRequest`; DD-082/083 `DocumentAccessMetadata` and its PostgreSQL reader. These existing contracts expose every field this independent predicate needs.

Migration 0031 requires the persisted `input_document_refs` to be a UUID set. For every referenced document it requires exact Tenant, null-safe exact Industry Context, raw ACTIVE status, CLEAN scan state, document sensitivity rank no higher than the request, and exact residency equality. Rank order is PUBLIC=1, INTERNAL=2, CONFIDENTIAL=3, SENSITIVE_PERSONAL=4, REGULATED=5. An empty input set is permitted. The optional PromptTemplate relationship and principal validity are separate predicates.

## Determination and locked DD-189 detailed contract

**SOURCE-COMPLETE for this necessary relationship floor only.**

Pure function: `matchesAIMediaRequestInputDocumentBindingFloors(request, documents)` takes one already-loaded `PersistedAIMediaRequest` and an unordered array of already-loaded `DocumentAccessMetadata`; returns boolean and never mutates inputs.

1. Validate request id/Tenant UUID and optional Industry UUID, known sensitivity class, string residency requirement and an array of unique valid input UUIDs. Do not invent a residency allowlist, trim or case-fold residency strings.
2. Require exactly one supplied document per referenced id; no missing, duplicate or unrelated evidence. Evidence ordering is immaterial. Empty references require empty evidence.
3. Validate document id/Tenant/optional Industry shape; require exact id, Tenant and null-safe Industry equality. Tenant-Core documents cannot silently carry into Industry requests or vice versa.
4. Require ACTIVE/CLEAN for every input, known sensitivity at/below the request ceiling, and exact string residency equality.
5. Malformed relevant shape, unknown sensitivity, missing/extra/duplicate evidence or any failed member returns false; input arrays/objects remain unchanged.

Exact evidence-set hygiene is a helper contract, not a new persisted business rule. UUID representation follows the existing persisted-reader contracts. No database change is needed.

## Acceptance contract (fixed before implementation)

- **AIMEDIA-DOC-CUR-001**: empty reference/evidence sets pass; unexpected evidence fails.
- **AIMEDIA-DOC-CUR-002**: complete same-scope document sets pass for Tenant-Core and Tenant-Industry, independent of evidence order.
- **AIMEDIA-DOC-CUR-003**: foreign Tenant, sibling Industry and null-versus-present Industry mismatches fail for every member.
- **AIMEDIA-DOC-CUR-004**: each input must be ACTIVE and CLEAN; other lifecycle/scan states fail.
- **AIMEDIA-DOC-CUR-005**: all 25 known sensitivity pairs match the source-owned rank inequality; unknown classes fail.
- **AIMEDIA-DOC-CUR-006**: residency equality is exact per document; no case-folding, trimming or fallback.
- **AIMEDIA-DOC-CUR-007**: malformed request/document shape, null/duplicate/invalid refs and missing/extra/duplicate evidence fail closed.
- **AIMEDIA-DOC-CUR-008**: principal/prompt/ACL/storage/brand/moderation/capability/request lifecycle semantics remain uninterpreted; no mutation.

Expected Core increment: 8 (565 → 573). PostgreSQL remains 497; database inventory remains 48/42.

## Explicit exclusions and next dependency

A true result is not acting-principal access, Document ACL authorization, StorageObject/signed-URL access, write-time provenance replay, scan recency, prompt approval, provider/model selection, moderation, entitlement/budget, or inference/media generation. It does not compose DD-188, fetch records, query a database, mutate state or open a route.

Principal-currentness semantics remain blocked by the separately recorded provenance boundary. After this floor is implemented and exact-head verified, audit another independent persisted relationship; do not treat its completion as permission to execute AI. Document generated-media provenance is a candidate for a separate source audit, not authorized by this document.
