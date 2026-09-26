import type { PersistedAutomationDefinition } from "./automation-definition.js";
import type { PersistedAutomationRun } from "./automation-run.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0031's AutomationRun ->
 * AutomationDefinition id/ACTIVE/scope relationship.
 *
 * AutomationRun does not persist a definition version. A true result is not
 * trigger, retry, state-transition, OperationContract, Workflow or execution authority.
 */
export function matchesAutomationRunDefinitionBindingFloors(
  run: PersistedAutomationRun,
  definition: PersistedAutomationDefinition,
): boolean {
  if (
    !isUuid(run.id)
    || !isUuid(run.tenantId)
    || !isUuid(run.automationDefinitionId)
    || (run.industryContextId !== undefined && !isUuid(run.industryContextId))
    || !isUuid(definition.id)
    || definition.id !== run.automationDefinitionId
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
      && definition.tenantId === run.tenantId
      && definition.industryContextId === undefined;
  }

  if (definition.ownerScope === "INDUSTRY") {
    return isUuid(definition.tenantId)
      && definition.tenantId === run.tenantId
      && isUuid(definition.industryContextId)
      && isUuid(run.industryContextId)
      && definition.industryContextId === run.industryContextId;
  }

  return false;
}
