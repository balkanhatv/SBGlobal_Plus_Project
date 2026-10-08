import type { RequestContext } from "../context/contracts.js";
import {
  matchesAIMemorySupersessionContinuityFloors,
} from "./memory-supersession-continuity-floors.js";
import type {
  AIMemoryRecordReadPort,
  PersistedAIMemoryRecord,
} from "./memory-record.js";

export interface AIMemoryDirectSupersessionCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly memoryRecordId: string;
}

export interface AIMemoryDirectSupersessionUnboundEvidence {
  readonly memory: PersistedAIMemoryRecord;
  readonly supersededMemory?: never;
}

export interface AIMemoryDirectSupersessionBoundEvidence {
  readonly memory: PersistedAIMemoryRecord;
  readonly supersededMemory: PersistedAIMemoryRecord;
}

export type AIMemoryDirectSupersessionCurrentEvidence =
  | AIMemoryDirectSupersessionUnboundEvidence
  | AIMemoryDirectSupersessionBoundEvidence;

/**
 * DD-668…DD-672: read one exact scoped AIMemoryRecord, optionally its direct
 * persisted supersession parent under the identical RequestContext, then
 * reapply only the existing DD-187 relationship floor.
 *
 * Returns internal raw evidence only, not selected/current memory, authorized
 * recall, ACL/retention/expiry/erasure decisions, history assembly, decryption,
 * cross-Industry context carry, prompt inclusion, RAG or AI execution authority.
 */
export async function loadAIMemoryDirectSupersessionCurrentEvidence(
  input: AIMemoryDirectSupersessionCurrentEvidenceReadInput,
  memoryReader: AIMemoryRecordReadPort,
): Promise<AIMemoryDirectSupersessionCurrentEvidence | null> {
  const memory = await memoryReader.loadForContext({
    requestContext: input.requestContext,
    memoryRecordId: input.memoryRecordId,
  });
  if (memory === null) return null;

  if (memory.supersedesId === undefined) {
    if (!matchesAIMemorySupersessionContinuityFloors(memory)) return null;
    return Object.freeze({ memory });
  }

  const supersededMemory = await memoryReader.loadForContext({
    requestContext: input.requestContext,
    memoryRecordId: memory.supersedesId,
  });
  if (supersededMemory === null) return null;

  if (!matchesAIMemorySupersessionContinuityFloors(memory, supersededMemory)) {
    return null;
  }
  return Object.freeze({ memory, supersededMemory });
}
