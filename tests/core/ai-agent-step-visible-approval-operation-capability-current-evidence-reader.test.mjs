import test from "node:test";
import assert from "node:assert/strict";

import {
  OperationRegistry,
  loadAIAgentStepApprovalOperationCapabilityCurrentEvidence,
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
  capability: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
});

const operationId = "operation.raw";
const capabilityCode = "capability.raw";

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
    startedAt: "2026-10-03T00:00:00.000Z",
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
    startedAt: "2026-10-03T00:00:00.000Z",
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
    updatedAt: "2026-10-03T00:00:00.000Z",
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
    updatedAt: "2026-10-03T00:00:00.000Z",
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
    capabilityCode,
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
    updatedAt: "2026-10-03T00:00:00.000Z",
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
    approvedAt: "2026-10-03T00:01:00.000Z",
    reason: "raw reason",
    correlationId: ids.correlation,
    createdAt: "2026-10-03T00:00:30.000Z",
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

function capability(overrides = {}) {
  return Object.freeze({
    id: ids.capability,
    code: capabilityCode,
    category: "TOOL",
    requiredEntitlement: "capability.entitlement",
    defaultPolicyClass: "RAW_POLICY",
    schemaVersion: 13,
    status: "RETIRED",
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
    toolDefinition: [], approval: [], capability: [],
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
    capability: Object.hasOwn(overrides, "capability") ? overrides.capability : capability(),
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
    capabilityReader: {
      async loadByCode(code) {
        order.push("capability");
        calls.capability.push(code);
        if (overrides.capabilityError) throw overrides.capabilityError;
        return values.capability;
      },
    },
  };
}

async function load(f, registry, context = requestContext) {
  return loadAIAgentStepApprovalOperationCapabilityCurrentEvidence(
    {requestContext: context, agentStepId: ids.step},
    f.stepReader,
    f.runReader,
    f.definitionReader,
    f.toolSetReader,
    f.memberReader,
    f.toolDefinitionReader,
    f.approvalReader,
    registry,
    f.capabilityReader,
  );
}

test("AISTEP-CAPREAD-BASE-001 exact DD-412 parent evidence is established before capability access", async () => {
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
    "approval", "operation", "capability",
  ]);
  assert.equal(f.calls.step[0].requestContext, requestContext);
  assert.equal(f.calls.step[0].agentStepId, ids.step);
});

test("AISTEP-CAPREAD-BASE-002 DD-412 null/error short-circuits capability access", async () => {
  const absent = fixture({step: null});
  const absentRegistry = makeRegistry();
  assert.equal(await load(absent, absentRegistry.registry), null);
  assert.deepEqual(absent.calls.capability, []);

  const expected = new Error("operation-registry-failed");
  const broken = fixture();
  const brokenRegistry = makeRegistry();
  brokenRegistry.registry.get = () => {
    throw expected;
  };
  await assert.rejects(load(broken, brokenRegistry.registry), error => error === expected);
  assert.deepEqual(broken.calls.capability, []);
});

test("AISTEP-CAPREAD-BRANCH-001 non-TOOL step performs zero capability reads", async () => {
  const f = fixture({
    step: step({stepType: "PLAN", toolBindingId: undefined}),
  });
  const r = makeRegistry();
  const result = await load(f, r.registry);
  assert.ok(result);
  assert.deepEqual(f.calls.capability, []);
  assert.equal("capability" in result, false);
  assert.deepEqual(r.calls, []);
});

test("AISTEP-CAPREAD-CAP-001 TOOL step reads exactly the persisted capabilityCode once", async () => {
  const f = fixture();
  const r = makeRegistry();
  const result = await load(f, r.registry);
  assert.ok(result);
  assert.deepEqual(f.calls.capability, [capabilityCode]);
  assert.equal(result.capability, f.values.capability);
});

test("AISTEP-CAPREAD-CAP-002 missing capability or reader error has no fallback", async () => {
  const missing = fixture({capability: null});
  const missingRegistry = makeRegistry();
  assert.equal(await load(missing, missingRegistry.registry), null);
  assert.deepEqual(missing.calls.capability, [capabilityCode]);

  const expected = new Error("capability-reader-failed");
  const broken = fixture({capabilityError: expected});
  const brokenRegistry = makeRegistry();
  await assert.rejects(load(broken, brokenRegistry.registry), error => error === expected);
  assert.deepEqual(broken.calls.capability, [capabilityCode]);
});

test("AISTEP-CAPREAD-FLOOR-001 DD-203 exact capability continuity passes and mismatch fails closed", async () => {
  const valid = fixture();
  const validRegistry = makeRegistry();
  assert.ok(await load(valid, validRegistry.registry));

  const mismatch = fixture({capability: capability({code: "different.capability"})});
  const mismatchRegistry = makeRegistry();
  assert.equal(await load(mismatch, mismatchRegistry.registry), null);

  const malformed = fixture({capability: capability({id: "bad"})});
  const malformedRegistry = makeRegistry();
  assert.equal(await load(malformed, malformedRegistry.registry), null);
});

test("AISTEP-CAPREAD-EVID-001 success preserves exact layered identities in a frozen envelope", async () => {
  const f = fixture();
  const r = makeRegistry();
  const result = await load(f, r.registry);
  assert.ok(result);
  assert.equal(result.parent.parent.parent.step, f.values.step);
  assert.equal(result.parent.parent.parent.toolDefinition, f.values.toolDefinition);
  assert.equal(result.parent.parent.approval, f.values.approval);
  assert.equal(result.parent.operationContract, r.registered);
  assert.equal(result.capability, f.values.capability);
  assert.equal(Object.isFrozen(result.parent), true);
  assert.equal(Object.isFrozen(result), true);
});

test("AISTEP-CAPREAD-RAW-001 capability lifecycle policy and entitlement metadata remain uninterpreted", async () => {
  const rawCapability = capability({
    category: "NOT_A_REAL_CATEGORY",
    requiredEntitlement: null,
    defaultPolicyClass: "",
    schemaVersion: -999,
    status: "DISABLED",
  });
  const f = fixture({capability: rawCapability});
  const beforeTool = JSON.stringify(f.values.toolDefinition);
  const beforeCapability = JSON.stringify(rawCapability);
  const r = makeRegistry();

  const result = await load(f, r.registry);
  assert.ok(result);
  assert.equal(result.capability.status, "DISABLED");
  assert.equal(result.capability.category, "NOT_A_REAL_CATEGORY");
  assert.equal(result.capability.defaultPolicyClass, "");
  assert.equal(result.capability.schemaVersion, -999);
  assert.equal(JSON.stringify(f.values.toolDefinition), beforeTool);
  assert.equal(JSON.stringify(rawCapability), beforeCapability);
});

test("AISTEP-CAPREAD-BOUND-001 capability evidence grants no eligibility authorization routing or execution authority", async () => {
  const f = fixture();
  const r = makeRegistry();
  const result = await load(f, r.registry);
  assert.ok(result);

  for (const forbidden of [
    "capabilityCurrent",
    "capabilityActive",
    "capabilityEligible",
    "capabilityAllowed",
    "entitlementGranted",
    "policySatisfied",
    "toolOperationCapabilityCompatible",
    "permissionGranted",
    "approvalSatisfied",
    "approvalCurrent",
    "guardResult",
    "commercialAdmitted",
    "route",
    "providerAuthorized",
    "modelAuthorized",
    "dispatchAuthorized",
    "domainDispatched",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
