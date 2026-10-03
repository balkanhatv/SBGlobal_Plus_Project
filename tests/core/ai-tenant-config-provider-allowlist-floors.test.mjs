import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAITenantConfigProviderAllowlistFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  config: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  providerA: "33333333-3333-4333-8333-333333333333",
  providerB: "44444444-4444-4444-8444-444444444444",
  providerOther: "55555555-5555-4555-8555-555555555555",
  model: "66666666-6666-4666-8666-666666666666",
});

const baseConfig = Object.freeze({
  id: ids.config,
  tenantId: ids.tenant,
  enabled: true,
  allowedCapabilities: Object.freeze(["CHAT"]),
  allowedProviderIds: Object.freeze([ids.providerA, ids.providerB]),
  allowedModelIds: Object.freeze([ids.model]),
  maxSensitivityClass: "CONFIDENTIAL",
  residencyPolicyId: "residency:raw",
  monthlyBudgetPolicyRef: "budget:raw",
  retentionPolicyId: "retention:raw",
  promptOverridePolicyId: "prompt-override:raw",
  version: 9,
  updatedAt: "2026-09-26T00:00:00.000Z",
});

const baseProviderA = Object.freeze({
  id: ids.providerA,
  code: "provider-a",
  status: "ACTIVE",
  adapterType: "REST",
  supportedRegions: Object.freeze(["IN"]),
  supportedCapabilities: Object.freeze(["CHAT"]),
  securityClass: "REGULATED",
  residencyMetadata: Object.freeze({raw: true}),
  healthState: "HEALTHY",
  version: 3,
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-26T00:00:00.000Z",
});

const baseProviderB = Object.freeze({
  ...baseProviderA,
  id: ids.providerB,
  code: "provider-b",
});

function config(overrides = {}) {
  return Object.freeze({...baseConfig, ...overrides});
}

function providerA(overrides = {}) {
  return Object.freeze({...baseProviderA, ...overrides});
}

function providerB(overrides = {}) {
  return Object.freeze({...baseProviderB, ...overrides});
}

test("AITENCFG-PROV-CUR-001 empty Provider allowlist passes only with empty Provider evidence", () => {
  const empty = config({allowedProviderIds: Object.freeze([])});
  assert.equal(matchesAITenantConfigProviderAllowlistFloors(empty, []), true);
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(empty, [providerA()]),
    false,
  );
});

test("AITENCFG-PROV-CUR-002 complete exact ACTIVE Provider set passes independent of evidence order", () => {
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(config(), [providerA(), providerB()]),
    true,
  );
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(config(), [providerB(), providerA()]),
    true,
  );
});

test("AITENCFG-PROV-CUR-003 missing, extra, duplicate or wrong-id Provider evidence fails closed", () => {
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(config(), [providerA()]),
    false,
  );
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(
      config(),
      [providerA(), providerB(), {...providerA(), id: ids.providerOther}],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(
      config(),
      [providerA(), {...providerB(), id: ids.providerA}],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(
      config(),
      [providerA(), {...providerB(), id: ids.providerOther}],
    ),
    false,
  );
});

test("AITENCFG-PROV-CUR-004 raw Provider status must be exactly ACTIVE without normalization", () => {
  for (const status of ["RETIRED", "active", "ACTIVE ", ""]) {
    assert.equal(
      matchesAITenantConfigProviderAllowlistFloors(
        config(),
        [providerA(), providerB({status})],
      ),
      false,
    );
  }
});

test("AITENCFG-PROV-CUR-005 duplicate or malformed TenantAIConfig Provider-id entries fail closed", () => {
  for (const allowedProviderIds of [
    [ids.providerA, ids.providerA],
    [ids.providerA, "bad"],
    [ids.providerA, null],
    "not-an-array",
  ]) {
    assert.equal(
      matchesAITenantConfigProviderAllowlistFloors(
        config({allowedProviderIds}),
        [providerA(), providerB()],
      ),
      false,
    );
  }
});

test("AITENCFG-PROV-CUR-006 malformed config identity or Provider evidence identity/status shape fails closed", () => {
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(
      config({id: "bad"}),
      [providerA(), providerB()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(
      config({tenantId: "bad"}),
      [providerA(), providerB()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(
      config(),
      [providerA({id: "bad"}), providerB()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(
      config(),
      [providerA({status: 7}), providerB()],
    ),
    false,
  );
  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(config(), undefined),
    false,
  );
});

test("AITENCFG-PROV-CUR-007 unrelated config/catalog semantics remain uninterpreted and inputs are unchanged", () => {
  const candidateConfig = config({
    enabled: false,
    allowedCapabilities: Object.freeze(["not-interpreted"]),
    allowedModelIds: Object.freeze(["not-interpreted"]),
    maxSensitivityClass: "REGULATED",
    residencyPolicyId: "",
    monthlyBudgetPolicyRef: undefined,
    retentionPolicyId: "",
    promptOverridePolicyId: "",
    version: -999,
    updatedAt: "not-interpreted",
  });
  const candidateA = providerA({
    code: "",
    adapterType: "",
    supportedRegions: Object.freeze([null, ""]),
    supportedCapabilities: Object.freeze([null, "OTHER"]),
    securityClass: "",
    residencyMetadata: Object.freeze({raw: Object.freeze(["x"])}),
    healthState: "DOWN",
    version: -999,
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });
  const candidateB = providerB({
    code: "",
    adapterType: "",
    supportedRegions: Object.freeze([]),
    supportedCapabilities: Object.freeze([]),
    securityClass: "",
    residencyMetadata: null,
    healthState: "UNKNOWN",
    version: 0,
    createdAt: "",
    updatedAt: "",
  });

  const beforeConfig = JSON.stringify(candidateConfig);
  const beforeProviders = JSON.stringify([candidateA, candidateB]);

  assert.equal(
    matchesAITenantConfigProviderAllowlistFloors(
      candidateConfig,
      [candidateA, candidateB],
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateConfig), beforeConfig);
  assert.equal(JSON.stringify([candidateA, candidateB]), beforeProviders);
});
