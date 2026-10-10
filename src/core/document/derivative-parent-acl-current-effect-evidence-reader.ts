import type { RequestContext } from "../context/contracts.js";
import type {
  DocumentAclEntry,
  DocumentAclPermission,
  DocumentAclReadPort,
} from "./acl.js";
import {
  DocumentAclSubjectMatcher,
} from "./acl-subject-match.js";
import {
  evaluateDocumentAclCurrentEffectEvidence,
  type DocumentAclCurrentEffectEvidence,
} from "./acl-current-effect.js";
import {
  loadDocumentDerivativeParentRawAclEvidence,
  type DocumentDerivativeParentRawAclEvidence,
} from "./derivative-parent-raw-acl-evidence-reader.js";
import type {
  DocumentDerivativeParentCurrentEvidenceReadPort,
} from "./derivative-parent-current-evidence-reader.js";

export interface DocumentDerivativeParentAclCurrentEffectEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly derivativeDocumentId: string;
  readonly parentDocumentId: string;
  readonly permission: DocumentAclPermission;
  readonly currentTimeIso: string;
}

export interface DocumentDerivativeParentAclSideCurrentEffectEvidence {
  readonly matchedEntries: readonly DocumentAclEntry[];
  readonly currentEntries: readonly DocumentAclEntry[];
  readonly expiredEntries: readonly DocumentAclEntry[];
  readonly effectEvidence: DocumentAclCurrentEffectEvidence;
}

export interface DocumentDerivativeParentAclCurrentEffectEvidence {
  readonly parent: DocumentDerivativeParentRawAclEvidence;
  readonly permission: DocumentAclPermission;
  readonly currentTimeIso: string;
  readonly derivativeEvidence: DocumentDerivativeParentAclSideCurrentEffectEvidence;
  readonly parentEvidence: DocumentDerivativeParentAclSideCurrentEffectEvidence;
}

function freezeSide(input: {
  readonly matchedEntries: readonly DocumentAclEntry[];
  readonly currentEntries: readonly DocumentAclEntry[];
  readonly expiredEntries: readonly DocumentAclEntry[];
  readonly effectEvidence: DocumentAclCurrentEffectEvidence;
}): DocumentDerivativeParentAclSideCurrentEffectEvidence {
  return Object.freeze({
    matchedEntries: input.matchedEntries,
    currentEntries: input.currentEntries,
    expiredEntries: input.expiredEntries,
    effectEvidence: input.effectEvidence,
  });
}

/**
 * DD-588…DD-592: extend exact DD-587 paired raw ACL evidence with the existing
 * DD-085 subject-match and DD-558…DD-561 current-effect semantics applied
 * independently to derivative and parent for one identical explicit permission,
 * RequestContext and trusted current instant.
 *
 * The two sides are not compared. No ACL non-widening or final authorization
 * decision is created.
 */
export async function loadDocumentDerivativeParentAclCurrentEffectEvidence(
  input: DocumentDerivativeParentAclCurrentEffectEvidenceReadInput,
  relationshipReader: DocumentDerivativeParentCurrentEvidenceReadPort,
  aclReader: DocumentAclReadPort,
  matcher: DocumentAclSubjectMatcher = new DocumentAclSubjectMatcher(),
): Promise<DocumentDerivativeParentAclCurrentEffectEvidence | null> {
  const parent = await loadDocumentDerivativeParentRawAclEvidence(
    {
      requestContext: input.requestContext,
      derivativeDocumentId: input.derivativeDocumentId,
      parentDocumentId: input.parentDocumentId,
    },
    relationshipReader,
    aclReader,
  );
  if (parent === null) return null;

  const derivativeDocumentId = parent.parent.relationship.derivative.id;
  const parentDocumentId = parent.parent.relationship.parent.id;

  const derivativeMatchedEntries = matcher.match({
    requestContext: input.requestContext,
    documentId: derivativeDocumentId,
    permission: input.permission,
    entries: parent.derivativeAclEntries,
  });

  const parentMatchedEntries = matcher.match({
    requestContext: input.requestContext,
    documentId: parentDocumentId,
    permission: input.permission,
    entries: parent.parentAclEntries,
  });

  const derivativeEffect = evaluateDocumentAclCurrentEffectEvidence({
    matchedEntries: derivativeMatchedEntries,
    currentTimeIso: input.currentTimeIso,
  });
  const parentEffect = evaluateDocumentAclCurrentEffectEvidence({
    matchedEntries: parentMatchedEntries,
    currentTimeIso: input.currentTimeIso,
  });

  return Object.freeze({
    parent,
    permission: input.permission,
    currentTimeIso: input.currentTimeIso,
    derivativeEvidence: freezeSide({
      matchedEntries: derivativeMatchedEntries,
      ...derivativeEffect,
    }),
    parentEvidence: freezeSide({
      matchedEntries: parentMatchedEntries,
      ...parentEffect,
    }),
  });
}
