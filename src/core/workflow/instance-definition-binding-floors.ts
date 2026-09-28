import type { PersistedWorkflowDefinition } from "./definition.js";
import type { PersistedWorkflowInstance } from "./instance.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isPositiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

/**
 * Re-evaluates only migration-0031's WorkflowInstance ->
 * WorkflowDefinition id/version/status/scope relationship.
 *
 * A true result is not creator-principal authorization, state-machine validity,
 * transition authorization or Workflow execution authority.
 */
export function matchesWorkflowInstanceDefinitionBindingFloors(
  instance: PersistedWorkflowInstance,
  definition: PersistedWorkflowDefinition,
): boolean {
  if (
    !isUuid(instance.id)
    || !isUuid(instance.tenantId)
    || !isUuid(instance.workflowDefinitionId)
  ) {
    return false;
  }

  if (instance.scopeClass === "TENANT_CORE") {
    if (instance.industryContextId !== undefined) return false;
  } else if (instance.scopeClass === "TENANT_INDUSTRY") {
    if (!isUuid(instance.industryContextId)) return false;
  } else {
    return false;
  }

  if (
    !isUuid(definition.id)
    || definition.id !== instance.workflowDefinitionId
    || !isPositiveSafeInteger(instance.workflowDefinitionVersion)
    || !isPositiveSafeInteger(definition.version)
    || definition.version !== instance.workflowDefinitionVersion
    || definition.status !== "ACTIVE"
  ) {
    return false;
  }

  if (definition.ownerScope === "PLATFORM") {
    return definition.tenantId === undefined
      && definition.industryContextId === undefined;
  }

  if (definition.ownerScope === "TENANT") {
    return isUuid(definition.tenantId)
      && definition.tenantId === instance.tenantId
      && definition.industryContextId === undefined;
  }

  if (definition.ownerScope === "INDUSTRY") {
    return isUuid(definition.tenantId)
      && definition.tenantId === instance.tenantId
      && isUuid(definition.industryContextId)
      && instance.scopeClass === "TENANT_INDUSTRY"
      && definition.industryContextId === instance.industryContextId;
  }

  return false;
}
