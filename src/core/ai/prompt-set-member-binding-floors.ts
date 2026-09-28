import type { PersistedAIPromptSet } from "./prompt-set.js";
import type { PersistedAIPromptSetMember } from "./prompt-set-member.js";
import type { PersistedAIPromptTemplate } from "./prompt-template.js";

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
 * Re-evaluates only migration-0031 + migration-0048's PromptSetMember
 * relationship to an ACTIVE PromptSet and ACTIVE same/broader PromptTemplate.
 *
 * A true result is not effective-member selection, priority ordering, enabled
 * filtering, rendering, prompt composition or AI execution authority.
 */
export function matchesAIPromptSetMemberBindingFloors(
  member: PersistedAIPromptSetMember,
  promptSet: PersistedAIPromptSet,
  promptTemplate: PersistedAIPromptTemplate,
): boolean {
  if (
    !isUuid(member.id)
    || !isUuid(member.promptSetId)
    || !isUuid(member.promptTemplateId)
    || !isUuid(promptSet.id)
    || !isUuid(promptTemplate.id)
    || member.promptSetId !== promptSet.id
    || member.promptTemplateId !== promptTemplate.id
    || !hasValidOwnerShape(promptSet)
    || !hasValidOwnerShape(promptTemplate)
    || promptSet.status !== "ACTIVE"
    || promptTemplate.status !== "ACTIVE"
  ) {
    return false;
  }

  if (promptSet.ownerScope === "PLATFORM") {
    return promptTemplate.ownerScope === "PLATFORM";
  }

  if (promptSet.ownerScope === "TENANT") {
    if (promptTemplate.ownerScope === "PLATFORM") return true;

    return promptTemplate.ownerScope === "TENANT"
      && promptTemplate.tenantId === promptSet.tenantId;
  }

  if (promptSet.ownerScope === "INDUSTRY") {
    if (promptTemplate.ownerScope === "PLATFORM") return true;

    if (promptTemplate.ownerScope === "TENANT") {
      return promptTemplate.tenantId === promptSet.tenantId;
    }

    return promptTemplate.ownerScope === "INDUSTRY"
      && promptTemplate.tenantId === promptSet.tenantId
      && promptTemplate.industryContextId === promptSet.industryContextId;
  }

  return false;
}
