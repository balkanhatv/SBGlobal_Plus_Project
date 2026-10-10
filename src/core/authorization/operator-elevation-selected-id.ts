import type { OperatorElevationMetadata } from "./operator-elevation-metadata.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Mirrors only migration 0029's exact selected OperatorElevation id predicate.
 *
 * The caller owns where the selected id came from and whether it is trusted.
 * This helper performs equality only and is never a selection/access decision.
 */
export function matchesOperatorElevationSelectedIdFloor(
  metadata: OperatorElevationMetadata,
  selectedElevationId: string,
): boolean {
  if (!UUID_PATTERN.test(metadata.id)
    || !UUID_PATTERN.test(selectedElevationId)) {
    return false;
  }
  return metadata.id === selectedElevationId;
}
