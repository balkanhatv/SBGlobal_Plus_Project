import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAIIndustryGatewayCatalogPreRoutingAfterAuthorization,
  buildAuthorizedAIIndustryGatewayCatalogPreRoutingEnvelope,
  buildAuthorizedAIIndustryGatewayResidencyPolicyEvidencePreRoutingEnvelope,
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
  modelC: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  residencyPolicy: "12121212-1212-4212-8212-121212121212",
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
  residencyPolicyId: ids.residencyPolicy,
  monthlyBudgetPolicyRef: "budget.standard",
  retentionPolicyId: "13131313-1313-4313-8313-131313131313",
  promptOverridePolicyId: "14141414-1414-4414-8414-141414141414",
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

const providerA = Object.freeze({
  id: ids.providerA,
  code: "PROVIDER_A",
  status: "ACTIVE",
  adapterType: "ADAPTER_A",
  supportedRegions: Object.freeze(["IN-CENTRAL"]),
  supportedCapabilities: Object.freeze(["AI.CHAT"]),
  securityClass: "STANDARD",
  residencyMetadata: Object.freeze({}),
  healthState: "HEALTHY",
  version: 1,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
});

const providerB = Object.freeze({...providerA, id: ids.providerB, code: "PROVIDER_B"});

const modelA = Object.freeze({
  id: ids.modelA,
  providerId: ids.providerA,
  modelCode: "model-a",
  displayName: "Model A",
  capabilities: Object.freeze(["AI.CHAT"]),
  contextWindowClass: "STANDARD",
  inputModalities: Object.freeze(["TEXT"]),
  outputModalities: Object.freeze(["TEXT"]),
  residencyRegions: Object.freeze(["IN-CENTRAL"]),
  sensitivityCeiling: "CONFIDENTIAL",
  costClass: "STANDARD",
  latencyClass: "STANDARD",
  status: "ACTIVE",
  version: 1,
  metadata: Object.freeze({}),
});
const modelB = Object.freeze({...modelA, id: ids.modelB, providerId: ids.providerB, modelCode: "model-b", displayName: "Model B"});
const modelC = Object.freeze({...modelA, id: ids.modelC, modelCode: "model-c", displayName: "Model C", capabilities: Object.freeze(["AI.EMBED"])});

const policy = Object.freeze({
  id: ids.residencyPolicy,
  ownerScope: "TENANT",
  tenantId: ids.tenant,
  code: "TENANT_RESIDENCY",
  priority: 100,
  effect: "RESTRICT",
  conditionAst: Object.freeze({op: "opaque"}),
  constraint: Object.freeze({regions: Object.freeze(["IN-CENTRAL"])}),
  version: 3,
  status: "ACTIVE",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
});

const guardResult = Object.freeze({
  decisionId: "decision-1",
  resourceDescriptor: Object.freeze({
    resourceType: "ai.request",
    resourceId: "resource-1",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
  }),
  restrictionSet: Object.freeze({fields: Object.freeze(["safe"])}),
});

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
  providers: Object.freeze([providerB, providerA]),
  models: Object.freeze([modelB, modelA]),
  authorizedResidencyRegion: "IN-CENTRAL",
  evaluatedAt: "2026-09-30T04:20:00.000Z",
});

function authorization(result = guardResult) {
  const calls = [];
  return {
    calls,
    port: {async authorize(input) { calls.push(input); return result; }},
  };
}

function policyReader(result = policy) {
  const calls = [];
  return {
    calls,
    port: {async loadForContext(input) { calls.push(input); return result; }},
  };
}

test("AIRESGW-POST-001 DD-283 preserves exact DD-277 candidate construction/narrowing", () => {
  assert.deepEqual(buildAIIndustryGatewayCatalogPreRoutingAfterAuthorization(baseInput), [
    {providerId: ids.providerA, modelId: ids.modelA},
  ]);
});

test("AIRESGW-POST-002 DD-283 preserves malformed null and valid-empty immutable semantics", () => {
  assert.equal(buildAIIndustryGatewayCatalogPreRoutingAfterAuthorization({
    ...baseInput,
    providers: [providerA, providerA],
  }), null);
  const empty = buildAIIndustryGatewayCatalogPreRoutingAfterAuthorization({
    ...baseInput,
    providers: [providerA],
    models: [modelC],
  });
  assert.deepEqual(empty, []);
  assert.equal(Object.isFrozen(empty), true);
});

test("AIRESGW-AUTH-001 DD-284 authorizes exactly once and preserves GuardResult identity", async () => {
  const {port, calls} = authorization();
  const result = await buildAuthorizedAIIndustryGatewayCatalogPreRoutingEnvelope(baseInput, port);
  assert.equal(calls.length, 1);
  assert.ok(result);
  assert.equal(result.guardResult, guardResult);
});

test("AIRESGW-AUTH-002 DD-284 GuardPipeline error propagates and catalog evidence is not read", async () => {
  const denial = new Error("guard-denied");
  const events = [];
  const input = {
    ...baseInput,
    get providers() { events.push("providers"); return [providerA]; },
    get models() { events.push("models"); return [modelA]; },
  };
  await assert.rejects(
    buildAuthorizedAIIndustryGatewayCatalogPreRoutingEnvelope(
      input,
      {async authorize() { throw denial; }},
    ),
    (error) => error === denial,
  );
  assert.deepEqual(events, []);
});

test("AIRESGW-POL-001 DD-285 order is authorize then policy load then raw catalog", async () => {
  const events = [];
  const input = {
    ...baseInput,
    get providers() { events.push("providers"); return [providerA, providerB]; },
    get models() { events.push("models"); return [modelA, modelB]; },
  };
  const authorizationPort = {async authorize() { events.push("authorize"); return guardResult; }};
  const readPort = {async loadForContext() { events.push("policy"); return policy; }};
  const result = await buildAuthorizedAIIndustryGatewayResidencyPolicyEvidencePreRoutingEnvelope(
    input,
    authorizationPort,
    readPort,
  );
  assert.ok(result);
  assert.equal(events[0], "authorize");
  assert.equal(events[1], "policy");
  assert.ok(events.indexOf("policy") < events.indexOf("providers"));
  assert.ok(events.indexOf("policy") < events.indexOf("models"));
});

test("AIRESGW-POL-002 missing/mismatched policy evidence returns null before catalog access", async () => {
  for (const loaded of [null, {...policy, id: "15151515-1515-4515-8515-151515151515"}]) {
    const events = [];
    const input = {
      ...baseInput,
      get providers() { events.push("providers"); return [providerA]; },
      get models() { events.push("models"); return [modelA]; },
    };
    const result = await buildAuthorizedAIIndustryGatewayResidencyPolicyEvidencePreRoutingEnvelope(
      input,
      {async authorize() { return guardResult; }},
      {async loadForContext() { return loaded; }},
    );
    assert.equal(result, null);
    assert.deepEqual(events, []);
  }
});

test("AIRESGW-POL-003 policy-read dependency error propagates unchanged before catalog access", async () => {
  const error = new Error("policy-read-failed");
  const events = [];
  const input = {
    ...baseInput,
    get providers() { events.push("providers"); return [providerA]; },
    get models() { events.push("models"); return [modelA]; },
  };
  await assert.rejects(
    buildAuthorizedAIIndustryGatewayResidencyPolicyEvidencePreRoutingEnvelope(
      input,
      {async authorize() { return guardResult; }},
      {async loadForContext() { throw error; }},
    ),
    (received) => received === error,
  );
  assert.deepEqual(events, []);
});

test("AIRESGW-EVID-001 success preserves exact GuardResult and policy identities plus immutable candidates", async () => {
  const {port: authPort} = authorization();
  const {port: readPort, calls} = policyReader();
  const before = JSON.stringify(baseInput);
  const result = await buildAuthorizedAIIndustryGatewayResidencyPolicyEvidencePreRoutingEnvelope(
    baseInput,
    authPort,
    readPort,
  );
  assert.ok(result);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].requestContext, requestContext);
  assert.equal(calls[0].policyId, ids.residencyPolicy);
  assert.equal(result.guardResult, guardResult);
  assert.equal(result.residencyPolicy, policy);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.candidates), true);
  assert.equal(result.candidates.every(Object.isFrozen), true);
  assert.equal(JSON.stringify(baseInput), before);
});

test("AIRESGW-EMPTY-001 valid empty candidates remain immutable empty success with valid policy evidence", async () => {
  const result = await buildAuthorizedAIIndustryGatewayResidencyPolicyEvidencePreRoutingEnvelope(
    {...baseInput, providers: [providerA], models: [modelC]},
    authorization().port,
    policyReader().port,
  );
  assert.ok(result);
  assert.equal(result.residencyPolicy, policy);
  assert.deepEqual(result.candidates, []);
  assert.equal(Object.isFrozen(result.candidates), true);
});

test("AIRESGW-BOUNDARY-001 output exposes no new policy residency budget routing or execution authority", async () => {
  const result = await buildAuthorizedAIIndustryGatewayResidencyPolicyEvidencePreRoutingEnvelope(
    baseInput,
    authorization().port,
    policyReader().port,
  );
  assert.ok(result);
  assert.deepEqual(Object.keys(result).sort(), ["candidates", "guardResult", "residencyPolicy"]);
  for (const forbidden of [
    "policyDecision",
    "residencyAuthorization",
    "authorizedResidencyRegion",
    "derivedResidencyRegion",
    "effectiveConfig",
    "budgetApproval",
    "budgetReservation",
    "score",
    "routeDecisionId",
    "fallback",
    "credentialRef",
    "execution",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
