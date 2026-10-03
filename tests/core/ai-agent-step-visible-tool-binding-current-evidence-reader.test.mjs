import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIAgentStepToolBindingCurrentEvidence,
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
  budget: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  foreignToolSet: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  wrongRun: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  wrongMember: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  wrongToolDefinition: "12121212-1212-4121-8121-121212121212",
  correlation: "13131313-1313-4131-8131-131313131313",
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
    approvalId: undefined,
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
    status: "RUNNING",
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

function fixture(overrides = {}) {
  const order = [];
  const calls = {step: [], run: [], definition: [], toolSet: [], member: [], toolDefinition: []};
  const values = {
    step: Object.hasOwn(overrides, "step") ? overrides.step : step(),
    run: Object.hasOwn(overrides, "run") ? overrides.run : run(),
    definition: Object.hasOwn(overrides, "definition") ? overrides.definition : definition(),
    toolSet: Object.hasOwn(overrides, "toolSet") ? overrides.toolSet : toolSet(),
    member: Object.hasOwn(overrides, "member") ? overrides.member : member(),
    toolDefinition: Object.hasOwn(overrides, "toolDefinition")
      ? overrides.toolDefinition
      : toolDefinition(),
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
  };
}

async function load(f) {
  return loadAIAgentStepToolBindingCurrentEvidence(
    {requestContext, agentStepId: ids.step},
    f.stepReader,
    f.runReader,
    f.definitionReader,
    f.toolSetReader,
    f.memberReader,
    f.toolDefinitionReader,
  );
}

test("AISTEP-EVID-BASE-001 exact AgentStep read occurs first with exact context/id", async () => {
  const f = fixture();
  assert.ok(await load(f));
  assert.equal(f.order[0], "step");
  assert.equal(f.calls.step.length, 1);
  assert.equal(f.calls.step[0].requestContext, requestContext);
  assert.equal(f.calls.step[0].agentStepId, ids.step);
});

test("AISTEP-EVID-BASE-002 step null/error short-circuits parent/member/catalog access", async () => {
  const absent = fixture({step: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.run, []);
  assert.deepEqual(absent.calls.member, []);
  assert.deepEqual(absent.calls.toolDefinition, []);

  const expected = new Error("agent-step-reader-failed");
  const broken = fixture({stepError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.run, []);
  assert.deepEqual(broken.calls.member, []);
});

test("AISTEP-EVID-PARENT-001 visible step forwards same context and exact runId through DD-397 once", async () => {
  const f = fixture();
  assert.ok(await load(f));
  assert.deepEqual(f.order.slice(0, 4), ["step", "run", "definition", "toolSet"]);
  assert.equal(f.calls.run.length, 1);
  assert.equal(f.calls.run[0].requestContext, requestContext);
  assert.equal(f.calls.run[0].agentRunId, ids.run);
  assert.equal(f.calls.definition.length, 1);
  assert.equal(f.calls.toolSet.length, 1);
});

test("AISTEP-EVID-BRANCH-001 non-TOOL skips tool evidence; TOOL follows exact persisted binding", async () => {
  const nonTool = fixture({
    step: step({stepType: "PLAN", toolBindingId: undefined}),
  });
  const nonToolResult = await load(nonTool);
  assert.ok(nonToolResult);
  assert.deepEqual(nonTool.calls.member, []);
  assert.deepEqual(nonTool.calls.toolDefinition, []);
  assert.equal("member" in nonToolResult, false);
  assert.equal("toolDefinition" in nonToolResult, false);

  const tool = fixture();
  assert.ok(await load(tool));
  assert.equal(tool.calls.member.length, 1);
  assert.equal(tool.calls.member[0].requestContext, requestContext);
  assert.equal(tool.calls.member[0].toolSetMemberId, ids.member);
  assert.deepEqual(tool.calls.toolDefinition, [ids.toolDefinition]);
});

test("AISTEP-EVID-ERROR-001 TOOL member/catalog absence returns null and dependency errors propagate", async () => {
  assert.equal(await load(fixture({member: null})), null);
  assert.equal(await load(fixture({toolDefinition: null})), null);

  const memberError = new Error("tool-set-member-reader-failed");
  await assert.rejects(
    load(fixture({memberError})),
    error => error === memberError,
  );

  const catalogError = new Error("tool-definition-reader-failed");
  await assert.rejects(
    load(fixture({toolDefinitionError: catalogError})),
    error => error === catalogError,
  );
});

test("AISTEP-EVID-FLOOR-001 DD-182 fails closed for invalid TOOL/non-TOOL binding evidence", async () => {
  for (const f of [
    fixture({step: step({runId: ids.wrongRun})}),
    fixture({member: member({id: ids.wrongMember})}),
    fixture({member: member({enabled: false})}),
    fixture({member: member({toolSetId: ids.foreignToolSet})}),
    fixture({toolDefinition: toolDefinition({id: ids.wrongToolDefinition})}),
    fixture({toolDefinition: toolDefinition({status: "RETIRED"})}),
    fixture({step: step({stepType: "PLAN"})}),
    fixture({step: step({stepType: "UNKNOWN", toolBindingId: undefined})}),
  ]) {
    assert.equal(await load(f), null);
  }
});

test("AISTEP-EVID-EVID-001 success preserves exact layered identities in a frozen envelope", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(result.step, f.values.step);
  assert.equal(result.parent.runDefinition.run, f.values.run);
  assert.equal(result.parent.runDefinition.definition, f.values.definition);
  assert.equal(result.parent.toolSet, f.values.toolSet);
  assert.equal(result.member, f.values.member);
  assert.equal(result.toolDefinition, f.values.toolDefinition);
  assert.equal(Object.isFrozen(result.parent), true);
  assert.equal(Object.isFrozen(result), true);
});

test("AISTEP-EVID-BOUND-001 combined raw step/tool evidence remains uninterpreted", async () => {
  const f = fixture();
  const before = Object.fromEntries(
    Object.entries(f.values).map(([key, value]) => [key, JSON.stringify(value)]),
  );
  const result = await load(f);
  assert.ok(result);

  for (const [key, value] of Object.entries(f.values)) {
    assert.equal(JSON.stringify(value), before[key]);
  }
  assert.equal(result.step.status, "RUNNING");
  assert.equal(result.step.inputRef, "raw-input-ref");
  assert.deepEqual(result.member.constraint, {raw: "constraint"});
  assert.equal(result.toolDefinition.requiredPermission, "permission.raw");
  assert.equal(result.toolDefinition.requiredEntitlement, "entitlement.raw");
  assert.equal(result.toolDefinition.scopeClass, "TENANT_INDUSTRY");
  assert.equal(result.toolDefinition.sideEffectClass, "CONTROLLED");
  assert.equal(result.toolDefinition.idempotencyRequired, true);
  assert.equal(result.toolDefinition.auditClass, "RAW_AUDIT");
  assert.equal(result.toolDefinition.operationContractId, "operation.raw");

  for (const forbidden of [
    "constraintSatisfied",
    "permissionAuthorized",
    "entitlementAuthorized",
    "approvalSatisfied",
    "schemaValidated",
    "sideEffectAuthorized",
    "idempotencyClaimed",
    "nextStep",
    "retryable",
    "resumable",
    "operationAuthorized",
    "providerAuthorized",
    "modelAuthorized",
    "mutation",
    "eventEmitted",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
