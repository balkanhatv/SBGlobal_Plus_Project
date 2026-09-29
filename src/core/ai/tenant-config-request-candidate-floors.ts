import type { AIOperationContractDeclaration } from "./operation-pre-provider-prerequisite-floors.js";
import type { AIProviderModelCatalogCandidateRef } from "./provider-model-catalog-pre-candidate-set.js";
import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";
import { matchesAIProvisioningSnapshotTenantConfigFloors } from "./provisioning-snapshot-tenant-config-floors.js";
import type { AIRequestContract } from "./request-pre-routing-floors.js";
import {
  matchesAIRequestPreRoutingPrerequisiteFloors,
  matchesAIRequestShapeFloor,
} from "./request-pre-routing-floors.js";
import type {
  AITenantConfigSensitivityClass,
  PersistedAITenantConfig,
} from "./tenant-config.js";

export interface AITenantConfigConstrainedPreRoutingSetInput {
  readonly request: unknown;
  readonly declaration: AIOperationContractDeclaration;
  readonly snapshot: PersistedAIProvisioningSnapshot;
  readonly tenantConfig: PersistedAITenantConfig;
  readonly candidates: readonly AIProviderModelCatalogCandidateRef[];
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SENSITIVITY_RANK = new Map<AITenantConfigSensitivityClass, number>([
  ["PUBLIC", 1],
  ["INTERNAL", 2],
  ["CONFIDENTIAL", 3],
  ["SENSITIVE_PERSONAL", 4],
  ["REGULATED", 5],
]);

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

function hasConfigIdentity(config: PersistedAITenantConfig): boolean {
  return Boolean(
    config
    && typeof config === "object"
    && isUuid(config.id)
    && isUuid(config.tenantId),
  );
}

function isKnownSensitivity(value: unknown): value is AITenantConfigSensitivityClass {
  return typeof value === "string"
    && SENSITIVITY_RANK.has(value as AITenantConfigSensitivityClass);
}

/**
 * DD-248: exact AIRequest capability membership in the supplied TenantAIConfig
 * capability allowlist only. This does not select/currentize the config or
 * evaluate entitlement/policy.
 */
export function matchesAIRequestTenantConfigCapabilityFloor(
  request: unknown,
  tenantConfig: PersistedAITenantConfig,
): boolean {
  if (
    !matchesAIRequestShapeFloor(request)
    || !hasConfigIdentity(tenantConfig)
    || !isStringSet(tenantConfig.allowedCapabilities)
  ) {
    return false;
  }

  return tenantConfig.allowedCapabilities.includes(request.capabilityCode);
}

/**
 * DD-249: request sensitivity may not exceed the supplied TenantAIConfig
 * max-sensitivity ceiling. This is not a full data-class/redaction policy.
 */
export function matchesAIRequestTenantConfigSensitivityFloor(
  request: unknown,
  tenantConfig: PersistedAITenantConfig,
): boolean {
  if (
    !matchesAIRequestShapeFloor(request)
    || !hasConfigIdentity(tenantConfig)
    || !isKnownSensitivity(tenantConfig.maxSensitivityClass)
  ) {
    return false;
  }

  const requestRank = SENSITIVITY_RANK.get(request.sensitivityClass);
  const ceilingRank = SENSITIVITY_RANK.get(tenantConfig.maxSensitivityClass);
  return requestRank !== undefined
    && ceilingRank !== undefined
    && ceilingRank >= requestRank;
}

/**
 * DD-250: combines request/declaration integrity with the exact snapshot-bound
 * enabled TenantAIConfig and its capability/sensitivity prerequisites.
 *
 * A true result still does not select latest/effective config or authorize a
 * route/provider execution.
 */
export function matchesAIRequestTenantConfigPrerequisiteFloors(
  request: unknown,
  declaration: AIOperationContractDeclaration,
  snapshot: PersistedAIProvisioningSnapshot,
  tenantConfig: PersistedAITenantConfig,
): boolean {
  return matchesAIRequestPreRoutingPrerequisiteFloors(request, declaration)
    && matchesAIProvisioningSnapshotTenantConfigFloors(snapshot, tenantConfig)
    && matchesAIRequestTenantConfigCapabilityFloor(request, tenantConfig)
    && matchesAIRequestTenantConfigSensitivityFloor(request, tenantConfig);
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
 * DD-251: filter already-built DD-242 pre-candidate refs through the supplied
 * TenantAIConfig Provider+Model allowlists.
 *
 * null => malformed evidence.
 * []   => valid evidence but no Tenant-config-allowed pair survives.
 *
 * Lexical ordering is serialization determinism only, not route preference.
 */
export function filterAITenantConfigProviderModelPreCandidates(
  candidates: readonly AIProviderModelCatalogCandidateRef[],
  tenantConfig: PersistedAITenantConfig,
): readonly AIProviderModelCatalogCandidateRef[] | null {
  if (
    !hasConfigIdentity(tenantConfig)
    || !isUuidSet(tenantConfig.allowedProviderIds)
    || !isUuidSet(tenantConfig.allowedModelIds)
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

  const allowedProviders = new Set(tenantConfig.allowedProviderIds);
  const allowedModels = new Set(tenantConfig.allowedModelIds);
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
 * DD-252: combine exact request/Tenant-config prerequisites with Tenant-config
 * narrowing of an already-built DD-242 catalog pre-candidate set.
 *
 * The returned set is still pre-routing evidence only. It carries no score,
 * fallback, credential, policy decision or execution authority.
 */
export function buildAITenantConfigConstrainedPreRoutingSet(
  input: AITenantConfigConstrainedPreRoutingSetInput,
): readonly AIProviderModelCatalogCandidateRef[] | null {
  if (!input || typeof input !== "object") return null;

  if (!matchesAIRequestTenantConfigPrerequisiteFloors(
    input.request,
    input.declaration,
    input.snapshot,
    input.tenantConfig,
  )) {
    return null;
  }

  return filterAITenantConfigProviderModelPreCandidates(
    input.candidates,
    input.tenantConfig,
  );
}

// Keep the source-owned request type visible to downstream TypeScript users
// without adding a second request contract.
export type { AIRequestContract };
