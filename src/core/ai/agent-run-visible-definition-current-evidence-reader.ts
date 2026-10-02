import type { RequestContext } from "../context/contracts.js";
import type {
  AIAgentDefinitionReadPort,
  PersistedAIAgentDefinition,
} from "./agent-definition.js";
import type {
  AIAgentRunReadPort,
  PersistedAIAgentRun,
} from "./agent-run.js";
import {
  matchesAIAgentRunDefinitionBindingFloors,
} from "./agent-run-definition-binding-floors.js";

export interface AIAgentRunDefinitionCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentRunId: string;
}

export interface AIAgentRunDefinitionCurrentEvidence {
  readonly run: PersistedAIAgentRun;
  readonly definition: PersistedAIAgentDefinition;
}

/**
 * DD-388…DD-392: compose only the already-governed AgentRun raw reader,
 * same-RequestContext AgentDefinition raw reader and DD-181 relationship floor.
 *
 * This is deliberately not a cross-scope definition resolver. In particular,
 * it never switches a Tenant request to PLATFORM_GLOBAL to recover a hidden
 * PLATFORM AgentDefinition.
 */
export async function loadAIAgentRunDefinitionCurrentEvidence(
  input: AIAgentRunDefinitionCurrentEvidenceReadInput,
  runReader: AIAgentRunReadPort,
  definitionReader: AIAgentDefinitionReadPort,
): Promise<AIAgentRunDefinitionCurrentEvidence | null> {
  const run = await runReader.loadForContext({
    requestContext: input.requestContext,
    agentRunId: input.agentRunId,
  });
  if (run === null) return null;

  const definition = await definitionReader.loadForContext({
    requestContext: input.requestContext,
    agentDefinitionId: run.agentDefinitionId,
  });
  if (definition === null) return null;

  if (!matchesAIAgentRunDefinitionBindingFloors(run, definition)) {
    return null;
  }

  return Object.freeze({
    run,
    definition,
  });
}
