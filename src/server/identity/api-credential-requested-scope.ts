import type {
  ApiCredentialVerificationMaterial,
} from "./api-credential-verification-material.js";
import type {
  MachinePrincipalMetadata,
} from "./machine-principal-metadata.js";

export type ApiCredentialRequestedScopeClass =
  | "PLATFORM_GLOBAL"
  | "TENANT_CORE"
  | "TENANT_INDUSTRY"
  | "EXPLICIT_CROSS_CONTEXT";

export interface ApiCredentialRequestedScopeTarget {
  readonly scopeClass: ApiCredentialRequestedScopeClass;
  readonly tenantId?: string;
  readonly industryContextId?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value: string | undefined): boolean {
  return value === undefined || UUID_PATTERN.test(value);
}

function allValidUuids(values: readonly string[]): boolean {
  return values.every((value) => UUID_PATTERN.test(value));
}

function serviceAllows(
  principal: MachinePrincipalMetadata,
  scopeClass: Exclude<ApiCredentialRequestedScopeClass, "EXPLICIT_CROSS_CONTEXT">,
): boolean {
  if (principal.principalType !== "SERVICE") return principal.principalType === "API_CLIENT";
  return Array.isArray(principal.allowedScopeClasses)
    && principal.allowedScopeClasses.includes(scopeClass);
}

/**
 * Mirrors only persisted API Credential + principal requested-scope
 * compatibility. Lifecycle/current-principal validity, verifier execution,
 * CIDR/profile policy, audit and authentication remain separate.
 */
export function matchesApiCredentialRequestedScopeFloor(
  material: ApiCredentialVerificationMaterial,
  principal: MachinePrincipalMetadata,
  target: ApiCredentialRequestedScopeTarget,
): boolean {
  if (!UUID_PATTERN.test(material.principalId)
    || !UUID_PATTERN.test(principal.id)
    || material.principalId !== principal.id
    || !validUuid(material.tenantId)
    || !validUuid(material.industryContextId)
    || !allValidUuids(material.allowedIndustryContextIds)
    || !validUuid(target.tenantId)
    || !validUuid(target.industryContextId)) {
    return false;
  }

  if (target.scopeClass === "EXPLICIT_CROSS_CONTEXT") return false;

  if (target.scopeClass === "PLATFORM_GLOBAL") {
    return target.tenantId === undefined
      && target.industryContextId === undefined
      && material.tenantId === undefined
      && material.industryContextId === undefined
      && material.allowedIndustryContextIds.length === 0
      && principal.principalType === "SERVICE"
      && serviceAllows(principal, "PLATFORM_GLOBAL");
  }

  if (target.scopeClass === "TENANT_CORE") {
    return target.tenantId !== undefined
      && target.industryContextId === undefined
      && material.tenantId === target.tenantId
      && material.industryContextId === undefined
      && serviceAllows(principal, "TENANT_CORE");
  }

  if (target.scopeClass === "TENANT_INDUSTRY") {
    if (target.tenantId === undefined
      || target.industryContextId === undefined
      || material.tenantId !== target.tenantId
      || !serviceAllows(principal, "TENANT_INDUSTRY")) {
      return false;
    }

    return material.industryContextId !== undefined
      ? material.industryContextId === target.industryContextId
      : material.allowedIndustryContextIds.includes(target.industryContextId);
  }

  return false;
}
