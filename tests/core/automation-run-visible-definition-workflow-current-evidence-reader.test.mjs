import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAutomationRunDefinitionWorkflowCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  run: "33333333-3333-4333-8333-333333333333",
  automation: "44444444-4444-4444-8444-444444444444",
  workflow: "55555555-5555-4555-8555-555555555555",
  principal: "66666666-6666-4666-8666-666666666666",
  foreignTenant: "77777777-7777-4777-8777-777777777777",
  siblingIndustry: "88888888-8888-4888-8888-888888888888",
  wrongWorkflow: "99999999-9999-4999-8999-999999999999",
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

const tenantCoreContext = Object.freeze({
  ...requestContext,
  industryContextId: undefined,
  scopeClass: "TENANT_CORE",
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
    operationContractId: "core.raw.operation",
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
        if (overrides.workflowResolver) return overrides.workflowResolver(input);
        return workflowValue;
      },
    },
  };
}

async function load(f, context = requestContext) {
  return loadAutomationRunDefinitionWorkflowCurrentEvidence(
    {requestContext: context, automationRunId: ids.run},
    f.runReader,
    f.definitionReader,
    f.workflowReader,
  );
}

test("WFA-RUN-WFREAD-BASE-001 DD-372 parent chain receives exact context/id before WorkflowDefinition access", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.deepEqual(f.order.slice(0, 3), ["run", "definition", "workflow"]);
  assert.equal(f.calls.run.length, 1);
  assert.equal(f.calls.run[0].requestContext, requestContext);
  assert.equal(f.calls.run[0].automationRunId, ids.run);
});

test("WFA-RUN-WFREAD-BASE-002 DD-372 null/error short-circuits WorkflowDefinition access", async () => {
  const absent = fixture({run: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.definition, []);
  assert.deepEqual(absent.calls.workflow, []);

  const expected = new Error("automation-run-reader-failed");
  const broken = fixture({runError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.definition, []);
  assert.deepEqual(broken.calls.workflow, []);
});

test("WFA-RUN-WFREAD-WF-001 unbound skips parent read; bound uses exact same context/id without definition re-read", async () => {
  const unboundDefinition = automation({workflowDefinitionId: undefined});
  const unbound = fixture({definition: unboundDefinition});
  const unboundResult = await load(unbound);
  assert.ok(unboundResult);
  assert.deepEqual(unbound.calls.workflow, []);
  assert.equal(unbound.calls.definition.length, 1);
  assert.equal("workflowDefinition" in unboundResult, false);

  const bound = fixture();
  assert.ok(await load(bound));
  assert.equal(bound.calls.definition.length, 1);
  assert.equal(bound.calls.workflow.length, 1);
  assert.equal(bound.calls.workflow[0].requestContext, requestContext);
  assert.equal(bound.calls.workflow[0].workflowDefinitionId, ids.workflow);
});

test("WFA-RUN-WFREAD-WF-002 bound WorkflowDefinition null returns null and error propagates", async () => {
  const absent = fixture({workflow: null});
  assert.equal(await load(absent), null);

  const expected = new Error("workflow-definition-reader-failed");
  const broken = fixture({workflowError: expected});
  await assert.rejects(load(broken), error => error === expected);
});

test("WFA-RUN-WFREAD-FLOOR-001 DD-176 optional containment is re-applied to the preserved definition", async () => {
  assert.ok(await load(fixture()));
  assert.ok(await load(fixture({definition: automation({workflowDefinitionId: undefined})})));

  for (const workflowValue of [
    workflow({id: ids.wrongWorkflow}),
    workflow({tenantId: ids.foreignTenant}),
    workflow({
      ownerScope: "INDUSTRY",
      tenantId: ids.tenant,
      industryContextId: ids.siblingIndustry,
    }),
  ]) {
    assert.equal(await load(fixture({workflow: workflowValue})), null);
  }

  const tenantRun = run({industryContextId: undefined});
  const tenantDefinition = automation({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });
  const narrower = workflow({
    ownerScope: "INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
  });
  assert.equal(
    await load(
      fixture({run: tenantRun, definition: tenantDefinition, workflow: narrower}),
      tenantCoreContext,
    ),
    null,
  );
});

test("WFA-RUN-WFREAD-NOFALLBACK-001 hidden PLATFORM WorkflowDefinition remains null with no fallback", async () => {
  const tenantRun = run({industryContextId: undefined});
  const tenantDefinition = automation({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });
  const platformWorkflow = workflow({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });
  const f = fixture({
    run: tenantRun,
    definition: tenantDefinition,
    workflowResolver(input) {
      return input.requestContext.scopeClass === "PLATFORM_GLOBAL"
        ? platformWorkflow
        : null;
    },
  });

  assert.equal(await load(f, tenantCoreContext), null);
  assert.equal(f.calls.definition.length, 1);
  assert.equal(f.calls.workflow.length, 1);
  assert.equal(f.calls.workflow[0].requestContext, tenantCoreContext);
  assert.equal(
    f.calls.workflow.some(call => call.requestContext.scopeClass === "PLATFORM_GLOBAL"),
    false,
  );
});

test("WFA-RUN-WFREAD-EVID-001 success preserves exact nested evidence identities in a frozen envelope", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(result.runDefinition.run, f.runValue);
  assert.equal(result.runDefinition.definition, f.definitionValue);
  assert.equal(result.workflowDefinition, f.workflowValue);
  assert.equal(Object.isFrozen(result.runDefinition), true);
  assert.equal(Object.isFrozen(result), true);

  const unboundDefinition = automation({workflowDefinitionId: undefined});
  const unbound = fixture({definition: unboundDefinition});
  const unboundResult = await load(unbound);
  assert.ok(unboundResult);
  assert.equal(unboundResult.runDefinition.definition, unboundDefinition);
  assert.equal("workflowDefinition" in unboundResult, false);
  assert.equal(Object.isFrozen(unboundResult), true);
});

test("WFA-RUN-WFREAD-BOUND-001 combined raw Automation/Workflow evidence remains uninterpreted", async () => {
  const f = fixture();
  const beforeRun = JSON.stringify(f.runValue);
  const beforeDefinition = JSON.stringify(f.definitionValue);
  const beforeWorkflow = JSON.stringify(f.workflowValue);
  const result = await load(f);
  assert.ok(result);

  assert.equal(JSON.stringify(f.runValue), beforeRun);
  assert.equal(JSON.stringify(f.definitionValue), beforeDefinition);
  assert.equal(JSON.stringify(f.workflowValue), beforeWorkflow);
  assert.equal(result.runDefinition.run.status, "RUNNING");
  assert.equal(result.runDefinition.run.triggerRef, "event:raw");
  assert.equal(result.runDefinition.run.lastErrorCode, "RAW_ERROR");
  assert.equal(result.runDefinition.definition.status, "ACTIVE");
  assert.deepEqual(result.runDefinition.definition.triggerConfig, {eventType: "raw.event"});
  assert.equal(result.runDefinition.definition.conditionRuleRef, "rule.raw");
  assert.equal(result.runDefinition.definition.operationContractId, "core.raw.operation");
  assert.equal(result.workflowDefinition.status, "RETIRED");
  assert.equal(result.workflowDefinition.version, 11);
  assert.deepEqual(result.workflowDefinition.stateMachine, {raw: "state-machine"});
  assert.deepEqual(result.workflowDefinition.approvalPolicy, {raw: "approval"});

  for (const forbidden of [
    "definitionSelected",
    "workflowSelected",
    "triggerMatched",
    "conditionSatisfied",
    "retryable",
    "nextStatus",
    "transitionAuthorized",
    "operationAuthorized",
    "workflowAuthorized",
    "mutation",
    "eventEmitted",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
