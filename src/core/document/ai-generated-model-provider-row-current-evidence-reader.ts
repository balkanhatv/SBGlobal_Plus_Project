import type {
  AIModelCatalogMetadataReadPort,
} from "../ai/model-catalog-metadata.js";
import type {
  AIProviderCatalogMetadata,
  AIProviderCatalogMetadataReadPort,
} from "../ai/provider-catalog-metadata.js";
import {
  matchesAIModelProviderBindingFloors,
} from "../ai/model-provider-binding-floors.js";
import type { AIMediaRequestReadPort } from "../ai/media-request.js";
import type { RequestContext } from "../context/contracts.js";
import {
  loadDocumentAIGeneratedModelProviderCurrentEvidence,
  type DocumentAIGeneratedModelProviderCurrentEvidence,
} from "./ai-generated-model-provider-current-evidence-reader.js";
import type {
  DocumentAIGeneratedProvenanceReadPort,
} from "./ai-generated-provenance.js";

export interface DocumentAIGeneratedModelProviderRowCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly documentId: string;
}

export interface DocumentAIGeneratedModelProviderRowParentOnlyEvidence {
  readonly parent: DocumentAIGeneratedModelProviderCurrentEvidence;
  readonly provider?: never;
}

export interface DocumentAIGeneratedModelProviderRowBoundEvidence {
  readonly parent: DocumentAIGeneratedModelProviderCurrentEvidence;
  readonly provider: AIProviderCatalogMetadata;
}

export type DocumentAIGeneratedModelProviderRowCurrentEvidence =
  | DocumentAIGeneratedModelProviderRowParentOnlyEvidence
  | DocumentAIGeneratedModelProviderRowBoundEvidence;

/**
 * DD-618…DD-622: extend exact DD-617 Generated Document + AIModel evidence
 * with zero AIProvider reads for the non-AI/model-absent branch or one exact
 * global AIProvider metadata read by the preserved model.providerId, then apply
 * only DD-200's direct AIModel -> AIProvider foreign-key continuity floor.
 *
 * This does not establish Provider/Model currentness, health, credentials,
 * eligibility/routing, moderation/licensing approval, Document access/storage,
 * publication or AI execution authority.
 */
export async function loadDocumentAIGeneratedModelProviderRowCurrentEvidence(
  input: DocumentAIGeneratedModelProviderRowCurrentEvidenceReadInput,
  documentReader: DocumentAIGeneratedProvenanceReadPort,
  mediaRequestReader: AIMediaRequestReadPort,
  modelReader: AIModelCatalogMetadataReadPort,
  providerReader: AIProviderCatalogMetadataReadPort,
): Promise<DocumentAIGeneratedModelProviderRowCurrentEvidence | null> {
  const parent = await loadDocumentAIGeneratedModelProviderCurrentEvidence(
    input,
    documentReader,
    mediaRequestReader,
    modelReader,
  );
  if (parent === null) return null;

  const model = parent.model;
  if (model === undefined) {
    return Object.freeze({ parent });
  }

  const provider = await providerReader.loadById(model.providerId);
  if (provider === null) return null;

  if (!matchesAIModelProviderBindingFloors(model, provider)) {
    return null;
  }

  return Object.freeze({
    parent,
    provider,
  });
}
