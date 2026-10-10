import type {
  AICapabilityCatalogMetadata,
  AICapabilityCatalogMetadataByCodeReadPort,
} from "./capability-catalog-metadata.js";
import {
  matchesAIToolDefinitionCapabilityBindingFloors,
} from "./tool-definition-capability-binding-floors.js";
import type {
  AIToolDefinitionCatalogMetadata,
  AIToolDefinitionCatalogMetadataReadPort,
} from "./tool-definition-catalog-metadata.js";

export interface AIToolDefinitionCapabilityCurrentEvidenceReadInput {
  readonly toolDefinitionId: string;
}

export interface AIToolDefinitionCapabilityCurrentEvidence {
  readonly toolDefinition: AIToolDefinitionCatalogMetadata;
  readonly capability: AICapabilityCatalogMetadata;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * DD-718…DD-722: compose one exact global AIToolDefinition-by-id read with
 * one exact global AICapability(code) metadata read. Only DD-203 direct
 * code-FK binding floors are established.
 *
 * This is read-only relationship evidence. ToolDefinition status/scope/
 * permission/entitlement/OperationContract/approval/idempotency/audit and
 * Capability status/entitlement/policy are not interpreted. No tool or AI
 * execution authority is granted, and separate reads are not an atomic
 * cross-record snapshot.
 */
export async function loadAIToolDefinitionCapabilityCurrentEvidence(
  input: AIToolDefinitionCapabilityCurrentEvidenceReadInput,
  toolDefinitionReader: AIToolDefinitionCatalogMetadataReadPort,
  capabilityReader: AICapabilityCatalogMetadataByCodeReadPort,
): Promise<AIToolDefinitionCapabilityCurrentEvidence | null> {
  const toolDefinition = await toolDefinitionReader.loadById(input.toolDefinitionId);
  if (toolDefinition === null) return null;

  // Validate only the DD-203 child identity before any global capability read.
  // capabilityCode remains exact raw text; even an empty string is not normalized.
  if (!toolDefinition || typeof toolDefinition !== "object"
    || Array.isArray(toolDefinition)
    || !isUuid(toolDefinition.id)
    || typeof toolDefinition.capabilityCode !== "string") return null;

  const capability = await capabilityReader.loadByCode(toolDefinition.capabilityCode);
  if (capability === null) return null;
  if (!matchesAIToolDefinitionCapabilityBindingFloors(toolDefinition, capability)) return null;

  return Object.freeze({ toolDefinition, capability });
}
