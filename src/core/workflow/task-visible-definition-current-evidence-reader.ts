import type { RequestContext } from "../context/contracts.js";
import type {
  PersistedWorkflowDefinition,
  WorkflowDefinitionReadPort,
} from "./definition.js";
import {
  matchesWorkflowInstanceDefinitionBindingFloors,
} from "./instance-definition-binding-floors.js";
import {
  loadWorkflowTaskInstanceCurrentEvidence,
  type WorkflowTaskInstanceCurrentEvidence,
} from "./task-visible-instance-current-evidence-reader.js";
import type { WorkflowInstanceReadPort } from "./instance.js";
import type { WorkflowTaskReadPort } from "./task.js";

export interface WorkflowTaskDefinitionCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly workflowTaskId: string;
}

export interface WorkflowTaskDefinitionCurrentEvidence {
  readonly parent: WorkflowTaskInstanceCurrentEvidence;
  readonly definition: PersistedWorkflowDefinition;
}

/**
 * DD-478…DD-482: extend exact DD-362 WorkflowTask -> WorkflowInstance
 * current evidence with the exact referenced WorkflowDefinition visible under
 * the same RequestContext and the existing DD-173 definition-binding floor.
 *
 * This is evidence-only. It does not resolve task assignees/claimants,
 * select definitions by date/code, interpret state-machine/policy/rules,
 * authorize task actions/transitions or execute workflow logic.
 */
export async function loadWorkflowTaskDefinitionCurrentEvidence(
  input: WorkflowTaskDefinitionCurrentEvidenceReadInput,
  taskReader: WorkflowTaskReadPort,
  instanceReader: WorkflowInstanceReadPort,
  definitionReader: WorkflowDefinitionReadPort,
): Promise<WorkflowTaskDefinitionCurrentEvidence | null> {
  const parent = await loadWorkflowTaskInstanceCurrentEvidence(
    input,
    taskReader,
    instanceReader,
  );
  if (parent === null) return null;

  const definition = await definitionReader.loadForContext({
    requestContext: input.requestContext,
    workflowDefinitionId: parent.instance.workflowDefinitionId,
  });
  if (definition === null) return null;

  if (!matchesWorkflowInstanceDefinitionBindingFloors(
    parent.instance,
    definition,
  )) {
    return null;
  }

  return Object.freeze({
    parent,
    definition,
  });
}
