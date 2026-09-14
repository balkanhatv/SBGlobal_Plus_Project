import test from "node:test";
import assert from "node:assert/strict";

test("context resolution rejects foreign membership and foreign/inactive organization evidence", async () => {
  for (const overrides of [
    { findMembership: async () => ({ id: "membership-x", tenantId: "tenant-b", principalId: "principal-1", status: "ACTIVE" }) },
    { findMembership: async () => ({ id: "membership-x", tenantId: "tenant-a", principalId: "principal-foreign", status: "ACTIVE" }) },
    { resolveOrgUnit: async () => ({ id: "org-x", tenantId: "tenant-b", status: "ACTIVE", path: [] }) },
    { resolveOrgUnit: async () => ({ id: "org-1", tenantId: "tenant-a", status: "SUSPENDED", path: [] }) },
    { resolveOrgUnit: async () => null },
  ]) {
    const { ports } = makePorts({ tenancy: overrides });
    await assert.rejects(new RequestContextService(ports).resolve({
      requestId: "request-scope", scopeClass: "TENANT_CORE",
      authentication: { kind: "HUMAN", credential: "test-credential" },
      tenantSelector: "TENANT-A",
    }), (error) => ["MEMBERSHIP_INVALID", "RESOURCE_SCOPE_DENY"].includes(error.code));
  }
});

import {
  ContextResolutionError,
  RequestContextService,
  createWorkerContext,
  toClientWorkspaceContext,
} from "../../dist/core/index.js";

const tenant = {
  id: "tenant-a",
  displayKey: "TENANT-A",
  displayName: "Tenant A",
  status: "ACTIVE",
};

const industry = {
  id: "industry-retail",
  tenantId: "tenant-a",
  industryCode: "RTL",
  displayKey: "retail",
  displayName: "Retail",
  status: "ACTIVE",
};

function makePorts(overrides = {}) {
  const calls = [];
  let idCounter = 0;

  const ports = {
    identity: {
      async verifyHumanSession() {
        calls.push("identity.human");
        return {
          principalId: "principal-1",
          principalType: "HUMAN",
          providerSubject: "provider-subject",
          authEpoch: 1,
          authStrength: "MFA",
          sessionVersion: 7,
          deviceId: "device-1",
        };
      },
      async verifyMachineCredential() {
        calls.push("identity.machine");
        return {
          principalId: "api-client-1",
          principalType: "API_CLIENT",
          credentialId: "credential-1",
          credentialVersion: 3,
          boundTenantId: "tenant-a",
          allowedIndustryContextIds: ["industry-retail"],
        };
      },
      async revokeProviderSession() {},
      getAuthStrength(evidence) {
        return evidence.authStrength;
      },
      getProviderSubject(evidence) {
        return evidence.providerSubject;
      },
    },
    tenancy: {
      async resolveTenant() {
        calls.push("tenancy.tenant");
        return tenant;
      },
      async findMembership() {
        calls.push("tenancy.membership");
        return {
          id: "membership-1",
          tenantId: "tenant-a",
          principalId: "principal-1",
          status: "ACTIVE",
          defaultOrgUnitId: "org-1",
          membershipVersion: 4,
        };
      },
      async resolveIndustryContext() {
        calls.push("tenancy.industry");
        return industry;
      },
      async resolveOrgUnit() {
        calls.push("tenancy.org");
        return {
          id: "org-1",
          tenantId: "tenant-a",
          path: ["org-root", "org-1"],
          status: "ACTIVE",
        };
      },
      async resolveDataHome() {
        calls.push("tenancy.datahome");
        return {
          id: "data-home-in",
          regionCode: "IN-CENTRAL",
          routingVersion: 2,
        };
      },
    },
    authorization: {
      async loadRoleContext() {
        calls.push("authorization.roles");
        return {
          roleIds: ["role-staff"],
          permissionVersion: 12,
        };
      },
    },
    commercial: {
      async validateAndLoad() {
        calls.push("commercial.entitlements");
        return {
          entitlementSnapshotId: "snapshot-1",
          entitlementSnapshotVersion: 9,
        };
      },
    },
    security: {
      async validateAndResolve() {
        calls.push("security.validate");
        return {
          authStrength: "MFA",
          deviceTrust: "TRUSTED",
          riskLevel: "LOW",
          attributes: {},
        };
      },
    },
    ids: {
      nextId() {
        idCounter += 1;
        return `generated-${idCounter}`;
      },
    },
  };

  for (const [key, value] of Object.entries(overrides)) {
    ports[key] = { ...ports[key], ...value };
  }

  return { ports, calls };
}

test("TCTX-001: valid tenant + active industry + membership creates immutable RequestContext", async () => {
  const { ports, calls } = makePorts();
  const service = new RequestContextService(ports);

  const context = await service.resolve({
    requestId: "request-1",
    scopeClass: "TENANT_INDUSTRY",
    authentication: { kind: "HUMAN", credential: "opaque-session" },
    tenantSelector: "tenant-a",
    industrySelector: "retail",
  });

  assert.equal(context.tenantId, "tenant-a");
  assert.equal(context.industryContextId, "industry-retail");
  assert.equal(context.membershipId, "membership-1");
  assert.equal(context.entitlementSnapshotVersion, 9);
  assert.equal(context.permissionVersion, 12);
  assert.equal(Object.isFrozen(context), true);
  assert.equal(Object.isFrozen(context.roleIds), true);
  assert.equal(Object.isFrozen(context.orgUnitPath), true);

  assert.deepEqual(calls, [
    "identity.human",
    "tenancy.tenant",
    "tenancy.membership",
    "tenancy.industry",
    "tenancy.org",
    "tenancy.datahome",
    "authorization.roles",
    "commercial.entitlements",
    "security.validate",
  ]);
});

test("TCTX-002: missing industry on TENANT_INDUSTRY denies before org/data/resource resolution", async () => {
  const { ports, calls } = makePorts();
  const service = new RequestContextService(ports);

  await assert.rejects(
    service.resolve({
      requestId: "request-2",
      scopeClass: "TENANT_INDUSTRY",
      authentication: { kind: "HUMAN", credential: "opaque-session" },
      tenantSelector: "tenant-a",
    }),
    (error) => error instanceof ContextResolutionError
      && error.code === "INDUSTRY_CONTEXT_REQUIRED",
  );

  assert.deepEqual(calls, [
    "identity.human",
    "tenancy.tenant",
    "tenancy.membership",
  ]);
});

test("TCTX-006: disabled industry activation denies despite stale selector", async () => {
  const { ports } = makePorts({
    tenancy: {
      async resolveIndustryContext() {
        return { ...industry, status: "DISABLED" };
      },
    },
  });
  const service = new RequestContextService(ports);

  await assert.rejects(
    service.resolve({
      requestId: "request-3",
      scopeClass: "TENANT_INDUSTRY",
      authentication: { kind: "HUMAN", credential: "opaque-session" },
      tenantSelector: "tenant-a",
      industrySelector: "retail",
    }),
    (error) => error instanceof ContextResolutionError
      && error.code === "INDUSTRY_CONTEXT_MISMATCH"
      && error.revealResourceExistence === false,
  );
});

test("ID-006: API credential outside its bound industry set denies before resource resolution", async () => {
  const { ports, calls } = makePorts({
    identity: {
      async verifyMachineCredential() {
        calls.push("identity.machine");
        return {
          principalId: "api-client-1",
          principalType: "API_CLIENT",
          credentialId: "credential-1",
          credentialVersion: 3,
          boundTenantId: "tenant-a",
          allowedIndustryContextIds: ["industry-education"],
        };
      },
    },
  });
  const service = new RequestContextService(ports);

  await assert.rejects(
    service.resolve({
      requestId: "request-4",
      scopeClass: "TENANT_INDUSTRY",
      authentication: { kind: "MACHINE", credential: "opaque-api-key" },
      tenantSelector: "tenant-a",
      industrySelector: "retail",
    }),
    (error) => error instanceof ContextResolutionError
      && error.code === "CREDENTIAL_INVALID",
  );

  assert.equal(calls.includes("authorization.roles"), false);
  assert.equal(calls.includes("commercial.entitlements"), false);
});

test("TENANT_CORE never treats null industryContextId as all industries", async () => {
  const { ports, calls } = makePorts();
  const service = new RequestContextService(ports);

  const context = await service.resolve({
    requestId: "request-5",
    scopeClass: "TENANT_CORE",
    authentication: { kind: "HUMAN", credential: "opaque-session" },
    tenantSelector: "tenant-a",
    industrySelector: "retail",
  });

  assert.equal(context.industryContextId, undefined);
  assert.equal(calls.includes("tenancy.industry"), false);
});

test("TCTX-007: industry worker without persisted industry context is rejected", () => {
  assert.throws(
    () => createWorkerContext({
      tenantId: "tenant-a",
      servicePrincipalId: "worker-1",
      correlationId: "correlation-1",
      dataHomeId: "data-home-in",
      scopeClass: "TENANT_INDUSTRY",
    }),
    (error) => error instanceof ContextResolutionError
      && error.code === "INDUSTRY_CONTEXT_REQUIRED",
  );
});

test("ClientWorkspaceContext excludes server-only risk, roles and credential fields", async () => {
  const { ports } = makePorts();
  const service = new RequestContextService(ports);
  const context = await service.resolve({
    requestId: "request-6",
    scopeClass: "TENANT_INDUSTRY",
    authentication: { kind: "HUMAN", credential: "opaque-session" },
    tenantSelector: "tenant-a",
    industrySelector: "retail",
  });

  const projection = toClientWorkspaceContext(context, tenant, industry);
  const serialized = JSON.stringify(projection);

  assert.equal(serialized.includes("securityContext"), false);
  assert.equal(serialized.includes("roleIds"), false);
  assert.equal(serialized.includes("credentialId"), false);
  assert.equal(serialized.includes("actorIpHash"), false);
  assert.equal(projection.selectedIndustry.displayKey, "retail");
});

test("machine credential cannot select a different tenant than its fixed binding", async () => {
  const { ports } = makePorts({
    tenancy: {
      async resolveTenant() {
        return { ...tenant, id: "tenant-b" };
      },
    },
  });
  const service = new RequestContextService(ports);

  await assert.rejects(
    service.resolve({
      requestId: "request-7",
      scopeClass: "TENANT_CORE",
      authentication: { kind: "MACHINE", credential: "opaque-api-key" },
      tenantSelector: "tenant-b",
    }),
    (error) => error instanceof ContextResolutionError
      && error.code === "TENANT_INVALID",
  );
});
