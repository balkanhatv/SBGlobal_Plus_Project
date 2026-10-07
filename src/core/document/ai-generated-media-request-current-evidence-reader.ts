import type {
  AIMediaRequestReadPort,
  PersistedAIMediaRequest,
} from "../ai/media-request.js";
import type { RequestContext } from "../context/contracts.js";
import {
  matchesDocumentAIGeneratedMediaRequestProvenanceFloors,
} from "./ai-generated-media-request-provenance-floors.js";
import type {
  DocumentAIGeneratedProvenanceReadPort,
  PersistedDocumentAIGeneratedProvenance,
} from "./ai-generated-provenance.js";

export interface DocumentAIGeneratedMediaRequestCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly documentId: string;
}

export interface DocumentAIGeneratedMediaRequestParentOnlyEvidence {
  readonly document: PersistedDocumentAIGeneratedProvenance;
  readonly mediaRequest?: never;
}

export interface DocumentAIGeneratedMediaRequestBoundEvidence {
  readonly document: PersistedDocumentAIGeneratedProvenance;
  readonly mediaRequest: PersistedAIMediaRequest;
}

export type DocumentAIGeneratedMediaRequestCurrentEvidence =
  | DocumentAIGeneratedMediaRequestParentOnlyEvidence
  | DocumentAIGeneratedMediaRequestBoundEvidence;

/**
 * DD-608…DD-612: compose exact persisted Document AI-provenance evidence with
 * zero AIMediaRequest reads for non-AI documents or one exact same-context
 * AIMediaRequest read for the persisted aiMediaRequestId, then apply only the
 * existing DD-191 provenance relationship/currentness floor.
 *
 * This evidence does not establish provider/model eligibility, moderation or
 * licensing approval, principal/document access, storage signing, prompt or
 * capability admission, media generation/publication, mutation or events.
 */
export async function loadDocumentAIGeneratedMediaRequestCurrentEvidence(
  input: DocumentAIGeneratedMediaRequestCurrentEvidenceReadInput,
  documentReader: DocumentAIGeneratedProvenanceReadPort,
  mediaRequestReader: AIMediaRequestReadPort,
): Promise<DocumentAIGeneratedMediaRequestCurrentEvidence | null> {
  const document = await documentReader.loadForContext({
    requestContext: input.requestContext,
    documentId: input.documentId,
  });
  if (document === null) return null;

  if (!document.aiGenerated) {
    if (!matchesDocumentAIGeneratedMediaRequestProvenanceFloors(document)) {
      return null;
    }
    return Object.freeze({ document });
  }

  const mediaRequestId = document.aiMediaRequestId;
  if (mediaRequestId === undefined) return null;

  const mediaRequest = await mediaRequestReader.loadForContext({
    requestContext: input.requestContext,
    mediaRequestId,
  });
  if (mediaRequest === null) return null;

  if (
    !matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document,
      mediaRequest,
    )
  ) {
    return null;
  }

  return Object.freeze({
    document,
    mediaRequest,
  });
}
