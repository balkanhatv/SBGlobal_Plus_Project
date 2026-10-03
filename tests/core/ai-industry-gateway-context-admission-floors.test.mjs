import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAIIndustryGatewayRelationshipPreRoutingSet,
  matchesAIIndustryOperationGatewayAdmissionFloors,
  matchesAIRequestContextIndustrySnapshotScopeFloor,
  matchesAIRequestIndustryGatewayAdmissionFloors,
  matchesAIRequestIndustryGatewayRelationshipPrerequisiteFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  otherTenant: "33333333-3333-4333-8333-333333333333",
  tenantConfig: "44444444-4444-4444-8444-444444444444",
  industryConfig: "55555555-5555-4555-8555-555555555555",
  industry: "66666666-6666-4666-8666-666666666666",
  siblingIndustry: "77777777-7777-4777-8777-777777777777",
  promptSet: "88888888-8888-4888-8888-888888888888",
  pack: "99999999-9999-4999-8999-999999999999",
  activation: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  capability: "abababab-abab-4bab-8bab-abababababab",
  providerA: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  providerB: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  modelA: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  modelB: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
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
  requestId: "server-request-different-by-design",
  correlationId: "server-correlation-different-by-design",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  scopeClass: "TENANT_INDUSTRY",
  networkContext: "uninterpreted",
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
  residencyPolicyId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  monthlyBudgetPolicyRef: "budget.standard",
  retentionPolicyId: "12121212-1212-4212-8212-121212121212",
  promptOverridePolicyId: "13131313-1313-4313-8313-131313131313",
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

const evaluatedAt = "2026-09-29T12:00:00.000Z";

test("AIINDGW-CTX-001 exact TENANT_INDUSTRY context Tenant+Industry equals snapshot and passes", () => {
  assert.equal(matchesAIRequestContextIndustrySnapshotScopeFloor(requestContext, snapshot), true);
});

test("AIINDGW-CTX-002 other scope missing ids foreign Tenant or sibling Industry fails closed", () => {
  for (const [context, candidateSnapshot] of [
    [{...requestContext, scopeClass: "TENANT_CORE"}, snapshot],
    [{...requestContext, tenantId: undefined}, snapshot],
    [{...requestContext, industryContextId: undefined}, snapshot],
    [{...requestContext, tenantId: ids.otherTenant}, snapshot],
    [{...requestContext, industryContextId: ids.siblingIndustry}, snapshot],
    [requestContext, {...snapshot, tenantId: ids.otherTenant}],
    [requestContext, {...snapshot, industryContextId: ids.siblingIndustry}],
  ]) {
    assert.equal(matchesAIRequestContextIndustrySnapshotScopeFloor(context, candidateSnapshot), false);
  }
});

test("AIINDGW-CTX-003 malformed identities fail closed while unrelated context fields remain uninterpreted and inputs unchanged", () => {
  assert.equal(matchesAIRequestContextIndustrySnapshotScopeFloor(
    {...requestContext, tenantId: "bad"},
    snapshot,
  ), false);
  assert.equal(matchesAIRequestContextIndustrySnapshotScopeFloor(
    requestContext,
    {...snapshot, id: "bad"},
  ), false);

  const context = Object.freeze({
    ...requestContext,
    requestId: "",
    correlationId: "",
    roleIds: Object.freeze(["not-interpreted"]),
    orgUnitPath: Object.freeze(["not-interpreted"]),
    networkContext: "",
  });
  const candidateSnapshot = Object.freeze({
    ...snapshot,
    version: "not-interpreted",
    subscriptionVersion: "not-interpreted",
    status: "REVOKED",
    compiledAt: "not-interpreted",
  });
  const beforeContext = JSON.stringify(context);
  const beforeSnapshot = JSON.stringify(candidateSnapshot);
  assert.equal(matchesAIRequestContextIndustrySnapshotScopeFloor(context, candidateSnapshot), true);
  assert.equal(JSON.stringify(context), beforeContext);
  assert.equal(JSON.stringify(candidateSnapshot), beforeSnapshot);
});

test("AIINDGW-ADM-001 exact context scope plus DD-230 operation admission passes", () => {
  assert.equal(matchesAIIndustryOperationGatewayAdmissionFloors(
    declaration,
    requestContext,
    snapshot,
    capability,
    evaluatedAt,
  ), true);
});

test("AIINDGW-ADM-002 context scope lifecycle API class or capability admission failure denies", () => {
  for (const [context, candidateSnapshot, candidateCapability] of [
    [{...requestContext, industryContextId: ids.siblingIndustry}, snapshot, capability],
    [requestContext, {...snapshot, status: "SUPERSEDED"}, capability],
    [requestContext, {...snapshot, allowedApiClasses: []}, capability],
    [requestContext, {...snapshot, allowedCapabilityIds: []}, capability],
    [requestContext, snapshot, {...capability, status: "RETIRED"}],
  ]) {
    assert.equal(matchesAIIndustryOperationGatewayAdmissionFloors(
      declaration,
      context,
      candidateSnapshot,
      candidateCapability,
      evaluatedAt,
    ), false);
  }
});

test("AIINDGW-REQ-001 request integrity plus Industry gateway admission passes without requestContextRef dereference", () => {
  assert.equal(matchesAIRequestIndustryGatewayAdmissionFloors(
    request,
    declaration,
    requestContext,
    snapshot,
    capability,
    evaluatedAt,
  ), true);
});

test("AIINDGW-REQ-002 request capability/schema integrity or gateway admission failure denies", () => {
  for (const [candidateRequest, context] of [
    [{...request, capabilityCode: "AI.EMBED"}, requestContext],
    [{...request, inputSchemaVersion: 99}, requestContext],
    [request, {...requestContext, scopeClass: "TENANT_CORE"}],
  ]) {
    assert.equal(matchesAIRequestIndustryGatewayAdmissionFloors(
      candidateRequest,
      declaration,
      context,
      snapshot,
      capability,
      evaluatedAt,
    ), false);
  }
});

test("AIINDGW-REL-001 gateway admission plus relationship-complete supplied Industry prerequisites pass", () => {
  assert.equal(matchesAIRequestIndustryGatewayRelationshipPrerequisiteFloors(
    request,
    declaration,
    requestContext,
    snapshot,
    capability,
    tenantConfig,
    industryConfig,
    promptSet,
    [activation],
    evaluatedAt,
  ), true);
});

test("AIINDGW-REL-002 context admission request config PromptSet or CountryPack prerequisite failure denies", () => {
  for (const [context, candidateIndustry, candidatePrompt, activations] of [
    [{...requestContext, tenantId: ids.otherTenant}, industryConfig, promptSet, [activation]],
    [requestContext, {...industryConfig, enabled: false}, promptSet, [activation]],
    [requestContext, industryConfig, {...promptSet, status: "RETIRED"}, [activation]],
    [requestContext, industryConfig, promptSet, []],
  ]) {
    assert.equal(matchesAIRequestIndustryGatewayRelationshipPrerequisiteFloors(
      request,
      declaration,
      context,
      snapshot,
      capability,
      tenantConfig,
      candidateIndustry,
      candidatePrompt,
      activations,
      evaluatedAt,
    ), false);
  }
});

test("AIINDGW-PRE-001 full Industry Gateway relationship path returns expected immutable candidate set", () => {
  const result = buildAIIndustryGatewayRelationshipPreRoutingSet({
    request,
    declaration,
    requestContext,
    snapshot,
    capability,
    tenantConfig,
    industryConfig,
    promptSet,
    activations: [activation],
    candidates,
    evaluatedAt,
  });
  assert.deepEqual(result, [{providerId: ids.providerA, modelId: ids.modelA}]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.every((entry) => Object.isFrozen(entry)), true);
});

test("AIINDGW-PRE-002 gateway or relationship prerequisite failure returns null rather than empty success", () => {
  assert.equal(buildAIIndustryGatewayRelationshipPreRoutingSet({
    request,
    declaration,
    requestContext: {...requestContext, industryContextId: ids.siblingIndustry},
    snapshot,
    capability,
    tenantConfig,
    industryConfig,
    promptSet,
    activations: [activation],
    candidates,
    evaluatedAt,
  }), null);
});

test("AIINDGW-PRE-003 valid empty DD-262 candidates remain immutable empty success when gateway prerequisites pass", () => {
  const result = buildAIIndustryGatewayRelationshipPreRoutingSet({
    request,
    declaration,
    requestContext,
    snapshot,
    capability,
    tenantConfig,
    industryConfig,
    promptSet,
    activations: [activation],
    candidates: [],
    evaluatedAt,
  });
  assert.deepEqual(result, []);
  assert.equal(Object.isFrozen(result), true);
});

test("AIINDGW-PRE-004 inputs remain unchanged and output exposes no authorization policy route or execution authority", () => {
  const input = {
    request,
    declaration,
    requestContext,
    snapshot,
    capability,
    tenantConfig,
    industryConfig,
    promptSet,
    activations: [activation],
    candidates,
    evaluatedAt,
  };
  const before = JSON.stringify(input);
  const result = buildAIIndustryGatewayRelationshipPreRoutingSet(input);
  assert.ok(result);
  assert.equal(JSON.stringify(input), before);
  for (const candidate of result) {
    for (const forbidden of [
      "authorizationDecision",
      "entitlementDecision",
      "effectiveConfig",
      "policyDecision",
      "score",
      "fallback",
      "credentialRef",
      "routeDecisionId",
      "authorized",
      "execution",
    ]) {
      assert.equal(forbidden in candidate, false);
    }
  }
});
