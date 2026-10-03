import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesOperatorElevationCoreNecessaryFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  elevation: "11111111-1111-4111-8111-111111111111",
  otherElevation: "22222222-2222-4222-8222-222222222222",
  operator: "33333333-3333-4333-8333-333333333333",
  otherOperator: "44444444-4444-4444-8444-444444444444",
  tenant: "55555555-5555-4555-8555-555555555555",
  otherTenant: "66666666-6666-4666-8666-666666666666",
  industry: "77777777-7777-4777-8777-777777777777",
  otherIndustry: "88888888-8888-4888-8888-888888888888",
  approver: "99999999-9999-4999-8999-999999999999",
  profile: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
});

const baseMetadata = Object.freeze({
  id: ids.elevation,
  operatorPrincipalId: ids.operator,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  purposeCode: "SUPPORT",
  ticketReference: "INC-200",
  approvedBy: ids.approver,
  startsAt: "2026-09-24T00:00:00.000Z",
  expiresAt: "2026-09-24T02:00:00.000Z",
  status: "ACTIVE",
  permissionProfileId: ids.profile,
  createdAt: "2026-09-23T23:00:00.000Z",
});

const baseIdentity = Object.freeze({
  principalId: ids.operator,
  principalType: "PLATFORM_OPERATOR",
  providerSubject: "provider-subject",
  providerSessionId: "provider-session",
  providerSessionCreatedAtMs: 1_795_000_000_000,
  authEpoch: 1,
  authStrength: "PASSWORD",
  sessionVersion: 1,
});

const baseInput = Object.freeze({
  selectedElevationId: ids.elevation,
  verifiedIdentity: baseIdentity,
  subjectTarget: Object.freeze({
    operatorPrincipalId: ids.operator,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
  }),
  evaluatedAt: "2026-09-24T01:00:00.000Z",
});

function metadata(overrides = {}) {
  return Object.freeze({...baseMetadata, ...overrides});
}

function input(overrides = {}) {
  return Object.freeze({...baseInput, ...overrides});
}

test("OPELEV-CORE-001 all four necessary floors true returns true", () => {
  assert.equal(
    matchesOperatorElevationCoreNecessaryFloors(metadata(), input()),
    true,
  );
});

test("OPELEV-CORE-002 selected-id floor failure returns false", () => {
  assert.equal(
    matchesOperatorElevationCoreNecessaryFloors(
      metadata(),
      input({selectedElevationId: ids.otherElevation}),
    ),
    false,
  );
});

test("OPELEV-CORE-003 verified PLATFORM_OPERATOR floor failure returns false", () => {
  assert.equal(
    matchesOperatorElevationCoreNecessaryFloors(
      metadata(),
      input({
        verifiedIdentity: Object.freeze({
          ...baseIdentity,
          principalType: "HUMAN",
        }),
      }),
    ),
    false,
  );
});

test("OPELEV-CORE-004 subject-target floor failure returns false", () => {
  assert.equal(
    matchesOperatorElevationCoreNecessaryFloors(
      metadata(),
      input({
        subjectTarget: Object.freeze({
          operatorPrincipalId: ids.operator,
          tenantId: ids.otherTenant,
          industryContextId: ids.industry,
        }),
      }),
    ),
    false,
  );
});

test("OPELEV-CORE-005 status-time floor failure returns false", () => {
  assert.equal(
    matchesOperatorElevationCoreNecessaryFloors(
      metadata(),
      input({evaluatedAt: "2026-09-24T02:00:00.000Z"}),
    ),
    false,
  );
  assert.equal(
    matchesOperatorElevationCoreNecessaryFloors(
      metadata({status: "REVOKED"}),
      input(),
    ),
    false,
  );
});

test("OPELEV-CORE-006 multiple malformed or failed floors remain false", () => {
  assert.equal(
    matchesOperatorElevationCoreNecessaryFloors(
      metadata({
        id: "bad-id",
        operatorPrincipalId: "bad-operator",
        startsAt: "bad-start",
      }),
      input({
        selectedElevationId: "",
        verifiedIdentity: Object.freeze({
          ...baseIdentity,
          principalId: "bad-evidence",
          principalType: "HUMAN",
        }),
        subjectTarget: Object.freeze({
          operatorPrincipalId: "bad-binding",
          tenantId: "bad-tenant",
          industryContextId: "bad-industry",
        }),
        evaluatedAt: "bad-evaluated-at",
      }),
    ),
    false,
  );
});

test("OPELEV-CORE-007 unrelated policy/session evidence is not interpreted and inputs stay unchanged", () => {
  const row = metadata({
    purposeCode: "",
    ticketReference: undefined,
    approvedBy: undefined,
    permissionProfileId: ids.otherOperator,
  });
  const candidate = input({
    verifiedIdentity: Object.freeze({
      ...baseIdentity,
      authStrength: "PHISHING_RESISTANT",
      authEpoch: -1,
      sessionVersion: undefined,
      deviceId: "device-anything",
    }),
  });
  const beforeRow = JSON.stringify(row);
  const beforeInput = JSON.stringify(candidate);

  assert.equal(
    matchesOperatorElevationCoreNecessaryFloors(row, candidate),
    true,
  );
  assert.equal(JSON.stringify(row), beforeRow);
  assert.equal(JSON.stringify(candidate), beforeInput);
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(candidate), true);
});

