import type {
  DocumentAclEntry,
  DocumentAclPermission,
  DocumentAclReadPort,
} from "./acl.js";
import {
  DocumentAclSubjectMatcher,
} from "./acl-subject-match.js";
import {
  loadDocumentAccessAclSubjectEvidence,
  type DocumentAccessAclSubjectEvidence,
} from "./access-acl-subject-evidence-reader.js";
import type { DocumentAccessMetadataPort } from "./access-candidate.js";
import type { RequestContext } from "../context/contracts.js";

export type DocumentAclCurrentEffectEvidence =
  | "DENY"
  | "ALLOW"
  | "NONE";

export type DocumentAccessAclCurrentEffectEvidenceErrorCode =
  | "ACL_EFFECT_TIME_INVALID"
  | "ACL_EFFECT_EVIDENCE_INVALID";

export class DocumentAccessAclCurrentEffectEvidenceError extends Error {
  constructor(
    readonly code: DocumentAccessAclCurrentEffectEvidenceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DocumentAccessAclCurrentEffectEvidenceError";
  }
}

export interface DocumentAccessAclCurrentEffectEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly documentId: string;
  readonly permission: DocumentAclPermission;
  readonly currentTimeIso: string;
}

export interface DocumentAccessAclCurrentEffectEvidence {
  readonly parent: DocumentAccessAclSubjectEvidence;
  readonly currentTimeIso: string;
  readonly currentEntries: readonly DocumentAclEntry[];
  readonly expiredEntries: readonly DocumentAclEntry[];
  readonly effectEvidence: DocumentAclCurrentEffectEvidence;
}

function parseInstant(value: unknown, code: DocumentAccessAclCurrentEffectEvidenceErrorCode, field: string): number {
  if (typeof value !== "string" || value.length === 0) {
    throw new DocumentAccessAclCurrentEffectEvidenceError(code, `Document ACL ${field} is invalid.`);
  }

  const instant = Date.parse(value);
  if (!Number.isFinite(instant)) {
    throw new DocumentAccessAclCurrentEffectEvidenceError(code, `Document ACL ${field} is invalid.`);
  }
  return instant;
}

/**
 * DD-558…DD-562: extend exact DD-542 matched-subject ACL evidence with only
 * validUntil currentness and DD-08 explicit-DENY-wins effect evidence.
 *
 * This remains an ACL-layer evidence result only. It does not choose
 * source-resource fallback or establish final authorization, signing, grant,
 * download/share/delete or mutation authority.
 */
export async function loadDocumentAccessAclCurrentEffectEvidence(
  input: DocumentAccessAclCurrentEffectEvidenceReadInput,
  metadataReader: DocumentAccessMetadataPort,
  aclReader: DocumentAclReadPort,
  matcher: DocumentAclSubjectMatcher = new DocumentAclSubjectMatcher(),
): Promise<DocumentAccessAclCurrentEffectEvidence> {
  const parent = await loadDocumentAccessAclSubjectEvidence(
    {
      requestContext: input.requestContext,
      documentId: input.documentId,
      permission: input.permission,
    },
    metadataReader,
    aclReader,
    matcher,
  );

  const currentInstant = parseInstant(
    input.currentTimeIso,
    "ACL_EFFECT_TIME_INVALID",
    "current time",
  );

  const currentEntries: DocumentAclEntry[] = [];
  const expiredEntries: DocumentAclEntry[] = [];

  for (const entry of parent.matchedEntries) {
    if (entry.validUntil === undefined) {
      currentEntries.push(entry);
      continue;
    }

    const validUntilInstant = parseInstant(
      entry.validUntil,
      "ACL_EFFECT_EVIDENCE_INVALID",
      "validUntil evidence",
    );

    if (validUntilInstant > currentInstant) {
      currentEntries.push(entry);
    } else {
      expiredEntries.push(entry);
    }
  }

  let effectEvidence: DocumentAclCurrentEffectEvidence = "NONE";
  if (currentEntries.some((entry) => entry.effect === "DENY")) {
    effectEvidence = "DENY";
  } else if (currentEntries.some((entry) => entry.effect === "ALLOW")) {
    effectEvidence = "ALLOW";
  }

  return Object.freeze({
    parent,
    currentTimeIso: input.currentTimeIso,
    currentEntries: Object.freeze(currentEntries),
    expiredEntries: Object.freeze(expiredEntries),
    effectEvidence,
  });
}
