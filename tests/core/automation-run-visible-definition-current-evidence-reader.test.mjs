import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAutomationRunDefinitionCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  run: "33333333-3333-4333-8333-333333333333",
  definition: "44444444-4444-4444-8444-444444444444",
  principal: "55555555-5555-4555-8555-555555555555",
  foreignTenant: "66666666-6666-4666-8666-666666666666",
  siblingIndustry: "77777777-7777-4777-8777-777777777777",
  wrongDefinition: "88888888-8888-4888-8888-888888888888",
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
    automationDefinitionId: ids.definition,
    triggerRef: "event:raw.trigger",
    idempotencyKeyHash: "raw-hash",
    status: "RUNNING",
    startedAt: "2026-10-02T00:00:00.000Z",
    completedAt: undefined,
    correlationId: "99999999-9999-4999-8999-999999999999",
    lastErrorCode: "RAW_ERROR",
    ...overrides,
  });
}

function definition(overrides = {}) {
  return Object.freeze({
    id: ids.definition,
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
    workflowDefinitionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
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

function fixture(overrides = {}) {
  const order = [];
  const calls = {run: [], definition: []};
  const runValue = Object.hasOwn(overrides, "run") ? overrides.run : run();
  const definitionValue = Object.hasOwn(overrides, "definition")
    ? overrides.definition
    : definition();

  return {
    order,
    calls,
    runValue,
    definitionValue,
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
        if (overrides.definitionResolver) {
          return overrides.definitionResolver(input);
        }
        return definitionValue;
      },
    },
  };
}

async function load(f, context = requestContext) {
  return loadAutomationRunDefinitionCurrentEvidence(
    {requestContext: context, automationRunId: ids.run},
    f.runReader,
    f.definitionReader,
  );
}

test("WFA-RUN-DEFREAD-BASE-001 exact RequestContext/id reaches AutomationRun first", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(f.order[0], "run");
  assert.equal(f.calls.run.length, 1);
  assert.equal(f.calls.run[0].requestContext, requestContext);
  assert.equal(f.calls.run[0].automationRunId, ids.run);
  assert.ok(f.order.indexOf("definition") > f.order.indexOf("run"));
});

test("WFA-RUN-DEFREAD-BASE-002 run null short-circuits and run error propagates", async () => {
  const absent = fixture({run: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.definition, []);

  const expected = new Error("automation-run-reader-failed");
  const broken = fixture({runError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.definition, []);
});

test("WFA-RUN-DEFREAD-DEF-001 visible run forwards exact same context and persisted definition id once", async () => {
  const industry = fixture();
  assert.ok(await load(industry));
  assert.equal(industry.calls.definition.length, 1);
  assert.equal(industry.calls.definition[0].requestContext, requestContext);
  assert.equal(
    industry.calls.definition[0].automationDefinitionId,
    industry.runValue.automationDefinitionId,
  );

  const tenantRun = run({industryContextId: undefined});
  const tenantDefinition = definition({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });
  const tenant = fixture({run: tenantRun, definition: tenantDefinition});
  assert.ok(await load(tenant, tenantCoreContext));
  assert.equal(tenant.calls.definition.length, 1);
  assert.equal(tenant.calls.definition[0].requestContext, tenantCoreContext);
  assert.equal(
    tenant.calls.definition[0].automationDefinitionId,
    tenantRun.automationDefinitionId,
  );
});

test("WFA-RUN-DEFREAD-DEF-002 definition null returns null and definition error propagates", async () => {
  const absent = fixture({definition: null});
  assert.equal(await load(absent), null);

  const expected = new Error("automation-definition-reader-failed");
  const broken = fixture({definitionError: expected});
  await assert.rejects(load(broken), error => error === expected);
});

test("WFA-RUN-DEFREAD-FLOOR-001 DD-175 exact ACTIVE/applicability floor is re-applied", async () => {
  assert.ok(await load(fixture()));

  for (const definitionValue of [
    definition({id: ids.wrongDefinition}),
    definition({status: "RETIRED"}),
    definition({tenantId: ids.foreignTenant}),
    definition({industryContextId: ids.siblingIndustry}),
    definition({ownerScope: "TENANT", tenantId: undefined, industryContextId: undefined}),
  ]) {
    assert.equal(await load(fixture({definition: definitionValue})), null);
  }
});

test("WFA-RUN-DEFREAD-NOFALLBACK-001 hidden PLATFORM definition remains null with no context fallback", async () => {
  const platformDefinition = definition({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });
  const f = fixture({
    definitionResolver(input) {
      return input.requestContext.scopeClass === "PLATFORM_GLOBAL"
        ? platformDefinition
        : null;
    },
  });

  assert.equal(await load(f), null);
  assert.equal(f.calls.definition.length, 1);
  assert.equal(f.calls.definition[0].requestContext, requestContext);
  assert.equal(f.calls.definition[0].requestContext.scopeClass, "TENANT_INDUSTRY");
  assert.equal(
    f.calls.definition.some(call => call.requestContext.scopeClass === "PLATFORM_GLOBAL"),
    false,
  );
});

test("WFA-RUN-DEFREAD-EVID-001 success preserves exact identities in frozen evidence", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(result.run, f.runValue);
  assert.equal(result.definition, f.definitionValue);
  assert.equal(Object.isFrozen(result), true);
});

test("WFA-RUN-DEFREAD-BOUND-001 raw Automation semantics remain uninterpreted", async () => {
  const f = fixture();
  const beforeRun = JSON.stringify(f.runValue);
  const beforeDefinition = JSON.stringify(f.definitionValue);
  const result = await load(f);
  assert.ok(result);
  assert.equal(JSON.stringify(f.runValue), beforeRun);
  assert.equal(JSON.stringify(f.definitionValue), beforeDefinition);
  assert.equal(result.run.triggerRef, "event:raw.trigger");
  assert.equal(result.run.idempotencyKeyHash, "raw-hash");
  assert.equal(result.run.status, "RUNNING");
  assert.equal(result.run.lastErrorCode, "RAW_ERROR");
  assert.equal(result.definition.version, 7);
  assert.deepEqual(result.definition.triggerConfig, {eventType: "raw.event"});
  assert.deepEqual(result.definition.config, {mode: "raw"});
  assert.equal(result.definition.conditionRuleRef, "rule.raw");
  assert.equal(result.definition.operationContractId, "core.raw.operation");
  assert.equal(result.definition.workflowDefinitionId, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

  for (const forbidden of [
    "definitionSelected",
    "triggerMatched",
    "conditionSatisfied",
    "retryable",
    "nextStatus",
    "operationAuthorized",
    "workflowAuthorized",
    "executionAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
