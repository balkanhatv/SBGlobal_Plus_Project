import type { PersistedTenantCountryPackActivation } from "../config/tenant-country-pack-activation.js";
import type { AIOperationContractDeclaration } from "./operation-pre-provider-prerequisite-floors.js";
import type { PersistedAIIndustryConfig } from "./industry-config.js";
import { matchesAIIndustryConfigCountryPackActivationFloors } from "./industry-config-country-pack-activation-floors.js";
import { matchesAIIndustryConfigDomainPromptSetBindingFloors } from "./industry-config-prompt-set-binding-floors.js";
import {
  buildAIIndustryConfigConstrainedPreRoutingSet,
  matchesAIIndustryConfigSnapshotScopeFloor,
  matchesAIRequestIndustryConfigPrerequisiteFloors,
} from "./industry-config-request-candidate-floors.js";
import { matchesAIIndustryConfigTenantNonWideningFloors } from "./industry-config-tenant-non-widening-floors.js";
import type { PersistedAIPromptSet } from "./prompt-set.js";
import type { AIProviderModelCatalogCandidateRef } from "./provider-model-catalog-pre-candidate-set.js";
import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";
import type { PersistedAITenantConfig } from "./tenant-config.js";

export interface AIIndustryConfigRelationshipConstrainedPreRoutingSetInput {
  readonly request: unknown;
  readonly declaration: AIOperationContractDeclaration;
  readonly snapshot: PersistedAIProvisioningSnapshot;
  readonly tenantConfig: PersistedAITenantConfig;
  readonly industryConfig: PersistedAIIndustryConfig;
  readonly promptSet?: PersistedAIPromptSet;
  readonly activations: readonly PersistedTenantCountryPackActivation[];
  readonly candidates: readonly AIProviderModelCatalogCandidateRef[];
}

export function matchesAIIndustryConfigTenantPromptSetRelationshipFloors(
  industryConfig: PersistedAIIndustryConfig,
  tenantConfig: PersistedAITenantConfig,
  promptSet?: PersistedAIPromptSet,
): boolean {
  return matchesAIIndustryConfigTenantNonWideningFloors(
    industryConfig,
    tenantConfig,
  )
    && matchesAIIndustryConfigDomainPromptSetBindingFloors(
      industryConfig,
      promptSet,
    );
}

export function matchesAIIndustryConfigRelationshipFloors(
  industryConfig: PersistedAIIndustryConfig,
  tenantConfig: PersistedAITenantConfig,
  promptSet: PersistedAIPromptSet | undefined,
  activations: readonly PersistedTenantCountryPackActivation[],
): boolean {
  return matchesAIIndustryConfigTenantPromptSetRelationshipFloors(
    industryConfig,
    tenantConfig,
    promptSet,
  )
    && matchesAIIndustryConfigCountryPackActivationFloors(
      industryConfig,
      activations,
    );
}

export function matchesAIIndustryConfigSnapshotRelationshipFloors(
  snapshot: PersistedAIProvisioningSnapshot,
  industryConfig: PersistedAIIndustryConfig,
  tenantConfig: PersistedAITenantConfig,
  promptSet: PersistedAIPromptSet | undefined,
  activations: readonly PersistedTenantCountryPackActivation[],
): boolean {
  return matchesAIIndustryConfigSnapshotScopeFloor(snapshot, industryConfig)
    && matchesAIIndustryConfigRelationshipFloors(
      industryConfig,
      tenantConfig,
      promptSet,
      activations,
    );
}

export function matchesAIRequestIndustryConfigRelationshipPrerequisiteFloors(
  request: unknown,
  declaration: AIOperationContractDeclaration,
  snapshot: PersistedAIProvisioningSnapshot,
  tenantConfig: PersistedAITenantConfig,
  industryConfig: PersistedAIIndustryConfig,
  promptSet: PersistedAIPromptSet | undefined,
  activations: readonly PersistedTenantCountryPackActivation[],
): boolean {
  return matchesAIRequestIndustryConfigPrerequisiteFloors(
    request,
    declaration,
    snapshot,
    tenantConfig,
    industryConfig,
  )
    && matchesAIIndustryConfigRelationshipFloors(
      industryConfig,
      tenantConfig,
      promptSet,
      activations,
    );
}

export function buildAIIndustryConfigRelationshipConstrainedPreRoutingSet(
  input: AIIndustryConfigRelationshipConstrainedPreRoutingSetInput,
): readonly AIProviderModelCatalogCandidateRef[] | null {
  if (!input || typeof input !== "object") return null;

  const candidates = buildAIIndustryConfigConstrainedPreRoutingSet({
    request: input.request,
    declaration: input.declaration,
    snapshot: input.snapshot,
    tenantConfig: input.tenantConfig,
    industryConfig: input.industryConfig,
    candidates: input.candidates,
  });
  if (candidates === null) return null;

  if (!matchesAIRequestIndustryConfigRelationshipPrerequisiteFloors(
    input.request,
    input.declaration,
    input.snapshot,
    input.tenantConfig,
    input.industryConfig,
    input.promptSet,
    input.activations,
  )) {
    return null;
  }

  return candidates;
}
