import test from "node:test";
import assert from "node:assert/strict";
import { loadAITokenUsageModelPairCurrentEvidence } from "../../dist/core/index.js";

const ids = Object.freeze({
  usage: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  principal: "44444444-4444-4444-8444-444444444444",
  otherModel: "55555555-5555-4555-8555-555555555555",
  otherProvider: "66666666-6666-4666-8666-666666666666",
  attributedPrincipal: "77777777-7777-4777-8777-777777777777",
  model: "aabbccdd-1122-4333-8444-aabbccddeeff",
  provider: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "usage-pair-request", correlationId: "usage-pair-correlation",
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
    principalId: ids.attributedPrincipal, capabilityCode: "opaque.capability",
    providerId: ids.provider, modelId: ids.model,
    inputUnits: "9007199254740993.000000000000000001",
    outputUnits: "0.000000000000000009", mediaUnits: "100000000000000000001",
    occurredAt: "2026-01-01T00:00:00.000Z", correlationId: ids.usage,
    ...overrides,
  });
}
function model(overrides = {}) {
  return Object.freeze({
    id: ids.model, providerId: ids.provider, modelCode: "", displayName: "",
    capabilities: Object.freeze([null, "opaque-capability", ""]),
    contextWindowClass: "opaque-window", inputModalities: Object.freeze([null]),
    outputModalities: Object.freeze([]), residencyRegions: Object.freeze([""]),
    sensitivityCeiling: "REGULATED", costClass: "", latencyClass: "opaque",
    status: "RETIRED", version: 7, metadata: Object.freeze({ raw: true }),
    ...overrides,
  });
}
function fixture(overrides = {}) {
  const values = {
    usage: Object.hasOwn(overrides, "usage") ? overrides.usage : usage(),
    model: Object.hasOwn(overrides, "model") ? overrides.model : model(),
  };
  const order = [], usageCalls = [], modelCalls = [];
  return {
    values, order, usageCalls, modelCalls,
    usageReader: { async loadForContext(input) {
      order.push("usage"); usageCalls.push(input);
      if (overrides.usageError) throw overrides.usageError;
      return values.usage;
    } },
    modelReader: { async loadById(...args) {
      order.push("model"); modelCalls.push(args);
      if (overrides.modelError) throw overrides.modelError;
      return values.model;
    } },
  };
}
function load(f, requestContext = context()) {
  return loadAITokenUsageModelPairCurrentEvidence(
    { requestContext, tokenUsageId: ids.usage }, f.usageReader, f.modelReader,
  );
}

test("AIUSAGE-MODELREAD-BASE-001 exact usage first, original id and identical context", async () => {
  const f = fixture(), ctx = context();
  assert.ok(await load(f, ctx));
  assert.deepEqual(f.order, ["usage", "model"]);
  assert.equal(f.usageCalls.length, 1);
  assert.equal(f.usageCalls[0].tokenUsageId, ids.usage);
  assert.equal(f.usageCalls[0].requestContext, ctx);
});

test("AIUSAGE-MODELREAD-BASE-002 null usage and original error prevent catalog access", async () => {
  const missing = fixture({ usage: null });
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["usage"]);
  const error = new Error("usage unavailable"), broken = fixture({ usageError: error });
  await assert.rejects(load(broken), e => e === error);
  assert.deepEqual(broken.order, ["usage"]);
});

test("AIUSAGE-MODELREAD-CHILD-001 invalid DD-196 linkage rejects before any model access", async () => {
  const rows = [undefined, false, 0, "invalid", {}, []];
  for (const field of ["id", "tenantId", "modelId", "providerId"]) {
    for (const value of [undefined, null, "invalid"]) rows.push(usage({ [field]: value }));
  }
  for (const value of [null, "invalid"]) rows.push(usage({ industryContextId: value }));
  for (const row of rows) {
    const f = fixture({ usage: row });
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["usage"]);
  }
  assert.ok(await load(fixture({ usage: usage({ industryContextId: undefined }) })));
});

test("AIUSAGE-MODELREAD-READ-001 exact persisted modelId once through global catalog port", async () => {
  const f = fixture({
    usage: usage({ modelId: ids.otherModel }), model: model({ id: ids.otherModel }),
  });
  assert.ok(await load(f));
  assert.deepEqual(f.order, ["usage", "model"]);
  assert.deepEqual(f.modelCalls, [[ids.otherModel]]);
});

test("AIUSAGE-MODELREAD-READ-002 absent model or original error has no fallback or retry", async () => {
  const missing = fixture({ model: null });
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.modelCalls, [[ids.model]]);
  const error = new Error("catalog unavailable"), broken = fixture({ modelError: error });
  await assert.rejects(load(broken), e => e === error);
  assert.deepEqual(broken.order, ["usage", "model"]);
  assert.deepEqual(broken.modelCalls, [[ids.model]]);
});

test("AIUSAGE-MODELREAD-FLOOR-001 exact DD-196 pair only, including provider and casing equality", async () => {
  assert.ok(await load(fixture()));
  for (const row of [
    undefined, {}, model({ id: "invalid" }), model({ providerId: null }),
    model({ providerId: undefined }), model({ providerId: "invalid" }),
    model({ id: ids.otherModel }), model({ providerId: ids.otherProvider }),
    model({ id: ids.model.toUpperCase() }), model({ providerId: ids.provider.toUpperCase() }),
  ]) {
    const f = fixture({ model: row });
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["usage", "model"]);
  }
});

test("AIUSAGE-MODELREAD-EVID-001 frozen raw references preserve precision and optional metadata", async () => {
  for (const shape of [{}, { principalId: undefined, mediaUnits: undefined }]) {
    const f = fixture({ usage: usage(shape) }), ctx = context();
    const before = JSON.stringify([f.values, ctx]);
    const result = await load(f, ctx);
    assert.ok(result);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(result.usage, f.values.usage);
    assert.equal(result.model, f.values.model);
    assert.equal(result.model.capabilities, f.values.model.capabilities);
    assert.equal(result.model.metadata, f.values.model.metadata);
    assert.equal(result.usage.inputUnits, "9007199254740993.000000000000000001");
    assert.equal(result.usage.outputUnits, "0.000000000000000009");
    assert.equal(JSON.stringify([f.values, ctx]), before);
    assert.deepEqual(Object.keys(result).sort(), ["model", "usage"]);
  }
});

test("AIUSAGE-MODELREAD-BOUND-001 raw status and attribution never imply eligibility or execution", async () => {
  for (const scope of [
    { scopeClass: "TENANT_INDUSTRY", industryContextId: ids.industry },
    { scopeClass: "TENANT_CORE", industryContextId: undefined },
  ]) {
    for (const status of ["ACTIVE", "RETIRED", "OPAQUE_STATUS", ""]) {
      const ctx = context(scope), f = fixture({
        usage: usage({ industryContextId: scope.industryContextId }), model: model({ status }),
      });
      const result = await load(f, ctx);
      assert.ok(result);
      assert.equal(f.usageCalls[0].requestContext, ctx);
      assert.equal(result.usage.principalId, ids.attributedPrincipal);
      assert.notEqual(result.usage.principalId, ctx.principalId);
      assert.equal(result.model.status, status);
      assert.deepEqual(Object.keys(result).sort(), ["model", "usage"]);
      for (const flag of ["provider", "principalCurrent", "modelEligible", "providerHealthy",
        "route", "billingAuthorized", "executionAuthorized", "atomicSnapshot"]) {
        assert.equal(flag in result, false);
      }
    }
  }
});
