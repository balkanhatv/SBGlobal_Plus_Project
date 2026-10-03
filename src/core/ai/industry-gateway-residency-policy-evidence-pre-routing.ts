import type { GuardResult } from "../authorization/guard-pipeline.js";
import type { AIPolicyReadPort, PersistedAIPolicy } from "./policy.js";
import type { AIProviderModelCatalogCandidateRef } from "./provider-model-catalog-pre-candidate-set.js";
import {
  buildAIIndustryGatewayCatalogPreRoutingAfterAuthorization,
  type AuthorizedAIIndustryGatewayCatalogPreRoutingInput,
} from "./industry-gateway-authorized-catalog-pre-routing.js";
import {
  authorizeAIIndustryGatewayOperation,
  type AIIndustryGatewayAuthorizationPort,
} from "./industry-gateway-live-guard-authorization.js";
import {
  loadAITenantResidencyPolicyContextEvidence,
} from "./tenant-residency-policy-context-evidence-floors.js";

export interface AuthorizedAIIndustryGatewayResidencyPolicyEvidenceEnvelope {
  readonly guardResult: GuardResult;
  readonly residencyPolicy: PersistedAIPolicy;
  readonly candidates: readonly AIProviderModelCatalogCandidateRef[];
}

/**
 * DD-285…DD-287: preserve the existing live authorization boundary, load exact
 * DD-282 residency-policy evidence, then and only then inspect raw catalog
 * evidence through DD-283.
 *
 * The loaded policy is evidence only. It is not evaluated and does not
 * authorize or derive input.authorizedResidencyRegion.
 */
export async function buildAuthorizedAIIndustryGatewayResidencyPolicyEvidencePreRoutingEnvelope(
  input: AuthorizedAIIndustryGatewayCatalogPreRoutingInput,
  authorization: AIIndustryGatewayAuthorizationPort,
  policyReadPort: AIPolicyReadPort,
): Promise<AuthorizedAIIndustryGatewayResidencyPolicyEvidenceEnvelope | null> {
  const guardResult = await authorizeAIIndustryGatewayOperation(
    authorization,
    input.declaration,
    input.requestContext,
    input.resourceReference,
  );

  const residencyPolicy = await loadAITenantResidencyPolicyContextEvidence(
    policyReadPort,
    input.requestContext,
    input.tenantConfig,
  );
  if (residencyPolicy === null) return null;

  const candidates = buildAIIndustryGatewayCatalogPreRoutingAfterAuthorization(input);
  if (candidates === null) return null;

  return Object.freeze({
    guardResult,
    residencyPolicy,
    candidates,
  });
}
