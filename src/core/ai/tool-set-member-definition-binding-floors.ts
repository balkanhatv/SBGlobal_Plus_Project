import type { AIToolDefinitionCatalogMetadata } from "./tool-definition-catalog-metadata.js";
import type { PersistedAIToolSetMember } from "./tool-set-member.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0031's AIToolSetMember ->
 * AIToolDefinition exact referenced id / ACTIVE relationship.
 *
 * A true result is not effective ToolSet membership, tool eligibility,
 * permission/entitlement/approval satisfaction or OperationContract execution
 * authority.
 */
export function matchesAIToolSetMemberDefinitionBindingFloors(
  member: PersistedAIToolSetMember,
  definition: AIToolDefinitionCatalogMetadata,
): boolean {
  if (
    !isUuid(member.id)
    || !isUuid(member.toolSetId)
    || !isUuid(member.toolDefinitionId)
    || !isUuid(definition.id)
  ) {
    return false;
  }

  return definition.id === member.toolDefinitionId
    && definition.status === "ACTIVE";
}
