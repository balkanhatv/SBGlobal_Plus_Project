import type { AIModelCatalogMetadata } from "./model-catalog-metadata.js";
import type { AIProviderCatalogMetadata } from "./provider-catalog-metadata.js";
import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";
import type { AIOperationContractDeclaration } from "./operation-pre-provider-prerequisite-floors.js";
import {
  matchesAIOperationProviderModelCatalogCandidateFloors,
} from "./provider-model-catalog-candidate-floors.js";
import { matchesAIModelProviderBindingFloors } from "./model-provider-binding-floors.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export interface AIProviderModelCatalogCandidateRef {
  readonly providerId: string;
  readonly modelId: string;
}

export interface AIOperationProviderModelCatalogPreCandidateSetInput {
  readonly declaration: AIOperationContractDeclaration;
  readonly snapshot: PersistedAIProvisioningSnapshot;
  readonly providers: readonly AIProviderCatalogMetadata[];
  readonly models: readonly AIModelCatalogMetadata[];
  readonly sensitivityClass: unknown;
  readonly authorizedResidencyRegion: unknown;
}

function denseArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => entry !== undefined);
}

/**
 * DD-238: fail-closed hygiene for an already-loaded finite Provider/Model
 * evidence set. Identity uniqueness and exact Model.providerId resolution are
 * required before any pair can become a catalog pre-candidate.
 */
export function matchesAIProviderModelCatalogEvidenceSetFloor(
  providers: readonly AIProviderCatalogMetadata[],
  models: readonly AIModelCatalogMetadata[],
): boolean {
  if (!denseArray(providers) || !denseArray(models)) return false;

  const providerIds = new Set<string>();
  for (const provider of providers) {
    if (!provider || typeof provider !== "object" || !validUuid(provider.id)) {
      return false;
    }
    if (providerIds.has(provider.id)) return false;
    providerIds.add(provider.id);
  }

  const modelIds = new Set<string>();
  for (const model of models) {
    if (
      !model
      || typeof model !== "object"
      || !validUuid(model.id)
      || !validUuid(model.providerId)
    ) {
      return false;
    }
    if (modelIds.has(model.id)) return false;
    modelIds.add(model.id);
    if (!providerIds.has(model.providerId)) return false;
  }

  return true;
}

/**
 * DD-239: immutable exact pair projection only. No score, preference, fallback,
 * credential or execution metadata is carried.
 */
export function projectAIProviderModelCatalogPair(
  model: AIModelCatalogMetadata,
  provider: AIProviderCatalogMetadata,
): AIProviderModelCatalogCandidateRef | null {
  if (!matchesAIModelProviderBindingFloors(model, provider)) return null;

  return Object.freeze({
    providerId: provider.id,
    modelId: model.id,
  });
}

/**
 * DD-240…DD-242: build only the deterministic non-ranking catalog
 * pre-candidate set from supplied evidence and DD-237 pair-level floors.
 *
 * null => malformed supplied evidence.
 * []   => valid evidence but no catalog pair survives.
 *
 * Ordering is lexical providerId/modelId solely for canonical serialization;
 * it is not route preference, health order, cost order or fallback order.
 */
export function filterAIOperationProviderModelCatalogPreCandidates(
  input: AIOperationProviderModelCatalogPreCandidateSetInput,
): readonly AIProviderModelCatalogCandidateRef[] | null {
  if (
    !input
    || typeof input !== "object"
    || !matchesAIProviderModelCatalogEvidenceSetFloor(input.providers, input.models)
  ) {
    return null;
  }

  const providerById = new Map<string, AIProviderCatalogMetadata>(
    input.providers.map((provider) => [provider.id, provider]),
  );
  const candidates: AIProviderModelCatalogCandidateRef[] = [];

  for (const model of input.models) {
    const provider = providerById.get(model.providerId);
    if (!provider) return null;

    if (!matchesAIOperationProviderModelCatalogCandidateFloors({
      declaration: input.declaration,
      snapshot: input.snapshot,
      provider,
      model,
      sensitivityClass: input.sensitivityClass,
      authorizedResidencyRegion: input.authorizedResidencyRegion,
    })) {
      continue;
    }

    const projected = projectAIProviderModelCatalogPair(model, provider);
    if (!projected) return null;
    candidates.push(projected);
  }

  candidates.sort((left, right) =>
    left.providerId.localeCompare(right.providerId)
    || left.modelId.localeCompare(right.modelId));

  return Object.freeze(candidates);
}
