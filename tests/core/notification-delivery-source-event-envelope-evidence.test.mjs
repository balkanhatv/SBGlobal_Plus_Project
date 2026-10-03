import test from "node:test";
import assert from "node:assert/strict";

import {
  buildNotificationDeliverySourceEventEnvelopeEvidence,
  matchesNotificationDeliverySourceEventEnvelopeEvidenceFloors,
  matchesOutboxEventEnvelopeCatalogMetadataFloors,
  matchesOutboxEventEnvelopeIdentityFloors,
  matchesOutboxEventEnvelopeLocalScopeFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  event: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  sourceIndustry: "44444444-4444-4444-8444-444444444444",
  targetIndustry: "55555555-5555-4555-8555-555555555555",
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
    actorType: "SERVICE",
    sourceModule: "notification",
    sourceResourceType: "NotificationDelivery",
    sourceResourceId: "delivery-1",
    correlationId: ids.correlation,
    occurredAt: "2026-09-30T12:00:00.000Z",
    dataSensitivity: "INTERNAL",
    residencyRegion: "IN-CENTRAL",
    payloadSchema: "notification.requested.v1",
    payload: Object.freeze({deliveryId: "delivery-1"}),
    ...overrides,
  });
}

function event(overrides = {}) {
  return Object.freeze({
    id: ids.event,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    eventType: "NOTIFICATION.REQUESTED",
    eventVersion: 1,
    aggregateType: "NotificationDelivery",
    aggregateId: "delivery-1",
    envelopeJson: envelope(),
    status: "PENDING",
    attemptCount: 3,
    availableAt: "2026-09-30T12:00:00.000Z",
    lastErrorCode: "RAW_ONLY",
    createdAt: "2026-09-30T12:00:00.000Z",
    ...overrides,
  });
}

const catalog = Object.freeze({
  eventType: "NOTIFICATION.REQUESTED",
  eventVersion: 1,
  producerModule: "notification",
  scopeClass: "TENANT_INDUSTRY",
  sensitivityClass: "INTERNAL",
  payloadSchema: Object.freeze({type: "object"}),
  consumerClassesJson: Object.freeze(["WORKER"]),
  retentionAuditPosture: "STANDARD",
  webhookEligible: true,
  backwardCompatibility: "NONE",
  status: "RETIRED",
  createdAt: "2026-09-01T00:00:00.000Z",
});

test("NOTIF-EVTENV-ID-001 exact persisted identity and mandatory envelope evidence passes", () => {
  assert.equal(matchesOutboxEventEnvelopeIdentityFloors(event()), true);
});

test("NOTIF-EVTENV-ID-002 id/type/version/scope mismatch fails closed", () => {
  for (const envelopeOverride of [
    {eventId: "77777777-7777-4777-8777-777777777777"},
    {eventType: "OTHER"},
    {eventVersion: 2},
    {scopeClass: "TENANT_CORE"},
  ]) {
    assert.equal(
      matchesOutboxEventEnvelopeIdentityFloors(
        event({envelopeJson: envelope(envelopeOverride)}),
      ),
      false,
    );
  }
});

test("NOTIF-EVTENV-ID-003 invalid correlation/timestamp or missing/blank mandatory field/payload fails closed", () => {
  const withoutPayload = {...envelope()};
  delete withoutPayload.payload;
  for (const envelopeJson of [
    envelope({correlationId: "bad"}),
    envelope({occurredAt: "not-a-date"}),
    envelope({actorType: ""}),
    envelope({sourceResourceType: " "}),
    envelope({sourceResourceId: ""}),
    envelope({payloadSchema: ""}),
    Object.freeze(withoutPayload),
  ]) {
    assert.equal(
      matchesOutboxEventEnvelopeIdentityFloors(event({envelopeJson})),
      false,
    );
  }
});

test("NOTIF-EVTENV-CAT-001 exact producer/sensitivity and DD-321 tuple passes regardless of ACTIVE/RETIRED", () => {
  const candidate = event();
  assert.equal(
    matchesOutboxEventEnvelopeCatalogMetadataFloors(candidate, catalog),
    true,
  );
  assert.equal(
    matchesOutboxEventEnvelopeCatalogMetadataFloors(
      candidate,
      {...catalog, status: "ACTIVE"},
    ),
    true,
  );
});

test("NOTIF-EVTENV-CAT-002 producer/sensitivity/tuple mismatch fails closed", () => {
  const candidate = event();
  for (const catalogOverride of [
    {producerModule: "other"},
    {sensitivityClass: "CONFIDENTIAL"},
    {eventType: "OTHER"},
    {eventVersion: 2},
    {scopeClass: "TENANT_CORE"},
  ]) {
    assert.equal(
      matchesOutboxEventEnvelopeCatalogMetadataFloors(
        candidate,
        {...catalog, ...catalogOverride},
      ),
      false,
    );
  }
});

test("NOTIF-EVTENV-SCOPE-001 valid PLATFORM_GLOBAL/TENANT_CORE/TENANT_INDUSTRY local shape passes", () => {
  const platform = event({
    tenantId: undefined,
    industryContextId: undefined,
    scopeClass: "PLATFORM_GLOBAL",
    envelopeJson: envelope({
      scopeClass: "PLATFORM_GLOBAL",
      tenantId: undefined,
      industryContextId: undefined,
      residencyRegion: undefined,
    }),
  });
  const tenantCore = event({
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
    envelopeJson: envelope({
      scopeClass: "TENANT_CORE",
      industryContextId: undefined,
    }),
  });
  assert.equal(matchesOutboxEventEnvelopeLocalScopeFloors(platform), true);
  assert.equal(matchesOutboxEventEnvelopeLocalScopeFloors(tenantCore), true);
  assert.equal(matchesOutboxEventEnvelopeLocalScopeFloors(event()), true);
});

test("NOTIF-EVTENV-SCOPE-002 Tenant/Industry/selectors mismatch fails closed", () => {
  for (const candidate of [
    event({envelopeJson: envelope({tenantId: "77777777-7777-4777-8777-777777777777"})}),
    event({envelopeJson: envelope({industryContextId: "77777777-7777-4777-8777-777777777777"})}),
    event({envelopeJson: envelope({sourceIndustryContextId: ids.sourceIndustry})}),
    event({
      industryContextId: undefined,
      scopeClass: "TENANT_CORE",
      envelopeJson: envelope({
        scopeClass: "TENANT_CORE",
        industryContextId: ids.industry,
      }),
    }),
  ]) {
    assert.equal(matchesOutboxEventEnvelopeLocalScopeFloors(candidate), false);
  }
});

test("NOTIF-EVTENV-SCOPE-003 EXPLICIT_CROSS_CONTEXT requires exact Tenant plus distinct UUID selectors without claiming endpoint ownership", () => {
  const valid = event({
    industryContextId: undefined,
    scopeClass: "EXPLICIT_CROSS_CONTEXT",
    envelopeJson: envelope({
      scopeClass: "EXPLICIT_CROSS_CONTEXT",
      industryContextId: undefined,
      sourceIndustryContextId: ids.sourceIndustry,
      targetIndustryContextId: ids.targetIndustry,
    }),
  });
  assert.equal(matchesOutboxEventEnvelopeLocalScopeFloors(valid), true);
  assert.equal(matchesOutboxEventEnvelopeLocalScopeFloors({
    ...valid,
    envelopeJson: envelope({
      scopeClass: "EXPLICIT_CROSS_CONTEXT",
      industryContextId: undefined,
      sourceIndustryContextId: ids.sourceIndustry,
      targetIndustryContextId: ids.sourceIndustry,
    }),
  }), false);
  assert.equal(matchesOutboxEventEnvelopeLocalScopeFloors({
    ...valid,
    envelopeJson: envelope({
      scopeClass: "EXPLICIT_CROSS_CONTEXT",
      industryContextId: undefined,
      sourceIndustryContextId: "bad",
      targetIndustryContextId: ids.targetIndustry,
    }),
  }), false);
});

test("NOTIF-EVTENV-COMP-001 exact DD-321 + catalog metadata + local scope evidence passes", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventEnvelopeEvidenceFloors({
      event: event(),
      catalog,
    }),
    true,
  );
});

test("NOTIF-EVTENV-UNBOUND-001 DD-322 unbound evidence remains valid without synthesized source envelope evidence", () => {
  const dd322 = Object.freeze({
    integrationEvidence: Object.freeze({opaque: true}),
  });
  const result = buildNotificationDeliverySourceEventEnvelopeEvidence(dd322);
  assert.ok(result);
  assert.equal(result.catalogEvidence, dd322);
  assert.equal(Object.hasOwn(result, "sourceEventEnvelope"), false);
  assert.equal(Object.isFrozen(result), true);
});

test("NOTIF-EVTENV-EVID-001 bound success preserves exact DD-322/event/catalog/envelope identities in immutable evidence", () => {
  const sourceEvent = event();
  const sourceEventCatalog = Object.freeze({event: sourceEvent, catalog});
  const dd322 = Object.freeze({
    integrationEvidence: Object.freeze({opaque: true}),
    sourceEventCatalog,
  });
  const result = buildNotificationDeliverySourceEventEnvelopeEvidence(dd322);
  assert.ok(result);
  assert.equal(result.catalogEvidence, dd322);
  assert.equal(result.sourceEventEnvelope.event, sourceEvent);
  assert.equal(result.sourceEventEnvelope.catalog, catalog);
  assert.equal(result.sourceEventEnvelope.envelopeJson, sourceEvent.envelopeJson);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.sourceEventEnvelope), true);
});

test("NOTIF-EVTENV-BOUND-001 inputs remain unchanged and output exposes no residency/payload/catalog-lifecycle/dispatch/send authority", () => {
  const sourceEvent = event();
  const dd322 = Object.freeze({
    integrationEvidence: Object.freeze({opaque: true}),
    sourceEventCatalog: Object.freeze({event: sourceEvent, catalog}),
  });
  const before = JSON.stringify(dd322);
  const result = buildNotificationDeliverySourceEventEnvelopeEvidence(dd322);
  assert.ok(result);
  assert.equal(JSON.stringify(dd322), before);
  assert.deepEqual(Object.keys(result).sort(), ["catalogEvidence", "sourceEventEnvelope"]);
  assert.deepEqual(
    Object.keys(result.sourceEventEnvelope).sort(),
    ["catalog", "envelopeJson", "event"],
  );
  for (const forbidden of [
    "residencyCurrent",
    "crossContextOwned",
    "payloadSchemaValid",
    "catalogActive",
    "webhookEligible",
    "dispatchable",
    "retryable",
    "provider",
    "secretMaterial",
    "sendAuthorized",
    "mutation",
  ]) {
    assert.equal(forbidden in result, false);
    assert.equal(forbidden in result.sourceEventEnvelope, false);
  }
});
