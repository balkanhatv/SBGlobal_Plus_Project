import type { OperatorElevationMetadata } from "./operator-elevation-metadata.js";

function timestampMillis(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Mirrors only migration 0029's status/time portion of the ordinary
 * OperatorElevation current-read predicate.
 *
 * This is a necessary floor, never an authorization/access decision.
 */
export function matchesOperatorElevationCurrentTimeStatusFloor(
  metadata: OperatorElevationMetadata,
  evaluatedAt: string,
): boolean {
  if (metadata.status !== "ACTIVE") return false;

  const startsAt = timestampMillis(metadata.startsAt);
  const expiresAt = timestampMillis(metadata.expiresAt);
  const at = timestampMillis(evaluatedAt);

  if (startsAt === null || expiresAt === null || at === null) return false;
  if (expiresAt <= startsAt) return false;

  return startsAt <= at && expiresAt > at;
}
