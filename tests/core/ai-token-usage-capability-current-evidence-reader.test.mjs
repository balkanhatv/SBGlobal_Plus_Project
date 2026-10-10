import test from "node:test";
import assert from "node:assert/strict";
import { loadAITokenUsageCapabilityCurrentEvidence } from "../../dist/core/index.js";

const ids = Object.freeze({
  usage: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  principal: "44444444-4444-4444-8444-444444444444",
  attributed: "55555555-5555-4555-8555-555555555555",
  model: "66666666-6666-4666-8666-666666666666",
  provider: "77777777-7777-4777-8777-777777777777",
  capability: "88888888-8888-4888-8888-888888888888",
});
function context(overrides = {}) {
  return Object.freeze({
    requestId: "usage-cap-request", correlationId: "usage-cap-correlation",
    tenantId: ids.tenant, industryContextId: ids.industry,
    principalId: ids.principal, principalType: "HUMAN",
    scopeClass: "TENANT_INDUSTRY", orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]), permissionVersion: 1,
    entitlementSnapshotVersion: 1, dataHomeId: "home", regionCode: "IN-CENTRAL",
    ...overrides,
  });
}
function usage(overrides = {}) {
  return Object.freeze({
    id: ids.usage, tenantId: ids.tenant, industryContextId: ids.industry,
    principalId: ids.attributed, capabilityCode: "opaque.capability",
    providerId: ids.provider, modelId: ids.model,
    inputUnits: "9007199254740993.000000000000000001",
    outputUnits: "0.000000000000000009", mediaUnits: "100000000000000000001",
    occurredAt: "2026-01-01T00:00:00.000Z", correlationId: ids.usage,
    ...overrides,
  });
}
function capability(overrides = {}) {
  return Object.freeze({
    id: ids.capability, code: "opaque.capability",
    status: "RETIRED", category: "OPAQUE_CATEGORY",
    requiredEntitlement: null, defaultPolicyClass: "opaque-policy",
    schemaVersion: -999, opaqueMetadata: Object.freeze({raw: [null, "x"]}),
    ...overrides,
  });
}
function fixture(overrides = {}) {
  const values = {
    usage: Object.hasOwn(overrides, "usage") ? overrides.usage : usage(),
    capability: Object.hasOwn(overrides, "capability") ? overrides.capability : capability(),
  };
  const order = [], usageCalls = [], capabilityCalls = [];
  return {
    values, order, usageCalls, capabilityCalls,
    usageReader: { async loadForContext(input) {
      order.push("usage"); usageCalls.push(input);
      if (overrides.usageError) throw overrides.usageError;
      return values.usage;
    } },
    capabilityReader: { async loadByCode(...args) {
      order.push("capability"); capabilityCalls.push(args);
      if (overrides.capabilityError) throw overrides.capabilityError;
      return values.capability;
    } },
  };
}
function load(f, requestContext = context()) {
  return loadAITokenUsageCapabilityCurrentEvidence(
    {requestContext, tokenUsageId: ids.usage}, f.usageReader, f.capabilityReader,
  );
}

test("AIUSAGE-CAPREAD-BASE-001 exact scoped TokenUsage first with RequestContext identity", async () => {
  const f = fixture(), ctx = context();
  assert.ok(await load(f, ctx));
  assert.deepEqual(f.order, ["usage", "capability"]);
  assert.equal(f.usageCalls.length, 1);
  assert.equal(f.usageCalls[0].tokenUsageId, ids.usage);
  assert.equal(f.usageCalls[0].requestContext, ctx);
});

test("AIUSAGE-CAPREAD-BASE-002 missing child and original errors short-circuit global access", async () => {
  for (const value of [null, undefined]) {
    const f = fixture({usage: value});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["usage"]);
  }
  const error = new Error("original scoped usage error"), f = fixture({usageError: error});
  await assert.rejects(load(f), e => e === error);
  assert.deepEqual(f.order, ["usage"]);
  assert.equal(f.usageCalls.length, 1);
});

test("AIUSAGE-CAPREAD-CHILD-001 necessary DD-197 child shapes before any catalog read", async () => {
  const rows = [false, 0, "invalid", {}, []];
  for (const field of ["id", "tenantId"]) {
    for (const value of [undefined, null, "bad"]) rows.push(usage({[field]: value}));
  }
  for (const value of [null, "invalid", false]) rows.push(usage({industryContextId: value}));
  for (const value of [undefined, null, 7, false, {}]) rows.push(usage({capabilityCode: value}));
  for (const row of rows) {
    const f = fixture({usage: row});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["usage"]);
    assert.equal(f.capabilityCalls.length, 0);
  }
  assert.ok(await load(fixture({usage: usage({industryContextId: undefined})})));
  const raw = fixture({
    usage: usage({industryContextId: undefined, capabilityCode: " raw Code "}),
    capability: capability({code: " raw Code "}),
  });
  assert.ok(await load(raw));
  assert.deepEqual(raw.capabilityCalls, [[" raw Code "]]);
});

test("AIUSAGE-CAPREAD-READ-001 exactly one global lookup by raw persisted code", async () => {
  const f = fixture({
    usage: usage({capabilityCode: " Case and whitespace "}),
    capability: capability({code: " Case and whitespace "}),
  }), ctx = context();
  assert.ok(await load(f, ctx));
  assert.deepEqual(f.order, ["usage", "capability"]);
  assert.deepEqual(f.capabilityCalls, [[" Case and whitespace "]]);
  assert.equal(f.usageCalls[0].requestContext, ctx);
});

test("AIUSAGE-CAPREAD-READ-002 null catalog and original catalog error have no retry", async () => {
  const missing = fixture({capability: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.capabilityCalls, [["opaque.capability"]]);
  const error = new Error("original catalog failure");
  const f = fixture({capabilityError: error});
  await assert.rejects(load(f), e => e === error);
  assert.deepEqual(f.order, ["usage", "capability"]);
  assert.deepEqual(f.capabilityCalls, [["opaque.capability"]]);
});

test("AIUSAGE-CAPREAD-FLOOR-001 DD-197 strict direct-code-FK match, no normalization", async () => {
  assert.ok(await load(fixture()));
  for (const row of [
    undefined, {}, capability({id: "invalid"}), capability({id: null}),
    capability({code: undefined}), capability({code: null}),
    capability({code: "other"}), capability({code: "OPAQUE.CAPABILITY"}),
    capability({code: "opaque.capability "}), capability({code: " opaque.capability"}),
  ]) {
    const f = fixture({capability: row});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["usage", "capability"]);
  }
  assert.ok(await load(fixture({
    usage: usage({capabilityCode: ""}), capability: capability({code: ""}),
  })));
});

test("AIUSAGE-CAPREAD-EVID-001 frozen original references, opaque fields, exact decimals", async () => {
  for (const changes of [{}, {principalId: undefined, mediaUnits: undefined}]) {
    const f = fixture({usage: usage(changes)}), ctx = context();
    const before = JSON.stringify([f.values, ctx]);
    const result = await load(f, ctx);
    assert.ok(result);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(result.usage, f.values.usage);
    assert.equal(result.capability, f.values.capability);
    assert.equal(result.capability.opaqueMetadata, f.values.capability.opaqueMetadata);
    assert.equal(result.usage.inputUnits, "9007199254740993.000000000000000001");
    assert.equal(result.usage.outputUnits, "0.000000000000000009");
    assert.equal(result.usage.mediaUnits, changes.mediaUnits);
    assert.equal(result.capability.schemaVersion, -999);
    assert.equal(result.capability.defaultPolicyClass, "opaque-policy");
    assert.equal(JSON.stringify([f.values, ctx]), before);
    assert.deepEqual(Object.keys(result).sort(), ["capability", "usage"]);
  }
});

test("AIUSAGE-CAPREAD-BOUND-001 scoped evidence never conveys eligibility or execution authority", async () => {
  for (const scope of [
    {scopeClass: "TENANT_INDUSTRY", industryContextId: ids.industry},
    {scopeClass: "TENANT_CORE", industryContextId: undefined},
  ]) {
    for (const status of ["ACTIVE", "RETIRED", "UNKNOWN", ""]) {
      const ctx = context(scope), f = fixture({
        usage: usage({industryContextId: scope.industryContextId}),
        capability: capability({status, requiredEntitlement: "arbitrary.entitlement"}),
      });
      const result = await load(f, ctx);
      assert.ok(result);
      assert.equal(f.usageCalls[0].requestContext, ctx);
      assert.equal(result.usage.principalId, ids.attributed);
      assert.notEqual(result.usage.principalId, ctx.principalId);
      assert.equal(result.capability.status, status);
      assert.equal(result.capability.requiredEntitlement, "arbitrary.entitlement");
      for (const flag of [
        "capabilityEligible", "capabilityActive", "entitlementSatisfied",
        "tenantAllowed", "industryAllowed", "principalAuthorized", "policySatisfied",
        "providerCompatible", "budgetAuthorized", "billingAuthorized",
        "routingAuthorized", "executionAuthorized", "atomicSnapshot",
      ]) assert.equal(flag in result, false);
      assert.deepEqual(Object.keys(result).sort(), ["capability", "usage"]);
    }
  }
});
