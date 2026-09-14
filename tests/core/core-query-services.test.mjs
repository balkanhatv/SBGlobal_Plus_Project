import test from "node:test";
import assert from "node:assert/strict";

import {
  ContextResolutionError,
  CORE_IDENTITY_ROLES_LIST_EFFECTIVE,
  IdentityRoleQueryService,
  WorkspaceService,
} from "../../dist/core/index.js";

const tenantCoreContext = Object.freeze({
  requestId: "req-core-1",
  correlationId: "corr-core-1",
  tenantId: "tenant-a",
  dataHomeId: "data-home-in",
  regionCode: "IN-CENTRAL",
  principalId: "principal-1",
  principalType: "HUMAN",
  membershipId: "membership-1",
  orgUnitId: "org-1",
  orgUnitPath: Object.freeze(["root", "org-1"]),
  roleIds: Object.freeze(["role-staff"]),
  permissionVersion: 12,
  entitlementSnapshotId: "snapshot-1",
  entitlementSnapshotVersion: 9,
  sessionVersion: 7,
  scopeClass: "TENANT_CORE",
});

function tenancyPort(overrides = {}) {
  return {
    async getTenantById() {
      return {
        id: "tenant-a",
        displayKey: "TENANT-A",
        displayName: "Tenant A",
        status: "ACTIVE",
      };
    },
    async resolveTenant() {
      return null;
    },
    async findMembership() {
      return null;
    },
    async resolveIndustryContext() {
      return {
        id: "industry-retail",
        tenantId: "tenant-a",
        industryCode: "RTL",
        displayKey: "retail",
        displayName: "Retail",
        status: "ACTIVE",
      };
    },
    async resolveOrgUnit() {
      return null;
    },
    async resolveDataHome() {
      return { id: "data-home-in", regionCode: "IN-CENTRAL", routingVersion: 1 };
    },
    ...overrides,
  };
}

test("core.tenancy.workspace.resolve projects only sanitized tenant/industry workspace data", async () => {
  const service = new WorkspaceService(tenancyPort());

  const result = await service.resolve({
    requestContext: tenantCoreContext,
    industrySelector: "retail",
  });

  assert.deepEqual(result, {
    tenant: {
      displayKey: "TENANT-A",
      displayName: "Tenant A",
    },
    selectedIndustry: {
      displayKey: "retail",
      displayName: "Retail",
    },
    orgUnitId: "org-1",
    entitlementSnapshotVersion: 9,
    sessionVersion: 7,
  });

  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("principalId"), false);
  assert.equal(serialized.includes("roleIds"), false);
  assert.equal(serialized.includes("securityContext"), false);
});

test("workspace query rejects disabled Industry selection without changing TENANT_CORE context", async () => {
  const service = new WorkspaceService(tenancyPort({
    async resolveIndustryContext() {
      return {
        id: "industry-retail",
        tenantId: "tenant-a",
        industryCode: "RTL",
        displayKey: "retail",
        displayName: "Retail",
        status: "DISABLED",
      };
    },
  }));

  await assert.rejects(
    service.resolve({
      requestContext: tenantCoreContext,
      industrySelector: "retail",
    }),
    (error) => error instanceof ContextResolutionError
      && error.code === "INDUSTRY_CONTEXT_MISMATCH",
  );

  assert.equal(tenantCoreContext.industryContextId, undefined);
});

test("workspace query requires active membership-derived TENANT_CORE context", async () => {
  const service = new WorkspaceService(tenancyPort());

  await assert.rejects(
    service.resolve({
      requestContext: {
        ...tenantCoreContext,
        membershipId: undefined,
      },
    }),
    (error) => error instanceof ContextResolutionError
      && error.code === "MEMBERSHIP_INVALID",
  );
});

test("core.identity.roles.listEffective reads only within active tenant context", async () => {
  const calls = [];
  const service = new IdentityRoleQueryService({
    async listEffective(input) {
      calls.push(input);
      return {
        principalId: input.principalId,
        membershipId: input.membershipId,
        roleIds: ["role-staff", "role-approver"],
        permissionVersion: 13,
      };
    },
  });

  const result = await service.listEffective({
    requestContext: tenantCoreContext,
  });

  assert.deepEqual(calls, [{
    tenantId: "tenant-a",
    principalId: "principal-1",
    membershipId: "membership-1",
  }]);
  assert.deepEqual(result.roleIds, ["role-staff", "role-approver"]);
  assert.equal(result.permissionVersion, 13);
  assert.equal(Object.isFrozen(result.roleIds), true);
});

test("roles.listEffective canonical OperationContract preserves exact DD-06 permission", () => {
  assert.equal(
    CORE_IDENTITY_ROLES_LIST_EFFECTIVE.operationId,
    "core.identity.roles.listEffective",
  );
  assert.equal(
    CORE_IDENTITY_ROLES_LIST_EFFECTIVE.permissionCode,
    "core.identity.role.view",
  );
  assert.equal(
    CORE_IDENTITY_ROLES_LIST_EFFECTIVE.scopeClass,
    "TENANT_CORE",
  );
});
