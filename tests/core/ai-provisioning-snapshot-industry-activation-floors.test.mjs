import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIProvisioningSnapshotIndustryActivationFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  foreignTenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  otherIndustry: "55555555-5555-4555-8555-555555555555",
});

const baseSnapshot = Object.freeze({
  id: ids.snapshot,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  version: "31",
  subscriptionVersion: "8",
  entitlementSnapshotVersion: "13",
  industryActivationVersion: "9",
  msPackVersions: Object.freeze({}),
  countryPackVersions: Object.freeze({}),
  tenantAiConfigVersion: "11",
  allowedCapabilityIds: Object.freeze([]),
  allowedApiClasses: Object.freeze([]),
  allowedProviderIds: Object.freeze([]),
  allowedModelClasses: Object.freeze([]),
  budgetPolicyRef: undefined,
  status: "ACTIVE",
  compiledAt: "2026-09-28T00:00:00.000Z",
  validUntil: undefined,
});

const baseActivation = Object.freeze({
  id: ids.industry,
  tenantId: ids.tenant,
  status: "ACTIVE",
  activationVersion: "9",
});

function snapshot(overrides = {}) {
  return Object.freeze({...baseSnapshot, ...overrides});
}

function activation(overrides = {}) {
  return Object.freeze({...baseActivation, ...overrides});
}

test("AIPROVSNAP-INDVER-CUR-001 exact same-Tenant same-Industry ACTIVE version match passes", () => {
  assert.equal(
    matchesAIProvisioningSnapshotIndustryActivationFloors(
      snapshot(),
      activation(),
    ),
    true,
  );
});

test("AIPROVSNAP-INDVER-CUR-002 missing Industry scope or activation version fails this Industry predicate", () => {
  for (const candidate of [
    snapshot({industryContextId: undefined}),
    snapshot({industryContextId: null}),
    snapshot({industryActivationVersion: undefined}),
    snapshot({industryActivationVersion: null}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotIndustryActivationFloors(
        candidate,
        activation(),
      ),
      false,
    );
  }
});

test("AIPROVSNAP-INDVER-CUR-003 foreign Tenant or wrong IndustryContext evidence fails", () => {
  assert.equal(
    matchesAIProvisioningSnapshotIndustryActivationFloors(
      snapshot(),
      activation({tenantId: ids.foreignTenant}),
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotIndustryActivationFloors(
      snapshot(),
      activation({id: ids.otherIndustry}),
    ),
    false,
  );
});

test("AIPROVSNAP-INDVER-CUR-004 raw IndustryContext status must be exactly ACTIVE", () => {
  for (const status of [
    "PENDING",
    "SUSPENDED",
    "DISABLED",
    "active",
    "ACTIVE ",
    "",
    7,
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotIndustryActivationFloors(
        snapshot(),
        activation({status}),
      ),
      false,
      String(status),
    );
  }
});

test("AIPROVSNAP-INDVER-CUR-005 stale lower or higher activation versions fail", () => {
  assert.equal(
    matchesAIProvisioningSnapshotIndustryActivationFloors(
      snapshot({industryActivationVersion: "8"}),
      activation({activationVersion: "9"}),
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotIndustryActivationFloors(
      snapshot({industryActivationVersion: "10"}),
      activation({activationVersion: "9"}),
    ),
    false,
  );
});

test("AIPROVSNAP-INDVER-CUR-006 malformed identities or non-canonical bigint text fails closed", () => {
  for (const candidate of [
    snapshot({id: "bad"}),
    snapshot({tenantId: "bad"}),
    snapshot({industryContextId: "bad"}),
    snapshot({industryActivationVersion: "01"}),
    snapshot({industryActivationVersion: "+1"}),
    snapshot({industryActivationVersion: "1 "}),
    snapshot({industryActivationVersion: ""}),
    snapshot({industryActivationVersion: 1}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotIndustryActivationFloors(
        candidate,
        activation(),
      ),
      false,
    );
  }

  for (const candidate of [
    activation({id: "bad"}),
    activation({tenantId: "bad"}),
    activation({activationVersion: "01"}),
    activation({activationVersion: "+1"}),
    activation({activationVersion: "1 "}),
    activation({activationVersion: ""}),
    activation({activationVersion: 1}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotIndustryActivationFloors(
        snapshot(),
        candidate,
      ),
      false,
    );
  }
});

test("AIPROVSNAP-INDVER-CUR-007 zero negative and bigint boundary text compare exactly", () => {
  for (const version of [
    "0",
    "-1",
    "9223372036854775807",
    "-9223372036854775808",
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotIndustryActivationFloors(
        snapshot({industryActivationVersion: version}),
        activation({activationVersion: version}),
      ),
      true,
      version,
    );
  }
});

test("AIPROVSNAP-INDVER-CUR-008 unrelated evidence remains uninterpreted and inputs unchanged", () => {
  const candidateSnapshot = snapshot({
    version: "not-interpreted",
    subscriptionVersion: null,
    entitlementSnapshotVersion: null,
    msPackVersions: null,
    countryPackVersions: null,
    tenantAiConfigVersion: null,
    allowedCapabilityIds: null,
    allowedApiClasses: null,
    allowedProviderIds: null,
    allowedModelClasses: null,
    budgetPolicyRef: 7,
    status: "not-interpreted",
    compiledAt: null,
    validUntil: null,
  });
  const candidateActivation = Object.freeze({
    ...activation(),
    unrelated: Object.freeze({raw: true}),
  });

  const beforeSnapshot = JSON.stringify(candidateSnapshot);
  const beforeActivation = JSON.stringify(candidateActivation);

  assert.equal(
    matchesAIProvisioningSnapshotIndustryActivationFloors(
      candidateSnapshot,
      candidateActivation,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateSnapshot), beforeSnapshot);
  assert.equal(JSON.stringify(candidateActivation), beforeActivation);
});
