import type { OperatorElevationMetadata } from "./operator-elevation-metadata.js";
import type { VerifiedIdentityEvidence } from "../identity/contracts.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Mirrors only the verified interactive PLATFORM_OPERATOR identity prerequisite
 * for OperatorElevation.
 *
 * IdentityPort owns the verified human-session evidence. This helper merely
 * binds that evidence to the persisted elevation operator principal. It is
 * never an elevation-selection, step-up, target, permission, or access decision.
 */
export function matchesOperatorElevationVerifiedPlatformOperatorFloor(
  metadata: OperatorElevationMetadata,
  evidence: VerifiedIdentityEvidence,
): boolean {
  if (evidence.principalType !== "PLATFORM_OPERATOR") return false;
  if (!UUID_PATTERN.test(metadata.operatorPrincipalId)
    || !UUID_PATTERN.test(evidence.principalId)) {
    return false;
  }
  return metadata.operatorPrincipalId === evidence.principalId;
}
