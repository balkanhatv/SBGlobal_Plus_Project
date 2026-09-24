import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesWorkflowChildParentBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  task: "11111111-1111-4111-8111-111111111111",
  transition: "22222222-2222-4222-8222-222222222222",
  instance: "33333333-3333-4333-8333-333333333333",
  otherInstance: "44444444-4444-4444-8444-444444444444",
  tenantA: "55555555-5555-4555-8555-555555555555",
  tenantB: "66666666-6666-4666-8666-666666666666",
  industryA: "77777777-7777-4777-8777-777777777777",
  industryB: "88888888-8888-4888-8888-888888888888",
  subject: "99999999-9999-4999-8999-999999999999",
  actor: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  definition: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  correlation: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
});

const baseInstance = Object.freeze({
  id: ids.instance,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  scopeClass: "TENANT_INDUSTRY",
  workflowDefinitionId: ids.definition,
  workflowDefinitionVersion: 1,
  resourceType: "opaque",
  resourceId: "opaque",
  currentState: "opaque",
  lifecycleState: "OPEN",
  rowVersion: "1",
  startedAt: "2026-09-24T06:00:00.000Z",
  createdBy: ids.actor,
  createdAt: "2026-09-24T06:00:00.000Z",
  updatedAt: "2026-09-24T06:00:00.000Z",
});

const baseTask = Object.freeze({
  id: ids.task,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  workflowInstanceId: ids.instance,
  taskType: "APPROVAL",
  assignedSubjectType: "PRINCIPAL",
  assignedSubjectId: ids.subject,
  permissionCode: "opaque.permission",
  state: "PENDING",
  rowVersion: "1",
  createdAt: "2026-09-24T06:00:00.000Z",
  updatedAt: "2026-09-24T06:00:00.000Z",
});

const baseTransition = Object.freeze({
  id: ids.transition,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  workflowInstanceId: ids.instance,
  fromState: "opaque-from",
  actionCode: "opaque-action",
  toState: "opaque-to",
  actorPrincipalId: ids.actor,
  expectedInstanceVersion: "1",
  resultingInstanceVersion: "2",
  occurredAt: "2026-09-24T06:00:00.000Z",
  correlationId: ids.correlation,
});

function instance(overrides = {}) {
  return Object.freeze({...baseInstance, ...overrides});
}

function task(overrides = {}) {
  return Object.freeze({...baseTask, ...overrides});
}

function transition(overrides = {}) {
  return Object.freeze({...baseTransition, ...overrides});
}

test("WFCH-PARENT-CUR-001 Tenant-Core task exact parent matches", () => {
  assert.equal(
    matchesWorkflowChildParentBindingFloors(
      task({industryContextId: undefined}),
      instance({scopeClass: "TENANT_CORE", industryContextId: undefined}),
    ),
    true,
  );
});

test("WFCH-PARENT-CUR-002 Tenant-Industry task exact parent matches", () => {
  assert.equal(matchesWorkflowChildParentBindingFloors(task(), instance()), true);
});

test("WFCH-PARENT-CUR-003 Tenant-Core transition exact parent matches", () => {
  assert.equal(
    matchesWorkflowChildParentBindingFloors(
      transition({industryContextId: undefined}),
      instance({scopeClass: "TENANT_CORE", industryContextId: undefined}),
    ),
    true,
  );
});

test("WFCH-PARENT-CUR-004 Tenant-Industry transition exact parent matches", () => {
  assert.equal(
    matchesWorkflowChildParentBindingFloors(transition(), instance()),
    true,
  );
});

test("WFCH-PARENT-CUR-005 parent id, Tenant, Industry and scope mismatches fail closed", () => {
  assert.equal(
    matchesWorkflowChildParentBindingFloors(
      task(),
      instance({id: ids.otherInstance}),
    ),
    false,
  );
  assert.equal(
    matchesWorkflowChildParentBindingFloors(
      task(),
      instance({tenantId: ids.tenantB}),
    ),
    false,
  );
  assert.equal(
    matchesWorkflowChildParentBindingFloors(
      task(),
      instance({industryContextId: ids.industryB}),
    ),
    false,
  );
  assert.equal(
    matchesWorkflowChildParentBindingFloors(
      task({industryContextId: undefined}),
      instance(),
    ),
    false,
  );
});

test("WFCH-PARENT-CUR-006 malformed child or parent ownership fails closed", () => {
  assert.equal(
    matchesWorkflowChildParentBindingFloors(
      task({id: "not-a-uuid"}),
      instance(),
    ),
    false,
  );
  assert.equal(
    matchesWorkflowChildParentBindingFloors(
      transition({workflowInstanceId: "not-a-uuid"}),
      instance(),
    ),
    false,
  );
  assert.equal(
    matchesWorkflowChildParentBindingFloors(
      task(),
      instance({scopeClass: "TENANT_CORE"}),
    ),
    false,
  );
});

test("WFCH-PARENT-CUR-007 task/transition semantics remain uninterpreted without mutation", () => {
  const candidateTask = task({
    taskType: "ACTION",
    assignedSubjectType: "ORG_UNIT",
    assignedSubjectId: "not-interpreted",
    permissionCode: "",
    state: "EXPIRED",
    dueAt: "not-interpreted",
    claimedBy: "not-interpreted",
    completedBy: "not-interpreted",
    completedAt: "not-interpreted",
    rowVersion: "-99",
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });
  const candidateTransition = transition({
    fromState: "",
    actionCode: "",
    toState: "",
    actorPrincipalId: "not-interpreted",
    reasonCode: "",
    expectedInstanceVersion: "not-interpreted",
    resultingInstanceVersion: "not-interpreted",
    occurredAt: "not-interpreted",
    correlationId: "not-interpreted",
  });
  const candidateInstance = instance({
    resourceType: "",
    resourceId: "",
    currentState: "",
    lifecycleState: "CANCELLED",
    rowVersion: "-99",
    startedAt: "not-interpreted",
    completedAt: "not-interpreted",
    createdBy: "",
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });

  const beforeTask = JSON.stringify(candidateTask);
  const beforeTransition = JSON.stringify(candidateTransition);
  const beforeInstance = JSON.stringify(candidateInstance);

  assert.equal(
    matchesWorkflowChildParentBindingFloors(candidateTask, candidateInstance),
    true,
  );
  assert.equal(
    matchesWorkflowChildParentBindingFloors(candidateTransition, candidateInstance),
    true,
  );

  assert.equal(JSON.stringify(candidateTask), beforeTask);
  assert.equal(JSON.stringify(candidateTransition), beforeTransition);
  assert.equal(JSON.stringify(candidateInstance), beforeInstance);
});
