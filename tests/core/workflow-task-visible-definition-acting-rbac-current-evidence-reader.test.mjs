import test from "node:test";
import assert from "node:assert/strict";

import {
  loadWorkflowTaskDefinitionActingRbacCurrentEvidence,
} from "../../dist/core/index.js";

const PERMISSION = "workflow.task.action.approve";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  siblingIndustry: "23232323-2323-4232-8232-232323232323",
  task: "33333333-3333-4333-8333-333333333333",
  instance: "44444444-4444-4444-8444-444444444444",
  definition: "55555555-5555-4555-8555-555555555555",
  principal: "66666666-6666-4666-8666-666666666666",
  subject: "77777777-7777-4777-8777-777777777777",
  roleA: "88888888-8888-4888-8888-888888888888",
  roleB: "99999999-9999-4999-8999-999999999999",
  policy: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
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
    membershipId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([ids.roleA, ids.roleB]),
    permissionVersion: 13,
    entitlementSnapshotVersion: 17,
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
    permissionCode: PERMISSION,
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

function authorizationState(overrides = {}) {
  const snapshotOverrides = overrides.permissionSnapshot ?? {};
  const policies = Object.hasOwn(overrides, "policies")
    ? overrides.policies
    : Object.freeze([
      Object.freeze({
        id: ids.policy,
        code: "raw-policy",
        tenantId: ids.tenant,
        industryContextId: ids.industry,
        permissionPattern: PERMISSION,
        priority: 10,
        effect: "DENY",
        expressionVersion: 1,
        expression: Object.freeze({
          op: "eq",
          attribute: "environment.region",
          value: "OUTSIDE",
        }),
      }),
    ]);

  return Object.freeze({
    permissionSnapshot: Object.freeze({
      scopeClass: "TENANT_INDUSTRY",
      permissionVersion: 13,
      roleIds: Object.freeze([ids.roleA, ids.roleB]),
      permissionSet: Object.freeze({
        permissions: Object.freeze([
          Object.freeze({code: PERMISSION, effect: "ALLOW"}),
        ]),
      }),
      sourceFingerprint: "fingerprint-1",
      ...snapshotOverrides,
    }),
    policies,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {task: [], instance: [], definition: [], authorization: []};
  const values = {
    task: Object.hasOwn(overrides, "task") ? overrides.task : task(),
    instance: Object.hasOwn(overrides, "instance") ? overrides.instance : instance(),
    definition: Object.hasOwn(overrides, "definition") ? overrides.definition : definition(),
    authorizationState: Object.hasOwn(overrides, "authorizationState")
      ? overrides.authorizationState
      : authorizationState(),
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
    authorizationReader: {
      async load(input) {
        order.push("authorization");
        calls.authorization.push(input);
        if (overrides.authorizationError) throw overrides.authorizationError;
        return values.authorizationState;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadWorkflowTaskDefinitionActingRbacCurrentEvidence(
    {
      requestContext: requestContext(),
      workflowTaskId: ids.task,
      ...inputOverrides,
    },
    f.taskReader,
    f.instanceReader,
    f.definitionReader,
    f.authorizationReader,
  );
}

test("WFT-DEFRBAC-BASE-001 exact DD-482 parent evidence is established before Authorization access", async () => {
  const f = fixture();
  const ctx = requestContext();
  const result = await load(f, {requestContext: ctx});
  assert.ok(result);
  assert.deepEqual(f.order, ["task", "instance", "definition", "authorization"]);
  assert.equal(f.calls.task.length, 1);
  assert.equal(f.calls.instance.length, 1);
  assert.equal(f.calls.definition.length, 1);
  assert.equal(f.calls.authorization.length, 1);
  assert.equal(f.calls.task[0].requestContext, ctx);
  assert.equal(result.parent.parent.task, f.values.task);
  assert.equal(result.parent.parent.instance, f.values.instance);
  assert.equal(result.parent.definition, f.values.definition);
});

test("WFT-DEFRBAC-BASE-002 DD-482 null/error short-circuits or propagates before Authorization access", async () => {
  const absent = fixture({definition: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.authorization, []);

  const expected = new Error("definition-failed");
  const broken = fixture({definitionError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.authorization, []);
});

test("WFT-DEFRBAC-READ-001 exactly one Authorization read receives identical context and exact persisted permissionCode", async () => {
  const f = fixture();
  const ctx = requestContext();
  assert.ok(await load(f, {requestContext: ctx}));
  assert.equal(f.calls.authorization.length, 1);
  assert.equal(f.calls.authorization[0].requestContext, ctx);
  assert.equal(f.calls.authorization[0].permissionCode, PERMISSION);

  const raw = fixture({task: task({permissionCode: ""})});
  assert.equal(await load(raw), null);
  assert.equal(raw.calls.authorization.length, 1);
  assert.equal(raw.calls.authorization[0].permissionCode, "");
});

test("WFT-DEFRBAC-READ-002 Authorization errors propagate unchanged with no definition-derived permission fallback", async () => {
  const expected = new Error("authorization-unavailable");
  const f = fixture({authorizationError: expected});
  await assert.rejects(load(f), error => error === expected);
  assert.equal(f.calls.authorization.length, 1);
  assert.equal(f.calls.authorization[0].permissionCode, PERMISSION);
  assert.deepEqual(f.values.definition.approvalPolicy, {raw: "policy"});
  assert.deepEqual(f.values.definition.ruleRefs, ["rule.raw"]);
});

test("WFT-DEFRBAC-CUR-001 exact protected Tenant snapshot plus one ALLOW passes and preserves exact permission", async () => {
  const industryState = authorizationState();
  const industry = fixture({authorizationState: industryState});
  const industryResult = await load(industry);
  assert.ok(industryResult);
  assert.equal(industryResult.permission, industryState.permissionSnapshot.permissionSet.permissions[0]);

  const coreContext = requestContext({
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
  });
  const coreState = authorizationState({
    permissionSnapshot: {scopeClass: "TENANT_CORE"},
  });
  const core = fixture({
    task: task({industryContextId: undefined}),
    instance: instance({industryContextId: undefined, scopeClass: "TENANT_CORE"}),
    definition: definition({
      ownerScope: "TENANT",
      industryContextId: undefined,
    }),
    authorizationState: coreState,
  });
  const coreResult = await load(core, {requestContext: coreContext});
  assert.ok(coreResult);
  assert.equal(coreResult.permission, coreState.permissionSnapshot.permissionSet.permissions[0]);
});

test("WFT-DEFRBAC-CUR-002 stale/mismatched snapshot or missing/DENY/duplicate exact permission fails closed", async () => {
  const cases = [
    {
      context: requestContext(),
      state: authorizationState({permissionSnapshot: {scopeClass: "TENANT_CORE"}}),
    },
    {
      context: requestContext({permissionVersion: undefined}),
      state: authorizationState(),
    },
    {
      context: requestContext({permissionVersion: 12}),
      state: authorizationState(),
    },
    {
      context: requestContext(),
      state: authorizationState({permissionSnapshot: {roleIds: Object.freeze([ids.roleB, ids.roleA])}}),
    },
    {
      context: requestContext(),
      state: authorizationState({permissionSnapshot: {
        permissionSet: Object.freeze({permissions: Object.freeze([])}),
      }}),
    },
    {
      context: requestContext(),
      state: authorizationState({permissionSnapshot: {
        permissionSet: Object.freeze({permissions: Object.freeze([
          Object.freeze({code: PERMISSION, effect: "DENY"}),
        ])}),
      }}),
    },
    {
      context: requestContext(),
      state: authorizationState({permissionSnapshot: {
        permissionSet: Object.freeze({permissions: Object.freeze([
          Object.freeze({code: PERMISSION, effect: "ALLOW"}),
          Object.freeze({code: PERMISSION, effect: "ALLOW"}),
        ])}),
      }}),
    },
  ];

  for (const candidate of cases) {
    const f = fixture({authorizationState: candidate.state});
    assert.equal(await load(f, {requestContext: candidate.context}), null);
    assert.equal(f.calls.authorization.length, 1);
  }
});

test("WFT-DEFRBAC-EVID-001 success preserves exact parent definition state permission and raw ABAC references unchanged", async () => {
  const state = authorizationState();
  const f = fixture({authorizationState: state});
  const before = JSON.stringify([
    f.values.task,
    f.values.instance,
    f.values.definition,
    state,
  ]);

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.parent.parent.task, f.values.task);
  assert.equal(result.parent.parent.instance, f.values.instance);
  assert.equal(result.parent.definition, f.values.definition);
  assert.equal(result.authorizationState, state);
  assert.equal(result.authorizationState.policies, state.policies);
  assert.equal(result.permission, state.permissionSnapshot.permissionSet.permissions[0]);
  assert.equal(
    JSON.stringify([
      f.values.task,
      f.values.instance,
      f.values.definition,
      state,
    ]),
    before,
  );
});

test("WFT-DEFRBAC-BOUND-001 output grants no assignment action definition semantics authorization transition mutation worker or execution authority", async () => {
  const result = await load(fixture());
  assert.ok(result);
  assert.deepEqual(result.parent.definition.stateMachine, {opaque: true});
  assert.deepEqual(result.parent.definition.approvalPolicy, {raw: "policy"});
  assert.deepEqual(result.parent.definition.ruleRefs, ["rule.raw"]);

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
    "effectiveNow",
    "currentStateValid",
    "authorizationDecision",
    "accessDecision",
    "guardResult",
    "transitionAuthorized",
    "mutation",
    "eventEmitted",
    "workerAuthorized",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
