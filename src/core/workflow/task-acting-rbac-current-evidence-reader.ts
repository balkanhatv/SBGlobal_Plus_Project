import type { RequestContext } from "../context/contracts.js";
import type {
  AuthorizationReadState,
  AuthorizationReadStorePort,
} from "../authorization/read-store.js";
import type { CompiledPermissionV1 } from "../authorization/policy-grammar.js";
import { selectCurrentTenantRbacAllow } from "../authorization/current-tenant-rbac-current-allow.js";
import type { WorkflowInstanceReadPort } from "./instance.js";
import {
  loadWorkflowTaskInstanceCurrentEvidence,
  type WorkflowTaskInstanceCurrentEvidence,
} from "./task-visible-instance-current-evidence-reader.js";
import type { WorkflowTaskReadPort } from "./task.js";

export interface WorkflowTaskActingRbacCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly workflowTaskId: string;
}

export interface WorkflowTaskActingRbacCurrentEvidence {
  readonly parent: WorkflowTaskInstanceCurrentEvidence;
  readonly authorizationState: AuthorizationReadState;
  readonly permission: CompiledPermissionV1;
}

/**
 * DD-473…DD-477: extend exact DD-362 WorkflowTask→WorkflowInstance evidence
 * with one current acting-principal compiled-RBAC necessary floor for the exact
 * persisted WorkflowTask.permissionCode.
 *
 * Assignment/claim/due/task-action/transition/ABAC/commercial/resource/
 * execution semantics remain outside this evidence reader.
 */
export async function loadWorkflowTaskActingRbacCurrentEvidence(
  input: WorkflowTaskActingRbacCurrentEvidenceReadInput,
  taskReader: WorkflowTaskReadPort,
  instanceReader: WorkflowInstanceReadPort,
  authorizationReader: AuthorizationReadStorePort,
): Promise<WorkflowTaskActingRbacCurrentEvidence | null> {
  const parent = await loadWorkflowTaskInstanceCurrentEvidence(
    input,
    taskReader,
    instanceReader,
  );
  if (parent === null) return null;

  const authorizationState = await authorizationReader.load({
    requestContext: input.requestContext,
    permissionCode: parent.task.permissionCode,
  });

  const permission = selectCurrentTenantRbacAllow(
    input.requestContext,
    authorizationState,
    parent.task.permissionCode,
  );
  if (permission === null) return null;

  return Object.freeze({
    parent,
    authorizationState,
    permission,
  });
}
