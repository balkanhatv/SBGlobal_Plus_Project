import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesCurrentMachinePrincipalFloor,
} from "../../dist/server/identity/machine-principal-currentness.js";

const base = Object.freeze({
  id: "11111111-1111-4111-8111-111111111111",
  principalType: "API_CLIENT",
  status: "ACTIVE",
  authEpoch: "7",
});

function metadata(overrides = {}) {
  return Object.freeze({...base, ...overrides});
}

test("MACHPRINC-CUR-001 ACTIVE API_CLIENT matches", () => {
  assert.equal(matchesCurrentMachinePrincipalFloor(metadata()), true);
});

test("MACHPRINC-CUR-002 ACTIVE SERVICE with required service metadata matches", () => {
  assert.equal(
    matchesCurrentMachinePrincipalFloor(metadata({
      principalType: "SERVICE",
      serviceCode: "BILLING_WORKER",
      owningModule: "Billing",
      allowedScopeClasses: Object.freeze(["TENANT_CORE"]),
    })),
    true,
  );
});

test("MACHPRINC-CUR-003 HUMAN and PLATFORM_OPERATOR fail even when ACTIVE", () => {
  for (const principalType of ["HUMAN", "PLATFORM_OPERATOR"]) {
    assert.equal(
      matchesCurrentMachinePrincipalFloor(metadata({principalType})),
      false,
    );
  }
});

test("MACHPRINC-CUR-004 PENDING, SUSPENDED and REVOKED fail regardless of machine type", () => {
  for (const status of ["PENDING", "SUSPENDED", "REVOKED"]) {
    assert.equal(
      matchesCurrentMachinePrincipalFloor(metadata({status})),
      false,
    );
    assert.equal(
      matchesCurrentMachinePrincipalFloor(metadata({
        principalType: "SERVICE",
        status,
        serviceCode: "SERVICE_CODE",
        owningModule: "Module",
      })),
      false,
    );
  }
});

test("MACHPRINC-CUR-005 SERVICE missing or blank service metadata fails closed", () => {
  for (const variant of [
    {serviceCode: undefined, owningModule: "Module"},
    {serviceCode: "SERVICE_CODE", owningModule: undefined},
    {serviceCode: "", owningModule: "Module"},
    {serviceCode: "SERVICE_CODE", owningModule: ""},
    {serviceCode: "   ", owningModule: "Module"},
    {serviceCode: "SERVICE_CODE", owningModule: "   "},
  ]) {
    assert.equal(
      matchesCurrentMachinePrincipalFloor(metadata({
        principalType: "SERVICE",
        ...variant,
      })),
      false,
    );
  }
});

test("MACHPRINC-CUR-006 allowed scopes and auth epoch do not create acceptance or requested-scope authorization", () => {
  assert.equal(
    matchesCurrentMachinePrincipalFloor(metadata({
      principalType: "HUMAN",
      authEpoch: "-9223372036854775808",
      allowedScopeClasses: Object.freeze([
        "PLATFORM_GLOBAL",
        "TENANT_CORE",
        "TENANT_INDUSTRY",
        "EXPLICIT_CROSS_CONTEXT",
      ]),
    })),
    false,
  );
  assert.equal(
    matchesCurrentMachinePrincipalFloor(metadata({
      principalType: "API_CLIENT",
      authEpoch: "9223372036854775807",
      allowedScopeClasses: Object.freeze([]),
    })),
    true,
  );
});

test("MACHPRINC-CUR-007 helper is deterministic, side-effect free and does not mutate metadata", () => {
  const candidate = metadata({
    principalType: "SERVICE",
    serviceCode: "SERVICE_CODE",
    owningModule: "Module",
    allowedScopeClasses: Object.freeze(["TENANT_CORE"]),
  });
  const before = JSON.stringify(candidate);

  assert.equal(matchesCurrentMachinePrincipalFloor(candidate), true);
  assert.equal(matchesCurrentMachinePrincipalFloor(candidate), true);
  assert.equal(JSON.stringify(candidate), before);
  assert.equal(Object.isFrozen(candidate), true);
  assert.equal(Object.isFrozen(candidate.allowedScopeClasses), true);
});
