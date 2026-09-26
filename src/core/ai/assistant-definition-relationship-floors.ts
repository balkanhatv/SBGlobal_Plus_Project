import type { PersistedAIAssistantDefinition } from "./assistant-definition.js";
import type { PersistedAIPromptTemplate } from "./prompt-template.js";
import type { PersistedAIToolSet } from "./tool-set.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

type OwnerScope = "PLATFORM" | "TENANT" | "INDUSTRY";

interface OwnerEvidence {
  readonly ownerScope: OwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
}

function hasValidOwnerShape(value: OwnerEvidence): boolean {
  if (value.ownerScope === "PLATFORM") {
    return value.tenantId === undefined && value.industryContextId === undefined;
  }
  if (value.ownerScope === "TENANT") {
    return isUuid(value.tenantId) && value.industryContextId === undefined;
  }
  if (value.ownerScope === "INDUSTRY") {
    return isUuid(value.tenantId) && isUuid(value.industryContextId);
  }
  return false;
}

function definitionContainsDefinition(
  parent: OwnerEvidence,
  child: OwnerEvidence,
): boolean {
  if (!hasValidOwnerShape(parent) || !hasValidOwnerShape(child)) return false;

  if (child.ownerScope === "PLATFORM") {
    return parent.ownerScope === "PLATFORM";
  }

  if (child.ownerScope === "TENANT") {
    if (parent.ownerScope === "PLATFORM") return true;
    return parent.ownerScope === "TENANT"
      && parent.tenantId === child.tenantId;
  }

  if (parent.ownerScope === "PLATFORM") return true;
  if (parent.ownerScope === "TENANT") {
    return parent.tenantId === child.tenantId;
  }
  return parent.ownerScope === "INDUSTRY"
    && parent.tenantId === child.tenantId
    && parent.industryContextId === child.industryContextId;
}

/**
 * Re-evaluates only migration-0031's AssistantDefinition referenced
 * PromptTemplate and optional ToolSet id/ACTIVE/containment relationships.
 *
 * A true result is not Assistant selection, capability authorization, prompt
 * rendering, effective ToolSet resolution or AI execution authority.
 */
export function matchesAIAssistantDefinitionRelationshipFloors(
  assistant: PersistedAIAssistantDefinition,
  promptTemplate: PersistedAIPromptTemplate,
  toolSet?: PersistedAIToolSet,
): boolean {
  if (
    !isUuid(assistant.id)
    || !hasValidOwnerShape(assistant)
    || !isUuid(assistant.promptTemplateId)
    || !isUuid(promptTemplate.id)
    || promptTemplate.id !== assistant.promptTemplateId
    || promptTemplate.status !== "ACTIVE"
    || !definitionContainsDefinition(promptTemplate, assistant)
  ) {
    return false;
  }

  if (assistant.toolSetId === undefined) {
    return toolSet === undefined;
  }

  if (
    !isUuid(assistant.toolSetId)
    || toolSet === undefined
    || !isUuid(toolSet.id)
    || toolSet.id !== assistant.toolSetId
    || toolSet.status !== "ACTIVE"
    || !definitionContainsDefinition(toolSet, assistant)
  ) {
    return false;
  }

  return true;
}
