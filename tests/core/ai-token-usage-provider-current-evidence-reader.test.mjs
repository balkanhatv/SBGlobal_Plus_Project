import test from "node:test";
import assert from "node:assert/strict";
import { loadAITokenUsageProviderCurrentEvidence } from "../../dist/core/index.js";

const ids = Object.freeze({
  usage: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  principal: "44444444-4444-4444-8444-444444444444",
  attributed: "55555555-5555-4555-8555-555555555555",
  model: "66666666-6666-4666-8666-666666666666",
  provider: "aabbccdd-1122-4333-8444-aabbccddeeff",
  otherProvider: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "usage-provider-request", correlationId: "usage-provider-correlation",
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
function provider(overrides = {}) {
  return Object.freeze({
    id: ids.provider, code: "opaque-provider",
    status: "RETIRED", adapterType: "opaque-adapter",
    supportedRegions: Object.freeze([null, "IN-CENTRAL", ""]),
    supportedCapabilities: Object.freeze([null, "", "opaque.capability"]),
    securityClass: "OPAQUE", residencyMetadata: Object.freeze({raw: [null, "x"]}),
    healthState: "UNAVAILABLE", version: 77,
    createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  });
}
function fixture(overrides = {}) {
  const values = {
    usage: Object.hasOwn(overrides, "usage") ? overrides.usage : usage(),
    provider: Object.hasOwn(overrides, "provider") ? overrides.provider : provider(),
  };
  const order = [], usageCalls = [], providerCalls = [];
  return {
    values, order, usageCalls, providerCalls,
    usageReader: { async loadForContext(input) {
      order.push("usage"); usageCalls.push(input);
      if (overrides.usageError) throw overrides.usageError;
      return values.usage;
    } },
    providerReader: { async loadById(...args) {
      order.push("provider"); providerCalls.push(args);
      if (overrides.providerError) throw overrides.providerError;
      return values.provider;
    } },
  };
}
function load(f, requestContext = context()) {
  return loadAITokenUsageProviderCurrentEvidence(
    { requestContext, tokenUsageId: ids.usage }, f.usageReader, f.providerReader,
  );
}

test("AIUSAGE-PROVREAD-BASE-001 exact scoped child first, id and RequestContext identity", async () => {
  const f = fixture(), ctx = context();
  assert.ok(await load(f, ctx));
  assert.deepEqual(f.order, ["usage", "provider"]);
  assert.equal(f.usageCalls.length, 1);
  assert.equal(f.usageCalls[0].tokenUsageId, ids.usage);
  assert.equal(f.usageCalls[0].requestContext, ctx);
});

test("AIUSAGE-PROVREAD-BASE-002 null child and original child error prevent global read", async () => {
  const missing = fixture({usage: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["usage"]);
  const error = new Error("usage unavailable"), broken = fixture({usageError: error});
  await assert.rejects(load(broken), e => e === error);
  assert.deepEqual(broken.order, ["usage"]);
});

test("AIUSAGE-PROVREAD-CHILD-001 DD-201 necessary shapes reject before provider access", async () => {
  const rows = [undefined, false, 0, "invalid", {}, []];
  for (const field of ["id", "tenantId", "providerId"]) {
    for (const value of [undefined, null, "invalid"]) rows.push(usage({[field]: value}));
  }
  for (const value of [null, "invalid"]) rows.push(usage({industryContextId: value}));
  for (const row of rows) {
    const f = fixture({usage: row});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["usage"]);
  }
  assert.ok(await load(fixture({usage: usage({industryContextId: undefined})})));
});

test("AIUSAGE-PROVREAD-READ-001 exact persisted providerId alone selects global metadata", async () => {
  const f = fixture({
    usage: usage({providerId: ids.otherProvider}),
    provider: provider({id: ids.otherProvider}),
  });
  assert.ok(await load(f));
  assert.deepEqual(f.order, ["usage", "provider"]);
  assert.deepEqual(f.providerCalls, [[ids.otherProvider]]);
});

test("AIUSAGE-PROVREAD-READ-002 missing provider and original error do not retry/fallback", async () => {
  const missing = fixture({provider: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.providerCalls, [[ids.provider]]);
  const error = new Error("provider store unavailable"), broken = fixture({providerError: error});
  await assert.rejects(load(broken), e => e === error);
  assert.deepEqual(broken.order, ["usage", "provider"]);
  assert.deepEqual(broken.providerCalls, [[ids.provider]]);
});

test("AIUSAGE-PROVREAD-FLOOR-001 DD-201 exact direct-FK provider identity and casing", async () => {
  assert.ok(await load(fixture()));
  for (const row of [
    undefined, {}, provider({id: "invalid"}), provider({id: null}),
    provider({id: undefined}), provider({id: ids.otherProvider}),
    provider({id: ids.provider.toUpperCase()}),
  ]) {
    const f = fixture({provider: row});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["usage", "provider"]);
  }
});

test("AIUSAGE-PROVREAD-EVID-001 frozen raw references and decimals never normalized", async () => {
  for (const changes of [{}, {principalId: undefined, mediaUnits: undefined}]) {
    const f = fixture({usage: usage(changes)}), ctx = context();
    const before = JSON.stringify([f.values, ctx]);
    const result = await load(f, ctx);
    assert.ok(result);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(result.usage, f.values.usage);
    assert.equal(result.provider, f.values.provider);
    assert.equal(result.provider.residencyMetadata, f.values.provider.residencyMetadata);
    assert.equal(result.provider.supportedCapabilities, f.values.provider.supportedCapabilities);
    assert.equal(result.usage.inputUnits, "9007199254740993.000000000000000001");
    assert.equal(result.usage.outputUnits, "0.000000000000000009");
    assert.equal(JSON.stringify([f.values, ctx]), before);
    assert.deepEqual(Object.keys(result).sort(), ["provider", "usage"]);
  }
});

test("AIUSAGE-PROVREAD-BOUND-001 no eligibility/current principal/secret/billing/execution", async () => {
  for (const scope of [
    {scopeClass: "TENANT_INDUSTRY", industryContextId: ids.industry},
    {scopeClass: "TENANT_CORE", industryContextId: undefined},
  ]) {
    for (const status of ["ACTIVE", "RETIRED", "UNKNOWN", ""]) {
      const ctx = context(scope), f = fixture({
        usage: usage({industryContextId: scope.industryContextId}),
        provider: provider({status}),
      });
      const result = await load(f, ctx);
      assert.ok(result);
      assert.equal(f.usageCalls[0].requestContext, ctx);
      assert.equal(result.usage.principalId, ids.attributed);
      assert.notEqual(result.usage.principalId, ctx.principalId);
      assert.equal(result.provider.status, status);
      for (const flag of ["providerEligible", "providerHealthy", "credentialRef", "secret",
        "modelEligible", "principalCurrent", "routingAuthorized", "billingAuthorized",
        "executionAuthorized", "atomicSnapshot"]) {
        assert.equal(flag in result, false);
      }
      assert.deepEqual(Object.keys(result).sort(), ["provider", "usage"]);
    }
  }
});
