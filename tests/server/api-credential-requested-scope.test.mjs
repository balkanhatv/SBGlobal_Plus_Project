import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesApiCredentialRequestedScopeFloor,
} from "../../dist/server/identity/api-credential-requested-scope.js";

const ids = Object.freeze({
  credential: "11111111-1111-4111-8111-111111111111",
  principal: "22222222-2222-4222-8222-222222222222",
  otherPrincipal: "33333333-3333-4333-8333-333333333333",
  tenant: "44444444-4444-4444-8444-444444444444",
  otherTenant: "55555555-5555-4555-8555-555555555555",
  industry: "66666666-6666-4666-8666-666666666666",
  siblingIndustry: "77777777-7777-4777-8777-777777777777",
});

const baseMaterial = Object.freeze({
  id: ids.credential,
  tenantId: ids.tenant,
  principalId: ids.principal,
  keyPrefix: "scope-prefix",
  secretHash: "opaque",
  status: "ACTIVE",
  credentialVersion: "1",
  createdAt: "2026-09-24T00:00:00.000Z",
  allowedIndustryContextIds: Object.freeze([ids.industry]),
});

const apiClient = Object.freeze({
  id: ids.principal,
  principalType: "API_CLIENT",
  status: "ACTIVE",
  authEpoch: "1",
});

const tenantService = Object.freeze({
  id: ids.principal,
  principalType: "SERVICE",
  status: "ACTIVE",
  authEpoch: "1",
  serviceCode: "TENANT_SERVICE",
  owningModule: "Core",
  allowedScopeClasses: Object.freeze(["TENANT_CORE", "TENANT_INDUSTRY"]),
});

function material(overrides = {}) {
  return Object.freeze({...baseMaterial, ...overrides});
}

function principal(overrides = {}) {
  return Object.freeze({...apiClient, ...overrides});
}

function target(overrides = {}) {
  return Object.freeze({
    scopeClass: "TENANT_CORE",
    tenantId: ids.tenant,
    ...overrides,
  });
}

test("APICRED-SCOPE-001 allowlisted platform SERVICE + platform credential matches PLATFORM_GLOBAL only", () => {
  const platformMaterial = material({
    tenantId: undefined,
    industryContextId: undefined,
    allowedIndustryContextIds: Object.freeze([]),
  });
  const platformService = principal({
    principalType: "SERVICE",
    serviceCode: "PLATFORM_SERVICE",
    owningModule: "Core",
    allowedScopeClasses: Object.freeze(["PLATFORM_GLOBAL"]),
  });

  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      platformMaterial,
      platformService,
      Object.freeze({scopeClass: "PLATFORM_GLOBAL"}),
    ),
    true,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      platformMaterial,
      platformService,
      target(),
    ),
    false,
  );
});

test("APICRED-SCOPE-002 Tenant-Core API_CLIENT/SERVICE exact Tenant target matches with SERVICE requested-scope allowlist", () => {
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(material(), apiClient, target()),
    true,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(material(), tenantService, target()),
    true,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      material(),
      principal({
        principalType: "SERVICE",
        serviceCode: "INDUSTRY_ONLY",
        owningModule: "Core",
        allowedScopeClasses: Object.freeze(["TENANT_INDUSTRY"]),
      }),
      target(),
    ),
    false,
  );
});

test("APICRED-SCOPE-003 exact Tenant-Industry credential matches exact target with SERVICE TENANT_INDUSTRY allowlist", () => {
  const scoped = material({
    industryContextId: ids.industry,
    allowedIndustryContextIds: Object.freeze([ids.industry]),
  });
  const requested = target({
    scopeClass: "TENANT_INDUSTRY",
    industryContextId: ids.industry,
  });

  assert.equal(
    matchesApiCredentialRequestedScopeFloor(scoped, apiClient, requested),
    true,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(scoped, tenantService, requested),
    true,
  );
});

test("APICRED-SCOPE-004 Tenant-Core credential reaches only explicitly allowed Industry and SERVICE still needs TENANT_INDUSTRY", () => {
  const requested = target({
    scopeClass: "TENANT_INDUSTRY",
    industryContextId: ids.industry,
  });

  assert.equal(
    matchesApiCredentialRequestedScopeFloor(material(), apiClient, requested),
    true,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(material(), tenantService, requested),
    true,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      material(),
      principal({
        principalType: "SERVICE",
        serviceCode: "CORE_ONLY",
        owningModule: "Core",
        allowedScopeClasses: Object.freeze(["TENANT_CORE"]),
      }),
      requested,
    ),
    false,
  );
});

test("APICRED-SCOPE-005 principal, Tenant and Industry mismatches fail closed", () => {
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      material(),
      principal({id: ids.otherPrincipal}),
      target(),
    ),
    false,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      material(),
      apiClient,
      target({tenantId: ids.otherTenant}),
    ),
    false,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      material(),
      apiClient,
      target({
        scopeClass: "TENANT_INDUSTRY",
        industryContextId: ids.siblingIndustry,
      }),
    ),
    false,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      material({
        tenantId: undefined,
        allowedIndustryContextIds: Object.freeze([ids.industry]),
      }),
      principal({
        principalType: "SERVICE",
        serviceCode: "PLATFORM_SERVICE",
        owningModule: "Core",
        allowedScopeClasses: Object.freeze(["PLATFORM_GLOBAL"]),
      }),
      Object.freeze({scopeClass: "PLATFORM_GLOBAL"}),
    ),
    false,
  );
});

test("APICRED-SCOPE-006 EXPLICIT_CROSS_CONTEXT and malformed UUID/target shapes fail closed", () => {
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      material(),
      apiClient,
      target({scopeClass: "EXPLICIT_CROSS_CONTEXT"}),
    ),
    false,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      material(),
      apiClient,
      target({tenantId: "bad-tenant"}),
    ),
    false,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      material(),
      apiClient,
      Object.freeze({
        scopeClass: "TENANT_INDUSTRY",
        tenantId: ids.tenant,
      }),
    ),
    false,
  );
  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      material({allowedIndustryContextIds: Object.freeze(["bad-industry"])}),
      apiClient,
      target(),
    ),
    false,
  );
});

test("APICRED-SCOPE-007 lifecycle, hash, CIDR, profile, version, use and principal-currentness evidence is ignored and inputs stay unchanged", () => {
  const rawMaterial = material({
    status: "REVOKED",
    secretHash: "",
    expiresAt: "2000-01-01T00:00:00.000Z",
    permissionProfileId: undefined,
    lastUsedAt: "not-used",
    allowedCidrs: Object.freeze(["192.0.2.0/24"]),
    credentialVersion: "-9223372036854775808",
  });
  const rawPrincipal = principal({
    status: "REVOKED",
    authEpoch: "-9223372036854775808",
  });
  const requested = target();
  const beforeMaterial = JSON.stringify(rawMaterial);
  const beforePrincipal = JSON.stringify(rawPrincipal);
  const beforeTarget = JSON.stringify(requested);

  assert.equal(
    matchesApiCredentialRequestedScopeFloor(
      rawMaterial,
      rawPrincipal,
      requested,
    ),
    true,
  );
  assert.equal(JSON.stringify(rawMaterial), beforeMaterial);
  assert.equal(JSON.stringify(rawPrincipal), beforePrincipal);
  assert.equal(JSON.stringify(requested), beforeTarget);
  assert.equal(Object.isFrozen(rawMaterial), true);
  assert.equal(Object.isFrozen(rawPrincipal), true);
  assert.equal(Object.isFrozen(requested), true);
});
