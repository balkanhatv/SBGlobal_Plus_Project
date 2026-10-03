import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIAgentStepApprovalCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  step: "33333333-3333-4333-8333-333333333333",
  run: "44444444-4444-4444-8444-444444444444",
  definition: "55555555-5555-4555-8555-555555555555",
  toolSet: "66666666-6666-4666-8666-666666666666",
  member: "77777777-7777-4777-8777-777777777777",
  toolDefinition: "88888888-8888-4888-8888-888888888888",
  principal: "99999999-9999-4999-8999-999999999999",
  membership: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  approval: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  otherApproval: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  otherRun: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  otherStep: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  foreignTenant: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  siblingIndustry: "12121212-1212-4121-8121-121212121212",
  budget: "13131313-1313-4131-8131-131313131313",
  correlation: "14141414-1414-4141-8141-141414141414",
});

const requestContext = Object.freeze({
  requestId: "request-1",
  correlationId: "correlation-1",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  dataHomeId: "home-1",
  regionCode: "IN-CENTRAL",
  principalId: ids.principal,
  principalType: "HUMAN",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  scopeClass: "TENANT_INDUSTRY",
});

function step(overrides = {}) {
  return Object.freeze({
    id: ids.step,
    runId: ids.run,
    ordinal: 3,
    stepType: "TOOL",
    inputRef: "raw-input-ref",
    outputRef: "raw-output-ref",
    toolBindingId: ids.member,
    approvalId: ids.approval,
    status: "RUNNING",
    startedAt: "2026-10-02T00:00:00.000Z",
    completedAt: undefined,
    auditRef: "raw-audit-ref",
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
    entitlementSnapshotVersion: "snapshot-7",
    permissionVersion: "permission-9",
    requestedResourceScope: Object.freeze({resources: Object.freeze(["raw-resource"])}),
    status: "WAITING_APPROVAL",
    stepBudgetClass: "RAW_STEP_BUDGET",
    tokenBudgetClass: "RAW_TOKEN_BUDGET",
    startedAt: "2026-10-02T00:00:00.000Z",
    correlationId: ids.correlation,
    ...overrides,
  });
}

function definition(overrides = {}) {
  return Object.freeze({
    id: ids.definition,
    ownerScope: "INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    code: "agent.raw",
    objectiveClass: "RAW_OBJECTIVE",
    allowedToolSetId: ids.toolSet,
    maxRiskClass: "RAW_RISK",
    approvalPolicyId: ids.approval,
    budgetPolicyId: ids.budget,
    version: 7,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  });
}

function toolSet(overrides = {}) {
  return Object.freeze({
    id: ids.toolSet,
    ownerScope: "TENANT",
    tenantId: ids.tenant,
    industryContextId: undefined,
    code: "toolset.raw",
    version: 5,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  });
}

function member(overrides = {}) {
  return Object.freeze({
    id: ids.member,
    toolSetId: ids.toolSet,
    toolDefinitionId: ids.toolDefinition,
    enabled: true,
    constraint: Object.freeze({raw: "constraint"}),
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  });
}

function toolDefinition(overrides = {}) {
  return Object.freeze({
    id: ids.toolDefinition,
    toolId: "tool.raw",
    capabilityCode: "capability.raw",
    operationContractId: "operation.raw",
    scopeClass: "TENANT_INDUSTRY",
    requiredPermission: "permission.raw",
    requiredEntitlement: "entitlement.raw",
    inputSchemaVersion: 3,
    outputSchemaVersion: 4,
    sideEffectClass: "CONTROLLED",
    approvalPolicyId: ids.approval,
    idempotencyRequired: true,
    auditClass: "RAW_AUDIT",
    status: "ACTIVE",
    version: 9,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
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
    approvalType: "HIGH_RISK_TOOL",
    requiredPermission: "permission.raw",
    approverPrincipalId: ids.principal,
    status: "APPROVED",
    requestSummarySafe: "safe summary",
    approvedAt: "2026-10-02T00:01:00.000Z",
    reason: "raw reason",
    correlationId: ids.correlation,
    createdAt: "2026-10-02T00:00:30.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {
    step: [], run: [], definition: [], toolSet: [], member: [],
    toolDefinition: [], approval: [],
  };
  const values = {
    step: Object.hasOwn(overrides, "step") ? overrides.step : step(),
    run: Object.hasOwn(overrides, "run") ? overrides.run : run(),
    definition: Object.hasOwn(overrides, "definition") ? overrides.definition : definition(),
    toolSet: Object.hasOwn(overrides, "toolSet") ? overrides.toolSet : toolSet(),
    member: Object.hasOwn(overrides, "member") ? overrides.member : member(),
    toolDefinition: Object.hasOwn(overrides, "toolDefinition")
      ? overrides.toolDefinition
      : toolDefinition(),
    approval: Object.hasOwn(overrides, "approval") ? overrides.approval : approval(),
  };

  return {
    order,
    calls,
    values,
    stepReader: {
      async loadForContext(input) {
        order.push("step");
        calls.step.push(input);
        if (overrides.stepError) throw overrides.stepError;
        return values.step;
      },
    },
    runReader: {
      async loadForContext(input) {
        order.push("run");
        calls.run.push(input);
        if (overrides.runError) throw overrides.runError;
        return values.run;
      },
    },
    definitionReader: {
      async loadForContext(input) {
        order.push("definition");
        calls.definition.push(input);
        if (overrides.definitionError) throw overrides.definitionError;
        return values.definition;
      },
    },
    toolSetReader: {
      async loadForContext(input) {
        order.push("toolSet");
        calls.toolSet.push(input);
        if (overrides.toolSetError) throw overrides.toolSetError;
        return values.toolSet;
      },
    },
    memberReader: {
      async loadForContext(input) {
        order.push("member");
        calls.member.push(input);
        if (overrides.memberError) throw overrides.memberError;
        return values.member;
      },
    },
    toolDefinitionReader: {
      async loadById(id) {
        order.push("toolDefinition");
        calls.toolDefinition.push(id);
        if (overrides.toolDefinitionError) throw overrides.toolDefinitionError;
        return values.toolDefinition;
      },
    },
    approvalReader: {
      async loadForContext(input) {
        order.push("approval");
        calls.approval.push(input);
        if (overrides.approvalError) throw overrides.approvalError;
        return values.approval;
      },
    },
  };
}

async function load(f) {
  return loadAIAgentStepApprovalCurrentEvidence(
    {requestContext, agentStepId: ids.step},
    f.stepReader,
    f.runReader,
    f.definitionReader,
    f.toolSetReader,
    f.memberReader,
    f.toolDefinitionReader,
    f.approvalReader,
  );
}

test("AISTEP-APPREAD-BASE-001 DD-402 parent evidence occurs before AgentApproval access", async () => {
  const f = fixture();
  assert.ok(await load(f));
  assert.deepEqual(f.order.slice(0, 6), [
    "step", "run", "definition", "toolSet", "member", "toolDefinition",
  ]);
  assert.equal(f.order.at(-1), "approval");
  assert.equal(f.calls.step[0].requestContext, requestContext);
  assert.equal(f.calls.step[0].agentStepId, ids.step);
});

test("AISTEP-APPREAD-BASE-002 DD-402 null/error short-circuits AgentApproval access", async () => {
  const absent = fixture({step: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.approval, []);

  const expected = new Error("agent-step-reader-failed");
  const broken = fixture({stepError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.approval, []);
});

test("AISTEP-APPREAD-APP-001 optional approval uses zero reads when absent and exact same-context id once when present", async () => {
  const unbound = fixture({step: step({approvalId: undefined})});
  const unboundResult = await load(unbound);
  assert.ok(unboundResult);
  assert.deepEqual(unbound.calls.approval, []);
  assert.equal("approval" in unboundResult, false);

  const bound = fixture();
  assert.ok(await load(bound));
  assert.equal(bound.calls.approval.length, 1);
  assert.equal(bound.calls.approval[0].requestContext, requestContext);
  assert.equal(bound.calls.approval[0].agentApprovalId, ids.approval);
});

test("AISTEP-APPREAD-APP-002 missing approval returns null and reader errors propagate unchanged", async () => {
  assert.equal(await load(fixture({approval: null})), null);

  const expected = new Error("agent-approval-reader-failed");
  await assert.rejects(
    load(fixture({approvalError: expected})),
    error => error === expected,
  );
});

test("AISTEP-APPREAD-FLOOR-001 DD-183/DD-184 backlink and parent scope fail closed", async () => {
  assert.ok(await load(fixture()));

  for (const approvalValue of [
    approval({id: ids.otherApproval}),
    approval({runId: ids.otherRun}),
    approval({stepId: ids.otherStep}),
    approval({tenantId: ids.foreignTenant}),
    approval({industryContextId: ids.siblingIndustry}),
    approval({id: "not-a-uuid"}),
  ]) {
    assert.equal(await load(fixture({approval: approvalValue})), null);
  }

  assert.equal(
    await load(fixture({
      run: run({industryContextId: undefined}),
      approval: approval({industryContextId: ids.industry}),
    })),
    null,
  );
});

test("AISTEP-APPREAD-RAW-001 persisted approval status and permission evidence remain raw", async () => {
  for (const status of ["PENDING", "APPROVED", "REJECTED", "EXPIRED"]) {
    const f = fixture({
      approval: approval({
        status,
        requiredPermission: "permission.raw",
        approvalType: "RAW_TYPE",
        reason: "raw reason",
      }),
    });
    const result = await load(f);
    assert.ok(result);
    assert.equal(result.approval.status, status);
    assert.equal(result.approval.requiredPermission, "permission.raw");
    assert.equal(result.approval.approvalType, "RAW_TYPE");
    assert.equal(result.approval.reason, "raw reason");
  }
});

test("AISTEP-APPREAD-EVID-001 success preserves exact layered identities in a frozen envelope", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(result.parent.step, f.values.step);
  assert.equal(result.parent.parent.runDefinition.run, f.values.run);
  assert.equal(result.parent.parent.runDefinition.definition, f.values.definition);
  assert.equal(result.parent.parent.toolSet, f.values.toolSet);
  assert.equal(result.parent.member, f.values.member);
  assert.equal(result.parent.toolDefinition, f.values.toolDefinition);
  assert.equal(result.approval, f.values.approval);
  assert.equal(Object.isFrozen(result.parent), true);
  assert.equal(Object.isFrozen(result), true);
});

test("AISTEP-APPREAD-BOUND-001 approval evidence adds no satisfaction/resume/tool execution authority", async () => {
  const f = fixture();
  const before = Object.fromEntries(
    Object.entries(f.values).map(([key, value]) => [key, JSON.stringify(value)]),
  );
  const result = await load(f);
  assert.ok(result);

  for (const [key, value] of Object.entries(f.values)) {
    assert.equal(JSON.stringify(value), before[key]);
  }

  assert.equal(result.approval.status, "APPROVED");
  assert.equal(result.approval.approverPrincipalId, ids.principal);
  assert.equal(result.approval.requiredPermission, "permission.raw");

  for (const forbidden of [
    "approvalSatisfied",
    "approvalCurrent",
    "approverAuthorized",
    "permissionAuthorized",
    "resumable",
    "runAuthorized",
    "toolAuthorized",
    "operationAuthorized",
    "dispatchAuthorized",
    "providerAuthorized",
    "modelAuthorized",
    "mutation",
    "eventEmitted",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
