import type { OperationContract } from "../api/operation-contract.js";
import type { RequestContext, ScopeClass } from "../context/contracts.js";
import type { AICapabilityCatalogMetadata } from "./capability-catalog-metadata.js";
import type {
  AIProvisioningApiAccessClass,
  PersistedAIProvisioningSnapshot,
} from "./provisioning-snapshot.js";
import {
  matchesAIProvisioningSnapshotApiClassAdmissionFloor,
  matchesAIProvisioningSnapshotCapabilityAdmissionFloor,
  matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor,
} from "./provisioning-snapshot-admission-floors.js";

export interface AIOperationMetadata {
  readonly apiAccessClass: AIProvisioningApiAccessClass;
  readonly capabilityCode: string;
  readonly streamingMode: string;
  readonly dataClassCeiling: string;
  readonly residencyPolicyRef: string;
}

export interface AIOperationContractDeclaration {
  readonly operation: OperationContract;
  readonly ai: AIOperationMetadata;
}

export interface ProjectedAIOperationContractDeclaration {
  readonly apiAccessClass: AIProvisioningApiAccessClass;
  readonly capabilityCode: string;
  readonly requiredEntitlement?: string;
  readonly requiredPermission: string;
  readonly scopeClass: ScopeClass;
  readonly requestSchemaVersion: number;
  readonly responseSchemaVersion: number;
  readonly streamingMode: string;
  readonly ratePolicyRef: string;
  readonly dataClassCeiling: string;
  readonly residencyPolicyRef: string;
  readonly auditClass: string;
}

export interface AIOperationPreProviderPrerequisiteInput {
  readonly declaration: AIOperationContractDeclaration;
  readonly requestContext: RequestContext;
  readonly snapshot: PersistedAIProvisioningSnapshot;
  readonly capability: AICapabilityCatalogMetadata;
  readonly evaluatedAt: unknown;
}

const API_CLASSES = new Set<AIProvisioningApiAccessClass>([
  "INTERNAL_FIRST_PARTY",
  "TENANT_API",
  "PARTNER_API",
  "PUBLIC_DEVELOPER_API",
]);
const SCOPE_CLASSES = new Set<ScopeClass>([
  "PLATFORM_GLOBAL",
  "TENANT_CORE",
  "TENANT_INDUSTRY",
  "EXPLICIT_CROSS_CONTEXT",
  "PUBLIC",
]);
const OPERATION_KINDS = new Set(["COMMAND", "QUERY"]);
const IDEMPOTENCY_POLICIES = new Set(["NONE", "OPTIONAL", "REQUIRED"]);

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isDenseStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && Array.from(value).every((entry) => isString(entry));
}

function isApiClass(value: unknown): value is AIProvisioningApiAccessClass {
  return isString(value) && API_CLASSES.has(value as AIProvisioningApiAccessClass);
}

function isScopeClass(value: unknown): value is ScopeClass {
  return isString(value) && SCOPE_CLASSES.has(value as ScopeClass);
}

function matchesCoreOperationShape(operation: OperationContract): boolean {
  if (!operation || typeof operation !== "object") return false;
  return Boolean(
    isString(operation.operationId)
    && isString(operation.module)
    && isScopeClass(operation.scopeClass)
    && isString(operation.kind)
    && OPERATION_KINDS.has(operation.kind)
    && isString(operation.permissionCode)
    && (
      operation.entitlementRequirement === undefined
      || isString(operation.entitlementRequirement)
    )
    && isPositiveInteger(operation.inputSchemaVersion)
    && isPositiveInteger(operation.outputSchemaVersion)
    && (
      operation.resourceResolver === undefined
      || isString(operation.resourceResolver)
    )
    && isString(operation.idempotencyPolicy)
    && IDEMPOTENCY_POLICIES.has(operation.idempotencyPolicy)
    && isString(operation.rateClass)
    && isString(operation.auditClass)
    && isString(operation.domainService)
    && isDenseStringArray(operation.emittedEvents)
    && isDenseStringArray(operation.errorCodes)
  );
}

/**
 * DD-225: validates only the canonical Core OperationContract shape plus the
 * five AI-only DD-09 declaration fields. It does not authorize the operation.
 */
export function matchesAIOperationContractDeclarationShapeFloor(
  declaration: AIOperationContractDeclaration,
): boolean {
  if (!declaration || typeof declaration !== "object") return false;
  const ai = declaration.ai;
  return Boolean(
    matchesCoreOperationShape(declaration.operation)
    && ai
    && typeof ai === "object"
    && isApiClass(ai.apiAccessClass)
    && isString(ai.capabilityCode)
    && isString(ai.streamingMode)
    && isString(ai.dataClassCeiling)
    && isString(ai.residencyPolicyRef)
  );
}

/**
 * DD-226: deterministically projects DD-09's complete declared AI operation
 * fields without creating duplicate permission/entitlement/scope/schema/rate/
 * audit authorities.
 */
export function projectAIOperationContractDeclaration(
  declaration: AIOperationContractDeclaration,
): ProjectedAIOperationContractDeclaration | null {
  if (!matchesAIOperationContractDeclarationShapeFloor(declaration)) {
    return null;
  }

  const {operation, ai} = declaration;
  return Object.freeze({
    apiAccessClass: ai.apiAccessClass,
    capabilityCode: ai.capabilityCode,
    ...(operation.entitlementRequirement === undefined
      ? {}
      : {requiredEntitlement: operation.entitlementRequirement}),
    requiredPermission: operation.permissionCode,
    scopeClass: operation.scopeClass,
    requestSchemaVersion: operation.inputSchemaVersion,
    responseSchemaVersion: operation.outputSchemaVersion,
    streamingMode: ai.streamingMode,
    ratePolicyRef: operation.rateClass,
    dataClassCeiling: ai.dataClassCeiling,
    residencyPolicyRef: ai.residencyPolicyRef,
    auditClass: operation.auditClass,
  });
}

/**
 * DD-227: exact declared/request scope equality only. The RequestContext must
 * already have been resolved/verified by DD-02/DD-03; this helper does not
 * authenticate, enrich or authorize it.
 */
export function matchesAIOperationRequestContextScopeFloor(
  declaration: AIOperationContractDeclaration,
  requestContext: RequestContext,
): boolean {
  return Boolean(
    matchesAIOperationContractDeclarationShapeFloor(declaration)
    && requestContext
    && typeof requestContext === "object"
    && isScopeClass(requestContext.scopeClass)
    && requestContext.scopeClass === declaration.operation.scopeClass
  );
}

/**
 * DD-228: composes only DD-220 current-lifecycle and DD-221 exact API-class
 * snapshot prerequisites for the declared AI API class.
 */
export function matchesAIOperationSnapshotAdmissionFloor(
  declaration: AIOperationContractDeclaration,
  snapshot: PersistedAIProvisioningSnapshot,
  evaluatedAt: unknown,
): boolean {
  return Boolean(
    matchesAIOperationContractDeclarationShapeFloor(declaration)
    && matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor(snapshot, evaluatedAt)
    && matchesAIProvisioningSnapshotApiClassAdmissionFloor(
      snapshot,
      declaration.ai.apiAccessClass,
    )
  );
}

/**
 * DD-229: binds the declared capability code to exact ACTIVE capability
 * evidence already admitted by DD-222.
 */
export function matchesAIOperationCapabilityAdmissionFloor(
  declaration: AIOperationContractDeclaration,
  snapshot: PersistedAIProvisioningSnapshot,
  capability: AICapabilityCatalogMetadata,
): boolean {
  return Boolean(
    matchesAIOperationContractDeclarationShapeFloor(declaration)
    && capability
    && typeof capability === "object"
    && declaration.ai.capabilityCode === capability.code
    && matchesAIProvisioningSnapshotCapabilityAdmissionFloor(snapshot, capability)
  );
}

/**
 * DD-230: combined pre-provider prerequisite floor only.
 *
 * A true result means the request may continue into still-required live
 * authorization, policy, quota, sensitivity/residency and routing stages.
 * It is not provider/model eligibility and is never execution authority.
 */
export function matchesAIOperationPreProviderPrerequisiteFloors(
  input: AIOperationPreProviderPrerequisiteInput,
): boolean {
  if (!input || typeof input !== "object") return false;
  return matchesAIOperationContractDeclarationShapeFloor(input.declaration)
    && matchesAIOperationRequestContextScopeFloor(
      input.declaration,
      input.requestContext,
    )
    && matchesAIOperationSnapshotAdmissionFloor(
      input.declaration,
      input.snapshot,
      input.evaluatedAt,
    )
    && matchesAIOperationCapabilityAdmissionFloor(
      input.declaration,
      input.snapshot,
      input.capability,
    );
}
