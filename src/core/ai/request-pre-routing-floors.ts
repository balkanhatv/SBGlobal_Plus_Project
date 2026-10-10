import type { JsonValue } from "../api/schema-registry.js";
import type { AIModelSensitivityCeiling } from "./model-catalog-metadata.js";
import type { AIOperationContractDeclaration } from "./operation-pre-provider-prerequisite-floors.js";
import { matchesAIOperationContractDeclarationShapeFloor } from "./operation-pre-provider-prerequisite-floors.js";

export interface AIRequestContract {
  readonly requestId: string;
  readonly capabilityCode: string;
  readonly requestContextRef: string;
  readonly conversationId?: string;
  readonly inputSchemaVersion: number;
  readonly input: JsonValue;
  readonly sensitivityClass: AIModelSensitivityCeiling;
  readonly residencyRequirement: string;
  readonly groundingMode: string;
  readonly requestedOutputSchema?: JsonValue;
  readonly latencyClass?: string;
  readonly budgetClass?: string;
  readonly allowedSourceScopes?: readonly string[];
  readonly correlationId: string;
}

const REQUIRED_KEYS = new Set([
  "requestId",
  "capabilityCode",
  "requestContextRef",
  "inputSchemaVersion",
  "input",
  "sensitivityClass",
  "residencyRequirement",
  "groundingMode",
  "correlationId",
]);

const OPTIONAL_KEYS = new Set([
  "conversationId",
  "requestedOutputSchema",
  "latencyClass",
  "budgetClass",
  "allowedSourceScopes",
]);

const ALLOWED_KEYS = new Set([...REQUIRED_KEYS, ...OPTIONAL_KEYS]);

const SENSITIVITY_CLASSES = new Set<AIModelSensitivityCeiling>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return Array.from(value).every((entry) => isJsonValue(entry));
  }
  if (isPlainObject(value)) {
    return Object.values(value).every((entry) => isJsonValue(entry));
  }
  return false;
}

function cloneFreezeJson(value: JsonValue): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(Array.from(value, (entry) => cloneFreezeJson(entry)));
  }

  const projected: Record<string, JsonValue> = {};
  for (const [key, entry] of Object.entries(value)) {
    projected[key] = cloneFreezeJson(entry);
  }
  return Object.freeze(projected);
}

function isNonEmptyStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => isNonEmptyString(entry));
}

function hasExactRequestKeySet(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  for (const key of REQUIRED_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) return false;
  }
  return keys.every((key) => ALLOWED_KEYS.has(key));
}

/**
 * DD-243: exact DD-09 AIRequest envelope shape only.
 *
 * Unknown top-level fields fail closed so client-supplied trusted-context facts
 * cannot become a parallel authority beside server RequestContext resolution.
 * The business input JSON remains uninterpreted here.
 */
export function matchesAIRequestShapeFloor(request: unknown): request is AIRequestContract {
  if (!isPlainObject(request) || !hasExactRequestKeySet(request)) return false;

  if (
    !isNonEmptyString(request.requestId)
    || !isNonEmptyString(request.capabilityCode)
    || !isNonEmptyString(request.requestContextRef)
    || !isPositiveSafeInteger(request.inputSchemaVersion)
    || !isJsonValue(request.input)
    || typeof request.sensitivityClass !== "string"
    || !SENSITIVITY_CLASSES.has(request.sensitivityClass as AIModelSensitivityCeiling)
    || !isNonEmptyString(request.residencyRequirement)
    || !isNonEmptyString(request.groundingMode)
    || !isNonEmptyString(request.correlationId)
  ) {
    return false;
  }

  if (
    Object.prototype.hasOwnProperty.call(request, "conversationId")
    && !isNonEmptyString(request.conversationId)
  ) {
    return false;
  }
  if (
    Object.prototype.hasOwnProperty.call(request, "requestedOutputSchema")
    && !isJsonValue(request.requestedOutputSchema)
  ) {
    return false;
  }
  if (
    Object.prototype.hasOwnProperty.call(request, "latencyClass")
    && !isNonEmptyString(request.latencyClass)
  ) {
    return false;
  }
  if (
    Object.prototype.hasOwnProperty.call(request, "budgetClass")
    && !isNonEmptyString(request.budgetClass)
  ) {
    return false;
  }
  if (
    Object.prototype.hasOwnProperty.call(request, "allowedSourceScopes")
    && !isNonEmptyStringArray(request.allowedSourceScopes)
  ) {
    return false;
  }

  return true;
}

/**
 * DD-244: immutable canonical projection of the exact DD-09 request fields.
 * This projection does not dereference requestContextRef or grant authority.
 */
export function projectAIRequest(request: unknown): AIRequestContract | null {
  if (!matchesAIRequestShapeFloor(request)) return null;

  return Object.freeze({
    requestId: request.requestId,
    capabilityCode: request.capabilityCode,
    requestContextRef: request.requestContextRef,
    ...(request.conversationId === undefined ? {} : {conversationId: request.conversationId}),
    inputSchemaVersion: request.inputSchemaVersion,
    input: cloneFreezeJson(request.input),
    sensitivityClass: request.sensitivityClass,
    residencyRequirement: request.residencyRequirement,
    groundingMode: request.groundingMode,
    ...(request.requestedOutputSchema === undefined
      ? {}
      : {requestedOutputSchema: cloneFreezeJson(request.requestedOutputSchema)}),
    ...(request.latencyClass === undefined ? {} : {latencyClass: request.latencyClass}),
    ...(request.budgetClass === undefined ? {} : {budgetClass: request.budgetClass}),
    ...(request.allowedSourceScopes === undefined
      ? {}
      : {allowedSourceScopes: Object.freeze([...request.allowedSourceScopes])}),
    correlationId: request.correlationId,
  });
}

/**
 * DD-245: exact DD-09 request capability to DD-225 operation declaration
 * binding only.
 */
export function matchesAIRequestOperationCapabilityFloor(
  request: unknown,
  declaration: AIOperationContractDeclaration,
): boolean {
  return Boolean(
    matchesAIRequestShapeFloor(request)
    && matchesAIOperationContractDeclarationShapeFloor(declaration)
    && request.capabilityCode === declaration.ai.capabilityCode
  );
}

/**
 * DD-246: exact request input-schema version to canonical OperationContract
 * version binding. Actual DTO/schema parsing remains downstream.
 */
export function matchesAIRequestOperationInputSchemaFloor(
  request: unknown,
  declaration: AIOperationContractDeclaration,
): boolean {
  return Boolean(
    matchesAIRequestShapeFloor(request)
    && matchesAIOperationContractDeclarationShapeFloor(declaration)
    && request.inputSchemaVersion === declaration.operation.inputSchemaVersion
  );
}

/**
 * DD-247: combined pre-routing request integrity prerequisite only.
 */
export function matchesAIRequestPreRoutingPrerequisiteFloors(
  request: unknown,
  declaration: AIOperationContractDeclaration,
): boolean {
  return matchesAIRequestShapeFloor(request)
    && matchesAIRequestOperationCapabilityFloor(request, declaration)
    && matchesAIRequestOperationInputSchemaFloor(request, declaration);
}
