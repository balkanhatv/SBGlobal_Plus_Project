import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesApiCredentialCoreNecessaryFloors,
} from "../../dist/server/identity/api-credential-core-floors.js";

const ids = Object.freeze({
  credential: "11111111-1111-4111-8111-111111111111",
  principal: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  otherIndustry: "55555555-5555-4555-8555-555555555555",
  profile: "66666666-6666-4666-8666-666666666666",
});

const baseMaterial = Object.freeze({
  id: ids.credential,
  tenantId: ids.tenant,
  principalId: ids.principal,
  keyPrefix: "core-floor-prefix",
  secretHash: "opaque-verifier-material",
  status: "ACTIVE",
  permissionProfileId: ids.profile,
  allowedCidrs: Object.freeze(["10.0.0.0/8"]),
  credentialVersion: "1",
  createdAt: "2026-09-23T00:00:00.000Z",
  allowedIndustryContextIds: Object.freeze([ids.industry]),
});

const basePrincipal = Object.freeze({
  id: ids.principal,
  principalType: "API_CLIENT",
  status: "ACTIVE",
  authEpoch: "1",
});

const baseInput = Object.freeze({
  target: Object.freeze({
    scopeClass: "TENANT_CORE",
    tenantId: ids.tenant,
  }),
  evaluatedAt: "2026-09-24T04:20:00.000Z",
});

function material(overrides = {}) {
  return Object.freeze({...baseMaterial, ...overrides});
}

function principal(overrides = {}) {
  return Object.freeze({...basePrincipal, ...overrides});
}

function input(overrides = {}) {
  return Object.freeze({...baseInput, ...overrides});
}

test("APICRED-CORE-001 lifecycle, current principal and requested scope all true returns true", () => {
  assert.equal(
    matchesApiCredentialCoreNecessaryFloors(
      material(),
      principal(),
      input(),
    ),
    true,
  );
});

test("APICRED-CORE-002 lifecycle failure returns false", () => {
  assert.equal(
    matchesApiCredentialCoreNecessaryFloors(
      material({status: "REVOKED"}),
      principal(),
      input(),
    ),
    false,
  );
  assert.equal(
    matchesApiCredentialCoreNecessaryFloors(
      material({expiresAt: "2026-09-24T04:20:00.000Z"}),
      principal(),
      input(),
    ),
    false,
  );
});

test("APICRED-CORE-003 current machine-principal failure returns false", () => {
  assert.equal(
    matchesApiCredentialCoreNecessaryFloors(
      material(),
      principal({status: "SUSPENDED"}),
      input(),
    ),
    false,
  );
  assert.equal(
    matchesApiCredentialCoreNecessaryFloors(
      material(),
      principal({principalType: "HUMAN"}),
      input(),
    ),
    false,
  );
});

test("APICRED-CORE-004 requested-scope failure returns false", () => {
  assert.equal(
    matchesApiCredentialCoreNecessaryFloors(
      material(),
      principal(),
      input({
        target: Object.freeze({
          scopeClass: "TENANT_INDUSTRY",
          tenantId: ids.tenant,
          industryContextId: ids.otherIndustry,
        }),
      }),
    ),
    false,
  );
});

test("APICRED-CORE-005 multiple malformed or failed floors remain false with no fallback", () => {
  assert.equal(
    matchesApiCredentialCoreNecessaryFloors(
      material({
        status: "EXPIRED",
        principalId: "bad-principal",
        expiresAt: "not-an-expiry",
        allowedIndustryContextIds: Object.freeze(["bad-industry"]),
      }),
      principal({
        id: "bad-principal",
        status: "REVOKED",
        principalType: "HUMAN",
      }),
      input({
        evaluatedAt: "not-an-instant",
        target: Object.freeze({
          scopeClass: "TENANT_CORE",
          tenantId: "bad-tenant",
        }),
      }),
    ),
    false,
  );
});

test("APICRED-CORE-006 platform and Tenant-Industry success paths preserve DD-161 scope rules", () => {
  const platformMaterial = material({
    tenantId: undefined,
    industryContextId: undefined,
    allowedIndustryContextIds: Object.freeze([]),
  });
  const platformService = principal({
    principalType: "SERVICE",
    serviceCode: "PLATFORM_WORKER",
    owningModule: "Identity",
    allowedScopeClasses: Object.freeze(["PLATFORM_GLOBAL"]),
  });
  assert.equal(
    matchesApiCredentialCoreNecessaryFloors(
      platformMaterial,
      platformService,
      input({
        target: Object.freeze({scopeClass: "PLATFORM_GLOBAL"}),
      }),
    ),
    true,
  );

  const industryTarget = Object.freeze({
    scopeClass: "TENANT_INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
  });
  assert.equal(
    matchesApiCredentialCoreNecessaryFloors(
      material(),
      principal(),
      input({target: industryTarget}),
    ),
    true,
  );

  const tenantService = principal({
    principalType: "SERVICE",
    serviceCode: "TENANT_WORKER",
    owningModule: "Identity",
    allowedScopeClasses: Object.freeze(["TENANT_CORE"]),
  });
  assert.equal(
    matchesApiCredentialCoreNecessaryFloors(
      material(),
      tenantService,
      input({target: industryTarget}),
    ),
    false,
  );
});

test("APICRED-CORE-007 hash, CIDR, profile, version and use evidence remains uninterpreted and inputs are not mutated", () => {
  const candidateMaterial = material({
    secretHash: "",
    permissionProfileId: undefined,
    lastUsedAt: "not-used-here",
    allowedCidrs: Object.freeze(["192.0.2.0/24"]),
    credentialVersion: "-9223372036854775808",
    revokedAt: "not-used-while-status-active",
  });
  const candidatePrincipal = principal({authEpoch: "-9223372036854775808"});
  const candidateInput = input();
  const beforeMaterial = JSON.stringify(candidateMaterial);
  const beforePrincipal = JSON.stringify(candidatePrincipal);
  const beforeInput = JSON.stringify(candidateInput);

  assert.equal(
    matchesApiCredentialCoreNecessaryFloors(
      candidateMaterial,
      candidatePrincipal,
      candidateInput,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateMaterial), beforeMaterial);
  assert.equal(JSON.stringify(candidatePrincipal), beforePrincipal);
  assert.equal(JSON.stringify(candidateInput), beforeInput);
  assert.equal(Object.isFrozen(candidateMaterial), true);
  assert.equal(Object.isFrozen(candidatePrincipal), true);
  assert.equal(Object.isFrozen(candidateInput), true);
});
