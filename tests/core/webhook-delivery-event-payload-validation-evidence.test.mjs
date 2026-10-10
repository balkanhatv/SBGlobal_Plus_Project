import test from "node:test";
import assert from "node:assert/strict";

import {
  EventEnvelopeValidationError,
  buildWebhookDeliveryEventPrePayloadStructureEvidence,
  projectWebhookDeliveryEventPayloadValidationBinding,
  validateWebhookDeliveryEventPayloadEvidence,
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
    secretVersion: -99,
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
    payloadSchema: Object.freeze({
      type: "object",
      properties: Object.freeze({orderId: Object.freeze({type: "string"})}),
    }),
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

function parentEvidence(overrides = {}) {
  const e = Object.hasOwn(overrides, "event") ? overrides.event : event();
  const current = Object.freeze({
    delivery: Object.hasOwn(overrides, "delivery") ? overrides.delivery : delivery(),
    subscription: Object.hasOwn(overrides, "subscription") ? overrides.subscription : subscription(),
    event: e,
    catalog: Object.hasOwn(overrides, "catalog") ? overrides.catalog : catalog(),
  });
  const envelopeEvidence = Object.freeze({
    parent: current,
    envelopeJson: Object.hasOwn(overrides, "envelopeJson")
      ? overrides.envelopeJson
      : e.envelopeJson,
  });
  return Object.freeze({
    parent: envelopeEvidence,
    currentResidency: Object.hasOwn(overrides, "currentResidency")
      ? overrides.currentResidency
      : residency(),
  });
}

function dd527(overrides = {}) {
  const result = buildWebhookDeliveryEventPrePayloadStructureEvidence(
    parentEvidence(overrides),
  );
  assert.ok(result);
  return result;
}

test("WH-EVTPAY-BASE-001 malformed incomplete or substituted DD-527 evidence fails before payload validation", async () => {
  const valid = dd527();
  const calls = [];
  const port = {validatePayload(input) { calls.push(input); }};

  assert.equal(
    await validateWebhookDeliveryEventPayloadEvidence(
      Object.freeze({...valid, envelopeJson: envelope()}),
      port,
    ),
    null,
  );
  assert.equal(
    await validateWebhookDeliveryEventPayloadEvidence(
      Object.freeze({parent: Object.freeze({})}),
      port,
    ),
    null,
  );
  assert.deepEqual(calls, []);
});

test("WH-EVTPAY-BIND-001 TENANT_CORE projects exact identity Tenant and current residency without Industry Context", () => {
  const coreEnvelope = envelope({
    scopeClass: "TENANT_CORE",
    industryContextId: undefined,
  });
  const core = dd527({
    event: event({
      scopeClass: "TENANT_CORE",
      industryContextId: undefined,
      envelopeJson: coreEnvelope,
    }),
    catalog: catalog({scopeClass: "TENANT_CORE"}),
  });
  const binding = projectWebhookDeliveryEventPayloadValidationBinding(core);

  assert.deepEqual(binding, {
    eventId: ids.event,
    eventType: "order.created",
    eventVersion: 1,
    scopeClass: "TENANT_CORE",
    tenantId: ids.tenant,
    tenantResidencyRegion: "IN-CENTRAL",
  });
  assert.equal(Object.isFrozen(binding), true);
});

test("WH-EVTPAY-BIND-002 TENANT_INDUSTRY projects exact identity Tenant Industry and current residency", () => {
  const binding = projectWebhookDeliveryEventPayloadValidationBinding(dd527());
  assert.deepEqual(binding, {
    eventId: ids.event,
    eventType: "order.created",
    eventVersion: 1,
    scopeClass: "TENANT_INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    tenantResidencyRegion: "IN-CENTRAL",
  });
  assert.equal(Object.isFrozen(binding), true);
});

test("WH-EVTPAY-PORT-001 DD-081 payload port runs exactly once with normalized exact catalog schema and payload", async () => {
  const payload = Object.freeze({
    z: -0,
    a: Object.freeze({orderId: "ORDER-1"}),
  });
  const schema = Object.freeze({
    required: Object.freeze(["a"]),
    type: "object",
  });
  const prePayload = dd527({
    event: event({envelopeJson: envelope({
      payload,
      payloadSchema: "order.normalized.v1",
    })}),
    catalog: catalog({payloadSchema: schema}),
  });
  const calls = [];

  const result = await validateWebhookDeliveryEventPayloadEvidence(
    prePayload,
    {validatePayload(input) { calls.push(input); }},
  );

  assert.ok(result);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].eventType, "order.created");
  assert.equal(calls[0].eventVersion, 1);
  assert.equal(calls[0].payloadSchemaId, "order.normalized.v1");
  assert.deepEqual(Object.keys(calls[0].catalogPayloadSchema), ["required", "type"]);
  assert.deepEqual(Object.keys(calls[0].payload), ["a", "z"]);
  assert.equal(calls[0].payload.z, 0);
  assert.equal(Object.is(calls[0].payload.z, -0), false);
  assert.deepEqual(calls[0].payload.a, {orderId: "ORDER-1"});
});

test("WH-EVTPAY-FAIL-001 ordinary payload-validator error is normalized to DD-081 safe validation failure", async () => {
  await assert.rejects(
    validateWebhookDeliveryEventPayloadEvidence(
      dd527(),
      {validatePayload() { throw new Error("schema provider internal detail"); }},
    ),
    error => error instanceof EventEnvelopeValidationError
      && error.message === "The event payload does not satisfy its catalog schema.",
  );
});

test("WH-EVTPAY-FAIL-002 existing EventEnvelopeValidationError is preserved unchanged", async () => {
  const expected = new EventEnvelopeValidationError("safe governed schema rejection");
  await assert.rejects(
    validateWebhookDeliveryEventPayloadEvidence(
      dd527(),
      {validatePayload() { throw expected; }},
    ),
    error => error === expected,
  );
});

test("WH-EVTPAY-EVID-001 success preserves exact DD-527 and envelope identities in immutable evidence", async () => {
  const prePayload = dd527();
  const before = JSON.stringify(prePayload);
  const result = await validateWebhookDeliveryEventPayloadEvidence(
    prePayload,
    {validatePayload() {}},
  );

  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.prePayloadEvidence, prePayload);
  assert.equal(result.envelopeJson, prePayload.envelopeJson);
  assert.equal(JSON.stringify(prePayload), before);
});

test("WH-EVTPAY-BOUND-001 raw RETIRED DEAD filter endpoint and signing evidence remains uninterpreted with no delivery authority", async () => {
  const prePayload = dd527();
  const result = await validateWebhookDeliveryEventPayloadEvidence(
    prePayload,
    {validatePayload() {}},
  );

  assert.ok(result);
  const current = result.prePayloadEvidence.parent.parent.parent;
  assert.equal(current.catalog.status, "RETIRED");
  assert.equal(current.event.status, "DEAD");
  assert.deepEqual(current.subscription.eventFilterJson, {unknownGrammar: true});
  assert.equal(current.delivery.endpointSnapshot, "http://127.0.0.1/raw");

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
