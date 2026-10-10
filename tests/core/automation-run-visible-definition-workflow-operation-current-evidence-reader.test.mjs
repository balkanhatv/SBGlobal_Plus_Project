import test from "node:test";
import assert from "node:assert/strict";

import {
  OperationRegistry,
  loadAutomationRunDefinitionWorkflowOperationCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  run: "33333333-3333-4333-8333-333333333333",
  automation: "44444444-4444-4444-8444-444444444444",
  workflow: "55555555-5555-4555-8555-555555555555",
  principal: "66666666-6666-4666-8666-666666666666",
});

const operationId = "core.raw.operation";

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

function run(overrides = {}) {
  return Object.freeze({
    id: ids.run,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    automationDefinitionId: ids.automation,
    triggerRef: "event:raw",
    idempotencyKeyHash: "hash-raw",
    status: "RUNNING",
    startedAt: "2026-10-02T00:00:00.000Z",
    correlationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    lastErrorCode: "RAW_ERROR",
    ...overrides,
  });
}

function automation(overrides = {}) {
  return Object.freeze({
    id: ids.automation,
    ownerScope: "INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    code: "automation.raw",
    version: 7,
    status: "ACTIVE",
    schemaVersion: 3,
    triggerType: "EVENT",
    triggerConfig: Object.freeze({eventType: "raw.event"}),
    conditionRuleRef: "rule.raw",
    operationContractId: operationId,
    workflowDefinitionId: ids.workflow,
    config: Object.freeze({mode: "raw"}),
    createdBy: ids.principal,
    approvedBy: ids.principal,
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2027-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  });
}

function workflow(overrides = {}) {
  return Object.freeze({
    id: ids.workflow,
    ownerScope: "TENANT",
    tenantId: ids.tenant,
    industryContextId: undefined,
    code: "workflow.raw",
    version: 11,
    status: "RETIRED",
    schemaVersion: 5,
    stateMachine: Object.freeze({raw: "state-machine"}),
    approvalPolicy: Object.freeze({raw: "approval"}),
    ruleRefs: Object.freeze(["rule.workflow.raw"]),
    createdBy: ids.principal,
    approvedBy: ids.principal,
    effectiveFrom: "2025-01-01T00:00:00.000Z",
    effectiveTo: "2028-01-01T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  });
}

function operation(overrides = {}) {
  return Object.freeze({
    operationId,
    module: "RawModule",
    scopeClass: "PLATFORM_GLOBAL",
    kind: "COMMAND",
    permissionCode: "raw.permission",
    entitlementRequirement: "raw.entitlement",
    inputSchemaVersion: 9,
    outputSchemaVersion: 10,
    resourceResolver: "RawResolver",
    idempotencyPolicy: "REQUIRED",
    rateClass: "RAW_RATE",
    auditClass: "RAW_AUDIT",
    domainService: "RawService.execute",
    emittedEvents: Object.freeze(["raw.event.emitted"]),
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
  const calls = {run: [], definition: [], workflow: []};
  const runValue = Object.hasOwn(overrides, "run") ? overrides.run : run();
  const definitionValue = Object.hasOwn(overrides, "definition")
    ? overrides.definition
    : automation();
  const workflowValue = Object.hasOwn(overrides, "workflow")
    ? overrides.workflow
    : workflow();

  return {
    order,
    calls,
    runValue,
    definitionValue,
    workflowValue,
    runReader: {
      async loadForContext(input) {
        order.push("run");
        calls.run.push(input);
        if (overrides.runError) throw overrides.runError;
        return runValue;
      },
    },
    definitionReader: {
      async loadForContext(input) {
        order.push("definition");
        calls.definition.push(input);
        if (overrides.definitionError) throw overrides.definitionError;
        return definitionValue;
      },
    },
    workflowReader: {
      async loadForContext(input) {
        order.push("workflow");
        calls.workflow.push(input);
        if (overrides.workflowError) throw overrides.workflowError;
        return workflowValue;
      },
    },
  };
}

async function load(f, registry, context = requestContext) {
  return loadAutomationRunDefinitionWorkflowOperationCurrentEvidence(
    {requestContext: context, automationRunId: ids.run},
    f.runReader,
    f.definitionReader,
    f.workflowReader,
    registry,
  );
}

test("WFA-RUN-OPREAD-BASE-001 DD-382 parent evidence is established before registry access", async () => {
  const f = fixture();
  const r = makeRegistry();
  const originalGet = r.registry.get.bind(r.registry);
  r.registry.get = id => {
    f.order.push("operation");
    return originalGet(id);
  };

  const result = await load(f, r.registry);
  assert.ok(result);
  assert.deepEqual(f.order, ["run", "definition", "workflow", "operation"]);
  assert.equal(f.calls.run[0].requestContext, requestContext);
  assert.equal(f.calls.run[0].automationRunId, ids.run);
});

test("WFA-RUN-OPREAD-BASE-002 DD-382 null/error short-circuits registry access", async () => {
  const absent = fixture({run: null});
  const absentRegistry = makeRegistry();
  assert.equal(await load(absent, absentRegistry.registry), null);
  assert.deepEqual(absentRegistry.calls, []);

  const expected = new Error("run-reader-failed");
  const broken = fixture({runError: expected});
  const brokenRegistry = makeRegistry();
  await assert.rejects(load(broken, brokenRegistry.registry), error => error === expected);
  assert.deepEqual(brokenRegistry.calls, []);
});

test("WFA-RUN-OPREAD-OP-001 absent operation skips lookup; present id performs exact one lookup", async () => {
  const absent = fixture({
    definition: automation({operationContractId: undefined}),
  });
  const absentRegistry = makeRegistry();
  const absentResult = await load(absent, absentRegistry.registry);
  assert.ok(absentResult);
  assert.deepEqual(absentRegistry.calls, []);
  assert.equal("operationContract" in absentResult, false);

  const present = fixture();
  const presentRegistry = makeRegistry();
  assert.ok(await load(present, presentRegistry.registry));
  assert.deepEqual(presentRegistry.calls, [operationId]);
});

test("WFA-RUN-OPREAD-OP-002 registry errors propagate unchanged with no fallback lookup", async () => {
  const f = fixture();
  const r = makeRegistry();
  const expected = new Error("operation-registry-failed");
  r.registry.get = id => {
    r.calls.push(id);
    throw expected;
  };

  await assert.rejects(load(f, r.registry), error => error === expected);
  assert.deepEqual(r.calls, [operationId]);
});

test("WFA-RUN-OPREAD-COEXIST-001 WorkflowDefinition and OperationContract evidence may coexist", async () => {
  const f = fixture();
  const r = makeRegistry();
  const result = await load(f, r.registry);
  assert.ok(result);
  assert.equal(result.runDefinitionWorkflow.workflowDefinition, f.workflowValue);
  assert.equal(result.operationContract, r.registered);
});

test("WFA-RUN-OPREAD-RAW-001 OperationContract metadata remains raw even when context-compatible policy is not implied", async () => {
  const f = fixture();
  const r = makeRegistry(operation({
    scopeClass: "PLATFORM_GLOBAL",
    permissionCode: "raw.permission",
    entitlementRequirement: "raw.entitlement",
    idempotencyPolicy: "REQUIRED",
    rateClass: "RAW_RATE",
    auditClass: "RAW_AUDIT",
    domainService: "RawService.execute",
  }));

  const result = await load(f, r.registry);
  assert.ok(result);
  assert.equal(result.operationContract.scopeClass, "PLATFORM_GLOBAL");
  assert.equal(result.operationContract.permissionCode, "raw.permission");
  assert.equal(result.operationContract.entitlementRequirement, "raw.entitlement");
  assert.equal(result.operationContract.idempotencyPolicy, "REQUIRED");
  assert.equal(result.operationContract.rateClass, "RAW_RATE");
  assert.equal(result.operationContract.auditClass, "RAW_AUDIT");
  assert.equal(result.operationContract.domainService, "RawService.execute");
});

test("WFA-RUN-OPREAD-EVID-001 success preserves exact nested and registry evidence identities in a frozen envelope", async () => {
  const f = fixture();
  const r = makeRegistry();
  const result = await load(f, r.registry);
  assert.ok(result);
  assert.equal(result.runDefinitionWorkflow.runDefinition.run, f.runValue);
  assert.equal(result.runDefinitionWorkflow.runDefinition.definition, f.definitionValue);
  assert.equal(result.runDefinitionWorkflow.workflowDefinition, f.workflowValue);
  assert.equal(result.operationContract, r.registered);
  assert.equal(Object.isFrozen(result.runDefinitionWorkflow), true);
  assert.equal(Object.isFrozen(result), true);
});

test("WFA-RUN-OPREAD-BOUND-001 combined evidence exposes no admission, dispatch or execution authority", async () => {
  const f = fixture();
  const r = makeRegistry();
  const result = await load(f, r.registry);
  assert.ok(result);

  for (const forbidden of [
    "operationCompatible",
    "permissionGranted",
    "entitlementGranted",
    "idempotencyClaimed",
    "rateAdmitted",
    "guardResult",
    "definitionSelected",
    "triggerMatched",
    "conditionSatisfied",
    "transitionAuthorized",
    "retryable",
    "dispatchAuthorized",
    "domainDispatched",
    "workflowExecuted",
    "mutation",
    "eventEmitted",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
