import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIProvisioningSnapshotLifecycleValidityFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
});

const baseSnapshot = Object.freeze({
  id: ids.snapshot,
  tenantId: ids.tenant,
  industryContextId: undefined,
  version: "31",
  subscriptionVersion: "not-interpreted",
  entitlementSnapshotVersion: "not-interpreted",
  industryActivationVersion: undefined,
  msPackVersions: null,
  countryPackVersions: null,
  tenantAiConfigVersion: "not-interpreted",
  allowedCapabilityIds: "not-interpreted",
  allowedApiClasses: "not-interpreted",
  allowedProviderIds: "not-interpreted",
  allowedModelClasses: "not-interpreted",
  budgetPolicyRef: undefined,
  status: "ACTIVE",
  compiledAt: "2026-09-20T00:00:00.000Z",
  validUntil: "2026-10-20T00:00:00.000Z",
});

function snapshot(overrides = {}) {
  return Object.freeze({...baseSnapshot, ...overrides});
}

test("AIPROVSNAP-LIFE-CUR-001 valid persisted lifecycle and ordering evidence passes", () => {
  for (const candidate of [
    snapshot(),
    snapshot({status: "SUPERSEDED", validUntil: undefined}),
    snapshot({status: "REVOKED", validUntil: "2026-09-20T00:00:00.001Z"}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotLifecycleValidityFloors(candidate),
      true,
    );
  }
});

test("AIPROVSNAP-LIFE-CUR-002 version must be canonical positive integer text", () => {
  for (const version of ["0", "-1", "+1", "1.0", "01", " 1", "1 ", "", 1, null]) {
    assert.equal(
      matchesAIProvisioningSnapshotLifecycleValidityFloors(snapshot({version})),
      false,
      String(version),
    );
  }
});

test("AIPROVSNAP-LIFE-CUR-003 status uses the exact persisted enum vocabulary", () => {
  for (const status of ["ACTIVE", "SUPERSEDED", "REVOKED"]) {
    assert.equal(
      matchesAIProvisioningSnapshotLifecycleValidityFloors(snapshot({status})),
      true,
      status,
    );
  }

  for (const status of ["active", "ACTIVE ", "DRAFT", "", 1, null]) {
    assert.equal(
      matchesAIProvisioningSnapshotLifecycleValidityFloors(snapshot({status})),
      false,
      String(status),
    );
  }
});

test("AIPROVSNAP-LIFE-CUR-004 compiledAt must identify a finite timestamp instant", () => {
  for (const compiledAt of ["not-a-date", "", "2026-99-99T00:00:00Z", 0, null, undefined]) {
    assert.equal(
      matchesAIProvisioningSnapshotLifecycleValidityFloors(
        snapshot({compiledAt, validUntil: undefined}),
      ),
      false,
      String(compiledAt),
    );
  }
});

test("AIPROVSNAP-LIFE-CUR-005 present validUntil must be a strictly later instant", () => {
  for (const validUntil of [
    "not-a-date",
    "2026-09-20T00:00:00.000Z",
    "2026-09-19T23:59:59.999Z",
    null,
    7,
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotLifecycleValidityFloors(snapshot({validUntil})),
      false,
      String(validUntil),
    );
  }

  assert.equal(
    matchesAIProvisioningSnapshotLifecycleValidityFloors(
      snapshot({
        compiledAt: "2026-09-20T05:30:00+05:30",
        validUntil: "2026-09-20T00:00:00.001Z",
      }),
    ),
    true,
  );
});

test("AIPROVSNAP-LIFE-CUR-006 wall-clock expiry is not invented as a current-validity rule", () => {
  assert.equal(
    matchesAIProvisioningSnapshotLifecycleValidityFloors(
      snapshot({
        status: "SUPERSEDED",
        compiledAt: "2020-01-01T00:00:00.000Z",
        validUntil: "2021-01-01T00:00:00.000Z",
      }),
    ),
    true,
  );
});

test("AIPROVSNAP-LIFE-CUR-007 malformed identities fail while unrelated fields remain uninterpreted", () => {
  assert.equal(
    matchesAIProvisioningSnapshotLifecycleValidityFloors(snapshot({id: "bad"})),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotLifecycleValidityFloors(snapshot({tenantId: "bad"})),
    false,
  );

  assert.equal(
    matchesAIProvisioningSnapshotLifecycleValidityFloors(
      snapshot({
        industryContextId: "not-interpreted",
        subscriptionVersion: null,
        entitlementSnapshotVersion: null,
        industryActivationVersion: "not-interpreted",
        tenantAiConfigVersion: null,
        msPackVersions: null,
        countryPackVersions: [],
        allowedCapabilityIds: null,
        allowedApiClasses: null,
        allowedProviderIds: null,
        allowedModelClasses: null,
        budgetPolicyRef: 7,
      }),
    ),
    true,
  );
});

test("AIPROVSNAP-LIFE-CUR-008 helper is immutable and grants no current/effective semantics", () => {
  const candidate = snapshot({
    status: "ACTIVE",
    compiledAt: "2020-01-01T00:00:00.000Z",
    validUntil: "2021-01-01T00:00:00.000Z",
  });
  const before = JSON.stringify(candidate);

  assert.equal(
    matchesAIProvisioningSnapshotLifecycleValidityFloors(candidate),
    true,
  );
  assert.equal(JSON.stringify(candidate), before);
  assert.equal("current" in candidate, false);
  assert.equal("effective" in candidate, false);
  assert.equal("authorized" in candidate, false);
});
