import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAITenantConfigModelAllowlistFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  config: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  providerA: "33333333-3333-4333-8333-333333333333",
  providerB: "44444444-4444-4444-8444-444444444444",
  providerOther: "55555555-5555-4555-8555-555555555555",
  modelA: "66666666-6666-4666-8666-666666666666",
  modelB: "77777777-7777-4777-8777-777777777777",
  modelOther: "88888888-8888-4888-8888-888888888888",
});

const baseConfig = Object.freeze({
  id: ids.config,
  tenantId: ids.tenant,
  enabled: true,
  allowedCapabilities: Object.freeze(["CHAT"]),
  allowedProviderIds: Object.freeze([ids.providerA, ids.providerB]),
  allowedModelIds: Object.freeze([ids.modelA, ids.modelB]),
  maxSensitivityClass: "CONFIDENTIAL",
  residencyPolicyId: "residency:raw",
  monthlyBudgetPolicyRef: "budget:raw",
  retentionPolicyId: "retention:raw",
  promptOverridePolicyId: "prompt-override:raw",
  version: 9,
  updatedAt: "2026-09-26T00:00:00.000Z",
});

const baseModelA = Object.freeze({
  id: ids.modelA,
  providerId: ids.providerA,
  modelCode: "model-a",
  displayName: "Model A",
  capabilities: Object.freeze(["CHAT"]),
  contextWindowClass: "STANDARD",
  inputModalities: Object.freeze(["TEXT"]),
  outputModalities: Object.freeze(["TEXT"]),
  residencyRegions: Object.freeze(["IN"]),
  sensitivityCeiling: "REGULATED",
  costClass: "STANDARD",
  latencyClass: "STANDARD",
  status: "ACTIVE",
  version: 3,
  metadata: Object.freeze({raw: true}),
});

const baseModelB = Object.freeze({
  ...baseModelA,
  id: ids.modelB,
  providerId: ids.providerB,
  modelCode: "model-b",
  displayName: "Model B",
});

function config(overrides = {}) {
  return Object.freeze({...baseConfig, ...overrides});
}

function modelA(overrides = {}) {
  return Object.freeze({...baseModelA, ...overrides});
}

function modelB(overrides = {}) {
  return Object.freeze({...baseModelB, ...overrides});
}

test("AITENCFG-MODEL-CUR-001 empty Model allowlist passes only with empty Model evidence", () => {
  const empty = config({allowedModelIds: Object.freeze([])});
  assert.equal(matchesAITenantConfigModelAllowlistFloors(empty, []), true);
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(empty, [modelA()]),
    false,
  );
});

test("AITENCFG-MODEL-CUR-002 complete exact ACTIVE Model set passes independent of evidence order", () => {
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(config(), [modelA(), modelB()]),
    true,
  );
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(config(), [modelB(), modelA()]),
    true,
  );
});

test("AITENCFG-MODEL-CUR-003 missing, extra, duplicate or wrong-id Model evidence fails closed", () => {
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(config(), [modelA()]),
    false,
  );
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      config(),
      [modelA(), modelB(), {...modelA(), id: ids.modelOther}],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      config(),
      [modelA(), {...modelB(), id: ids.modelA}],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      config(),
      [modelA(), {...modelB(), id: ids.modelOther}],
    ),
    false,
  );
});

test("AITENCFG-MODEL-CUR-004 raw Model status must be exactly ACTIVE without normalization", () => {
  for (const status of ["RETIRED", "active", "ACTIVE ", ""]) {
    assert.equal(
      matchesAITenantConfigModelAllowlistFloors(
        config(),
        [modelA(), modelB({status})],
      ),
      false,
    );
  }
});

test("AITENCFG-MODEL-CUR-005 every Model provider must be an exact allowedProviderIds member", () => {
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      config(),
      [modelA(), modelB({providerId: ids.providerOther})],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      config({allowedProviderIds: Object.freeze([ids.providerA])}),
      [modelA(), modelB()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      config({allowedProviderIds: Object.freeze([ids.providerA, ids.providerOther])}),
      [modelA(), modelB({providerId: ids.providerOther})],
    ),
    true,
  );
});

test("AITENCFG-MODEL-CUR-006 duplicate or malformed Model/Provider allowlist entries fail closed", () => {
  // Array.prototype.every skips holes. A missing provider entry must not become
  // valid merely because no Model evidence consumes it.
  for (const allowedProviderIds of [new Array(1), [ids.providerA, , ids.providerB]]) {
    assert.equal(
      matchesAITenantConfigModelAllowlistFloors(
        config({allowedProviderIds, allowedModelIds: []}),
        [],
      ),
      false,
    );
    assert.equal(
      matchesAITenantConfigModelAllowlistFloors(
        config({allowedProviderIds}),
        [modelA(), modelB()],
      ),
      false,
    );
  }

  for (const allowedModelIds of [
    [ids.modelA, ids.modelA],
    [ids.modelA, "bad"],
    [ids.modelA, null],
    "not-an-array",
  ]) {
    assert.equal(
      matchesAITenantConfigModelAllowlistFloors(
        config({allowedModelIds}),
        [modelA(), modelB()],
      ),
      false,
    );
  }

  for (const allowedProviderIds of [
    [ids.providerA, ids.providerA],
    [ids.providerA, "bad"],
    [ids.providerA, null],
    "not-an-array",
  ]) {
    assert.equal(
      matchesAITenantConfigModelAllowlistFloors(
        config({allowedProviderIds}),
        [modelA(), modelB()],
      ),
      false,
    );
  }
});

test("AITENCFG-MODEL-CUR-007 malformed config identity or Model identity/provider/status shape fails closed", () => {
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      config({id: "bad"}),
      [modelA(), modelB()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      config({tenantId: "bad"}),
      [modelA(), modelB()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      config(),
      [modelA({id: "bad"}), modelB()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      config(),
      [modelA({providerId: "bad"}), modelB()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      config(),
      [modelA({status: 7}), modelB()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(config(), undefined),
    false,
  );
});

test("AITENCFG-MODEL-CUR-008 unrelated config/catalog semantics remain uninterpreted and inputs are unchanged", () => {
  const candidateConfig = config({
    enabled: false,
    allowedCapabilities: Object.freeze(["not-interpreted"]),
    maxSensitivityClass: "PUBLIC",
    residencyPolicyId: "",
    monthlyBudgetPolicyRef: undefined,
    retentionPolicyId: "",
    promptOverridePolicyId: "",
    version: -999,
    updatedAt: "not-interpreted",
  });
  const candidateA = modelA({
    modelCode: "",
    displayName: "",
    capabilities: Object.freeze([null, "OTHER"]),
    contextWindowClass: "",
    inputModalities: Object.freeze([null]),
    outputModalities: Object.freeze(["OTHER"]),
    residencyRegions: Object.freeze([null, ""]),
    sensitivityCeiling: "PUBLIC",
    costClass: "",
    latencyClass: "",
    version: -999,
    metadata: Object.freeze({raw: Object.freeze(["x"])}),
  });
  const candidateB = modelB({
    modelCode: "",
    displayName: "",
    capabilities: Object.freeze([]),
    contextWindowClass: "",
    inputModalities: Object.freeze([]),
    outputModalities: Object.freeze([]),
    residencyRegions: Object.freeze([]),
    sensitivityCeiling: "PUBLIC",
    costClass: "",
    latencyClass: "",
    version: 0,
    metadata: null,
  });

  const beforeConfig = JSON.stringify(candidateConfig);
  const beforeModels = JSON.stringify([candidateA, candidateB]);

  assert.equal(
    matchesAITenantConfigModelAllowlistFloors(
      candidateConfig,
      [candidateA, candidateB],
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateConfig), beforeConfig);
  assert.equal(JSON.stringify([candidateA, candidateB]), beforeModels);
});
