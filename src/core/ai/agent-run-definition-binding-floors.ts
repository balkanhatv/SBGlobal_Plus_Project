import type { PersistedAIAgentDefinition } from "./agent-definition.js";
import type { PersistedAIAgentRun } from "./agent-run.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function hasValidDefinitionOwnerShape(
  definition: PersistedAIAgentDefinition,
): boolean {
  if (definition.ownerScope === "PLATFORM") {
    return definition.tenantId === undefined
      && definition.industryContextId === undefined;
  }

  if (definition.ownerScope === "TENANT") {
    return isUuid(definition.tenantId)
      && definition.industryContextId === undefined;
  }

  if (definition.ownerScope === "INDUSTRY") {
    return isUuid(definition.tenantId)
      && isUuid(definition.industryContextId);
  }

  return false;
}

/**
 * Re-evaluates only migration-0031 + migration-0048's AgentRun ->
 * AgentDefinition exact id / ACTIVE / scope-applicability relationship.
 *
 * A true result is not acting-principal or membership authorization, run
 * resumability, budget/resource authorization, AgentStep or tool execution
 * authority.
 */
export function matchesAIAgentRunDefinitionBindingFloors(
  run: PersistedAIAgentRun,
  definition: PersistedAIAgentDefinition,
): boolean {
  if (
    !isUuid(run.id)
    || !isUuid(run.tenantId)
    || !isUuid(run.agentDefinitionId)
    || (run.industryContextId !== undefined && !isUuid(run.industryContextId))
    || !isUuid(definition.id)
    || !hasValidDefinitionOwnerShape(definition)
    || definition.id !== run.agentDefinitionId
    || definition.status !== "ACTIVE"
  ) {
    return false;
  }

  if (definition.ownerScope === "PLATFORM") return true;

  if (definition.ownerScope === "TENANT") {
    return definition.tenantId === run.tenantId;
  }

  return definition.tenantId === run.tenantId
    && run.industryContextId !== undefined
    && definition.industryContextId === run.industryContextId;
}
