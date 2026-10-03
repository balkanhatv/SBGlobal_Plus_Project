import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIAgentRunDefinitionToolSetCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  run: "33333333-3333-4333-8333-333333333333",
  definition: "44444444-4444-4444-8444-444444444444",
  principal: "55555555-5555-4555-8555-555555555555",
  membership: "66666666-6666-4666-8666-666666666666",
  toolSet: "77777777-7777-4777-8777-777777777777",
  approval: "88888888-8888-4888-8888-888888888888",
  budget: "99999999-9999-4999-8999-999999999999",
  foreignTenant: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  siblingIndustry: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  wrongToolSet: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  correlation: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
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
    agentDefinitionId: ids.definition,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    actingPrincipalId: ids.principal,
    membershipId: ids.membership,
    entitlementSnapshotVersion: "snapshot-7",
    permissionVersion: "permission-9",
    requestedResourceScope: Object.freeze({
      resources: Object.freeze(["raw-resource"]),
    }),
    status: "RUNNING",
    stepBudgetClass: "RAW_STEP_BUDGET",
    tokenBudgetClass: "RAW_TOKEN_BUDGET",
    startedAt: "2026-10-02T00:00:00.000Z",
    completedAt: undefined,
    correlationId: ids.correlation,
    ...overrides,
  });
}

function definition(overrides = {}) {
  return Object.freeze({
    id: ids.definition,
    ownerScope: "INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    code: "agent.raw",
    objectiveClass: "RAW_OBJECTIVE",
    allowedToolSetId: ids.toolSet,
    maxRiskClass: "RAW_RISK",
    approvalPolicyId: ids.approval,
    budgetPolicyId: ids.budget,
    version: 7,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  });
}

function toolSet(overrides = {}) {
  return Object.freeze({
    id: ids.toolSet,
    ownerScope: "TENANT",
    tenantId: ids.tenant,
    industryContextId: undefined,
    code: "toolset.raw",
    version: 11,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {run: [], definition: [], toolSet: []};
  const runValue = Object.hasOwn(overrides, "run") ? overrides.run : run();
  const definitionValue = Object.hasOwn(overrides, "definition")
    ? overrides.definition
    : definition();
  const toolSetValue = Object.hasOwn(overrides, "toolSet")
    ? overrides.toolSet
    : toolSet();

  return {
    order,
    calls,
    runValue,
    definitionValue,
    toolSetValue,
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
    toolSetReader: {
      async loadForContext(input) {
        order.push("toolSet");
        calls.toolSet.push(input);
        if (overrides.toolSetError) throw overrides.toolSetError;
        if (overrides.toolSetResolver) return overrides.toolSetResolver(input);
        return toolSetValue;
      },
    },
  };
}

async function load(f, context = requestContext) {
  return loadAIAgentRunDefinitionToolSetCurrentEvidence(
    {requestContext: context, agentRunId: ids.run},
    f.runReader,
    f.definitionReader,
    f.toolSetReader,
  );
}

test("AIARUN-TOOLSETREAD-BASE-001 DD-392 parent evidence runs first with exact context/id", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.deepEqual(f.order.slice(0, 3), ["run", "definition", "toolSet"]);
  assert.equal(f.calls.run.length, 1);
  assert.equal(f.calls.run[0].requestContext, requestContext);
  assert.equal(f.calls.run[0].agentRunId, ids.run);
});

test("AIARUN-TOOLSETREAD-BASE-002 DD-392 null/error short-circuits ToolSet access", async () => {
  const absent = fixture({run: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.definition, []);
  assert.deepEqual(absent.calls.toolSet, []);

  const expected = new Error("agent-run-reader-failed");
  const broken = fixture({runError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.definition, []);
  assert.deepEqual(broken.calls.toolSet, []);
});

test("AIARUN-TOOLSETREAD-TOOLSET-001 exact persisted ToolSet id uses same context once without definition re-read", async () => {
  const f = fixture();
  assert.ok(await load(f));
  assert.equal(f.calls.definition.length, 1);
  assert.equal(f.calls.toolSet.length, 1);
  assert.equal(f.calls.toolSet[0].requestContext, requestContext);
  assert.equal(f.calls.toolSet[0].toolSetId, f.definitionValue.allowedToolSetId);

  const tenantRun = run({industryContextId: undefined});
  const tenantDefinition = definition({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });
  const tenantToolSet = toolSet({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });
  const tenant = fixture({
    run: tenantRun,
    definition: tenantDefinition,
    toolSet: tenantToolSet,
  });
  assert.ok(await load(tenant, tenantCoreContext));
  assert.equal(tenant.calls.definition.length, 1);
  assert.equal(tenant.calls.toolSet.length, 1);
  assert.equal(tenant.calls.toolSet[0].requestContext, tenantCoreContext);
  assert.equal(tenant.calls.toolSet[0].toolSetId, ids.toolSet);
});

test("AIARUN-TOOLSETREAD-TOOLSET-002 ToolSet null returns null and ToolSet error propagates", async () => {
  const absent = fixture({toolSet: null});
  assert.equal(await load(absent), null);

  const expected = new Error("tool-set-reader-failed");
  const broken = fixture({toolSetError: expected});
  await assert.rejects(load(broken), error => error === expected);
});

test("AIARUN-TOOLSETREAD-FLOOR-001 DD-180 exact ACTIVE broader-or-equal binding is re-applied", async () => {
  assert.ok(await load(fixture()));

  for (const toolSetValue of [
    toolSet({id: ids.wrongToolSet}),
    toolSet({status: "RETIRED"}),
    toolSet({tenantId: ids.foreignTenant}),
    toolSet({
      ownerScope: "INDUSTRY",
      tenantId: ids.tenant,
      industryContextId: ids.siblingIndustry,
    }),
    toolSet({
      ownerScope: "TENANT",
      tenantId: undefined,
      industryContextId: undefined,
    }),
  ]) {
    assert.equal(await load(fixture({toolSet: toolSetValue})), null);
  }

  const tenantRun = run({industryContextId: undefined});
  const tenantDefinition = definition({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });
  const narrowerIndustryToolSet = toolSet({
    ownerScope: "INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
  });
  assert.equal(
    await load(
      fixture({
        run: tenantRun,
        definition: tenantDefinition,
        toolSet: narrowerIndustryToolSet,
      }),
      tenantCoreContext,
    ),
    null,
  );
});

test("AIARUN-TOOLSETREAD-NOFALLBACK-001 hidden PLATFORM ToolSet remains null with no context fallback", async () => {
  const tenantRun = run({industryContextId: undefined});
  const tenantDefinition = definition({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });
  const platformToolSet = toolSet({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });
  const f = fixture({
    run: tenantRun,
    definition: tenantDefinition,
    toolSetResolver(input) {
      return input.requestContext.scopeClass === "PLATFORM_GLOBAL"
        ? platformToolSet
        : null;
    },
  });

  assert.equal(await load(f, tenantCoreContext), null);
  assert.equal(f.calls.definition.length, 1);
  assert.equal(f.calls.toolSet.length, 1);
  assert.equal(f.calls.toolSet[0].requestContext, tenantCoreContext);
  assert.equal(
    f.calls.toolSet.some(call => call.requestContext.scopeClass === "PLATFORM_GLOBAL"),
    false,
  );
});

test("AIARUN-TOOLSETREAD-EVID-001 success preserves exact nested identities in frozen evidence", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(result.runDefinition.run, f.runValue);
  assert.equal(result.runDefinition.definition, f.definitionValue);
  assert.equal(result.toolSet, f.toolSetValue);
  assert.equal(Object.isFrozen(result.runDefinition), true);
  assert.equal(Object.isFrozen(result), true);
});

test("AIARUN-TOOLSETREAD-BOUND-001 combined raw Agent/ToolSet evidence remains uninterpreted", async () => {
  const f = fixture();
  const beforeRun = JSON.stringify(f.runValue);
  const beforeDefinition = JSON.stringify(f.definitionValue);
  const beforeToolSet = JSON.stringify(f.toolSetValue);
  const result = await load(f);
  assert.ok(result);

  assert.equal(JSON.stringify(f.runValue), beforeRun);
  assert.equal(JSON.stringify(f.definitionValue), beforeDefinition);
  assert.equal(JSON.stringify(f.toolSetValue), beforeToolSet);
  assert.equal(result.runDefinition.run.actingPrincipalId, ids.principal);
  assert.equal(result.runDefinition.run.entitlementSnapshotVersion, "snapshot-7");
  assert.equal(result.runDefinition.run.permissionVersion, "permission-9");
  assert.equal(result.runDefinition.definition.objectiveClass, "RAW_OBJECTIVE");
  assert.equal(result.runDefinition.definition.maxRiskClass, "RAW_RISK");
  assert.equal(result.runDefinition.definition.approvalPolicyId, ids.approval);
  assert.equal(result.runDefinition.definition.budgetPolicyId, ids.budget);
  assert.equal(result.toolSet.code, "toolset.raw");
  assert.equal(result.toolSet.version, 11);
  assert.equal(result.toolSet.status, "ACTIVE");

  for (const forbidden of [
    "toolSetMembers",
    "toolEligible",
    "permissionAuthorized",
    "entitlementAuthorized",
    "approvalSatisfied",
    "definitionSelected",
    "stepPlanned",
    "operationAuthorized",
    "providerAuthorized",
    "modelAuthorized",
    "mutation",
    "eventEmitted",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
