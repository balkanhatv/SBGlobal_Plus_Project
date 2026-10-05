import test from "node:test";
import assert from "node:assert/strict";

import {
  buildWebhookDeliveryEventPrePayloadStructureEvidence,
  matchesWebhookDeliveryEventPrePayloadStructureFloors,
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
    payload: Object.freeze({
      orderId: "ORDER-1",
      nested: Object.freeze([1, true, null, Object.freeze({safe: "yes"})]),
    }),
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

function evidence(overrides = {}) {
  const e = Object.hasOwn(overrides, "event") ? overrides.event : event();
  const c = Object.hasOwn(overrides, "catalog") ? overrides.catalog : catalog();
  const current = Object.freeze({
    delivery: Object.hasOwn(overrides, "delivery") ? overrides.delivery : delivery(),
    subscription: Object.hasOwn(overrides, "subscription") ? overrides.subscription : subscription(),
    event: e,
    catalog: c,
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

test("WH-EVTPRE-DATE-001 strict valid occurrence timestamp passes unchanged", () => {
  const parent = evidence();
  assert.equal(matchesWebhookDeliveryEventPrePayloadStructureFloors(parent), true);
  const result = buildWebhookDeliveryEventPrePayloadStructureEvidence(parent);
  assert.ok(result);
  assert.equal(result.envelopeJson.occurredAt, "2026-10-05T05:00:00.000Z");
});

test("WH-EVTPRE-DATE-002 calendar-invalid but runtime-parseable occurrence date fails closed", () => {
  const invalidEnvelope = envelope({occurredAt: "2026-02-30T05:00:00.000Z"});
  const parent = evidence({event: event({envelopeJson: invalidEnvelope})});
  assert.equal(matchesWebhookDeliveryEventPrePayloadStructureFloors(parent), false);
  assert.equal(buildWebhookDeliveryEventPrePayloadStructureEvidence(parent), null);
});

test("WH-EVTPRE-PAYLOAD-001 nested JSON-safe payload evidence passes unchanged", () => {
  const parent = evidence();
  const before = JSON.stringify(parent);
  const result = buildWebhookDeliveryEventPrePayloadStructureEvidence(parent);
  assert.ok(result);
  assert.equal(result.envelopeJson.payload, parent.parent.envelopeJson.payload);
  assert.equal(JSON.stringify(parent), before);
});

test("WH-EVTPRE-PAYLOAD-002 undefined non-finite sparse or custom-prototype nested payload evidence fails closed", () => {
  const sparse = [];
  sparse.length = 2;
  sparse[0] = "present";

  class CustomPayload {
    constructor() {
      this.value = "raw";
    }
  }

  const candidates = [
    {nested: undefined},
    {nested: Number.POSITIVE_INFINITY},
    sparse,
    new CustomPayload(),
  ];

  for (const payload of candidates) {
    const invalidEnvelope = envelope({payload});
    const parent = evidence({event: event({envelopeJson: invalidEnvelope})});
    assert.equal(matchesWebhookDeliveryEventPrePayloadStructureFloors(parent), false);
    assert.equal(buildWebhookDeliveryEventPrePayloadStructureEvidence(parent), null);
  }
});

test("WH-EVTPRE-SCHEMA-001 JSON-safe catalog payload-schema passes while malformed JSON structure fails closed", () => {
  assert.ok(buildWebhookDeliveryEventPrePayloadStructureEvidence(evidence()));

  const malformed = Object.create({inherited: true});
  malformed.type = "object";
  const parent = evidence({catalog: catalog({payloadSchema: malformed})});
  assert.equal(matchesWebhookDeliveryEventPrePayloadStructureFloors(parent), false);
  assert.equal(buildWebhookDeliveryEventPrePayloadStructureEvidence(parent), null);
});

test("WH-EVTPRE-BASE-001 malformed substituted DD-522 parent or current-residency evidence fails closed", () => {
  const original = evidence();
  const substitutedEnvelope = envelope();

  const cases = [
    Object.freeze({
      parent: Object.freeze({
        parent: original.parent.parent,
        envelopeJson: substitutedEnvelope,
      }),
      currentResidency: original.currentResidency,
    }),
    evidence({currentResidency: residency({residencyRegionCode: "EU-WEST"})}),
    evidence({delivery: delivery({eventId: "88888888-8888-4888-8888-888888888888"})}),
    evidence({subscription: subscription({status: "PAUSED"})}),
  ];

  for (const parent of cases) {
    assert.equal(matchesWebhookDeliveryEventPrePayloadStructureFloors(parent), false);
    assert.equal(buildWebhookDeliveryEventPrePayloadStructureEvidence(parent), null);
  }
});

test("WH-EVTPRE-EVID-001 success preserves exact DD-522 and envelope identities in immutable evidence with zero side effects", () => {
  const parent = evidence();
  const before = JSON.stringify(parent);
  const result = buildWebhookDeliveryEventPrePayloadStructureEvidence(parent);

  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.parent, parent);
  assert.equal(result.envelopeJson, parent.parent.envelopeJson);
  assert.equal(result.envelopeJson, parent.parent.parent.event.envelopeJson);
  assert.equal(JSON.stringify(parent), before);
});

test("WH-EVTPRE-BOUND-001 output grants no payload schema lifecycle filter endpoint signing retry cross-context dispatch network or mutation authority", () => {
  const result = buildWebhookDeliveryEventPrePayloadStructureEvidence(evidence());
  assert.ok(result);

  for (const forbidden of [
    "payloadSchemaValid",
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
