import type { VerifiedIdentityEvidence } from "../identity/contracts.js";
import type { OperatorElevationMetadata } from "./operator-elevation-metadata.js";
import {
  matchesOperatorElevationCurrentTimeStatusFloor,
} from "./operator-elevation-window.js";
import {
  matchesOperatorElevationSubjectTargetFloor,
  type OperatorElevationSubjectTargetInput,
} from "./operator-elevation-subject-target.js";
import {
  matchesOperatorElevationVerifiedPlatformOperatorFloor,
} from "./operator-elevation-verified-operator.js";
import {
  matchesOperatorElevationSelectedIdFloor,
} from "./operator-elevation-selected-id.js";

export interface OperatorElevationCoreNecessaryFloorsInput {
  readonly selectedElevationId: string;
  readonly verifiedIdentity: VerifiedIdentityEvidence;
  readonly subjectTarget: OperatorElevationSubjectTargetInput;
  readonly evaluatedAt: string;
}

/**
 * Composes DD-148..151 necessary floors only.
 *
 * True is not an authorization decision. Selection trust, permission/profile,
 * approval/purpose, step-up, RequestContext/SQL injection and audit remain
 * separately governed.
 */
export function matchesOperatorElevationCoreNecessaryFloors(
  metadata: OperatorElevationMetadata,
  input: OperatorElevationCoreNecessaryFloorsInput,
): boolean {
  return matchesOperatorElevationSelectedIdFloor(
    metadata,
    input.selectedElevationId,
  )
    && matchesOperatorElevationVerifiedPlatformOperatorFloor(
      metadata,
      input.verifiedIdentity,
    )
    && matchesOperatorElevationSubjectTargetFloor(
      metadata,
      input.subjectTarget,
    )
    && matchesOperatorElevationCurrentTimeStatusFloor(
      metadata,
      input.evaluatedAt,
    );
}
