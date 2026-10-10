import type { RequestContext } from "../context/contracts.js";
import type { AIPolicyReadPort, PersistedAIPolicy } from "./policy.js";
import type { PersistedAITenantConfig } from "./tenant-config.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function hasTenantTargetContextShape(requestContext: RequestContext): boolean {
  if (!requestContext || typeof requestContext !== "object") return false;

  if (requestContext.scopeClass === "TENANT_CORE") {
    return isUuid(requestContext.tenantId)
      && requestContext.industryContextId === undefined;
  }

  if (requestContext.scopeClass === "TENANT_INDUSTRY") {
    return isUuid(requestContext.tenantId)
      && isUuid(requestContext.industryContextId);
  }

  return false;
}

/**
 * DD-278: validate only persisted AIPolicy identity and owner-shape evidence
 * defined by DD-09 / migration 0011.
 *
 * status, conditionAst and constraint are intentionally not interpreted here.
 */
export function matchesAIPolicyIdentityOwnerShapeFloor(
  policy: PersistedAIPolicy,
): boolean {
  if (
    !policy
    || typeof policy !== "object"
    || !isUuid(policy.id)
    || !isNonEmptyString(policy.code)
    || !Number.isInteger(policy.priority)
    || !["ALLOW", "DENY", "RESTRICT"].includes(policy.effect)
    || !Number.isInteger(policy.version)
    || policy.version <= 0
    || !isNonEmptyString(policy.status)
  ) {
    return false;
  }

  if (policy.ownerScope === "PLATFORM") {
    return policy.tenantId === undefined
      && policy.industryContextId === undefined;
  }

  if (policy.ownerScope === "TENANT") {
    return isUuid(policy.tenantId)
      && policy.industryContextId === undefined;
  }

  if (policy.ownerScope === "INDUSTRY") {
    return isUuid(policy.tenantId)
      && isUuid(policy.industryContextId);
  }

  return false;
}

/**
 * DD-279: mirror migration-0048 definition applicability for a supplied
 * Tenant-scoped RequestContext only.
 *
 * This proves scope applicability, not policy effect, status, AST or
 * constraint evaluation.
 */
export function matchesAIPolicyRequestContextScopeFloor(
  policy: PersistedAIPolicy,
  requestContext: RequestContext,
): boolean {
  if (
    !matchesAIPolicyIdentityOwnerShapeFloor(policy)
    || !hasTenantTargetContextShape(requestContext)
  ) {
    return false;
  }

  if (policy.ownerScope === "PLATFORM") return true;

  if (policy.ownerScope === "TENANT") {
    return policy.tenantId === requestContext.tenantId;
  }

  return requestContext.scopeClass === "TENANT_INDUSTRY"
    && policy.tenantId === requestContext.tenantId
    && policy.industryContextId === requestContext.industryContextId;
}

/**
 * DD-280: exact TenantAIConfig.residencyPolicyId -> supplied AIPolicy.id
 * relationship only.
 */
export function matchesAITenantConfigResidencyPolicyBindingFloor(
  tenantConfig: PersistedAITenantConfig,
  policy: PersistedAIPolicy,
): boolean {
  return Boolean(
    tenantConfig
    && typeof tenantConfig === "object"
    && isUuid(tenantConfig.id)
    && isUuid(tenantConfig.tenantId)
    && isUuid(tenantConfig.residencyPolicyId)
    && matchesAIPolicyIdentityOwnerShapeFloor(policy)
    && policy.id === tenantConfig.residencyPolicyId
  );
}

/**
 * DD-281: supplied RequestContext + TenantAIConfig + AIPolicy relationship
 * coherence only.
 *
 * A true result does not mean ALLOW and does not authorize any residency
 * region.
 */
export function matchesAITenantResidencyPolicyContextBindingFloors(
  requestContext: RequestContext,
  tenantConfig: PersistedAITenantConfig,
  policy: PersistedAIPolicy,
): boolean {
  return hasTenantTargetContextShape(requestContext)
    && isUuid(tenantConfig?.tenantId)
    && requestContext.tenantId === tenantConfig.tenantId
    && matchesAITenantConfigResidencyPolicyBindingFloor(tenantConfig, policy)
    && matchesAIPolicyRequestContextScopeFloor(policy, requestContext);
}

/**
 * DD-282: load exact residency-policy evidence through the existing contextual
 * read port and validate only DD-281 relationship coherence.
 *
 * Dependency errors propagate unchanged. Missing/mismatched evidence returns
 * null. Successful evidence returns the exact loaded policy object unchanged.
 */
export async function loadAITenantResidencyPolicyContextEvidence(
  readPort: AIPolicyReadPort,
  requestContext: RequestContext,
  tenantConfig: PersistedAITenantConfig,
): Promise<PersistedAIPolicy | null> {
  const policy = await readPort.loadForContext({
    requestContext,
    policyId: tenantConfig.residencyPolicyId,
  });

  if (policy === null) return null;

  return matchesAITenantResidencyPolicyContextBindingFloors(
    requestContext,
    tenantConfig,
    policy,
  )
    ? policy
    : null;
}
