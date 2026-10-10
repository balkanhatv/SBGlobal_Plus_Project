import type {
  AIModelCatalogMetadata,
  AIModelCatalogMetadataReadPort,
} from "../ai/model-catalog-metadata.js";
import type { AIMediaRequestReadPort } from "../ai/media-request.js";
import type { RequestContext } from "../context/contracts.js";
import {
  loadDocumentAIGeneratedMediaRequestCurrentEvidence,
  type DocumentAIGeneratedMediaRequestCurrentEvidence,
} from "./ai-generated-media-request-current-evidence-reader.js";
import {
  matchesDocumentAIGeneratedModelProviderBindingFloors,
} from "./ai-generated-model-provider-binding-floors.js";
import type {
  DocumentAIGeneratedProvenanceReadPort,
} from "./ai-generated-provenance.js";

export interface DocumentAIGeneratedModelProviderCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly documentId: string;
}

export interface DocumentAIGeneratedModelProviderParentOnlyEvidence {
  readonly parent: DocumentAIGeneratedMediaRequestCurrentEvidence;
  readonly model?: never;
}

export interface DocumentAIGeneratedModelProviderBoundEvidence {
  readonly parent: DocumentAIGeneratedMediaRequestCurrentEvidence;
  readonly model: AIModelCatalogMetadata;
}

export type DocumentAIGeneratedModelProviderCurrentEvidence =
  | DocumentAIGeneratedModelProviderParentOnlyEvidence
  | DocumentAIGeneratedModelProviderBoundEvidence;

/**
 * DD-613…DD-617: extend exact DD-612 Generated Document -> completed
 * AIMediaRequest current evidence with zero AIModel reads for non-AI documents
 * or one exact global AIModel metadata read by persisted document.aiModelId,
 * then apply only DD-192's exact model/provider composite-pair floor.
 *
 * This does not read AIProvider or establish Provider/Model currentness,
 * eligibility/routing, moderation/licensing approval, Document access/storage,
 * media publication or AI execution authority.
 */
export async function loadDocumentAIGeneratedModelProviderCurrentEvidence(
  input: DocumentAIGeneratedModelProviderCurrentEvidenceReadInput,
  documentReader: DocumentAIGeneratedProvenanceReadPort,
  mediaRequestReader: AIMediaRequestReadPort,
  modelReader: AIModelCatalogMetadataReadPort,
): Promise<DocumentAIGeneratedModelProviderCurrentEvidence | null> {
  const parent = await loadDocumentAIGeneratedMediaRequestCurrentEvidence(
    input,
    documentReader,
    mediaRequestReader,
  );
  if (parent === null) return null;

  const document = parent.document;
  if (!document.aiGenerated) {
    if (!matchesDocumentAIGeneratedModelProviderBindingFloors(document)) {
      return null;
    }
    return Object.freeze({parent});
  }

  const modelId = document.aiModelId;
  if (modelId === undefined) return null;

  const model = await modelReader.loadById(modelId);
  if (model === null) return null;

  if (!matchesDocumentAIGeneratedModelProviderBindingFloors(document, model)) {
    return null;
  }

  return Object.freeze({
    parent,
    model,
  });
}
