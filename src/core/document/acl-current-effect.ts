import type { DocumentAclEntry } from "./acl.js";

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

export interface DocumentAclCurrentEffectEvaluation {
  readonly currentEntries: readonly DocumentAclEntry[];
  readonly expiredEntries: readonly DocumentAclEntry[];
  readonly effectEvidence: DocumentAclCurrentEffectEvidence;
}

function parseInstant(
  value: unknown,
  code: DocumentAccessAclCurrentEffectEvidenceErrorCode,
  field: string,
): number {
  if (typeof value !== "string" || value.length === 0) {
    throw new DocumentAccessAclCurrentEffectEvidenceError(
      code,
      `Document ACL ${field} is invalid.`,
    );
  }

  const instant = Date.parse(value);
  if (!Number.isFinite(instant)) {
    throw new DocumentAccessAclCurrentEffectEvidenceError(
      code,
      `Document ACL ${field} is invalid.`,
    );
  }
  return instant;
}

/**
 * Shared DD-558…DD-561 ACL-layer currentness/effect reducer.
 *
 * Input rows are already subject/permission-matched evidence. The helper
 * interprets only validUntil relative to one explicit trusted current instant
 * and applies explicit-DENY-wins inside that matched ACL layer.
 */
export function evaluateDocumentAclCurrentEffectEvidence(input: {
  readonly matchedEntries: readonly DocumentAclEntry[];
  readonly currentTimeIso: string;
}): DocumentAclCurrentEffectEvaluation {
  const currentInstant = parseInstant(
    input.currentTimeIso,
    "ACL_EFFECT_TIME_INVALID",
    "current time",
  );

  const currentEntries: DocumentAclEntry[] = [];
  const expiredEntries: DocumentAclEntry[] = [];

  for (const entry of input.matchedEntries) {
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
    currentEntries: Object.freeze(currentEntries),
    expiredEntries: Object.freeze(expiredEntries),
    effectEvidence,
  });
}
