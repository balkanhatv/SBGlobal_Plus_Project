import test from "node:test";
import assert from "node:assert/strict";

import {
  loadWebhookDeliveryEventEnvelopeCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  delivery: "11111111-1111-4111-8111-111111111111",
  subscription: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  foreignTenant: "34343434-3434-4434-8434-343434343434",
  industry: "44444444-4444-4444-8444-444444444444",
  siblingIndustry: "45454545-4545-4545-8545-454545454545",
  principal: "55555555-5555-4555-8555-555555555555",
  event: "66666666-6666-4666-8666-666666666666",
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

function envelope(overrides = {}) {
  return Object.freeze({
    eventId: ids.event,
    eventType: "order.created",
    eventVersion: 1,
    scopeClass: "TENANT_INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    actorType: "SERVICE",
    sourceModule: "Orders",
    sourceResourceType: "Order",
    sourceResourceId: "ORDER-1",
    correlationId: ids.correlation,
    occurredAt: "2026-10-05T05:00:00.000Z",
    dataSensitivity: "INTERNAL",
    residencyRegion: "IN-CENTRAL",
    payloadSchema: "order.created.v1",
    payload: Object.freeze({orderId: "ORDER-1"}),
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
    envelopeJson: envelope(),
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
  return loadWebhookDeliveryEventEnvelopeCurrentEvidence(
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

test("WH-EVTENV-BASE-001 exact DD-512 parent evidence executes first with identical inputs and no extra reads", async () => {
  const f = fixture();
  const context = requestContext();
  const result = await load(f, {requestContext: context});

  assert.ok(result);
  assert.deepEqual(f.order, ["delivery", "subscription", "event", "catalog"]);
  assert.deepEqual(f.calls.delivery, [{requestContext: context, deliveryId: ids.delivery}]);
  assert.equal(f.calls.subscription[0].requestContext, context);
  assert.equal(f.calls.event[0].requestContext, context);
  assert.equal(f.calls.catalog.length, 1);
});

test("WH-EVTENV-BASE-002 DD-512 null/error short-circuits or propagates before local envelope evidence", async () => {
  const hidden = fixture({delivery: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["delivery"]);

  const expected = new Error("delivery-failed");
  const broken = fixture({deliveryError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["delivery"]);
});

test("WH-EVTENV-ID-001 exact persisted identity and catalog producer/sensitivity evidence passes", async () => {
  const result = await load(fixture());
  assert.ok(result);
  assert.equal(result.parent.event.envelopeJson.eventId, ids.event);
  assert.equal(result.parent.event.envelopeJson.sourceModule, "Orders");
  assert.equal(result.parent.event.envelopeJson.dataSensitivity, "INTERNAL");
});

test("WH-EVTENV-ID-002 event identity or producer/sensitivity mismatch fails closed", async () => {
  const cases = [
    fixture({event: event({envelopeJson: envelope({eventId: "88888888-8888-4888-8888-888888888888"})})}),
    fixture({event: event({envelopeJson: envelope({eventType: "other.created"})})}),
    fixture({event: event({envelopeJson: envelope({eventVersion: 2})})}),
    fixture({event: event({envelopeJson: envelope({scopeClass: "TENANT_CORE"})})}),
    fixture({event: event({envelopeJson: envelope({sourceModule: "Other"})})}),
    fixture({event: event({envelopeJson: envelope({dataSensitivity: "CONFIDENTIAL"})})}),
  ];
  for (const f of cases) assert.equal(await load(f), null);
});

test("WH-EVTENV-SCOPE-001 exact ordinary Tenant-Core and allowed Tenant-Industry local scope shape passes", async () => {
  assert.ok(await load(fixture()));

  const core = fixture({
    event: event({
      scopeClass: "TENANT_CORE",
      industryContextId: undefined,
      envelopeJson: envelope({
        scopeClass: "TENANT_CORE",
        industryContextId: undefined,
      }),
    }),
    catalog: catalog({scopeClass: "TENANT_CORE"}),
  });
  assert.ok(await load(core));
});

test("WH-EVTENV-SCOPE-002 ownership selector mismatch or malformed mandatory envelope evidence fails closed", async () => {
  const withoutPayload = {...envelope()};
  delete withoutPayload.payload;

  const cases = [
    fixture({event: event({envelopeJson: envelope({tenantId: ids.foreignTenant})})}),
    fixture({event: event({envelopeJson: envelope({industryContextId: ids.siblingIndustry})})}),
    fixture({event: event({envelopeJson: envelope({sourceIndustryContextId: ids.siblingIndustry})})}),
    fixture({event: event({envelopeJson: envelope({correlationId: "bad"})})}),
    fixture({event: event({envelopeJson: envelope({actorType: ""})})}),
    fixture({event: event({envelopeJson: Object.freeze(withoutPayload)})}),
  ];

  for (const f of cases) assert.equal(await load(f), null);
});

test("WH-EVTENV-EVID-001 success preserves exact DD-512 parent and exact envelope reference in an immutable result", async () => {
  const f = fixture();
  const before = JSON.stringify(f.values);
  const result = await load(f);

  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.parent.delivery, f.values.delivery);
  assert.equal(result.parent.subscription, f.values.subscription);
  assert.equal(result.parent.event, f.values.event);
  assert.equal(result.parent.catalog, f.values.catalog);
  assert.equal(result.envelopeJson, f.values.event.envelopeJson);
  assert.equal(JSON.stringify(f.values), before);
});

test("WH-EVTENV-BOUND-001 local envelope evidence grants no residency payload filter endpoint signing retry dispatch network or mutation authority", async () => {
  const f = fixture({
    delivery: delivery({
      endpointSnapshot: "http://127.0.0.1/internal",
      status: "RAW_UNKNOWN",
      httpStatus: 599,
      errorClass: "ANYTHING",
    }),
    subscription: subscription({
      endpointUrl: "http://127.0.0.1/internal",
      eventFilterJson: Object.freeze({unknownGrammar: true}),
      secretVersion: -99,
    }),
    event: event({status: "DEAD", attemptCount: 99}),
    catalog: catalog({status: "RETIRED"}),
  });

  const result = await load(f);
  assert.ok(result);

  for (const forbidden of [
    "residencyCurrent",
    "payloadSchemaValid",
    "catalogActive",
    "filterMatched",
    "endpointSafe",
    "signed",
    "retryable",
    "deliverable",
    "dispatchAuthorized",
    "networkAuthorized",
    "secretMaterial",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
