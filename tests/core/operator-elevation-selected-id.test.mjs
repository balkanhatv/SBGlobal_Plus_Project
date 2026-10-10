import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesOperatorElevationSelectedIdFloor,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  elevation: "11111111-1111-4111-8111-111111111111",
  otherElevation: "22222222-2222-4222-8222-222222222222",
  operator: "33333333-3333-4333-8333-333333333333",
  tenant: "44444444-4444-4444-8444-444444444444",
  industry: "55555555-5555-4555-8555-555555555555",
  approver: "66666666-6666-4666-8666-666666666666",
  profile: "77777777-7777-4777-8777-777777777777",
});

const base = Object.freeze({
  id: ids.elevation,
  operatorPrincipalId: ids.operator,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  purposeCode: "SUPPORT",
  ticketReference: "INC-100",
  approvedBy: ids.approver,
  startsAt: "2026-09-24T00:00:00.000Z",
  expiresAt: "2026-09-24T02:00:00.000Z",
  status: "ACTIVE",
  permissionProfileId: ids.profile,
  createdAt: "2026-09-23T23:00:00.000Z",
});

function metadata(overrides = {}) {
  return Object.freeze({...base, ...overrides});
}

test("OPELEV-SEL-001 exact selected UUID matches persisted elevation id", () => {
  assert.equal(
    matchesOperatorElevationSelectedIdFloor(metadata(), ids.elevation),
    true,
  );
});

test("OPELEV-SEL-002 different valid elevation UUID fails", () => {
  assert.equal(
    matchesOperatorElevationSelectedIdFloor(metadata(), ids.otherElevation),
    false,
  );
});

test("OPELEV-SEL-003 empty selected id fails closed", () => {
  assert.equal(
    matchesOperatorElevationSelectedIdFloor(metadata(), ""),
    false,
  );
});

test("OPELEV-SEL-004 malformed selected id fails closed", () => {
  for (const selected of ["not-a-uuid", "11111111-1111-1111-1111-111111111111", " "]) {
    assert.equal(
      matchesOperatorElevationSelectedIdFloor(metadata(), selected),
      false,
    );
  }
});

test("OPELEV-SEL-005 malformed persisted id fails closed", () => {
  assert.equal(
    matchesOperatorElevationSelectedIdFloor(
      metadata({id: "bad-persisted-id"}),
      ids.elevation,
    ),
    false,
  );
});

test("OPELEV-SEL-006 unrelated subject, target, time, status, and policy fields do not affect this floor", () => {
  const row = metadata({
    operatorPrincipalId: "not-checked",
    tenantId: "not-checked",
    industryContextId: "not-checked",
    purposeCode: "",
    ticketReference: undefined,
    approvedBy: undefined,
    startsAt: "bad-start",
    expiresAt: "bad-expiry",
    status: "REVOKED",
    permissionProfileId: "not-checked",
  });
  assert.equal(
    matchesOperatorElevationSelectedIdFloor(row, ids.elevation),
    true,
  );
});

test("OPELEV-SEL-007 helper mutates neither metadata nor selected-id input and exposes equality only", () => {
  const row = metadata();
  const selected = ids.elevation;
  const before = JSON.stringify(row);

  assert.equal(matchesOperatorElevationSelectedIdFloor(row, selected), true);
  assert.equal(JSON.stringify(row), before);
  assert.equal(selected, ids.elevation);
  assert.equal(Object.isFrozen(row), true);
});
