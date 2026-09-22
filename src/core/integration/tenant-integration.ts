import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type TenantIntegrationScopeClass = "TENANT_CORE" | "TENANT_INDUSTRY";

export type TenantIntegrationStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "ERROR"
  | "REVOKED";

export type IntegrationHealthState =
  | "UNKNOWN"
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "AUTH_ERROR"
  | "RATE_LIMITED"
  | "POLICY_BLOCKED";

export interface PersistedTenantIntegration {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly integrationDefinitionId: string;
  readonly scopeClass: TenantIntegrationScopeClass;
  readonly displayName: string;
  readonly status: TenantIntegrationStatus;
  readonly credentialReferenceId: string;
  readonly config: JsonValue;
  readonly enabledCapabilities: readonly string[];
  readonly permissionProfileId?: string;
  readonly healthState: IntegrationHealthState;
  readonly lastHealthAt?: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TenantIntegrationReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly tenantIntegrationId: string;
  }): Promise<PersistedTenantIntegration | null>;
}
