import type { OperatorElevationMetadata } from "./operator-elevation-metadata.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface OperatorElevationSubjectTargetInput {
  readonly operatorPrincipalId: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
}

/**
 * Mirrors only migration 0029's operator/Tenant/optional-Industry portion of
 * the OperatorElevation current-read predicate.
 *
 * This is a necessary binding floor, never an authorization/access decision.
 */
export function matchesOperatorElevationSubjectTargetFloor(
  metadata: OperatorElevationMetadata,
  input: OperatorElevationSubjectTargetInput,
): boolean {
  if (!UUID_PATTERN.test(metadata.operatorPrincipalId)
    || !UUID_PATTERN.test(metadata.tenantId)
    || !UUID_PATTERN.test(input.operatorPrincipalId)
    || !UUID_PATTERN.test(input.tenantId)) {
    return false;
  }

  if (metadata.industryContextId !== undefined
    && !UUID_PATTERN.test(metadata.industryContextId)) {
    return false;
  }
  if (input.industryContextId !== undefined
    && !UUID_PATTERN.test(input.industryContextId)) {
    return false;
  }

  if (metadata.operatorPrincipalId !== input.operatorPrincipalId
    || metadata.tenantId !== input.tenantId) {
    return false;
  }

  return metadata.industryContextId === undefined
    || metadata.industryContextId === input.industryContextId;
}
