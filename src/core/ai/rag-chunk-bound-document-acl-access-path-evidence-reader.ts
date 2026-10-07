import type { RequestContext } from "../context/contracts.js";
import type {
  DocumentAccessMetadataPort,
} from "../document/access-candidate.js";
import {
  classifyDocumentAclAccessPathEvidence,
  type DocumentAccessAclPathEvidence,
} from "../document/acl-access-path-evidence.js";
import type {
  DocumentAclPermission,
  DocumentAclReadPort,
} from "../document/acl.js";
import type { AIModelCatalogMetadataReadPort } from "./model-catalog-metadata.js";
import type { AIProviderCatalogMetadataReadPort } from "./provider-catalog-metadata.js";
import type { AIRAGChunkMetadataReadPort } from "./rag-chunk-metadata.js";
import {
  loadAIRAGChunkBoundDocumentAclCurrentEffectEvidence,
  type AIRAGChunkBoundDocumentAclCurrentEffectEvidence,
} from "./rag-chunk-bound-document-acl-current-effect-evidence-reader.js";
import type { AIRAGSourceReadPort } from "./rag-source.js";

export interface AIRAGChunkBoundDocumentAclAccessPathEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly ragChunkId: string;
  readonly documentAclPermission: DocumentAclPermission;
  readonly currentTimeIso: string;
}

export interface AIRAGChunkBoundDocumentAclAccessPathParentOnlyEvidence {
  readonly parent: AIRAGChunkBoundDocumentAclCurrentEffectEvidence;
  readonly accessPathEvidence?: never;
}

export interface AIRAGChunkBoundDocumentAclAccessPathClassifiedEvidence {
  readonly parent: AIRAGChunkBoundDocumentAclCurrentEffectEvidence;
  readonly accessPathEvidence: DocumentAccessAclPathEvidence;
}

export type AIRAGChunkBoundDocumentAclAccessPathEvidence =
  | AIRAGChunkBoundDocumentAclAccessPathParentOnlyEvidence
  | AIRAGChunkBoundDocumentAclAccessPathClassifiedEvidence;

/**
 * DD-653…DD-657: extend exact DD-652 RAG lineage + optional bound-Document
 * ACL current-effect evidence with only the shared zero-read ACL access-path
 * classification already owned by DD-568…DD-572.
 *
 * Unbound evidence remains parent-only. Bound classification does not map a
 * RAG operation to a Document permission, resolve source-resource
 * authorization or grant retrieval/routing/inference/execution authority.
 */
export async function loadAIRAGChunkBoundDocumentAclAccessPathEvidence(
  input: AIRAGChunkBoundDocumentAclAccessPathEvidenceReadInput,
  chunkReader: AIRAGChunkMetadataReadPort,
  modelReader: AIModelCatalogMetadataReadPort,
  providerReader: AIProviderCatalogMetadataReadPort,
  sourceReader: AIRAGSourceReadPort,
  documentReader: DocumentAccessMetadataPort,
  aclReader: DocumentAclReadPort,
): Promise<AIRAGChunkBoundDocumentAclAccessPathEvidence | null> {
  const parent = await loadAIRAGChunkBoundDocumentAclCurrentEffectEvidence(
    input,
    chunkReader,
    modelReader,
    providerReader,
    sourceReader,
    documentReader,
    aclReader,
  );
  if (parent === null) return null;

  if (parent.documentAcl === undefined) {
    return Object.freeze({parent});
  }

  const accessPathEvidence = classifyDocumentAclAccessPathEvidence(
    parent.documentAcl.effectEvidence,
  );

  return Object.freeze({
    parent,
    accessPathEvidence,
  });
}
