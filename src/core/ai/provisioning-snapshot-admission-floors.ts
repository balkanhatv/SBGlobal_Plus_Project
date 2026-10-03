import type { AICapabilityCatalogMetadata } from "./capability-catalog-metadata.js";
import type { AIProviderCatalogMetadata } from "./provider-catalog-metadata.js";
import type {
  AIProvisioningApiAccessClass,
  PersistedAIProvisioningSnapshot,
} from "./provisioning-snapshot.js";
import { matchesAIProvisioningSnapshotLifecycleValidityFloors } from "./provisioning-snapshot-lifecycle-validity-floors.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const API_CLASSES = new Set<AIProvisioningApiAccessClass>([
  "INTERNAL_FIRST_PARTY",
  "TENANT_API",
  "PARTNER_API",
  "PUBLIC_DEVELOPER_API",
]);

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isApiClass(value: unknown): value is AIProvisioningApiAccessClass {
  return typeof value === "string"
    && API_CLASSES.has(value as AIProvisioningApiAccessClass);
}

function hasSnapshotIdentity(snapshot: PersistedAIProvisioningSnapshot): boolean {
  return Boolean(
    snapshot
    && typeof snapshot === "object"
    && isUuid(snapshot.id)
    && isUuid(snapshot.tenantId),
  );
}

function isDenseUuidSet(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => isUuid(entry))
    && new Set(value).size === value.length;
}

function isDenseStringSet(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => typeof entry === "string")
    && new Set(value).size === value.length;
}

function instantMillis(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const millis = Date.parse(value);
  return Number.isFinite(millis) ? millis : null;
}

/**
 * DD-220: re-evaluates only the snapshot's current lifecycle prerequisite at
 * an explicitly supplied evaluation instant.
 *
 * A true result is not current/latest snapshot selection and is not AI
 * execution authorization.
 */
export function matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor(
  snapshot: PersistedAIProvisioningSnapshot,
  evaluatedAt: unknown,
): boolean {
  if (!matchesAIProvisioningSnapshotLifecycleValidityFloors(snapshot)) {
    return false;
  }

  const evaluationMillis = instantMillis(evaluatedAt);
  const compiledMillis = instantMillis(snapshot.compiledAt);
  if (
    evaluationMillis === null
    || compiledMillis === null
    || snapshot.status !== "ACTIVE"
    || compiledMillis > evaluationMillis
  ) {
    return false;
  }

  if (snapshot.validUntil === undefined) return true;
  const validUntilMillis = instantMillis(snapshot.validUntil);
  return validUntilMillis !== null && evaluationMillis < validUntilMillis;
}

/**
 * DD-221: exact API-access-class membership necessary floor only.
 */
export function matchesAIProvisioningSnapshotApiClassAdmissionFloor(
  snapshot: PersistedAIProvisioningSnapshot,
  apiClass: unknown,
): boolean {
  if (
    !hasSnapshotIdentity(snapshot)
    || !isDenseStringSet(snapshot.allowedApiClasses)
    || !snapshot.allowedApiClasses.every((value) => isApiClass(value))
    || !isApiClass(apiClass)
  ) {
    return false;
  }

  return snapshot.allowedApiClasses.includes(apiClass);
}

/**
 * DD-222: exact ACTIVE capability-id membership necessary floor only.
 */
export function matchesAIProvisioningSnapshotCapabilityAdmissionFloor(
  snapshot: PersistedAIProvisioningSnapshot,
  capability: AICapabilityCatalogMetadata,
): boolean {
  if (
    !hasSnapshotIdentity(snapshot)
    || !isDenseUuidSet(snapshot.allowedCapabilityIds)
    || !capability
    || typeof capability !== "object"
    || !isUuid(capability.id)
    || typeof capability.code !== "string"
    || capability.code.length === 0
    || capability.status !== "ACTIVE"
  ) {
    return false;
  }

  return snapshot.allowedCapabilityIds.includes(capability.id);
}

/**
 * DD-223: exact ACTIVE provider-id membership necessary floor only.
 *
 * Provider health, region, capability support, credentials, model compatibility
 * and fallback remain routing concerns outside this helper.
 */
export function matchesAIProvisioningSnapshotProviderAdmissionFloor(
  snapshot: PersistedAIProvisioningSnapshot,
  provider: AIProviderCatalogMetadata,
): boolean {
  if (
    !hasSnapshotIdentity(snapshot)
    || !isDenseUuidSet(snapshot.allowedProviderIds)
    || !provider
    || typeof provider !== "object"
    || !isUuid(provider.id)
    || provider.status !== "ACTIVE"
  ) {
    return false;
  }

  return snapshot.allowedProviderIds.includes(provider.id);
}

/**
 * DD-224: exact persisted model-class membership necessary floor only.
 *
 * This intentionally does not invent a closed model-class vocabulary or select
 * a concrete model.
 */
export function matchesAIProvisioningSnapshotModelClassAdmissionFloor(
  snapshot: PersistedAIProvisioningSnapshot,
  modelClass: unknown,
): boolean {
  if (
    !hasSnapshotIdentity(snapshot)
    || !isDenseStringSet(snapshot.allowedModelClasses)
    || typeof modelClass !== "string"
    || modelClass.length === 0
  ) {
    return false;
  }

  return snapshot.allowedModelClasses.includes(modelClass);
}
