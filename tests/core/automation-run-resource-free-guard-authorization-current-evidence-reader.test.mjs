import test from "node:test";
import assert from "node:assert/strict";

import {
  OperationRegistry,
  loadAutomationRunResourceFreeGuardAuthorizationCurrentEvidence,
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

function context(overrides = {}) {
  return Object.freeze({
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
    ...overrides,
  });
}

function run(overrides = {}) {
  return Object.freeze({
    id: ids.run,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    automationDefinitionId: ids.automation,
    triggerRef: "event:raw",
    idempotencyKeyHash: "hash-raw",
    status: "RUNNING",
    startedAt: "2026-10-04T00:00:00.000Z",
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
    scopeClass: "TENANT_INDUSTRY",
    kind: "COMMAND",
    permissionCode: "raw.permission",
    entitlementRequirement: "raw.entitlement",
    inputSchemaVersion: 9,
    outputSchemaVersion: 10,
    idempotencyPolicy: "REQUIRED",
    rateClass: "AUTH_STANDARD",
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
  const calls = {
    run: [],
    definition: [],
    workflow: [],
    guard: [],
  };
  const runValue = Object.hasOwn(overrides, "run") ? overrides.run : run();
  const definitionValue = Object.hasOwn(overrides, "definition")
    ? overrides.definition
    : automation();
  const workflowValue = Object.hasOwn(overrides, "workflow")
    ? overrides.workflow
    : workflow();
  const guardResult = Object.hasOwn(overrides, "guardResult")
    ? overrides.guardResult
    : Object.freeze({
        decisionId: "decision-1",
        restrictionSet: Object.freeze({raw: "restriction"}),
      });

  return {
    order,
    calls,
    runValue,
    definitionValue,
    workflowValue,
    guardResult,
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
    guardAuthorization: {
      async authorize(input) {
        order.push("guard");
        calls.guard.push(input);
        if (overrides.guardError) throw overrides.guardError;
        return guardResult;
      },
    },
  };
}

async function load(f, registry, requestContext = context()) {
  return loadAutomationRunResourceFreeGuardAuthorizationCurrentEvidence(
    {requestContext, automationRunId: ids.run},
    f.runReader,
    f.definitionReader,
    f.workflowReader,
    registry,
    f.guardAuthorization,
  );
}

test("WFA-RUN-GUARD-BASE-001 DD-387 parent is established before GuardPipeline access", async () => {
  const f = fixture();
  const r = makeRegistry(operation({resourceResolver: undefined}));
  const originalGet = r.registry.get.bind(r.registry);
  r.registry.get = id => {
    f.order.push("operation");
    return originalGet(id);
  };

  const result = await load(f, r.registry);
  assert.ok(result);
  assert.deepEqual(f.order, ["run", "definition", "workflow", "operation", "guard"]);
  assert.equal(f.calls.run[0].automationRunId, ids.run);
});

test("WFA-RUN-GUARD-BASE-002 DD-387 null/error short-circuits before GuardPipeline access", async () => {
  const absent = fixture({run: null});
  const absentRegistry = makeRegistry(operation({resourceResolver: undefined}));
  assert.equal(await load(absent, absentRegistry.registry), null);
  assert.equal(absent.calls.guard.length, 0);

  const expected = new Error("run-reader-failed");
  const broken = fixture({runError: expected});
  const brokenRegistry = makeRegistry(operation({resourceResolver: undefined}));
  await assert.rejects(load(broken, brokenRegistry.registry), error => error === expected);
  assert.equal(broken.calls.guard.length, 0);
});

test("WFA-RUN-GUARD-BRANCH-001 absent OperationContract returns exact frozen parent-only evidence with zero GuardPipeline calls", async () => {
  const f = fixture({
    definition: automation({operationContractId: undefined}),
  });
  const r = makeRegistry();
  const result = await load(f, r.registry);

  assert.ok(result);
  assert.equal(f.calls.guard.length, 0);
  assert.equal("guardResult" in result, false);
  assert.equal(result.parent.runDefinitionWorkflow.runDefinition.run, f.runValue);
  assert.equal(Object.isFrozen(result), true);
});

test("WFA-RUN-GUARD-BRANCH-002 resource-resolved OperationContract remains parent-only and never derives resourceReference", async () => {
  const f = fixture();
  const r = makeRegistry(operation({resourceResolver: "RawResolver"}));
  const before = f.runValue.triggerRef;
  const result = await load(f, r.registry);

  assert.ok(result);
  assert.equal(f.calls.guard.length, 0);
  assert.equal("guardResult" in result, false);
  assert.equal(f.runValue.triggerRef, before);
  assert.equal(result.parent.operationContract, r.registered);
});

test("WFA-RUN-GUARD-AUTH-001 resource-free operation authorizes exactly once with exact context and operation and no resourceReference", async () => {
  const f = fixture();
  const r = makeRegistry(operation({resourceResolver: undefined}));
  const requestContext = context();
  const result = await load(f, r.registry, requestContext);

  assert.ok(result);
  assert.equal(f.calls.guard.length, 1);
  assert.equal(f.calls.guard[0].requestContext, requestContext);
  assert.equal(f.calls.guard[0].operation, r.registered);
  assert.equal("resourceReference" in f.calls.guard[0], false);
});

test("WFA-RUN-GUARD-AUTH-002 GuardPipeline errors propagate unchanged with no retry fallback or synthetic allow", async () => {
  const expected = new Error("guard-denied");
  const f = fixture({guardError: expected});
  const r = makeRegistry(operation({resourceResolver: undefined}));

  await assert.rejects(load(f, r.registry), error => error === expected);
  assert.equal(f.calls.guard.length, 1);
});

test("WFA-RUN-GUARD-EVID-001 success preserves exact DD-387 parent and exact GuardResult references in a frozen envelope", async () => {
  const guardResult = Object.freeze({
    decisionId: "decision-exact",
    restrictionSet: Object.freeze({limit: "raw"}),
  });
  const f = fixture({guardResult});
  const r = makeRegistry(operation({resourceResolver: undefined}));
  const before = JSON.stringify([f.runValue, f.definitionValue, f.workflowValue, r.registered]);

  const result = await load(f, r.registry);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.guardResult, guardResult);
  assert.equal(result.parent.operationContract, r.registered);
  assert.equal(result.parent.runDefinitionWorkflow.runDefinition.run, f.runValue);
  assert.equal(result.parent.runDefinitionWorkflow.runDefinition.definition, f.definitionValue);
  assert.equal(result.parent.runDefinitionWorkflow.workflowDefinition, f.workflowValue);
  assert.equal(
    JSON.stringify([f.runValue, f.definitionValue, f.workflowValue, r.registered]),
    before,
  );
});

test("WFA-RUN-GUARD-BOUND-001 output grants no automation transition dispatch mutation or execution authority", async () => {
  const f = fixture();
  const r = makeRegistry(operation({resourceResolver: undefined}));
  const result = await load(f, r.registry);
  assert.ok(result);

  for (const forbidden of [
    "triggerMatched",
    "conditionSatisfied",
    "stateMachineDecision",
    "transitionAuthorized",
    "retryAuthorized",
    "idempotencyClaimed",
    "rateAdmitted",
    "approvalSatisfied",
    "schedulerOwned",
    "workerOwned",
    "dispatchAuthorized",
    "domainDispatched",
    "workflowExecuted",
    "mutation",
    "eventEmitted",
    "executionAuthorized",
    "executionCompleted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
