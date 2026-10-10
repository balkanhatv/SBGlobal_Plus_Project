import type { RequestContext } from "../context/contracts.js";
import type {
  PersistedWorkflowInstance,
  WorkflowInstanceReadPort,
} from "./instance.js";
import {
  matchesWorkflowChildParentBindingFloors,
} from "./child-parent-binding-floors.js";
import type {
  PersistedWorkflowTask,
  WorkflowTaskReadPort,
} from "./task.js";

export interface WorkflowTaskInstanceCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly workflowTaskId: string;
}

export interface WorkflowTaskInstanceCurrentEvidence {
  readonly task: PersistedWorkflowTask;
  readonly instance: PersistedWorkflowInstance;
}

/**
 * DD-358…DD-362: compose only the already-governed WorkflowTask raw reader,
 * same-RequestContext WorkflowInstance raw reader and DD-174 parent-binding
 * floor.
 *
 * A successful result is current relationship evidence only. It is not task
 * action authority, assignment authorization or workflow execution authority.
 */
export async function loadWorkflowTaskInstanceCurrentEvidence(
  input: WorkflowTaskInstanceCurrentEvidenceReadInput,
  taskReader: WorkflowTaskReadPort,
  instanceReader: WorkflowInstanceReadPort,
): Promise<WorkflowTaskInstanceCurrentEvidence | null> {
  const task = await taskReader.loadForContext({
    requestContext: input.requestContext,
    workflowTaskId: input.workflowTaskId,
  });
  if (task === null) return null;

  const instance = await instanceReader.loadForContext({
    requestContext: input.requestContext,
    workflowInstanceId: task.workflowInstanceId,
  });
  if (instance === null) return null;

  if (!matchesWorkflowChildParentBindingFloors(task, instance)) {
    return null;
  }

  return Object.freeze({
    task,
    instance,
  });
}
