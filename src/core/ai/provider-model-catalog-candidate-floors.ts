import type { AIModelCatalogMetadata, AIModelSensitivityCeiling } from "./model-catalog-metadata.js";
import type { AIProviderCatalogMetadata } from "./provider-catalog-metadata.js";
import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";
import type { AIOperationContractDeclaration } from "./operation-pre-provider-prerequisite-floors.js";
import { matchesAIOperationContractDeclarationShapeFloor } from "./operation-pre-provider-prerequisite-floors.js";
import { matchesAIProvisioningSnapshotProviderAdmissionFloor } from "./provisioning-snapshot-admission-floors.js";
import { matchesAIModelProviderBindingFloors } from "./model-provider-binding-floors.js";

export interface AIOperationProviderModelCatalogCandidateInput {
  readonly declaration: AIOperationContractDeclaration;
  readonly snapshot: PersistedAIProvisioningSnapshot;
  readonly provider: AIProviderCatalogMetadata;
  readonly model: AIModelCatalogMetadata;
  readonly sensitivityClass: unknown;
  readonly authorizedResidencyRegion: unknown;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SENSITIVITY_RANK = new Map<AIModelSensitivityCeiling, number>([
  ["PUBLIC", 1],
  ["INTERNAL", 2],
  ["CONFIDENTIAL", 3],
  ["SENSITIVE_PERSONAL", 4],
  ["REGULATED", 5],
]);

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isStringOrNullArray(value: unknown): value is readonly (string | null)[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => typeof entry === "string" || entry === null);
}

function isKnownSensitivity(value: unknown): value is AIModelSensitivityCeiling {
  return typeof value === "string"
    && SENSITIVITY_RANK.has(value as AIModelSensitivityCeiling);
}

function hasModelIdentity(model: AIModelCatalogMetadata): boolean {
  return Boolean(model && typeof model === "object" && isUuid(model.id));
}

function hasProviderIdentity(provider: AIProviderCatalogMetadata): boolean {
  return Boolean(provider && typeof provider === "object" && isUuid(provider.id));
}

/**
 * DD-231: exact declared capability support by an already snapshot-allowed,
 * raw-ACTIVE Provider. This is a necessary catalog candidate floor only.
 */
export function matchesAIOperationProviderCapabilityCandidateFloor(
  declaration: AIOperationContractDeclaration,
  snapshot: PersistedAIProvisioningSnapshot,
  provider: AIProviderCatalogMetadata,
): boolean {
  if (
    !matchesAIOperationContractDeclarationShapeFloor(declaration)
    || !matchesAIProvisioningSnapshotProviderAdmissionFloor(snapshot, provider)
    || !isStringOrNullArray(provider.supportedCapabilities)
  ) {
    return false;
  }

  return provider.supportedCapabilities.some(
    (entry) => typeof entry === "string" && entry === declaration.ai.capabilityCode,
  );
}

/**
 * DD-232: exact Provider support for an already-authorized residency region.
 * The region's policy authorization is upstream evidence and is not evaluated
 * or widened here.
 */
export function matchesAIProviderAuthorizedRegionCandidateFloor(
  provider: AIProviderCatalogMetadata,
  authorizedResidencyRegion: unknown,
): boolean {
  if (
    !hasProviderIdentity(provider)
    || !isStringOrNullArray(provider.supportedRegions)
    || typeof authorizedResidencyRegion !== "string"
    || authorizedResidencyRegion.length === 0
  ) {
    return false;
  }

  return provider.supportedRegions.some(
    (entry) => typeof entry === "string" && entry === authorizedResidencyRegion,
  );
}

/**
 * DD-233: exact AIModel -> AIProvider binding plus raw ACTIVE Model status.
 * Provider ACTIVE/snapshot membership remains DD-231 ownership.
 */
export function matchesAIModelProviderActiveCandidateFloor(
  model: AIModelCatalogMetadata,
  provider: AIProviderCatalogMetadata,
): boolean {
  return Boolean(
    matchesAIModelProviderBindingFloors(model, provider)
    && typeof model.status === "string"
    && model.status === "ACTIVE"
  );
}

/**
 * DD-234: exact declared capability support in Model catalog evidence.
 */
export function matchesAIModelCapabilityCandidateFloor(
  declaration: AIOperationContractDeclaration,
  model: AIModelCatalogMetadata,
): boolean {
  if (
    !matchesAIOperationContractDeclarationShapeFloor(declaration)
    || !hasModelIdentity(model)
    || !isStringOrNullArray(model.capabilities)
  ) {
    return false;
  }

  return model.capabilities.some(
    (entry) => typeof entry === "string" && entry === declaration.ai.capabilityCode,
  );
}

/**
 * DD-235: request sensitivity must not exceed the Model's source-owned
 * sensitivity ceiling. This does not evaluate tenant data-class policy.
 */
export function matchesAIModelSensitivityCandidateFloor(
  model: AIModelCatalogMetadata,
  sensitivityClass: unknown,
): boolean {
  if (
    !hasModelIdentity(model)
    || !isKnownSensitivity(model.sensitivityCeiling)
    || !isKnownSensitivity(sensitivityClass)
  ) {
    return false;
  }

  const ceiling = SENSITIVITY_RANK.get(model.sensitivityCeiling);
  const requested = SENSITIVITY_RANK.get(sensitivityClass);
  return ceiling !== undefined && requested !== undefined && ceiling >= requested;
}

/**
 * DD-236: exact Model support for an already-authorized residency region.
 */
export function matchesAIModelAuthorizedRegionCandidateFloor(
  model: AIModelCatalogMetadata,
  authorizedResidencyRegion: unknown,
): boolean {
  if (
    !hasModelIdentity(model)
    || !isStringOrNullArray(model.residencyRegions)
    || typeof authorizedResidencyRegion !== "string"
    || authorizedResidencyRegion.length === 0
  ) {
    return false;
  }

  return model.residencyRegions.some(
    (entry) => typeof entry === "string" && entry === authorizedResidencyRegion,
  );
}

/**
 * DD-237: combined Provider/Model catalog-candidate prerequisites only.
 *
 * A true result is not final model eligibility, route selection, fallback,
 * credential authority or provider execution. Model-class mapping, live policy,
 * quota/budget, health/circuit and preference scoring remain separate.
 */
export function matchesAIOperationProviderModelCatalogCandidateFloors(
  input: AIOperationProviderModelCatalogCandidateInput,
): boolean {
  if (!input || typeof input !== "object") return false;

  return matchesAIOperationProviderCapabilityCandidateFloor(
    input.declaration,
    input.snapshot,
    input.provider,
  )
    && matchesAIProviderAuthorizedRegionCandidateFloor(
      input.provider,
      input.authorizedResidencyRegion,
    )
    && matchesAIModelProviderActiveCandidateFloor(
      input.model,
      input.provider,
    )
    && matchesAIModelCapabilityCandidateFloor(
      input.declaration,
      input.model,
    )
    && matchesAIModelSensitivityCandidateFloor(
      input.model,
      input.sensitivityClass,
    )
    && matchesAIModelAuthorizedRegionCandidateFloor(
      input.model,
      input.authorizedResidencyRegion,
    );
}
