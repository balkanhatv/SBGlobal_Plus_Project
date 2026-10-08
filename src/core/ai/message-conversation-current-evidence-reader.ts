import type { RequestContext } from "../context/contracts.js";
import { matchesAIMessageConversationBindingFloors } from "./message-conversation-binding-floors.js";
import type { AIConversationReadPort, PersistedAIConversation } from "./conversation.js";
import type { AIMessageReadPort, PersistedAIMessage } from "./message.js";

export interface AIMessageConversationCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly messageId: string;
}

export interface AIMessageConversationCurrentEvidence {
  readonly message: PersistedAIMessage;
  readonly conversation: PersistedAIConversation;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

/**
 * DD-683…DD-687: exact scoped message followed by its exact persisted parent,
 * both under identical RequestContext. DD-199 direct id equality only.
 * No history/content disclosure, retention, route or AI execution authority.
 */
export async function loadAIMessageConversationCurrentEvidence(
  input: AIMessageConversationCurrentEvidenceReadInput,
  messageReader: AIMessageReadPort,
  conversationReader: AIConversationReadPort,
): Promise<AIMessageConversationCurrentEvidence | null> {
  const message = await messageReader.loadForContext({
    requestContext: input.requestContext,
    messageId: input.messageId,
  });
  if (message === null) return null;
  if (!message || typeof message !== "object"
    || !isUuid(message.id) || !isUuid(message.conversationId)) return null;

  const conversation = await conversationReader.loadForContext({
    requestContext: input.requestContext,
    conversationId: message.conversationId,
  });
  if (conversation === null) return null;
  if (!matchesAIMessageConversationBindingFloors(message, conversation)) return null;
  return Object.freeze({ message, conversation });
}
