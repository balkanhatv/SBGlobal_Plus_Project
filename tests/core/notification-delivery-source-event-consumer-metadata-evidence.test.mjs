import test from "node:test";
import assert from "node:assert/strict";

import {
  buildNotificationDeliverySourceEventConsumerMetadataEvidence,
  matchesNotificationDeliverySourceEventConsumerMetadataFloors,
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

function event(envelopeOverrides = {}) {
  return Object.freeze({
    id: ids.event,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    eventType: "NOTIFICATION.REQUESTED",
    eventVersion: 1,
    aggregateType: "NotificationDelivery",
    aggregateId: "delivery-1",
    aggregateVersion: "999",
    envelopeJson: envelope(envelopeOverrides),
    status: "DEAD",
    attemptCount: 99,
    availableAt: "2026-10-01T08:00:00.000Z",
    lastErrorCode: "RAW_ONLY",
    createdAt: "2026-10-01T08:00:00.000Z",
  });
}

const catalog = Object.freeze({
  eventType: "NOTIFICATION.REQUESTED",
  eventVersion: 1,
  producerModule: "notification",
  scopeClass: "TENANT_INDUSTRY",
  sensitivityClass: "INTERNAL",
  payloadSchema: Object.freeze({type: "object", required: Object.freeze(["deliveryId"])}),
  consumerClassesJson: Object.freeze(["NOTIFICATION"]),
  retentionAuditPosture: "STANDARD",
  webhookEligible: true,
  backwardCompatibility: "NONE",
  status: "RETIRED",
  createdAt: "2026-09-01T00:00:00.000Z",
});

const residency = Object.freeze({
  tenantId: ids.tenant,
  residencyRegionCode: "IN-CENTRAL",
});

function sourceEventEnvelope(envelopeOverrides = {}) {
  const persistedEvent = event(envelopeOverrides);
  return Object.freeze({
    event: persistedEvent,
    catalog,
    envelopeJson: persistedEvent.envelopeJson,
  });
}

function dd332(envelopeOverrides = {}) {
  const source = sourceEventEnvelope(envelopeOverrides);
  const catalogEvidence = Object.freeze({
    integrationEvidence: Object.freeze({opaque: true}),
    sourceEventCatalog: Object.freeze({
      event: source.event,
      catalog,
    }),
  });
  const envelopeEvidence = Object.freeze({
    catalogEvidence,
    sourceEventEnvelope: source,
  });
  return Object.freeze({
    envelopeEvidence,
    currentResidency: residency,
  });
}

test("NOTIF-EVTMETA-FLOOR-001 valid optional actor/causation UUIDs and absent optional values pass", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventConsumerMetadataFloors(
      sourceEventEnvelope(),
      residency,
    ),
    true,
  );
  assert.equal(
    matchesNotificationDeliverySourceEventConsumerMetadataFloors(
      sourceEventEnvelope({
        actorPrincipalId: undefined,
        causationId: undefined,
        aggregateVersion: undefined,
      }),
      residency,
    ),
    true,
  );
});

test("NOTIF-EVTMETA-FLOOR-002 malformed actorPrincipalId fails closed", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventConsumerMetadataFloors(
      sourceEventEnvelope({actorPrincipalId: "not-a-uuid"}),
      residency,
    ),
    false,
  );
});

test("NOTIF-EVTMETA-FLOOR-003 malformed causationId fails closed", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventConsumerMetadataFloors(
      sourceEventEnvelope({causationId: ""}),
      residency,
    ),
    false,
  );
});

test("NOTIF-EVTMETA-FLOOR-004 aggregateVersion matches exact DD-081 structural integer semantics", () => {
  for (const aggregateVersion of [0, -7, 42, "0", "-7", "0042"]) {
    assert.equal(
      matchesNotificationDeliverySourceEventConsumerMetadataFloors(
        sourceEventEnvelope({aggregateVersion}),
        residency,
      ),
      true,
      String(aggregateVersion),
    );
  }
  for (const aggregateVersion of [1.5, Number.MAX_SAFE_INTEGER + 1, "1.5", "+1", "", {}, []]) {
    assert.equal(
      matchesNotificationDeliverySourceEventConsumerMetadataFloors(
        sourceEventEnvelope({aggregateVersion}),
        residency,
      ),
      false,
      String(aggregateVersion),
    );
  }
});

test("NOTIF-EVTMETA-BASE-001 invalid DD-326 or DD-330 parent evidence fails closed", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventConsumerMetadataFloors(
      sourceEventEnvelope({sourceModule: "wrong"}),
      residency,
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliverySourceEventConsumerMetadataFloors(
      sourceEventEnvelope(),
      Object.freeze({...residency, residencyRegionCode: "EU-WEST"}),
    ),
    false,
  );
});

test("NOTIF-EVTMETA-UNBOUND-001 unbound source event preserves exact DD-332 evidence without synthesized metadata", () => {
  const currentResidencyEvidence = Object.freeze({
    envelopeEvidence: Object.freeze({
      catalogEvidence: Object.freeze({
        integrationEvidence: Object.freeze({opaque: true}),
      }),
    }),
  });
  const result =
    buildNotificationDeliverySourceEventConsumerMetadataEvidence(
      currentResidencyEvidence,
    );
  assert.ok(result);
  assert.equal(result.currentResidencyEvidence, currentResidencyEvidence);
  assert.equal(Object.hasOwn(result, "sourceEventEnvelope"), false);
  assert.equal(Object.isFrozen(result), true);
});

test("NOTIF-EVTMETA-EVID-001 bound success preserves exact DD-332/source-event identities and immutable evidence", () => {
  const currentResidencyEvidence = dd332();
  const source =
    currentResidencyEvidence.envelopeEvidence.sourceEventEnvelope;
  const result =
    buildNotificationDeliverySourceEventConsumerMetadataEvidence(
      currentResidencyEvidence,
    );
  assert.ok(result);
  assert.equal(result.currentResidencyEvidence, currentResidencyEvidence);
  assert.equal(result.sourceEventEnvelope, source);
  assert.equal(Object.isFrozen(result), true);
});

test("NOTIF-EVTMETA-EVID-002 incomplete or malformed bound DD-332 evidence returns null", () => {
  const currentResidencyEvidence = dd332();
  assert.equal(
    buildNotificationDeliverySourceEventConsumerMetadataEvidence(
      Object.freeze({
        envelopeEvidence: currentResidencyEvidence.envelopeEvidence,
      }),
    ),
    null,
  );
  assert.equal(
    buildNotificationDeliverySourceEventConsumerMetadataEvidence(
      Object.freeze({
        envelopeEvidence: Object.freeze({
          ...currentResidencyEvidence.envelopeEvidence,
          sourceEventEnvelope: sourceEventEnvelope({actorPrincipalId: "bad"}),
        }),
        currentResidency: residency,
      }),
    ),
    null,
  );
});

test("NOTIF-EVTMETA-BOUNDARY-001 lifecycle/payload/provider/readiness authority remains uninterpreted and inputs unchanged", () => {
  const currentResidencyEvidence = dd332({
    payload: Object.freeze({unexpectedButRaw: Object.freeze(["evidence"])}),
  });
  const before = JSON.stringify(currentResidencyEvidence);
  const result =
    buildNotificationDeliverySourceEventConsumerMetadataEvidence(
      currentResidencyEvidence,
    );
  assert.ok(result);
  assert.equal(JSON.stringify(currentResidencyEvidence), before);
  assert.equal(result.sourceEventEnvelope.catalog.status, "RETIRED");
  assert.equal(result.sourceEventEnvelope.catalog.webhookEligible, true);
  assert.equal(result.sourceEventEnvelope.event.status, "DEAD");
  for (const forbidden of [
    "payloadSchemaValid",
    "catalogActive",
    "consumerSelected",
    "webhookAuthorized",
    "dispatchable",
    "retryable",
    "recipientCurrent",
    "provider",
    "credential",
    "rendered",
    "sendAuthorized",
    "mutation",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
