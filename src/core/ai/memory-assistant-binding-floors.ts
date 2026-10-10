import type { PersistedAIAssistantDefinition } from "./assistant-definition.js";
import type { PersistedAIMemoryRecord } from "./memory-record.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0031's optional AIMemoryRecord ->
 * AssistantDefinition exact id/ACTIVE/scope relationship.
 *
 * A true result is not principal authorization, current-memory selection,
 * supersession/retention/ACL authority or AI execution authority.
 */
export function matchesAIMemoryAssistantBindingFloors(
  memory: PersistedAIMemoryRecord,
  assistant?: PersistedAIAssistantDefinition,
): boolean {
  if (!isUuid(memory.id) || !isUuid(memory.tenantId)) return false;
  if (
    memory.industryContextId !== undefined
    && !isUuid(memory.industryContextId)
  ) {
    return false;
  }

  if (memory.assistantDefinitionId === undefined) {
    return assistant === undefined;
  }

  if (
    !isUuid(memory.assistantDefinitionId)
    || assistant === undefined
    || !isUuid(assistant.id)
    || assistant.id !== memory.assistantDefinitionId
    || assistant.status !== "ACTIVE"
  ) {
    return false;
  }

  if (assistant.ownerScope === "PLATFORM") {
    return assistant.tenantId === undefined
      && assistant.industryContextId === undefined;
  }

  if (assistant.ownerScope === "TENANT") {
    return isUuid(assistant.tenantId)
      && assistant.tenantId === memory.tenantId
      && assistant.industryContextId === undefined;
  }

  if (assistant.ownerScope === "INDUSTRY") {
    return isUuid(assistant.tenantId)
      && assistant.tenantId === memory.tenantId
      && isUuid(assistant.industryContextId)
      && memory.industryContextId !== undefined
      && assistant.industryContextId === memory.industryContextId;
  }

  return false;
}
