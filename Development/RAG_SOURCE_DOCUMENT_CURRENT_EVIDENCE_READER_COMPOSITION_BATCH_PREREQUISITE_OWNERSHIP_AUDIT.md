# RAGSource current Document evidence reader composition prerequisite ownership audit

**Date:** 2026-10-07  
**Baseline checkpoint:** `DEV-DOCUMENT-AI-GENERATED-MODEL-PROVIDER-ROW-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `8f5df2f9f866d8b745a5e917fc145109a876d22d`  
**Verified entry tree:** `6f3f17a350254ad2912579ef1dc42c86e764041a`  
**Governed batch:** DD-623 through DD-627

## Entry gate

DD-618…DD-622 state closure `8f5df2f9f866d8b745a5e917fc145109a876d22d` / tree `6f3f17a350254ad2912579ef1dc42c86e764041a` is exact-head verified. Core Service Verify push run `37577334597`: Core job `112649058960` **1553/1553 PASS** and PostgreSQL job `112649058768` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37577334529` / job `112649058544` PASS with repository inventory **48 migrations / 42 SQL verification files**. Web run `37577334532` / job `112649058995` PASS. Pull-request Core/Database/Web workflows on the same closure HEAD also passed.

PR #2 remains draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-127 owns exact persisted `RAGSource` evidence and `AIRAGSourceReadPort.loadForContext({ requestContext, ragSourceId })`. The PostgreSQL reader uses RequestScopedSql/RLS and preserves raw optional `documentId/documentVersion` without claiming current Document validity.
- DD-082 owns `DocumentAccessMetadata` and `DocumentAccessMetadataPort.loadForContext({ requestContext, documentId })`. Its PostgreSQL adapter performs one exact DocumentMeta id read under the supplied resolved Tenant RequestContext/RLS and preserves raw scope/lifecycle/scan/sensitivity/residency/version evidence.
- DD-193 already owns the pure optional `matchesAIRAGSourceDocumentBindingFloors(source, document?)` current relationship floor. It requires the exact persisted id/version pair, Tenant, null-safe Industry Context, scope, raw ACTIVE + CLEAN Document state, exact residency and source-sensitivity >= document-sensitivity. An unbound source requires both document identity/version absent and no Document evidence.
- DD-193 explicitly excludes Document ACL authorization, `aclPolicyRef` interpretation, RAGSource latest/current selection, source-resource dereference, chunking/embedding/retrieval/ranking/grounding and AI execution.
- The raw RAGSource reader may expose Tenant-Core rows according to RLS, but this composition must pass the exact same supplied RequestContext to the Document reader. It must not synthesize or downgrade context for PLATFORM_GLOBAL callers.
- No batch/list lookup is required: the relationship contains at most one persisted Document id.

**SOURCE-COMPLETE:** compose one exact RAGSource read with zero Document metadata reads for an unbound source, otherwise exactly one same-RequestContext Document metadata read using exact persisted `source.documentId`, then apply only existing DD-193.

## Frozen decisions

**DD-623 — exact RAGSource parent first.**  
Add `loadAIRAGSourceDocumentCurrentEvidence(...)`. Read the exact RAGSource first using the exact supplied RequestContext and ragSourceId. Null remains null; dependency/persistence errors propagate unchanged. No Document metadata access occurs before a RAGSource exists.

**DD-624 — unbound zero-read branch.**  
When `source.documentId` is absent, perform zero Document metadata reads and apply DD-193 with absent Document evidence. Success returns only the exact source evidence. Do not infer source current/latest status, dereference resourceId, interpret aclPolicyRef, or authorize retrieval.

**DD-625 — one exact bound Document read.**  
When `source.documentId` is present, call `DocumentAccessMetadataPort.loadForContext` exactly once with the exact supplied RequestContext and exact persisted documentId. Do not trim/normalize ids, substitute resourceId/storage id, search versions, discover alternates, retry or fall back. Missing Document returns null; dependency errors propagate unchanged.

**DD-626 — apply only existing DD-193 current relationship floor.**  
After required evidence is present, require `matchesAIRAGSourceDocumentBindingFloors(source, document)`. This proves only exact id/version/Tenant/nullable-Industry/scope plus ACTIVE+CLEAN, exact residency and sensitivity-rank relationship. Do not add owner, source-resource, storage, ACL, filename/media, retention, source-status or chunking semantics.

**DD-627 — immutable evidence and authority boundary.**  
Unbound success returns frozen `{ source }`. Bound success returns frozen `{ source, document }`, preserving exact loaded references without clone/normalization/mutation. Output grants no Document ACL/access/storage/signed-url authority, no source-resource authorization, no RAGSource latest/current selection, chunking/embedding/retrieval/ranking/grounding authority, and no provider/model routing or AI execution.

## Fixed acceptance before implementation

- **RAGSRC-DOCREAD-BASE-001** exact RAGSource is loaded first with unchanged RequestContext/id.
- **RAGSRC-DOCREAD-BASE-002** RAGSource null/errors short-circuit or propagate before any Document metadata read.
- **RAGSRC-DOCREAD-BRANCH-001** unbound source performs zero Document reads and can return frozen source-only evidence only when DD-193 unbound semantics pass.
- **RAGSRC-DOCREAD-READ-001** bound source performs exactly one Document metadata read using exact supplied RequestContext and persisted documentId.
- **RAGSRC-DOCREAD-READ-002** missing Document returns null and Document dependency errors propagate unchanged with no retry/search/version fallback/substitution.
- **RAGSRC-DOCREAD-FLOOR-001** exact DD-193 Tenant-Core and Tenant-Industry id/version/scope + ACTIVE/CLEAN + residency + sensitivity evidence passes and preserves exact references.
- **RAGSRC-DOCREAD-FLOOR-002** wrong/malformed/mismatched/unsafe DD-193 evidence fails closed; no alternate lookup or normalization occurs.
- **RAGSRC-DOCREAD-EVID-001** success is frozen and preserves exact RAGSource/Document references plus unrelated raw metadata unchanged.
- **RAGSRC-DOCREAD-BOUND-001** output exposes no ACL/access/storage/source-resource/current-source/chunk/embed/retrieval/ranking/grounding/routing/execution/mutation/event authority.

Expected executable delta: Core **1553 → 1562**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema, migration, verification SQL, RLS, role, grant, route, frontend, RawSource, provider SDK, worker or scheduler change.

This batch does **not**:
- synthesize Tenant/Industry context for PLATFORM_GLOBAL callers;
- interpret RAGSource raw status/sourceVersion/chunkingPolicyVersion as latest/current selection;
- interpret aclPolicyRef or read/evaluate Document ACLs;
- authorize owner/source-resource or StorageObject/signed-url access;
- dereference sourceModule/resourceType/resourceId;
- list/validate RAGChunk rows or execute chunking;
- evaluate embedding-model eligibility, vector/FTS retrieval, filtering, ranking/reranking, grounding/citation or prompt-injection policy;
- route providers/models or execute inference/RAG/assistant/agent/tool work;
- mutate source/document state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-623…DD-627 and the fixed acceptances above.
