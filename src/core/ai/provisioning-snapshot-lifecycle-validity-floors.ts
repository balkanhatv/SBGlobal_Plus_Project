import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POSITIVE_INTEGER_TEXT = /^[1-9][0-9]*$/;
const STATUSES = new Set<string>(["ACTIVE", "SUPERSEDED", "REVOKED"]);

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function instantMillis(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const millis = Date.parse(value);
  return Number.isFinite(millis) ? millis : null;
}

/**
 * Re-evaluates only migration-0011's intrinsic ProvisioningSnapshot lifecycle
 * and persisted validity-ordering floor.
 *
 * A true result does not mean the snapshot is current, presently unexpired or
 * authorized for execution.
 */
export function matchesAIProvisioningSnapshotLifecycleValidityFloors(
  snapshot: PersistedAIProvisioningSnapshot,
): boolean {
  if (
    !snapshot
    || typeof snapshot !== "object"
    || !isUuid(snapshot.id)
    || !isUuid(snapshot.tenantId)
    || typeof snapshot.version !== "string"
    || !POSITIVE_INTEGER_TEXT.test(snapshot.version)
    || typeof snapshot.status !== "string"
    || !STATUSES.has(snapshot.status)
  ) {
    return false;
  }

  const compiledAt = instantMillis(snapshot.compiledAt);
  if (compiledAt === null) return false;

  if (snapshot.validUntil === undefined) return true;

  const validUntil = instantMillis(snapshot.validUntil);
  return validUntil !== null && validUntil > compiledAt;
}
