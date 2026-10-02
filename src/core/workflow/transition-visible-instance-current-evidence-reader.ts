import type { RequestContext } from "../context/contracts.js";
import type {
  PersistedWorkflowInstance,
  WorkflowInstanceReadPort,
} from "./instance.js";
import { matchesWorkflowChildParentBindingFloors } from "./child-parent-binding-floors.js";
import type {
  PersistedWorkflowTransition,
  WorkflowTransitionReadPort,
} from "./transition.js";

export interface WorkflowTransitionInstanceCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly workflowTransitionId: string;
}

export interface WorkflowTransitionInstanceCurrentEvidence {
  readonly transition: PersistedWorkflowTransition;
  readonly instance: PersistedWorkflowInstance;
}

/**
 * DD-363…DD-367: read a visible historical transition and its exact visible
 * parent in the same RequestContext, then re-apply DD-174 parent binding.
 *
 * The parent may have advanced since the transition. This evidence does not
 * validate the actor, compare historical/current state or versions, authorize
 * a transition/replay, or grant workflow execution authority.
 */
export async function loadWorkflowTransitionInstanceCurrentEvidence(
  input: WorkflowTransitionInstanceCurrentEvidenceReadInput,
  transitionReader: WorkflowTransitionReadPort,
  instanceReader: WorkflowInstanceReadPort,
): Promise<WorkflowTransitionInstanceCurrentEvidence | null> {
  const transition = await transitionReader.loadForContext({
    requestContext: input.requestContext,
    workflowTransitionId: input.workflowTransitionId,
  });
  if (transition === null) return null;

  const instance = await instanceReader.loadForContext({
    requestContext: input.requestContext,
    workflowInstanceId: transition.workflowInstanceId,
  });
  if (instance === null) return null;

  if (!matchesWorkflowChildParentBindingFloors(transition, instance)) return null;

  return Object.freeze({ transition, instance });
}
