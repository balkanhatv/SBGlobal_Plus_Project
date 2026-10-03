import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0031's Tenant-Core ProvisioningSnapshot scope
 * shape: an absent Industry Context cannot carry an Industry activation
 * version.
 *
 * A true result for an Industry-scoped snapshot does not prove that its
 * Industry Context exists/is ACTIVE or that its activation version matches.
 */
export function matchesAIProvisioningSnapshotTenantCoreIndustryVersionFloor(
  snapshot: PersistedAIProvisioningSnapshot,
): boolean {
  if (
    !snapshot
    || typeof snapshot !== "object"
    || !isUuid(snapshot.id)
    || !isUuid(snapshot.tenantId)
  ) {
    return false;
  }

  if (snapshot.industryContextId === undefined) {
    return snapshot.industryActivationVersion === undefined;
  }

  return isUuid(snapshot.industryContextId);
}
