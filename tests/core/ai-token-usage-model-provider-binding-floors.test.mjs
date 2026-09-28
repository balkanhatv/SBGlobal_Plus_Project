import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAITokenUsageModelProviderBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  usage: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  principal: "44444444-4444-4444-8444-444444444444",
  provider: "55555555-5555-4555-8555-555555555555",
  otherProvider: "66666666-6666-4666-8666-666666666666",
  model: "77777777-7777-4777-8777-777777777777",
  otherModel: "88888888-8888-4888-8888-888888888888",
  correlation: "99999999-9999-4999-8999-999999999999",
});

const baseUsage = Object.freeze({
  id: ids.usage,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  principalId: ids.principal,
  capabilityCode: "CHAT",
  providerId: ids.provider,
  modelId: ids.model,
  inputUnits: "12.000000000000000001",
  outputUnits: "3",
  mediaUnits: "0",
  occurredAt: "2026-09-25T00:00:00.000Z",
  correlationId: ids.correlation,
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
  version: 1,
  metadata: Object.freeze({raw: true}),
});

function usage(overrides = {}) {
  return Object.freeze({...baseUsage, ...overrides});
}

function model(overrides = {}) {
  return Object.freeze({...baseModel, ...overrides});
}

test("AIUSAGE-MODEL-CUR-001 exact TokenUsage Model/Provider pair passes", () => {
  assert.equal(
    matchesAITokenUsageModelProviderBindingFloors(usage(), model()),
    true,
  );
});

test("AIUSAGE-MODEL-CUR-002 missing model evidence or wrong Model id fails closed", () => {
  assert.equal(matchesAITokenUsageModelProviderBindingFloors(usage()), false);
  assert.equal(
    matchesAITokenUsageModelProviderBindingFloors(
      usage(),
      model({id: ids.otherModel}),
    ),
    false,
  );
});

test("AIUSAGE-MODEL-CUR-003 Model provider id must exactly equal TokenUsage provider id", () => {
  assert.equal(
    matchesAITokenUsageModelProviderBindingFloors(
      usage(),
      model({providerId: ids.otherProvider}),
    ),
    false,
  );
  assert.equal(
    matchesAITokenUsageModelProviderBindingFloors(
      usage({providerId: ids.otherProvider}),
      model(),
    ),
    false,
  );
});

test("AIUSAGE-MODEL-CUR-004 malformed relevant usage/model identity or pair shape fails closed", () => {
  for (const candidate of [
    usage({id: "bad"}),
    usage({tenantId: "bad"}),
    usage({industryContextId: "bad"}),
    usage({modelId: "bad"}),
    usage({providerId: "bad"}),
  ]) {
    assert.equal(
      matchesAITokenUsageModelProviderBindingFloors(candidate, model()),
      false,
    );
  }

  for (const candidateModel of [
    model({id: "bad"}),
    model({providerId: "bad"}),
  ]) {
    assert.equal(
      matchesAITokenUsageModelProviderBindingFloors(usage(), candidateModel),
      false,
    );
  }
});

test("AIUSAGE-MODEL-CUR-005 Model runtime/catalog semantics are uninterpreted and no Provider row is required", () => {
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

  assert.equal(
    matchesAITokenUsageModelProviderBindingFloors(usage(), rawModel),
    true,
  );
});

test("AIUSAGE-MODEL-CUR-006 TokenUsage principal/capability/unit/time/correlation evidence is uninterpreted", () => {
  const rawUsage = usage({
    principalId: "not-interpreted",
    capabilityCode: "",
    inputUnits: "not-interpreted",
    outputUnits: "",
    mediaUnits: "-999",
    occurredAt: "not-interpreted",
    correlationId: "not-interpreted",
  });

  assert.equal(
    matchesAITokenUsageModelProviderBindingFloors(rawUsage, model()),
    true,
  );
});

test("AIUSAGE-MODEL-CUR-007 inputs remain unchanged and true grants no runtime/billing authority", () => {
  const candidateUsage = usage();
  const candidateModel = model();
  const beforeUsage = JSON.stringify(candidateUsage);
  const beforeModel = JSON.stringify(candidateModel);

  assert.equal(
    matchesAITokenUsageModelProviderBindingFloors(candidateUsage, candidateModel),
    true,
  );
  assert.equal(JSON.stringify(candidateUsage), beforeUsage);
  assert.equal(JSON.stringify(candidateModel), beforeModel);
  assert.equal("authorized" in candidateUsage, false);
  assert.equal("billable" in candidateUsage, false);
  assert.equal("routable" in candidateModel, false);
});
