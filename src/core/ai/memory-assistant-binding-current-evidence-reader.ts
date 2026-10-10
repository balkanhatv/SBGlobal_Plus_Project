import type { RequestContext } from "../context/contracts.js";
import type {
  AIAssistantDefinitionReadPort,
  PersistedAIAssistantDefinition,
} from "./assistant-definition.js";
import {
  matchesAIMemoryAssistantBindingFloors,
} from "./memory-assistant-binding-floors.js";
import type {
  AIMemoryRecordReadPort,
  PersistedAIMemoryRecord,
} from "./memory-record.js";

export interface AIMemoryAssistantBindingCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly memoryRecordId: string;
}

export interface AIMemoryAssistantBindingUnboundEvidence {
  readonly memory: PersistedAIMemoryRecord;
  readonly assistant?: never;
}

export interface AIMemoryAssistantBindingBoundEvidence {
  readonly memory: PersistedAIMemoryRecord;
  readonly assistant: PersistedAIAssistantDefinition;
}

export type AIMemoryAssistantBindingCurrentEvidence =
  | AIMemoryAssistantBindingUnboundEvidence
  | AIMemoryAssistantBindingBoundEvidence;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * DD-673…DD-677: one exact scoped AIMemoryRecord read, then only for a
 * persisted AssistantDefinition id one exact same-context Assistant read.
 * Reapply the existing DD-186 current binding floor and preserve raw evidence.
 *
 * This is necessary relationship evidence only: no memory recall, selected
 * Assistant version, principal/ACL, expiry/retention, supersession traversal,
 * cross-Industry carry, prompt/RAG/provider/tool or AI execution authority.
 */
export async function loadAIMemoryAssistantBindingCurrentEvidence(
  input: AIMemoryAssistantBindingCurrentEvidenceReadInput,
  memoryReader: AIMemoryRecordReadPort,
  assistantReader: AIAssistantDefinitionReadPort,
): Promise<AIMemoryAssistantBindingCurrentEvidence | null> {
  const memory = await memoryReader.loadForContext({
    requestContext: input.requestContext,
    memoryRecordId: input.memoryRecordId,
  });
  if (memory === null) return null;

  if (memory.assistantDefinitionId === undefined) {
    if (!matchesAIMemoryAssistantBindingFloors(memory)) return null;
    return Object.freeze({ memory });
  }

  // Reject malformed persisted linkage before accessing another read port.
  if (
    !isUuid(memory.id)
    || !isUuid(memory.tenantId)
    || (memory.industryContextId !== undefined
      && !isUuid(memory.industryContextId))
    || !isUuid(memory.assistantDefinitionId)
  ) {
    return null;
  }

  const assistant = await assistantReader.loadForContext({
    requestContext: input.requestContext,
    assistantDefinitionId: memory.assistantDefinitionId,
  });
  if (assistant === null) return null;
  if (!matchesAIMemoryAssistantBindingFloors(memory, assistant)) return null;

  return Object.freeze({ memory, assistant });
}
