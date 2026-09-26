import type { AICapabilityCatalogMetadata } from "./capability-catalog-metadata.js";
import type { PersistedAITokenUsage } from "./token-usage.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validOptionalUuid(value: unknown): value is string | undefined {
  return value === undefined || validUuid(value);
}

function validUsageShape(usage: PersistedAITokenUsage): boolean {
  return Boolean(
    usage
    && typeof usage === "object"
    && validUuid(usage.id)
    && validUuid(usage.tenantId)
    && validOptionalUuid(usage.industryContextId)
    && typeof usage.capabilityCode === "string",
  );
}

function validCapabilityShape(
  capability: AICapabilityCatalogMetadata,
): boolean {
  return Boolean(
    capability
    && typeof capability === "object"
    && validUuid(capability.id)
    && typeof capability.code === "string",
  );
}

/**
 * Re-evaluates only migration-0012's TokenUsage ->
 * AICapability(code) foreign-key relationship.
 *
 * A true result is not capability currentness/eligibility, entitlement,
 * routing, billing, principal authorization or AI execution authority.
 */
export function matchesAITokenUsageCapabilityBindingFloors(
  usage: PersistedAITokenUsage,
  capability?: AICapabilityCatalogMetadata,
): boolean {
  if (!validUsageShape(usage)) return false;
  if (!capability || !validCapabilityShape(capability)) return false;

  return capability.code === usage.capabilityCode;
}
