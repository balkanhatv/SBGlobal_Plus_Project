import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAICostTokenUsageBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  usage: "11111111-1111-4111-8111-111111111111",
  otherUsage: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  principal: "55555555-5555-4555-8555-555555555555",
  provider: "66666666-6666-4666-8666-666666666666",
  model: "77777777-7777-4777-8777-777777777777",
  correlation: "88888888-8888-4888-8888-888888888888",
});

const baseCost = Object.freeze({
  usageId: ids.usage,
  costCurrency: "INR",
  estimatedMinorUnits: "125",
  providerRateVersion: "rate-v1",
  billableClass: "STANDARD",
  finalizedAt: "2026-09-25T00:30:00.000Z",
});

const baseUsage = Object.freeze({
  id: ids.usage,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  principalId: ids.principal,
  capabilityCode: "CHAT",
  providerId: ids.provider,
  modelId: ids.model,
  inputUnits: "12",
  outputUnits: "3",
  mediaUnits: "0",
  occurredAt: "2026-09-25T00:00:00.000Z",
  correlationId: ids.correlation,
});

function cost(overrides = {}) {
  return Object.freeze({...baseCost, ...overrides});
}

function usage(overrides = {}) {
  return Object.freeze({...baseUsage, ...overrides});
}

test("AICOST-USAGE-CUR-001 exact cost usage id and TokenUsage id pass", () => {
  assert.equal(matchesAICostTokenUsageBindingFloors(cost(), usage()), true);
});

test("AICOST-USAGE-CUR-002 missing TokenUsage evidence or mismatched usage id fails closed", () => {
  assert.equal(matchesAICostTokenUsageBindingFloors(cost()), false);
  assert.equal(
    matchesAICostTokenUsageBindingFloors(
      cost(),
      usage({id: ids.otherUsage}),
    ),
    false,
  );
});

test("AICOST-USAGE-CUR-003 malformed cost usage id or TokenUsage id fails closed", () => {
  assert.equal(
    matchesAICostTokenUsageBindingFloors(cost({usageId: "bad"}), usage()),
    false,
  );
  assert.equal(
    matchesAICostTokenUsageBindingFloors(cost(), usage({id: "bad"})),
    false,
  );
});

test("AICOST-USAGE-CUR-004 cost pricing/billing/finalization evidence is uninterpreted", () => {
  const rawCost = cost({
    costCurrency: "",
    estimatedMinorUnits: "-999",
    providerRateVersion: "",
    billableClass: "",
    finalizedAt: "not-interpreted",
  });
  assert.equal(matchesAICostTokenUsageBindingFloors(rawCost, usage()), true);
});

test("AICOST-USAGE-CUR-005 TokenUsage scope/principal/catalog/units/time evidence is uninterpreted", () => {
  const rawUsage = usage({
    tenantId: "not-interpreted",
    industryContextId: "not-interpreted",
    principalId: "not-interpreted",
    capabilityCode: "",
    providerId: "not-interpreted",
    modelId: "not-interpreted",
    inputUnits: "not-interpreted",
    outputUnits: "",
    mediaUnits: "-999",
    occurredAt: "not-interpreted",
    correlationId: "not-interpreted",
  });
  assert.equal(matchesAICostTokenUsageBindingFloors(cost(), rawUsage), true);
});

test("AICOST-USAGE-CUR-006 inputs remain unchanged and true grants no billing/execution authority", () => {
  const candidateCost = cost();
  const candidateUsage = usage();
  const beforeCost = JSON.stringify(candidateCost);
  const beforeUsage = JSON.stringify(candidateUsage);

  assert.equal(
    matchesAICostTokenUsageBindingFloors(candidateCost, candidateUsage),
    true,
  );
  assert.equal(JSON.stringify(candidateCost), beforeCost);
  assert.equal(JSON.stringify(candidateUsage), beforeUsage);
  assert.equal("billable" in candidateCost, false);
  assert.equal("finalized" in candidateCost, false);
  assert.equal("authorized" in candidateUsage, false);
});
