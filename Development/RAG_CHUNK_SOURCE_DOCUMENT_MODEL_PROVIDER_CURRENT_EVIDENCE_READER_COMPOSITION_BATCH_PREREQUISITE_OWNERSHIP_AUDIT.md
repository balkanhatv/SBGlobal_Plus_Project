# RAGChunk source/Document + embedding Model/Provider current-evidence reader composition prerequisite ownership audit

**Date:** 2026-10-07  
**Baseline checkpoint:** `DEV-AI-RAG-CHUNK-EMBEDDING-MODEL-PROVIDER-BINDING-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `9a8eb43fd1f33675a8a71adff7e246c81230f41d`  
**Verified entry tree:** `a7f466109792bb7067c5bdf4fbf5b845fc981f0a`  
**Governed batch:** DD-643 through DD-647

## Entry gate

DD-638…DD-642 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37649039589`: Core job `112887216757` **1586/1586 PASS**, PostgreSQL job `112887217586` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37649039670` / job `112887217404` PASS with repository inventory **48 migrations / 42 SQL verification files**. Web run `37649039694` / job `112887217456` PASS.

PR #2 remains open/draft/unmerged. RawSource remains unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-642 owns exact RAGChunk → eligible embedding AIModel → exact AIProvider id-binding evidence. It preserves the exact chunk/model/provider references but deliberately excludes RAGSource/Document validity and retrieval/access authority.
- DD-194 owns the direct RAGChunk → parent RAGSource relationship: exact source id, Tenant, null-safe Industry Context, scope, residency and retention equality plus chunk sensitivity >= source sensitivity.
- DD-193 owns optional RAGSource → DocumentMeta current relationship: unbound source means both document id/version absent and no Document evidence; bound source requires exact persisted Document id/version, Tenant, null-safe Industry Context, scope, raw ACTIVE+CLEAN state, exact residency and source sensitivity >= document sensitivity.
- `AIRAGSourceReadPort.loadForContext({ requestContext, ragSourceId })` and `DocumentAccessMetadataPort.loadForContext({ requestContext, documentId })` already own exact same-context reads. Both are RequestContext/RLS bounded.
- DD-623…DD-627 already proved the source→optional-Document composition. DD-628…DD-632 separately proved chunk→source composition. Reusing their pure relationship floors over the already-loaded DD-642 chunk avoids a second chunk read and does not create new persistence semantics.
- DD-642 provider evidence remains raw binding evidence only. Provider ACTIVE/health/credentials/capabilities/regions/security/residency usability, Tenant/Industry provider allowlists, route selection and execution are not imported into this lineage composition.
- DD-193 explicitly excludes Document ACL authorization. The RAG retrieval pipeline in DD-09 requires ACL/access authorization before retrieval/ranking, but the current evidence set contains no source-owned ACL evaluator input/result contract for this composition.

**SOURCE-COMPLETE:** extend exact DD-642 evidence with one exact same-RequestContext parent RAGSource read by preserved `chunk.sourceId`, apply DD-194, then follow DD-193's optional Document branch using at most one exact same-RequestContext Document metadata read. Return immutable exact lineage evidence only.

## Frozen decisions

### DD-643 — exact DD-642 parent evidence first

Add `loadAIRAGChunkSourceDocumentModelProviderCurrentEvidence(...)`. Invoke DD-642 first with the exact supplied RequestContext, RAGChunk id, chunk reader, model reader and provider reader. Parent null returns null; DD-642 dependency errors propagate unchanged. No RAGSource or Document read occurs before DD-642 succeeds.

### DD-644 — one exact parent RAGSource read plus DD-194

After DD-642 succeeds, call `AIRAGSourceReadPort.loadForContext` exactly once with the exact supplied RequestContext and exact preserved `parent.parent.chunk.sourceId`. Do not trim, normalize, search, re-read the chunk, substitute resource ids or fall back. Missing source returns null; dependency errors propagate unchanged. Require `matchesAIRAGChunkSourceBindingFloors(parent.parent.chunk, source)`; mismatch/malformed evidence fails closed.

### DD-645 — DD-193 optional Document branch

If `source.documentId` is absent, perform zero Document metadata reads and apply DD-193 with absent Document evidence. If present, call `DocumentAccessMetadataPort.loadForContext` exactly once with the exact same supplied RequestContext and persisted `source.documentId`. Do not search versions, use source.resourceId/storage ids, retry or fall back. Missing Document returns null; dependency errors propagate unchanged.

### DD-646 — apply only DD-193 current source→Document relationship

Require `matchesAIRAGSourceDocumentBindingFloors(source, document?)`. This proves only the existing optional id/version/Tenant/nullable-Industry/scope + ACTIVE/CLEAN + residency + sensitivity relationship. It does not interpret source status/sourceVersion/chunkingPolicyVersion, aclPolicyRef, owner/resource/storage fields, document ACLs, retention, filename/media metadata or retrieval authority.

### DD-647 — immutable lineage evidence and authority boundary

Unbound success returns frozen `{ parent, source }`. Bound success returns frozen `{ parent, source, document }`, preserving exact DD-642 parent/model/provider and exact source/document references. Success proves only the composed DD-642 + DD-194 + DD-193 lineage floors. It grants no Document ACL/access/storage/signed-url authority; no RAGSource latest/current selection; no Provider usability/routing/credential authority; no Tenant/Industry allowlist; no vector/FTS retrieval, filtering, ranking/reranking, grounding/citation or prompt-injection policy; and no AI/provider execution, mutation or event authority.

## Fixed acceptance before implementation

- **RAGCHUNK-LINEAGE-BASE-001** exact DD-642 parent evidence is established first with unchanged inputs/dependencies.
- **RAGCHUNK-LINEAGE-BASE-002** DD-642 null/error short-circuits or propagates before Source/Document access.
- **RAGCHUNK-LINEAGE-SRC-001** exactly one RAGSource read uses exact supplied RequestContext and preserved chunk.sourceId.
- **RAGCHUNK-LINEAGE-SRC-002** missing/error Source evidence returns null or propagates unchanged with no re-read/search/fallback.
- **RAGCHUNK-LINEAGE-SRC-003** exact DD-194 relationship passes; wrong/malformed scope/id/residency/retention/sensitivity evidence fails closed.
- **RAGCHUNK-LINEAGE-DOC-001** unbound source performs zero Document reads and passes only DD-193 unbound semantics.
- **RAGCHUNK-LINEAGE-DOC-002** bound source performs exactly one same-RequestContext Document read by persisted documentId; missing/error evidence returns null or propagates unchanged with no version/search/fallback.
- **RAGCHUNK-LINEAGE-DOC-003** exact DD-193 bound relationship passes; wrong/malformed/unsafe Document evidence fails closed.
- **RAGCHUNK-LINEAGE-EVID-001** success is frozen and preserves exact DD-642 parent/model/provider plus source/document references and unrelated raw metadata unchanged.
- **RAGCHUNK-LINEAGE-BOUND-001** output exposes no ACL/access/storage/provider-usability/routing/retrieval/ranking/grounding/execution/mutation/event authority.

Expected executable delta: Core **1586 → 1596**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, RawSource, credential/secret access, provider SDK, worker or scheduler change.

This batch does **not**:
- interpret Provider status/health/capabilities/regions/security/residency/version as usability;
- evaluate Tenant/Industry Provider/Model allowlists, entitlement, quota or budget;
- resolve Provider credentials or adapters;
- interpret RAGSource raw status/sourceVersion/chunkingPolicyVersion as latest/current selection;
- interpret RAGSource aclPolicyRef or evaluate Document ACLs;
- authorize source resource dereference, StorageObject access or signed URLs;
- evaluate chunk aclProjection;
- perform vector/FTS retrieval, filtering, ranking/reranking, grounding/citation or prompt-injection policy;
- select/fallback/route Provider/Model or invoke embeddings/inference/RAG/assistant/agent/tool execution;
- mutate source/chunk/document/provider/model state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-643…DD-647 and the fixed acceptances.
