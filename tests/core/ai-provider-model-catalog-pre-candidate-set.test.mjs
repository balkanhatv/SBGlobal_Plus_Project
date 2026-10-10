import test from "node:test";
import assert from "node:assert/strict";

import {
  filterAIOperationProviderModelCatalogPreCandidates,
  matchesAIProviderModelCatalogEvidenceSetFloor,
  projectAIProviderModelCatalogPair,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  providerA: "33333333-3333-4333-8333-333333333333",
  providerB: "44444444-4444-4444-8444-444444444444",
  modelA: "55555555-5555-4555-8555-555555555555",
  modelB: "66666666-6666-4666-8666-666666666666",
  modelC: "77777777-7777-4777-8777-777777777777",
});

const declaration = Object.freeze({
  operation: Object.freeze({
    operationId: "ai.chat.generate",
    module: "AI",
    scopeClass: "TENANT_CORE",
    kind: "QUERY",
    permissionCode: "ai.chat.use",
    entitlementRequirement: "ai.chat",
    inputSchemaVersion: 1,
    outputSchemaVersion: 1,
    idempotencyPolicy: "NONE",
    rateClass: "AI_COSTED",
    auditClass: "AI_STANDARD",
    domainService: "AIGateway.generate",
    emittedEvents: Object.freeze([]),
    errorCodes: Object.freeze(["PERMISSION_DENIED"]),
  }),
  ai: Object.freeze({
    apiAccessClass: "TENANT_API",
    capabilityCode: "AI.CHAT",
    streamingMode: "OPTIONAL",
    dataClassCeiling: "CONFIDENTIAL",
    residencyPolicyRef: "tenant.residency",
  }),
});

const snapshot = Object.freeze({
  id: ids.snapshot,
  tenantId: ids.tenant,
  version: "31",
  subscriptionVersion: "41",
  entitlementSnapshotVersion: "51",
  msPackVersions: Object.freeze({}),
  countryPackVersions: Object.freeze({}),
  tenantAiConfigVersion: "71",
  allowedCapabilityIds: Object.freeze([]),
  allowedApiClasses: Object.freeze(["TENANT_API"]),
  allowedProviderIds: Object.freeze([ids.providerA]),
  allowedModelClasses: Object.freeze([]),
  status: "ACTIVE",
  compiledAt: "2026-09-20T00:00:00.000Z",
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

const providerB = Object.freeze({
  ...providerA,
  id: ids.providerB,
  code: "PROVIDER_B",
});

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

const modelB = Object.freeze({
  ...modelA,
  id: ids.modelB,
  providerId: ids.providerB,
  modelCode: "model-b",
  displayName: "Model B",
});

const modelC = Object.freeze({
  ...modelA,
  id: ids.modelC,
  modelCode: "model-c",
  displayName: "Model C",
  capabilities: Object.freeze(["AI.EMBED"]),
});

const baseInput = Object.freeze({
  declaration,
  snapshot,
  providers: Object.freeze([providerB, providerA]),
  models: Object.freeze([modelC, modelB, modelA]),
  sensitivityClass: "CONFIDENTIAL",
  authorizedResidencyRegion: "IN-CENTRAL",
});

test("AIROUTE-SET-SHAPE-001 valid unique Provider/Model evidence with exact Provider references passes", () => {
  assert.equal(
    matchesAIProviderModelCatalogEvidenceSetFloor(
      [providerA, providerB],
      [modelA, modelB, modelC],
    ),
    true,
  );
});

test("AIROUTE-SET-SHAPE-002 sparse duplicate malformed or orphan evidence fails closed", () => {
  const sparseProviders = new Array(1);
  for (const [providers, models] of [
    [sparseProviders, []],
    [[providerA, providerA], [modelA]],
    [[{...providerA, id: "bad"}], []],
    [[providerA], [{...modelA, providerId: ids.providerB}]],
    [[providerA], [{...modelA, id: "bad"}]],
  ]) {
    assert.equal(matchesAIProviderModelCatalogEvidenceSetFloor(providers, models), false);
  }
});

test("AIROUTE-PAIR-001 exact Model to Provider pair projects immutable ids", () => {
  const pair = projectAIProviderModelCatalogPair(modelA, providerA);
  assert.deepEqual(pair, {providerId: ids.providerA, modelId: ids.modelA});
  assert.equal(Object.isFrozen(pair), true);
});

test("AIROUTE-PAIR-002 wrong or malformed pair returns null and no route metadata", () => {
  assert.equal(projectAIProviderModelCatalogPair(modelA, providerB), null);
  assert.equal(projectAIProviderModelCatalogPair({...modelA, id: "bad"}, providerA), null);
});

test("AIROUTE-SET-FILTER-001 only DD-237 passing pairs are included", () => {
  assert.deepEqual(
    filterAIOperationProviderModelCatalogPreCandidates(baseInput),
    [{providerId: ids.providerA, modelId: ids.modelA}],
  );
});

test("AIROUTE-SET-FILTER-002 filtering is independent of input array order", () => {
  const first = filterAIOperationProviderModelCatalogPreCandidates(baseInput);
  const second = filterAIOperationProviderModelCatalogPreCandidates({
    ...baseInput,
    providers: [providerA, providerB],
    models: [modelA, modelB, modelC],
  });
  assert.deepEqual(second, first);
});

test("AIROUTE-SET-CANON-001 multi-candidate output is immutable duplicate-free canonical id order", () => {
  const modelD = {...modelA, id: "88888888-8888-4888-8888-888888888888", modelCode: "model-d"};
  const result = filterAIOperationProviderModelCatalogPreCandidates({
    ...baseInput,
    providers: [providerA],
    models: [modelD, modelA],
  });
  assert.deepEqual(result, [
    {providerId: ids.providerA, modelId: ids.modelA},
    {providerId: ids.providerA, modelId: modelD.id},
  ]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.every(Object.isFrozen), true);
});

test("AIROUTE-SET-CANON-002 output exposes no score preference health or fallback metadata", () => {
  const result = filterAIOperationProviderModelCatalogPreCandidates({
    ...baseInput,
    providers: [providerA],
    models: [modelA],
  });
  assert.ok(result);
  assert.deepEqual(Object.keys(result[0]).sort(), ["modelId", "providerId"]);
});

test("AIROUTE-SET-EMPTY-001 valid zero-match evidence returns immutable empty array", () => {
  const result = filterAIOperationProviderModelCatalogPreCandidates({
    ...baseInput,
    providers: [providerA],
    models: [modelC],
  });
  assert.deepEqual(result, []);
  assert.equal(Object.isFrozen(result), true);
});

test("AIROUTE-SET-EMPTY-002 malformed evidence returns null instead of empty success", () => {
  assert.equal(
    filterAIOperationProviderModelCatalogPreCandidates({
      ...baseInput,
      providers: [providerA],
      models: [{...modelA, providerId: ids.providerB}],
    }),
    null,
  );
});

test("AIROUTE-SET-BOUND-001 inputs remain unchanged", () => {
  const before = JSON.stringify(baseInput);
  filterAIOperationProviderModelCatalogPreCandidates(baseInput);
  assert.equal(JSON.stringify(baseInput), before);
});

test("AIROUTE-SET-BOUND-002 result grants no class mapping route policy credential or execution authority", () => {
  const result = filterAIOperationProviderModelCatalogPreCandidates({
    ...baseInput,
    providers: [providerA],
    models: [modelA],
  });
  assert.ok(result);
  const forbidden = [
    "modelClass", "routeDecisionId", "score", "fallbackRank",
    "credentialRef", "authorized", "execute",
  ];
  for (const key of forbidden) assert.equal(key in result[0], false);
});
