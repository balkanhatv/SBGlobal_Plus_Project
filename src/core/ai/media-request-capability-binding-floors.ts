import type { AICapabilityCatalogMetadata } from "./capability-catalog-metadata.js";
import type { PersistedAIMediaRequest } from "./media-request.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validOptionalUuid(value: unknown): value is string | undefined {
  return value === undefined || validUuid(value);
}

function validRequestShape(request: PersistedAIMediaRequest): boolean {
  return Boolean(
    request
    && typeof request === "object"
    && validUuid(request.id)
    && validUuid(request.tenantId)
    && validOptionalUuid(request.industryContextId)
    && typeof request.capabilityCode === "string",
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
 * Re-evaluates only migration-0011's AIMediaRequest ->
 * AICapability(code) foreign-key relationship.
 *
 * A true result is not capability currentness/eligibility, entitlement,
 * policy satisfaction, routing, moderation or AI execution authority.
 */
export function matchesAIMediaRequestCapabilityBindingFloors(
  request: PersistedAIMediaRequest,
  capability?: AICapabilityCatalogMetadata,
): boolean {
  if (!validRequestShape(request)) return false;
  if (!capability || !validCapabilityShape(capability)) return false;

  return capability.code === request.capabilityCode;
}
