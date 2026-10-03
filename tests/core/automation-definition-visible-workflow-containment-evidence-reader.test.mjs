import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAutomationDefinitionWorkflowContainmentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  automation: "33333333-3333-4333-8333-333333333333",
  workflow: "44444444-4444-4444-8444-444444444444",
  principal: "55555555-5555-4555-8555-555555555555",
  foreignTenant: "66666666-6666-4666-8666-666666666666",
  siblingIndustry: "77777777-7777-4777-8777-777777777777",
  wrongWorkflow: "88888888-8888-4888-8888-888888888888",
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

function automation(overrides = {}) {
  return Object.freeze({
    id: ids.automation,
    ownerScope: "INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    code: "automation.raw",
    version: 7,
    status: "DRAFT",
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
  const calls = {automation: [], workflow: []};
  const automationValue = Object.hasOwn(overrides, "automation")
    ? overrides.automation
    : automation();
  const workflowValue = Object.hasOwn(overrides, "workflow")
    ? overrides.workflow
    : workflow();

  return {
    order,
    calls,
    automationValue,
    workflowValue,
    automationReader: {
      async loadForContext(input) {
        order.push("automation");
        calls.automation.push(input);
        if (overrides.automationError) throw overrides.automationError;
        return automationValue;
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
  return loadAutomationDefinitionWorkflowContainmentEvidence(
    {requestContext: context, automationDefinitionId: ids.automation},
    f.automationReader,
    f.workflowReader,
  );
}

test("WFA-DEF-WFREAD-BASE-001 exact RequestContext/id reaches AutomationDefinition first", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(f.order[0], "automation");
  assert.equal(f.calls.automation.length, 1);
  assert.equal(f.calls.automation[0].requestContext, requestContext);
  assert.equal(f.calls.automation[0].automationDefinitionId, ids.automation);
  assert.ok(f.order.indexOf("workflow") > f.order.indexOf("automation"));
});

test("WFA-DEF-WFREAD-BASE-002 AutomationDefinition null short-circuits and error propagates", async () => {
  const absent = fixture({automation: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.workflow, []);

  const expected = new Error("automation-definition-reader-failed");
  const broken = fixture({automationError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.workflow, []);
});

test("WFA-DEF-WFREAD-WF-001 unbound skips WorkflowDefinition; bound forwards exact same context/id", async () => {
  const unboundDefinition = automation({workflowDefinitionId: undefined});
  const unbound = fixture({automation: unboundDefinition});
  const unboundResult = await load(unbound);
  assert.ok(unboundResult);
  assert.equal(unboundResult.automationDefinition, unboundDefinition);
  assert.equal("workflowDefinition" in unboundResult, false);
  assert.deepEqual(unbound.calls.workflow, []);

  const bound = fixture();
  assert.ok(await load(bound));
  assert.equal(bound.calls.workflow.length, 1);
  assert.equal(bound.calls.workflow[0].requestContext, requestContext);
  assert.equal(bound.calls.workflow[0].workflowDefinitionId, ids.workflow);
});

test("WFA-DEF-WFREAD-WF-002 bound WorkflowDefinition null returns null and error propagates", async () => {
  const absent = fixture({workflow: null});
  assert.equal(await load(absent), null);

  const expected = new Error("workflow-definition-reader-failed");
  const broken = fixture({workflowError: expected});
  await assert.rejects(load(broken), error => error === expected);
});

test("WFA-DEF-WFREAD-FLOOR-001 DD-176 optional reference and containment floor is re-applied", async () => {
  assert.ok(await load(fixture()));
  assert.ok(await load(fixture({automation: automation({workflowDefinitionId: undefined})})));

  for (const [automationValue, workflowValue, context] of [
    [automation(), workflow({id: ids.wrongWorkflow}), requestContext],
    [automation(), workflow({tenantId: ids.foreignTenant}), requestContext],
    [automation(), workflow({ownerScope: "INDUSTRY", industryContextId: ids.siblingIndustry}), requestContext],
    [
      automation({ownerScope: "TENANT", industryContextId: undefined}),
      workflow({ownerScope: "INDUSTRY", industryContextId: ids.industry}),
      tenantCoreContext,
    ],
    [
      automation({ownerScope: "PLATFORM", tenantId: ids.tenant, industryContextId: undefined}),
      workflow({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
      tenantCoreContext,
    ],
  ]) {
    assert.equal(
      await load(fixture({automation: automationValue, workflow: workflowValue}), context),
      null,
    );
  }
});

test("WFA-DEF-WFREAD-NOFALLBACK-001 hidden PLATFORM parent remains null with no PLATFORM_GLOBAL fallback", async () => {
  const platformWorkflow = workflow({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });
  const tenantAutomation = automation({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });
  const f = fixture({
    automation: tenantAutomation,
    workflowResolver(input) {
      return input.requestContext.scopeClass === "PLATFORM_GLOBAL"
        ? platformWorkflow
        : null;
    },
  });

  assert.equal(await load(f, tenantCoreContext), null);
  assert.equal(f.calls.workflow.length, 1);
  assert.equal(f.calls.workflow[0].requestContext, tenantCoreContext);
  assert.equal(f.calls.workflow[0].workflowDefinitionId, ids.workflow);
  assert.equal(
    f.calls.workflow.some(call => call.requestContext.scopeClass === "PLATFORM_GLOBAL"),
    false,
  );
});

test("WFA-DEF-WFREAD-EVID-001 bound and unbound success preserve exact identities in frozen evidence", async () => {
  const bound = fixture();
  const boundResult = await load(bound);
  assert.ok(boundResult);
  assert.equal(boundResult.automationDefinition, bound.automationValue);
  assert.equal(boundResult.workflowDefinition, bound.workflowValue);
  assert.equal(Object.isFrozen(boundResult), true);

  const unboundAutomation = automation({workflowDefinitionId: undefined});
  const unbound = fixture({automation: unboundAutomation});
  const unboundResult = await load(unbound);
  assert.ok(unboundResult);
  assert.equal(unboundResult.automationDefinition, unboundAutomation);
  assert.equal("workflowDefinition" in unboundResult, false);
  assert.equal(Object.isFrozen(unboundResult), true);
});

test("WFA-DEF-WFREAD-BOUND-001 raw Automation/Workflow semantics remain uninterpreted", async () => {
  const f = fixture();
  const beforeAutomation = JSON.stringify(f.automationValue);
  const beforeWorkflow = JSON.stringify(f.workflowValue);
  const result = await load(f);
  assert.ok(result);
  assert.equal(JSON.stringify(f.automationValue), beforeAutomation);
  assert.equal(JSON.stringify(f.workflowValue), beforeWorkflow);
  assert.equal(result.automationDefinition.status, "DRAFT");
  assert.equal(result.automationDefinition.version, 7);
  assert.deepEqual(result.automationDefinition.triggerConfig, {eventType: "raw.event"});
  assert.equal(result.automationDefinition.conditionRuleRef, "rule.raw");
  assert.equal(result.automationDefinition.operationContractId, "core.raw.operation");
  assert.equal(result.workflowDefinition.status, "RETIRED");
  assert.equal(result.workflowDefinition.version, 11);
  assert.deepEqual(result.workflowDefinition.stateMachine, {raw: "state-machine"});
  assert.deepEqual(result.workflowDefinition.approvalPolicy, {raw: "approval"});
  assert.deepEqual(result.workflowDefinition.ruleRefs, ["rule.workflow.raw"]);

  for (const forbidden of [
    "workflowSelected",
    "workflowActive",
    "triggerMatched",
    "conditionSatisfied",
    "operationAuthorized",
    "workflowAuthorized",
    "retryable",
    "nextStatus",
    "mutation",
    "eventEmitted",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
