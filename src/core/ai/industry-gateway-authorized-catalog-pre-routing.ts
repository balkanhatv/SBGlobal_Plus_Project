import type { AIModelCatalogMetadata } from "./model-catalog-metadata.js";
import type { AIProviderCatalogMetadata } from "./provider-catalog-metadata.js";
import {
  filterAIOperationProviderModelCatalogPreCandidates,
} from "./provider-model-catalog-pre-candidate-set.js";
import {
  buildAIIndustryGatewayRelationshipPreRoutingSet,
  type AIIndustryGatewayRelationshipPreRoutingSetInput,
} from "./industry-gateway-context-admission-floors.js";
import {
  authorizeAIIndustryGatewayOperation,
  type AIIndustryGatewayAuthorizationPort,
  type AuthorizedAIIndustryGatewayPreRoutingEnvelope,
} from "./industry-gateway-live-guard-authorization.js";
import {
  matchesAIRequestShapeFloor,
} from "./request-pre-routing-floors.js";

export interface AuthorizedAIIndustryGatewayCatalogPreRoutingInput
extends Omit<AIIndustryGatewayRelationshipPreRoutingSetInput, "candidates"> {
  readonly providers: readonly AIProviderCatalogMetadata[];
  readonly models: readonly AIModelCatalogMetadata[];
  readonly authorizedResidencyRegion: unknown;
  readonly resourceReference?: Readonly<Record<string, unknown>>;
}

/**
 * DD-273…DD-277: authorize first, then construct DD-242 candidates from the
 * supplied raw Provider/Model catalog evidence, then feed only those immutable
 * refs into DD-267 for Tenant/Industry narrowing.
 *
 * authorizedResidencyRegion is already-authorized upstream evidence. This
 * function does not derive, reinterpret or authorize residency.
 *
 * GuardPipeline denials/dependency errors propagate unchanged.
 * null remains reserved for malformed/ineligible downstream evidence.
 * [] remains valid immutable empty success.
 */
export async function buildAuthorizedAIIndustryGatewayCatalogPreRoutingEnvelope(
  input: AuthorizedAIIndustryGatewayCatalogPreRoutingInput,
  authorization: AIIndustryGatewayAuthorizationPort,
): Promise<AuthorizedAIIndustryGatewayPreRoutingEnvelope | null> {
  const guardResult = await authorizeAIIndustryGatewayOperation(
    authorization,
    input.declaration,
    input.requestContext,
    input.resourceReference,
  );

  if (!matchesAIRequestShapeFloor(input.request)) return null;

  const catalogCandidates = filterAIOperationProviderModelCatalogPreCandidates({
    declaration: input.declaration,
    snapshot: input.snapshot,
    providers: input.providers,
    models: input.models,
    sensitivityClass: input.request.sensitivityClass,
    authorizedResidencyRegion: input.authorizedResidencyRegion,
  });
  if (catalogCandidates === null) return null;

  const candidates = buildAIIndustryGatewayRelationshipPreRoutingSet({
    request: input.request,
    declaration: input.declaration,
    requestContext: input.requestContext,
    snapshot: input.snapshot,
    capability: input.capability,
    tenantConfig: input.tenantConfig,
    industryConfig: input.industryConfig,
    promptSet: input.promptSet,
    activations: input.activations,
    candidates: catalogCandidates,
    evaluatedAt: input.evaluatedAt,
  });
  if (candidates === null) return null;

  return Object.freeze({
    guardResult,
    candidates,
  });
}
