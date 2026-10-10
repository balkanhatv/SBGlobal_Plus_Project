import test from "node:test";
import assert from "node:assert/strict";

import {
  loadWebhookDeliveryCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  delivery: "11111111-1111-4111-8111-111111111111",
  subscription: "22222222-2222-4222-8222-222222222222",
  otherSubscription: "23232323-2323-4232-8232-232323232323",
  tenant: "33333333-3333-4333-8333-333333333333",
  foreignTenant: "34343434-3434-4434-8434-343434343434",
  industry: "44444444-4444-4444-8444-444444444444",
  siblingIndustry: "45454545-4545-4545-8545-454545454545",
  principal: "55555555-5555-4555-8555-555555555555",
  event: "66666666-6666-4666-8666-666666666666",
  otherEvent: "67676767-6767-4767-8767-676767676767",
  correlation: "77777777-7777-4777-8777-777777777777",
});

function requestContext(overrides = {}) {
  return Object.freeze({
    requestId: "request-1",
    correlationId: "correlation-1",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    principalId: ids.principal,
    principalType: "HUMAN",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    permissionVersion: 1,
    entitlementSnapshotVersion: 1,
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function delivery(overrides = {}) {
  return Object.freeze({
    id: ids.delivery,
    subscriptionId: ids.subscription,
    eventId: ids.event,
    attemptNo: 1,
    endpointSnapshot: "https://example.invalid/webhook",
    payloadDigest: "sha256:raw",
    status: "RAW_PENDING",
    httpStatus: undefined,
    startedAt: "2026-10-05T05:00:00.000Z",
    completedAt: undefined,
    nextAttemptAt: undefined,
    errorClass: undefined,
    correlationId: ids.correlation,
    createdAt: "2026-10-05T05:00:00.000Z",
    ...overrides,
  });
}

function subscription(overrides = {}) {
  return Object.freeze({
    id: ids.subscription,
    tenantId: ids.tenant,
    name: "Webhook",
    endpointUrl: "https://example.invalid/webhook",
    status: "ACTIVE",
    secretVersion: 1,
    eventFilterJson: Object.freeze({raw: true}),
    allowedIndustryContextIds: Object.freeze([ids.industry]),
    createdBy: ids.principal,
    verifiedAt: "2026-10-05T04:00:00.000Z",
    createdAt: "2026-10-05T03:00:00.000Z",
    updatedAt: "2026-10-05T04:00:00.000Z",
    ...overrides,
  });
}

function event(overrides = {}) {
  return Object.freeze({
    id: ids.event,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    eventType: "order.created",
    eventVersion: 1,
    aggregateType: "Order",
    aggregateId: "ORDER-1",
    envelopeJson: Object.freeze({raw: true}),
    status: "DEAD",
    attemptCount: 99,
    availableAt: "2026-10-05T05:00:00.000Z",
    lastErrorCode: "RAW",
    createdAt: "2026-10-05T05:00:00.000Z",
    ...overrides,
  });
}

function catalog(overrides = {}) {
  return Object.freeze({
    eventType: "order.created",
    eventVersion: 1,
    producerModule: "Orders",
    scopeClass: "TENANT_INDUSTRY",
    sensitivityClass: "INTERNAL",
    payloadSchema: Object.freeze({type: "object"}),
    consumerClassesJson: Object.freeze([]),
    retentionAuditPosture: "STANDARD",
    webhookEligible: true,
    backwardCompatibility: "RAW",
    status: "RETIRED",
    createdAt: "2026-10-05T03:00:00.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {delivery: [], subscription: [], event: [], catalog: []};
  const values = {
    delivery: Object.hasOwn(overrides, "delivery") ? overrides.delivery : delivery(),
    subscription: Object.hasOwn(overrides, "subscription") ? overrides.subscription : subscription(),
    event: Object.hasOwn(overrides, "event") ? overrides.event : event(),
    catalog: Object.hasOwn(overrides, "catalog") ? overrides.catalog : catalog(),
  };

  return {
    order,
    calls,
    values,
    deliveryReader: {
      async loadForContext(input) {
        order.push("delivery");
        calls.delivery.push(input);
        if (overrides.deliveryError) throw overrides.deliveryError;
        return values.delivery;
      },
    },
    subscriptionReader: {
      async loadForContext(input) {
        order.push("subscription");
        calls.subscription.push(input);
        if (overrides.subscriptionError) throw overrides.subscriptionError;
        return values.subscription;
      },
    },
    eventReader: {
      async loadForContext(input) {
        order.push("event");
        calls.event.push(input);
        if (overrides.eventError) throw overrides.eventError;
        return values.event;
      },
    },
    catalogReader: {
      async loadExact(input) {
        order.push("catalog");
        calls.catalog.push(input);
        if (overrides.catalogError) throw overrides.catalogError;
        return values.catalog;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadWebhookDeliveryCurrentEvidence(
    {
      requestContext: requestContext(),
      deliveryId: ids.delivery,
      ...inputOverrides,
    },
    f.deliveryReader,
    f.subscriptionReader,
    f.eventReader,
    f.catalogReader,
  );
}

test("WH-EVID-BASE-001 exact WebhookDelivery read executes first with exact RequestContext/id", async () => {
  const f = fixture();
  const context = requestContext();
  const result = await load(f, {requestContext: context});

  assert.ok(result);
  assert.deepEqual(f.order, ["delivery", "subscription", "event", "catalog"]);
  assert.equal(f.calls.delivery.length, 1);
  assert.equal(f.calls.delivery[0].requestContext, context);
  assert.equal(f.calls.delivery[0].deliveryId, ids.delivery);
});

test("WH-EVID-BASE-002 delivery null/error short-circuits or propagates before dependent reads", async () => {
  const hidden = fixture({delivery: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["delivery"]);

  const expected = new Error("delivery-failed");
  const broken = fixture({deliveryError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["delivery"]);
});

test("WH-EVID-PARENT-001 subscription read uses persisted id in identical context and enforces exact returned identity", async () => {
  const f = fixture();
  const context = requestContext();
  assert.ok(await load(f, {requestContext: context}));
  assert.deepEqual(f.calls.subscription, [{
    requestContext: context,
    subscriptionId: ids.subscription,
  }]);

  const mismatch = fixture({subscription: subscription({id: ids.otherSubscription})});
  assert.equal(await load(mismatch), null);
  assert.deepEqual(mismatch.order, ["delivery", "subscription"]);
});

test("WH-EVID-PARENT-002 event read uses persisted id in identical context and enforces exact returned identity", async () => {
  const f = fixture();
  const context = requestContext();
  assert.ok(await load(f, {requestContext: context}));
  assert.deepEqual(f.calls.event, [{
    requestContext: context,
    eventId: ids.event,
  }]);

  const mismatch = fixture({event: event({id: ids.otherEvent})});
  assert.equal(await load(mismatch), null);
  assert.deepEqual(mismatch.order, ["delivery", "subscription", "event"]);
});

test("WH-EVID-CAT-001 EventCatalog read uses exact loaded event tuple once", async () => {
  const f = fixture();
  assert.ok(await load(f));
  assert.deepEqual(f.calls.catalog, [{
    eventType: "order.created",
    eventVersion: 1,
    scopeClass: "TENANT_INDUSTRY",
  }]);
});

test("WH-EVID-DEP-001 required null dependencies fail closed and dependency errors propagate unchanged", async () => {
  for (const candidate of [
    fixture({subscription: null}),
    fixture({event: null}),
    fixture({catalog: null}),
  ]) {
    assert.equal(await load(candidate), null);
  }

  for (const [key, expectedOrder] of [
    ["subscriptionError", ["delivery", "subscription"]],
    ["eventError", ["delivery", "subscription", "event"]],
    ["catalogError", ["delivery", "subscription", "event", "catalog"]],
  ]) {
    const expected = new Error(key);
    const f = fixture({[key]: expected});
    await assert.rejects(load(f), error => error === expected);
    assert.deepEqual(f.order, expectedOrder);
  }
});

test("WH-EVID-FLOOR-001 ordinary Tenant-Core and allowed Tenant-Industry DD-163 evidence passes", async () => {
  assert.ok(await load(fixture()));

  const core = fixture({
    event: event({scopeClass: "TENANT_CORE", industryContextId: undefined}),
    catalog: catalog({scopeClass: "TENANT_CORE"}),
  });
  assert.ok(await load(core));
});

test("WH-EVID-FLOOR-002 inactive foreign ineligible mismatched Platform-Global and explicit-cross-context evidence fails closed", async () => {
  const cases = [
    fixture({subscription: subscription({status: "PAUSED"})}),
    fixture({subscription: subscription({tenantId: ids.foreignTenant})}),
    fixture({catalog: catalog({webhookEligible: false})}),
    fixture({catalog: catalog({eventVersion: 2})}),
    fixture({
      event: event({scopeClass: "PLATFORM_GLOBAL", tenantId: undefined, industryContextId: undefined}),
      catalog: catalog({scopeClass: "PLATFORM_GLOBAL"}),
    }),
    fixture({
      subscription: subscription({allowedIndustryContextIds: Object.freeze([ids.industry, ids.siblingIndustry])}),
      event: event({
        scopeClass: "EXPLICIT_CROSS_CONTEXT",
        industryContextId: undefined,
        envelopeJson: Object.freeze({
          sourceIndustryContextId: ids.industry,
          targetIndustryContextId: ids.siblingIndustry,
        }),
      }),
      catalog: catalog({scopeClass: "EXPLICIT_CROSS_CONTEXT"}),
    }),
  ];

  for (const f of cases) assert.equal(await load(f), null);
});

test("WH-EVID-EVID-001 success preserves frozen exact reader-returned references without mutation", async () => {
  const f = fixture();
  const before = JSON.stringify(f.values);
  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.delivery, f.values.delivery);
  assert.equal(result.subscription, f.values.subscription);
  assert.equal(result.event, f.values.event);
  assert.equal(result.catalog, f.values.catalog);
  assert.equal(JSON.stringify(f.values), before);
});

test("WH-EVID-BOUND-001 raw delivery/filter/endpoint/catalog/runtime evidence grants no send or execution authority", async () => {
  const f = fixture({
    delivery: delivery({
      endpointSnapshot: "http://127.0.0.1/internal",
      status: "RAW_RETRYABLE_OR_NOT_UNKNOWN",
      httpStatus: 599,
      nextAttemptAt: "2099-01-01T00:00:00.000Z",
      errorClass: "ANYTHING",
    }),
    subscription: subscription({
      endpointUrl: "http://127.0.0.1/internal",
      eventFilterJson: Object.freeze({unknownGrammar: true}),
      secretVersion: -99,
    }),
    catalog: catalog({status: "RETIRED"}),
  });

  const result = await load(f);
  assert.ok(result);

  for (const forbidden of [
    "filterMatched",
    "endpointSafe",
    "signed",
    "retryable",
    "deliverable",
    "dispatchAuthorized",
    "crossContextAuthorized",
    "networkAuthorized",
    "secretMaterial",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
