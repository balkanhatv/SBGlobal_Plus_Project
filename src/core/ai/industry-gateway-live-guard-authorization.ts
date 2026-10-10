import type { OperationContract } from "../api/operation-contract.js";
import type { RequestContext } from "../context/contracts.js";
import type { GuardResult } from "../authorization/guard-pipeline.js";
import type {
  AIOperationContractDeclaration,
} from "./operation-pre-provider-prerequisite-floors.js";
import {
  buildAIIndustryGatewayRelationshipPreRoutingSet,
  type AIIndustryGatewayRelationshipPreRoutingSetInput,
} from "./industry-gateway-context-admission-floors.js";
import type {
  AIProviderModelCatalogCandidateRef,
} from "./provider-model-catalog-pre-candidate-set.js";

export interface AIIndustryGatewayAuthorizationPort {
  authorize(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
    readonly resourceReference?: Readonly<Record<string, unknown>>;
  }): Promise<GuardResult>;
}

export interface AuthorizedAIIndustryGatewayPreRoutingInput
extends AIIndustryGatewayRelationshipPreRoutingSetInput {
  readonly resourceReference?: Readonly<Record<string, unknown>>;
}

export interface AuthorizedAIIndustryGatewayPreRoutingEnvelope {
  readonly guardResult: GuardResult;
  readonly candidates: readonly AIProviderModelCatalogCandidateRef[];
}

/**
 * DD-269: invoke the already-governed live GuardPipeline-compatible
 * authorization surface for the exact supplied RequestContext + AI operation.
 *
 * Denials/dependency failures intentionally propagate unchanged. No synthetic
 * authorization outcome is created here.
 */
export async function authorizeAIIndustryGatewayOperation(
  authorization: AIIndustryGatewayAuthorizationPort,
  declaration: AIOperationContractDeclaration,
  requestContext: RequestContext,
  resourceReference?: Readonly<Record<string, unknown>>,
): Promise<GuardResult> {
  if (resourceReference === undefined) {
    return authorization.authorize({
      requestContext,
      operation: declaration.operation,
    });
  }

  return authorization.authorize({
    requestContext,
    operation: declaration.operation,
    resourceReference,
  });
}

/**
 * DD-270…DD-272: live authorization must complete successfully before the
 * DD-267 Industry Gateway pre-routing set is accepted. The exact GuardResult is
 * preserved alongside the immutable candidate refs.
 *
 * null remains reserved for DD-267 evidence failure after successful live
 * authorization. Authorization errors are never converted to null or empty
 * success.
 */
export async function buildAuthorizedAIIndustryGatewayPreRoutingEnvelope(
  input: AuthorizedAIIndustryGatewayPreRoutingInput,
  authorization: AIIndustryGatewayAuthorizationPort,
): Promise<AuthorizedAIIndustryGatewayPreRoutingEnvelope | null> {
  const guardResult = await authorizeAIIndustryGatewayOperation(
    authorization,
    input.declaration,
    input.requestContext,
    input.resourceReference,
  );

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
    candidates: input.candidates,
    evaluatedAt: input.evaluatedAt,
  });
  if (candidates === null) return null;

  return Object.freeze({
    guardResult,
    candidates,
  });
}
