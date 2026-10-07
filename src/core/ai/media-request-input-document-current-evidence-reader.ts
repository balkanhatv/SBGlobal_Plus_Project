import type { RequestContext } from "../context/contracts.js";
import type {
  DocumentAccessMetadata,
  DocumentAccessMetadataPort,
} from "../document/access-candidate.js";
import {
  matchesAIMediaRequestInputDocumentBindingFloors,
} from "./media-request-input-document-binding-floors.js";
import type {
  AIMediaRequestReadPort,
  PersistedAIMediaRequest,
} from "./media-request.js";

export interface AIMediaRequestInputDocumentCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly mediaRequestId: string;
}

export interface AIMediaRequestInputDocumentCurrentEvidence {
  readonly request: PersistedAIMediaRequest;
  readonly documents: readonly DocumentAccessMetadata[];
}

/**
 * DD-603…DD-607: compose one exact AIMediaRequest read with zero Document
 * metadata reads for an empty persisted input set, otherwise one exact
 * same-RequestContext Document metadata read per persisted inputDocumentRef,
 * then apply only DD-189's input-document relationship/currentness floor.
 *
 * This does not read or decide ACLs, resolve physical storage access, establish
 * source-resource/principal authorization, or grant media execution authority.
 */
export async function loadAIMediaRequestInputDocumentCurrentEvidence(
  input: AIMediaRequestInputDocumentCurrentEvidenceReadInput,
  mediaRequestReader: AIMediaRequestReadPort,
  documentReader: DocumentAccessMetadataPort,
): Promise<AIMediaRequestInputDocumentCurrentEvidence | null> {
  const request = await mediaRequestReader.loadForContext({
    requestContext: input.requestContext,
    mediaRequestId: input.mediaRequestId,
  });
  if (request === null) return null;

  const documents: DocumentAccessMetadata[] = [];
  for (const documentId of request.inputDocumentRefs) {
    const document = await documentReader.loadForContext({
      requestContext: input.requestContext,
      documentId,
    });
    if (document === null) return null;
    documents.push(document);
  }

  if (!matchesAIMediaRequestInputDocumentBindingFloors(request, documents)) {
    return null;
  }

  return Object.freeze({
    request,
    documents: Object.freeze(documents),
  });
}
