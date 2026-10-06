import type { RequestContext } from "../context/contracts.js";
import type {
  AICapabilityCatalogMetadata,
  AICapabilityCatalogMetadataByCodeReadPort,
} from "./capability-catalog-metadata.js";
import {
  matchesAIMediaRequestCapabilityBindingFloors,
} from "./media-request-capability-binding-floors.js";
import type {
  AIMediaRequestReadPort,
  PersistedAIMediaRequest,
} from "./media-request.js";

export interface AIMediaRequestCapabilityCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly mediaRequestId: string;
}

export interface AIMediaRequestCapabilityCurrentEvidence {
  readonly request: PersistedAIMediaRequest;
  readonly capability: AICapabilityCatalogMetadata;
}

/**
 * DD-598…DD-602: compose exact AIMediaRequest evidence with one exact global
 * AICapability catalog read by the request's persisted capabilityCode, then
 * apply only DD-202's persisted code-binding floor.
 *
 * Capability lifecycle/category/entitlement/default-policy/schema evidence
 * remains raw. Success is relationship evidence only and does not establish
 * capability eligibility, policy/entitlement satisfaction, routing or media
 * execution authority.
 */
export async function loadAIMediaRequestCapabilityCurrentEvidence(
  input: AIMediaRequestCapabilityCurrentEvidenceReadInput,
  mediaRequestReader: AIMediaRequestReadPort,
  capabilityReader: AICapabilityCatalogMetadataByCodeReadPort,
): Promise<AIMediaRequestCapabilityCurrentEvidence | null> {
  const request = await mediaRequestReader.loadForContext({
    requestContext: input.requestContext,
    mediaRequestId: input.mediaRequestId,
  });
  if (request === null) return null;

  const capability = await capabilityReader.loadByCode(request.capabilityCode);
  if (capability === null) return null;

  if (!matchesAIMediaRequestCapabilityBindingFloors(request, capability)) {
    return null;
  }

  return Object.freeze({
    request,
    capability,
  });
}
