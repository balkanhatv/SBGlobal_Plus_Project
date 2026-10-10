import type { RequestContext } from "../context/contracts.js";
import type {
  DocumentAccessMetadata,
  DocumentAccessMetadataPort,
} from "../document/access-candidate.js";
import type { AIModelCatalogMetadataReadPort } from "./model-catalog-metadata.js";
import {
  loadAIRAGChunkEmbeddingModelProviderBindingCurrentEvidence,
  type AIRAGChunkEmbeddingModelProviderBindingCurrentEvidence,
} from "./rag-chunk-embedding-model-provider-binding-current-evidence-reader.js";
import { matchesAIRAGChunkSourceBindingFloors } from "./rag-chunk-source-binding-floors.js";
import type { AIRAGChunkMetadataReadPort } from "./rag-chunk-metadata.js";
import {
  matchesAIRAGSourceDocumentBindingFloors,
} from "./rag-source-document-binding-floors.js";
import type {
  AIRAGSourceReadPort,
  PersistedAIRAGSource,
} from "./rag-source.js";
import type { AIProviderCatalogMetadataReadPort } from "./provider-catalog-metadata.js";

export interface AIRAGChunkSourceDocumentModelProviderCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly ragChunkId: string;
}

export interface AIRAGChunkSourceDocumentModelProviderCurrentEvidence {
  readonly parent: AIRAGChunkEmbeddingModelProviderBindingCurrentEvidence;
  readonly source: PersistedAIRAGSource;
  readonly document?: DocumentAccessMetadata;
}

/**
 * DD-643…DD-647: extend exact DD-642 chunk/model/provider evidence with one
 * exact same-context parent RAGSource read and DD-194, then DD-193's optional
 * Document relationship with zero-or-one exact same-context Document read.
 *
 * Success is immutable lineage evidence only. It does not authorize ACL,
 * storage, provider usability/routing, retrieval/grounding or AI execution.
 */
export async function loadAIRAGChunkSourceDocumentModelProviderCurrentEvidence(
  input: AIRAGChunkSourceDocumentModelProviderCurrentEvidenceReadInput,
  chunkReader: AIRAGChunkMetadataReadPort,
  modelReader: AIModelCatalogMetadataReadPort,
  providerReader: AIProviderCatalogMetadataReadPort,
  sourceReader: AIRAGSourceReadPort,
  documentReader: DocumentAccessMetadataPort,
): Promise<AIRAGChunkSourceDocumentModelProviderCurrentEvidence | null> {
  const parent = await loadAIRAGChunkEmbeddingModelProviderBindingCurrentEvidence(
    input,
    chunkReader,
    modelReader,
    providerReader,
  );
  if (parent === null) return null;

  const chunk = parent.parent.chunk;
  const source = await sourceReader.loadForContext({
    requestContext: input.requestContext,
    ragSourceId: chunk.sourceId,
  });
  if (source === null) return null;

  if (!matchesAIRAGChunkSourceBindingFloors(chunk, source)) {
    return null;
  }

  if (source.documentId === undefined) {
    if (!matchesAIRAGSourceDocumentBindingFloors(source)) {
      return null;
    }
    return Object.freeze({parent, source});
  }

  const document = await documentReader.loadForContext({
    requestContext: input.requestContext,
    documentId: source.documentId,
  });
  if (document === null) return null;

  if (!matchesAIRAGSourceDocumentBindingFloors(source, document)) {
    return null;
  }

  return Object.freeze({
    parent,
    source,
    document,
  });
}
