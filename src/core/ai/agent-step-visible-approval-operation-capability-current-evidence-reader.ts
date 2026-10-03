import type { OperationRegistry } from "../api/operation-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type { AIAgentDefinitionReadPort } from "./agent-definition.js";
import type { AIAgentApprovalReadPort } from "./agent-approval.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import {
  loadAIAgentStepApprovalOperationCurrentEvidence,
  type AIAgentStepApprovalOperationCurrentEvidence,
} from "./agent-step-visible-approval-operation-current-evidence-reader.js";
import type { AIAgentStepReadPort } from "./agent-step.js";
import type {
  AICapabilityCatalogMetadata,
  AICapabilityCatalogMetadataByCodeReadPort,
} from "./capability-catalog-metadata.js";
import {
  matchesAIToolDefinitionCapabilityBindingFloors,
} from "./tool-definition-capability-binding-floors.js";
import type {
  AIToolDefinitionCatalogMetadataReadPort,
} from "./tool-definition-catalog-metadata.js";
import type { AIToolSetMemberReadPort } from "./tool-set-member.js";
import type { AIToolSetReadPort } from "./tool-set.js";

export interface AIAgentStepApprovalOperationCapabilityCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentStepId: string;
}

export interface AIAgentStepApprovalOperationCapabilityCurrentEvidence {
  readonly parent: AIAgentStepApprovalOperationCurrentEvidence;
  readonly capability?: AICapabilityCatalogMetadata;
}

/**
 * DD-413…DD-417: extend exact DD-412 AgentStep/approval/operation evidence
 * with only the exact global AICapability row referenced by an already-bound
 * TOOL definition's persisted capabilityCode.
 *
 * Capability presence and foreign-key continuity are evidence only. This
 * boundary does not interpret capability lifecycle, entitlement/default
 * policy, compatibility, authorization, admission, routing or execution.
 */
export async function loadAIAgentStepApprovalOperationCapabilityCurrentEvidence(
  input: AIAgentStepApprovalOperationCapabilityCurrentEvidenceReadInput,
  stepReader: AIAgentStepReadPort,
  runReader: AIAgentRunReadPort,
  definitionReader: AIAgentDefinitionReadPort,
  toolSetReader: AIToolSetReadPort,
  memberReader: AIToolSetMemberReadPort,
  toolDefinitionReader: AIToolDefinitionCatalogMetadataReadPort,
  approvalReader: AIAgentApprovalReadPort,
  operationRegistry: OperationRegistry,
  capabilityReader: AICapabilityCatalogMetadataByCodeReadPort,
): Promise<AIAgentStepApprovalOperationCapabilityCurrentEvidence | null> {
  const parent = await loadAIAgentStepApprovalOperationCurrentEvidence(
    {
      requestContext: input.requestContext,
      agentStepId: input.agentStepId,
    },
    stepReader,
    runReader,
    definitionReader,
    toolSetReader,
    memberReader,
    toolDefinitionReader,
    approvalReader,
    operationRegistry,
  );
  if (parent === null) return null;

  if (parent.parent.parent.step.stepType !== "TOOL") {
    return Object.freeze({
      parent,
    });
  }

  const toolDefinition = parent.parent.parent.toolDefinition;
  if (toolDefinition === undefined) return null;

  const capability = await capabilityReader.loadByCode(
    toolDefinition.capabilityCode,
  );
  if (capability === null) return null;

  if (!matchesAIToolDefinitionCapabilityBindingFloors(
    toolDefinition,
    capability,
  )) {
    return null;
  }

  return Object.freeze({
    parent,
    capability,
  });
}
