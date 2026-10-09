import test from "node:test";
import assert from "node:assert/strict";
import { loadAICostTokenUsageCurrentEvidence } from "../../dist/core/index.js";

const ids = Object.freeze({
  usage: "11111111-1111-4111-8111-111111111111",
  otherUsage: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  principal: "55555555-5555-4555-8555-555555555555",
  provider: "66666666-6666-4666-8666-666666666666",
  model: "77777777-7777-4777-8777-777777777777",
});
function context(overrides = {}) {
  return Object.freeze({
    requestId: "cost-request", correlationId: "cost-correlation",
    tenantId: ids.tenant, industryContextId: ids.industry,
    principalId: ids.principal, principalType: "HUMAN",
    scopeClass: "TENANT_INDUSTRY", orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]), permissionVersion: 1,
    entitlementSnapshotVersion: 1, dataHomeId: "home", regionCode: "IN-CENTRAL",
    ...overrides,
  });
}
function cost(overrides = {}) {
  return Object.freeze({
    usageId: ids.usage, costCurrency: "INR",
    estimatedMinorUnits: "90071992547409931234567890123",
    providerRateVersion: "opaque-rate", billableClass: "",
    finalizedAt: "not-a-parsed-date", ...overrides,
  });
}
function usage(overrides = {}) {
  return Object.freeze({
    id: ids.usage, tenantId: ids.tenant, industryContextId: ids.industry,
    principalId: ids.principal, capabilityCode: "CHAT",
    providerId: ids.provider, modelId: ids.model,
    inputUnits: "900719925474099312345678901234567",
    outputUnits: "000001", mediaUnits: "-999",
    occurredAt: "opaque-occurred", correlationId: "opaque-correlation",
    ...overrides,
  });
}
function fixture(overrides = {}) {
  const value = {
    cost: Object.hasOwn(overrides, "cost") ? overrides.cost : cost(),
    usage: Object.hasOwn(overrides, "usage") ? overrides.usage : usage(),
  };
  const order = [], costCalls = [], usageCalls = [];
  return {
    value, order, costCalls, usageCalls,
    costReader: {
      async loadForContext(input) {
        order.push("cost"); costCalls.push(input);
        if (overrides.costError) throw overrides.costError;
        return value.cost;
      },
    },
    usageReader: {
      async loadForContext(input) {
        order.push("usage"); usageCalls.push(input);
        if (overrides.usageError) throw overrides.usageError;
        return value.usage;
      },
    },
  };
}
function load(f, requestContext = context(), usageId = ids.usage) {
  return loadAICostTokenUsageCurrentEvidence(
    { requestContext, usageId }, f.costReader, f.usageReader,
  );
}

test("AICOST-USAGEREAD-BASE-001 cost first, once; unchanged id and context identity", async () => {
  const f = fixture(), ctx = context();
  assert.ok(await load(f, ctx));
  assert.deepEqual(f.order, ["cost", "usage"]);
  assert.equal(f.costCalls.length, 1);
  assert.equal(f.costCalls[0].usageId, ids.usage);
  assert.equal(f.costCalls[0].requestContext, ctx);
});

test("AICOST-USAGEREAD-BASE-002 null cost and original errors short circuit", async () => {
  const absent = fixture({ cost: null });
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.order, ["cost"]);
  const error = new Error("cost dependency error");
  const broken = fixture({ costError: error });
  await assert.rejects(load(broken), e => e === error);
  assert.deepEqual(broken.order, ["cost"]);
});

test("AICOST-USAGEREAD-CHILD-001 malformed and absent linkage reject without parent access", async () => {
  for (const row of [
    cost({ usageId: "invalid" }), cost({ usageId: null }),
    cost({ usageId: undefined }), cost({ usageId: 45 }),
    cost({ usageId: ids.usage.toUpperCase() + "x" }), {}, 0, "",
  ]) {
    const f = fixture({ cost: row });
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["cost"]);
  }
});

test("AICOST-USAGEREAD-READ-001 exact persisted usageId under original RequestContext", async () => {
  const f = fixture(), ctx = context();
  assert.ok(await load(f, ctx, ids.otherUsage));
  assert.deepEqual(f.order, ["cost", "usage"]);
  assert.equal(f.costCalls[0].usageId, ids.otherUsage);
  assert.equal(f.usageCalls.length, 1);
  assert.equal(f.usageCalls[0].tokenUsageId, ids.usage);
  assert.equal(f.usageCalls[0].requestContext, ctx);
});

test("AICOST-USAGEREAD-READ-002 hidden parent and dependency error do not widen or retry", async () => {
  const hidden = fixture({ usage: null }), ctx = context();
  assert.equal(await load(hidden, ctx), null);
  assert.deepEqual(hidden.order, ["cost", "usage"]);
  assert.equal(hidden.usageCalls[0].requestContext, ctx);
  const error = new Error("usage dependency error");
  const broken = fixture({ usageError: error });
  await assert.rejects(load(broken), e => e === error);
  assert.deepEqual(broken.order, ["cost", "usage"]);
});

test("AICOST-USAGEREAD-FLOOR-001 DD-198 exact UUID/FK equality, including case sensitivity", async () => {
  assert.ok(await load(fixture()));
  for (const row of [
    usage({ id: ids.otherUsage }), usage({ id: "invalid" }),
    usage({ id: null }), usage({ id: ids.usage.toUpperCase() }), {},
  ]) {
    const f = fixture({ usage: row });
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["cost", "usage"]);
  }
});

test("AICOST-USAGEREAD-EVID-001 immutable envelope preserves raw references and numeric text", async () => {
  const f = fixture({ cost: cost({ costCurrency: "", billableClass: "",
    finalizedAt: "opaque" }), usage: usage({ inputUnits: "99999999999999999999999" }) });
  const before = JSON.stringify(f.value);
  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.cost, f.value.cost);
  assert.equal(result.usage, f.value.usage);
  assert.deepEqual(Object.keys(result).sort(), ["cost", "usage"]);
  assert.equal(result.cost.estimatedMinorUnits, "90071992547409931234567890123");
  assert.equal(result.cost.finalizedAt, "opaque");
  assert.equal(result.usage.inputUnits, "99999999999999999999999");
  assert.equal(result.usage.mediaUnits, "-999");
  assert.equal(JSON.stringify(f.value), before);
});

test("AICOST-USAGEREAD-BOUND-001 no pricing, authorization or AI execution grants", async () => {
  for (const ctx of [context(), context({ scopeClass: "TENANT_CORE", industryContextId: undefined })]) {
    const result = await load(fixture({
      cost: cost({ providerRateVersion: "obsolete", finalizedAt: undefined }),
      usage: usage({ tenantId: "opaque", industryContextId: undefined,
        principalId: "opaque", providerId: "opaque", modelId: "opaque" }),
    }), ctx);
    assert.ok(result);
    for (const flag of [
      "priceValid", "rateCurrent", "currencyConverted", "billable", "finalized",
      "invoiceAuthorized", "taxAuthorized", "paymentAuthorized", "ledgerAuthorized",
      "quotaAuthorized", "budgetAuthorized", "entitlementAuthorized",
      "principalCurrent", "capabilityAuthorized", "providerAuthorized",
      "modelAuthorized", "aiExecutionAuthorized", "mutation", "events",
    ]) assert.equal(flag in result, false);
    assert.equal(result.usage.principalId, "opaque");
    assert.equal(result.cost.providerRateVersion, "obsolete");
  }
});
