import type { RequestContext } from "../context/contracts.js";
import type {
  AIAssistantDefinitionReadPort,
  PersistedAIAssistantDefinition,
} from "./assistant-definition.js";
import { matchesAIConversationAssistantBindingFloors } from "./conversation-assistant-binding-floors.js";
import type { AIConversationReadPort, PersistedAIConversation } from "./conversation.js";
import { matchesAIMessageConversationBindingFloors } from "./message-conversation-binding-floors.js";
import type { AIMessageReadPort, PersistedAIMessage } from "./message.js";

export interface AIMessageConversationAssistantCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly messageId: string;
}

export interface AIMessageConversationAssistantUnboundEvidence {
  readonly message: PersistedAIMessage;
  readonly conversation: PersistedAIConversation;
  readonly assistant?: never;
}

export interface AIMessageConversationAssistantBoundEvidence {
  readonly message: PersistedAIMessage;
  readonly conversation: PersistedAIConversation;
  readonly assistant: PersistedAIAssistantDefinition;
}

export type AIMessageConversationAssistantCurrentEvidence =
  | AIMessageConversationAssistantUnboundEvidence
  | AIMessageConversationAssistantBoundEvidence;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * DD-693…DD-697: one exact AIMessage → Conversation → optional Assistant
 * evidence composition. Reuse DD-199 and DD-185 direct relationship floors
 * under unchanged RequestContext and underlying scoped read-port visibility.
 *
 * This is neither an atomic snapshot nor message/history/content access,
 * current acting-principal permission, effective Assistant selection, RAG,
 * model routing, inference, tool/agent execution, mutation or publication.
 */
export async function loadAIMessageConversationAssistantCurrentEvidence(
  input: AIMessageConversationAssistantCurrentEvidenceReadInput,
  messageReader: AIMessageReadPort,
  conversationReader: AIConversationReadPort,
  assistantReader: AIAssistantDefinitionReadPort,
): Promise<AIMessageConversationAssistantCurrentEvidence | null> {
  const message = await messageReader.loadForContext({
    requestContext: input.requestContext,
    messageId: input.messageId,
  });
  if (
    !message || typeof message !== "object"
    || !isUuid(message.id) || !isUuid(message.conversationId)
  ) return null;

  const conversation = await conversationReader.loadForContext({
    requestContext: input.requestContext,
    conversationId: message.conversationId,
  });
  if (
    conversation === null
    || !matchesAIMessageConversationBindingFloors(message, conversation)
  ) return null;

  if (conversation.assistantDefinitionId === undefined) {
    if (!matchesAIConversationAssistantBindingFloors(conversation)) return null;
    return Object.freeze({ message, conversation });
  }

  // Reuse only DD-185 necessary conversation/optional FK shape before reading.
  const validScope = conversation.scopeClass === "TENANT_CORE"
    ? conversation.industryContextId === undefined
    : conversation.scopeClass === "TENANT_INDUSTRY"
      && isUuid(conversation.industryContextId);
  if (
    !isUuid(conversation.id) || !isUuid(conversation.tenantId)
    || !validScope || !isUuid(conversation.assistantDefinitionId)
  ) return null;

  const assistant = await assistantReader.loadForContext({
    requestContext: input.requestContext,
    assistantDefinitionId: conversation.assistantDefinitionId,
  });
  if (assistant === null) return null;
  if (!matchesAIConversationAssistantBindingFloors(conversation, assistant)) {
    return null;
  }

  return Object.freeze({ message, conversation, assistant });
}
