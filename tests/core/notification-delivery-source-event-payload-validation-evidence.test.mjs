import test from "node:test";
import assert from "node:assert/strict";

import {
  EventEnvelopeValidationError,
  buildNotificationDeliverySourceEventConsumerMetadataEvidence,
  buildNotificationDeliverySourceEventPrePayloadStructureEvidence,
  projectNotificationDeliverySourceEventPayloadValidationBinding,
  validateNotificationDeliverySourceEventPayloadEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  event: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  actor: "44444444-4444-4444-8444-444444444444",
  causation: "55555555-5555-4555-8555-555555555555",
  correlation: "66666666-6666-4666-8666-666666666666",
});

const residency = Object.freeze({
  tenantId: ids.tenant,
  residencyRegionCode: "IN-CENTRAL",
});

function envelope(overrides = {}) {
  return Object.freeze({
    eventId: ids.event,
    eventType: "NOTIFICATION.REQUESTED",
    eventVersion: 1,
    scopeClass: "TENANT_INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    actorPrincipalId: ids.actor,
    actorType: "SERVICE",
    sourceModule: "notification",
    sourceResourceType: "NotificationDelivery",
    sourceResourceId: "delivery-1",
    aggregateVersion: "42",
    correlationId: ids.correlation,
    causationId: ids.causation,
    occurredAt: "2026-10-01T08:00:00.000Z",
    dataSensitivity: "INTERNAL",
    residencyRegion: "IN-CENTRAL",
    payloadSchema: "notification.requested.v1",
    payload: Object.freeze({deliveryId: "delivery-1"}),
    ...overrides,
  });
}

function catalog(overrides = {}) {
  return Object.freeze({
    eventType: "NOTIFICATION.REQUESTED",
    eventVersion: 1,
    producerModule: "notification",
    scopeClass: "TENANT_INDUSTRY",
    sensitivityClass: "INTERNAL",
    payloadSchema: Object.freeze({
      type: "object",
      required: Object.freeze(["deliveryId"]),
    }),
    consumerClassesJson: Object.freeze(["NOTIFICATION"]),
    retentionAuditPosture: "STANDARD",
    webhookEligible: true,
    backwardCompatibility: "NONE",
    status: "RETIRED",
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  });
}

function sourceEventEnvelope(
  envelopeOverrides = {},
  catalogOverrides = {},
  eventOverrides = {},
) {
  const catalogRow = catalog(catalogOverrides);
  const persistedEnvelope = envelope(envelopeOverrides);
  const persistedEvent = Object.freeze({
    id: ids.event,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    eventType: "NOTIFICATION.REQUESTED",
    eventVersion: 1,
    aggregateType: "NotificationDelivery",
    aggregateId: "delivery-1",
    aggregateVersion: "999",
    envelopeJson: persistedEnvelope,
    status: "DEAD",
    attemptCount: 99,
    availableAt: "2026-10-01T08:00:00.000Z",
    lastErrorCode: "RAW_ONLY",
    createdAt: "2026-10-01T08:00:00.000Z",
    ...eventOverrides,
  });
  return Object.freeze({
    event: persistedEvent,
    catalog: catalogRow,
    envelopeJson: persistedEnvelope,
  });
}

function dd332(envelopeOverrides = {}, catalogOverrides = {}, eventOverrides = {}) {
  const source =
    sourceEventEnvelope(envelopeOverrides, catalogOverrides, eventOverrides);
  return Object.freeze({
    envelopeEvidence: Object.freeze({
      catalogEvidence: Object.freeze({
        integrationEvidence: Object.freeze({opaque: true}),
        sourceEventCatalog: Object.freeze({
          event: source.event,
          catalog: source.catalog,
        }),
      }),
      sourceEventEnvelope: source,
    }),
    currentResidency: residency,
  });
}

function dd342(envelopeOverrides = {}, catalogOverrides = {}, eventOverrides = {}) {
  const consumerMetadataEvidence =
    buildNotificationDeliverySourceEventConsumerMetadataEvidence(
      dd332(envelopeOverrides, catalogOverrides, eventOverrides),
    );
  assert.ok(consumerMetadataEvidence);
  const result =
    buildNotificationDeliverySourceEventPrePayloadStructureEvidence(
      consumerMetadataEvidence,
    );
  assert.ok(result);
  return result;
}

test("NOTIF-EVTPAY-UNBOUND-001 unbound DD-342 evidence succeeds without payload validation", async () => {
  const currentResidencyEvidence = Object.freeze({
    envelopeEvidence: Object.freeze({
      catalogEvidence: Object.freeze({
        integrationEvidence: Object.freeze({opaque: true}),
      }),
    }),
  });
  const consumerMetadataEvidence =
    buildNotificationDeliverySourceEventConsumerMetadataEvidence(
      currentResidencyEvidence,
    );
  assert.ok(consumerMetadataEvidence);
  const prePayloadEvidence =
    buildNotificationDeliverySourceEventPrePayloadStructureEvidence(
      consumerMetadataEvidence,
    );
  assert.ok(prePayloadEvidence);

  const calls = [];
  const result =
    await validateNotificationDeliverySourceEventPayloadEvidence(
      prePayloadEvidence,
      {validatePayload(input) { calls.push(input); }},
    );

  assert.ok(result);
  assert.equal(result.prePayloadEvidence, prePayloadEvidence);
  assert.equal(Object.hasOwn(result, "sourceEventEnvelope"), false);
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(calls, []);
});

test("NOTIF-EVTPAY-BASE-001 malformed DD-342 evidence or substituted source-event reference fails before port invocation", async () => {
  const prePayloadEvidence = dd342();
  const calls = [];
  const port = {validatePayload(input) { calls.push(input); }};

  assert.equal(
    await validateNotificationDeliverySourceEventPayloadEvidence(
      Object.freeze({
        ...prePayloadEvidence,
        sourceEventEnvelope: sourceEventEnvelope(),
      }),
      port,
    ),
    null,
  );
  assert.equal(
    await validateNotificationDeliverySourceEventPayloadEvidence(
      Object.freeze({consumerMetadataEvidence: Object.freeze({})}),
      port,
    ),
    null,
  );
  assert.deepEqual(calls, []);
});

test("NOTIF-EVTPAY-BIND-001 exact Tenant/Industry/current-residency persistence binding is projected", () => {
  const source = sourceEventEnvelope();
  const binding =
    projectNotificationDeliverySourceEventPayloadValidationBinding(
      source,
      residency,
    );
  assert.deepEqual(binding, {
    eventId: ids.event,
    eventType: "NOTIFICATION.REQUESTED",
    eventVersion: 1,
    scopeClass: "TENANT_INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    tenantResidencyRegion: "IN-CENTRAL",
  });
  assert.equal(Object.isFrozen(binding), true);
});

test("NOTIF-EVTPAY-PORT-001 DD-081 payload port runs once with normalized schema/payload only after parent validation", async () => {
  const payload = Object.freeze({
    z: -0,
    a: Object.freeze({deliveryId: "delivery-1"}),
  });
  const schema = Object.freeze({
    required: Object.freeze(["a"]),
    type: "object",
  });
  const prePayloadEvidence = dd342(
    {payload, payloadSchema: "notification.normalized.v1"},
    {payloadSchema: schema},
  );
  const calls = [];

  const result =
    await validateNotificationDeliverySourceEventPayloadEvidence(
      prePayloadEvidence,
      {
        validatePayload(input) {
          calls.push(input);
        },
      },
    );

  assert.ok(result);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].eventType, "NOTIFICATION.REQUESTED");
  assert.equal(calls[0].eventVersion, 1);
  assert.equal(calls[0].payloadSchemaId, "notification.normalized.v1");
  assert.deepEqual(Object.keys(calls[0].catalogPayloadSchema), ["required", "type"]);
  assert.deepEqual(Object.keys(calls[0].payload), ["a", "z"]);
  assert.equal(calls[0].payload.z, 0);
  assert.equal(Object.is(calls[0].payload.z, -0), false);
  assert.deepEqual(calls[0].payload.a, {deliveryId: "delivery-1"});
});

test("NOTIF-EVTPAY-FAIL-001 ordinary payload-validator error is normalized to DD-081 safe validation failure", async () => {
  const prePayloadEvidence = dd342();
  await assert.rejects(
    validateNotificationDeliverySourceEventPayloadEvidence(
      prePayloadEvidence,
      {
        validatePayload() {
          throw new Error("schema provider internal detail");
        },
      },
    ),
    error => error instanceof EventEnvelopeValidationError
      && error.message === "The event payload does not satisfy its catalog schema.",
  );
});

test("NOTIF-EVTPAY-FAIL-002 existing EventEnvelopeValidationError is preserved", async () => {
  const prePayloadEvidence = dd342();
  const expected = new EventEnvelopeValidationError("safe governed schema rejection");
  await assert.rejects(
    validateNotificationDeliverySourceEventPayloadEvidence(
      prePayloadEvidence,
      {
        validatePayload() {
          throw expected;
        },
      },
    ),
    error => error === expected,
  );
});

test("NOTIF-EVTPAY-EVID-001 success preserves exact DD-342/source-event identities and immutable evidence", async () => {
  const prePayloadEvidence = dd342();
  const source = prePayloadEvidence.sourceEventEnvelope;
  const before = JSON.stringify(prePayloadEvidence);

  const result =
    await validateNotificationDeliverySourceEventPayloadEvidence(
      prePayloadEvidence,
      {validatePayload() {}},
    );

  assert.ok(result);
  assert.equal(result.prePayloadEvidence, prePayloadEvidence);
  assert.equal(result.sourceEventEnvelope, source);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(JSON.stringify(prePayloadEvidence), before);
});

test("NOTIF-EVTPAY-BOUNDARY-001 RETIRED/DEAD raw evidence remains uninterpreted and no delivery authority is synthesized", async () => {
  const prePayloadEvidence = dd342();
  const result =
    await validateNotificationDeliverySourceEventPayloadEvidence(
      prePayloadEvidence,
      {validatePayload() {}},
    );

  assert.ok(result);
  assert.equal(result.sourceEventEnvelope.catalog.status, "RETIRED");
  assert.equal(result.sourceEventEnvelope.catalog.webhookEligible, true);
  assert.equal(result.sourceEventEnvelope.event.status, "DEAD");

  for (const forbidden of [
    "catalogActive",
    "consumerSelected",
    "webhookAuthorized",
    "dispatchable",
    "ready",
    "retryable",
    "provider",
    "credential",
    "rendered",
    "sendAuthorized",
    "mutation",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
