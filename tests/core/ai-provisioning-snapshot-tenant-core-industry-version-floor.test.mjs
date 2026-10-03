import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIProvisioningSnapshotTenantCoreIndustryVersionFloor,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
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
  allowedProviderIds: Object.freeze([]),
  allowedModelClasses: Object.freeze([]),
  budgetPolicyRef: undefined,
  status: "ACTIVE",
  compiledAt: "2026-09-28T00:00:00.000Z",
  validUntil: undefined,
});

function snapshot(overrides = {}) {
  return Object.freeze({...baseSnapshot, ...overrides});
}

test("AIPROVSNAP-TCORE-CUR-001 Tenant-Core snapshot with no Industry activation version passes", () => {
  assert.equal(
    matchesAIProvisioningSnapshotTenantCoreIndustryVersionFloor(snapshot()),
    true,
  );
});

test("AIPROVSNAP-TCORE-CUR-002 Tenant-Core snapshot carrying canonical activation version fails", () => {
  assert.equal(
    matchesAIProvisioningSnapshotTenantCoreIndustryVersionFloor(
      snapshot({industryActivationVersion: "9"}),
    ),
    false,
  );
});

test("AIPROVSNAP-TCORE-CUR-003 any non-undefined Tenant-Core activation-version runtime value fails", () => {
  for (const industryActivationVersion of ["", "09", "-1", "not-a-version", 9, null, false]) {
    assert.equal(
      matchesAIProvisioningSnapshotTenantCoreIndustryVersionFloor(
        snapshot({industryActivationVersion}),
      ),
      false,
      String(industryActivationVersion),
    );
  }
});

test("AIPROVSNAP-TCORE-CUR-004 Industry-scoped snapshot passes this floor without proving version equality", () => {
  for (const industryActivationVersion of [undefined, "9", "wrong", "", 9, null]) {
    assert.equal(
      matchesAIProvisioningSnapshotTenantCoreIndustryVersionFloor(
        snapshot({
          industryContextId: ids.industry,
          industryActivationVersion,
        }),
      ),
      true,
      String(industryActivationVersion),
    );
  }
});

test("AIPROVSNAP-TCORE-CUR-005 malformed present IndustryContext id fails closed", () => {
  for (const industryContextId of ["", "bad", 7, null, false]) {
    assert.equal(
      matchesAIProvisioningSnapshotTenantCoreIndustryVersionFloor(
        snapshot({industryContextId, industryActivationVersion: "9"}),
      ),
      false,
      String(industryContextId),
    );
  }
});

test("AIPROVSNAP-TCORE-CUR-006 malformed snapshot or Tenant identity fails closed", () => {
  for (const candidate of [
    snapshot({id: "bad"}),
    snapshot({tenantId: "bad"}),
    null,
    undefined,
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotTenantCoreIndustryVersionFloor(candidate),
      false,
    );
  }
});

test("AIPROVSNAP-TCORE-CUR-007 unrelated ProvisioningSnapshot fields remain uninterpreted", () => {
  assert.equal(
    matchesAIProvisioningSnapshotTenantCoreIndustryVersionFloor(snapshot({
      version: null,
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
      status: null,
      compiledAt: null,
      validUntil: 7,
    })),
    true,
  );
});

test("AIPROVSNAP-TCORE-CUR-008 input remains unchanged and no Industry state is selected", () => {
  const candidate = snapshot({
    industryContextId: ids.industry,
    industryActivationVersion: "not-interpreted-here",
  });
  const before = JSON.stringify(candidate);
  assert.equal(
    matchesAIProvisioningSnapshotTenantCoreIndustryVersionFloor(candidate),
    true,
  );
  assert.equal(JSON.stringify(candidate), before);
});
