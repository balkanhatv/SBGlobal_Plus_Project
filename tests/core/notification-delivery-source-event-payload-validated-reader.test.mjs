import test from "node:test";
import assert from "node:assert/strict";

import {
  EventEnvelopeValidationError,
  loadNotificationDeliverySourceEventPayloadValidatedEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  delivery: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  integration: "44444444-4444-4444-8444-444444444444",
  definition: "55555555-5555-4555-8555-555555555555",
  credential: "66666666-6666-4666-8666-666666666666",
  event: "77777777-7777-4777-8777-777777777777",
  template: "88888888-8888-4888-8888-888888888888",
  attempt: "99999999-9999-4999-8999-999999999999",
  cap: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  correlation: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
});

const requestContext = Object.freeze({
  requestId: "request-1",
  correlationId: "correlation-1",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  dataHomeId: "home-1",
  regionCode: "IN-CENTRAL",
  principalId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  principalType: "HUMAN",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  scopeClass: "TENANT_INDUSTRY",
});

const baseDelivery = Object.freeze({
  id: ids.delivery,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  scopeClass: "TENANT_INDUSTRY",
  templateId: ids.template,
  templateVersion: 1,
  recipientReference: "recipient@example.test",
  channel: "EMAIL",
  tenantIntegrationId: ids.integration,
  correlationId: ids.correlation,
  sourceEventId: ids.event,
  status: "QUEUED",
  queuedAt: "2026-10-01T00:00:00.000Z",
  rowVersion: 1,
});

const integration = Object.freeze({
  id: ids.integration,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  integrationDefinitionId: ids.definition,
  scopeClass: "TENANT_INDUSTRY",
  displayName: "Provider",
  status: "ACTIVE",
  credentialReferenceId: ids.credential,
  config: Object.freeze({}),
  enabledCapabilities: Object.freeze(["notify.email"]),
  healthState: "UNKNOWN",
  version: 1,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
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
    sourceResourceId: ids.delivery,
    correlationId: ids.correlation,
    occurredAt: "2026-10-01T00:00:00.000Z",
    dataSensitivity: "INTERNAL",
    residencyRegion: "IN-CENTRAL",
    payloadSchema: "notification.requested.v1",
    payload: Object.freeze({deliveryId: ids.delivery}),
    ...overrides,
  });
}

function event(envelopeOverrides = {}) {
  const persistedEnvelope = envelope(envelopeOverrides);
  return Object.freeze({
    id: ids.event,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    eventType: "NOTIFICATION.REQUESTED",
    eventVersion: 1,
    aggregateType: "NotificationDelivery",
    aggregateId: ids.delivery,
    envelopeJson: persistedEnvelope,
    status: "PENDING",
    attemptCount: 0,
    availableAt: "2026-10-01T00:00:00.000Z",
    createdAt: "2026-10-01T00:00:00.000Z",
  });
}

const template = Object.freeze({
  id: ids.template,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  code: "DELIVERY",
  channel: "EMAIL",
  localeCode: "en-IN",
  version: 1,
  status: "ACTIVE",
  bodyTemplate: "Body",
  variableSchema: Object.freeze({}),
  createdBy: "admin",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
});

const attempt = Object.freeze({
  id: ids.attempt,
  deliveryId: ids.delivery,
  attemptNo: 1,
  normalizedStatus: "RAW",
  startedAt: "2026-10-01T00:01:00.000Z",
});

const credential = Object.freeze({
  id: ids.credential,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  secretStoreProvider: "vault",
  credentialType: "API_KEY",
  keyVersion: 1,
  status: "ACTIVE",
  createdAt: "2026-09-01T00:00:00.000Z",
});

const definition = Object.freeze({
  id: ids.definition,
  code: "notify-provider",
  name: "Notify Provider",
  providerFamily: "example",
  capabilityCodes: Object.freeze(["notify.email"]),
  adapterContractVersion: "v1",
  ownerScope: "PLATFORM",
  status: "ACTIVE",
  dataTransferClass: "INTERNAL",
  residencyMetadata: Object.freeze({}),
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
});

const capability = Object.freeze({
  id: ids.cap,
  integrationDefinitionId: ids.definition,
  capabilityCode: "notify.email",
  direction: "OUTBOUND",
  eventTypes: Object.freeze([]),
  dataClass: "INTERNAL",
  idempotencyClass: "STANDARD",
  rateClass: "AUTH_STANDARD",
  status: "ACTIVE",
});

const catalog = Object.freeze({
  eventType: "NOTIFICATION.REQUESTED",
  eventVersion: 1,
  producerModule: "notification",
  scopeClass: "TENANT_INDUSTRY",
  sensitivityClass: "INTERNAL",
  payloadSchema: Object.freeze({type: "object"}),
  consumerClassesJson: Object.freeze([]),
  retentionAuditPosture: "STANDARD",
  webhookEligible: false,
  backwardCompatibility: "NONE",
  status: "RETIRED",
  createdAt: "2026-09-01T00:00:00.000Z",
});

const residency = Object.freeze({
  tenantId: ids.tenant,
  residencyRegionCode: "IN-CENTRAL",
});

const input = Object.freeze({
  requestContext,
  notificationDeliveryId: ids.delivery,
  evaluatedAt: "2026-10-01T12:00:00.000Z",
});

function fixture(overrides = {}) {
  const order = [];
  const calls = {
    delivery: [],
    event: [],
    catalog: [],
    residency: [],
    payload: [],
  };
  const sourceEvent = event(overrides.envelope ?? {});
  const delivery = Object.hasOwn(overrides, "delivery")
    ? overrides.delivery
    : baseDelivery;

  return {
    order,
    calls,
    delivery,
    sourceEvent,
    deliveryReader: {
      async loadForContext(value) {
        order.push("delivery");
        calls.delivery.push(value);
        if (overrides.parentError) throw overrides.parentError;
        return delivery;
      },
    },
    integrationReader: {
      async loadForContext() {
        order.push("integration");
        return integration;
      },
    },
    eventReader: {
      async loadForContext(value) {
        order.push("event");
        calls.event.push(value);
        return sourceEvent;
      },
    },
    templateReader: {
      async loadForContext() {
        order.push("template");
        return template;
      },
    },
    attemptReader: {
      async loadForDelivery() {
        order.push("attempt");
        return [attempt];
      },
    },
    credentialReader: {
      async loadForContext() {
        order.push("credential");
        return credential;
      },
    },
    definitionReader: {
      async loadById() {
        order.push("definition");
        return definition;
      },
    },
    capabilityReader: {
      async loadExact() {
        order.push("capability");
        return capability;
      },
    },
    eventCatalogReader: {
      async loadExact(value) {
        order.push("catalog");
        calls.catalog.push(value);
        return catalog;
      },
    },
    residencyReader: {
      async loadCurrentForContext(value) {
        order.push("residency");
        calls.residency.push(value);
        return residency;
      },
    },
    payloadValidator: {
      validatePayload(value) {
        order.push("payload");
        calls.payload.push(value);
        if (overrides.payloadError) throw overrides.payloadError;
      },
    },
  };
}

async function load(f) {
  return loadNotificationDeliverySourceEventPayloadValidatedEvidence(
    input,
    f.deliveryReader,
    f.integrationReader,
    f.eventReader,
    f.templateReader,
    f.attemptReader,
    f.credentialReader,
    f.definitionReader,
    f.capabilityReader,
    f.eventCatalogReader,
    f.residencyReader,
    f.payloadValidator,
  );
}

test("NOTIF-EVTPAYREAD-BASE-001 DD-332 reader chain executes before payload validation with exact parent inputs", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(f.calls.delivery.length, 1);
  assert.equal(f.calls.delivery[0].requestContext, requestContext);
  assert.equal(f.calls.delivery[0].notificationDeliveryId, ids.delivery);
  assert.deepEqual(f.calls.residency, [{
    requestContext,
    tenantId: ids.tenant,
  }]);
  assert.ok(f.order.indexOf("payload") > f.order.indexOf("residency"));
  assert.ok(f.order.indexOf("payload") > f.order.indexOf("catalog"));
});

test("NOTIF-EVTPAYREAD-BASE-002 parent null/error stops before payload validation", async () => {
  const absent = fixture({delivery: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.calls.payload, []);

  const failure = new Error("parent-failed");
  const broken = fixture({parentError: failure});
  await assert.rejects(load(broken), error => error === failure);
  assert.deepEqual(broken.calls.payload, []);
});

test("NOTIF-EVTPAYREAD-UNBOUND-001 unbound source event succeeds without event/catalog/residency/payload access", async () => {
  const f = fixture({
    delivery: Object.freeze({...baseDelivery, sourceEventId: undefined}),
  });
  const result = await load(f);
  assert.ok(result);
  assert.deepEqual(f.calls.event, []);
  assert.deepEqual(f.calls.catalog, []);
  assert.deepEqual(f.calls.residency, []);
  assert.deepEqual(f.calls.payload, []);
  assert.equal(Object.hasOwn(result, "sourceEventEnvelope"), false);
  assert.equal(Object.isFrozen(result), true);
});

test("NOTIF-EVTPAYREAD-PRE-001 calendar-invalid parseable occurredAt fails before payload validation", async () => {
  const f = fixture({
    envelope: {occurredAt: "2026-02-30T15:00:00.000Z"},
  });
  assert.equal(Number.isFinite(Date.parse(f.sourceEvent.envelopeJson.occurredAt)), true);
  assert.equal(await load(f), null);
  assert.deepEqual(f.calls.payload, []);
});

test("NOTIF-EVTPAYREAD-PRE-002 structurally non-JSON payload fails before payload validation", async () => {
  const f = fixture({
    envelope: {payload: Object.freeze({bad: undefined})},
  });
  assert.equal(await load(f), null);
  assert.deepEqual(f.calls.payload, []);
});

test("NOTIF-EVTPAYREAD-PAY-001 valid bound evidence invokes DD-081 payload port exactly once and returns DD-347 evidence", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(f.calls.payload.length, 1);
  assert.equal(f.calls.payload[0].eventType, "NOTIFICATION.REQUESTED");
  assert.equal(f.calls.payload[0].eventVersion, 1);
  assert.equal(
    f.calls.payload[0].payloadSchemaId,
    "notification.requested.v1",
  );
  assert.deepEqual(f.calls.payload[0].catalogPayloadSchema, {type: "object"});
  assert.deepEqual(f.calls.payload[0].payload, {deliveryId: ids.delivery});
  assert.equal(result.sourceEventEnvelope.event, f.sourceEvent);
  assert.equal(result.sourceEventEnvelope.catalog, catalog);
  assert.equal(
    result.prePayloadEvidence.consumerMetadataEvidence
      .currentResidencyEvidence.currentResidency,
    residency,
  );
});

test("NOTIF-EVTPAYREAD-FAIL-001 DD-347 payload failure semantics propagate unchanged", async () => {
  const ordinary = fixture({payloadError: new Error("provider detail")});
  await assert.rejects(
    load(ordinary),
    error => error instanceof EventEnvelopeValidationError
      && error.message
        === "The event payload does not satisfy its catalog schema.",
  );

  const expected =
    new EventEnvelopeValidationError("safe governed schema rejection");
  const governed = fixture({payloadError: expected});
  await assert.rejects(load(governed), error => error === expected);
});

test("NOTIF-EVTPAYREAD-EVID-001 success preserves exact nested identities, immutability and no execution authority", async () => {
  const f = fixture();
  const before = JSON.stringify(input);
  const result = await load(f);
  assert.ok(result);
  assert.equal(JSON.stringify(input), before);
  assert.equal(result.sourceEventEnvelope.event, f.sourceEvent);
  assert.equal(result.sourceEventEnvelope.envelopeJson, f.sourceEvent.envelopeJson);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.prePayloadEvidence), true);

  for (const forbidden of [
    "catalogActive",
    "consumerSelected",
    "idempotent",
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
