import type { RequestContext } from "../context/contracts.js";
import type {
  AIModelCatalogMetadata,
  AIModelCatalogMetadataReadPort,
} from "./model-catalog-metadata.js";
import {
  matchesAIRAGChunkEmbeddingModelEligibilityFloors,
} from "./rag-chunk-embedding-model-eligibility-floors.js";
import type {
  AIRAGChunkMetadataReadPort,
  PersistedAIRAGChunkMetadata,
} from "./rag-chunk-metadata.js";

export interface AIRAGChunkEmbeddingModelCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly ragChunkId: string;
}

export interface AIRAGChunkEmbeddingModelCurrentEvidence {
  readonly chunk: PersistedAIRAGChunkMetadata;
  readonly model: AIModelCatalogMetadata;
}

/**
 * DD-633…DD-637: compose one exact RAGChunk read with one exact global
 * AIModel read by persisted chunk.embeddingModelId, then apply only DD-195's
 * current embedding-model eligibility floor.
 *
 * This independent relationship does not require DD-194 parent-source
 * evidence and does not establish Provider currentness, capability/modality/
 * residency compatibility, routing, retrieval, grounding or AI execution.
 */
export async function loadAIRAGChunkEmbeddingModelCurrentEvidence(
  input: AIRAGChunkEmbeddingModelCurrentEvidenceReadInput,
  chunkReader: AIRAGChunkMetadataReadPort,
  modelReader: AIModelCatalogMetadataReadPort,
): Promise<AIRAGChunkEmbeddingModelCurrentEvidence | null> {
  const chunk = await chunkReader.loadForContext({
    requestContext: input.requestContext,
    ragChunkId: input.ragChunkId,
  });
  if (chunk === null) return null;

  const model = await modelReader.loadById(chunk.embeddingModelId);
  if (model === null) return null;

  if (!matchesAIRAGChunkEmbeddingModelEligibilityFloors(chunk, model)) {
    return null;
  }

  return Object.freeze({
    chunk,
    model,
  });
}
