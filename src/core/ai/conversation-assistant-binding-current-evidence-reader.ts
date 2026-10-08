import type { RequestContext } from "../context/contracts.js";
import type {
  AIAssistantDefinitionReadPort,
  PersistedAIAssistantDefinition,
} from "./assistant-definition.js";
import {
  matchesAIConversationAssistantBindingFloors,
} from "./conversation-assistant-binding-floors.js";
import type {
  AIConversationReadPort,
  PersistedAIConversation,
} from "./conversation.js";

export interface AIConversationAssistantBindingCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly conversationId: string;
}

export interface AIConversationAssistantBindingUnboundEvidence {
  readonly conversation: PersistedAIConversation;
  readonly assistant?: never;
}

export interface AIConversationAssistantBindingBoundEvidence {
  readonly conversation: PersistedAIConversation;
  readonly assistant: PersistedAIAssistantDefinition;
}

export type AIConversationAssistantBindingCurrentEvidence =
  | AIConversationAssistantBindingUnboundEvidence
  | AIConversationAssistantBindingBoundEvidence;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * DD-678…DD-682: exact scoped conversation, optional same-context assistant,
 * and only the existing DD-185 direct id/ACTIVE/owner relationship floor.
 *
 * Raw necessary evidence only: no owner-currentness, history disclosure,
 * retention/erasure, nested Assistant selection, cross-context history carry,
 * prompt/RAG/provider/tool/agent or AI execution authority. Port RLS is unchanged.
 */
export async function loadAIConversationAssistantBindingCurrentEvidence(
  input: AIConversationAssistantBindingCurrentEvidenceReadInput,
  conversationReader: AIConversationReadPort,
  assistantReader: AIAssistantDefinitionReadPort,
): Promise<AIConversationAssistantBindingCurrentEvidence | null> {
  const conversation = await conversationReader.loadForContext({
    requestContext: input.requestContext,
    conversationId: input.conversationId,
  });
  if (conversation === null) return null;

  if (conversation.assistantDefinitionId === undefined) {
    if (!matchesAIConversationAssistantBindingFloors(conversation)) return null;
    return Object.freeze({ conversation });
  }

  // Reject malformed persisted linkage/scope before another dependency read.
  const validScope = conversation.scopeClass === "TENANT_CORE"
    ? conversation.industryContextId === undefined
    : conversation.scopeClass === "TENANT_INDUSTRY"
      && isUuid(conversation.industryContextId);
  if (
    !isUuid(conversation.id)
    || !isUuid(conversation.tenantId)
    || !validScope
    || !isUuid(conversation.assistantDefinitionId)
  ) return null;

  const assistant = await assistantReader.loadForContext({
    requestContext: input.requestContext,
    assistantDefinitionId: conversation.assistantDefinitionId,
  });
  if (assistant === null) return null;
  if (!matchesAIConversationAssistantBindingFloors(conversation, assistant)) {
    return null;
  }

  return Object.freeze({ conversation, assistant });
}
