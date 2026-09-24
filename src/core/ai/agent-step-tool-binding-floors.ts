import type { PersistedAIAgentDefinition } from "./agent-definition.js";
import type { PersistedAIAgentRun } from "./agent-run.js";
import type { PersistedAIAgentStep } from "./agent-step.js";
import type { AIToolDefinitionCatalogMetadata } from "./tool-definition-catalog-metadata.js";
import type { PersistedAIToolSetMember } from "./tool-set-member.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

const NON_TOOL_STEP_TYPES = new Set([
  "PLAN",
  "RAG",
  "APPROVAL",
  "INFERENCE",
]);

/**
 * Re-evaluates only migration-0031's persisted AgentStep TOOL/non-TOOL
 * binding relationship.
 *
 * A true result is not AgentDefinition/ToolSet currentness, acting-principal
 * authorization, approval satisfaction, tool eligibility or tool execution
 * authority.
 */
export function matchesAIAgentStepToolBindingFloors(
  step: PersistedAIAgentStep,
  run: PersistedAIAgentRun,
  definition: PersistedAIAgentDefinition,
  member?: PersistedAIToolSetMember,
  toolDefinition?: AIToolDefinitionCatalogMetadata,
): boolean {
  if (
    !isUuid(step.id)
    || !isUuid(step.runId)
    || !isUuid(run.id)
    || !isUuid(run.agentDefinitionId)
    || !isUuid(definition.id)
    || run.id !== step.runId
    || definition.id !== run.agentDefinitionId
  ) {
    return false;
  }

  if (step.stepType !== "TOOL") {
    if (!NON_TOOL_STEP_TYPES.has(step.stepType)) return false;

    return step.toolBindingId === undefined
      && member === undefined
      && toolDefinition === undefined;
  }

  if (
    !isUuid(step.toolBindingId)
    || member === undefined
    || toolDefinition === undefined
    || !isUuid(member.id)
    || !isUuid(member.toolSetId)
    || !isUuid(member.toolDefinitionId)
    || member.id !== step.toolBindingId
    || member.enabled !== true
    || !isUuid(toolDefinition.id)
    || toolDefinition.id !== member.toolDefinitionId
    || toolDefinition.status !== "ACTIVE"
    || !isUuid(definition.allowedToolSetId)
    || member.toolSetId !== definition.allowedToolSetId
  ) {
    return false;
  }

  return true;
}
