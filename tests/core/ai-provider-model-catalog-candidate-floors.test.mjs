import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIOperationProviderCapabilityCandidateFloor,
  matchesAIProviderAuthorizedRegionCandidateFloor,
  matchesAIModelProviderActiveCandidateFloor,
  matchesAIModelCapabilityCandidateFloor,
  matchesAIModelSensitivityCandidateFloor,
  matchesAIModelAuthorizedRegionCandidateFloor,
  matchesAIOperationProviderModelCatalogCandidateFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  provider: "33333333-3333-4333-8333-333333333333",
  model: "44444444-4444-4444-8444-444444444444",
  otherProvider: "55555555-5555-4555-8555-555555555555",
});

const operation = Object.freeze({
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
  allowedProviderIds: Object.freeze([ids.provider]),
  allowedModelClasses: Object.freeze([]),
  status: "ACTIVE",
  compiledAt: "2026-09-20T00:00:00.000Z",
});

const provider = Object.freeze({
  id: ids.provider,
  code: "PROVIDER_A",
  status: "ACTIVE",
  adapterType: "ADAPTER_A",
  supportedRegions: Object.freeze([null, "IN-CENTRAL", "IN-SOUTH"]),
  supportedCapabilities: Object.freeze([null, "AI.CHAT", "AI.EMBED"]),
  securityClass: "STANDARD",
  residencyMetadata: Object.freeze({}),
  healthState: "HEALTHY",
  version: 1,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
});

const model = Object.freeze({
  id: ids.model,
  providerId: ids.provider,
  modelCode: "model-a",
  displayName: "Model A",
  capabilities: Object.freeze([null, "AI.CHAT"]),
  contextWindowClass: "STANDARD",
  inputModalities: Object.freeze(["TEXT"]),
  outputModalities: Object.freeze(["TEXT"]),
  residencyRegions: Object.freeze([null, "IN-CENTRAL"]),
  sensitivityCeiling: "CONFIDENTIAL",
  costClass: "STANDARD",
  latencyClass: "STANDARD",
  status: "ACTIVE",
  version: 1,
  metadata: Object.freeze({}),
});

test("AIROUTE-PROV-CAP-001 exact allowed ACTIVE Provider with exact supported capability passes", () => {
  assert.equal(
    matchesAIOperationProviderCapabilityCandidateFloor(declaration, snapshot, provider),
    true,
  );
});

test("AIROUTE-PROV-CAP-002 absent capability malformed support evidence or disallowed/inactive Provider fails", () => {
  for (const [candidateSnapshot, candidateProvider] of [
    [snapshot, {...provider, supportedCapabilities: ["AI.EMBED"]}],
    [snapshot, {...provider, supportedCapabilities: ["AI.CHAT", 7]}],
    [{...snapshot, allowedProviderIds: []}, provider],
    [snapshot, {...provider, status: "INACTIVE"}],
  ]) {
    assert.equal(
      matchesAIOperationProviderCapabilityCandidateFloor(
        declaration,
        candidateSnapshot,
        candidateProvider,
      ),
      false,
    );
  }
});

test("AIROUTE-PROV-REG-001 exact pre-authorized Provider region membership passes", () => {
  assert.equal(
    matchesAIProviderAuthorizedRegionCandidateFloor(provider, "IN-CENTRAL"),
    true,
  );
});

test("AIROUTE-PROV-REG-002 empty unknown non-string region or malformed Provider region evidence fails", () => {
  for (const [candidateProvider, region] of [
    [provider, ""],
    [provider, "US-EAST"],
    [provider, 7],
    [{...provider, supportedRegions: ["IN-CENTRAL", 7]}, "IN-CENTRAL"],
  ]) {
    assert.equal(
      matchesAIProviderAuthorizedRegionCandidateFloor(candidateProvider, region),
      false,
    );
  }
});

test("AIROUTE-MODEL-PROV-001 exact Model to Provider binding with raw ACTIVE Model passes", () => {
  assert.equal(matchesAIModelProviderActiveCandidateFloor(model, provider), true);
});

test("AIROUTE-MODEL-PROV-002 wrong Provider malformed identity or non-ACTIVE Model fails", () => {
  for (const [candidateModel, candidateProvider] of [
    [model, {...provider, id: ids.otherProvider}],
    [{...model, id: "bad"}, provider],
    [{...model, providerId: "bad"}, provider],
    [{...model, status: "RETIRED"}, provider],
  ]) {
    assert.equal(
      matchesAIModelProviderActiveCandidateFloor(candidateModel, candidateProvider),
      false,
    );
  }
});

test("AIROUTE-MODEL-CAP-001 exact Model capability membership passes", () => {
  assert.equal(matchesAIModelCapabilityCandidateFloor(declaration, model), true);
});

test("AIROUTE-MODEL-CAP-002 absent capability or malformed capability evidence fails", () => {
  assert.equal(
    matchesAIModelCapabilityCandidateFloor(
      declaration,
      {...model, capabilities: ["AI.EMBED"]},
    ),
    false,
  );
  assert.equal(
    matchesAIModelCapabilityCandidateFloor(
      declaration,
      {...model, capabilities: ["AI.CHAT", 7]},
    ),
    false,
  );
});

test("AIROUTE-MODEL-SENS-001 known sensitivity pairs follow Model ceiling >= request sensitivity", () => {
  const classes = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SENSITIVE_PERSONAL", "REGULATED"];
  for (let ceilingIndex = 0; ceilingIndex < classes.length; ceilingIndex += 1) {
    for (let requestIndex = 0; requestIndex < classes.length; requestIndex += 1) {
      assert.equal(
        matchesAIModelSensitivityCandidateFloor(
          {...model, sensitivityCeiling: classes[ceilingIndex]},
          classes[requestIndex],
        ),
        ceilingIndex >= requestIndex,
      );
    }
  }
});

test("AIROUTE-MODEL-SENS-002 unknown or malformed sensitivity evidence fails closed", () => {
  assert.equal(matchesAIModelSensitivityCandidateFloor(model, "SECRET"), false);
  assert.equal(
    matchesAIModelSensitivityCandidateFloor(
      {...model, sensitivityCeiling: "SECRET"},
      "PUBLIC",
    ),
    false,
  );
  assert.equal(matchesAIModelSensitivityCandidateFloor(model, 7), false);
});

test("AIROUTE-MODEL-REG-001 exact pre-authorized Model residency-region membership passes", () => {
  assert.equal(
    matchesAIModelAuthorizedRegionCandidateFloor(model, "IN-CENTRAL"),
    true,
  );
});

test("AIROUTE-MODEL-REG-002 unknown empty or malformed Model region evidence fails", () => {
  for (const [candidateModel, region] of [
    [model, "US-EAST"],
    [model, ""],
    [model, 7],
    [{...model, residencyRegions: ["IN-CENTRAL", 7]}, "IN-CENTRAL"],
  ]) {
    assert.equal(
      matchesAIModelAuthorizedRegionCandidateFloor(candidateModel, region),
      false,
    );
  }
});

test("AIROUTE-CAND-001 all Provider/Model catalog candidate prerequisites pass together", () => {
  assert.equal(matchesAIOperationProviderModelCatalogCandidateFloors({
    declaration,
    snapshot,
    provider,
    model,
    sensitivityClass: "CONFIDENTIAL",
    authorizedResidencyRegion: "IN-CENTRAL",
  }), true);
});

test("AIROUTE-CAND-002 any composed prerequisite failure denies the candidate floor", () => {
  for (const input of [
    {declaration, snapshot, provider: {...provider, supportedCapabilities: ["AI.EMBED"]}, model, sensitivityClass: "CONFIDENTIAL", authorizedResidencyRegion: "IN-CENTRAL"},
    {declaration, snapshot, provider, model: {...model, providerId: ids.otherProvider}, sensitivityClass: "CONFIDENTIAL", authorizedResidencyRegion: "IN-CENTRAL"},
    {declaration, snapshot, provider, model, sensitivityClass: "REGULATED", authorizedResidencyRegion: "IN-CENTRAL"},
    {declaration, snapshot, provider, model, sensitivityClass: "CONFIDENTIAL", authorizedResidencyRegion: "US-EAST"},
  ]) {
    assert.equal(matchesAIOperationProviderModelCatalogCandidateFloors(input), false);
  }
});

test("AIROUTE-CAND-003 inputs remain unchanged and true result creates no route or execution authority", () => {
  const input = {
    declaration,
    snapshot,
    provider,
    model,
    sensitivityClass: "CONFIDENTIAL",
    authorizedResidencyRegion: "IN-CENTRAL",
  };
  const before = JSON.stringify(input);
  assert.equal(matchesAIOperationProviderModelCatalogCandidateFloors(input), true);
  assert.equal(JSON.stringify(input), before);
  assert.equal("routeDecisionId" in input, false);
  assert.equal("credentialRef" in input, false);
  assert.equal("selectedModelId" in input, false);
});
