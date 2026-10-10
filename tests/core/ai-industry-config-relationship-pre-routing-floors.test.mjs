import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAIIndustryConfigRelationshipConstrainedPreRoutingSet,
  matchesAIIndustryConfigRelationshipFloors,
  matchesAIIndustryConfigSnapshotRelationshipFloors,
  matchesAIIndustryConfigTenantPromptSetRelationshipFloors,
  matchesAIRequestIndustryConfigRelationshipPrerequisiteFloors,
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

test("AIINDREL-PROMPT-001 valid Tenant non-widening plus exact optional PromptSet relationship passes", () => {
  assert.equal(matchesAIIndustryConfigTenantPromptSetRelationshipFloors(industryConfig, tenantConfig, promptSet), true);
});

test("AIINDREL-PROMPT-002 Tenant non-widening or PromptSet relationship failure denies", () => {
  assert.equal(matchesAIIndustryConfigTenantPromptSetRelationshipFloors(
    {...industryConfig, allowedProviderIds: ["14141414-1414-4414-8414-141414141414"]},
    tenantConfig,
    promptSet,
  ), false);
  assert.equal(matchesAIIndustryConfigTenantPromptSetRelationshipFloors(
    industryConfig,
    tenantConfig,
    {...promptSet, status: "RETIRED"},
  ), false);
});

test("AIINDREL-PACK-001 exact PromptSet and CountryPack supplied relationships pass together", () => {
  assert.equal(matchesAIIndustryConfigRelationshipFloors(
    industryConfig,
    tenantConfig,
    promptSet,
    [activation],
  ), true);
});

test("AIINDREL-PACK-002 missing extra foreign or non-ACTIVE CountryPack evidence denies", () => {
  assert.equal(matchesAIIndustryConfigRelationshipFloors(industryConfig, tenantConfig, promptSet, []), false);
  assert.equal(matchesAIIndustryConfigRelationshipFloors(
    industryConfig,
    tenantConfig,
    promptSet,
    [activation, {...activation, id: "15151515-1515-4515-8515-151515151515"}],
  ), false);
  assert.equal(matchesAIIndustryConfigRelationshipFloors(
    industryConfig,
    tenantConfig,
    promptSet,
    [{...activation, tenantId: ids.otherTenant}],
  ), false);
  assert.equal(matchesAIIndustryConfigRelationshipFloors(
    industryConfig,
    tenantConfig,
    promptSet,
    [{...activation, status: "DISABLED"}],
  ), false);
});

test("AIINDREL-PACK-003 unbound PromptSet and empty CountryPack refs pass only with no PromptSet and empty activation evidence", () => {
  const config = Object.freeze({
    ...industryConfig,
    domainPromptSetId: undefined,
    countryPackRefs: Object.freeze([]),
  });
  assert.equal(matchesAIIndustryConfigRelationshipFloors(config, tenantConfig, undefined, []), true);
  assert.equal(matchesAIIndustryConfigRelationshipFloors(config, tenantConfig, promptSet, []), false);
  assert.equal(matchesAIIndustryConfigRelationshipFloors(config, tenantConfig, undefined, [activation]), false);
});

test("AIINDREL-SCOPE-001 exact Industry snapshot scope plus relationship-complete supplied config passes", () => {
  assert.equal(matchesAIIndustryConfigSnapshotRelationshipFloors(
    snapshot,
    industryConfig,
    tenantConfig,
    promptSet,
    [activation],
  ), true);
});

test("AIINDREL-SCOPE-002 wrong scope disabled config or relationship failure denies", () => {
  for (const [candidateSnapshot, candidateIndustry, candidatePrompt, activations] of [
    [{...snapshot, industryContextId: ids.siblingIndustry}, industryConfig, promptSet, [activation]],
    [snapshot, {...industryConfig, enabled: false}, promptSet, [activation]],
    [snapshot, industryConfig, {...promptSet, status: "RETIRED"}, [activation]],
    [snapshot, industryConfig, promptSet, []],
  ]) {
    assert.equal(matchesAIIndustryConfigSnapshotRelationshipFloors(
      candidateSnapshot,
      candidateIndustry,
      tenantConfig,
      candidatePrompt,
      activations,
    ), false);
  }
});

test("AIINDREL-REQ-001 DD-256 request prerequisites plus relationship-complete Industry config pass", () => {
  assert.equal(matchesAIRequestIndustryConfigRelationshipPrerequisiteFloors(
    request,
    declaration,
    snapshot,
    tenantConfig,
    industryConfig,
    promptSet,
    [activation],
  ), true);
});

test("AIINDREL-REQ-002 request Tenant Industry or relationship failure denies", () => {
  for (const [candidateRequest, candidateTenant, candidateIndustry, candidatePrompt, activations] of [
    [{...request, capabilityCode: "AI.EMBED"}, tenantConfig, industryConfig, promptSet, [activation]],
    [request, {...tenantConfig, enabled: false}, industryConfig, promptSet, [activation]],
    [request, tenantConfig, {...industryConfig, enabled: false}, promptSet, [activation]],
    [request, tenantConfig, industryConfig, {...promptSet, status: "RETIRED"}, [activation]],
    [request, tenantConfig, industryConfig, promptSet, []],
  ]) {
    assert.equal(matchesAIRequestIndustryConfigRelationshipPrerequisiteFloors(
      candidateRequest,
      declaration,
      snapshot,
      candidateTenant,
      candidateIndustry,
      candidatePrompt,
      activations,
    ), false);
  }
});

test("AIINDREL-PRE-001 relationship-complete pre-routing path returns expected immutable candidate set", () => {
  const result = buildAIIndustryConfigRelationshipConstrainedPreRoutingSet({
    request,
    declaration,
    snapshot,
    tenantConfig,
    industryConfig,
    promptSet,
    activations: [activation],
    candidates,
  });
  assert.deepEqual(result, [{providerId: ids.providerA, modelId: ids.modelA}]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.every((entry) => Object.isFrozen(entry)), true);
});

test("AIINDREL-PRE-002 relationship prerequisite failure returns null rather than empty success", () => {
  assert.equal(buildAIIndustryConfigRelationshipConstrainedPreRoutingSet({
    request,
    declaration,
    snapshot,
    tenantConfig,
    industryConfig,
    promptSet: {...promptSet, status: "RETIRED"},
    activations: [activation],
    candidates,
  }), null);
});

test("AIINDREL-PRE-003 valid empty candidate evidence remains immutable empty success when relationships pass", () => {
  const result = buildAIIndustryConfigRelationshipConstrainedPreRoutingSet({
    request,
    declaration,
    snapshot,
    tenantConfig,
    industryConfig,
    promptSet,
    activations: [activation],
    candidates: [],
  });
  assert.deepEqual(result, []);
  assert.equal(Object.isFrozen(result), true);
});

test("AIINDREL-PRE-004 inputs remain unchanged and output exposes no effective-config prompt localization policy route or execution authority", () => {
  const input = {
    request,
    declaration,
    snapshot,
    tenantConfig,
    industryConfig,
    promptSet,
    activations: [activation],
    candidates,
  };
  const before = JSON.stringify(input);
  const result = buildAIIndustryConfigRelationshipConstrainedPreRoutingSet(input);
  assert.ok(result);
  assert.equal(JSON.stringify(input), before);
  for (const candidate of result) {
    for (const forbidden of [
      "effectiveConfig",
      "promptSet",
      "countryPack",
      "localization",
      "policyDecision",
      "score",
      "fallback",
      "credentialRef",
      "routeDecisionId",
      "authorized",
    ]) {
      assert.equal(forbidden in candidate, false);
    }
  }
});
