import type { PersistedWorkflowDefinition } from "./definition.js";
import type { PersistedAutomationDefinition } from "./automation-definition.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function hasValidOwnerShape(definition: {
  readonly ownerScope: string;
  readonly tenantId?: string;
  readonly industryContextId?: string;
}): boolean {
  if (definition.ownerScope === "PLATFORM") {
    return definition.tenantId === undefined
      && definition.industryContextId === undefined;
  }

  if (definition.ownerScope === "TENANT") {
    return isUuid(definition.tenantId)
      && definition.industryContextId === undefined;
  }

  if (definition.ownerScope === "INDUSTRY") {
    return isUuid(definition.tenantId)
      && isUuid(definition.industryContextId);
  }

  return false;
}

/**
 * Re-evaluates only migration-0031 + migration-0048's optional
 * AutomationDefinition -> WorkflowDefinition exact-id containment relationship.
 *
 * A true result is not WorkflowDefinition currentness/selection and not
 * Automation or Workflow execution authority.
 */
export function matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
  automationDefinition: PersistedAutomationDefinition,
  workflowDefinition?: PersistedWorkflowDefinition,
): boolean {
  if (
    !isUuid(automationDefinition.id)
    || !hasValidOwnerShape(automationDefinition)
  ) {
    return false;
  }

  if (automationDefinition.workflowDefinitionId === undefined) {
    return workflowDefinition === undefined;
  }

  if (
    !isUuid(automationDefinition.workflowDefinitionId)
    || workflowDefinition === undefined
    || !isUuid(workflowDefinition.id)
    || workflowDefinition.id !== automationDefinition.workflowDefinitionId
    || !hasValidOwnerShape(workflowDefinition)
  ) {
    return false;
  }

  if (automationDefinition.ownerScope === "PLATFORM") {
    return workflowDefinition.ownerScope === "PLATFORM";
  }

  if (automationDefinition.ownerScope === "TENANT") {
    if (workflowDefinition.ownerScope === "PLATFORM") return true;

    return workflowDefinition.ownerScope === "TENANT"
      && workflowDefinition.tenantId === automationDefinition.tenantId;
  }

  if (automationDefinition.ownerScope === "INDUSTRY") {
    if (workflowDefinition.ownerScope === "PLATFORM") return true;

    if (workflowDefinition.ownerScope === "TENANT") {
      return workflowDefinition.tenantId === automationDefinition.tenantId;
    }

    return workflowDefinition.ownerScope === "INDUSTRY"
      && workflowDefinition.tenantId === automationDefinition.tenantId
      && workflowDefinition.industryContextId === automationDefinition.industryContextId;
  }

  return false;
}
