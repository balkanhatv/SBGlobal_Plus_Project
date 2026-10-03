import { parseStrictInstant } from "../time/strict-instant.js";
import type { OperatorElevationMetadata } from "./operator-elevation-metadata.js";

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

  const startsAt = parseStrictInstant(metadata.startsAt);
  const expiresAt = parseStrictInstant(metadata.expiresAt);
  const at = parseStrictInstant(evaluatedAt);

  if (startsAt === null || expiresAt === null || at === null) return false;
  if (expiresAt <= startsAt) return false;

  return startsAt <= at && expiresAt > at;
}
