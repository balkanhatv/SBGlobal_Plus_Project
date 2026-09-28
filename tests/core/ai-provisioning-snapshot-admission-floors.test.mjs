import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIProvisioningSnapshotApiClassAdmissionFloor,
  matchesAIProvisioningSnapshotCapabilityAdmissionFloor,
  matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor,
  matchesAIProvisioningSnapshotModelClassAdmissionFloor,
  matchesAIProvisioningSnapshotProviderAdmissionFloor,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  capability: "33333333-3333-4333-8333-333333333333",
  otherCapability: "44444444-4444-4444-8444-444444444444",
  provider: "55555555-5555-4555-8555-555555555555",
  otherProvider: "66666666-6666-4666-8666-666666666666",
});

const baseSnapshot = Object.freeze({
  id: ids.snapshot,
  tenantId: ids.tenant,
  industryContextId: undefined,
  version: "31",
  subscriptionVersion: "8",
  entitlementSnapshotVersion: "11",
  industryActivationVersion: undefined,
  msPackVersions: {},
  countryPackVersions: {},
  tenantAiConfigVersion: "7",
  allowedCapabilityIds: [ids.capability],
  allowedApiClasses: ["TENANT_API", "INTERNAL_FIRST_PARTY"],
  allowedProviderIds: [ids.provider],
  allowedModelClasses: ["balanced", "reasoning"],
  budgetPolicyRef: undefined,
  status: "ACTIVE",
  compiledAt: "2026-09-28T10:00:00.000Z",
  validUntil: "2026-09-28T12:00:00.000Z",
});

const capability = Object.freeze({
  id: ids.capability,
  code: "AI.CHAT",
  category: "CHAT",
  requiredEntitlement: null,
  defaultPolicyClass: "DEFAULT",
  schemaVersion: 1,
  status: "ACTIVE",
});

const provider = Object.freeze({
  id: ids.provider,
  code: "provider-a",
  status: "ACTIVE",
  adapterType: "CHAT",
  supportedRegions: [],
  supportedCapabilities: [],
  securityClass: "STANDARD",
  residencyMetadata: {},
  healthState: "UNKNOWN",
  version: 1,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
});

function snapshot(overrides = {}) {
  return Object.freeze({...baseSnapshot, ...overrides});
}

test("AIPROVSNAP-ADM-CUR-001 ACTIVE snapshot inside compiled/expiry window passes", () => {
  assert.equal(
    matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor(
      snapshot(),
      "2026-09-28T11:00:00.000Z",
    ),
    true,
  );
});

test("AIPROVSNAP-ADM-CUR-002 absent validUntil remains lifecycle-admissible after compile", () => {
  assert.equal(
    matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor(
      snapshot({validUntil: undefined}),
      "2026-09-28T11:00:00.000Z",
    ),
    true,
  );
});

test("AIPROVSNAP-ADM-CUR-003 inactive or future-compiled snapshot fails closed", () => {
  for (const candidate of [
    snapshot({status: "SUPERSEDED"}),
    snapshot({status: "REVOKED"}),
    snapshot({compiledAt: "2026-09-28T11:30:00.000Z", validUntil: "2026-09-28T12:30:00.000Z"}),
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor(
        candidate,
        "2026-09-28T11:00:00.000Z",
      ),
      false,
    );
  }
});

test("AIPROVSNAP-ADM-CUR-004 expiry equality and later evaluation fail", () => {
  for (const evaluatedAt of [
    "2026-09-28T12:00:00.000Z",
    "2026-09-28T12:00:00.001Z",
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor(snapshot(), evaluatedAt),
      false,
    );
  }
});

test("AIPROVSNAP-ADM-CUR-005 malformed evaluation/lifecycle evidence fails", () => {
  assert.equal(
    matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor(snapshot(), "not-a-date"),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor(
      snapshot({validUntil: "2026-09-28T09:00:00.000Z"}),
      "2026-09-28T11:00:00.000Z",
    ),
    false,
  );
});

test("AIPROVSNAP-ADM-API-001 exact governed API-class membership passes", () => {
  assert.equal(
    matchesAIProvisioningSnapshotApiClassAdmissionFloor(snapshot(), "TENANT_API"),
    true,
  );
});

test("AIPROVSNAP-ADM-API-002 absent, normalized or unknown API class fails", () => {
  for (const value of ["PARTNER_API", "tenant_api", "TENANT_API ", "UNKNOWN", null]) {
    assert.equal(
      matchesAIProvisioningSnapshotApiClassAdmissionFloor(snapshot(), value),
      false,
      String(value),
    );
  }
});

test("AIPROVSNAP-ADM-API-003 malformed, duplicate or unknown persisted API set fails", () => {
  for (const allowedApiClasses of [
    ["TENANT_API", "TENANT_API"],
    ["TENANT_API", "UNKNOWN"],
    ["tenant_api"],
    [null],
    "TENANT_API",
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotApiClassAdmissionFloor(
        snapshot({allowedApiClasses}),
        "TENANT_API",
      ),
      false,
    );
  }
});

test("AIPROVSNAP-ADM-CAP-001 exact ACTIVE capability membership passes", () => {
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityAdmissionFloor(snapshot(), capability),
    true,
  );
});

test("AIPROVSNAP-ADM-CAP-002 absent, foreign or inactive capability fails", () => {
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityAdmissionFloor(
      snapshot(),
      {...capability, id: ids.otherCapability},
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityAdmissionFloor(
      snapshot(),
      {...capability, status: "INACTIVE"},
    ),
    false,
  );
});

test("AIPROVSNAP-ADM-CAP-003 malformed or duplicate capability evidence fails", () => {
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityAdmissionFloor(
      snapshot({allowedCapabilityIds: [ids.capability, ids.capability]}),
      capability,
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityAdmissionFloor(
      snapshot(),
      {...capability, id: "bad"},
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotCapabilityAdmissionFloor(
      snapshot(),
      {...capability, code: ""},
    ),
    false,
  );
});

test("AIPROVSNAP-ADM-PROV-001 exact ACTIVE provider membership passes", () => {
  assert.equal(
    matchesAIProvisioningSnapshotProviderAdmissionFloor(snapshot(), provider),
    true,
  );
});

test("AIPROVSNAP-ADM-PROV-002 absent, foreign or inactive provider fails", () => {
  assert.equal(
    matchesAIProvisioningSnapshotProviderAdmissionFloor(
      snapshot(),
      {...provider, id: ids.otherProvider},
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotProviderAdmissionFloor(
      snapshot(),
      {...provider, status: "DISABLED"},
    ),
    false,
  );
});

test("AIPROVSNAP-ADM-PROV-003 malformed or duplicate provider evidence fails", () => {
  assert.equal(
    matchesAIProvisioningSnapshotProviderAdmissionFloor(
      snapshot({allowedProviderIds: [ids.provider, ids.provider]}),
      provider,
    ),
    false,
  );
  assert.equal(
    matchesAIProvisioningSnapshotProviderAdmissionFloor(
      snapshot(),
      {...provider, id: "bad"},
    ),
    false,
  );
});

test("AIPROVSNAP-ADM-MODEL-001 exact model-class membership passes", () => {
  assert.equal(
    matchesAIProvisioningSnapshotModelClassAdmissionFloor(snapshot(), "balanced"),
    true,
  );
});

test("AIPROVSNAP-ADM-MODEL-002 absent, normalized or non-string model class fails", () => {
  for (const value of ["fast", "Balanced", "balanced ", "", null, 7]) {
    assert.equal(
      matchesAIProvisioningSnapshotModelClassAdmissionFloor(snapshot(), value),
      false,
      String(value),
    );
  }
});

test("AIPROVSNAP-ADM-MODEL-003 malformed or duplicate persisted model-class set fails", () => {
  for (const allowedModelClasses of [
    ["balanced", "balanced"],
    ["balanced", null],
    "balanced",
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotModelClassAdmissionFloor(
        snapshot({allowedModelClasses}),
        "balanced",
      ),
      false,
    );
  }
});

test("AIPROVSNAP-ADM-IMM-001 helpers do not mutate supplied evidence", () => {
  const s = snapshot();
  const c = Object.freeze({...capability});
  const p = Object.freeze({...provider});
  const before = JSON.stringify({s, c, p});

  assert.equal(
    matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor(
      s,
      "2026-09-28T11:00:00.000Z",
    ),
    true,
  );
  assert.equal(matchesAIProvisioningSnapshotApiClassAdmissionFloor(s, "TENANT_API"), true);
  assert.equal(matchesAIProvisioningSnapshotCapabilityAdmissionFloor(s, c), true);
  assert.equal(matchesAIProvisioningSnapshotProviderAdmissionFloor(s, p), true);
  assert.equal(matchesAIProvisioningSnapshotModelClassAdmissionFloor(s, "balanced"), true);

  assert.equal(JSON.stringify({s, c, p}), before);
});
