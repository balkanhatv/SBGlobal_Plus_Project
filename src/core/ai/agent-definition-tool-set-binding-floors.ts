import type { PersistedAIAgentDefinition } from "./agent-definition.js";
import type { PersistedAIToolSet } from "./tool-set.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

type OwnerScope = "PLATFORM" | "TENANT" | "INDUSTRY";

interface OwnerEvidence {
  readonly ownerScope: OwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
}

function hasValidOwnerShape(value: OwnerEvidence): boolean {
  if (value.ownerScope === "PLATFORM") {
    return value.tenantId === undefined && value.industryContextId === undefined;
  }

  if (value.ownerScope === "TENANT") {
    return isUuid(value.tenantId) && value.industryContextId === undefined;
  }

  if (value.ownerScope === "INDUSTRY") {
    return isUuid(value.tenantId) && isUuid(value.industryContextId);
  }

  return false;
}

function definitionContainsDefinition(
  parent: OwnerEvidence,
  child: OwnerEvidence,
): boolean {
  if (!hasValidOwnerShape(parent) || !hasValidOwnerShape(child)) return false;

  if (child.ownerScope === "PLATFORM") {
    return parent.ownerScope === "PLATFORM";
  }

  if (child.ownerScope === "TENANT") {
    if (parent.ownerScope === "PLATFORM") return true;
    return parent.ownerScope === "TENANT"
      && parent.tenantId === child.tenantId;
  }

  if (parent.ownerScope === "PLATFORM") return true;

  if (parent.ownerScope === "TENANT") {
    return parent.tenantId === child.tenantId;
  }

  return parent.ownerScope === "INDUSTRY"
    && parent.tenantId === child.tenantId
    && parent.industryContextId === child.industryContextId;
}

/**
 * Re-evaluates only migration-0031 + migration-0048's AgentDefinition ->
 * allowed ToolSet exact id / ACTIVE / broader-or-equal containment relationship.
 *
 * A true result is not Agent selection, policy authorization, effective ToolSet
 * resolution, tool eligibility or Agent/tool execution authority.
 */
export function matchesAIAgentDefinitionToolSetBindingFloors(
  agent: PersistedAIAgentDefinition,
  toolSet: PersistedAIToolSet,
): boolean {
  if (
    !isUuid(agent.id)
    || !hasValidOwnerShape(agent)
    || !isUuid(agent.allowedToolSetId)
    || !isUuid(toolSet.id)
    || !hasValidOwnerShape(toolSet)
    || toolSet.id !== agent.allowedToolSetId
    || toolSet.status !== "ACTIVE"
  ) {
    return false;
  }

  return definitionContainsDefinition(toolSet, agent);
}
