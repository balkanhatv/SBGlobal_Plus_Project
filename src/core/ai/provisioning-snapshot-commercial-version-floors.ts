import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";
import type { CommercialProvisioningVersionEvidence } from "../commercial/provisioning-version-evidence.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CANONICAL_INTEGER_TEXT = /^(?:0|[1-9][0-9]*|-[1-9][0-9]*)$/;
const PG_BIGINT_MIN = -9223372036854775808n;
const PG_BIGINT_MAX = 9223372036854775807n;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isPgBigintText(value: unknown): value is string {
  if (typeof value !== "string" || !CANONICAL_INTEGER_TEXT.test(value)) {
    return false;
  }
  try {
    const parsed = BigInt(value);
    return parsed >= PG_BIGINT_MIN && parsed <= PG_BIGINT_MAX;
  } catch {
    return false;
  }
}

function isPositivePgBigintText(value: unknown): value is string {
  return isPgBigintText(value) && BigInt(value) > 0n;
}

function hasValidSnapshotShape(snapshot: PersistedAIProvisioningSnapshot): boolean {
  return Boolean(
    snapshot
    && typeof snapshot === "object"
    && isUuid(snapshot.id)
    && isUuid(snapshot.tenantId)
    && isPgBigintText(snapshot.subscriptionVersion)
    && isPositivePgBigintText(snapshot.entitlementSnapshotVersion),
  );
}

function hasValidEvidenceShape(
  evidence: CommercialProvisioningVersionEvidence,
): boolean {
  return Boolean(
    evidence
    && typeof evidence === "object"
    && isUuid(evidence.tenantId)
    && isUuid(evidence.currentSubscriptionId)
    && isPgBigintText(evidence.subscriptionVersion)
    && isUuid(evidence.entitlementSnapshotId)
    && isPositivePgBigintText(evidence.entitlementSnapshotVersion),
  );
}

/**
 * Re-evaluates only migration-0031's ProvisioningSnapshot commercial-version
 * equality against supplied DD-216 raw same-Tenant evidence.
 *
 * A true result is not valid-time currentness, source-linkage validation,
 * commercial authorization, entitlement sufficiency, effective provisioning,
 * routing, or AI execution authority.
 */
export function matchesAIProvisioningSnapshotCommercialVersionFloors(
  snapshot: PersistedAIProvisioningSnapshot,
  evidence: CommercialProvisioningVersionEvidence,
): boolean {
  if (!hasValidSnapshotShape(snapshot) || !hasValidEvidenceShape(evidence)) {
    return false;
  }
  if (snapshot.tenantId !== evidence.tenantId) return false;

  return snapshot.subscriptionVersion === evidence.subscriptionVersion
    && snapshot.entitlementSnapshotVersion === evidence.entitlementSnapshotVersion;
}
