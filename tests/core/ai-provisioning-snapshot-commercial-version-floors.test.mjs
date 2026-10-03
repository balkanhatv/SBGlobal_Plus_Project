import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIProvisioningSnapshotCommercialVersionFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  foreignTenant: "33333333-3333-4333-8333-333333333333",
  subscription: "44444444-4444-4444-8444-444444444444",
  entitlementSnapshot: "55555555-5555-4555-8555-555555555555",
});

const baseSnapshot = Object.freeze({
  id: ids.snapshot,
  tenantId: ids.tenant,
  industryContextId: undefined,
  version: "31",
  subscriptionVersion: "7",
  entitlementSnapshotVersion: "13",
  industryActivationVersion: undefined,
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

const baseEvidence = Object.freeze({
  tenantId: ids.tenant,
  currentSubscriptionId: ids.subscription,
  subscriptionVersion: "7",
  entitlementSnapshotId: ids.entitlementSnapshot,
  entitlementSnapshotVersion: "13",
});

function snapshot(overrides = {}) {
  return Object.freeze({...baseSnapshot, ...overrides});
}

function evidence(overrides = {}) {
  return Object.freeze({...baseEvidence, ...overrides});
}

test("AIPROVSNAP-COMVER-CUR-001 exact same-Tenant complete commercial versions pass", () => {
  assert.equal(
    matchesAIProvisioningSnapshotCommercialVersionFloors(snapshot(), evidence()),
    true,
  );
});

test("AIPROVSNAP-COMVER-CUR-002 foreign Tenant or malformed identities fail closed", () => {
  for (const candidateSnapshot of [
    snapshot({id: "bad"}),
    snapshot({tenantId: "bad"}),
    snapshot({tenantId: ids.foreignTenant}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotCommercialVersionFloors(
        candidateSnapshot,
        evidence(),
      ),
      false,
    );
  }
  for (const candidateEvidence of [
    evidence({tenantId: "bad"}),
    evidence({tenantId: ids.foreignTenant}),
    evidence({currentSubscriptionId: "bad"}),
    evidence({entitlementSnapshotId: "bad"}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotCommercialVersionFloors(
        snapshot(),
        candidateEvidence,
      ),
      false,
    );
  }
});

test("AIPROVSNAP-COMVER-CUR-003 missing or incomplete current-Subscription evidence fails closed", () => {
  for (const candidate of [
    evidence({currentSubscriptionId: undefined, subscriptionVersion: undefined}),
    evidence({currentSubscriptionId: undefined}),
    evidence({subscriptionVersion: undefined}),
    evidence({currentSubscriptionId: null}),
    evidence({subscriptionVersion: null}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotCommercialVersionFloors(snapshot(), candidate),
      false,
    );
  }
});

test("AIPROVSNAP-COMVER-CUR-004 missing or incomplete CURRENT EntitlementSnapshot evidence fails closed", () => {
  for (const candidate of [
    evidence({entitlementSnapshotId: undefined, entitlementSnapshotVersion: undefined}),
    evidence({entitlementSnapshotId: undefined}),
    evidence({entitlementSnapshotVersion: undefined}),
    evidence({entitlementSnapshotId: null}),
    evidence({entitlementSnapshotVersion: null}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotCommercialVersionFloors(snapshot(), candidate),
      false,
    );
  }
});

test("AIPROVSNAP-COMVER-CUR-005 Subscription version equality preserves signed and zero PostgreSQL bigint semantics", () => {
  for (const value of ["0", "-1", "-9223372036854775808", "9223372036854775807"]) {
    assert.equal(
      matchesAIProvisioningSnapshotCommercialVersionFloors(
        snapshot({subscriptionVersion: value}),
        evidence({subscriptionVersion: value}),
      ),
      true,
      value,
    );
  }

  assert.equal(
    matchesAIProvisioningSnapshotCommercialVersionFloors(
      snapshot({subscriptionVersion: "8"}),
      evidence(),
    ),
    false,
  );

  for (const value of ["07", "-0", "+7", "7 ", "", "9223372036854775808", "-9223372036854775809", 7]) {
    assert.equal(
      matchesAIProvisioningSnapshotCommercialVersionFloors(
        snapshot({subscriptionVersion: value}),
        evidence({subscriptionVersion: value}),
      ),
      false,
      String(value),
    );
  }
});

test("AIPROVSNAP-COMVER-CUR-006 EntitlementSnapshot version must match positive canonical PostgreSQL bigint text", () => {
  assert.equal(
    matchesAIProvisioningSnapshotCommercialVersionFloors(
      snapshot({entitlementSnapshotVersion: "14"}),
      evidence(),
    ),
    false,
  );

  for (const value of ["0", "-1", "013", "+13", "13 ", "", "9223372036854775808", 13]) {
    assert.equal(
      matchesAIProvisioningSnapshotCommercialVersionFloors(
        snapshot({entitlementSnapshotVersion: value}),
        evidence({entitlementSnapshotVersion: value}),
      ),
      false,
      String(value),
    );
  }
});

test("AIPROVSNAP-COMVER-CUR-007 exact maximum PostgreSQL bigint commercial versions pass without numeric coercion", () => {
  const max = "9223372036854775807";
  assert.equal(
    matchesAIProvisioningSnapshotCommercialVersionFloors(
      snapshot({
        subscriptionVersion: max,
        entitlementSnapshotVersion: max,
      }),
      evidence({
        subscriptionVersion: max,
        entitlementSnapshotVersion: max,
      }),
    ),
    true,
  );
});

test("AIPROVSNAP-COMVER-CUR-008 unrelated evidence remains uninterpreted and inputs remain unchanged", () => {
  const candidateSnapshot = snapshot({
    industryContextId: "not-interpreted",
    version: "not-interpreted",
    industryActivationVersion: "not-interpreted",
    msPackVersions: null,
    countryPackVersions: null,
    tenantAiConfigVersion: "not-interpreted",
    allowedCapabilityIds: Object.freeze([null]),
    allowedApiClasses: Object.freeze([null]),
    allowedProviderIds: Object.freeze([null]),
    allowedModelClasses: Object.freeze([null]),
    budgetPolicyRef: 7,
    status: "not-interpreted",
    compiledAt: null,
    validUntil: 7,
  });
  const candidateEvidence = evidence({
    unrelated: Object.freeze({validFrom: null, sourceSubscriptionId: null}),
  });

  const beforeSnapshot = JSON.stringify(candidateSnapshot);
  const beforeEvidence = JSON.stringify(candidateEvidence);

  assert.equal(
    matchesAIProvisioningSnapshotCommercialVersionFloors(
      candidateSnapshot,
      candidateEvidence,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateSnapshot), beforeSnapshot);
  assert.equal(JSON.stringify(candidateEvidence), beforeEvidence);
});
