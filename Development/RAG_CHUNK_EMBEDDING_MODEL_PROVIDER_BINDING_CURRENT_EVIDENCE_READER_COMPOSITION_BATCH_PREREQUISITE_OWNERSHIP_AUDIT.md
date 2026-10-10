# RAGChunk embedding AIModel → AIProvider binding current-evidence reader composition prerequisite ownership audit

**Date:** 2026-10-07  
**Baseline checkpoint:** `DEV-AI-RAG-CHUNK-EMBEDDING-MODEL-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `6ba54ab59b593657a6e566b5c63cde2c59fdbfed`  
**Verified entry tree:** `26d0391fcda84a20c95d0763773717170f995af2`  
**Governed batch:** DD-638 through DD-642

## Entry gate

DD-633…DD-637 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37642848852`: Core job `112865599891` **1578/1578 PASS**, PostgreSQL job `112865599014` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37642849009` / job `112865599119` PASS with **48 migrations / 42 SQL verification files**. Web run `37642848683` / job `112865596950` PASS.

PR #2 remains open/draft/unmerged. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

- DD-637 already owns exact RAGChunk first + exact global AIModel read by persisted `chunk.embeddingModelId` + DD-195 current embedding-model eligibility (exact id, raw ACTIVE, sufficient sensitivity ceiling).
- DD-200 owns the direct source-defined global catalog foreign-key continuity `AIModel.providerId → AIProvider.id` only.
- `AIProviderCatalogMetadataReadPort.loadById(id)` already owns an exact global provider catalog metadata read and deliberately omits `credential_ref`.
- Migration 0011 owns `ai_model.provider_id uuid NOT NULL REFERENCES core_ai.ai_provider(id)`.
- DD-107 provider metadata preserves raw status, adapter, regions, capabilities, security, residency metadata, health, version and timestamps but does not define runtime provider usability.
- DD-231…DD-237 provider/model candidate floors prove a different operation-routing prerequisite family and require declaration/snapshot/authorized-region inputs that this RAGChunk relationship does not possess. They must not be imported here.

The source does **not** make Provider ACTIVE status, health state, credential-reference access, provider capability/region suitability, model-provider runtime route eligibility, tenant allowlists, budget/quota, fallback, SDK execution or RAG retrieval/grounding part of the direct DD-200 foreign-key relationship.

## Determination

**SOURCE-COMPLETE for DD-637 embedding-model evidence + one exact current AIProvider row + DD-200 provider-id binding only.**

Authorize a reader that first establishes exact DD-637 evidence, then reads exactly one AIProvider row by the already-preserved `model.providerId`, applies only DD-200 binding continuity, and returns immutable exact references.

## Frozen decisions

### DD-638 — exact DD-637 parent evidence first

Add `loadAIRAGChunkEmbeddingModelProviderBindingCurrentEvidence(...)`. Invoke DD-637 first with the exact supplied RequestContext, RAGChunk id, chunk reader and model reader. Parent null returns null; DD-637 dependency errors propagate unchanged. No Provider read occurs before DD-637 succeeds.

### DD-639 — one exact global Provider read by persisted Model.providerId

After DD-637 succeeds, call `AIProviderCatalogMetadataReadPort.loadById(parent.model.providerId)` exactly once. No trim, normalization, alias, provider search, model re-read, source read or fallback is allowed. Missing Provider evidence returns null; reader errors propagate unchanged.

### DD-640 — apply DD-200 direct provider-id continuity only

Require `matchesAIModelProviderBindingFloors(parent.model, provider)`. Exact persisted `provider.id === model.providerId` passes. Missing/wrong/malformed relevant identities fail closed. Provider lifecycle, health, credentials, capabilities, regions, security, residency and version remain uninterpreted.

### DD-641 — immutable layered evidence

Success returns frozen `{ parent, provider }` preserving the exact DD-637 parent and exact AIProvider metadata object references. No clone, normalization or mutation is allowed.

### DD-642 — binding evidence grants no Provider-current/routing/retrieval/execution authority

A success is only DD-637 embedding-model eligibility plus DD-200 direct Model→Provider id continuity. It is not Provider ACTIVE/current/healthy/credential authority; not capability/modality/residency/provider-model route compatibility; not Tenant/Industry allowlist, quota/budget, model selection or fallback; not RAGSource/Document/ACL validity; not retrieval/ranking/grounding/citation; and not provider SDK/AI execution authority.

## Fixed acceptance before implementation

- **RAGCHUNK-MODELPROV-BASE-001** exact DD-637 parent evidence is established first with unchanged inputs/dependencies.
- **RAGCHUNK-MODELPROV-BASE-002** DD-637 null/error short-circuits or propagates before Provider access.
- **RAGCHUNK-MODELPROV-READ-001** exactly one Provider read uses exact preserved `parent.model.providerId`.
- **RAGCHUNK-MODELPROV-READ-002** missing Provider returns null and Provider dependency errors propagate unchanged with no fallback/re-read.
- **RAGCHUNK-MODELPROV-BIND-001** exact DD-200 Model→Provider id binding passes.
- **RAGCHUNK-MODELPROV-BIND-002** wrong/malformed Provider/Model relevant identity evidence fails closed.
- **RAGCHUNK-MODELPROV-EVID-001** success preserves exact DD-637 parent and Provider references; all raw evidence remains unchanged.
- **RAGCHUNK-MODELPROV-BOUND-001** output exposes no Provider-current/health/credential/capability/residency/routing/retrieval/grounding/execution authority.

Expected executable delta: Core **1578 → 1586**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, credential/secret access, provider SDK, worker, scheduler or RawSource change.

This batch does **not**:
- interpret Provider status or health as usability;
- expose or resolve `credential_ref`;
- evaluate Provider capabilities or supported regions;
- evaluate provider/model operation-candidate floors;
- evaluate Tenant/Industry allowlists, entitlement, quota or budget;
- create route/fallback/retry/selection authority;
- revalidate RAGSource, Document, ACL or source binding;
- perform vector/search/retrieval/ranking/reranking/grounding/citation;
- invoke embeddings, inference, media, agents or tools.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-638…DD-642 and the fixed acceptances.
