import type { DocumentAclCurrentEffectEvidence } from "./acl-current-effect.js";

export type DocumentAccessAclPathEvidence =
  | "EXPLICIT_ACL_DENY"
  | "EXPLICIT_ACL_ALLOW"
  | "SOURCE_RESOURCE_AUTHORIZATION_REQUIRED";

/**
 * DD-655 shared pure ACL-layer path classifier.
 *
 * The input is already-canonical DD-562 current-effect evidence. This helper
 * performs no reads and creates no final authorization, signing, storage or
 * source-resource authority.
 */
export function classifyDocumentAclAccessPathEvidence(
  effectEvidence: DocumentAclCurrentEffectEvidence,
): DocumentAccessAclPathEvidence {
  switch (effectEvidence) {
    case "DENY":
      return "EXPLICIT_ACL_DENY";
    case "ALLOW":
      return "EXPLICIT_ACL_ALLOW";
    case "NONE":
      return "SOURCE_RESOURCE_AUTHORIZATION_REQUIRED";
  }
}
