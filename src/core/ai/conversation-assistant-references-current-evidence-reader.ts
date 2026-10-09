import type { RequestContext } from "../context/contracts.js";
import type {
  AIAssistantDefinitionReadPort,
  PersistedAIAssistantDefinition,
} from "./assistant-definition.js";
import {
  matchesAIAssistantDefinitionRelationshipFloors,
  matchesAIAssistantDefinitionRequiredPromptTemplateFloors,
} from "./assistant-definition-relationship-floors.js";
import {
  matchesAIConversationAssistantBindingFloors,
} from "./conversation-assistant-binding-floors.js";
import type { AIConversationReadPort, PersistedAIConversation } from "./conversation.js";
import type { AIPromptTemplateReadPort, PersistedAIPromptTemplate } from "./prompt-template.js";
import type { AIToolSetReadPort, PersistedAIToolSet } from "./tool-set.js";

export interface AIConversationAssistantReferencesCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly conversationId: string;
}

export interface AIConversationAssistantReferencesUnboundEvidence {
  readonly conversation: PersistedAIConversation;
  readonly assistant?: never;
  readonly promptTemplate?: never;
  readonly toolSet?: never;
}

export interface AIConversationAssistantReferencesWithoutToolSetEvidence {
  readonly conversation: PersistedAIConversation;
  readonly assistant: PersistedAIAssistantDefinition;
  readonly promptTemplate: PersistedAIPromptTemplate;
  readonly toolSet?: never;
}

export interface AIConversationAssistantReferencesWithToolSetEvidence {
  readonly conversation: PersistedAIConversation;
  readonly assistant: PersistedAIAssistantDefinition;
  readonly promptTemplate: PersistedAIPromptTemplate;
  readonly toolSet: PersistedAIToolSet;
}

export type AIConversationAssistantReferencesCurrentEvidence =
  | AIConversationAssistantReferencesUnboundEvidence
  | AIConversationAssistantReferencesWithoutToolSetEvidence
  | AIConversationAssistantReferencesWithToolSetEvidence;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validConversationScope(conversation: PersistedAIConversation): boolean {
  if (!isUuid(conversation.id) || !isUuid(conversation.tenantId)) return false;
  if (conversation.scopeClass === "TENANT_CORE") {
    return conversation.industryContextId === undefined;
  }
  if (conversation.scopeClass === "TENANT_INDUSTRY") {
    return isUuid(conversation.industryContextId);
  }
  return false;
}

/**
 * DD-698…DD-702: compose only necessary persisted relationship evidence
 * for one exact scoped AIConversation, optional AssistantDefinition, required
 * bound PromptTemplate and optional bound ToolSet, under one original
 * RequestContext reference and existing read-port visibility.
 *
 * Uses DD-185 and DD-179 floors, not a new effective Assistant, prompt,
 * ToolSet, permission, principal currentness, RAG, inference, execution,
 * API/UI or mutation contract. Read ports may span different transactions:
 * this is not an atomic cross-record snapshot or conversation-history grant.
 */
export async function loadAIConversationAssistantReferencesCurrentEvidence(
  input: AIConversationAssistantReferencesCurrentEvidenceReadInput,
  conversationReader: AIConversationReadPort,
  assistantReader: AIAssistantDefinitionReadPort,
  promptTemplateReader: AIPromptTemplateReadPort,
  toolSetReader: AIToolSetReadPort,
): Promise<AIConversationAssistantReferencesCurrentEvidence | null> {
  const conversation = await conversationReader.loadForContext({
    requestContext: input.requestContext,
    conversationId: input.conversationId,
  });
  if (!conversation || typeof conversation !== "object"
    || !validConversationScope(conversation)) return null;

  if (conversation.assistantDefinitionId === undefined) {
    if (!matchesAIConversationAssistantBindingFloors(conversation)) return null;
    return Object.freeze({ conversation });
  }

  if (!isUuid(conversation.assistantDefinitionId)) return null;
  const assistant = await assistantReader.loadForContext({
    requestContext: input.requestContext,
    assistantDefinitionId: conversation.assistantDefinitionId,
  });
  if (!assistant || typeof assistant !== "object"
    || !matchesAIConversationAssistantBindingFloors(conversation, assistant)
    || !isUuid(assistant.promptTemplateId)
    || (assistant.toolSetId !== undefined && !isUuid(assistant.toolSetId))
  ) return null;

  const promptTemplate = await promptTemplateReader.loadForContext({
    requestContext: input.requestContext,
    promptTemplateId: assistant.promptTemplateId,
  });
  if (!promptTemplate || typeof promptTemplate !== "object"
    || !matchesAIAssistantDefinitionRequiredPromptTemplateFloors(
      assistant, promptTemplate,
    )) return null;

  if (assistant.toolSetId === undefined) {
    if (!matchesAIAssistantDefinitionRelationshipFloors(
      assistant, promptTemplate,
    )) return null;
    return Object.freeze({ conversation, assistant, promptTemplate });
  }

  const toolSet = await toolSetReader.loadForContext({
    requestContext: input.requestContext,
    toolSetId: assistant.toolSetId,
  });
  if (!toolSet || typeof toolSet !== "object"
    || !matchesAIAssistantDefinitionRelationshipFloors(
      assistant, promptTemplate, toolSet,
    )) return null;

  return Object.freeze({ conversation, assistant, promptTemplate, toolSet });
}
