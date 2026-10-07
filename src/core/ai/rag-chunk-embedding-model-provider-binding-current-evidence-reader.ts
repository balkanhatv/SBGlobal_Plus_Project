import type { RequestContext } from "../context/contracts.js";
import type { AIModelCatalogMetadataReadPort } from "./model-catalog-metadata.js";
import { matchesAIModelProviderBindingFloors } from "./model-provider-binding-floors.js";
import type {
  AIProviderCatalogMetadata,
  AIProviderCatalogMetadataReadPort,
} from "./provider-catalog-metadata.js";
import type { AIRAGChunkMetadataReadPort } from "./rag-chunk-metadata.js";
import {
  loadAIRAGChunkEmbeddingModelCurrentEvidence,
  type AIRAGChunkEmbeddingModelCurrentEvidence,
} from "./rag-chunk-embedding-model-current-evidence-reader.js";

export interface AIRAGChunkEmbeddingModelProviderBindingCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly ragChunkId: string;
}

export interface AIRAGChunkEmbeddingModelProviderBindingCurrentEvidence {
  readonly parent: AIRAGChunkEmbeddingModelCurrentEvidence;
  readonly provider: AIProviderCatalogMetadata;
}

/**
 * DD-638…DD-642: extend exact DD-637 RAGChunk -> current embedding AIModel
 * evidence with one exact global AIProvider read by preserved model.providerId,
 * then apply only DD-200 direct provider-id continuity.
 */
export async function loadAIRAGChunkEmbeddingModelProviderBindingCurrentEvidence(
  input: AIRAGChunkEmbeddingModelProviderBindingCurrentEvidenceReadInput,
  chunkReader: AIRAGChunkMetadataReadPort,
  modelReader: AIModelCatalogMetadataReadPort,
  providerReader: AIProviderCatalogMetadataReadPort,
): Promise<AIRAGChunkEmbeddingModelProviderBindingCurrentEvidence | null> {
  const parent = await loadAIRAGChunkEmbeddingModelCurrentEvidence(
    input,
    chunkReader,
    modelReader,
  );
  if (parent === null) return null;

  const provider = await providerReader.loadById(parent.model.providerId);
  if (provider === null) return null;

  if (!matchesAIModelProviderBindingFloors(parent.model, provider)) {
    return null;
  }

  return Object.freeze({parent, provider});
}
