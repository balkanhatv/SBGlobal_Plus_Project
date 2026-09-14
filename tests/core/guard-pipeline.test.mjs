import test from "node:test";
import assert from "node:assert/strict";

import {
  GuardPipeline,
  GuardPipelineError,
  OperationRegistry,
} from "../../dist/core/index.js";

const requestContext = Object.freeze({
  requestId: "request-guard-1",
  correlationId: "correlation-guard-1",
  tenantId: "tenant-a",
  industryContextId: "industry-retail",
  dataHomeId: "data-home-in",
  regionCode: "IN-CENTRAL",
  principalId: "principal-1",
  principalType: "HUMAN",
  membershipId: "membership-1",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze(["role-staff"]),
  permissionVersion: 12,
  entitlementSnapshotId: "snapshot-1",
  entitlementSnapshotVersion: 9,
  scopeClass: "TENANT_INDUSTRY",
});

const operation = Object.freeze({
  operationId: "ind.rtl.pos.sale.view",
  module: "RTL-POS",
  scopeClass: "TENANT_INDUSTRY",
  kind: "QUERY",
  permissionCode: "rtl.pos.sale.view",
  entitlementRequirement: "rtl.pos.enabled",
  inputSchemaVersion: 1,
  outputSchemaVersion: 1,
  resourceResolver: "rtl.pos.sale",
  idempotencyPolicy: "NONE",
  rateClass: "AUTH_STANDARD",
  auditClass: "STANDARD",
  domainService: "RetailPosSaleService",
  emittedEvents: Object.freeze([]),
  errorCodes: Object.freeze([
    "INDUSTRY_CONTEXT_MISMATCH",
    "PERMISSION_DENIED",
    "RESOURCE_NOT_FOUND",
  ]),
});

function decision(overrides = {}) {
  return {
    decision: "ALLOW",
    policyIds: [],
    permissionCode: operation.permissionCode,
    decisionId: "decision-1",
    auditRequired: true,
    evaluatedAt: "2026-09-14T00:00:00Z",
    permissionVersion: 12,
    entitlementSnapshotVersion: 9,
    ...overrides,
  };
}

function makePorts(overrides = {}) {
  const calls = [];

  const ports = {
    commercial: {
      async validateCurrent() {
        calls.push("commercial");
        return { allowed: true };
      },
    },
    authorization: {
      async evaluateBase() {
        calls.push("authorization.base");
        return decision({ decisionId: "decision-base" });
      },
      async evaluateResource() {
        calls.push("authorization.resource");
        return decision({ decisionId: "decision-resource" });
      },
    },
    resources: {
      async resolve() {
        calls.push("resource.resolve");
        return {
          resourceType: "rtl.pos.sale",
          resourceId: "sale-1",
          tenantId: "tenant-a",
          industryContextId: "industry-retail",
          state: "PAID",
        };
      },
    },
  };

  for (const [key, value] of Object.entries(overrides)) {
    ports[key] = { ...ports[key], ...value };
  }

  return { ports, calls };
}

test("API guard order: commercial + base PDP occur before resource resolution, then resource PDP", async () => {
  const { ports, calls } = makePorts();
  const guard = new GuardPipeline(ports);

  const result = await guard.authorize({
    requestContext,
    operation,
    resourceReference: { saleId: "sale-1" },
  });

  assert.equal(result.decisionId, "decision-resource");
  assert.equal(result.resourceDescriptor.resourceId, "sale-1");
  assert.deepEqual(calls, [
    "commercial",
    "authorization.base",
    "resource.resolve",
    "authorization.resource",
  ]);
});

test("COM-004 style license denial stops before PDP/resource resolution", async () => {
  const { ports, calls } = makePorts({
    commercial: {
      async validateCurrent() {
        calls.push("commercial");
        return {
          allowed: false,
          code: "LICENSE_INVALID",
          reasonCode: "LICENSE_INVALID",
        };
      },
    },
  });
  const guard = new GuardPipeline(ports);

  await assert.rejects(
    guard.authorize({
      requestContext,
      operation,
      resourceReference: { saleId: "sale-1" },
    }),
    (error) => error instanceof GuardPipelineError
      && error.code === "LICENSE_INVALID"
      && error.reasonCode === "LICENSE_INVALID",
  );

  assert.deepEqual(calls, ["commercial"]);
});

test("RBAC denial occurs before resource resolution and exposes no resource existence", async () => {
  const { ports, calls } = makePorts({
    authorization: {
      async evaluateBase() {
        calls.push("authorization.base");
        return decision({
          decision: "DENY",
          reasonCode: "RBAC_DENY",
          decisionId: "decision-deny",
        });
      },
    },
  });
  const guard = new GuardPipeline(ports);

  await assert.rejects(
    guard.authorize({
      requestContext,
      operation,
      resourceReference: { saleId: "sale-foreign-or-local" },
    }),
    (error) => error instanceof GuardPipelineError
      && error.code === "PERMISSION_DENIED"
      && error.decisionId === "decision-deny"
      && error.revealResourceExistence === false,
  );

  assert.deepEqual(calls, ["commercial", "authorization.base"]);
});

test("TCTX-003/API-004: sibling Industry resource denies without auto-switch", async () => {
  const { ports } = makePorts({
    resources: {
      async resolve() {
        return {
          resourceType: "rtl.pos.sale",
          resourceId: "sale-1",
          tenantId: "tenant-a",
          industryContextId: "industry-healthcare",
        };
      },
    },
  });
  const guard = new GuardPipeline(ports);

  await assert.rejects(
    guard.authorize({
      requestContext,
      operation,
      resourceReference: { saleId: "sale-1" },
    }),
    (error) => error instanceof GuardPipelineError
      && error.code === "INDUSTRY_CONTEXT_MISMATCH"
      && error.revealResourceExistence === false,
  );
});

test("TCTX-004: cross-tenant resource normalizes to RESOURCE_NOT_FOUND", async () => {
  const { ports } = makePorts({
    resources: {
      async resolve() {
        return {
          resourceType: "rtl.pos.sale",
          resourceId: "sale-foreign",
          tenantId: "tenant-b",
          industryContextId: "industry-retail",
        };
      },
    },
  });
  const guard = new GuardPipeline(ports);

  await assert.rejects(
    guard.authorize({
      requestContext,
      operation,
      resourceReference: { saleId: "sale-foreign" },
    }),
    (error) => error instanceof GuardPipelineError
      && error.code === "RESOURCE_NOT_FOUND"
      && error.revealResourceExistence === false,
  );
});

test("RESTRICT decisions preserve base and resource restriction sets for domain service", async () => {
  const { ports } = makePorts({
    authorization: {
      async evaluateBase() {
        return decision({
          decision: "RESTRICT",
          decisionId: "decision-base",
          restrictionSet: { fields: ["id", "state"] },
        });
      },
      async evaluateResource() {
        return decision({
          decision: "RESTRICT",
          decisionId: "decision-resource",
          restrictionSet: { redact: ["customerContact"] },
        });
      },
    },
  });
  const guard = new GuardPipeline(ports);

  const result = await guard.authorize({
    requestContext,
    operation,
    resourceReference: { saleId: "sale-1" },
  });

  assert.deepEqual(result.restrictionSet, {
    fields: ["id", "state"],
    redact: ["customerContact"],
  });
});

test("UPGRADE_CTA becomes entitlement denial and never resolves resource", async () => {
  const { ports, calls } = makePorts({
    authorization: {
      async evaluateBase() {
        calls.push("authorization.base");
        return decision({
          decision: "UPGRADE_CTA",
          reasonCode: "ENTITLEMENT_MISSING",
          decisionId: "decision-upgrade",
          upgradeTarget: "PREMIUM",
        });
      },
    },
  });
  const guard = new GuardPipeline(ports);

  await assert.rejects(
    guard.authorize({
      requestContext,
      operation,
      resourceReference: { saleId: "sale-1" },
    }),
    (error) => error instanceof GuardPipelineError
      && error.code === "ENTITLEMENT_DENIED"
      && error.upgradeTarget === "PREMIUM",
  );

  assert.deepEqual(calls, ["commercial", "authorization.base"]);
});

test("operation scope mismatch fails before commercial checks", async () => {
  const { ports, calls } = makePorts();
  const guard = new GuardPipeline(ports);

  await assert.rejects(
    guard.authorize({
      requestContext: { ...requestContext, scopeClass: "TENANT_CORE", industryContextId: undefined },
      operation,
      resourceReference: { saleId: "sale-1" },
    }),
    (error) => error instanceof GuardPipelineError
      && error.code === "INDUSTRY_CONTEXT_REQUIRED",
  );

  assert.deepEqual(calls, []);
});

test("OperationRegistry rejects duplicate business operation IDs", () => {
  const registry = new OperationRegistry();
  registry.register(operation);

  assert.throws(
    () => registry.register(operation),
    /Duplicate OperationContract/,
  );
});
