import test from "node:test";
import assert from "node:assert/strict";
import { loadWorkflowTransitionInstanceCurrentEvidence } from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  sibling: "33333333-3333-4333-8333-333333333333",
  transition: "44444444-4444-4444-8444-444444444444",
  instance: "55555555-5555-4555-8555-555555555555",
  principal: "66666666-6666-4666-8666-666666666666",
  actor: "77777777-7777-4777-8777-777777777777",
  definition: "88888888-8888-4888-8888-888888888888",
  correlation: "99999999-9999-4999-8999-999999999999",
});
const requestContext = Object.freeze({
  requestId: "request-1", correlationId: "current-request-correlation",
  tenantId: ids.tenant, industryContextId: ids.industry,
  dataHomeId: "home-1", regionCode: "IN-CENTRAL",
  principalId: ids.principal, principalType: "HUMAN",
  orgUnitPath: Object.freeze([]), roleIds: Object.freeze([]), scopeClass: "TENANT_INDUSTRY",
});
const coreContext = Object.freeze({
  ...requestContext, industryContextId: undefined, scopeClass: "TENANT_CORE",
});
function transition(overrides = {}) {
  return Object.freeze({
    id: ids.transition, tenantId: ids.tenant, industryContextId: ids.industry,
    workflowInstanceId: ids.instance, fromState: "HISTORICAL_FROM",
    actionCode: "", toState: "HISTORICAL_TO", actorPrincipalId: ids.actor,
    reasonCode: "", expectedInstanceVersion: "9007199254740993",
    resultingInstanceVersion: "9007199254740994",
    occurredAt: "2026-09-10T00:00:00.000Z", correlationId: ids.correlation,
    ...overrides,
  });
}
function instance(overrides = {}) {
  return Object.freeze({
    id: ids.instance, tenantId: ids.tenant, industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY", workflowDefinitionId: ids.definition,
    workflowDefinitionVersion: 1, resourceType: "case", resourceId: "case-1",
    currentState: "LATER_STATE", lifecycleState: "COMPLETED",
    rowVersion: "9007199254740999", startedAt: "2026-09-01T00:00:00.000Z",
    createdBy: ids.principal, createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z", ...overrides,
  });
}
function fixture(overrides = {}) {
  const order = [], transitionCalls = [], instanceCalls = [];
  const transitionValue = Object.hasOwn(overrides, "transition") ? overrides.transition : transition();
  const instanceValue = Object.hasOwn(overrides, "instance") ? overrides.instance : instance();
  return {
    order, transitionCalls, instanceCalls, transitionValue, instanceValue,
    transitionReader: { async loadForContext(input) {
      order.push("transition"); transitionCalls.push(input);
      if (overrides.transitionError) throw overrides.transitionError;
      return transitionValue;
    } },
    instanceReader: { async loadForContext(input) {
      order.push("instance"); instanceCalls.push(input);
      if (overrides.instanceError) throw overrides.instanceError;
      return instanceValue;
    } },
  };
}
const load = (f, context = requestContext) => loadWorkflowTransitionInstanceCurrentEvidence(
  { requestContext: context, workflowTransitionId: ids.transition },
  f.transitionReader, f.instanceReader,
);

test("WTR-INSTREAD-BASE-001 exact visible transition is read once before parent access", async () => {
  const f = fixture();
  assert.ok(await load(f));
  assert.deepEqual(f.order, ["transition", "instance"]);
  assert.equal(f.transitionCalls.length, 1);
  assert.equal(f.transitionCalls[0].requestContext, requestContext);
  assert.equal(f.transitionCalls[0].workflowTransitionId, ids.transition);
});

test("WTR-INSTREAD-BASE-002 transition null and errors prevent parent access", async () => {
  const hidden = fixture({ transition: null });
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.instanceCalls, []);
  const expected = new Error("transition read unavailable");
  const broken = fixture({ transitionError: expected });
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.instanceCalls, []);
});

test("WTR-INSTREAD-INST-001 exact stored parent id is read once in the identical context", async () => {
  for (const context of [requestContext, coreContext]) {
    // The persisted parent differs from the input transition id: no alternate lookup.
    const core = context === coreContext;
    const f = fixture({
      transition: transition({ industryContextId: core ? undefined : ids.industry }),
      instance: instance({ industryContextId: core ? undefined : ids.industry,
        scopeClass: core ? "TENANT_CORE" : "TENANT_INDUSTRY" }),
    });
    assert.ok(await load(f, context));
    assert.equal(f.instanceCalls.length, 1);
    assert.equal(f.instanceCalls[0].requestContext, context);
    assert.equal(f.instanceCalls[0].workflowInstanceId, f.transitionValue.workflowInstanceId);
  }
});

test("WTR-INSTREAD-INST-002 hidden parent returns null and dependency error identity survives", async () => {
  const hidden = fixture({ instance: null });
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["transition", "instance"]);
  const expected = new Error("instance read unavailable");
  await assert.rejects(load(fixture({ instanceError: expected })), error => error === expected);
});

test("WTR-INSTREAD-FLOOR-001 DD-174 rejects wrong parent or Tenant/Industry ownership", async () => {
  assert.ok(await load(fixture()));
  for (const parent of [
    instance({ id: ids.definition }),
    instance({ tenantId: ids.actor }),
    instance({ industryContextId: ids.sibling }),
    instance({ industryContextId: undefined, scopeClass: "TENANT_CORE" }),
    instance({ industryContextId: undefined }),
    instance({ scopeClass: "TENANT_CORE" }),
    instance({ scopeClass: "PLATFORM_GLOBAL" }),
    instance({ id: "malformed" }),
  ]) assert.equal(await load(fixture({ instance: parent })), null);
  const coreTransition = transition({ industryContextId: undefined });
  assert.equal(await load(fixture({ transition: coreTransition })), null);
  assert.ok(await load(fixture({ transition: coreTransition,
    instance: instance({ industryContextId: undefined, scopeClass: "TENANT_CORE" }),
  }), coreContext));
});

test("WTR-INSTREAD-EVID-001 frozen envelope preserves exact references without mutation", async () => {
  const f = fixture();
  const before = JSON.stringify([f.transitionValue, f.instanceValue]);
  const result = await load(f);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.transition, f.transitionValue);
  assert.equal(result.instance, f.instanceValue);
  assert.deepEqual(Object.keys(result).sort(), ["instance", "transition"]);
  assert.equal(JSON.stringify([f.transitionValue, f.instanceValue]), before);
});

test("WTR-INSTREAD-HISTORY-001 historical state/version survives an advanced parent", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(result.transition.expectedInstanceVersion, "9007199254740993");
  assert.equal(result.transition.resultingInstanceVersion, "9007199254740994");
  assert.equal(result.instance.rowVersion, "9007199254740999");
  assert.equal(result.transition.fromState, "HISTORICAL_FROM");
  assert.equal(result.transition.toState, "HISTORICAL_TO");
  assert.equal(result.instance.currentState, "LATER_STATE");
  assert.equal(result.instance.lifecycleState, "COMPLETED");
  assert.equal(result.transition.actionCode, "");
  assert.equal(result.transition.reasonCode, "");
  assert.equal(result.transition.occurredAt, "2026-09-10T00:00:00.000Z");
  assert.equal(result.transition.correlationId, ids.correlation);
  assert.equal(result.transition.actorPrincipalId, ids.actor);
});

test("WTR-INSTREAD-BOUND-001 relationship evidence exposes no actor or execution authority", async () => {
  const result = await load(fixture());
  assert.ok(result);
  for (const key of ["actorCurrent", "actorAtOccurrenceValid", "stateMachineValid",
    "transitionAuthorized", "replayAuthorized", "taskActionAuthorized",
    "executionAuthorized", "mutation", "eventEmitted"]) {
    assert.equal(key in result, false);
  }
  assert.deepEqual(Object.keys(result).sort(), ["instance", "transition"]);
});
