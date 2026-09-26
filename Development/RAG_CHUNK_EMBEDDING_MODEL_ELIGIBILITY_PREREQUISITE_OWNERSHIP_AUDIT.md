# RAGChunk embedding-model current eligibility prerequisite ownership audit

**Date:** 2026-09-25
**Baseline checkpoint:** `DEV-AI-RAG-CHUNK-SOURCE-BINDING-FLOORS-001`
**Verified closure HEAD:** `42b0d63313682e61e760e051a4fb57cd83942c8b`
**Verified tree:** `db78c0b35614995843003bf0789e31a1a9c7ae7c`

## Entry gate

DD-194 state closure is exact-head verified. Core Service Verify run `36153941490` passed Core job `108133791473` at **604/604** and PostgreSQL job `108133791244` at **504/504** plus database bootstrap PASS. Database Verify run `36153941262` / job `108133789742` passed. Web Boundary Verify run `36153941165` / job `108133788950` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0031 owns a separate RAGChunk embedding-model predicate after parent-source continuity:

`model.id = NEW.embedding_model_id AND model.status = 'ACTIVE' AND sensitivity_rank(model.sensitivity_ceiling) >= sensitivity_rank(NEW.sensitivity_class)`.

DD-128 exposes chunk `id`, exact `embeddingModelId` and constrained chunk sensitivity. DD-108 exposes AIModel `id`, raw `status` and constrained `sensitivityCeiling`. Therefore all evidence needed for this predicate is already available without new persistence readers, schema, RLS, roles or grants.

The migration predicate does **not** require Provider currentness, provider/model capability compatibility, modality compatibility, residency-region compatibility, embedding version compatibility, cost/latency class, model version, provider health/credentials or routing policy. Those remain separate concerns.

## Determination and locked DD-195 detailed contract

**SOURCE-COMPLETE for RAGChunk → current embedding AIModel eligibility only.**

Authorize pure helper:

`matchesAIRAGChunkEmbeddingModelEligibilityFloors(chunk, model?)`

It accepts one DD-128 `PersistedAIRAGChunkMetadata` and optional DD-108 `AIModelCatalogMetadata`, returns boolean and never mutates inputs.

1. Validate relevant chunk id, embedding-model id and sensitivity class.
2. Require supplied model evidence with valid model id, raw status string and known sensitivity ceiling.
3. Require exact `model.id === chunk.embeddingModelId`.
4. Require raw `model.status === "ACTIVE"` with no normalization.
5. Require model sensitivity ceiling rank >= chunk sensitivity rank.
6. Unknown sensitivity values fail closed.
7. All other chunk/source/ACL/embedding-version/residency/retention/metadata and model Provider/capability/modalities/residency/cost/latency/version/metadata semantics remain uninterpreted.

## Fixed acceptance before implementation

- **RAGCHUNK-MODEL-CUR-001**: exact ACTIVE model id with sufficient ceiling passes.
- **RAGCHUNK-MODEL-CUR-002**: missing model evidence or wrong model id fails closed.
- **RAGCHUNK-MODEL-CUR-003**: raw status must equal ACTIVE exactly; inactive/retired/case/whitespace variants fail.
- **RAGCHUNK-MODEL-CUR-004**: all known sensitivity pairs follow model-ceiling-rank >= chunk-rank.
- **RAGCHUNK-MODEL-CUR-005**: unknown chunk or model sensitivity fails closed.
- **RAGCHUNK-MODEL-CUR-006**: malformed chunk/model relevant identity/status shape fails closed.
- **RAGCHUNK-MODEL-CUR-007**: Provider/capability/modality/residency/cost/latency/version/metadata are not eligibility inputs.
- **RAGCHUNK-MODEL-CUR-008**: unrelated chunk fields including source/scope/residency/retention/ACL/embeddingVersion are uninterpreted and inputs remain unchanged.

Expected executable delta: Core **604 → 612**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not Provider currentness, provider health/credential authority, capability/modality/residency compatibility, embedding-version compatibility, model routing/selection, cost/budget policy, RAGSource/Document/ACL validity, vector/FTS retrieval, ranking/reranking, grounding/citation, prompt-injection defense or AI execution authority. It changes no schema/RLS/role/grant/route/product policy.

After DD-195 is implemented and exact-head verified, source-audit the next independent persisted RAG/AI relationship. Complete RAG retrieval and AI execution remain separately governed.
