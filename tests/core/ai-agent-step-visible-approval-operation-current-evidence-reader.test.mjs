import test from "node:test";
import assert from "node:assert/strict";

import {
  OperationRegistry,
  loadAIAgentStepApprovalOperationCurrentEvidence,
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
  correlation: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
});

const operationId = "operation.raw";

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
    operationContractId: operationId,
    scopeClass: "TENANT_INDUSTRY",
    requiredPermission: "tool.permission",
    requiredEntitlement: "tool.entitlement",
    inputSchemaVersion: 3,
    outputSchemaVersion: 4,
    sideEffectClass: "CONTROLLED",
    approvalPolicyId: ids.approval,
    idempotencyRequired: true,
    auditClass: "TOOL_AUDIT",
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
    requiredPermission: "approval.permission",
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

function operation(overrides = {}) {
  return Object.freeze({
    operationId,
    module: "RawModule",
    scopeClass: "PLATFORM_GLOBAL",
    kind: "QUERY",
    permissionCode: "operation.permission",
    entitlementRequirement: "operation.entitlement",
    inputSchemaVersion: 91,
    outputSchemaVersion: 92,
    resourceResolver: "RawResolver",
    idempotencyPolicy: "NONE",
    rateClass: "OPERATION_RATE",
    auditClass: "OPERATION_AUDIT",
    domainService: "RawService.execute",
    emittedEvents: Object.freeze(["raw.event"]),
    errorCodes: Object.freeze(["RAW_ERROR"]),
    ...overrides,
  });
}

function makeRegistry(contract = operation()) {
  const registry = new OperationRegistry();
  if (contract !== null) registry.register(contract);
  const registered = contract === null ? undefined : registry.get(contract.operationId);
  const calls = [];
  const originalGet = registry.get.bind(registry);
  registry.get = id => {
    calls.push(id);
    return originalGet(id);
  };
  return {registry, calls, registered};
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

async function load(f, registry, context = requestContext) {
  return loadAIAgentStepApprovalOperationCurrentEvidence(
    {requestContext: context, agentStepId: ids.step},
    f.stepReader,
    f.runReader,
    f.definitionReader,
    f.toolSetReader,
    f.memberReader,
    f.toolDefinitionReader,
    f.approvalReader,
    registry,
  );
}

test("AISTEP-OPREAD-BASE-001 DD-407 parent evidence is established before registry access", async () => {
  const f = fixture();
  const r = makeRegistry();
  const originalGet = r.registry.get.bind(r.registry);
  r.registry.get = id => {
    f.order.push("operation");
    return originalGet(id);
  };

  const result = await load(f, r.registry);
  assert.ok(result);
  assert.deepEqual(f.order, [
    "step", "run", "definition", "toolSet", "member", "toolDefinition",
    "approval", "operation",
  ]);
  assert.equal(f.calls.step[0].requestContext, requestContext);
  assert.equal(f.calls.step[0].agentStepId, ids.step);
});

test("AISTEP-OPREAD-BASE-002 DD-407 null/error short-circuits registry access", async () => {
  const absent = fixture({step: null});
  const absentRegistry = makeRegistry();
  assert.equal(await load(absent, absentRegistry.registry), null);
  assert.deepEqual(absentRegistry.calls, []);

  const expected = new Error("agent-step-reader-failed");
  const broken = fixture({stepError: expected});
  const brokenRegistry = makeRegistry();
  await assert.rejects(load(broken, brokenRegistry.registry), error => error === expected);
  assert.deepEqual(brokenRegistry.calls, []);
});

test("AISTEP-OPREAD-BRANCH-001 non-TOOL step performs zero registry reads", async () => {
  const f = fixture({
    step: step({stepType: "PLAN", toolBindingId: undefined}),
  });
  const r = makeRegistry();
  const result = await load(f, r.registry);
  assert.ok(result);
  assert.deepEqual(r.calls, []);
  assert.equal("operationContract" in result, false);
  assert.deepEqual(f.calls.member, []);
  assert.deepEqual(f.calls.toolDefinition, []);
});

test("AISTEP-OPREAD-OP-001 TOOL step resolves exactly the persisted operationContractId once", async () => {
  const f = fixture();
  const r = makeRegistry();
  const result = await load(f, r.registry);
  assert.ok(result);
  assert.deepEqual(r.calls, [operationId]);
  assert.equal(result.operationContract, r.registered);
});

test("AISTEP-OPREAD-OP-002 unknown registry id propagates unchanged with no fallback", async () => {
  const f = fixture({
    toolDefinition: toolDefinition({operationContractId: "operation.missing"}),
  });
  const r = makeRegistry();
  await assert.rejects(
    load(f, r.registry),
    error => error instanceof Error
      && error.message === "Unknown OperationContract: operation.missing",
  );
  assert.deepEqual(r.calls, ["operation.missing"]);
});

test("AISTEP-OPREAD-EVID-001 success preserves exact layered identities in a frozen envelope", async () => {
  const f = fixture();
  const r = makeRegistry();
  const result = await load(f, r.registry);
  assert.ok(result);
  assert.equal(result.parent.parent.step, f.values.step);
  assert.equal(result.parent.parent.parent.runDefinition.run, f.values.run);
  assert.equal(result.parent.parent.parent.runDefinition.definition, f.values.definition);
  assert.equal(result.parent.parent.parent.toolSet, f.values.toolSet);
  assert.equal(result.parent.parent.member, f.values.member);
  assert.equal(result.parent.parent.toolDefinition, f.values.toolDefinition);
  assert.equal(result.parent.approval, f.values.approval);
  assert.equal(result.operationContract, r.registered);
  assert.equal(Object.isFrozen(result.parent), true);
  assert.equal(Object.isFrozen(result), true);
});

test("AISTEP-OPREAD-RAW-001 tool and operation execution metadata remain uninterpreted", async () => {
  const f = fixture();
  const beforeTool = JSON.stringify(f.values.toolDefinition);
  const beforeApproval = JSON.stringify(f.values.approval);
  const r = makeRegistry(operation({
    scopeClass: "PLATFORM_GLOBAL",
    permissionCode: "different.permission",
    entitlementRequirement: "different.entitlement",
    inputSchemaVersion: 101,
    outputSchemaVersion: 102,
    idempotencyPolicy: "NONE",
    rateClass: "DIFFERENT_RATE",
    auditClass: "DIFFERENT_AUDIT",
    domainService: "DifferentService.execute",
  }));

  const result = await load(f, r.registry);
  assert.ok(result);
  assert.equal(result.parent.parent.toolDefinition.scopeClass, "TENANT_INDUSTRY");
  assert.equal(result.operationContract.scopeClass, "PLATFORM_GLOBAL");
  assert.equal(result.parent.parent.toolDefinition.requiredPermission, "tool.permission");
  assert.equal(result.operationContract.permissionCode, "different.permission");
  assert.equal(result.parent.approval.status, "APPROVED");
  assert.equal(JSON.stringify(f.values.toolDefinition), beforeTool);
  assert.equal(JSON.stringify(f.values.approval), beforeApproval);
});

test("AISTEP-OPREAD-BOUND-001 registry evidence grants no admission, dispatch or execution authority", async () => {
  const f = fixture();
  const r = makeRegistry();
  const result = await load(f, r.registry);
  assert.ok(result);

  for (const forbidden of [
    "toolOperationCompatible",
    "scopeCompatible",
    "permissionGranted",
    "entitlementGranted",
    "approvalSatisfied",
    "approvalCurrent",
    "approverAuthorized",
    "resourceResolved",
    "guardResult",
    "idempotencyClaimed",
    "rateAdmitted",
    "commercialAdmitted",
    "resumable",
    "dispatchAuthorized",
    "domainDispatched",
    "providerAuthorized",
    "modelAuthorized",
    "mutation",
    "eventEmitted",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
