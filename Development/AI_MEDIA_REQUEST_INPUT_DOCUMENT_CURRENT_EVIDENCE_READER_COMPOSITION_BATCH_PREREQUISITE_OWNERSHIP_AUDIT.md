# AIMediaRequest input-document current-evidence reader composition prerequisite ownership audit

**Date:** 2026-10-07  
**Baseline checkpoint:** `DEV-AI-MEDIA-REQUEST-CAPABILITY-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `d385fbc2faefe28da212a9a77feba1776efbdec9`  
**Verified entry tree:** `367d575ecb4251c10fda3e4c99aa8e03714f9a5a`  
**Governed batch:** DD-603 through DD-607

## Entry gate

DD-598…DD-602 state closure is exact-head verified after one forward-only projection-date correction. Core Service Verify run `37559756582`: Core job `112594138668` **1517/1517 PASS**, PostgreSQL job `112594138562` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database Verify run `37559756626` / job `112594140954` PASS with repository inventory **48 migrations / 42 SQL verification files**. Web Boundary Verify run `37559756615` / job `112594138568` PASS.

The preceding state-closure commit `b2848b7868744c747f0b9239a648569f1737857a` failed only REPO-011 because `Registers/SOURCE_REGISTRY.md` retained top-level `Updated: 2026-10-06` while the manifest was `2026-10-07`. `d385fbc2faefe28da212a9a77feba1776efbdec9` changed only that date projection. No runtime or DD-598…DD-602 feature semantics failed.

PR #2 remains draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-125 owns persisted `AIMediaRequest` evidence and `AIMediaRequestReadPort.loadForContext({ requestContext, mediaRequestId })`. The PostgreSQL reader performs the exact id read under RequestScopedSql/RLS. Real PostgreSQL acceptance already proves foreign Tenant and PLATFORM_GLOBAL contexts do not disclose a Tenant media request.
- DD-082 owns `DocumentAccessMetadata` and `DocumentAccessMetadataPort.loadForContext({ requestContext, documentId })`. The PostgreSQL adapter performs one exact DocumentMeta id read under resolved single-Tenant RequestContext/RLS, preserving raw scope, lifecycle, scan, sensitivity, residency and storage-link metadata.
- PostgreSQL document tests prove sibling Industry metadata is hidden; Tenant-Core metadata is same-Tenant visible from Tenant-Core and Industry contexts; this does not itself grant document access.
- DD-189 already owns the pure `matchesAIMediaRequestInputDocumentBindingFloors(request, documents)` relationship/currentness floor. It requires exact evidence-set completeness, exact Tenant + nullable Industry equality, every document ACTIVE + CLEAN, migration-0031 sensitivity non-exceedance and exact residency equality. Empty request references require empty evidence.
- DD-189 explicitly does not establish acting-principal authorization, Document ACL access, StorageObject/signed-URL access, prompt approval, provider/model selection, moderation, entitlement/budget or media execution.
- Because persisted `inputDocumentRefs` is already a unique UUID array, no batch database API is required for correctness. One exact metadata read per persisted ref is source-complete; result ordering may follow persisted ref order purely as deterministic evidence projection and is not a new business rule.

**SOURCE-COMPLETE:** compose the exact AIMediaRequest read with zero Document metadata reads for an empty persisted input set, otherwise exactly one DocumentAccessMetadata read per persisted inputDocumentRef using the exact supplied RequestContext and exact id, then apply only the existing DD-189 floor.

## Frozen decisions

**DD-603 — exact AIMediaRequest first.** Add `loadAIMediaRequestInputDocumentCurrentEvidence(...)`. Read the exact media request first using the exact supplied RequestContext and mediaRequestId. Null remains null; request dependency/persistence errors propagate unchanged. No Document metadata access occurs before a request exists.

**DD-604 — zero-read empty branch; otherwise one exact read per persisted ref.** If `request.inputDocumentRefs` is empty, perform zero Document metadata reads and continue with empty evidence. Otherwise call `DocumentAccessMetadataPort.loadForContext` exactly once for each persisted ref, in persisted ref order, using the exact supplied RequestContext and exact documentId. Do not trim/normalize ids, substitute source/storage ids, batch-search, discover alternates, retry or fall back. A null document returns null; dependency errors propagate unchanged.

**DD-605 — apply only existing DD-189 input-document floors.** After all required metadata is present, require `matchesAIMediaRequestInputDocumentBindingFloors(request, documents)`. This proves only exact evidence-set completeness plus the already-owned Tenant/nullable-Industry, ACTIVE+CLEAN, sensitivity ceiling and exact residency floors. Do not add ACL, owner-principal, storage, source-resource, media-type, filename or version semantics.

**DD-606 — immutable exact-reference evidence.** Success returns frozen `{ request, documents }`. Preserve the exact loaded request and exact loaded Document metadata object references. The outer documents array is frozen in persisted ref/read order; DD-189 remains order-insensitive and no ordering business rule is created.

**DD-607 — document relationship/currentness evidence is not access or media execution authority.** Do not subject-match/read Document ACLs, interpret ACL effect/expiry, resolve source-resource authorization, read/authorize StorageObject, issue signed URLs, evaluate acting principal/current membership, capability/prompt eligibility, entitlement/policy, moderation, provider/model routing, budget/quota, or execute/publish media. Do not mutate request/document state or emit events.

## Fixed acceptance before implementation

- **AIMEDIA-DOCREAD-BASE-001** exact AIMediaRequest is loaded first with unchanged RequestContext/id.
- **AIMEDIA-DOCREAD-BASE-002** request null/errors short-circuit or propagate before any Document metadata read.
- **AIMEDIA-DOCREAD-BRANCH-001** empty persisted inputDocumentRefs performs zero Document metadata reads and can return frozen empty document evidence only when DD-189 passes.
- **AIMEDIA-DOCREAD-READ-001** non-empty input performs exactly one metadata read per persisted ref using exact RequestContext/id in persisted ref order.
- **AIMEDIA-DOCREAD-READ-002** a missing Document returns null and metadata dependency errors propagate unchanged with no retry/search/fallback/substitution.
- **AIMEDIA-DOCREAD-FLOOR-001** complete exact DD-189 Tenant/Industry + ACTIVE/CLEAN + sensitivity + residency evidence passes and preserves exact references.
- **AIMEDIA-DOCREAD-FLOOR-002** missing/extra/duplicate/mismatched/unsafe DD-189 evidence fails closed; no normalization or alternate lookup occurs.
- **AIMEDIA-DOCREAD-EVID-001** success is frozen, outer evidence order is deterministic, exact request/document references and unrelated raw metadata remain unchanged.
- **AIMEDIA-DOCREAD-BOUND-001** output exposes no ACL/access/storage/source-resource/principal/prompt/capability/moderation/routing/budget/execution/publication/mutation/event authority.

Expected executable delta: Core **1517 → 1526**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema, migration, verification SQL, RLS, role, grant, route, frontend, RawSource, provider SDK, worker or scheduler change.

This batch does **not**:
- synthesize a Tenant RequestContext for PLATFORM_GLOBAL callers;
- perform Document ACL or current-effect evaluation;
- grant source-resource or StorageObject/signed-url access;
- interpret ownerPrincipalId/sourceModule/sourceResourceType/sourceResourceId/mediaType/filename/version as authorization;
- establish principal currentness or request ownership authorization;
- establish PromptTemplate/capability eligibility, entitlement/default-policy or Tenant/Industry allowlisting;
- evaluate moderation, provider/model suitability, sensitivity/residency beyond existing DD-189 input-document floors, budget/quota or guardrails;
- execute/generate/publish media, mutate state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-603…DD-607 and the fixed acceptances.
