# Generated Document → AIMediaRequest current-evidence reader composition prerequisite ownership audit

**Date:** 2026-10-07  
**Baseline checkpoint:** `DEV-AI-MEDIA-REQUEST-INPUT-DOCUMENT-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `7c11fb74c49cfc9a79180cfd16bf9833b344693b`  
**Verified entry tree:** `7875f1c96bc87b3c1a7d87e1abd36a9990b62eaf`  
**Governed batch:** DD-608 through DD-612

## Entry gate

DD-603…DD-607 state closure is exact-head verified. Core Service Verify run `37563071700`: Core job `112604532483` **1526/1526 PASS**, PostgreSQL job `112604532687` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database Verify run `37563071694` / job `112604531964` PASS with repository inventory **48 migrations / 42 SQL verification files**. Web Boundary Verify run `37563071697` / job `112604531987` PASS.

PR #2 remains draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-190 owns exact RLS-visible `PersistedDocumentAIGeneratedProvenance` evidence through `DocumentAIGeneratedProvenanceReadPort.loadForContext({ requestContext, documentId })`. Its raw shape distinguishes non-AI documents from AI-generated documents and preserves exact optional MediaRequest/Provider/Model/provenance/moderation/licensing evidence without interpreting it.
- DD-125 owns exact RLS-visible `PersistedAIMediaRequest` evidence through `AIMediaRequestReadPort.loadForContext({ requestContext, mediaRequestId })`.
- DD-191 already owns `matchesDocumentAIGeneratedMediaRequestProvenanceFloors(document, mediaRequest?)`: non-AI documents require no MediaRequest evidence; AI-generated documents require exact referenced completed request, same Tenant/null-safe Industry, exact residency equality and generated-document sensitivity rank at least request sensitivity.
- Migration 0031 physically owns the same generated-Document→MediaRequest relationship and requires non-null request completion before AI-generated Document persistence.
- DD-191 explicitly leaves Provider/Model currentness, moderation/licensing interpretation, Document ACL/storage authorization, request-principal currentness, generation/publication and execution outside the relationship predicate.
- Both readers accept the exact supplied RequestContext. The migration-owned relationship already requires same Tenant/null-safe Industry between generated Document and MediaRequest; therefore one exact same-context request read by persisted `aiMediaRequestId` is source-complete and does not need alternate context synthesis.

**SOURCE-COMPLETE:** compose the exact Document AI-provenance read first. For non-AI Document evidence, perform zero MediaRequest reads and apply DD-191 with absent request evidence. For AI-generated evidence, read exactly the persisted `aiMediaRequestId` once under the exact same supplied RequestContext, then apply only DD-191.

## Frozen decisions

**DD-608 — exact Document AI-provenance evidence first.** Add `loadDocumentAIGeneratedMediaRequestCurrentEvidence(...)`. Read the exact document first using the exact supplied RequestContext and documentId. Null remains null; dependency/persistence errors propagate unchanged. No MediaRequest access occurs before a document exists.

**DD-609 — zero-read non-AI branch; otherwise one exact persisted request read.** If `document.aiGenerated === false`, perform zero MediaRequest reads and continue with absent request evidence. If AI-generated, require persisted `aiMediaRequestId` and call `AIMediaRequestReadPort.loadForContext` exactly once using the same exact RequestContext and that exact id. Do not normalize, search, infer by output/provenance, retry or fall back. Missing request returns null; dependency errors propagate unchanged.

**DD-610 — apply only existing DD-191 relationship floor.** Require `matchesDocumentAIGeneratedMediaRequestProvenanceFloors(document, mediaRequest?)`. This proves only non-AI absence or exact completed same-scope/residency/sensitivity relationship evidence. Do not strengthen request status/capability/media/prompt/principal/moderation semantics or interpret provider/model/provenance/licensing metadata.

**DD-611 — immutable branch-specific exact-reference evidence.** Non-AI success returns frozen `{ document }`. AI-generated success returns frozen `{ document, mediaRequest }`. Preserve exact loaded object references without clone/normalization/mutation.

**DD-612 — provenance relationship evidence is not publication/access/execution authority.** Do not validate Provider/Model lifecycle/eligibility/routing, moderation/licensing approval, request principal currentness/ownership, Document ACL/storage/signed URL, prompt/capability/entitlement/budget, output publication, media generation, mutation or events.

## Fixed acceptance before implementation

- **DOCAI-MEDIAREAD-BASE-001** exact Document AI-provenance evidence is loaded first with unchanged RequestContext/documentId.
- **DOCAI-MEDIAREAD-BASE-002** document null/errors short-circuit or propagate before any MediaRequest read.
- **DOCAI-MEDIAREAD-BRANCH-001** non-AI Document performs zero MediaRequest reads and can return frozen exact document-only evidence only when DD-191 passes.
- **DOCAI-MEDIAREAD-READ-001** AI-generated Document performs exactly one MediaRequest read using exact supplied RequestContext and persisted aiMediaRequestId.
- **DOCAI-MEDIAREAD-READ-002** missing MediaRequest returns null and dependency errors propagate unchanged with no retry/search/fallback/inference.
- **DOCAI-MEDIAREAD-FLOOR-001** exact completed DD-191 Tenant/Industry + residency + sensitivity relationship passes and preserves exact references.
- **DOCAI-MEDIAREAD-FLOOR-002** wrong/missing/incomplete/cross-scope/residency/sensitivity DD-191 evidence fails closed.
- **DOCAI-MEDIAREAD-EVID-001** success is frozen and preserves exact Document/MediaRequest references plus unrelated raw Provider/Model/provenance/moderation/licensing/request metadata unchanged.
- **DOCAI-MEDIAREAD-BOUND-001** output exposes no provider/model eligibility, moderation/licensing approval, principal/document access, storage/signing, prompt/capability/budget, generation/publication/mutation/event authority.

Expected executable delta: Core **1526 → 1535**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No schema, migration, verification SQL, RLS, role, grant, route, frontend, RawSource, provider SDK, worker or scheduler change.

This batch does **not**:
- revalidate request principal currentness or ownership authorization;
- validate AIProvider/AIModel ACTIVE/current/capability/residency/sensitivity/health/credential/routing;
- interpret aiProvenance/aiModerationResult/aiLicensingUsage;
- establish moderation or licensing approval;
- read/evaluate Document ACLs or StorageObject bindings or issue signed URLs;
- evaluate PromptTemplate, capability, entitlement/policy, provisioning snapshot, budget/quota or guardrails;
- generate, publish or serve media;
- mutate DocumentMeta/AIMediaRequest or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-608…DD-612 and the fixed acceptances.
