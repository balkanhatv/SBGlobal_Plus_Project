import type { RequestContext } from "../context/contracts.js";
import type {
  PersistedWorkflowDefinition,
  WorkflowDefinitionReadPort,
} from "./definition.js";
import {
  matchesWorkflowInstanceDefinitionBindingFloors,
} from "./instance-definition-binding-floors.js";
import type { WorkflowInstanceReadPort } from "./instance.js";
import {
  loadWorkflowTransitionInstanceCurrentEvidence,
  type WorkflowTransitionInstanceCurrentEvidence,
} from "./transition-visible-instance-current-evidence-reader.js";
import type { WorkflowTransitionReadPort } from "./transition.js";

export interface WorkflowTransitionInstanceDefinitionCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly workflowTransitionId: string;
}

export interface WorkflowTransitionInstanceDefinitionCurrentEvidence {
  readonly parent: WorkflowTransitionInstanceCurrentEvidence;
  readonly definition: PersistedWorkflowDefinition;
}

/**
 * DD-488…DD-492: extend exact DD-367 historical transition + current
 * WorkflowInstance evidence by reading the exact persisted WorkflowDefinition
 * once in the same RequestContext and re-applying DD-173.
 *
 * The transition remains historical evidence. The current instance/definition
 * may have advanced relative to it. This adds no actor/action/state-machine,
 * replay/transition, mutation/event or workflow execution authority.
 */
export async function loadWorkflowTransitionInstanceDefinitionCurrentEvidence(
  input: WorkflowTransitionInstanceDefinitionCurrentEvidenceReadInput,
  transitionReader: WorkflowTransitionReadPort,
  instanceReader: WorkflowInstanceReadPort,
  definitionReader: WorkflowDefinitionReadPort,
): Promise<WorkflowTransitionInstanceDefinitionCurrentEvidence | null> {
  const parent = await loadWorkflowTransitionInstanceCurrentEvidence(
    input,
    transitionReader,
    instanceReader,
  );
  if (parent === null) return null;

  const definition = await definitionReader.loadForContext({
    requestContext: input.requestContext,
    workflowDefinitionId: parent.instance.workflowDefinitionId,
  });
  if (definition === null) return null;

  if (
    !matchesWorkflowInstanceDefinitionBindingFloors(
      parent.instance,
      definition,
    )
  ) {
    return null;
  }

  return Object.freeze({
    parent,
    definition,
  });
}
