import type { RequestContext } from "../context/contracts.js";
import type {
  AIRAGChunkMetadataReadPort,
  PersistedAIRAGChunkMetadata,
} from "./rag-chunk-metadata.js";
import {
  matchesAIRAGChunkSourceBindingFloors,
} from "./rag-chunk-source-binding-floors.js";
import type {
  AIRAGSourceReadPort,
  PersistedAIRAGSource,
} from "./rag-source.js";

export interface AIRAGChunkSourceCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly ragChunkId: string;
}

export interface AIRAGChunkSourceCurrentEvidence {
  readonly chunk: PersistedAIRAGChunkMetadata;
  readonly source: PersistedAIRAGSource;
}

/**
 * DD-628…DD-632: compose one exact RAGChunk read with one exact
 * same-RequestContext parent RAGSource read using persisted chunk.sourceId,
 * then apply only DD-194's direct parent relationship floor.
 *
 * This does not interpret RAGSource lifecycle/latest state, Document binding
 * or ACL/access, chunk ACL projection, embedding-model eligibility,
 * retrieval/grounding/routing or AI execution.
 */
export async function loadAIRAGChunkSourceCurrentEvidence(
  input: AIRAGChunkSourceCurrentEvidenceReadInput,
  chunkReader: AIRAGChunkMetadataReadPort,
  sourceReader: AIRAGSourceReadPort,
): Promise<AIRAGChunkSourceCurrentEvidence | null> {
  const chunk = await chunkReader.loadForContext({
    requestContext: input.requestContext,
    ragChunkId: input.ragChunkId,
  });
  if (chunk === null) return null;

  const source = await sourceReader.loadForContext({
    requestContext: input.requestContext,
    ragSourceId: chunk.sourceId,
  });
  if (source === null) return null;

  if (!matchesAIRAGChunkSourceBindingFloors(chunk, source)) {
    return null;
  }

  return Object.freeze({
    chunk,
    source,
  });
}
