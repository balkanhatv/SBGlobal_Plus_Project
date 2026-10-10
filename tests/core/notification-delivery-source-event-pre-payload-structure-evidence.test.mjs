import test from "node:test";
import assert from "node:assert/strict";

import {
  buildNotificationDeliverySourceEventConsumerMetadataEvidence,
  buildNotificationDeliverySourceEventPrePayloadStructureEvidence,
  matchesNotificationDeliverySourceEventPrePayloadStructureFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  event: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  actor: "44444444-4444-4444-8444-444444444444",
  causation: "55555555-5555-4555-8555-555555555555",
  correlation: "66666666-6666-4666-8666-666666666666",
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

const residency = Object.freeze({
  tenantId: ids.tenant,
  residencyRegionCode: "IN-CENTRAL",
});

function sourceEventEnvelope(envelopeOverrides = {}, catalogOverrides = {}) {
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
  });
  return Object.freeze({
    event: persistedEvent,
    catalog: catalogRow,
    envelopeJson: persistedEnvelope,
  });
}

function dd332(envelopeOverrides = {}, catalogOverrides = {}) {
  const source = sourceEventEnvelope(envelopeOverrides, catalogOverrides);
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

function dd337(envelopeOverrides = {}, catalogOverrides = {}) {
  const result = buildNotificationDeliverySourceEventConsumerMetadataEvidence(
    dd332(envelopeOverrides, catalogOverrides),
  );
  assert.ok(result);
  return result;
}

test("NOTIF-EVTPRE-DATE-001 strict valid occurrence timestamp passes", () => {
  const source = sourceEventEnvelope();
  assert.equal(
    matchesNotificationDeliverySourceEventPrePayloadStructureFloors(
      source,
      residency,
    ),
    true,
  );
});

test("NOTIF-EVTPRE-DATE-002 calendar-invalid runtime-normalizable occurrence date fails closed", () => {
  const source = sourceEventEnvelope({
    occurredAt: "2026-02-30T15:00:00.000Z",
  });
  assert.equal(Number.isFinite(Date.parse(source.envelopeJson.occurredAt)), true);
  assert.equal(
    matchesNotificationDeliverySourceEventPrePayloadStructureFloors(
      source,
      residency,
    ),
    false,
  );
});

test("NOTIF-EVTPRE-PAYLOAD-001 nested JSON-safe payload evidence passes unchanged", () => {
  const payload = Object.freeze({
    deliveryId: "delivery-1",
    nested: Object.freeze({
      count: -0,
      values: Object.freeze([null, true, 4.5, "raw"]),
    }),
  });
  const source = sourceEventEnvelope({payload});
  assert.equal(
    matchesNotificationDeliverySourceEventPrePayloadStructureFloors(
      source,
      residency,
    ),
    true,
  );
  assert.equal(source.envelopeJson.payload, payload);
});

test("NOTIF-EVTPRE-PAYLOAD-002 non-JSON nested payload evidence fails closed", () => {
  class NotJson {
    constructor() {
      this.value = "x";
    }
  }
  for (const payload of [
    Object.freeze({bad: undefined}),
    Object.freeze({bad: Number.POSITIVE_INFINITY}),
    Object.freeze({bad: Object.freeze({nested: new NotJson()})}),
  ]) {
    assert.equal(
      matchesNotificationDeliverySourceEventPrePayloadStructureFloors(
        sourceEventEnvelope({payload}),
        residency,
      ),
      false,
    );
  }
});

test("NOTIF-EVTPRE-SCHEMA-001 catalog payload-schema JSON structure is required without schema interpretation", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventPrePayloadStructureFloors(
      sourceEventEnvelope({}, {
        payloadSchema: Object.freeze({
          type: "object",
          properties: Object.freeze({
            deliveryId: Object.freeze({type: "string"}),
          }),
        }),
      }),
      residency,
    ),
    true,
  );
  assert.equal(
    matchesNotificationDeliverySourceEventPrePayloadStructureFloors(
      sourceEventEnvelope({}, {
        payloadSchema: Object.freeze({type: "object", bad: undefined}),
      }),
      residency,
    ),
    false,
  );
});

test("NOTIF-EVTPRE-BASE-001 invalid DD-336 parent evidence or substituted source-event reference fails closed", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventPrePayloadStructureFloors(
      sourceEventEnvelope({actorPrincipalId: "bad"}),
      residency,
    ),
    false,
  );

  const consumerMetadataEvidence = dd337();
  const substituted = sourceEventEnvelope();
  assert.notEqual(substituted, consumerMetadataEvidence.sourceEventEnvelope);
  assert.equal(
    buildNotificationDeliverySourceEventPrePayloadStructureEvidence(
      Object.freeze({
        ...consumerMetadataEvidence,
        sourceEventEnvelope: substituted,
      }),
    ),
    null,
  );
});

test("NOTIF-EVTPRE-UNBOUND-001 unbound DD-337 evidence preserves exact parent identity without synthesized event", () => {
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

  const result =
    buildNotificationDeliverySourceEventPrePayloadStructureEvidence(
      consumerMetadataEvidence,
    );
  assert.ok(result);
  assert.equal(result.consumerMetadataEvidence, consumerMetadataEvidence);
  assert.equal(Object.hasOwn(result, "sourceEventEnvelope"), false);
  assert.equal(Object.isFrozen(result), true);
});

test("NOTIF-EVTPRE-EVID-001 bound evidence is exact/immutable and adds no schema, lifecycle or delivery authority", () => {
  const consumerMetadataEvidence = dd337({
    payload: Object.freeze({unexpectedButJsonSafe: Object.freeze(["raw"])}),
  });
  const beforePayload =
    consumerMetadataEvidence.sourceEventEnvelope.envelopeJson.payload;
  const source = consumerMetadataEvidence.sourceEventEnvelope;

  const result =
    buildNotificationDeliverySourceEventPrePayloadStructureEvidence(
      consumerMetadataEvidence,
    );
  assert.ok(result);
  assert.equal(result.consumerMetadataEvidence, consumerMetadataEvidence);
  assert.equal(result.sourceEventEnvelope, source);
  assert.equal(result.sourceEventEnvelope.envelopeJson.payload, beforePayload);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.sourceEventEnvelope.catalog.status, "RETIRED");
  assert.equal(result.sourceEventEnvelope.catalog.webhookEligible, true);
  assert.equal(result.sourceEventEnvelope.event.status, "DEAD");

  const malformed = Object.freeze({
    ...consumerMetadataEvidence,
    currentResidencyEvidence: Object.freeze({
      envelopeEvidence:
        consumerMetadataEvidence.currentResidencyEvidence.envelopeEvidence,
    }),
  });
  assert.equal(
    buildNotificationDeliverySourceEventPrePayloadStructureEvidence(malformed),
    null,
  );

  for (const forbidden of [
    "payloadSchemaValid",
    "catalogActive",
    "consumerSelected",
    "webhookAuthorized",
    "dispatchable",
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
