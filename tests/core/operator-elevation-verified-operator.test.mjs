import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesOperatorElevationVerifiedPlatformOperatorFloor,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  elevation: "11111111-1111-4111-8111-111111111111",
  operator: "22222222-2222-4222-8222-222222222222",
  otherOperator: "33333333-3333-4333-8333-333333333333",
  tenant: "44444444-4444-4444-8444-444444444444",
  industry: "55555555-5555-4555-8555-555555555555",
  approver: "66666666-6666-4666-8666-666666666666",
  profile: "77777777-7777-4777-8777-777777777777",
});

const baseMetadata = Object.freeze({
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

const baseEvidence = Object.freeze({
  principalId: ids.operator,
  principalType: "PLATFORM_OPERATOR",
  providerSubject: "provider-subject",
  providerSessionId: "provider-session",
  providerSessionCreatedAtMs: 1_795_000_000_000,
  authEpoch: 4,
  authStrength: "PASSWORD",
  sessionVersion: 9,
  deviceId: "device-registration",
});

function metadata(overrides = {}) {
  return Object.freeze({...baseMetadata, ...overrides});
}

function evidence(overrides = {}) {
  return Object.freeze({...baseEvidence, ...overrides});
}

test("OPELEV-ID-001 exact verified PLATFORM_OPERATOR principal matches", () => {
  assert.equal(
    matchesOperatorElevationVerifiedPlatformOperatorFloor(
      metadata(),
      evidence(),
    ),
    true,
  );
});

test("OPELEV-ID-002 HUMAN with the same principal id fails", () => {
  assert.equal(
    matchesOperatorElevationVerifiedPlatformOperatorFloor(
      metadata(),
      evidence({principalType: "HUMAN"}),
    ),
    false,
  );
});

test("OPELEV-ID-003 API_CLIENT and SERVICE principal types fail", () => {
  for (const principalType of ["API_CLIENT", "SERVICE"]) {
    assert.equal(
      matchesOperatorElevationVerifiedPlatformOperatorFloor(
        metadata(),
        evidence({principalType}),
      ),
      false,
    );
  }
});

test("OPELEV-ID-004 different PLATFORM_OPERATOR principal id fails", () => {
  assert.equal(
    matchesOperatorElevationVerifiedPlatformOperatorFloor(
      metadata(),
      evidence({principalId: ids.otherOperator}),
    ),
    false,
  );
});

test("OPELEV-ID-005 malformed persisted or evidence principal UUID fails closed", () => {
  assert.equal(
    matchesOperatorElevationVerifiedPlatformOperatorFloor(
      metadata({operatorPrincipalId: "bad-persisted-id"}),
      evidence(),
    ),
    false,
  );
  assert.equal(
    matchesOperatorElevationVerifiedPlatformOperatorFloor(
      metadata(),
      evidence({principalId: "bad-evidence-id"}),
    ),
    false,
  );
});

test("OPELEV-ID-006 auth/session/device/provider metadata does not strengthen or weaken this floor", () => {
  for (const variant of [
    evidence({authStrength: "PASSWORD"}),
    evidence({authStrength: "MFA", sessionVersion: undefined, deviceId: undefined}),
    evidence({authStrength: "SSO", providerSubject: "", providerSessionId: ""}),
    evidence({authStrength: "PHISHING_RESISTANT", authEpoch: -1}),
  ]) {
    assert.equal(
      matchesOperatorElevationVerifiedPlatformOperatorFloor(metadata(), variant),
      true,
    );
  }
});

test("OPELEV-ID-007 unrelated elevation fields are ignored and inputs remain unchanged", () => {
  const first = metadata({
    tenantId: "not-checked-here",
    industryContextId: "also-not-checked-here",
    purposeCode: "",
    ticketReference: undefined,
    approvedBy: undefined,
    startsAt: "bad-start",
    expiresAt: "bad-expiry",
    status: "REVOKED",
    permissionProfileId: "not-checked-here",
  });
  const second = evidence();
  const beforeFirst = JSON.stringify(first);
  const beforeSecond = JSON.stringify(second);

  assert.equal(
    matchesOperatorElevationVerifiedPlatformOperatorFloor(first, second),
    true,
  );
  assert.equal(JSON.stringify(first), beforeFirst);
  assert.equal(JSON.stringify(second), beforeSecond);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(second), true);
});
