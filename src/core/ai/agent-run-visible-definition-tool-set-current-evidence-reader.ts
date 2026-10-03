import type { RequestContext } from "../context/contracts.js";
import type { AIAgentDefinitionReadPort } from "./agent-definition.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import {
  loadAIAgentRunDefinitionCurrentEvidence,
  type AIAgentRunDefinitionCurrentEvidence,
} from "./agent-run-visible-definition-current-evidence-reader.js";
import {
  matchesAIAgentDefinitionToolSetBindingFloors,
} from "./agent-definition-tool-set-binding-floors.js";
import type {
  AIToolSetReadPort,
  PersistedAIToolSet,
} from "./tool-set.js";

export interface AIAgentRunDefinitionToolSetCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentRunId: string;
}

export interface AIAgentRunDefinitionToolSetCurrentEvidence {
  readonly runDefinition: AIAgentRunDefinitionCurrentEvidence;
  readonly toolSet: PersistedAIToolSet;
}

/**
 * DD-393…DD-397: extend the already-governed DD-392 AgentRun /
 * AgentDefinition current evidence with only the exact same-RequestContext
 * ToolSet evidence owned by DD-111 and the DD-180 binding floor.
 *
 * This is deliberately not a ToolSet resolver. A broader PLATFORM ToolSet
 * hidden from a Tenant RequestContext remains hidden; no PLATFORM_GLOBAL
 * fallback/elevation is attempted.
 */
export async function loadAIAgentRunDefinitionToolSetCurrentEvidence(
  input: AIAgentRunDefinitionToolSetCurrentEvidenceReadInput,
  runReader: AIAgentRunReadPort,
  definitionReader: AIAgentDefinitionReadPort,
  toolSetReader: AIToolSetReadPort,
): Promise<AIAgentRunDefinitionToolSetCurrentEvidence | null> {
  const runDefinition = await loadAIAgentRunDefinitionCurrentEvidence(
    {
      requestContext: input.requestContext,
      agentRunId: input.agentRunId,
    },
    runReader,
    definitionReader,
  );
  if (runDefinition === null) return null;

  const toolSet = await toolSetReader.loadForContext({
    requestContext: input.requestContext,
    toolSetId: runDefinition.definition.allowedToolSetId,
  });
  if (toolSet === null) return null;

  if (!matchesAIAgentDefinitionToolSetBindingFloors(
    runDefinition.definition,
    toolSet,
  )) {
    return null;
  }

  return Object.freeze({
    runDefinition,
    toolSet,
  });
}
