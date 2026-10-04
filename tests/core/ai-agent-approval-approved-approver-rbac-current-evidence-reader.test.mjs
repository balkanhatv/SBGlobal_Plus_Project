import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIAgentApprovalApprovedApproverRbacCurrentEvidence,
} from "../../dist/core/index.js";

const PERMISSION = "ai.agent.approval.approve";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  foreignTenant: "12121212-1212-4212-8212-121212121212",
  industry: "22222222-2222-4222-8222-222222222222",
  siblingIndustry: "23232323-2323-4232-8232-232323232323",
  approval: "33333333-3333-4333-8333-333333333333",
  run: "44444444-4444-4444-8444-444444444444",
  step: "55555555-5555-4555-8555-555555555555",
  definition: "66666666-6666-4666-8666-666666666666",
  actor: "77777777-7777-4777-8777-777777777777",
  approver: "88888888-8888-4888-8888-888888888888",
  membership: "99999999-9999-4999-8999-999999999999",
  approverMembership: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  roleA: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  roleB: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  correlation: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  policy: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
});

function actingContext(overrides = {}) {
  return Object.freeze({
    requestId: "acting-request",
    correlationId: "acting-correlation",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "home-1",
    regionCode: "IN-CENTRAL",
    principalId: ids.actor,
    principalType: "HUMAN",
    membershipId: ids.membership,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    permissionVersion: 7,
    entitlementSnapshotVersion: 11,
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function approverContext(overrides = {}) {
  return Object.freeze({
    requestId: "approver-request",
    correlationId: "approver-correlation",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "home-1",
    regionCode: "IN-CENTRAL",
    principalId: ids.approver,
    principalType: "HUMAN",
    membershipId: ids.approverMembership,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([ids.roleA, ids.roleB]),
    permissionVersion: 13,
    entitlementSnapshotVersion: 17,
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function approval(overrides = {}) {
  return Object.freeze({
    id: ids.approval,
    runId: ids.run,
    stepId: ids.step,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    requestedByAgent: true,
    approvalType: "RAW_TYPE",
    requiredPermission: PERMISSION,
    approverPrincipalId: ids.approver,
    status: "APPROVED",
    requestSummarySafe: "safe summary",
    approvedAt: "2026-10-04T01:00:00.000Z",
    reason: "raw reason",
    correlationId: ids.correlation,
    createdAt: "2026-10-04T00:00:00.000Z",
    ...overrides,
  });
}

function run(overrides = {}) {
  return Object.freeze({
    id: ids.run,
    agentDefinitionId: ids.definition,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    actingPrincipalId: ids.actor,
    membershipId: ids.membership,
    entitlementSnapshotVersion: "raw-entitlement-version",
    permissionVersion: "raw-permission-version",
    requestedResourceScope: Object.freeze({raw: true}),
    status: "WAITING_APPROVAL",
    stepBudgetClass: "raw-step-budget",
    tokenBudgetClass: "raw-token-budget",
    startedAt: "2026-10-04T00:00:00.000Z",
    completedAt: undefined,
    correlationId: ids.correlation,
    ...overrides,
  });
}

function step(overrides = {}) {
  return Object.freeze({
    id: ids.step,
    runId: ids.run,
    ordinal: 7,
    stepType: "TOOL",
    inputRef: "raw-input",
    outputRef: "raw-output",
    toolBindingId: undefined,
    approvalId: undefined,
    status: "RUNNING",
    startedAt: "2026-10-04T00:00:30.000Z",
    completedAt: undefined,
    auditRef: "raw-audit",
    ...overrides,
  });
}

function authorizationState(overrides = {}) {
  const snapshotOverrides = overrides.permissionSnapshot ?? {};
  const policies = Object.hasOwn(overrides, "policies")
    ? overrides.policies
    : Object.freeze([
      Object.freeze({
        id: ids.policy,
        code: "raw-policy",
        tenantId: ids.tenant,
        industryContextId: ids.industry,
        permissionPattern: PERMISSION,
        priority: 10,
        effect: "DENY",
        expressionVersion: 1,
        expression: Object.freeze({
          op: "eq",
          attribute: "environment.region",
          value: "OUTSIDE",
        }),
      }),
    ]);

  return Object.freeze({
    permissionSnapshot: Object.freeze({
      scopeClass: "TENANT_INDUSTRY",
      permissionVersion: 13,
      roleIds: Object.freeze([ids.roleA, ids.roleB]),
      permissionSet: Object.freeze({
        permissions: Object.freeze([
          Object.freeze({code: PERMISSION, effect: "ALLOW"}),
        ]),
      }),
      sourceFingerprint: "fingerprint-1",
      ...snapshotOverrides,
    }),
    policies,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const approvalCalls = [];
  const runCalls = [];
  const stepCalls = [];
  const authorizationCalls = [];
  const values = {
    approval: Object.hasOwn(overrides, "approval") ? overrides.approval : approval(),
    run: Object.hasOwn(overrides, "run") ? overrides.run : run(),
    step: Object.hasOwn(overrides, "step") ? overrides.step : step(),
    authorizationState: Object.hasOwn(overrides, "authorizationState")
      ? overrides.authorizationState
      : authorizationState(),
  };

  return {
    order,
    approvalCalls,
    runCalls,
    stepCalls,
    authorizationCalls,
    values,
    approvalReader: {
      async loadForContext(input) {
        order.push("approval");
        approvalCalls.push(input);
        if (overrides.approvalError) throw overrides.approvalError;
        return values.approval;
      },
    },
    runReader: {
      async loadForContext(input) {
        order.push("run");
        runCalls.push(input);
        if (overrides.runError) throw overrides.runError;
        return values.run;
      },
    },
    stepReader: {
      async loadForContext(input) {
        order.push("step");
        stepCalls.push(input);
        if (overrides.stepError) throw overrides.stepError;
        return values.step;
      },
    },
    authorizationReader: {
      async load(input) {
        order.push("authorization");
        authorizationCalls.push(input);
        if (overrides.authorizationError) throw overrides.authorizationError;
        return values.authorizationState;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadAIAgentApprovalApprovedApproverRbacCurrentEvidence(
    {
      requestContext: actingContext(),
      agentApprovalId: ids.approval,
      approverRequestContext: approverContext(),
      ...inputOverrides,
    },
    f.approvalReader,
    f.runReader,
    f.stepReader,
    f.authorizationReader,
  );
}

test("AIAPP-RBACREAD-BASE-001 exact DD-432 parent evidence is established first with unchanged inputs", async () => {
  const f = fixture();
  const acting = actingContext();
  const current = approverContext();

  const result = await load(f, {
    requestContext: acting,
    approverRequestContext: current,
  });

  assert.ok(result);
  assert.deepEqual(f.order, ["approval", "run", "step", "authorization"]);
  assert.equal(f.approvalCalls[0].requestContext, acting);
  assert.equal(f.approvalCalls[0].agentApprovalId, ids.approval);
  assert.equal(f.runCalls[0].requestContext, acting);
  assert.equal(f.stepCalls[0].requestContext, acting);
  assert.equal(result.parent.approverRequestContext, current);
});

test("AIAPP-RBACREAD-BASE-002 DD-432 null/error short-circuits or propagates before Authorization read access", async () => {
  const hidden = fixture({approval: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.authorizationCalls, []);

  const expected = new Error("parent-failed");
  const broken = fixture({runError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["approval", "run"]);
  assert.deepEqual(broken.authorizationCalls, []);
});

test("AIAPP-RBACREAD-READ-001 exactly one Authorization read uses exact trusted approver context and persisted requiredPermission", async () => {
  const f = fixture();
  const current = approverContext();
  const result = await load(f, {approverRequestContext: current});

  assert.ok(result);
  assert.equal(f.authorizationCalls.length, 1);
  assert.equal(f.authorizationCalls[0].requestContext, current);
  assert.equal(f.authorizationCalls[0].permissionCode, PERMISSION);
});

test("AIAPP-RBACREAD-READ-002 Authorization dependency errors propagate unchanged with no permission fallback", async () => {
  const expected = new Error("authorization-unavailable");
  const f = fixture({authorizationError: expected});
  const current = approverContext();

  await assert.rejects(
    load(f, {approverRequestContext: current}),
    error => error === expected,
  );
  assert.equal(f.authorizationCalls.length, 1);
  assert.equal(f.authorizationCalls[0].requestContext, current);
  assert.equal(f.authorizationCalls[0].permissionCode, PERMISSION);
});

test("AIAPP-RBACREAD-CUR-001 exact Tenant-Core/Tenant-Industry scope permissionVersion and ordered roleIds parity passes", async () => {
  const industry = fixture();
  assert.ok(await load(industry));

  const coreCurrent = approverContext({
    scopeClass: "TENANT_CORE",
    industryContextId: undefined,
  });
  const core = fixture({
    approval: approval({industryContextId: undefined}),
    run: run({industryContextId: undefined}),
    authorizationState: authorizationState({
      permissionSnapshot: {
        scopeClass: "TENANT_CORE",
      },
    }),
  });

  const coreResult = await load(core, {approverRequestContext: coreCurrent});
  assert.ok(coreResult);
  assert.equal(coreResult.parent.approverRequestContext, coreCurrent);
});

test("AIAPP-RBACREAD-CUR-002 scope mismatch missing/stale/invalid permissionVersion or role-set mismatch fails closed", async () => {
  const cases = [
    {
      current: approverContext(),
      state: authorizationState({permissionSnapshot: {scopeClass: "TENANT_CORE"}}),
    },
    {
      current: approverContext({permissionVersion: undefined}),
      state: authorizationState(),
    },
    {
      current: approverContext({permissionVersion: 12}),
      state: authorizationState(),
    },
    {
      current: approverContext({permissionVersion: 0}),
      state: authorizationState(),
    },
    {
      current: approverContext({permissionVersion: Number.MAX_SAFE_INTEGER + 1}),
      state: authorizationState(),
    },
    {
      current: approverContext(),
      state: authorizationState({
        permissionSnapshot: {
          roleIds: Object.freeze([ids.roleB, ids.roleA]),
        },
      }),
    },
    {
      current: approverContext(),
      state: authorizationState({
        permissionSnapshot: {
          roleIds: Object.freeze([ids.roleA]),
        },
      }),
    },
  ];

  for (const candidate of cases) {
    const f = fixture({authorizationState: candidate.state});
    assert.equal(
      await load(f, {approverRequestContext: candidate.current}),
      null,
    );
    assert.equal(f.authorizationCalls.length, 1);
  }
});

test("AIAPP-RBACREAD-PERM-001 exact current ALLOW passes while missing DENY or duplicate exact evidence fails closed", async () => {
  assert.ok(await load(fixture()));

  const missing = fixture({
    authorizationState: authorizationState({
      permissionSnapshot: {
        permissionSet: Object.freeze({permissions: Object.freeze([])}),
      },
    }),
  });
  assert.equal(await load(missing), null);

  const denied = fixture({
    authorizationState: authorizationState({
      permissionSnapshot: {
        permissionSet: Object.freeze({
          permissions: Object.freeze([
            Object.freeze({code: PERMISSION, effect: "DENY"}),
          ]),
        }),
      },
    }),
  });
  assert.equal(await load(denied), null);

  const duplicate = fixture({
    authorizationState: authorizationState({
      permissionSnapshot: {
        permissionSet: Object.freeze({
          permissions: Object.freeze([
            Object.freeze({code: PERMISSION, effect: "ALLOW"}),
            Object.freeze({code: PERMISSION, effect: "ALLOW"}),
          ]),
        }),
      },
    }),
  });
  assert.equal(await load(duplicate), null);
});

test("AIAPP-RBACREAD-EVID-001 success preserves exact parent state permission and raw ABAC evidence references", async () => {
  const current = approverContext();
  const state = authorizationState();
  const f = fixture({authorizationState: state});
  const before = JSON.stringify([
    f.values.approval,
    f.values.run,
    f.values.step,
    current,
    state,
  ]);

  const result = await load(f, {approverRequestContext: current});
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.parent.approverRequestContext, current);
  assert.equal(result.parent.parent.approval, f.values.approval);
  assert.equal(result.parent.parent.run, f.values.run);
  assert.equal(result.parent.parent.step, f.values.step);
  assert.equal(result.authorizationState, state);
  assert.equal(result.authorizationState.policies, state.policies);
  assert.equal(
    result.permission,
    state.permissionSnapshot.permissionSet.permissions[0],
  );
  assert.equal(
    JSON.stringify([f.values.approval, f.values.run, f.values.step, current, state]),
    before,
  );
});

test("AIAPP-RBACREAD-BOUND-001 result exposes no full authorization approval guard transition dispatch routing or execution authority", async () => {
  const result = await load(fixture());
  assert.ok(result);
  assert.equal(result.permission.effect, "ALLOW");
  assert.equal(result.parent.parent.approval.requiredPermission, PERMISSION);

  for (const forbidden of [
    "authorizationDecision",
    "accessDecision",
    "decision",
    "abacSatisfied",
    "commercialAllowed",
    "entitlementAllowed",
    "resourceAllowed",
    "approvalSatisfied",
    "approvalAuthorized",
    "guardResult",
    "resumeAuthorized",
    "cancelAuthorized",
    "dispatchAuthorized",
    "mutation",
    "eventEmitted",
    "providerAuthorized",
    "modelAuthorized",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
