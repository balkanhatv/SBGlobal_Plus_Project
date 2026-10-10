import test from "node:test";
import assert from "node:assert/strict";

import {
  loadWorkflowTaskDefinitionCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  siblingIndustry: "23232323-2323-4232-8232-232323232323",
  task: "33333333-3333-4333-8333-333333333333",
  instance: "44444444-4444-4444-8444-444444444444",
  definition: "55555555-5555-4555-8555-555555555555",
  principal: "66666666-6666-4666-8666-666666666666",
  subject: "77777777-7777-4777-8777-777777777777",
});

function requestContext(overrides = {}) {
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

function task(overrides = {}) {
  return Object.freeze({
    id: ids.task,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    workflowInstanceId: ids.instance,
    taskType: "APPROVAL",
    assignedSubjectType: "ROLE",
    assignedSubjectId: ids.subject,
    permissionCode: "workflow.task.approve",
    state: "CLAIMED",
    dueAt: "2026-10-15T00:00:00.000Z",
    claimedBy: ids.principal,
    completedBy: undefined,
    completedAt: undefined,
    rowVersion: "9",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T01:00:00.000Z",
    ...overrides,
  });
}

function instance(overrides = {}) {
  return Object.freeze({
    id: ids.instance,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    workflowDefinitionId: ids.definition,
    workflowDefinitionVersion: 3,
    resourceType: "case",
    resourceId: "case-1",
    currentState: "RAW_STATE",
    lifecycleState: "WAITING",
    rowVersion: "7",
    startedAt: "2026-10-01T00:00:00.000Z",
    createdBy: ids.principal,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T01:00:00.000Z",
    ...overrides,
  });
}

function definition(overrides = {}) {
  return Object.freeze({
    id: ids.definition,
    ownerScope: "INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    code: "case.flow",
    version: 3,
    status: "ACTIVE",
    schemaVersion: 1,
    stateMachine: Object.freeze({opaque: true}),
    approvalPolicy: Object.freeze({raw: "policy"}),
    ruleRefs: Object.freeze(["rule.raw"]),
    createdBy: ids.principal,
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2027-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {task: [], instance: [], definition: []};
  const values = {
    task: Object.hasOwn(overrides, "task") ? overrides.task : task(),
    instance: Object.hasOwn(overrides, "instance") ? overrides.instance : instance(),
    definition: Object.hasOwn(overrides, "definition") ? overrides.definition : definition(),
  };

  return {
    order,
    calls,
    values,
    taskReader: {
      async loadForContext(input) {
        order.push("task");
        calls.task.push(input);
        if (overrides.taskError) throw overrides.taskError;
        return values.task;
      },
    },
    instanceReader: {
      async loadForContext(input) {
        order.push("instance");
        calls.instance.push(input);
        if (overrides.instanceError) throw overrides.instanceError;
        return values.instance;
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
  };
}

async function load(f, inputOverrides = {}) {
  return loadWorkflowTaskDefinitionCurrentEvidence(
    {
      requestContext: requestContext(),
      workflowTaskId: ids.task,
      ...inputOverrides,
    },
    f.taskReader,
    f.instanceReader,
    f.definitionReader,
  );
}

test("WFT-DEFREAD-BASE-001 exact DD-362 parent evidence is established first", async () => {
  const f = fixture();
  const current = requestContext();
  const result = await load(f, {requestContext: current});
  assert.ok(result);
  assert.deepEqual(f.order, ["task", "instance", "definition"]);
  assert.equal(f.calls.task[0].requestContext, current);
  assert.equal(f.calls.task[0].workflowTaskId, ids.task);
  assert.equal(f.calls.instance[0].requestContext, current);
  assert.equal(result.parent.task, f.values.task);
  assert.equal(result.parent.instance, f.values.instance);
});

test("WFT-DEFREAD-BASE-002 DD-362 null/error short-circuits or propagates before definition access", async () => {
  const absent = fixture({task: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.definition, []);

  const expected = new Error("parent-failed");
  const broken = fixture({instanceError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.definition, []);
});

test("WFT-DEFREAD-DEF-001 exactly one definition read uses identical context and persisted definition id", async () => {
  const industry = fixture();
  const industryContext = requestContext();
  assert.ok(await load(industry, {requestContext: industryContext}));
  assert.equal(industry.calls.definition.length, 1);
  assert.equal(industry.calls.definition[0].requestContext, industryContext);
  assert.equal(industry.calls.definition[0].workflowDefinitionId, ids.definition);

  const coreContext = requestContext({
    scopeClass: "TENANT_CORE",
    industryContextId: undefined,
  });
  const core = fixture({
    task: task({industryContextId: undefined}),
    instance: instance({
      industryContextId: undefined,
      scopeClass: "TENANT_CORE",
    }),
    definition: definition({
      ownerScope: "TENANT",
      industryContextId: undefined,
    }),
  });
  assert.ok(await load(core, {requestContext: coreContext}));
  assert.equal(core.calls.definition.length, 1);
  assert.equal(core.calls.definition[0].requestContext, coreContext);
});

test("WFT-DEFREAD-DEF-002 hidden/missing definition returns null and dependency error propagates unchanged", async () => {
  const absent = fixture({definition: null});
  assert.equal(await load(absent), null);

  const expected = new Error("definition-failed");
  const broken = fixture({definitionError: expected});
  await assert.rejects(load(broken), error => error === expected);
});

test("WFT-DEFREAD-FLOOR-001 exact DD-173 id/version/ACTIVE/applicability passes and mismatches fail closed", async () => {
  assert.ok(await load(fixture()));

  for (const definitionValue of [
    definition({id: "88888888-8888-4888-8888-888888888888"}),
    definition({version: 4}),
    definition({status: "RETIRED"}),
    definition({tenantId: "99999999-9999-4999-8999-999999999999"}),
    definition({industryContextId: ids.siblingIndustry}),
    definition({
      ownerScope: "TENANT",
      tenantId: ids.tenant,
      industryContextId: ids.industry,
    }),
  ]) {
    assert.equal(await load(fixture({definition: definitionValue})), null);
  }
});

test("WFT-DEFREAD-NOFALLBACK-001 hidden referenced definition has no PLATFORM_GLOBAL or alternate lookup", async () => {
  const current = requestContext();
  const f = fixture({definition: null});
  assert.equal(await load(f, {requestContext: current}), null);
  assert.equal(f.calls.definition.length, 1);
  assert.equal(f.calls.definition[0].requestContext, current);
  assert.equal(
    f.calls.definition.some(call => call.requestContext.scopeClass === "PLATFORM_GLOBAL"),
    false,
  );
});

test("WFT-DEFREAD-EVID-001 success preserves exact parent and definition references unchanged", async () => {
  const f = fixture();
  const before = JSON.stringify([f.values.task, f.values.instance, f.values.definition]);
  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.parent.task, f.values.task);
  assert.equal(result.parent.instance, f.values.instance);
  assert.equal(result.definition, f.values.definition);
  assert.equal(
    JSON.stringify([f.values.task, f.values.instance, f.values.definition]),
    before,
  );
});

test("WFT-DEFREAD-BOUND-001 output grants no assignment action effective-date transition mutation worker or execution authority", async () => {
  const result = await load(fixture());
  assert.ok(result);
  assert.equal(result.definition.status, "ACTIVE");
  assert.deepEqual(result.definition.stateMachine, {opaque: true});
  assert.deepEqual(result.definition.approvalPolicy, {raw: "policy"});
  assert.deepEqual(result.definition.ruleRefs, ["rule.raw"]);

  for (const forbidden of [
    "assigneeCurrent",
    "claimantCurrent",
    "completerCurrent",
    "due",
    "expired",
    "claimAuthorized",
    "approveAuthorized",
    "rejectAuthorized",
    "completeAuthorized",
    "definitionSelected",
    "effectiveNow",
    "currentStateValid",
    "transitionAuthorized",
    "mutation",
    "eventEmitted",
    "workerDispatched",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
