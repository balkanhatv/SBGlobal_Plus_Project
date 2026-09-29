import type { AIOperationContractDeclaration } from "./operation-pre-provider-prerequisite-floors.js";
import type { AIProviderModelCatalogCandidateRef } from "./provider-model-catalog-pre-candidate-set.js";
import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";
import type { PersistedAIIndustryConfig } from "./industry-config.js";
import { matchesAIIndustryConfigTenantNonWideningFloors } from "./industry-config-tenant-non-widening-floors.js";
import type { PersistedAITenantConfig } from "./tenant-config.js";
import {
  buildAITenantConfigConstrainedPreRoutingSet,
  matchesAIRequestTenantConfigPrerequisiteFloors,
} from "./tenant-config-request-candidate-floors.js";
import { matchesAIRequestShapeFloor } from "./request-pre-routing-floors.js";

export interface AIIndustryConfigConstrainedPreRoutingSetInput {
  readonly request: unknown;
  readonly declaration: AIOperationContractDeclaration;
  readonly snapshot: PersistedAIProvisioningSnapshot;
  readonly tenantConfig: PersistedAITenantConfig;
  readonly industryConfig: PersistedAIIndustryConfig;
  readonly candidates: readonly AIProviderModelCatalogCandidateRef[];
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isStringSet(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => typeof entry === "string")
    && new Set(value).size === value.length;
}

function isUuidSet(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => isUuid(entry))
    && new Set(value).size === value.length;
}

function hasIndustryConfigIdentityAndEnablement(
  config: PersistedAIIndustryConfig,
): boolean {
  return Boolean(
    config
    && typeof config === "object"
    && isUuid(config.id)
    && isUuid(config.tenantId)
    && isUuid(config.industryContextId)
    && typeof config.enabled === "boolean",
  );
}

function hasIndustrySnapshotScope(
  snapshot: PersistedAIProvisioningSnapshot,
): boolean {
  return Boolean(
    snapshot
    && typeof snapshot === "object"
    && isUuid(snapshot.id)
    && isUuid(snapshot.tenantId)
    && isUuid(snapshot.industryContextId),
  );
}

/**
 * DD-253: supplied IndustryAIConfig must be enabled and exactly match the
 * supplied Industry-scoped ProvisioningSnapshot Tenant + Industry Context.
 *
 * This does not bind an IndustryAIConfig version or select current/latest
 * configuration.
 */
export function matchesAIIndustryConfigSnapshotScopeFloor(
  snapshot: PersistedAIProvisioningSnapshot,
  industryConfig: PersistedAIIndustryConfig,
): boolean {
  return Boolean(
    hasIndustrySnapshotScope(snapshot)
    && hasIndustryConfigIdentityAndEnablement(industryConfig)
    && industryConfig.enabled === true
    && snapshot.tenantId === industryConfig.tenantId
    && snapshot.industryContextId === industryConfig.industryContextId
  );
}

/**
 * DD-254: exact request capability membership in the supplied IndustryAIConfig
 * capability allowlist only.
 */
export function matchesAIRequestIndustryConfigCapabilityFloor(
  request: unknown,
  industryConfig: PersistedAIIndustryConfig,
): boolean {
  if (
    !matchesAIRequestShapeFloor(request)
    || !hasIndustryConfigIdentityAndEnablement(industryConfig)
    || !isStringSet(industryConfig.allowedCapabilities)
  ) {
    return false;
  }

  return industryConfig.allowedCapabilities.includes(request.capabilityCode);
}

function hasCandidateRefShape(candidate: AIProviderModelCatalogCandidateRef): boolean {
  return Boolean(
    candidate
    && typeof candidate === "object"
    && isUuid(candidate.providerId)
    && isUuid(candidate.modelId),
  );
}

/**
 * DD-255: narrow an already Tenant-constrained Provider/Model pre-candidate set
 * through exact IndustryAIConfig Provider + Model allowlists.
 *
 * null => malformed evidence.
 * []   => valid evidence but no Industry-config-allowed pair survives.
 *
 * Lexical ordering is serialization determinism only, not route preference.
 */
export function filterAIIndustryConfigProviderModelPreCandidates(
  candidates: readonly AIProviderModelCatalogCandidateRef[],
  industryConfig: PersistedAIIndustryConfig,
): readonly AIProviderModelCatalogCandidateRef[] | null {
  if (
    !hasIndustryConfigIdentityAndEnablement(industryConfig)
    || !isUuidSet(industryConfig.allowedProviderIds)
    || !isUuidSet(industryConfig.allowedModelIds)
    || !Array.isArray(candidates)
    || !Array.from(candidates).every((candidate) => hasCandidateRefShape(candidate))
  ) {
    return null;
  }

  const seen = new Set<string>();
  for (const candidate of candidates) {
    const key = `${candidate.providerId}:${candidate.modelId}`;
    if (seen.has(key)) return null;
    seen.add(key);
  }

  const allowedProviders = new Set(industryConfig.allowedProviderIds);
  const allowedModels = new Set(industryConfig.allowedModelIds);
  const projected = candidates
    .filter((candidate) =>
      allowedProviders.has(candidate.providerId)
      && allowedModels.has(candidate.modelId))
    .map((candidate) => Object.freeze({
      providerId: candidate.providerId,
      modelId: candidate.modelId,
    }))
    .sort((left, right) =>
      left.providerId.localeCompare(right.providerId)
      || left.modelId.localeCompare(right.modelId));

  return Object.freeze(projected);
}

/**
 * DD-256: bind the request to the supplied snapshot-bound TenantAIConfig and
 * the supplied non-widening, enabled, exact-scope IndustryAIConfig.
 *
 * A true result does not select current/latest/effective configuration and does
 * not authorize routing or execution.
 */
export function matchesAIRequestIndustryConfigPrerequisiteFloors(
  request: unknown,
  declaration: AIOperationContractDeclaration,
  snapshot: PersistedAIProvisioningSnapshot,
  tenantConfig: PersistedAITenantConfig,
  industryConfig: PersistedAIIndustryConfig,
): boolean {
  return matchesAIRequestTenantConfigPrerequisiteFloors(
    request,
    declaration,
    snapshot,
    tenantConfig,
  )
    && matchesAIIndustryConfigTenantNonWideningFloors(
      industryConfig,
      tenantConfig,
    )
    && matchesAIIndustryConfigSnapshotScopeFloor(
      snapshot,
      industryConfig,
    )
    && matchesAIRequestIndustryConfigCapabilityFloor(
      request,
      industryConfig,
    );
}

/**
 * DD-257: combine the DD-252 Tenant-config-constrained pre-routing set with the
 * supplied IndustryAIConfig prerequisites and Industry Provider/Model
 * allowlists.
 *
 * The returned set remains pre-routing evidence only. It carries no score,
 * fallback, credential, policy decision or execution authority.
 */
export function buildAIIndustryConfigConstrainedPreRoutingSet(
  input: AIIndustryConfigConstrainedPreRoutingSetInput,
): readonly AIProviderModelCatalogCandidateRef[] | null {
  if (!input || typeof input !== "object") return null;

  if (!matchesAIRequestIndustryConfigPrerequisiteFloors(
    input.request,
    input.declaration,
    input.snapshot,
    input.tenantConfig,
    input.industryConfig,
  )) {
    return null;
  }

  const tenantCandidates = buildAITenantConfigConstrainedPreRoutingSet({
    request: input.request,
    declaration: input.declaration,
    snapshot: input.snapshot,
    tenantConfig: input.tenantConfig,
    candidates: input.candidates,
  });
  if (tenantCandidates === null) return null;

  return filterAIIndustryConfigProviderModelPreCandidates(
    tenantCandidates,
    input.industryConfig,
  );
}
