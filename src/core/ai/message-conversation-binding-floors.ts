import type { PersistedAIConversation } from "./conversation.js";
import type { PersistedAIMessage } from "./message.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0012's AIMessage ->
 * AIConversation(id) foreign-key relationship.
 *
 * A true result is not Conversation authorization/currentness,
 * content/source access, model-route authority or AI execution authority.
 */
export function matchesAIMessageConversationBindingFloors(
  message: PersistedAIMessage,
  conversation?: PersistedAIConversation,
): boolean {
  if (
    !message
    || typeof message !== "object"
    || !validUuid(message.id)
    || !validUuid(message.conversationId)
  ) {
    return false;
  }
  if (
    !conversation
    || typeof conversation !== "object"
    || !validUuid(conversation.id)
  ) {
    return false;
  }
  return conversation.id === message.conversationId;
}
