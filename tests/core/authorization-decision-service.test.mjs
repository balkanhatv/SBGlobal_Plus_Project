import test from "node:test";
import assert from "node:assert/strict";

import {
  AuthorizationDecisionError,
  AuthorizationDecisionService,
  GuardPipeline,
  GuardPipelineError,
} from "../../dist/core/index.js";

const tenantContext = Object.freeze({
  requestId: "request-authz-eval-1",
  correlationId: "correlation-authz-eval-1",
  tenantId: "tenant-a",
  industryContextId: "industry-retail",
  dataHomeId: "data-home-in",
  regionCode: "IN-CENTRAL",
  principalId: "principal-1",
  principalType: "HUMAN",
  membershipId: "membership-1",
  orgUnitId: "org-branch-1",
  orgUnitPath: Object.freeze(["org-root", "org-branch-1"]),
  roleIds: Object.freeze(["role-staff"]),
  permissionVersion: 12,
  entitlementSnapshotId: "entitlement-snapshot-1",
  entitlementSnapshotVersion: 9,
  authStrength: "MFA",
  securityContext: Object.freeze({
    authStrength: "MFA",
    deviceTrust: "TRUSTED",
    riskLevel: "LOW",
    attributes: Object.freeze({}),
  }),
  scopeClass: "TENANT_INDUSTRY",
});

const platformContext = Object.freeze({
  requestId: "request-authz-platform-1",
  correlationId: "correlation-authz-platform-1",
  principalId: "platform-principal-1",
  principalType: "PLATFORM_OPERATOR",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  scopeClass: "PLATFORM_GLOBAL",
  securityContext: Object.freeze({
    deviceTrust: "NOT_APPLICABLE",
    riskLevel: "LOW",
    attributes: Object.freeze({}),
  }),
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
  errorCodes: Object.freeze(["PERMISSION_DENIED", "POLICY_DENIED"]),
});

const platformOperation = Object.freeze({
  ...operation,
  operationId: "core.platform.tenant.view",
  module: "CORE-PLATFORM",
  scopeClass: "PLATFORM_GLOBAL",
  permissionCode: "core.platform.tenant.view",
  resourceResolver: undefined,
});

function snapshot({
  scopeClass = "TENANT_INDUSTRY",
  permissionVersion = 12,
  roleIds = ["role-staff"],
  effect = "ALLOW",
  permissionCode = operation.permissionCode,
  policies = [],
} = {}) {
  return Object.freeze({
    permissionSnapshot: Object.freeze({
      scopeClass,
      permissionVersion,
      roleIds: Object.freeze([...roleIds]),
      permissionSet: Object.freeze({
        permissions: Object.freeze([{ code: permissionCode, effect }]),
      }),
      sourceFingerprint: "fingerprint-1",
    }),
    policies: Object.freeze(policies),
  });
}

function policy(overrides = {}) {
  return Object.freeze({
    id: "policy-1",
    code: "POLICY-1",
    tenantId: "tenant-a",
    industryContextId: "industry-retail",
    permissionPattern: operation.permissionCode,
    priority: 100,
    effect: "DENY",
    expressionVersion: 1,
    expression: Object.freeze({ op: "eq", attribute: "subject.type", value: "HUMAN" }),
    ...overrides,
  });
}

function harness(state, supplemental = {}) {
  let id = 0;
  const loads = [];
  const factLoads = [];
  const service = new AuthorizationDecisionService({
    readStore: {
      async load(input) {
        loads.push(input);
        return typeof state === "function" ? state(input) : state;
      },
    },
    supplementalFacts: {
      async load(input) {
        factLoads.push(input);
        return supplemental;
      },
    },
    runtime: {
      now() {
        return new Date("2026-09-18T00:00:00Z");
      },
      nextDecisionId() {
        id += 1;
        return `decision-${id}`;
      },
    },
  });
  return { service, loads, factLoads };
}

test("AUTH-001: exact current RBAC allow with no matching policy returns ALLOW", async () => {
  const { service, loads } = harness(snapshot());
  const decision = await service.evaluateBase({ requestContext: tenantContext, operation });

  assert.equal(decision.decision, "ALLOW");
  assert.equal(decision.permissionVersion, 12);
  assert.equal(decision.entitlementSnapshotVersion, 9);
  assert.equal(decision.auditRequired, true);
  assert.deepEqual(decision.policyIds, []);
  assert.equal(loads.length, 1);
});

test("AUTH-002: RBAC deny is final and ABAC cannot widen it", async () => {
  const { service, factLoads } = harness(snapshot({
    effect: "DENY",
    policies: [policy({ effect: "RESTRICT" })],
  }));

  const decision = await service.evaluateBase({ requestContext: tenantContext, operation });
  assert.equal(decision.decision, "DENY");
  assert.equal(decision.reasonCode, "RBAC_DENY");
  assert.deepEqual(decision.policyIds, []);
  assert.equal(factLoads.length, 0);
});

test("AUTH-003: RBAC allow plus matching ABAC deny returns DENY with policy evidence", async () => {
  const { service } = harness(snapshot({ policies: [policy()] }));
  const decision = await service.evaluateBase({ requestContext: tenantContext, operation });

  assert.equal(decision.decision, "DENY");
  assert.equal(decision.reasonCode, "ABAC_DENY");
  assert.deepEqual(decision.policyIds, ["policy-1"]);
});

test("AUTH-009: matching persisted RESTRICT fails closed until a governed restriction payload exists", async () => {
  const { service } = harness(snapshot({ policies: [policy({ effect: "RESTRICT" })] }));
  const decision = await service.evaluateBase({ requestContext: tenantContext, operation });

  assert.equal(decision.decision, "DENY");
  assert.equal(decision.reasonCode, "ABAC_DENY");
  assert.deepEqual(decision.policyIds, ["policy-1"]);
});

test("AUTH-010/014: resource policy is deferred at base and enforced after fresh resource evaluation", async () => {
  let reads = 0;
  const resourcePolicy = policy({
    expression: Object.freeze({ op: "eq", attribute: "resource.state", value: "BLOCKED" }),
  });
  const { service } = harness(() => {
    reads += 1;
    return snapshot({ policies: [resourcePolicy] });
  });

  const base = await service.evaluateBase({ requestContext: tenantContext, operation });
  assert.equal(base.decision, "ALLOW");

  const resource = await service.evaluateResource({
    requestContext: tenantContext,
    operation,
    resourceDescriptor: Object.freeze({
      resourceType: "rtl.pos.sale",
      resourceId: "sale-1",
      tenantId: "tenant-a",
      industryContextId: "industry-retail",
      state: "BLOCKED",
    }),
  });
  assert.equal(resource.decision, "DENY");
  assert.equal(resource.reasonCode, "ABAC_DENY");
  assert.equal(reads, 2);
});

test("AUTH-011: unavailable non-exists supplemental fact fails closed", async () => {
  const commercialPolicy = policy({
    expression: Object.freeze({
      op: "eq",
      attribute: "commercial.subscriptionState",
      value: "ACTIVE",
    }),
  });
  const { service } = harness(snapshot({ policies: [commercialPolicy] }));

  await assert.rejects(
    service.evaluateBase({ requestContext: tenantContext, operation }),
    (error) => error instanceof AuthorizationDecisionError
      && error.code === "AUTHORIZATION_ATTRIBUTE_UNAVAILABLE",
  );
});

test("exists may test an absent supplemental fact without inventing policy truth", async () => {
  const commercialPolicy = policy({
    expression: Object.freeze({
      op: "exists",
      attribute: "commercial.subscriptionState",
    }),
  });
  const { service } = harness(snapshot({ policies: [commercialPolicy] }));

  const decision = await service.evaluateBase({ requestContext: tenantContext, operation });
  assert.equal(decision.decision, "ALLOW");
});

test("server-owned supplemental commercial facts participate without overriding direct context facts", async () => {
  const commercialPolicy = policy({
    expression: Object.freeze({
      op: "eq",
      attribute: "commercial.subscriptionState",
      value: "SUSPENDED",
    }),
  });
  const { service } = harness(
    snapshot({ policies: [commercialPolicy] }),
    { "commercial.subscriptionState": "SUSPENDED" },
  );

  const decision = await service.evaluateBase({ requestContext: tenantContext, operation });
  assert.equal(decision.decision, "DENY");
  assert.equal(decision.reasonCode, "ABAC_DENY");
});

test("supplemental facts cannot override directly resolved subject facts", async () => {
  const { service } = harness(
    snapshot({ policies: [policy()] }),
    { "subject.type": "SERVICE" },
  );

  await assert.rejects(
    service.evaluateBase({ requestContext: tenantContext, operation }),
    (error) => error instanceof AuthorizationDecisionError
      && error.code === "AUTHORIZATION_ATTRIBUTE_INVALID",
  );
});

test("AUTH-012: stale tenant permission version or role set fails closed", async () => {
  for (const requestContext of [
    { ...tenantContext, permissionVersion: 11 },
    { ...tenantContext, roleIds: Object.freeze(["role-other"]) },
  ]) {
    const { service } = harness(snapshot());
    await assert.rejects(
      service.evaluateBase({ requestContext, operation }),
      (error) => error instanceof AuthorizationDecisionError
        && error.code === "AUTHORIZATION_CONTEXT_STALE",
    );
  }
});

test("AUTH-013: PLATFORM_GLOBAL uses platform snapshot and omits tenant entitlement version", async () => {
  const { service } = harness(snapshot({
    scopeClass: "PLATFORM_GLOBAL",
    permissionVersion: 4,
    roleIds: ["platform-role"],
    permissionCode: platformOperation.permissionCode,
  }));

  const decision = await service.evaluateBase({
    requestContext: platformContext,
    operation: platformOperation,
  });

  assert.equal(decision.decision, "ALLOW");
  assert.equal(decision.permissionVersion, 4);
  assert.equal(Object.hasOwn(decision, "entitlementSnapshotVersion"), false);
});

test("GuardPipeline normalizes evaluator dependency failures without exposing resource existence", async () => {
  const guard = new GuardPipeline({
    commercial: {
      async validateCurrent() {
        return { allowed: true };
      },
    },
    authorization: {
      async evaluateBase() {
        throw new AuthorizationDecisionError(
          "AUTHORIZATION_STATE_UNAVAILABLE",
          "private state detail",
        );
      },
      async evaluateResource() {
        throw new Error("not reached");
      },
    },
    resources: {
      async resolve() {
        throw new Error("not reached");
      },
    },
  });

  await assert.rejects(
    guard.authorize({
      requestContext: tenantContext,
      operation: { ...operation, resourceResolver: undefined },
    }),
    (error) => error instanceof GuardPipelineError
      && error.code === "DEPENDENCY_UNAVAILABLE"
      && error.revealResourceExistence === false
      && !error.message.includes("private"),
  );
});
