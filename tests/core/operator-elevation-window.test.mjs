import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesOperatorElevationCurrentTimeStatusFloor,
} from "../../dist/core/index.js";

const base = Object.freeze({
  id: "11111111-1111-4111-8111-111111111111",
  operatorPrincipalId: "22222222-2222-4222-8222-222222222222",
  tenantId: "33333333-3333-4333-8333-333333333333",
  industryContextId: "44444444-4444-4444-8444-444444444444",
  purposeCode: "SUPPORT",
  ticketReference: "INC-100",
  approvedBy: "55555555-5555-4555-8555-555555555555",
  startsAt: "2026-09-24T00:00:00.000Z",
  expiresAt: "2026-09-24T02:00:00.000Z",
  status: "ACTIVE",
  permissionProfileId: "66666666-6666-4666-8666-666666666666",
  createdAt: "2026-09-23T23:00:00.000Z",
});

function elevation(overrides = {}) {
  return Object.freeze({...base, ...overrides});
}

test("OPELEV-WIN-001 ACTIVE strictly inside the persisted window matches", () => {
  assert.equal(
    matchesOperatorElevationCurrentTimeStatusFloor(
      elevation(),
      "2026-09-24T01:00:00.000Z",
    ),
    true,
  );
});

test("OPELEV-WIN-002 exact startsAt boundary is inclusive", () => {
  assert.equal(
    matchesOperatorElevationCurrentTimeStatusFloor(
      elevation(),
      "2026-09-24T00:00:00.000Z",
    ),
    true,
  );
});

test("OPELEV-WIN-003 exact expiresAt boundary is exclusive", () => {
  assert.equal(
    matchesOperatorElevationCurrentTimeStatusFloor(
      elevation(),
      "2026-09-24T02:00:00.000Z",
    ),
    false,
  );
});

test("OPELEV-WIN-004 non-ACTIVE persisted statuses never match", () => {
  for (const status of ["PENDING", "REVOKED", "EXPIRED"]) {
    assert.equal(
      matchesOperatorElevationCurrentTimeStatusFloor(
        elevation({status}),
        "2026-09-24T01:00:00.000Z",
      ),
      false,
    );
  }
});

test("OPELEV-WIN-005 before-start and after-expiry instants do not match", () => {
  assert.equal(
    matchesOperatorElevationCurrentTimeStatusFloor(
      elevation(),
      "2026-09-23T23:59:59.999Z",
    ),
    false,
  );
  assert.equal(
    matchesOperatorElevationCurrentTimeStatusFloor(
      elevation(),
      "2026-09-24T02:00:00.001Z",
    ),
    false,
  );
});

test("OPELEV-WIN-006 malformed evaluation or persisted timestamps fail closed", () => {
  assert.equal(
    matchesOperatorElevationCurrentTimeStatusFloor(elevation(), "not-a-time"),
    false,
  );
  assert.equal(
    matchesOperatorElevationCurrentTimeStatusFloor(
      elevation({startsAt: "bad-start"}),
      "2026-09-24T01:00:00.000Z",
    ),
    false,
  );
  assert.equal(
    matchesOperatorElevationCurrentTimeStatusFloor(
      elevation({expiresAt: "bad-expiry"}),
      "2026-09-24T01:00:00.000Z",
    ),
    false,
  );
  assert.equal(
    matchesOperatorElevationCurrentTimeStatusFloor(
      elevation({
        startsAt: "2026-09-24T03:00:00.000Z",
        expiresAt: "2026-09-24T02:00:00.000Z",
      }),
      "2026-09-24T02:30:00.000Z",
    ),
    false,
  );
});

test("OPELEV-WIN-007 unrelated elevation metadata is neither interpreted nor mutated", () => {
  const first = elevation();
  const second = elevation({
    operatorPrincipalId: "77777777-7777-4777-8777-777777777777",
    tenantId: "88888888-8888-4888-8888-888888888888",
    industryContextId: undefined,
    purposeCode: "",
    ticketReference: undefined,
    approvedBy: undefined,
    permissionProfileId: "99999999-9999-4999-8999-999999999999",
  });
  const before = JSON.stringify(first);

  assert.equal(
    matchesOperatorElevationCurrentTimeStatusFloor(
      first,
      "2026-09-24T01:00:00.000Z",
    ),
    true,
  );
  assert.equal(
    matchesOperatorElevationCurrentTimeStatusFloor(
      second,
      "2026-09-24T01:00:00.000Z",
    ),
    true,
  );
  assert.equal(JSON.stringify(first), before);
  assert.equal(Object.isFrozen(first), true);
});
