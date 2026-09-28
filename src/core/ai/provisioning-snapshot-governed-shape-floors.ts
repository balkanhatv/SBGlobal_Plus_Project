import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const API_CLASSES = new Set<string>([
  "INTERNAL_FIRST_PARTY",
  "TENANT_API",
  "PARTNER_API",
  "PUBLIC_DEVELOPER_API",
]);

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDenseStringSet(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => typeof entry === "string")
    && new Set(value).size === value.length;
}

/**
 * Re-evaluates only migration-0031's remaining intrinsic ProvisioningSnapshot
 * governed-shape floor: pack-version JSON object shape, exact API-class set
 * vocabulary and raw Model-class text-set shape.
 *
 * Provider-id and Capability-id set/binding floors remain separately governed
 * by DD-211 and DD-212. A true result is not provisioning or AI execution
 * authority.
 */
export function matchesAIProvisioningSnapshotGovernedShapeFloors(
  snapshot: PersistedAIProvisioningSnapshot,
): boolean {
  if (
    !snapshot
    || typeof snapshot !== "object"
    || !isUuid(snapshot.id)
    || !isUuid(snapshot.tenantId)
    || !isJsonObject(snapshot.msPackVersions)
    || !isJsonObject(snapshot.countryPackVersions)
    || !isDenseStringSet(snapshot.allowedApiClasses)
    || !isDenseStringSet(snapshot.allowedModelClasses)
  ) {
    return false;
  }

  return snapshot.allowedApiClasses.every((apiClass) => API_CLASSES.has(apiClass));
}
