import type { RequestContext } from "../context/contracts.js";
import type { AIAgentDefinitionReadPort } from "./agent-definition.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import {
  loadAIAgentRunDefinitionToolSetCurrentEvidence,
  type AIAgentRunDefinitionToolSetCurrentEvidence,
} from "./agent-run-visible-definition-tool-set-current-evidence-reader.js";
import type {
  AIAgentStepReadPort,
  PersistedAIAgentStep,
} from "./agent-step.js";
import {
  matchesAIAgentStepToolBindingFloors,
} from "./agent-step-tool-binding-floors.js";
import type { AIToolSetReadPort } from "./tool-set.js";
import type {
  AIToolSetMemberReadPort,
  PersistedAIToolSetMember,
} from "./tool-set-member.js";
import type {
  AIToolDefinitionCatalogMetadata,
  AIToolDefinitionCatalogMetadataReadPort,
} from "./tool-definition-catalog-metadata.js";

export interface AIAgentStepToolBindingCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentStepId: string;
}

export interface AIAgentStepToolBindingCurrentEvidence {
  readonly step: PersistedAIAgentStep;
  readonly parent: AIAgentRunDefinitionToolSetCurrentEvidence;
  readonly member?: PersistedAIToolSetMember;
  readonly toolDefinition?: AIToolDefinitionCatalogMetadata;
}

/**
 * DD-398…DD-402: read one visible AgentStep, reuse the exact DD-397
 * AgentRun/AgentDefinition/ToolSet parent evidence and conditionally extend a
 * TOOL step with only its persisted ToolSetMember + global ToolDefinition
 * relationship under DD-182.
 *
 * This is evidence-only: it does not resolve effective membership, authorize
 * permission/entitlement/approval or execute the referenced tool/operation.
 */
export async function loadAIAgentStepToolBindingCurrentEvidence(
  input: AIAgentStepToolBindingCurrentEvidenceReadInput,
  stepReader: AIAgentStepReadPort,
  runReader: AIAgentRunReadPort,
  definitionReader: AIAgentDefinitionReadPort,
  toolSetReader: AIToolSetReadPort,
  memberReader: AIToolSetMemberReadPort,
  toolDefinitionReader: AIToolDefinitionCatalogMetadataReadPort,
): Promise<AIAgentStepToolBindingCurrentEvidence | null> {
  const step = await stepReader.loadForContext({
    requestContext: input.requestContext,
    agentStepId: input.agentStepId,
  });
  if (step === null) return null;

  const parent = await loadAIAgentRunDefinitionToolSetCurrentEvidence(
    {
      requestContext: input.requestContext,
      agentRunId: step.runId,
    },
    runReader,
    definitionReader,
    toolSetReader,
  );
  if (parent === null) return null;

  if (step.stepType !== "TOOL") {
    if (!matchesAIAgentStepToolBindingFloors(
      step,
      parent.runDefinition.run,
      parent.runDefinition.definition,
    )) {
      return null;
    }

    return Object.freeze({
      step,
      parent,
    });
  }

  if (step.toolBindingId === undefined) return null;

  const member = await memberReader.loadForContext({
    requestContext: input.requestContext,
    toolSetMemberId: step.toolBindingId,
  });
  if (member === null) return null;

  const toolDefinition = await toolDefinitionReader.loadById(
    member.toolDefinitionId,
  );
  if (toolDefinition === null) return null;

  if (!matchesAIAgentStepToolBindingFloors(
    step,
    parent.runDefinition.run,
    parent.runDefinition.definition,
    member,
    toolDefinition,
  )) {
    return null;
  }

  return Object.freeze({
    step,
    parent,
    member,
    toolDefinition,
  });
}
