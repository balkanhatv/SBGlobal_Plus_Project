import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAITokenUsageCapabilityBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  usage: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  principal: "44444444-4444-4444-8444-444444444444",
  provider: "55555555-5555-4555-8555-555555555555",
  model: "66666666-6666-4666-8666-666666666666",
  capability: "77777777-7777-4777-8777-777777777777",
  correlation: "88888888-8888-4888-8888-888888888888",
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

const baseCapability = Object.freeze({
  id: ids.capability,
  code: "CHAT",
  category: "CHAT",
  requiredEntitlement: "ai.chat",
  defaultPolicyClass: "STANDARD",
  schemaVersion: 1,
  status: "ACTIVE",
});

function usage(overrides = {}) {
  return Object.freeze({...baseUsage, ...overrides});
}

function capability(overrides = {}) {
  return Object.freeze({...baseCapability, ...overrides});
}

test("AIUSAGE-CAP-CUR-001 exact TokenUsage and capability code pass", () => {
  assert.equal(
    matchesAITokenUsageCapabilityBindingFloors(usage(), capability()),
    true,
  );
});

test("AIUSAGE-CAP-CUR-002 missing capability evidence or mismatched code fails closed", () => {
  assert.equal(matchesAITokenUsageCapabilityBindingFloors(usage()), false);
  assert.equal(
    matchesAITokenUsageCapabilityBindingFloors(
      usage(),
      capability({code: "EMBEDDING"}),
    ),
    false,
  );
});

test("AIUSAGE-CAP-CUR-003 code equality is exact without normalization", () => {
  for (const code of ["chat", "CHAT ", " CHAT"]) {
    assert.equal(
      matchesAITokenUsageCapabilityBindingFloors(usage(), capability({code})),
      false,
      code,
    );
  }

  assert.equal(
    matchesAITokenUsageCapabilityBindingFloors(
      usage({capabilityCode: ""}),
      capability({code: ""}),
    ),
    true,
  );
});

test("AIUSAGE-CAP-CUR-004 malformed relevant TokenUsage identity/Industry/code shape fails closed", () => {
  for (const candidate of [
    usage({id: "bad"}),
    usage({tenantId: "bad"}),
    usage({industryContextId: "bad"}),
    usage({capabilityCode: null}),
  ]) {
    assert.equal(
      matchesAITokenUsageCapabilityBindingFloors(candidate, capability()),
      false,
    );
  }
});

test("AIUSAGE-CAP-CUR-005 malformed capability id/code evidence fails closed", () => {
  for (const candidate of [
    capability({id: "bad"}),
    capability({code: null}),
  ]) {
    assert.equal(
      matchesAITokenUsageCapabilityBindingFloors(usage(), candidate),
      false,
    );
  }
});

test("AIUSAGE-CAP-CUR-006 capability status/category/entitlement/policy/schema semantics are uninterpreted", () => {
  const rawCapability = capability({
    category: "UNRELATED",
    requiredEntitlement: null,
    defaultPolicyClass: "",
    schemaVersion: -999,
    status: "RETIRED",
  });

  assert.equal(
    matchesAITokenUsageCapabilityBindingFloors(usage(), rawCapability),
    true,
  );
});

test("AIUSAGE-CAP-CUR-007 unrelated usage evidence is uninterpreted and inputs remain unchanged", () => {
  const rawUsage = usage({
    principalId: "not-interpreted",
    providerId: "not-interpreted",
    modelId: "not-interpreted",
    inputUnits: "not-interpreted",
    outputUnits: "",
    mediaUnits: "-999",
    occurredAt: "not-interpreted",
    correlationId: "not-interpreted",
  });
  const rawCapability = capability();
  const beforeUsage = JSON.stringify(rawUsage);
  const beforeCapability = JSON.stringify(rawCapability);

  assert.equal(
    matchesAITokenUsageCapabilityBindingFloors(rawUsage, rawCapability),
    true,
  );
  assert.equal(JSON.stringify(rawUsage), beforeUsage);
  assert.equal(JSON.stringify(rawCapability), beforeCapability);
  assert.equal("authorized" in rawUsage, false);
  assert.equal("billable" in rawUsage, false);
  assert.equal("routable" in rawCapability, false);
});
