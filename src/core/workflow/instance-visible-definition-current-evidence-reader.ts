import type { RequestContext } from "../context/contracts.js";
import type {
  PersistedWorkflowDefinition,
  WorkflowDefinitionReadPort,
} from "./definition.js";
import type {
  PersistedWorkflowInstance,
  WorkflowInstanceReadPort,
} from "./instance.js";
import {
  matchesWorkflowInstanceDefinitionBindingFloors,
} from "./instance-definition-binding-floors.js";

export interface WorkflowInstanceDefinitionCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly workflowInstanceId: string;
}

export interface WorkflowInstanceDefinitionCurrentEvidence {
  readonly instance: PersistedWorkflowInstance;
  readonly definition: PersistedWorkflowDefinition;
}

/**
 * DD-353…DD-357: compose only the already-governed WorkflowInstance raw
 * reader, same-RequestContext WorkflowDefinition raw reader and DD-173
 * relationship floor.
 *
 * This is deliberately not a cross-scope definition resolver. In particular,
 * it never switches a Tenant request to PLATFORM_GLOBAL to recover a hidden
 * PLATFORM definition.
 */
export async function loadWorkflowInstanceDefinitionCurrentEvidence(
  input: WorkflowInstanceDefinitionCurrentEvidenceReadInput,
  instanceReader: WorkflowInstanceReadPort,
  definitionReader: WorkflowDefinitionReadPort,
): Promise<WorkflowInstanceDefinitionCurrentEvidence | null> {
  const instance = await instanceReader.loadForContext({
    requestContext: input.requestContext,
    workflowInstanceId: input.workflowInstanceId,
  });
  if (instance === null) return null;

  const definition = await definitionReader.loadForContext({
    requestContext: input.requestContext,
    workflowDefinitionId: instance.workflowDefinitionId,
  });
  if (definition === null) return null;

  if (!matchesWorkflowInstanceDefinitionBindingFloors(instance, definition)) {
    return null;
  }

  return Object.freeze({
    instance,
    definition,
  });
}
