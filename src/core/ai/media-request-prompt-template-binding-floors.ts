import type { PersistedAIMediaRequest } from "./media-request.js";
import type { PersistedAIPromptTemplate } from "./prompt-template.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function hasValidPromptOwnerShape(
  prompt: PersistedAIPromptTemplate,
): boolean {
  if (!isUuid(prompt.id) || !Number.isSafeInteger(prompt.version)
    || prompt.version <= 0) {
    return false;
  }

  if (prompt.ownerScope === "PLATFORM") {
    return prompt.tenantId === undefined
      && prompt.industryContextId === undefined;
  }

  if (prompt.ownerScope === "TENANT") {
    return isUuid(prompt.tenantId)
      && prompt.industryContextId === undefined;
  }

  if (prompt.ownerScope === "INDUSTRY") {
    return isUuid(prompt.tenantId)
      && isUuid(prompt.industryContextId);
  }

  return false;
}

function appliesToRequest(
  prompt: PersistedAIPromptTemplate,
  request: PersistedAIMediaRequest,
): boolean {
  if (prompt.ownerScope === "PLATFORM") return true;

  if (prompt.ownerScope === "TENANT") {
    return prompt.tenantId === request.tenantId;
  }

  if (prompt.ownerScope === "INDUSTRY") {
    return prompt.tenantId === request.tenantId
      && request.industryContextId !== undefined
      && prompt.industryContextId === request.industryContextId;
  }

  return false;
}

/**
 * Re-evaluates only migration-0031's optional AIMediaRequest ->
 * PromptTemplate exact id/version/ACTIVE/scope relationship.
 *
 * A true result is not principal/document currentness, prompt selection or
 * rendering, media-generation authorization, moderation or AI execution.
 */
export function matchesAIMediaRequestPromptTemplateBindingFloors(
  request: PersistedAIMediaRequest,
  promptTemplate?: PersistedAIPromptTemplate,
): boolean {
  if (!isUuid(request.id) || !isUuid(request.tenantId)) return false;
  if (
    request.industryContextId !== undefined
    && !isUuid(request.industryContextId)
  ) {
    return false;
  }

  if (request.promptTemplateId === undefined) {
    return request.promptVersion === undefined
      && promptTemplate === undefined;
  }

  if (
    !isUuid(request.promptTemplateId)
    || !isSafeInteger(request.promptVersion)
    || promptTemplate === undefined
    || !hasValidPromptOwnerShape(promptTemplate)
    || promptTemplate.id !== request.promptTemplateId
    || promptTemplate.version !== request.promptVersion
    || promptTemplate.status !== "ACTIVE"
  ) {
    return false;
  }

  return appliesToRequest(promptTemplate, request);
}
