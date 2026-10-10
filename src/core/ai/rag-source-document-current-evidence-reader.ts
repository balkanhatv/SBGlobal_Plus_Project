import type { RequestContext } from "../context/contracts.js";
import type {
  DocumentAccessMetadata,
  DocumentAccessMetadataPort,
} from "../document/access-candidate.js";
import {
  matchesAIRAGSourceDocumentBindingFloors,
} from "./rag-source-document-binding-floors.js";
import type {
  AIRAGSourceReadPort,
  PersistedAIRAGSource,
} from "./rag-source.js";

export interface AIRAGSourceDocumentCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly ragSourceId: string;
}

export interface AIRAGSourceDocumentCurrentEvidence {
  readonly source: PersistedAIRAGSource;
  readonly document?: DocumentAccessMetadata;
}

/**
 * DD-623…DD-627: compose one exact RAGSource read with zero Document metadata
 * reads for an unbound source, otherwise one exact same-RequestContext
 * Document metadata read using the persisted source.documentId, then apply
 * only DD-193's current relationship floor.
 *
 * This does not interpret ACLs, source-resource authority, RAGSource
 * current/latest status, chunking/retrieval/grounding or AI execution.
 */
export async function loadAIRAGSourceDocumentCurrentEvidence(
  input: AIRAGSourceDocumentCurrentEvidenceReadInput,
  sourceReader: AIRAGSourceReadPort,
  documentReader: DocumentAccessMetadataPort,
): Promise<AIRAGSourceDocumentCurrentEvidence | null> {
  const source = await sourceReader.loadForContext({
    requestContext: input.requestContext,
    ragSourceId: input.ragSourceId,
  });
  if (source === null) return null;

  if (source.documentId === undefined) {
    if (!matchesAIRAGSourceDocumentBindingFloors(source)) return null;
    return Object.freeze({source});
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
    source,
    document,
  });
}
