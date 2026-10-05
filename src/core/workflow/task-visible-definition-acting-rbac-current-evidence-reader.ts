import type { RequestContext } from "../context/contracts.js";
import type {
  AuthorizationReadState,
  AuthorizationReadStorePort,
} from "../authorization/read-store.js";
import type { CompiledPermissionV1 } from "../authorization/policy-grammar.js";
import { selectCurrentTenantRbacAllow } from "../authorization/current-tenant-rbac-current-allow.js";
import type { WorkflowDefinitionReadPort } from "./definition.js";
import type { WorkflowInstanceReadPort } from "./instance.js";
import {
  loadWorkflowTaskDefinitionCurrentEvidence,
  type WorkflowTaskDefinitionCurrentEvidence,
} from "./task-visible-definition-current-evidence-reader.js";
import type { WorkflowTaskReadPort } from "./task.js";

export interface WorkflowTaskDefinitionActingRbacCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly workflowTaskId: string;
}

export interface WorkflowTaskDefinitionActingRbacCurrentEvidence {
  readonly parent: WorkflowTaskDefinitionCurrentEvidence;
  readonly authorizationState: AuthorizationReadState;
  readonly permission: CompiledPermissionV1;
}

/**
 * DD-483…DD-487: extend exact DD-482 WorkflowTask/WorkflowInstance/
 * WorkflowDefinition evidence with one current acting-principal compiled-RBAC
 * necessary floor for the exact persisted WorkflowTask.permissionCode.
 *
 * This adds no assignment/action/state-machine/transition/resource/commercial
 * or workflow execution authority.
 */
export async function loadWorkflowTaskDefinitionActingRbacCurrentEvidence(
  input: WorkflowTaskDefinitionActingRbacCurrentEvidenceReadInput,
  taskReader: WorkflowTaskReadPort,
  instanceReader: WorkflowInstanceReadPort,
  definitionReader: WorkflowDefinitionReadPort,
  authorizationReader: AuthorizationReadStorePort,
): Promise<WorkflowTaskDefinitionActingRbacCurrentEvidence | null> {
  const parent = await loadWorkflowTaskDefinitionCurrentEvidence(
    input,
    taskReader,
    instanceReader,
    definitionReader,
  );
  if (parent === null) return null;

  const permissionCode = parent.parent.task.permissionCode;
  const authorizationState = await authorizationReader.load({
    requestContext: input.requestContext,
    permissionCode,
  });

  const permission = selectCurrentTenantRbacAllow(
    input.requestContext,
    authorizationState,
    permissionCode,
  );
  if (permission === null) return null;

  return Object.freeze({
    parent,
    authorizationState,
    permission,
  });
}
