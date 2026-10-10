import test from "node:test";
import assert from "node:assert/strict";

import {
  EventEnvelopeValidationError,
  loadWebhookDeliveryEventPayloadValidatedEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  delivery: "11111111-1111-4111-8111-111111111111",
  subscription: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
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
    endpointSnapshot: "http://127.0.0.1/raw",
    payloadDigest: "sha256:raw",
    status: "RAW_PENDING",
    httpStatus: 599,
    startedAt: "2026-10-05T05:00:00.000Z",
    completedAt: undefined,
    nextAttemptAt: undefined,
    errorClass: "RAW",
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
    endpointUrl: "http://127.0.0.1/raw",
    status: "ACTIVE",
    secretVersion: 1,
    eventFilterJson: Object.freeze({unknownGrammar: true}),
    allowedIndustryContextIds: Object.freeze([ids.industry]),
    createdBy: ids.principal,
    verifiedAt: "2026-10-05T04:00:00.000Z",
    createdAt: "2026-10-05T03:00:00.000Z",
    updatedAt: "2026-10-05T04:00:00.000Z",
    ...overrides,
  });
}

function event(overrides = {}) {
  const eventEnvelope = Object.hasOwn(overrides, "envelopeJson")
    ? overrides.envelopeJson
    : envelope();
  return Object.freeze({
    id: ids.event,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    eventType: "order.created",
    eventVersion: 1,
    aggregateType: "Order",
    aggregateId: "ORDER-1",
    envelopeJson: eventEnvelope,
    status: "DEAD",
    attemptCount: 99,
    availableAt: "2026-10-05T05:00:00.000Z",
    lastErrorCode: "RAW",
    createdAt: "2026-10-05T05:00:00.000Z",
    ...overrides,
    envelopeJson: eventEnvelope,
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

function residency(overrides = {}) {
  return Object.freeze({
    tenantId: ids.tenant,
    residencyRegionCode: "IN-CENTRAL",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {
    delivery: [],
    subscription: [],
    event: [],
    catalog: [],
    residency: [],
    payload: [],
  };
  const values = {
    delivery: Object.hasOwn(overrides, "delivery") ? overrides.delivery : delivery(),
    subscription: Object.hasOwn(overrides, "subscription") ? overrides.subscription : subscription(),
    event: Object.hasOwn(overrides, "event") ? overrides.event : event(),
    catalog: Object.hasOwn(overrides, "catalog") ? overrides.catalog : catalog(),
    residency: Object.hasOwn(overrides, "residency") ? overrides.residency : residency(),
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
    residencyReader: {
      async loadCurrentForContext(input) {
        order.push("residency");
        calls.residency.push(input);
        if (overrides.residencyError) throw overrides.residencyError;
        return values.residency;
      },
    },
    payloadValidator: {
      validatePayload(input) {
        order.push("payload");
        calls.payload.push(input);
        if (overrides.payloadError) throw overrides.payloadError;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadWebhookDeliveryEventPayloadValidatedEvidence(
    {
      requestContext: requestContext(),
      deliveryId: ids.delivery,
      ...inputOverrides,
    },
    f.deliveryReader,
    f.subscriptionReader,
    f.eventReader,
    f.catalogReader,
    f.residencyReader,
    f.payloadValidator,
  );
}

test("WH-EVTPAYREAD-BASE-001 DD-522 reader chain executes before payload validation with exact supplied input/readers", async () => {
  const f = fixture();
  const context = requestContext();
  const result = await load(f, {requestContext: context});

  assert.ok(result);
  assert.deepEqual(f.order, [
    "delivery", "subscription", "event", "catalog", "residency", "payload",
  ]);
  assert.deepEqual(f.calls.delivery, [{
    requestContext: context,
    deliveryId: ids.delivery,
  }]);
  assert.deepEqual(f.calls.residency, [{
    requestContext: context,
    tenantId: ids.tenant,
  }]);
});

test("WH-EVTPAYREAD-BASE-002 parent null/error returns null or propagates before payload validation", async () => {
  const absent = fixture({delivery: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.payload, []);

  const expected = new Error("parent-failed");
  const broken = fixture({catalogError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.payload, []);
});

test("WH-EVTPAYREAD-PRE-001 calendar-invalid runtime-parseable occurredAt fails in DD-527 before payload port", async () => {
  const invalidEnvelope = envelope({
    occurredAt: "2026-02-30T05:00:00.000Z",
  });
  const f = fixture({
    event: event({envelopeJson: invalidEnvelope}),
  });

  assert.equal(await load(f), null);
  assert.equal(f.calls.residency.length, 1);
  assert.deepEqual(f.calls.payload, []);
});

test("WH-EVTPAYREAD-PRE-002 structurally non-JSON payload fails in DD-527 before payload port", async () => {
  const invalidEnvelope = envelope({
    payload: Object.freeze({nested: undefined}),
  });
  const f = fixture({
    event: event({envelopeJson: invalidEnvelope}),
  });

  assert.equal(await load(f), null);
  assert.equal(f.calls.residency.length, 1);
  assert.deepEqual(f.calls.payload, []);
});

test("WH-EVTPAYREAD-CORE-001 valid TENANT_CORE preserves no-Industry branch and invokes payload port once", async () => {
  const coreEnvelope = envelope({
    scopeClass: "TENANT_CORE",
    industryContextId: undefined,
  });
  const f = fixture({
    event: event({
      scopeClass: "TENANT_CORE",
      industryContextId: undefined,
      envelopeJson: coreEnvelope,
    }),
    catalog: catalog({scopeClass: "TENANT_CORE"}),
  });
  const context = requestContext({
    scopeClass: "TENANT_CORE",
    industryContextId: undefined,
  });

  const result = await load(f, {requestContext: context});
  assert.ok(result);
  assert.equal(f.calls.payload.length, 1);
  const current = result.prePayloadEvidence.parent.parent.parent;
  assert.equal(current.event.scopeClass, "TENANT_CORE");
  assert.equal(current.event.industryContextId, undefined);
  assert.equal(result.envelopeJson.industryContextId, undefined);
});

test("WH-EVTPAYREAD-PAY-001 valid TENANT_INDUSTRY invokes DD-081 payload port once and returns exact DD-532 evidence", async () => {
  const f = fixture();
  const result = await load(f);

  assert.ok(result);
  assert.equal(f.calls.payload.length, 1);
  assert.equal(result.envelopeJson, f.values.event.envelopeJson);
  assert.equal(
    result.prePayloadEvidence.parent.parent.parent.event,
    f.values.event,
  );
  assert.equal(
    result.prePayloadEvidence.parent.parent.parent.catalog,
    f.values.catalog,
  );
  assert.equal(
    result.prePayloadEvidence.parent.currentResidency,
    f.values.residency,
  );
});

test("WH-EVTPAYREAD-FAIL-001 DD-532 payload validation failure semantics propagate unchanged", async () => {
  const ordinary = fixture({
    payloadError: new Error("schema provider internal detail"),
  });
  await assert.rejects(
    load(ordinary),
    error => error instanceof EventEnvelopeValidationError
      && error.message === "The event payload does not satisfy its catalog schema.",
  );

  const expected = new EventEnvelopeValidationError(
    "safe governed schema rejection",
  );
  const governed = fixture({payloadError: expected});
  await assert.rejects(load(governed), error => error === expected);
});

test("WH-EVTPAYREAD-EVID-001 success preserves exact nested identities immutably and exposes no delivery authority", async () => {
  const f = fixture();
  const before = JSON.stringify(f.values);
  const result = await load(f);

  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.prePayloadEvidence), true);
  const current = result.prePayloadEvidence.parent.parent.parent;
  assert.equal(current.delivery, f.values.delivery);
  assert.equal(current.subscription, f.values.subscription);
  assert.equal(current.event, f.values.event);
  assert.equal(current.catalog, f.values.catalog);
  assert.equal(result.prePayloadEvidence.parent.currentResidency, f.values.residency);
  assert.equal(result.envelopeJson, f.values.event.envelopeJson);
  assert.equal(JSON.stringify(f.values), before);

  for (const forbidden of [
    "catalogActive",
    "filterMatched",
    "endpointSafe",
    "endpointVerified",
    "signed",
    "secretMaterial",
    "ready",
    "retryable",
    "deliverable",
    "crossContextAuthorized",
    "dispatchAuthorized",
    "networkAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
