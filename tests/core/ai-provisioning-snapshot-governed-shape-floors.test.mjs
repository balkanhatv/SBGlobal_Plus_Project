import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIProvisioningSnapshotGovernedShapeFloors,
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
  subscriptionVersion: "8",
  entitlementSnapshotVersion: "13",
  industryActivationVersion: undefined,
  msPackVersions: Object.freeze({HMS: 3, LIS: "7"}),
  countryPackVersions: Object.freeze({IN: Object.freeze({version: 4})}),
  tenantAiConfigVersion: "11",
  allowedCapabilityIds: Object.freeze([]),
  allowedApiClasses: Object.freeze(["TENANT_API", "PARTNER_API"]),
  allowedProviderIds: Object.freeze([]),
  allowedModelClasses: Object.freeze(["TEXT", "EMBEDDING"]),
  budgetPolicyRef: undefined,
  status: "ACTIVE",
  compiledAt: "2026-09-28T00:00:00.000Z",
  validUntil: undefined,
});

function snapshot(overrides = {}) {
  return Object.freeze({...baseSnapshot, ...overrides});
}

test("AIPROVSNAP-SHAPE-CUR-001 valid object maps and governed string sets pass", () => {
  assert.equal(matchesAIProvisioningSnapshotGovernedShapeFloors(snapshot()), true);
});

test("AIPROVSNAP-SHAPE-CUR-002 pack-version maps must remain JSON-object shaped", () => {
  for (const value of [null, [], "{}", 7, true]) {
    assert.equal(
      matchesAIProvisioningSnapshotGovernedShapeFloors(
        snapshot({msPackVersions: value}),
      ),
      false,
    );
    assert.equal(
      matchesAIProvisioningSnapshotGovernedShapeFloors(
        snapshot({countryPackVersions: value}),
      ),
      false,
    );
  }

  assert.equal(
    matchesAIProvisioningSnapshotGovernedShapeFloors(
      snapshot({
        msPackVersions: Object.freeze({raw: Object.freeze([null, 7, "x"])}),
        countryPackVersions: Object.freeze({nested: Object.freeze({anything: true})}),
      }),
    ),
    true,
  );
});

test("AIPROVSNAP-SHAPE-CUR-003 API classes require a dense duplicate-free raw-string array", () => {
  const sparse = new Array(2);
  sparse[0] = "TENANT_API";

  for (const allowedApiClasses of [
    ["TENANT_API", "TENANT_API"],
    ["TENANT_API", null],
    sparse,
    "TENANT_API",
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotGovernedShapeFloors(
        snapshot({allowedApiClasses}),
      ),
      false,
    );
  }
});

test("AIPROVSNAP-SHAPE-CUR-004 API classes use the exact source-owned vocabulary", () => {
  assert.equal(
    matchesAIProvisioningSnapshotGovernedShapeFloors(
      snapshot({
        allowedApiClasses: Object.freeze([
          "INTERNAL_FIRST_PARTY",
          "TENANT_API",
          "PARTNER_API",
          "PUBLIC_DEVELOPER_API",
        ]),
      }),
    ),
    true,
  );

  for (const apiClass of [
    "tenant_api",
    "TENANT_API ",
    "PUBLIC_API",
    "",
    "INTERNAL",
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotGovernedShapeFloors(
        snapshot({allowedApiClasses: Object.freeze([apiClass])}),
      ),
      false,
      apiClass,
    );
  }
});

test("AIPROVSNAP-SHAPE-CUR-005 Model classes require only a dense duplicate-free raw-string set", () => {
  const sparse = new Array(2);
  sparse[0] = "TEXT";

  for (const allowedModelClasses of [
    ["TEXT", "TEXT"],
    ["TEXT", null],
    sparse,
    "TEXT",
  ]) {
    assert.equal(
      matchesAIProvisioningSnapshotGovernedShapeFloors(
        snapshot({allowedModelClasses}),
      ),
      false,
    );
  }

  assert.equal(
    matchesAIProvisioningSnapshotGovernedShapeFloors(
      snapshot({allowedModelClasses: Object.freeze([""])}),
    ),
    true,
  );
});

test("AIPROVSNAP-SHAPE-CUR-006 empty API and Model-class sets are valid", () => {
  assert.equal(
    matchesAIProvisioningSnapshotGovernedShapeFloors(
      snapshot({
        allowedApiClasses: Object.freeze([]),
        allowedModelClasses: Object.freeze([]),
      }),
    ),
    true,
  );
});

test("AIPROVSNAP-SHAPE-CUR-007 Capability Provider and unrelated snapshot fields remain uninterpreted", () => {
  assert.equal(
    matchesAIProvisioningSnapshotGovernedShapeFloors(
      snapshot({
        allowedCapabilityIds: "not-interpreted",
        allowedProviderIds: Object.freeze([null, "not-interpreted"]),
        industryContextId: "not-interpreted",
        tenantAiConfigVersion: null,
        status: "not-interpreted",
        compiledAt: null,
        validUntil: "not-interpreted",
        budgetPolicyRef: 7,
      }),
    ),
    true,
  );
});

test("AIPROVSNAP-SHAPE-CUR-008 input is not normalized or mutated", () => {
  const candidate = snapshot({
    msPackVersions: Object.freeze({x: " raw "}),
    countryPackVersions: Object.freeze({y: ""}),
    allowedApiClasses: Object.freeze(["TENANT_API"]),
    allowedModelClasses: Object.freeze([" raw ", ""]),
  });
  const before = JSON.stringify(candidate);

  assert.equal(matchesAIProvisioningSnapshotGovernedShapeFloors(candidate), true);
  assert.equal(JSON.stringify(candidate), before);
});
