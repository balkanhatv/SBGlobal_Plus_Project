import type { RequestContext } from "../context/contracts.js";

export type AITenantConfigSensitivityClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE_PERSONAL"
  | "REGULATED";

export interface PersistedAITenantConfig {
  readonly id: string;
  readonly tenantId: string;
  readonly enabled: boolean;
  readonly allowedCapabilities: readonly string[];
  readonly allowedProviderIds: readonly string[];
  readonly allowedModelIds: readonly string[];
  readonly maxSensitivityClass: AITenantConfigSensitivityClass;
  readonly residencyPolicyId: string;
  readonly monthlyBudgetPolicyRef?: string;
  readonly retentionPolicyId: string;
  readonly promptOverridePolicyId: string;
  readonly version: number;
  readonly updatedAt: string;
}

export interface AITenantConfigReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly tenantConfigId: string;
  }): Promise<PersistedAITenantConfig | null>;
}
