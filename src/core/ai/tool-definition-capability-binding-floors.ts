import type { AICapabilityCatalogMetadata } from "./capability-catalog-metadata.js";
import type { AIToolDefinitionCatalogMetadata } from "./tool-definition-catalog-metadata.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validToolDefinitionShape(
  toolDefinition: AIToolDefinitionCatalogMetadata,
): boolean {
  return Boolean(
    toolDefinition
    && typeof toolDefinition === "object"
    && validUuid(toolDefinition.id)
    && typeof toolDefinition.capabilityCode === "string",
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
 * Re-evaluates only migration-0013's AIToolDefinition ->
 * AICapability(code) foreign-key relationship.
 *
 * A true result is not capability currentness/eligibility, entitlement/policy
 * satisfaction, ToolDefinition authorization or tool/AI execution authority.
 */
export function matchesAIToolDefinitionCapabilityBindingFloors(
  toolDefinition: AIToolDefinitionCatalogMetadata,
  capability?: AICapabilityCatalogMetadata,
): boolean {
  if (!validToolDefinitionShape(toolDefinition)) return false;
  if (!capability || !validCapabilityShape(capability)) return false;

  return capability.code === toolDefinition.capabilityCode;
}
