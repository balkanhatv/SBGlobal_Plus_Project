import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIModelProviderBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  model: "11111111-1111-4111-8111-111111111111",
  provider: "22222222-2222-4222-8222-222222222222",
  otherProvider: "33333333-3333-4333-8333-333333333333",
});

const baseModel = Object.freeze({
  id: ids.model,
  providerId: ids.provider,
  modelCode: "chat-v1",
  displayName: "Chat model",
  capabilities: Object.freeze(["CHAT"]),
  contextWindowClass: "STANDARD",
  inputModalities: Object.freeze(["TEXT"]),
  outputModalities: Object.freeze(["TEXT"]),
  residencyRegions: Object.freeze(["IN-CENTRAL"]),
  sensitivityCeiling: "REGULATED",
  costClass: "STANDARD",
  latencyClass: "STANDARD",
  status: "ACTIVE",
  version: 7,
  metadata: Object.freeze({raw: true}),
});

const baseProvider = Object.freeze({
  id: ids.provider,
  code: "provider-a",
  status: "ACTIVE",
  adapterType: "REST",
  supportedRegions: Object.freeze(["IN-CENTRAL"]),
  supportedCapabilities: Object.freeze(["CHAT"]),
  securityClass: "REGULATED",
  residencyMetadata: Object.freeze({raw: true}),
  healthState: "HEALTHY",
  version: 3,
  createdAt: "2026-09-26T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
});

function model(overrides = {}) {
  return Object.freeze({...baseModel, ...overrides});
}

function provider(overrides = {}) {
  return Object.freeze({...baseProvider, ...overrides});
}

test("AIMODEL-PROV-CUR-001 exact provider-id binding passes", () => {
  assert.equal(matchesAIModelProviderBindingFloors(model(), provider()), true);
});

test("AIMODEL-PROV-CUR-002 missing Provider evidence or wrong Provider id fails closed", () => {
  assert.equal(matchesAIModelProviderBindingFloors(model()), false);
  assert.equal(
    matchesAIModelProviderBindingFloors(
      model(),
      provider({id: ids.otherProvider}),
    ),
    false,
  );
});

test("AIMODEL-PROV-CUR-003 malformed Model id/providerId or Provider id fails closed", () => {
  assert.equal(
    matchesAIModelProviderBindingFloors(model({id: "bad"}), provider()),
    false,
  );
  assert.equal(
    matchesAIModelProviderBindingFloors(model({providerId: "bad"}), provider()),
    false,
  );
  assert.equal(
    matchesAIModelProviderBindingFloors(model(), provider({id: "bad"})),
    false,
  );
});

test("AIMODEL-PROV-CUR-004 Provider lifecycle/health/security/capability/residency/version/timestamps are uninterpreted", () => {
  const rawProvider = provider({
    code: "",
    status: "RETIRED",
    adapterType: "",
    supportedRegions: Object.freeze([null, ""]),
    supportedCapabilities: Object.freeze([null, "UNRELATED"]),
    securityClass: "",
    residencyMetadata: Object.freeze({routing: "not-interpreted"}),
    healthState: "DOWN",
    version: -999,
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });

  assert.equal(matchesAIModelProviderBindingFloors(model(), rawProvider), true);
});

test("AIMODEL-PROV-CUR-005 Model runtime/catalog semantics are uninterpreted", () => {
  const rawModel = model({
    modelCode: "",
    displayName: "",
    capabilities: Object.freeze([null, "UNRELATED"]),
    contextWindowClass: "",
    inputModalities: Object.freeze([null]),
    outputModalities: Object.freeze(["UNRELATED"]),
    residencyRegions: Object.freeze([""]),
    sensitivityCeiling: "PUBLIC",
    costClass: "",
    latencyClass: "",
    status: "RETIRED",
    version: -999,
    metadata: Object.freeze({routing: "not-interpreted"}),
  });

  assert.equal(matchesAIModelProviderBindingFloors(rawModel, provider()), true);
});

test("AIMODEL-PROV-CUR-006 inputs remain unchanged and true grants no runtime authority", () => {
  const candidateModel = model();
  const candidateProvider = provider();
  const beforeModel = JSON.stringify(candidateModel);
  const beforeProvider = JSON.stringify(candidateProvider);

  assert.equal(
    matchesAIModelProviderBindingFloors(candidateModel, candidateProvider),
    true,
  );
  assert.equal(JSON.stringify(candidateModel), beforeModel);
  assert.equal(JSON.stringify(candidateProvider), beforeProvider);
  assert.equal("current" in candidateProvider, false);
  assert.equal("eligible" in candidateModel, false);
  assert.equal("routable" in candidateProvider, false);
  assert.equal("credential" in candidateProvider, false);
  assert.equal("authorized" in candidateModel, false);
});
