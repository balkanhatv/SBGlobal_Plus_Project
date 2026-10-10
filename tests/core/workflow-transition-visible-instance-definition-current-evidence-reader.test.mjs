import test from "node:test";
import assert from "node:assert/strict";

import {
  loadWorkflowTransitionInstanceDefinitionCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  sibling: "33333333-3333-4333-8333-333333333333",
  transition: "44444444-4444-4444-8444-444444444444",
  instance: "55555555-5555-4555-8555-555555555555",
  definition: "66666666-6666-4666-8666-666666666666",
  principal: "77777777-7777-4777-8777-777777777777",
  actor: "88888888-8888-4888-8888-888888888888",
  correlation: "99999999-9999-4999-8999-999999999999",
});

const requestContext = Object.freeze({
  requestId: "request-1",
  correlationId: "current-request-correlation",
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

const coreContext = Object.freeze({
  ...requestContext,
  industryContextId: undefined,
  scopeClass: "TENANT_CORE",
});

function transition(overrides = {}) {
  return Object.freeze({
    id: ids.transition,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    workflowInstanceId: ids.instance,
    fromState: "HISTORICAL_FROM",
    actionCode: "historical.action",
    toState: "HISTORICAL_TO",
    actorPrincipalId: ids.actor,
    reasonCode: "historical.reason",
    expectedInstanceVersion: "9007199254740993",
    resultingInstanceVersion: "9007199254740994",
    occurredAt: "2026-09-10T00:00:00.000Z",
    correlationId: ids.correlation,
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
    currentState: "LATER_STATE",
    lifecycleState: "COMPLETED",
    rowVersion: "9007199254740999",
    startedAt: "2026-09-01T00:00:00.000Z",
    completedAt: "2026-10-01T00:00:00.000Z",
    createdBy: ids.principal,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
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
    approvedBy: ids.actor,
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2027-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {transition: [], instance: [], definition: []};
  const values = {
    transition: Object.hasOwn(overrides, "transition")
      ? overrides.transition
      : transition(),
    instance: Object.hasOwn(overrides, "instance")
      ? overrides.instance
      : instance(),
    definition: Object.hasOwn(overrides, "definition")
      ? overrides.definition
      : definition(),
  };

  return {
    order,
    calls,
    values,
    transitionReader: {
      async loadForContext(input) {
        order.push("transition");
        calls.transition.push(input);
        if (overrides.transitionError) throw overrides.transitionError;
        return values.transition;
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

async function load(f, context = requestContext) {
  return loadWorkflowTransitionInstanceDefinitionCurrentEvidence(
    {
      requestContext: context,
      workflowTransitionId: ids.transition,
    },
    f.transitionReader,
    f.instanceReader,
    f.definitionReader,
  );
}

test("WTR-DEFREAD-BASE-001 exact DD-367 parent chain is established first", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.deepEqual(f.order, ["transition", "instance", "definition"]);
  assert.equal(f.calls.transition.length, 1);
  assert.equal(f.calls.transition[0].requestContext, requestContext);
  assert.equal(f.calls.transition[0].workflowTransitionId, ids.transition);
  assert.equal(result.parent.transition, f.values.transition);
  assert.equal(result.parent.instance, f.values.instance);
});

test("WTR-DEFREAD-BASE-002 DD-367 null/error short-circuits or propagates before definition access", async () => {
  const hidden = fixture({transition: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.calls.definition, []);

  const expected = new Error("instance-read-failed");
  const broken = fixture({instanceError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.definition, []);
});

test("WTR-DEFREAD-DEF-001 exact persisted definition id and identical context are read once for Core and Industry", async () => {
  for (const context of [requestContext, coreContext]) {
    const core = context === coreContext;
    const f = fixture({
      transition: transition({
        industryContextId: core ? undefined : ids.industry,
      }),
      instance: instance({
        industryContextId: core ? undefined : ids.industry,
        scopeClass: core ? "TENANT_CORE" : "TENANT_INDUSTRY",
      }),
      definition: definition(core ? {
        ownerScope: "TENANT",
        tenantId: ids.tenant,
        industryContextId: undefined,
      } : {}),
    });

    assert.ok(await load(f, context));
    assert.equal(f.calls.definition.length, 1);
    assert.equal(f.calls.definition[0].requestContext, context);
    assert.equal(
      f.calls.definition[0].workflowDefinitionId,
      f.values.instance.workflowDefinitionId,
    );
  }
});

test("WTR-DEFREAD-DEF-002 hidden definition returns null and dependency errors propagate unchanged", async () => {
  const hidden = fixture({definition: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["transition", "instance", "definition"]);

  const expected = new Error("definition-read-failed");
  const broken = fixture({definitionError: expected});
  await assert.rejects(load(broken), error => error === expected);
});

test("WTR-DEFREAD-FLOOR-001 DD-173 exact ACTIVE/version/applicability floor passes or fails closed", async () => {
  assert.ok(await load(fixture()));

  for (const definitionValue of [
    definition({status: "RETIRED"}),
    definition({version: 4}),
    definition({tenantId: ids.actor}),
    definition({industryContextId: ids.sibling}),
    definition({id: ids.instance}),
  ]) {
    assert.equal(await load(fixture({definition: definitionValue})), null);
  }
});

test("WTR-DEFREAD-NOFALLBACK-001 hidden referenced definition has no PLATFORM_GLOBAL or alternate-context fallback", async () => {
  const f = fixture({definition: null});
  assert.equal(await load(f), null);
  assert.equal(f.calls.definition.length, 1);
  assert.equal(f.calls.definition[0].requestContext, requestContext);
  assert.equal(
    f.calls.definition.some(
      call => call.requestContext.scopeClass === "PLATFORM_GLOBAL",
    ),
    false,
  );
});

test("WTR-DEFREAD-EVID-001 success preserves exact parent/definition references and performs no second instance read", async () => {
  const f = fixture();
  const before = JSON.stringify([
    f.values.transition,
    f.values.instance,
    f.values.definition,
  ]);
  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.parent.transition, f.values.transition);
  assert.equal(result.parent.instance, f.values.instance);
  assert.equal(result.definition, f.values.definition);
  assert.equal(f.calls.instance.length, 1);
  assert.equal(
    JSON.stringify([
      f.values.transition,
      f.values.instance,
      f.values.definition,
    ]),
    before,
  );
});

test("WTR-DEFREAD-HISTORY-001 historical transition evidence remains valid beside advanced current instance/definition", async () => {
  const result = await load(fixture());
  assert.ok(result);
  assert.equal(result.parent.transition.expectedInstanceVersion, "9007199254740993");
  assert.equal(result.parent.transition.resultingInstanceVersion, "9007199254740994");
  assert.equal(result.parent.instance.rowVersion, "9007199254740999");
  assert.equal(result.parent.transition.fromState, "HISTORICAL_FROM");
  assert.equal(result.parent.transition.toState, "HISTORICAL_TO");
  assert.equal(result.parent.transition.actionCode, "historical.action");
  assert.equal(result.parent.instance.currentState, "LATER_STATE");
  assert.equal(result.parent.instance.lifecycleState, "COMPLETED");
  assert.deepEqual(result.definition.stateMachine, {opaque: true});
});

test("WTR-DEFREAD-BOUND-001 evidence grants no actor/action/state-machine/replay/mutation/execution authority", async () => {
  const result = await load(fixture());
  assert.ok(result);
  for (const forbidden of [
    "actorCurrent",
    "actorAtOccurrenceValid",
    "actionStateMachineCompatible",
    "currentStateValid",
    "transitionAuthorized",
    "replayAuthorized",
    "taskActionAuthorized",
    "guardResult",
    "mutation",
    "eventEmitted",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
