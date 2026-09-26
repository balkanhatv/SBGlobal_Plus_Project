import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAITokenUsageProviderBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  usage: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  provider: "44444444-4444-4444-8444-444444444444",
  otherProvider: "55555555-5555-4555-8555-555555555555",
  model: "66666666-6666-4666-8666-666666666666",
  principal: "77777777-7777-4777-8777-777777777777",
  correlation: "88888888-8888-4888-8888-888888888888",
});

const baseUsage = Object.freeze({
  id: ids.usage,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  principalId: ids.principal,
  capabilityCode: "GENERATION",
  providerId: ids.provider,
  modelId: ids.model,
  inputUnits: "12",
  outputUnits: "5",
  mediaUnits: "1",
  occurredAt: "2026-09-26T00:00:00.000Z",
  correlationId: ids.correlation,
});

const baseProvider = Object.freeze({
  id: ids.provider,
  code: "provider-a",
  status: "ACTIVE",
  adapterType: "REST",
  supportedRegions: Object.freeze(["IN"]),
  supportedCapabilities: Object.freeze(["GENERATION"]),
  securityClass: "REGULATED",
  residencyMetadata: Object.freeze({region: "IN"}),
  healthState: "HEALTHY",
  version: 7,
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
});

function usage(overrides = {}) {
  return Object.freeze({...baseUsage, ...overrides});
}

function provider(overrides = {}) {
  return Object.freeze({...baseProvider, ...overrides});
}

test("AIUSAGE-PROV-CUR-001 exact provider-id binding passes", () => {
  assert.equal(
    matchesAITokenUsageProviderBindingFloors(usage(), provider()),
    true,
  );
});

test("AIUSAGE-PROV-CUR-002 missing Provider evidence or wrong Provider id fails closed", () => {
  assert.equal(matchesAITokenUsageProviderBindingFloors(usage()), false);
  assert.equal(
    matchesAITokenUsageProviderBindingFloors(
      usage(),
      provider({id: ids.otherProvider}),
    ),
    false,
  );
});

test("AIUSAGE-PROV-CUR-003 malformed relevant identity shape fails closed", () => {
  for (const candidate of [
    usage({id: "bad"}),
    usage({tenantId: "bad"}),
    usage({industryContextId: "bad"}),
    usage({providerId: "bad"}),
  ]) {
    assert.equal(
      matchesAITokenUsageProviderBindingFloors(candidate, provider()),
      false,
    );
  }

  assert.equal(
    matchesAITokenUsageProviderBindingFloors(
      usage(),
      provider({id: "bad"}),
    ),
    false,
  );
});

test("AIUSAGE-PROV-CUR-004 Provider runtime semantics stay uninterpreted", () => {
  const rawProvider = provider({
    code: "",
    status: "RETIRED",
    adapterType: "",
    supportedRegions: Object.freeze([null, ""]),
    supportedCapabilities: Object.freeze([null, "UNRELATED"]),
    securityClass: "",
    residencyMetadata: Object.freeze({raw: true}),
    healthState: "DOWN",
    version: -999,
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });

  assert.equal(
    matchesAITokenUsageProviderBindingFloors(usage(), rawProvider),
    true,
  );
});

test("AIUSAGE-PROV-CUR-005 TokenUsage non-provider evidence stays uninterpreted", () => {
  const rawUsage = usage({
    principalId: "not-interpreted",
    capabilityCode: "",
    modelId: "not-interpreted",
    inputUnits: "-1",
    outputUnits: "NaN",
    mediaUnits: "raw",
    occurredAt: "not-interpreted",
    correlationId: "not-interpreted",
  });

  assert.equal(
    matchesAITokenUsageProviderBindingFloors(rawUsage, provider()),
    true,
  );
});

test("AIUSAGE-PROV-CUR-006 pure predicate creates no runtime authority", () => {
  const candidateUsage = usage();
  const candidateProvider = provider();
  const beforeUsage = JSON.stringify(candidateUsage);
  const beforeProvider = JSON.stringify(candidateProvider);

  assert.equal(
    matchesAITokenUsageProviderBindingFloors(
      candidateUsage,
      candidateProvider,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateUsage), beforeUsage);
  assert.equal(JSON.stringify(candidateProvider), beforeProvider);
  assert.equal("authorized" in candidateUsage, false);
  assert.equal("routable" in candidateProvider, false);
  assert.equal("credential" in candidateProvider, false);
});
