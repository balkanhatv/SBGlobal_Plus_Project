import type { PersistedWorkflowInstance } from "./instance.js";
import type { PersistedWorkflowTask } from "./task.js";
import type { PersistedWorkflowTransition } from "./transition.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

type PersistedWorkflowChild =
  | PersistedWorkflowTask
  | PersistedWorkflowTransition;

/**
 * Re-evaluates only migration-0031's WorkflowTask/WorkflowTransition ->
 * WorkflowInstance exact parent id/Tenant/nullable-Industry relationship.
 *
 * A true result is not assignee/actor authorization, task-action authority,
 * transition authorization or Workflow execution authority.
 */
export function matchesWorkflowChildParentBindingFloors(
  child: PersistedWorkflowChild,
  instance: PersistedWorkflowInstance,
): boolean {
  if (
    !isUuid(child.id)
    || !isUuid(child.tenantId)
    || !isUuid(child.workflowInstanceId)
    || (child.industryContextId !== undefined && !isUuid(child.industryContextId))
  ) {
    return false;
  }

  if (!isUuid(instance.id) || !isUuid(instance.tenantId)) return false;

  if (instance.scopeClass === "TENANT_CORE") {
    if (instance.industryContextId !== undefined) return false;
  } else if (instance.scopeClass === "TENANT_INDUSTRY") {
    if (!isUuid(instance.industryContextId)) return false;
  } else {
    return false;
  }

  if (
    instance.id !== child.workflowInstanceId
    || instance.tenantId !== child.tenantId
  ) {
    return false;
  }

  if (child.industryContextId === undefined) {
    return instance.scopeClass === "TENANT_CORE"
      && instance.industryContextId === undefined;
  }

  return instance.scopeClass === "TENANT_INDUSTRY"
    && instance.industryContextId === child.industryContextId;
}
