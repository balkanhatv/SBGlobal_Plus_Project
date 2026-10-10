import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesOperatorElevationSubjectTargetFloor,
} from "../../dist/core/index.js";

const ids = {
  elevation: "11111111-1111-4111-8111-111111111111",
  operator: "22222222-2222-4222-8222-222222222222",
  otherOperator: "33333333-3333-4333-8333-333333333333",
  tenant: "44444444-4444-4444-8444-444444444444",
  otherTenant: "55555555-5555-4555-8555-555555555555",
  industryA: "66666666-6666-4666-8666-666666666666",
  industryB: "77777777-7777-4777-8777-777777777777",
  approver: "88888888-8888-4888-8888-888888888888",
  profile: "99999999-9999-4999-8999-999999999999",
};

const base = Object.freeze({
  id: ids.elevation,
  operatorPrincipalId: ids.operator,
  tenantId: ids.tenant,
  purposeCode: "SUPPORT",
  ticketReference: "INC-100",
  approvedBy: ids.approver,
  startsAt: "2026-09-24T00:00:00.000Z",
  expiresAt: "2026-09-24T02:00:00.000Z",
  status: "ACTIVE",
  permissionProfileId: ids.profile,
  createdAt: "2026-09-23T23:00:00.000Z",
});

function elevation(overrides = {}) {
  return Object.freeze({...base, ...overrides});
}

function binding(overrides = {}) {
  return Object.freeze({
    operatorPrincipalId: ids.operator,
    tenantId: ids.tenant,
    ...overrides,
  });
}

test("OPELEV-BIND-001 exact operator and Tenant match Tenant-wide elevation", () => {
  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(elevation(), binding()),
    true,
  );
});

test("OPELEV-BIND-002 Tenant-wide elevation also matches same-Tenant Industry input", () => {
  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(
      elevation(),
      binding({industryContextId: ids.industryA}),
    ),
    true,
  );
});

test("OPELEV-BIND-003 Industry-targeted elevation requires and matches exact Industry", () => {
  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(
      elevation({industryContextId: ids.industryA}),
      binding({industryContextId: ids.industryA}),
    ),
    true,
  );
});

test("OPELEV-BIND-004 sibling or missing Industry fails for Industry-targeted elevation", () => {
  const metadata = elevation({industryContextId: ids.industryA});
  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(
      metadata,
      binding({industryContextId: ids.industryB}),
    ),
    false,
  );
  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(metadata, binding()),
    false,
  );
});

test("OPELEV-BIND-005 operator or Tenant mismatch fails", () => {
  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(
      elevation(),
      binding({operatorPrincipalId: ids.otherOperator}),
    ),
    false,
  );
  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(
      elevation(),
      binding({tenantId: ids.otherTenant}),
    ),
    false,
  );
});

test("OPELEV-BIND-006 malformed input or persisted UUID evidence fails closed", () => {
  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(
      elevation({operatorPrincipalId: "bad"}),
      binding(),
    ),
    false,
  );
  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(
      elevation({tenantId: "bad"}),
      binding(),
    ),
    false,
  );
  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(
      elevation({industryContextId: "bad"}),
      binding({industryContextId: ids.industryA}),
    ),
    false,
  );
  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(
      elevation(),
      binding({industryContextId: "bad"}),
    ),
    false,
  );
});

test("OPELEV-BIND-007 unrelated lifecycle/policy evidence is ignored and inputs are not mutated", () => {
  const first = elevation({
    status: "REVOKED",
    startsAt: "not-a-time",
    expiresAt: "also-not-a-time",
    purposeCode: "",
    ticketReference: undefined,
    approvedBy: undefined,
    permissionProfileId: ids.profile,
  });
  const second = binding({industryContextId: ids.industryA});
  const beforeFirst = JSON.stringify(first);
  const beforeSecond = JSON.stringify(second);

  assert.equal(
    matchesOperatorElevationSubjectTargetFloor(first, second),
    true,
  );
  assert.equal(JSON.stringify(first), beforeFirst);
  assert.equal(JSON.stringify(second), beforeSecond);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(second), true);
});
