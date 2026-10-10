import test from "node:test";
import assert from "node:assert/strict";

import {
  loadWorkflowInstanceDefinitionCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  instance: "33333333-3333-4333-8333-333333333333",
  definition: "44444444-4444-4444-8444-444444444444",
  principal: "55555555-5555-4555-8555-555555555555",
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
    rowVersion: "-4",
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
  const calls = {instance: [], definition: []};
  const instanceValue = Object.hasOwn(overrides, "instance")
    ? overrides.instance
    : instance();
  const definitionValue = Object.hasOwn(overrides, "definition")
    ? overrides.definition
    : definition();
  return {
    order,
    calls,
    instanceValue,
    definitionValue,
    instanceReader: {
      async loadForContext(input) {
        order.push("instance");
        calls.instance.push(input);
        if (overrides.instanceError) throw overrides.instanceError;
        return instanceValue;
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
  };
}

async function load(f) {
  return loadWorkflowInstanceDefinitionCurrentEvidence(
    {requestContext, workflowInstanceId: ids.instance},
    f.instanceReader,
    f.definitionReader,
  );
}

test("WFI-DEFREAD-BASE-001 exact RequestContext/id reaches WorkflowInstance first", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(f.order[0], "instance");
  assert.equal(f.calls.instance.length, 1);
  assert.equal(f.calls.instance[0].requestContext, requestContext);
  assert.equal(f.calls.instance[0].workflowInstanceId, ids.instance);
  assert.ok(f.order.indexOf("definition") > f.order.indexOf("instance"));
});

test("WFI-DEFREAD-BASE-002 parent null short-circuits and parent error propagates", async () => {
  const absent = fixture({instance: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.definition, []);

  const expected = new Error("instance-reader-failed");
  const broken = fixture({instanceError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.definition, []);
});

test("WFI-DEFREAD-DEF-001 visible parent forwards exact same context and persisted definition id once", async () => {
  const f = fixture();
  assert.ok(await load(f));
  assert.equal(f.calls.definition.length, 1);
  assert.equal(f.calls.definition[0].requestContext, requestContext);
  assert.equal(
    f.calls.definition[0].workflowDefinitionId,
    f.instanceValue.workflowDefinitionId,
  );
});

test("WFI-DEFREAD-DEF-002 definition null returns null and definition error propagates", async () => {
  const absent = fixture({definition: null});
  assert.equal(await load(absent), null);

  const expected = new Error("definition-reader-failed");
  const broken = fixture({definitionError: expected});
  await assert.rejects(load(broken), error => error === expected);
});

test("WFI-DEFREAD-FLOOR-001 DD-173 exact ACTIVE/version/applicability floor is re-applied", async () => {
  assert.ok(await load(fixture()));

  for (const definitionValue of [
    definition({status: "RETIRED"}),
    definition({version: 4}),
    definition({tenantId: "66666666-6666-4666-8666-666666666666"}),
    definition({industryContextId: "77777777-7777-4777-8777-777777777777"}),
  ]) {
    assert.equal(await load(fixture({definition: definitionValue})), null);
  }
});

test("WFI-DEFREAD-NOFALLBACK-001 hidden definition remains null with no context fallback", async () => {
  const f = fixture({definition: null});
  assert.equal(await load(f), null);
  assert.equal(f.calls.definition.length, 1);
  assert.equal(f.calls.definition[0].requestContext, requestContext);
  assert.equal(f.calls.definition[0].requestContext.scopeClass, "TENANT_INDUSTRY");
  assert.equal(
    f.calls.definition.some(call => call.requestContext.scopeClass === "PLATFORM_GLOBAL"),
    false,
  );
});

test("WFI-DEFREAD-EVID-001 success preserves exact identities in frozen evidence", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(result.instance, f.instanceValue);
  assert.equal(result.definition, f.definitionValue);
  assert.equal(Object.isFrozen(result), true);
});

test("WFI-DEFREAD-BOUND-001 raw workflow semantics remain uninterpreted", async () => {
  const f = fixture();
  const beforeInstance = JSON.stringify(f.instanceValue);
  const beforeDefinition = JSON.stringify(f.definitionValue);
  const result = await load(f);
  assert.ok(result);
  assert.equal(JSON.stringify(f.instanceValue), beforeInstance);
  assert.equal(JSON.stringify(f.definitionValue), beforeDefinition);
  assert.equal(result.instance.currentState, "RAW_STATE");
  assert.equal(result.instance.lifecycleState, "WAITING");
  assert.deepEqual(result.definition.stateMachine, {opaque: true});
  assert.deepEqual(result.definition.approvalPolicy, {raw: "policy"});
  assert.deepEqual(result.definition.ruleRefs, ["rule.raw"]);

  for (const forbidden of [
    "creatorCurrent",
    "definitionSelected",
    "currentStateValid",
    "transitionAuthorized",
    "taskAuthorized",
    "executionAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
