import test from "node:test";
import assert from "node:assert/strict";

import {
  authorizeAIIndustryGatewayOperation,
  buildAuthorizedAIIndustryGatewayPreRoutingEnvelope,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  tenantConfig: "33333333-3333-4333-8333-333333333333",
  industryConfig: "44444444-4444-4444-8444-444444444444",
  industry: "55555555-5555-4555-8555-555555555555",
  promptSet: "66666666-6666-4666-8666-666666666666",
  pack: "77777777-7777-4777-8777-777777777777",
  activation: "88888888-8888-4888-8888-888888888888",
  capability: "99999999-9999-4999-8999-999999999999",
  providerA: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  providerB: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  modelA: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  modelB: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
});

const operation = Object.freeze({
  operationId: "ai.chat.generate",
  module: "AI",
  scopeClass: "TENANT_INDUSTRY",
  kind: "QUERY",
  permissionCode: "ai.chat.use",
  entitlementRequirement: "ai.chat",
  inputSchemaVersion: 3,
  outputSchemaVersion: 2,
  idempotencyPolicy: "NONE",
  rateClass: "AI_COSTED",
  auditClass: "AI_STANDARD",
  domainService: "AIGateway.generate",
  emittedEvents: Object.freeze([]),
  errorCodes: Object.freeze(["PERMISSION_DENIED", "POLICY_DENIED"]),
});

const declaration = Object.freeze({
  operation,
  ai: Object.freeze({
    apiAccessClass: "TENANT_API",
    capabilityCode: "AI.CHAT",
    streamingMode: "OPTIONAL",
    dataClassCeiling: "CONFIDENTIAL",
    residencyPolicyRef: "tenant.residency",
  }),
});

const request = Object.freeze({
  requestId: "ai-request-1",
  capabilityCode: "AI.CHAT",
  requestContextRef: "opaque-context-ref",
  inputSchemaVersion: 3,
  input: Object.freeze({prompt: "hello"}),
  sensitivityClass: "CONFIDENTIAL",
  residencyRequirement: "tenant-policy",
  groundingMode: "OPTIONAL",
  correlationId: "ai-correlation-1",
});

const requestContext = Object.freeze({
  requestId: "server-request-1",
  correlationId: "server-correlation-1",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  principalId: "principal-1",
  principalType: "HUMAN",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze(["role-1"]),
  permissionVersion: 11,
  entitlementSnapshotId: "entitlement-snapshot-1",
  entitlementSnapshotVersion: 12,
  scopeClass: "TENANT_INDUSTRY",
});

const snapshot = Object.freeze({
  id: ids.snapshot,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  version: "31",
  subscriptionVersion: "41",
  entitlementSnapshotVersion: "51",
  industryActivationVersion: "61",
  msPackVersions: Object.freeze({}),
  countryPackVersions: Object.freeze({}),
  tenantAiConfigVersion: "7",
  allowedCapabilityIds: Object.freeze([ids.capability]),
  allowedApiClasses: Object.freeze(["TENANT_API"]),
  allowedProviderIds: Object.freeze([ids.providerA, ids.providerB]),
  allowedModelClasses: Object.freeze([]),
  status: "ACTIVE",
  compiledAt: "2026-09-20T00:00:00.000Z",
});

const capability = Object.freeze({
  id: ids.capability,
  code: "AI.CHAT",
  category: "CHAT",
  requiredEntitlement: "ai.chat",
  defaultPolicyClass: "STANDARD",
  schemaVersion: 3,
  status: "ACTIVE",
});

const tenantConfig = Object.freeze({
  id: ids.tenantConfig,
  tenantId: ids.tenant,
  enabled: true,
  allowedCapabilities: Object.freeze(["AI.CHAT", "AI.EMBED"]),
  allowedProviderIds: Object.freeze([ids.providerA, ids.providerB]),
  allowedModelIds: Object.freeze([ids.modelA, ids.modelB]),
  maxSensitivityClass: "CONFIDENTIAL",
  residencyPolicyId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  monthlyBudgetPolicyRef: "budget.standard",
  retentionPolicyId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  promptOverridePolicyId: "12121212-1212-4212-8212-121212121212",
  version: 7,
  updatedAt: "2026-09-20T00:00:00.000Z",
});

const industryConfig = Object.freeze({
  id: ids.industryConfig,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  enabled: true,
  allowedCapabilities: Object.freeze(["AI.CHAT"]),
  allowedProviderIds: Object.freeze([ids.providerA]),
  allowedModelIds: Object.freeze([ids.modelA]),
  domainPromptSetId: ids.promptSet,
  countryPackRefs: Object.freeze([ids.pack]),
  version: 9,
  updatedAt: "2026-09-20T00:00:00.000Z",
});

const promptSet = Object.freeze({
  id: ids.promptSet,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  code: "DOMAIN",
  version: 4,
  status: "ACTIVE",
  createdAt: "2026-09-19T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
});

const activation = Object.freeze({
  id: ids.activation,
  tenantId: ids.tenant,
  countryPackId: ids.pack,
  status: "ACTIVE",
  configOverride: Object.freeze({locale: "en-IN"}),
  activatedAt: "2026-09-18T00:00:00.000Z",
  rowVersion: "3",
});

const candidates = Object.freeze([
  Object.freeze({providerId: ids.providerB, modelId: ids.modelB}),
  Object.freeze({providerId: ids.providerA, modelId: ids.modelA}),
]);

const baseInput = Object.freeze({
  request,
  declaration,
  requestContext,
  snapshot,
  capability,
  tenantConfig,
  industryConfig,
  promptSet,
  activations: Object.freeze([activation]),
  candidates,
  evaluatedAt: "2026-09-29T12:00:00.000Z",
});

const resourceDescriptor = Object.freeze({
  resourceType: "ai.request",
  resourceId: "resource-1",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
});

const restrictionSet = Object.freeze({fields: Object.freeze(["safe"])});
const guardResult = Object.freeze({
  decisionId: "decision-1",
  resourceDescriptor,
  restrictionSet,
});

function authorization(result = guardResult) {
  const calls = [];
  return {
    calls,
    port: {
      async authorize(input) {
        calls.push(input);
        return result;
      },
    },
  };
}

test("AIINDGUARD-PORT-001 exact RequestContext and declaration.operation are passed to the live authorization port", async () => {
  const {port, calls} = authorization();
  await authorizeAIIndustryGatewayOperation(port, declaration, requestContext);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].requestContext, requestContext);
  assert.equal(calls[0].operation, declaration.operation);
});

test("AIINDGUARD-PORT-002 resourceReference is omitted when absent and passed unchanged when supplied", async () => {
  const first = authorization();
  await authorizeAIIndustryGatewayOperation(first.port, declaration, requestContext);
  assert.equal(Object.hasOwn(first.calls[0], "resourceReference"), false);

  const reference = Object.freeze({documentId: "doc-1"});
  const second = authorization();
  await authorizeAIIndustryGatewayOperation(second.port, declaration, requestContext, reference);
  assert.equal(second.calls[0].resourceReference, reference);
});

test("AIINDGUARD-AUTH-001 exact GuardResult identity is returned unchanged", async () => {
  const {port} = authorization();
  assert.equal(
    await authorizeAIIndustryGatewayOperation(port, declaration, requestContext),
    guardResult,
  );
});

test("AIINDGUARD-AUTH-002 authorization denial/dependency error propagates and is not normalized to null", async () => {
  const denial = new Error("guard-denied");
  const port = {
    async authorize() {
      throw denial;
    },
  };
  await assert.rejects(
    authorizeAIIndustryGatewayOperation(port, declaration, requestContext),
    (error) => error === denial,
  );
});

test("AIINDGUARD-ORDER-001 live authorization is invoked even when subsequent DD-267 evidence is invalid", async () => {
  const {port, calls} = authorization();
  const result = await buildAuthorizedAIIndustryGatewayPreRoutingEnvelope({
    ...baseInput,
    requestContext: {...requestContext, industryContextId: undefined},
  }, port);
  assert.equal(calls.length, 1);
  assert.equal(result, null);
});

test("AIINDGUARD-ORDER-002 successful authorization followed by DD-267 evidence failure returns null", async () => {
  const {port} = authorization();
  assert.equal(await buildAuthorizedAIIndustryGatewayPreRoutingEnvelope({
    ...baseInput,
    industryConfig: {...industryConfig, enabled: false},
  }, port), null);
});

test("AIINDGUARD-EVID-001 successful envelope preserves exact GuardResult resource/restriction evidence", async () => {
  const {port} = authorization();
  const result = await buildAuthorizedAIIndustryGatewayPreRoutingEnvelope(baseInput, port);
  assert.ok(result);
  assert.equal(result.guardResult, guardResult);
  assert.equal(result.guardResult.resourceDescriptor, resourceDescriptor);
  assert.equal(result.guardResult.restrictionSet, restrictionSet);
});

test("AIINDGUARD-EVID-002 envelope and candidate collection stay immutable and inputs remain unchanged", async () => {
  const {port} = authorization();
  const before = JSON.stringify(baseInput);
  const result = await buildAuthorizedAIIndustryGatewayPreRoutingEnvelope(baseInput, port);
  assert.ok(result);
  assert.equal(JSON.stringify(baseInput), before);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.candidates), true);
  assert.equal(result.candidates.every((candidate) => Object.isFrozen(candidate)), true);
});

test("AIINDGUARD-EMPTY-001 successful authorization plus valid empty DD-267 candidates returns immutable empty success", async () => {
  const {port} = authorization();
  const result = await buildAuthorizedAIIndustryGatewayPreRoutingEnvelope({
    ...baseInput,
    candidates: Object.freeze([]),
  }, port);
  assert.ok(result);
  assert.equal(result.guardResult, guardResult);
  assert.deepEqual(result.candidates, []);
  assert.equal(Object.isFrozen(result.candidates), true);
});

test("AIINDGUARD-BOUNDARY-001 envelope exposes no new AI policy budget residency route or execution authority", async () => {
  const {port} = authorization();
  const result = await buildAuthorizedAIIndustryGatewayPreRoutingEnvelope(baseInput, port);
  assert.ok(result);
  for (const forbidden of [
    "authorizationDecision",
    "effectiveConfig",
    "aiPolicyDecision",
    "budgetReservation",
    "residencyRoute",
    "score",
    "fallback",
    "credentialRef",
    "routeDecisionId",
    "execution",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
