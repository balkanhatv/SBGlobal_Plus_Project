import type { JsonObject } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type AIProvisioningApiAccessClass =
  | "INTERNAL_FIRST_PARTY"
  | "TENANT_API"
  | "PARTNER_API"
  | "PUBLIC_DEVELOPER_API";

export type AIProvisioningSnapshotStatus =
  | "ACTIVE"
  | "SUPERSEDED"
  | "REVOKED";

export interface PersistedAIProvisioningSnapshot {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly version: string;
  readonly subscriptionVersion: string;
  readonly entitlementSnapshotVersion: string;
  readonly industryActivationVersion?: string;
  readonly msPackVersions: JsonObject;
  readonly countryPackVersions: JsonObject;
  readonly tenantAiConfigVersion: string;
  readonly allowedCapabilityIds: readonly string[];
  readonly allowedApiClasses: readonly AIProvisioningApiAccessClass[];
  readonly allowedProviderIds: readonly string[];
  readonly allowedModelClasses: readonly string[];
  readonly budgetPolicyRef?: string;
  readonly status: AIProvisioningSnapshotStatus;
  readonly compiledAt: string;
  readonly validUntil?: string;
}

export interface AIProvisioningSnapshotReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly snapshotId: string;
  }): Promise<PersistedAIProvisioningSnapshot | null>;
}
