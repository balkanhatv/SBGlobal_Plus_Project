import type { ResourceDescriptor } from "../authorization/contracts.js";
import type { RequestContext } from "../context/contracts.js";
import type { DocumentAccessMetadataPort } from "../document/access-candidate.js";
import type {
  DocumentAclPermission,
  DocumentAclReadPort,
} from "../document/acl.js";
import type { AIModelCatalogMetadataReadPort } from "./model-catalog-metadata.js";
import type { AIProviderCatalogMetadataReadPort } from "./provider-catalog-metadata.js";
import {
  loadAIRAGChunkBoundDocumentAclAccessPathEvidence,
  type AIRAGChunkBoundDocumentAclAccessPathEvidence,
} from "./rag-chunk-bound-document-acl-access-path-evidence-reader.js";
import type { AIRAGChunkMetadataReadPort } from "./rag-chunk-metadata.js";
import type { AIRAGSourceReadPort } from "./rag-source.js";

export interface AIRAGChunkSourceResourceDescriptorEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly ragChunkId: string;
  readonly documentAclPermission: DocumentAclPermission;
  readonly currentTimeIso: string;
}

export interface AIRAGChunkSourceResourceDescriptorParentOnlyEvidence {
  readonly parent: AIRAGChunkBoundDocumentAclAccessPathEvidence;
  readonly resourceDescriptor?: never;
}

export interface AIRAGChunkSourceResourceDescriptorProjectedEvidence {
  readonly parent: AIRAGChunkBoundDocumentAclAccessPathEvidence;
  readonly resourceDescriptor: ResourceDescriptor;
}

export type AIRAGChunkSourceResourceDescriptorEvidence =
  | AIRAGChunkSourceResourceDescriptorParentOnlyEvidence
  | AIRAGChunkSourceResourceDescriptorProjectedEvidence;

/**
 * DD-658…DD-662: extend exact DD-657 evidence with a zero-read DD-03
 * ResourceDescriptor projection only for SOURCE_RESOURCE_AUTHORIZATION_REQUIRED.
 *
 * The descriptor preserves persisted RAGSource identity/sensitivity only. It
 * does not resolve the source resource, choose an OperationContract, map
 * residencyRegion to residencyClass, or authorize retrieval/execution.
 */
export async function loadAIRAGChunkSourceResourceDescriptorEvidence(
  input: AIRAGChunkSourceResourceDescriptorEvidenceReadInput,
  chunkReader: AIRAGChunkMetadataReadPort,
  modelReader: AIModelCatalogMetadataReadPort,
  providerReader: AIProviderCatalogMetadataReadPort,
  sourceReader: AIRAGSourceReadPort,
  documentReader: DocumentAccessMetadataPort,
  aclReader: DocumentAclReadPort,
): Promise<AIRAGChunkSourceResourceDescriptorEvidence | null> {
  const parent = await loadAIRAGChunkBoundDocumentAclAccessPathEvidence(
    input,
    chunkReader,
    modelReader,
    providerReader,
    sourceReader,
    documentReader,
    aclReader,
  );
  if (parent === null) return null;

  if (parent.accessPathEvidence !== "SOURCE_RESOURCE_AUTHORIZATION_REQUIRED") {
    return Object.freeze({parent});
  }

  const source = parent.parent.parent.source;
  const resourceDescriptor: ResourceDescriptor = Object.freeze({
    resourceType: source.resourceType,
    resourceId: source.resourceId,
    tenantId: source.tenantId,
    ...(source.industryContextId === undefined
      ? {}
      : {industryContextId: source.industryContextId}),
    sensitivityClass: source.sensitivityClass,
  });

  return Object.freeze({
    parent,
    resourceDescriptor,
  });
}
