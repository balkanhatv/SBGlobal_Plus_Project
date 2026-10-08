import type { RequestContext } from "../context/contracts.js";
import type { DocumentAccessMetadataPort } from "../document/access-candidate.js";
import type { DocumentAclPermission, DocumentAclReadPort } from "../document/acl.js";
import type { AIModelCatalogMetadataReadPort } from "./model-catalog-metadata.js";
import type { AIProviderCatalogMetadataReadPort } from "./provider-catalog-metadata.js";
import type { AIRAGChunkMetadataReadPort } from "./rag-chunk-metadata.js";
import {
  loadAIRAGChunkSourceResourceDescriptorEvidence,
  type AIRAGChunkSourceResourceDescriptorEvidence,
} from "./rag-chunk-source-resource-descriptor-evidence-reader.js";
import type { AIRAGSourceReadPort } from "./rag-source.js";

export interface AIRAGChunkCitationIdentityEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly ragChunkId: string;
  readonly documentAclPermission: DocumentAclPermission;
  readonly currentTimeIso: string;
}

/** Internal partial identity only; never a client-visible GroundingCitation. */
export interface AIRAGChunkCitationIdentity {
  readonly sourceResourceType: string;
  readonly sourceResourceId: string;
  readonly documentId?: string;
  readonly chunkId: string;
  readonly sourceVersion: string;
}

export interface AIRAGChunkCitationIdentityParentOnlyEvidence {
  readonly parent: AIRAGChunkSourceResourceDescriptorEvidence;
  readonly citationIdentity?: never;
}
export interface AIRAGChunkCitationIdentityProjectedEvidence {
  readonly parent: AIRAGChunkSourceResourceDescriptorEvidence;
  readonly citationIdentity: AIRAGChunkCitationIdentity;
}
export type AIRAGChunkCitationIdentityEvidence =
  | AIRAGChunkCitationIdentityParentOnlyEvidence
  | AIRAGChunkCitationIdentityProjectedEvidence;

/**
 * DD-663…DD-667: zero-read internal partial DD-09 §9 citation-identity
 * projection, restricted to DD-662's still-unauthorized source-resource
 * descriptor branch. No citation label/relevance class/client disclosure,
 * final authorization, retrieval, grounding or inference authority.
 */
export async function loadAIRAGChunkCitationIdentityEvidence(
  input: AIRAGChunkCitationIdentityEvidenceReadInput,
  chunkReader: AIRAGChunkMetadataReadPort,
  modelReader: AIModelCatalogMetadataReadPort,
  providerReader: AIProviderCatalogMetadataReadPort,
  sourceReader: AIRAGSourceReadPort,
  documentReader: DocumentAccessMetadataPort,
  aclReader: DocumentAclReadPort,
): Promise<AIRAGChunkCitationIdentityEvidence | null> {
  const parent = await loadAIRAGChunkSourceResourceDescriptorEvidence(
    input,
    chunkReader,
    modelReader,
    providerReader,
    sourceReader,
    documentReader,
    aclReader,
  );
  if (parent === null) return null;
  if (parent.resourceDescriptor === undefined) {
    return Object.freeze({parent});
  }

  const source = parent.parent.parent.source;
  const chunk = parent.parent.parent.parent.parent.chunk;
  const citationIdentity: AIRAGChunkCitationIdentity = Object.freeze({
    sourceResourceType: source.resourceType,
    sourceResourceId: source.resourceId,
    ...(source.documentId === undefined ? {} : {documentId: source.documentId}),
    chunkId: chunk.id,
    sourceVersion: source.sourceVersion,
  });

  return Object.freeze({parent, citationIdentity});
}
