import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIProvisioningSnapshotCapabilityFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenantConfig: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  foreignTenant: "44444444-4444-4444-8444-444444444444",
  capabilityA: "55555555-5555-4555-8555-555555555555",
  capabilityB: "66666666-6666-4666-8666-666666666666",
  capabilityOther: "77777777-7777-4777-8777-777777777777",
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
  allowedCapabilityIds: Object.freeze([ids.capabilityA, ids.capabilityB]),
  allowedApiClasses: Object.freeze([]),
  allowedProviderIds: Object.freeze([]),
  allowedModelClasses: Object.freeze([]),
  budgetPolicyRef: undefined,
  status: "ACTIVE",
  compiledAt: "2026-09-28T00:00:00.000Z",
  validUntil: undefined,
});

const baseTenantConfig = Object.freeze({
  id: ids.tenantConfig,
  tenantId: ids.tenant,
  enabled: false,
  allowedCapabilities: Object.freeze(["CHAT", "EMBEDDING"]),
  allowedProviderIds: Object.freeze(["not-interpreted"]),
  allowedModelIds: Object.freeze(["not-interpreted"]),
  maxSensitivityClass: "not-interpreted",
  residencyPolicyId: "",
  monthlyBudgetPolicyRef: undefined,
  retentionPolicyId: "",
  promptOverridePolicyId: "",
  version: 11,
  updatedAt: "not-interpreted",
});

const baseCapabilityA = Object.freeze({
  id: ids.capabilityA,
  code: "CHAT",
  category: "not-interpreted",
  requiredEntitlement: "not-interpreted",
  defaultPolicyClass: "not-interpreted",
  schemaVersion: -999,
  status: "ACTIVE",
});

const baseCapabilityB = Object.freeze({
  ...baseCapabilityA,
  id: ids.capabilityB,
  code: "EMBEDDING",
});

function snapshot(overrides = {}) {
  return Object.freeze({...baseSnapshot, ...overrides});
}

function tenant(overrides = {}) {
  return Object.freeze({...baseTenantConfig, ...overrides});
}

function capabilityA(overrides = {}) {
  return Object.freeze({...baseCapabilityA, ...overrides});
}

function capabilityB(overrides = {}) {
  return Object.freeze({...baseCapabilityB, ...overrides});
}

test("AIPROVSNAP-CAP-CUR-001 exact referenced config and complete ACTIVE capability evidence passes", () => {
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityFloors(
      snapshot(),
      tenant(),
      [capabilityA(), capabilityB()],
    ),
    true,
  );
});

test("AIPROVSNAP-CAP-CUR-002 foreign Tenant or wrong/malformed config version binding fails closed", () => {
  for (const candidate of [
    snapshot({tenantId: ids.foreignTenant}),
    snapshot({tenantAiConfigVersion: "12"}),
    snapshot({tenantAiConfigVersion: "011"}),
    snapshot({tenantAiConfigVersion: "0"}),
    snapshot({tenantAiConfigVersion: "-1"}),
    snapshot({tenantAiConfigVersion: 11}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotCapabilityFloors(
        candidate,
        tenant(),
        [capabilityA(), capabilityB()],
      ),
      false,
    );
  }

  for (const candidate of [
    tenant({tenantId: ids.foreignTenant}),
    tenant({version: 12}),
    tenant({version: 0}),
    tenant({version: 1.5}),
    tenant({version: Number.MAX_SAFE_INTEGER + 1}),
    tenant({version: "11"}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotCapabilityFloors(
        snapshot(),
        candidate,
        [capabilityA(), capabilityB()],
      ),
      false,
    );
  }
});

test("AIPROVSNAP-CAP-CUR-003 missing extra duplicate or wrong capability id evidence fails closed", () => {
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityFloors(
      snapshot(),
      tenant(),
      [capabilityA()],
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityFloors(
      snapshot(),
      tenant(),
      [capabilityA(), capabilityB(), {
        ...capabilityA(),
        id: ids.capabilityOther,
      }],
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityFloors(
      snapshot(),
      tenant(),
      [capabilityA(), {...capabilityB(), id: ids.capabilityA}],
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityFloors(
      snapshot(),
      tenant(),
      [capabilityA(), {...capabilityB(), id: ids.capabilityOther}],
    ),
    false,
  );
});

test("AIPROVSNAP-CAP-CUR-004 raw status must be exactly ACTIVE", () => {
  for (const status of ["PENDING", "INACTIVE", "RETIRED", "active", "ACTIVE ", "", 7]) {
    assert.equal(
      matchesAIProvisioningSnapshotCapabilityFloors(
        snapshot(),
        tenant(),
        [capabilityA(), capabilityB({status})],
      ),
      false,
      String(status),
    );
  }
});

test("AIPROVSNAP-CAP-CUR-005 capability code uses exact raw Tenant allowlist membership", () => {
  for (const code of ["IMAGE", "chat", "CHAT ", " Chat"]) {
    assert.equal(
      matchesAIProvisioningSnapshotCapabilityFloors(
        snapshot(),
        tenant(),
        [capabilityA({code}), capabilityB()],
      ),
      false,
      code,
    );
  }

  assert.equal(
    matchesAIProvisioningSnapshotCapabilityFloors(
      snapshot({allowedCapabilityIds: Object.freeze([ids.capabilityA])}),
      tenant({allowedCapabilities: Object.freeze([""])}),
      [capabilityA({code: ""})],
    ),
    true,
  );
});

test("AIPROVSNAP-CAP-CUR-006 malformed sparse duplicate relevant evidence fails closed", () => {
  const sparseIds = new Array(2);
  sparseIds[0] = ids.capabilityA;
  const sparseCodes = new Array(2);
  sparseCodes[0] = "CHAT";

  for (const candidate of [
    snapshot({id: "bad"}),
    snapshot({tenantId: "bad"}),
    snapshot({allowedCapabilityIds: [ids.capabilityA, ids.capabilityA]}),
    snapshot({allowedCapabilityIds: [ids.capabilityA, "bad"]}),
    snapshot({allowedCapabilityIds: sparseIds}),
    snapshot({allowedCapabilityIds: "not-an-array"}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotCapabilityFloors(
        candidate,
        tenant(),
        [capabilityA(), capabilityB()],
      ),
      false,
    );
  }

  for (const candidate of [
    tenant({id: "bad"}),
    tenant({tenantId: "bad"}),
    tenant({allowedCapabilities: ["CHAT", "CHAT"]}),
    tenant({allowedCapabilities: ["CHAT", null]}),
    tenant({allowedCapabilities: sparseCodes}),
    tenant({allowedCapabilities: "not-an-array"}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotCapabilityFloors(
        snapshot(),
        candidate,
        [capabilityA(), capabilityB()],
      ),
      false,
    );
  }

  for (const candidate of [
    capabilityA({id: "bad"}),
    capabilityA({code: null}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotCapabilityFloors(
        snapshot(),
        tenant(),
        [candidate, capabilityB()],
      ),
      false,
    );
  }

  assert.equal(
    matchesAIProvisioningSnapshotCapabilityFloors(snapshot(), tenant(), undefined),
    false,
  );
});

test("AIPROVSNAP-CAP-CUR-007 empty set requires empty evidence and evidence order is irrelevant", () => {
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityFloors(
      snapshot({allowedCapabilityIds: Object.freeze([])}),
      tenant(),
      [],
    ),
    true,
  );
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityFloors(
      snapshot({allowedCapabilityIds: Object.freeze([])}),
      tenant(),
      [capabilityA()],
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityFloors(
      snapshot(),
      tenant(),
      [capabilityB(), capabilityA()],
    ),
    true,
  );
});

test("AIPROVSNAP-CAP-CUR-008 unrelated fields remain uninterpreted and inputs unchanged", () => {
  const candidateSnapshot = snapshot({
    industryContextId: "not-interpreted",
    subscriptionVersion: "not-interpreted",
    entitlementSnapshotVersion: "not-interpreted",
    industryActivationVersion: "not-interpreted",
    msPackVersions: null,
    countryPackVersions: null,
    allowedApiClasses: Object.freeze([null]),
    allowedProviderIds: Object.freeze([null, "not-interpreted"]),
    allowedModelClasses: Object.freeze([null]),
    budgetPolicyRef: "",
    status: "not-interpreted",
    compiledAt: "not-interpreted",
    validUntil: "not-interpreted",
    version: "not-interpreted",
  });
  const candidateTenant = tenant({
    enabled: "not-interpreted",
    allowedProviderIds: Object.freeze([null]),
    allowedModelIds: Object.freeze([null]),
    maxSensitivityClass: "not-interpreted",
    residencyPolicyId: null,
    monthlyBudgetPolicyRef: 7,
    retentionPolicyId: null,
    promptOverridePolicyId: null,
    updatedAt: null,
  });
  const candidateA = capabilityA({
    category: null,
    requiredEntitlement: null,
    defaultPolicyClass: null,
    schemaVersion: null,
  });
  const candidateB = capabilityB({
    category: 7,
    requiredEntitlement: 7,
    defaultPolicyClass: 7,
    schemaVersion: -1,
  });

  const beforeSnapshot = JSON.stringify(candidateSnapshot);
  const beforeTenant = JSON.stringify(candidateTenant);
  const beforeCapabilities = JSON.stringify([candidateA, candidateB]);

  assert.equal(
    matchesAIProvisioningSnapshotCapabilityFloors(
      candidateSnapshot,
      candidateTenant,
      [candidateA, candidateB],
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateSnapshot), beforeSnapshot);
  assert.equal(JSON.stringify(candidateTenant), beforeTenant);
  assert.equal(JSON.stringify([candidateA, candidateB]), beforeCapabilities);
});
