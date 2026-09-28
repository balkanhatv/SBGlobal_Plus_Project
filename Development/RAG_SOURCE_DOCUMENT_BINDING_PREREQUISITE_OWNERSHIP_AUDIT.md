# RAGSource document binding prerequisite ownership audit

**Date:** 2026-09-25
**Baseline checkpoint:** `DEV-DOCUMENT-AI-MODEL-PROVIDER-PAIR-FLOORS-001`
**Verified closure HEAD:** `1ebb2a9fbdbd1ebffd094462a34e38de32fa2679`
**Verified tree:** `40ddd0056ccc246a17ca20928a57da4b8bf059e6`

## Entry gate

DD-192 state closure is exact-head verified. Core Service Verify run `36146763956` passed Core job `108109757490` at **588/588** and PostgreSQL job `108109757105` at **504/504** plus database bootstrap PASS. Database Verify run `36146763954` / job `108109757420` passed. Web Boundary Verify run `36146764062` / job `108109758359` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0031 owns the optional `core_ai.rag_source.document_id` relationship:

- when `document_id` is absent, `document_version` must also be absent;
- when `document_id` is present, `document_version` is required;
- referenced Document id must exist with exact version;
- exact Tenant equality;
- null-safe exact Industry Context equality;
- exact `scope_class`;
- exact residency;
- referenced Document must be raw `ACTIVE` and virus-scan `CLEAN`;
- RAGSource sensitivity rank must be at least the referenced Document sensitivity rank.

The source-owned rank order is PUBLIC=1, INTERNAL=2, CONFIDENTIAL=3, SENSITIVE_PERSONAL=4, REGULATED=5.

DD-127 exposes every RAGSource-side fact required by this predicate: id, Tenant/optional Industry, scope class, optional document id/version, sensitivity and residency. DD-082/DD-083 expose every Document-side fact required: id, Tenant/optional Industry, scope class, version, sensitivity, residency, status and virus-scan status. Therefore no new reader, schema, RLS, role or grant is needed.

Document ACL authorization, source `aclPolicyRef`, source lifecycle/current-version selection, dereferencing, chunking, embedding, retrieval and inference are separate concerns and are not part of migration 0031's relationship predicate.

## Determination and locked DD-193 detailed contract

**SOURCE-COMPLETE for the optional RAGSource → DocumentMeta current relationship floor only.**

Authorize pure helper:

`matchesAIRAGSourceDocumentBindingFloors(source, document?)`

It accepts one already-loaded DD-127 `PersistedAIRAGSource` and optional already-loaded DD-082 `DocumentAccessMetadata`, returns boolean and never mutates inputs.

1. Validate relevant RAGSource id/Tenant/optional Industry/scope/sensitivity/document-id/document-version/residency shape.
2. If `documentId` is absent, require `documentVersion` absent and no supplied Document evidence.
3. If `documentId` is present, require a valid UUID, positive safe-integer `documentVersion`, and supplied Document evidence.
4. Require exact Document id and exact version equality.
5. Require exact Tenant, null-safe Industry Context and `scopeClass` equality.
6. Require referenced Document raw `ACTIVE` and `CLEAN`.
7. Require exact residency string equality with no trimming/case-folding/fallback.
8. Require RAGSource sensitivity rank >= Document sensitivity rank. Unknown sensitivity values fail closed.
9. Malformed relevant evidence fails closed; unrelated source/resource/ACL/status/version/chunking metadata and Document filename/media/storage/owner/source metadata remain uninterpreted.

## Fixed acceptance before implementation

- **RAGSRC-DOC-CUR-001**: unbound RAGSource passes only with absent document version and no Document evidence; unexpected version/evidence fails.
- **RAGSRC-DOC-CUR-002**: exact Tenant-Core and Tenant-Industry document id/version/scope bindings pass.
- **RAGSRC-DOC-CUR-003**: missing Document evidence, wrong Document id or wrong document version fails closed.
- **RAGSRC-DOC-CUR-004**: Tenant, null-safe Industry Context or scope-class mismatch fails closed.
- **RAGSRC-DOC-CUR-005**: referenced Document must be raw ACTIVE and CLEAN.
- **RAGSRC-DOC-CUR-006**: residency equality is exact; no normalization is authorized.
- **RAGSRC-DOC-CUR-007**: all known sensitivity pairs follow source-rank >= document-rank; unknown classes fail closed.
- **RAGSRC-DOC-CUR-008**: malformed relevant identity/version/scope shape fails closed; unrelated RAGSource/Document semantics are uninterpreted and inputs remain unchanged.

Expected executable delta: Core **588 → 596**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not Document ACL or acting-principal authorization, current/latest RAG source selection, source-resource existence/currentness, `aclPolicyRef` interpretation, retention/legal-hold, chunking, RAGChunk validity, embedding-model eligibility, vector/FTS retrieval, ranking/reranking, grounding/citation, prompt-injection defense, provider/model routing or AI execution. It changes no schema/RLS/role/grant/route/product policy.

After DD-193 is implemented and exact-head verified, source-audit another independent persisted RAG relationship. Complete RAG retrieval and AI execution remain separately governed.
