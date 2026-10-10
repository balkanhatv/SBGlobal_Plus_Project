import type { RequestContext } from "../context/contracts.js";
import type { PersistedTenantCountryPackActivation } from "../config/tenant-country-pack-activation.js";
import type { AICapabilityCatalogMetadata } from "./capability-catalog-metadata.js";
import type { PersistedAIIndustryConfig } from "./industry-config.js";
import {
  buildAIIndustryConfigRelationshipConstrainedPreRoutingSet,
  matchesAIRequestIndustryConfigRelationshipPrerequisiteFloors,
} from "./industry-config-relationship-pre-routing-floors.js";
import type {
  AIOperationContractDeclaration,
} from "./operation-pre-provider-prerequisite-floors.js";
import {
  matchesAIOperationPreProviderPrerequisiteFloors,
} from "./operation-pre-provider-prerequisite-floors.js";
import type { PersistedAIPromptSet } from "./prompt-set.js";
import type { AIProviderModelCatalogCandidateRef } from "./provider-model-catalog-pre-candidate-set.js";
import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";
import { matchesAIRequestPreRoutingPrerequisiteFloors } from "./request-pre-routing-floors.js";
import type { PersistedAITenantConfig } from "./tenant-config.js";

export interface AIIndustryGatewayRelationshipPreRoutingSetInput {
  readonly request: unknown;
  readonly declaration: AIOperationContractDeclaration;
  readonly requestContext: RequestContext;
  readonly snapshot: PersistedAIProvisioningSnapshot;
  readonly capability: AICapabilityCatalogMetadata;
  readonly tenantConfig: PersistedAITenantConfig;
  readonly industryConfig: PersistedAIIndustryConfig;
  readonly promptSet?: PersistedAIPromptSet;
  readonly activations: readonly PersistedTenantCountryPackActivation[];
  readonly candidates: readonly AIProviderModelCatalogCandidateRef[];
  readonly evaluatedAt: unknown;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * DD-263: exact supplied verified TENANT_INDUSTRY RequestContext ->
 * Industry-scoped ProvisioningSnapshot Tenant + Industry Context relation.
 *
 * This does not authenticate/resolve RequestContext, select the current
 * snapshot, inspect permissions, or dereference AIRequest.requestContextRef.
 */
export function matchesAIRequestContextIndustrySnapshotScopeFloor(
  requestContext: RequestContext,
  snapshot: PersistedAIProvisioningSnapshot,
): boolean {
  return Boolean(
    requestContext
    && typeof requestContext === "object"
    && requestContext.scopeClass === "TENANT_INDUSTRY"
    && isUuid(requestContext.tenantId)
    && isUuid(requestContext.industryContextId)
    && snapshot
    && typeof snapshot === "object"
    && isUuid(snapshot.id)
    && isUuid(snapshot.tenantId)
    && isUuid(snapshot.industryContextId)
    && requestContext.tenantId === snapshot.tenantId
    && requestContext.industryContextId === snapshot.industryContextId
  );
}

/**
 * DD-264: compose DD-263 exact supplied Industry context/snapshot scope with
 * DD-230's already-governed operation snapshot/API/capability admission.
 *
 * A true result is not authentication, authorization or policy approval.
 */
export function matchesAIIndustryOperationGatewayAdmissionFloors(
  declaration: AIOperationContractDeclaration,
  requestContext: RequestContext,
  snapshot: PersistedAIProvisioningSnapshot,
  capability: AICapabilityCatalogMetadata,
  evaluatedAt: unknown,
): boolean {
  return matchesAIRequestContextIndustrySnapshotScopeFloor(
    requestContext,
    snapshot,
  )
    && matchesAIOperationPreProviderPrerequisiteFloors({
      declaration,
      requestContext,
      snapshot,
      capability,
      evaluatedAt,
    });
}

/**
 * DD-265: combine the exact DD-247 AIRequest integrity prerequisite with the
 * supplied Industry operation gateway-admission prerequisite.
 *
 * AIRequest.requestContextRef remains uninterpreted because RequestContext has
 * no authoritative reference id contract to bind here.
 */
export function matchesAIRequestIndustryGatewayAdmissionFloors(
  request: unknown,
  declaration: AIOperationContractDeclaration,
  requestContext: RequestContext,
  snapshot: PersistedAIProvisioningSnapshot,
  capability: AICapabilityCatalogMetadata,
  evaluatedAt: unknown,
): boolean {
  return matchesAIRequestPreRoutingPrerequisiteFloors(request, declaration)
    && matchesAIIndustryOperationGatewayAdmissionFloors(
      declaration,
      requestContext,
      snapshot,
      capability,
      evaluatedAt,
    );
}

/**
 * DD-266: compose DD-265 supplied verified-context admission with DD-261's
 * relationship-complete request/Tenant/Industry configuration prerequisites.
 */
export function matchesAIRequestIndustryGatewayRelationshipPrerequisiteFloors(
  request: unknown,
  declaration: AIOperationContractDeclaration,
  requestContext: RequestContext,
  snapshot: PersistedAIProvisioningSnapshot,
  capability: AICapabilityCatalogMetadata,
  tenantConfig: PersistedAITenantConfig,
  industryConfig: PersistedAIIndustryConfig,
  promptSet: PersistedAIPromptSet | undefined,
  activations: readonly PersistedTenantCountryPackActivation[],
  evaluatedAt: unknown,
): boolean {
  return matchesAIRequestIndustryGatewayAdmissionFloors(
    request,
    declaration,
    requestContext,
    snapshot,
    capability,
    evaluatedAt,
  )
    && matchesAIRequestIndustryConfigRelationshipPrerequisiteFloors(
      request,
      declaration,
      snapshot,
      tenantConfig,
      industryConfig,
      promptSet,
      activations,
    );
}

/**
 * DD-267: retain the immutable DD-262 candidate refs only when the complete
 * supplied Industry Gateway context/admission prerequisites also pass.
 *
 * The result remains non-ranking pre-routing evidence only.
 */
export function buildAIIndustryGatewayRelationshipPreRoutingSet(
  input: AIIndustryGatewayRelationshipPreRoutingSetInput,
): readonly AIProviderModelCatalogCandidateRef[] | null {
  if (!input || typeof input !== "object") return null;

  const candidates = buildAIIndustryConfigRelationshipConstrainedPreRoutingSet({
    request: input.request,
    declaration: input.declaration,
    snapshot: input.snapshot,
    tenantConfig: input.tenantConfig,
    industryConfig: input.industryConfig,
    promptSet: input.promptSet,
    activations: input.activations,
    candidates: input.candidates,
  });
  if (candidates === null) return null;

  if (!matchesAIRequestIndustryGatewayRelationshipPrerequisiteFloors(
    input.request,
    input.declaration,
    input.requestContext,
    input.snapshot,
    input.capability,
    input.tenantConfig,
    input.industryConfig,
    input.promptSet,
    input.activations,
    input.evaluatedAt,
  )) {
    return null;
  }

  return candidates;
}
