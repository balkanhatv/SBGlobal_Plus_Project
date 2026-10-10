import type { RequestContext } from "../context/contracts.js";
import type {
  DocumentAccessMetadata,
  DocumentAccessMetadataPort,
} from "../document/access-candidate.js";
import {
  loadDocumentAccessAclCurrentEffectEvidence,
  type DocumentAccessAclCurrentEffectEvidence,
} from "../document/access-acl-current-effect-evidence-reader.js";
import type {
  DocumentAclPermission,
  DocumentAclReadPort,
} from "../document/acl.js";
import type { AIModelCatalogMetadataReadPort } from "./model-catalog-metadata.js";
import type { AIProviderCatalogMetadataReadPort } from "./provider-catalog-metadata.js";
import type { AIRAGChunkMetadataReadPort } from "./rag-chunk-metadata.js";
import {
  loadAIRAGChunkSourceDocumentModelProviderCurrentEvidence,
  type AIRAGChunkSourceDocumentModelProviderCurrentEvidence,
} from "./rag-chunk-source-document-model-provider-current-evidence-reader.js";
import type { AIRAGSourceReadPort } from "./rag-source.js";

export interface AIRAGChunkBoundDocumentAclCurrentEffectEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly ragChunkId: string;
  readonly documentAclPermission: DocumentAclPermission;
  readonly currentTimeIso: string;
}

export interface AIRAGChunkBoundDocumentAclParentOnlyEvidence {
  readonly parent: AIRAGChunkSourceDocumentModelProviderCurrentEvidence;
  readonly documentAcl?: never;
}

export interface AIRAGChunkBoundDocumentAclEffectEvidence {
  readonly parent: AIRAGChunkSourceDocumentModelProviderCurrentEvidence;
  readonly documentAcl: DocumentAccessAclCurrentEffectEvidence;
}

export type AIRAGChunkBoundDocumentAclCurrentEffectEvidence =
  | AIRAGChunkBoundDocumentAclParentOnlyEvidence
  | AIRAGChunkBoundDocumentAclEffectEvidence;

function matchesDocumentAclCandidateContinuity(
  document: DocumentAccessMetadata,
  documentAcl: DocumentAccessAclCurrentEffectEvidence,
): boolean {
  const candidate = documentAcl.parent.candidate;

  return candidate.documentId === document.id
    && candidate.tenantId === document.tenantId
    && candidate.industryContextId === document.industryContextId
    && candidate.scopeClass === document.scopeClass
    && candidate.versionNo === document.versionNo
    && candidate.sensitivityClass === document.sensitivityClass
    && candidate.residencyRegion === document.residencyRegion;
}

/**
 * DD-648…DD-652: extend exact DD-647 lineage with optional bound-Document
 * ACL current-effect evidence only.
 *
 * The supplied Document ACL permission and current instant are already-governed
 * explicit inputs. This function never infers that RAG retrieval means VIEW (or
 * any other Document permission), never treats ACL ALLOW as final retrieval
 * authorization, and never interprets raw RAGSource/RAGChunk ACL fields.
 */
export async function loadAIRAGChunkBoundDocumentAclCurrentEffectEvidence(
  input: AIRAGChunkBoundDocumentAclCurrentEffectEvidenceReadInput,
  chunkReader: AIRAGChunkMetadataReadPort,
  modelReader: AIModelCatalogMetadataReadPort,
  providerReader: AIProviderCatalogMetadataReadPort,
  sourceReader: AIRAGSourceReadPort,
  documentReader: DocumentAccessMetadataPort,
  aclReader: DocumentAclReadPort,
): Promise<AIRAGChunkBoundDocumentAclCurrentEffectEvidence | null> {
  const parent = await loadAIRAGChunkSourceDocumentModelProviderCurrentEvidence(
    {
      requestContext: input.requestContext,
      ragChunkId: input.ragChunkId,
    },
    chunkReader,
    modelReader,
    providerReader,
    sourceReader,
    documentReader,
  );
  if (parent === null) return null;

  const document = parent.document;
  if (document === undefined) {
    return Object.freeze({parent});
  }

  const documentAcl = await loadDocumentAccessAclCurrentEffectEvidence(
    {
      requestContext: input.requestContext,
      documentId: document.id,
      permission: input.documentAclPermission,
      currentTimeIso: input.currentTimeIso,
    },
    documentReader,
    aclReader,
  );

  if (!matchesDocumentAclCandidateContinuity(document, documentAcl)) {
    return null;
  }

  return Object.freeze({
    parent,
    documentAcl,
  });
}
