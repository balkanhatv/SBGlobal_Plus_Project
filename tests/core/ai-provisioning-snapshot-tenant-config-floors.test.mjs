import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIProvisioningSnapshotTenantConfigFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenantConfig: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  foreignTenant: "44444444-4444-4444-8444-444444444444",
  providerA: "55555555-5555-4555-8555-555555555555",
  providerB: "66666666-6666-4666-8666-666666666666",
  providerOther: "77777777-7777-4777-8777-777777777777",
});

const baseSnapshot = Object.freeze({
  id: ids.snapshot,
  tenantId: ids.tenant,
  industryContextId: undefined,
  version: "31",
  subscriptionVersion: "8",
  entitlementSnapshotVersion: "13",
  industryActivationVersion: undefined,
  msPackVersions: Object.freeze({}),
  countryPackVersions: Object.freeze({}),
  tenantAiConfigVersion: "11",
  allowedCapabilityIds: Object.freeze([]),
  allowedApiClasses: Object.freeze([]),
  allowedProviderIds: Object.freeze([ids.providerA]),
  allowedModelClasses: Object.freeze([]),
  budgetPolicyRef: undefined,
  status: "ACTIVE",
  compiledAt: "2026-09-28T00:00:00.000Z",
  validUntil: undefined,
});

const baseTenantConfig = Object.freeze({
  id: ids.tenantConfig,
  tenantId: ids.tenant,
  enabled: true,
  allowedCapabilities: Object.freeze(["CHAT"]),
  allowedProviderIds: Object.freeze([ids.providerA, ids.providerB]),
  allowedModelIds: Object.freeze([]),
  maxSensitivityClass: "CONFIDENTIAL",
  residencyPolicyId: "residency:raw",
  monthlyBudgetPolicyRef: "budget:raw",
  retentionPolicyId: "retention:raw",
  promptOverridePolicyId: "prompt:raw",
  version: 11,
  updatedAt: "2026-09-28T00:00:00.000Z",
});

function snapshot(overrides = {}) {
  return Object.freeze({...baseSnapshot, ...overrides});
}

function tenant(overrides = {}) {
  return Object.freeze({...baseTenantConfig, ...overrides});
}

test("AIPROVSNAP-TENCFG-CUR-001 exact same-Tenant referenced enabled config Provider subset passes", () => {
  assert.equal(
    matchesAIProvisioningSnapshotTenantConfigFloors(snapshot(), tenant()),
    true,
  );
});

test("AIPROVSNAP-TENCFG-CUR-002 version mismatch or malformed snapshot version fails closed", () => {
  for (const tenantAiConfigVersion of ["12", "011", "0", "-1", "11 ", "", 11]) {
    assert.equal(
      matchesAIProvisioningSnapshotTenantConfigFloors(
        snapshot({tenantAiConfigVersion}),
        tenant(),
      ),
      false,
      String(tenantAiConfigVersion),
    );
  }
  assert.equal(
    matchesAIProvisioningSnapshotTenantConfigFloors(
      snapshot(),
      tenant({version: 12}),
    ),
    false,
  );
  for (const version of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "11"]) {
    assert.equal(
      matchesAIProvisioningSnapshotTenantConfigFloors(
        snapshot(),
        tenant({version}),
      ),
      false,
      String(version),
    );
  }
});

test("AIPROVSNAP-TENCFG-CUR-003 foreign Tenant or malformed identities fail closed", () => {
  for (const candidateSnapshot of [
    snapshot({id: "bad"}),
    snapshot({tenantId: "bad"}),
    snapshot({tenantId: ids.foreignTenant}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotTenantConfigFloors(candidateSnapshot, tenant()),
      false,
    );
  }
  for (const candidateTenant of [
    tenant({id: "bad"}),
    tenant({tenantId: "bad"}),
    tenant({tenantId: ids.foreignTenant}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotTenantConfigFloors(snapshot(), candidateTenant),
      false,
    );
  }
});

test("AIPROVSNAP-TENCFG-CUR-004 disabled referenced Tenant config and boolean variants fail", () => {
  assert.equal(
    matchesAIProvisioningSnapshotTenantConfigFloors(
      snapshot(),
      tenant({enabled: false}),
    ),
    false,
  );
  for (const enabled of ["true", 1, null, undefined]) {
    assert.equal(
      matchesAIProvisioningSnapshotTenantConfigFloors(
        snapshot(),
        tenant({enabled}),
      ),
      false,
    );
  }
});

test("AIPROVSNAP-TENCFG-CUR-005 snapshot Providers cannot widen Tenant Provider set", () => {
  assert.equal(
    matchesAIProvisioningSnapshotTenantConfigFloors(
      snapshot({allowedProviderIds: Object.freeze([ids.providerOther])}),
      tenant(),
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotTenantConfigFloors(
      snapshot({allowedProviderIds: Object.freeze([])}),
      tenant(),
    ),
    true,
  );
  assert.equal(
    matchesAIProvisioningSnapshotTenantConfigFloors(
      snapshot({allowedProviderIds: Object.freeze([ids.providerA])}),
      tenant({allowedProviderIds: Object.freeze([ids.providerA, ids.providerB])}),
    ),
    true,
  );
});

test("AIPROVSNAP-TENCFG-CUR-006 malformed duplicate sparse or non-array Provider evidence fails closed", () => {
  const sparse = new Array(1);
  for (const candidateSnapshot of [
    snapshot({allowedProviderIds: [ids.providerA, ids.providerA]}),
    snapshot({allowedProviderIds: [ids.providerA, "bad"]}),
    snapshot({allowedProviderIds: sparse}),
    snapshot({allowedProviderIds: "not-an-array"}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotTenantConfigFloors(candidateSnapshot, tenant()),
      false,
    );
  }
  for (const candidateTenant of [
    tenant({allowedProviderIds: [ids.providerA, ids.providerA]}),
    tenant({allowedProviderIds: [ids.providerA, "bad"]}),
    tenant({allowedProviderIds: new Array(1)}),
    tenant({allowedProviderIds: "not-an-array"}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotTenantConfigFloors(snapshot(), candidateTenant),
      false,
    );
  }
});

test("AIPROVSNAP-TENCFG-CUR-007 Provider order is irrelevant and wider Tenant set passes", () => {
  assert.equal(
    matchesAIProvisioningSnapshotTenantConfigFloors(
      snapshot({allowedProviderIds: Object.freeze([ids.providerB, ids.providerA])}),
      tenant({allowedProviderIds: Object.freeze([ids.providerA, ids.providerB])}),
    ),
    true,
  );
  assert.equal(
    matchesAIProvisioningSnapshotTenantConfigFloors(
      snapshot({allowedProviderIds: Object.freeze([ids.providerA])}),
      tenant({allowedProviderIds: Object.freeze([ids.providerB, ids.providerA])}),
    ),
    true,
  );
});

test("AIPROVSNAP-TENCFG-CUR-008 unrelated evidence stays uninterpreted and inputs remain unchanged", () => {
  const candidateSnapshot = snapshot({
    industryContextId: "not-interpreted",
    subscriptionVersion: "not-interpreted",
    entitlementSnapshotVersion: "not-interpreted",
    industryActivationVersion: "not-interpreted",
    msPackVersions: null,
    countryPackVersions: null,
    allowedCapabilityIds: Object.freeze([null, "not-interpreted"]),
    allowedApiClasses: Object.freeze(["not-interpreted"]),
    allowedModelClasses: Object.freeze([null]),
    budgetPolicyRef: "",
    status: "not-interpreted",
    compiledAt: "not-interpreted",
    validUntil: "not-interpreted",
    version: "not-interpreted",
  });
  const candidateTenant = tenant({
    allowedCapabilities: Object.freeze([null, "not-interpreted"]),
    allowedModelIds: Object.freeze([null]),
    maxSensitivityClass: "not-interpreted",
    residencyPolicyId: "",
    monthlyBudgetPolicyRef: undefined,
    retentionPolicyId: "",
    promptOverridePolicyId: "",
    updatedAt: "not-interpreted",
  });

  const beforeSnapshot = JSON.stringify(candidateSnapshot);
  const beforeTenant = JSON.stringify(candidateTenant);

  assert.equal(
    matchesAIProvisioningSnapshotTenantConfigFloors(
      candidateSnapshot,
      candidateTenant,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateSnapshot), beforeSnapshot);
  assert.equal(JSON.stringify(candidateTenant), beforeTenant);
});
