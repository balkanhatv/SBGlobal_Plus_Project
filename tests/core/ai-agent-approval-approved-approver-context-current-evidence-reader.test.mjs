import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIAgentApprovalApprovedApproverContextCurrentEvidence,
} from "../../dist/core/index.js";

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
  correlation: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
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
    membershipId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
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
    requiredPermission: "raw.approval.permission",
    approverPrincipalId: ids.approver,
    status: "APPROVED",
    requestSummarySafe: "safe summary",
    approvedAt: "2026-10-03T01:00:00.000Z",
    reason: "raw reason",
    correlationId: ids.correlation,
    createdAt: "2026-10-03T00:00:00.000Z",
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
    startedAt: "2026-10-03T00:00:00.000Z",
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
    startedAt: "2026-10-03T00:00:30.000Z",
    completedAt: undefined,
    auditRef: "raw-audit",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const approvalCalls = [];
  const runCalls = [];
  const stepCalls = [];
  const values = {
    approval: Object.hasOwn(overrides, "approval") ? overrides.approval : approval(),
    run: Object.hasOwn(overrides, "run") ? overrides.run : run(),
    step: Object.hasOwn(overrides, "step") ? overrides.step : step(),
  };

  return {
    order,
    approvalCalls,
    runCalls,
    stepCalls,
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
  };
}

async function load(f, inputOverrides = {}) {
  return loadAIAgentApprovalApprovedApproverContextCurrentEvidence(
    {
      requestContext: actingContext(),
      agentApprovalId: ids.approval,
      approverRequestContext: approverContext(),
      ...inputOverrides,
    },
    f.approvalReader,
    f.runReader,
    f.stepReader,
  );
}

test("AIAPP-APPCTXREAD-BASE-001 exact acting RequestContext and approval id enter DD-427 first", async () => {
  const f = fixture();
  const ctx = actingContext();
  const result = await load(f, {requestContext: ctx});
  assert.ok(result);
  assert.deepEqual(f.order, ["approval", "run", "step"]);
  assert.equal(f.approvalCalls[0].requestContext, ctx);
  assert.equal(f.approvalCalls[0].agentApprovalId, ids.approval);
  assert.equal(f.runCalls[0].requestContext, ctx);
  assert.equal(f.stepCalls[0].requestContext, ctx);
});

test("AIAPP-APPCTXREAD-BASE-002 DD-427 null or error short-circuits approver-context evaluation", async () => {
  const hidden = fixture({approval: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.runCalls, []);
  assert.deepEqual(hidden.stepCalls, []);

  const expected = new Error("parent-failed");
  const broken = fixture({runError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["approval", "run"]);
});

test("AIAPP-APPCTXREAD-CTX-001 exact APPROVED Tenant-Core approval and trusted Tenant-Core approver context passes", async () => {
  const f = fixture({
    approval: approval({industryContextId: undefined}),
    run: run({industryContextId: undefined}),
  });
  const current = approverContext({
    scopeClass: "TENANT_CORE",
    industryContextId: undefined,
  });
  const result = await load(f, {approverRequestContext: current});
  assert.ok(result);
  assert.equal(result.approverRequestContext, current);
});

test("AIAPP-APPCTXREAD-CTX-002 Tenant-Core approval may pass same-principal same-Tenant Tenant-Industry trusted context", async () => {
  const f = fixture({
    approval: approval({industryContextId: undefined}),
    run: run({industryContextId: undefined}),
  });
  const current = approverContext();
  const result = await load(f, {approverRequestContext: current});
  assert.ok(result);
  assert.equal(result.approverRequestContext, current);
});

test("AIAPP-APPCTXREAD-CTX-003 Industry approval requires exact Tenant-Industry scope and exact Industry Context", async () => {
  assert.ok(await load(fixture()));

  for (const current of [
    approverContext({scopeClass: "TENANT_CORE", industryContextId: undefined}),
    approverContext({industryContextId: ids.siblingIndustry}),
    approverContext({industryContextId: undefined}),
  ]) {
    assert.equal(await load(fixture(), {approverRequestContext: current}), null);
  }
});

test("AIAPP-APPCTXREAD-CTX-004 missing malformed non-approved or foreign trusted context fails closed", async () => {
  assert.equal(await load(fixture(), {approverRequestContext: undefined}), null);

  for (const f of [
    fixture({approval: approval({status: "PENDING", approverPrincipalId: undefined, approvedAt: undefined})}),
    fixture({approval: approval({status: "REJECTED"})}),
    fixture({approval: approval({approvedAt: "not-a-time"})}),
  ]) {
    assert.equal(await load(f), null);
  }

  for (const current of [
    approverContext({principalId: ids.actor}),
    approverContext({tenantId: ids.foreignTenant}),
    approverContext({industryContextId: ids.siblingIndustry}),
    approverContext({scopeClass: "PUBLIC", tenantId: undefined, industryContextId: undefined}),
    approverContext({scopeClass: "PLATFORM_GLOBAL", tenantId: undefined, industryContextId: undefined}),
    approverContext({scopeClass: "EXPLICIT_CROSS_CONTEXT"}),
    approverContext({principalId: "bad"}),
  ]) {
    assert.equal(await load(fixture(), {approverRequestContext: current}), null);
  }
});

test("AIAPP-APPCTXREAD-EVID-001 success preserves exact DD-427 parent and trusted context references", async () => {
  const f = fixture({step: step({approvalId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc"})});
  const current = approverContext();
  const before = JSON.stringify([f.values.approval, f.values.run, f.values.step, current]);
  const result = await load(f, {approverRequestContext: current});
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.approverRequestContext, current);
  assert.equal(result.parent.approval, f.values.approval);
  assert.equal(result.parent.run, f.values.run);
  assert.equal(result.parent.step, f.values.step);
  assert.equal(JSON.stringify([f.values.approval, f.values.run, f.values.step, current]), before);
});

test("AIAPP-APPCTXREAD-BOUND-001 result grants no permission approval guard transition dispatch or execution authority", async () => {
  const result = await load(fixture());
  assert.ok(result);
  assert.equal(result.parent.approval.requiredPermission, "raw.approval.permission");
  assert.equal(result.parent.step.approvalId, undefined);

  for (const forbidden of [
    "requiredPermissionGranted",
    "permissionGranted",
    "approvalSatisfied",
    "approvalAuthorized",
    "approvalCurrent",
    "guardResult",
    "commercialAllowed",
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
