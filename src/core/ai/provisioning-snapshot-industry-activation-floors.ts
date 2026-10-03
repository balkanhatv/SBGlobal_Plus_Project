import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";
import type {
  IndustryContextActivationStatus,
  PersistedIndustryContextActivationEvidence,
} from "../tenancy/industry-context-activation.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BIGINT_TEXT_PATTERN = /^(?:0|[1-9][0-9]*|-[1-9][0-9]*)$/;
const INDUSTRY_CONTEXT_STATUSES = new Set<IndustryContextActivationStatus>([
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "DISABLED",
]);

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isCanonicalBigintText(value: unknown): value is string {
  return typeof value === "string" && BIGINT_TEXT_PATTERN.test(value);
}

function hasValidSnapshotShape(
  snapshot: PersistedAIProvisioningSnapshot,
): boolean {
  return Boolean(
    snapshot
    && typeof snapshot === "object"
    && isUuid(snapshot.id)
    && isUuid(snapshot.tenantId)
    && isUuid(snapshot.industryContextId)
    && isCanonicalBigintText(snapshot.industryActivationVersion),
  );
}

function hasValidActivationShape(
  activation: PersistedIndustryContextActivationEvidence,
): boolean {
  return Boolean(
    activation
    && typeof activation === "object"
    && isUuid(activation.id)
    && isUuid(activation.tenantId)
    && typeof activation.status === "string"
    && INDUSTRY_CONTEXT_STATUSES.has(
      activation.status as IndustryContextActivationStatus,
    )
    && isCanonicalBigintText(activation.activationVersion),
  );
}

/**
 * Re-evaluates only migration-0031's Industry-scoped ProvisioningSnapshot
 * same-Tenant/same-Industry/raw-ACTIVE/exact activation-version relationship
 * against already-supplied exact IndustryContext activation evidence.
 *
 * A true result is not current/primary Industry selection, operation
 * authorization, effective provisioning, routing, or AI execution authority.
 */
export function matchesAIProvisioningSnapshotIndustryActivationFloors(
  snapshot: PersistedAIProvisioningSnapshot,
  activation: PersistedIndustryContextActivationEvidence,
): boolean {
  if (
    !hasValidSnapshotShape(snapshot)
    || !hasValidActivationShape(activation)
  ) {
    return false;
  }

  if (activation.tenantId !== snapshot.tenantId) return false;
  if (activation.id !== snapshot.industryContextId) return false;
  if (activation.status !== "ACTIVE") return false;

  return activation.activationVersion === snapshot.industryActivationVersion;
}
