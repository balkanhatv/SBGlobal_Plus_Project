import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIAgentApprovalParentCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  foreignTenant: "12121212-1212-4212-8212-121212121212",
  industry: "22222222-2222-4222-8222-222222222222",
  siblingIndustry: "23232323-2323-4232-8232-232323232323",
  approval: "33333333-3333-4333-8333-333333333333",
  run: "44444444-4444-4444-8444-444444444444",
  otherRun: "45454545-4545-4454-8454-454545454545",
  step: "55555555-5555-4555-8555-555555555555",
  otherStep: "56565656-5656-4565-8565-565656565656",
  definition: "66666666-6666-4666-8666-666666666666",
  principal: "77777777-7777-4777-8777-777777777777",
  membership: "88888888-8888-4888-8888-888888888888",
  otherApproval: "99999999-9999-4999-8999-999999999999",
  correlation: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "request-1",
    correlationId: "request-correlation",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "home-1",
    regionCode: "IN-CENTRAL",
    principalId: ids.principal,
    principalType: "HUMAN",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
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
    requiredPermission: "raw.permission",
    approverPrincipalId: undefined,
    status: "PENDING",
    requestSummarySafe: "safe summary",
    approvedAt: undefined,
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
    actingPrincipalId: ids.principal,
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

async function load(f, requestContext = context()) {
  return loadAIAgentApprovalParentCurrentEvidence(
    {
      requestContext,
      agentApprovalId: ids.approval,
    },
    f.approvalReader,
    f.runReader,
    f.stepReader,
  );
}

test("AIAPP-PARENTREAD-BASE-001 exact approval id and identical RequestContext reach approval reader first", async () => {
  const f = fixture();
  const ctx = context();
  assert.ok(await load(f, ctx));
  assert.deepEqual(f.order, ["approval", "run", "step"]);
  assert.equal(f.approvalCalls.length, 1);
  assert.equal(f.approvalCalls[0].requestContext, ctx);
  assert.equal(f.approvalCalls[0].agentApprovalId, ids.approval);
});

test("AIAPP-PARENTREAD-BASE-002 approval null/error short-circuits both parent readers", async () => {
  const hidden = fixture({approval: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.runCalls, []);
  assert.deepEqual(hidden.stepCalls, []);

  const expected = new Error("approval-read-failed");
  const broken = fixture({approvalError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.runCalls, []);
  assert.deepEqual(broken.stepCalls, []);
});

test("AIAPP-PARENTREAD-PARENT-001 success follows persisted runId then stepId once in same context", async () => {
  const coreContext = context({industryContextId: undefined, scopeClass: "TENANT_CORE"});
  for (const [ctx, industryContextId] of [
    [context(), ids.industry],
    [coreContext, undefined],
  ]) {
    const f = fixture({
      approval: approval({industryContextId}),
      run: run({industryContextId}),
      step: step(),
    });
    assert.ok(await load(f, ctx));
    assert.deepEqual(f.order, ["approval", "run", "step"]);
    assert.equal(f.runCalls.length, 1);
    assert.equal(f.stepCalls.length, 1);
    assert.equal(f.runCalls[0].requestContext, ctx);
    assert.equal(f.stepCalls[0].requestContext, ctx);
    assert.equal(f.runCalls[0].agentRunId, f.values.approval.runId);
    assert.equal(f.stepCalls[0].agentStepId, f.values.approval.stepId);
  }
});

test("AIAPP-PARENTREAD-PARENT-002 hidden/error parents fail without fallback or alternate reads", async () => {
  const missingRun = fixture({run: null});
  assert.equal(await load(missingRun), null);
  assert.deepEqual(missingRun.stepCalls, []);

  const runError = new Error("run-read-failed");
  const brokenRun = fixture({runError});
  await assert.rejects(load(brokenRun), error => error === runError);
  assert.deepEqual(brokenRun.stepCalls, []);

  const missingStep = fixture({step: null});
  assert.equal(await load(missingStep), null);
  assert.equal(missingStep.stepCalls.length, 1);

  const stepError = new Error("step-read-failed");
  const brokenStep = fixture({stepError});
  await assert.rejects(load(brokenStep), error => error === stepError);
  assert.equal(brokenStep.runCalls.length, 1);
  assert.equal(brokenStep.stepCalls.length, 1);
});

test("AIAPP-PARENTREAD-FLOOR-001 DD-184 rejects wrong ids ownership scope and malformed evidence", async () => {
  assert.ok(await load(fixture()));

  for (const f of [
    fixture({run: run({id: ids.otherRun})}),
    fixture({step: step({id: ids.otherStep})}),
    fixture({step: step({runId: ids.otherRun})}),
    fixture({run: run({tenantId: ids.foreignTenant})}),
    fixture({run: run({industryContextId: ids.siblingIndustry})}),
    fixture({approval: approval({industryContextId: undefined})}),
    fixture({run: run({industryContextId: undefined})}),
    fixture({approval: approval({id: "bad"})}),
    fixture({run: run({id: "bad"})}),
    fixture({step: step({id: "bad"})}),
  ]) {
    assert.equal(await load(f), null);
  }

  const coreContext = context({industryContextId: undefined, scopeClass: "TENANT_CORE"});
  assert.ok(await load(fixture({
    approval: approval({industryContextId: undefined}),
    run: run({industryContextId: undefined}),
  }), coreContext));
});

test("AIAPP-PARENTREAD-EVID-001 frozen envelope preserves exact references and inputs", async () => {
  const f = fixture();
  const before = JSON.stringify([f.values.approval, f.values.run, f.values.step]);
  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.approval, f.values.approval);
  assert.equal(result.run, f.values.run);
  assert.equal(result.step, f.values.step);
  assert.deepEqual(Object.keys(result).sort(), ["approval", "run", "step"]);
  assert.equal(JSON.stringify([f.values.approval, f.values.run, f.values.step]), before);
});

test("AIAPP-PARENTREAD-RAW-001 raw approval history and non-reciprocal backlink remain acceptable", async () => {
  for (const status of ["PENDING", "APPROVED", "REJECTED", "EXPIRED"]) {
    const f = fixture({
      approval: approval({
        status,
        approverPrincipalId: status === "APPROVED" ? ids.principal : undefined,
        approvedAt: status === "APPROVED" ? "2026-10-03T01:00:00.000Z" : undefined,
        requiredPermission: "",
        reason: "",
      }),
      run: run({status: "SUCCEEDED", completedAt: "2026-10-03T02:00:00.000Z"}),
      step: step({approvalId: status === "REJECTED" ? ids.otherApproval : undefined, status: "SUCCEEDED"}),
    });
    const result = await load(f);
    assert.ok(result);
    assert.equal(result.approval.status, status);
    assert.equal(result.step.approvalId, f.values.step.approvalId);
    assert.equal(result.run.status, "SUCCEEDED");
  }
});

test("AIAPP-PARENTREAD-BOUND-001 parent evidence grants no approval permission transition dispatch or execution authority", async () => {
  const result = await load(fixture());
  assert.ok(result);
  for (const forbidden of [
    "approverRequestContext",
    "approvalCurrent",
    "approvalSatisfied",
    "approvalAuthorized",
    "permissionGranted",
    "resumeAuthorized",
    "cancelAuthorized",
    "guardResult",
    "operationContract",
    "capability",
    "dispatchAuthorized",
    "mutation",
    "eventEmitted",
    "providerAuthorized",
    "modelAuthorized",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
  assert.deepEqual(Object.keys(result).sort(), ["approval", "run", "step"]);
});
