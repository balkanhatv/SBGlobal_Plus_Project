import type { PersistedAIAssistantDefinition } from "./assistant-definition.js";
import type { PersistedAIConversation } from "./conversation.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0031's optional AIConversation ->
 * AssistantDefinition exact id/ACTIVE/scope relationship.
 *
 * A true result is not conversation-owner authorization, effective Assistant
 * selection, nested Assistant relationship currentness or AI execution authority.
 */
export function matchesAIConversationAssistantBindingFloors(
  conversation: PersistedAIConversation,
  assistant?: PersistedAIAssistantDefinition,
): boolean {
  if (!isUuid(conversation.id) || !isUuid(conversation.tenantId)) return false;

  if (conversation.scopeClass === "TENANT_CORE") {
    if (conversation.industryContextId !== undefined) return false;
  } else if (conversation.scopeClass === "TENANT_INDUSTRY") {
    if (!isUuid(conversation.industryContextId)) return false;
  } else {
    return false;
  }

  if (conversation.assistantDefinitionId === undefined) {
    return assistant === undefined;
  }

  if (
    !isUuid(conversation.assistantDefinitionId)
    || assistant === undefined
    || !isUuid(assistant.id)
    || assistant.id !== conversation.assistantDefinitionId
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
      && assistant.tenantId === conversation.tenantId
      && assistant.industryContextId === undefined;
  }

  if (assistant.ownerScope === "INDUSTRY") {
    return isUuid(assistant.tenantId)
      && assistant.tenantId === conversation.tenantId
      && isUuid(assistant.industryContextId)
      && conversation.scopeClass === "TENANT_INDUSTRY"
      && assistant.industryContextId === conversation.industryContextId;
  }

  return false;
}
