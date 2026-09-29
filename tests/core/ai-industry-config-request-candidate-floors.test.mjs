import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAIIndustryConfigConstrainedPreRoutingSet,
  filterAIIndustryConfigProviderModelPreCandidates,
  matchesAIIndustryConfigSnapshotScopeFloor,
  matchesAIRequestIndustryConfigCapabilityFloor,
  matchesAIRequestIndustryConfigPrerequisiteFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  otherTenant: "33333333-3333-4333-8333-333333333333",
  tenantConfig: "44444444-4444-4444-8444-444444444444",
  industryConfig: "55555555-5555-4555-8555-555555555555",
  industry: "66666666-6666-4666-8666-666666666666",
  siblingIndustry: "77777777-7777-4777-8777-777777777777",
  providerA: "88888888-8888-4888-8888-888888888888",
  providerB: "99999999-9999-4999-8999-999999999999",
  providerC: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  modelA: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  modelB: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  modelC: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
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
  requestId: "request-1",
  capabilityCode: "AI.CHAT",
  requestContextRef: "ctx-1",
  inputSchemaVersion: 3,
  input: Object.freeze({prompt: "hello"}),
  sensitivityClass: "CONFIDENTIAL",
  residencyRequirement: "tenant-policy",
  groundingMode: "OPTIONAL",
  correlationId: "corr-1",
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
  allowedCapabilityIds: Object.freeze([]),
  allowedApiClasses: Object.freeze(["TENANT_API"]),
  allowedProviderIds: Object.freeze([ids.providerA, ids.providerB]),
  allowedModelClasses: Object.freeze([]),
  status: "ACTIVE",
  compiledAt: "2026-09-20T00:00:00.000Z",
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
  domainPromptSetId: undefined,
  countryPackRefs: Object.freeze([]),
  localizationProfileRef: undefined,
  version: 9,
  updatedAt: "2026-09-20T00:00:00.000Z",
});

const candidates = Object.freeze([
  Object.freeze({providerId: ids.providerB, modelId: ids.modelB}),
  Object.freeze({providerId: ids.providerA, modelId: ids.modelA}),
]);

test("AIINDREQ-SCOPE-001 exact same-Tenant same-Industry enabled Industry config passes", () => {
  assert.equal(matchesAIIndustryConfigSnapshotScopeFloor(snapshot, industryConfig), true);
});

test("AIINDREQ-SCOPE-002 Tenant-Core foreign sibling or disabled Industry config fails closed", () => {
  for (const [candidateSnapshot, candidateConfig] of [
    [{...snapshot, industryContextId: undefined}, industryConfig],
    [{...snapshot, tenantId: ids.otherTenant}, industryConfig],
    [{...snapshot, industryContextId: ids.siblingIndustry}, industryConfig],
    [snapshot, {...industryConfig, enabled: false}],
  ]) {
    assert.equal(
      matchesAIIndustryConfigSnapshotScopeFloor(candidateSnapshot, candidateConfig),
      false,
    );
  }
});

test("AIINDREQ-SCOPE-003 malformed snapshot/config identity or enablement evidence fails closed", () => {
  for (const [candidateSnapshot, candidateConfig] of [
    [{...snapshot, id: "bad"}, industryConfig],
    [{...snapshot, tenantId: "bad"}, industryConfig],
    [{...snapshot, industryContextId: "bad"}, industryConfig],
    [snapshot, {...industryConfig, id: "bad"}],
    [snapshot, {...industryConfig, tenantId: "bad"}],
    [snapshot, {...industryConfig, industryContextId: "bad"}],
    [snapshot, {...industryConfig, enabled: "true"}],
  ]) {
    assert.equal(
      matchesAIIndustryConfigSnapshotScopeFloor(candidateSnapshot, candidateConfig),
      false,
    );
  }
});

test("AIINDREQ-SCOPE-004 unrelated version/config fields stay uninterpreted and inputs remain unchanged", () => {
  const candidateSnapshot = Object.freeze({...snapshot, version: "not-interpreted", status: "REVOKED"});
  const candidateConfig = Object.freeze({
    ...industryConfig,
    version: -999,
    countryPackRefs: Object.freeze([null, "not-interpreted"]),
    domainPromptSetId: "not-interpreted",
    localizationProfileRef: "",
    updatedAt: "not-interpreted",
  });
  const beforeSnapshot = JSON.stringify(candidateSnapshot);
  const beforeConfig = JSON.stringify(candidateConfig);

  assert.equal(matchesAIIndustryConfigSnapshotScopeFloor(candidateSnapshot, candidateConfig), true);
  assert.equal(JSON.stringify(candidateSnapshot), beforeSnapshot);
  assert.equal(JSON.stringify(candidateConfig), beforeConfig);
});

test("AIINDREQ-CAP-001 exact request capability membership passes", () => {
  assert.equal(matchesAIRequestIndustryConfigCapabilityFloor(request, industryConfig), true);
});

test("AIINDREQ-CAP-002 missing duplicate or malformed Industry capability evidence fails closed", () => {
  for (const config of [
    {...industryConfig, allowedCapabilities: ["AI.EMBED"]},
    {...industryConfig, allowedCapabilities: ["AI.CHAT", "AI.CHAT"]},
    {...industryConfig, allowedCapabilities: ["AI.CHAT", 7]},
    {...industryConfig, id: "bad"},
  ]) {
    assert.equal(matchesAIRequestIndustryConfigCapabilityFloor(request, config), false);
  }
});

test("AIINDROUTE-ALLOW-001 exact Provider and Model allowlist candidates return immutable canonical refs", () => {
  const config = {...industryConfig, allowedProviderIds: [ids.providerA, ids.providerB], allowedModelIds: [ids.modelA, ids.modelB]};
  const result = filterAIIndustryConfigProviderModelPreCandidates(candidates, config);
  assert.ok(result);
  assert.deepEqual(result, [
    {providerId: ids.providerA, modelId: ids.modelA},
    {providerId: ids.providerB, modelId: ids.modelB},
  ]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.every((entry) => Object.isFrozen(entry)), true);
});

test("AIINDROUTE-ALLOW-002 valid partial candidate evidence returns only exact Industry-allowlisted pairs", () => {
  const result = filterAIIndustryConfigProviderModelPreCandidates([
    {providerId: ids.providerA, modelId: ids.modelA},
    {providerId: ids.providerB, modelId: ids.modelB},
    {providerId: ids.providerC, modelId: ids.modelC},
  ], industryConfig);
  assert.deepEqual(result, [{providerId: ids.providerA, modelId: ids.modelA}]);
});

test("AIINDROUTE-ALLOW-003 malformed duplicate sparse candidate or Industry allowlist evidence returns null", () => {
  const sparse = [{providerId: ids.providerA, modelId: ids.modelA}];
  sparse.length = 2;

  for (const [candidateEvidence, config] of [
    [[...candidates, candidates[0]], industryConfig],
    [[{providerId: "bad", modelId: ids.modelA}], industryConfig],
    [sparse, industryConfig],
    [candidates, {...industryConfig, allowedProviderIds: [ids.providerA, ids.providerA]}],
    [candidates, {...industryConfig, allowedModelIds: [ids.modelA, "bad"]}],
  ]) {
    assert.equal(filterAIIndustryConfigProviderModelPreCandidates(candidateEvidence, config), null);
  }
});

test("AIINDROUTE-ALLOW-004 valid empty or zero-match evidence returns immutable empty array", () => {
  const empty = filterAIIndustryConfigProviderModelPreCandidates([], industryConfig);
  assert.deepEqual(empty, []);
  assert.equal(Object.isFrozen(empty), true);

  const zero = filterAIIndustryConfigProviderModelPreCandidates([
    {providerId: ids.providerB, modelId: ids.modelB},
  ], industryConfig);
  assert.deepEqual(zero, []);
  assert.equal(Object.isFrozen(zero), true);
});

test("AIINDREQ-BIND-001 Tenant request plus exact non-widening Industry prerequisites pass", () => {
  assert.equal(matchesAIRequestIndustryConfigPrerequisiteFloors(
    request,
    declaration,
    snapshot,
    tenantConfig,
    industryConfig,
  ), true);
});

test("AIINDREQ-BIND-002 Tenant config scope enablement non-widening or capability failure denies", () => {
  for (const [candidateRequest, candidateSnapshot, candidateTenant, candidateIndustry] of [
    [request, snapshot, {...tenantConfig, enabled: false}, industryConfig],
    [request, {...snapshot, industryContextId: ids.siblingIndustry}, tenantConfig, industryConfig],
    [request, snapshot, tenantConfig, {...industryConfig, enabled: false}],
    [request, snapshot, tenantConfig, {...industryConfig, allowedProviderIds: [ids.providerC]}],
    [{...request, capabilityCode: "AI.EMBED"}, snapshot, tenantConfig, industryConfig],
  ]) {
    assert.equal(matchesAIRequestIndustryConfigPrerequisiteFloors(
      candidateRequest,
      declaration,
      candidateSnapshot,
      candidateTenant,
      candidateIndustry,
    ), false);
  }
});

test("AIINDROUTE-PRE-001 combined Tenant and Industry constrained path returns expected set", () => {
  assert.deepEqual(buildAIIndustryConfigConstrainedPreRoutingSet({
    request,
    declaration,
    snapshot,
    tenantConfig,
    industryConfig,
    candidates,
  }), [{providerId: ids.providerA, modelId: ids.modelA}]);
});

test("AIINDROUTE-PRE-002 request/config prerequisite failure returns null rather than empty success", () => {
  assert.equal(buildAIIndustryConfigConstrainedPreRoutingSet({
    request,
    declaration,
    snapshot: {...snapshot, industryContextId: ids.siblingIndustry},
    tenantConfig,
    industryConfig,
    candidates,
  }), null);
});

test("AIINDROUTE-PRE-003 inputs remain unchanged and output grants no route authority", () => {
  const input = {request, declaration, snapshot, tenantConfig, industryConfig, candidates};
  const before = JSON.stringify(input);
  const result = buildAIIndustryConfigConstrainedPreRoutingSet(input);
  assert.ok(result);
  assert.equal(JSON.stringify(input), before);
  for (const candidate of result) {
    for (const forbidden of ["score", "fallback", "credentialRef", "routeDecisionId", "authorized"]) {
      assert.equal(forbidden in candidate, false);
    }
  }
});
