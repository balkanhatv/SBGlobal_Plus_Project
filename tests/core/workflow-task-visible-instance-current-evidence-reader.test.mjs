import test from "node:test";
import assert from "node:assert/strict";

import {
  loadWorkflowTaskInstanceCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  siblingIndustry: "33333333-3333-4333-8333-333333333333",
  task: "44444444-4444-4444-8444-444444444444",
  instance: "55555555-5555-4555-8555-555555555555",
  principal: "66666666-6666-4666-8666-666666666666",
  subject: "77777777-7777-4777-8777-777777777777",
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

function task(overrides = {}) {
  return Object.freeze({
    id: ids.task,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    workflowInstanceId: ids.instance,
    taskType: "APPROVAL",
    assignedSubjectType: "ROLE",
    assignedSubjectId: ids.subject,
    permissionCode: "",
    state: "CLAIMED",
    dueAt: "2026-10-15T00:00:00.000Z",
    claimedBy: ids.principal,
    completedBy: undefined,
    completedAt: undefined,
    rowVersion: "-9",
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
    workflowDefinitionId: "88888888-8888-4888-8888-888888888888",
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

function fixture(overrides = {}) {
  const order = [];
  const calls = {task: [], instance: []};
  const taskValue = Object.hasOwn(overrides, "task")
    ? overrides.task
    : task();
  const instanceValue = Object.hasOwn(overrides, "instance")
    ? overrides.instance
    : instance();

  return {
    order,
    calls,
    taskValue,
    instanceValue,
    taskReader: {
      async loadForContext(input) {
        order.push("task");
        calls.task.push(input);
        if (overrides.taskError) throw overrides.taskError;
        return taskValue;
      },
    },
    instanceReader: {
      async loadForContext(input) {
        order.push("instance");
        calls.instance.push(input);
        if (overrides.instanceError) throw overrides.instanceError;
        return instanceValue;
      },
    },
  };
}

async function load(f) {
  return loadWorkflowTaskInstanceCurrentEvidence(
    {requestContext, workflowTaskId: ids.task},
    f.taskReader,
    f.instanceReader,
  );
}

test("WFT-INSTREAD-BASE-001 exact RequestContext/id reaches WorkflowTask first", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(f.order[0], "task");
  assert.equal(f.calls.task.length, 1);
  assert.equal(f.calls.task[0].requestContext, requestContext);
  assert.equal(f.calls.task[0].workflowTaskId, ids.task);
  assert.ok(f.order.indexOf("instance") > f.order.indexOf("task"));
});

test("WFT-INSTREAD-BASE-002 task null short-circuits and task error propagates", async () => {
  const absent = fixture({task: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.instance, []);

  const expected = new Error("task-reader-failed");
  const broken = fixture({taskError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.instance, []);
});

test("WFT-INSTREAD-INST-001 visible task forwards exact same context and persisted instance id once", async () => {
  const f = fixture();
  assert.ok(await load(f));
  assert.equal(f.calls.instance.length, 1);
  assert.equal(f.calls.instance[0].requestContext, requestContext);
  assert.equal(
    f.calls.instance[0].workflowInstanceId,
    f.taskValue.workflowInstanceId,
  );
});

test("WFT-INSTREAD-INST-002 WorkflowInstance null returns null and dependency error propagates", async () => {
  const absent = fixture({instance: null});
  assert.equal(await load(absent), null);

  const expected = new Error("instance-reader-failed");
  const broken = fixture({instanceError: expected});
  await assert.rejects(load(broken), error => error === expected);
});

test("WFT-INSTREAD-FLOOR-001 exact DD-174 parent binding passes and mismatches fail closed", async () => {
  assert.ok(await load(fixture()));

  for (const instanceValue of [
    instance({id: "99999999-9999-4999-8999-999999999999"}),
    instance({tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}),
    instance({industryContextId: ids.siblingIndustry}),
    instance({scopeClass: "TENANT_CORE", industryContextId: undefined}),
  ]) {
    assert.equal(await load(fixture({instance: instanceValue})), null);
  }

  const coreTask = task({industryContextId: undefined});
  const coreInstance = instance({
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
  });
  assert.ok(await load(fixture({task: coreTask, instance: coreInstance})));
});

test("WFT-INSTREAD-EVID-001 success preserves exact identities in frozen evidence", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(result.task, f.taskValue);
  assert.equal(result.instance, f.instanceValue);
  assert.equal(Object.isFrozen(result), true);
});

test("WFT-INSTREAD-RAW-001 task and parent workflow evidence remains raw and unchanged", async () => {
  const f = fixture();
  const beforeTask = JSON.stringify(f.taskValue);
  const beforeInstance = JSON.stringify(f.instanceValue);
  const result = await load(f);
  assert.ok(result);
  assert.equal(JSON.stringify(f.taskValue), beforeTask);
  assert.equal(JSON.stringify(f.instanceValue), beforeInstance);
  assert.equal(result.task.assignedSubjectType, "ROLE");
  assert.equal(result.task.permissionCode, "");
  assert.equal(result.task.state, "CLAIMED");
  assert.equal(result.task.rowVersion, "-9");
  assert.equal(result.instance.currentState, "RAW_STATE");
  assert.equal(result.instance.lifecycleState, "WAITING");
});

test("WFT-INSTREAD-BOUND-001 no assignee/task-action/transition/execution authority is synthesized", async () => {
  const result = await load(fixture());
  assert.ok(result);

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
    "transitionAuthorized",
    "executionAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
