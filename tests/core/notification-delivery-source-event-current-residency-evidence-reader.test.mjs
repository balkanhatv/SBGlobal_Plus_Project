import test from "node:test";
import assert from "node:assert/strict";

import {
  loadNotificationDeliverySourceEventCurrentResidencyEvidence,
  matchesNotificationDeliverySourceEventCurrentResidencyFloors,
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

const delivery = Object.freeze({
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
  queuedAt: "2026-09-30T00:00:00.000Z",
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
  updatedAt: "2026-09-30T00:00:00.000Z",
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
    occurredAt: "2026-09-30T00:00:00.000Z",
    dataSensitivity: "INTERNAL",
    residencyRegion: "IN-CENTRAL",
    payloadSchema: "notification.requested.v1",
    payload: Object.freeze({deliveryId: ids.delivery}),
    ...overrides,
  });
}

const event = Object.freeze({
  id: ids.event,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  scopeClass: "TENANT_INDUSTRY",
  eventType: "NOTIFICATION.REQUESTED",
  eventVersion: 1,
  aggregateType: "NotificationDelivery",
  aggregateId: ids.delivery,
  envelopeJson: envelope(),
  status: "PENDING",
  attemptCount: 0,
  availableAt: "2026-09-30T00:00:00.000Z",
  createdAt: "2026-09-30T00:00:00.000Z",
});

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
  updatedAt: "2026-09-30T00:00:00.000Z",
});

const attempt = Object.freeze({
  id: ids.attempt,
  deliveryId: ids.delivery,
  attemptNo: 1,
  normalizedStatus: "RAW",
  startedAt: "2026-09-30T00:01:00.000Z",
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
  updatedAt: "2026-09-30T00:00:00.000Z",
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

function ports(overrides = {}) {
  const order = [];
  const calls = {residency: []};
  return {
    order,
    calls,
    deliveryReader: {async loadForContext(){order.push("delivery"); return Object.hasOwn(overrides,"delivery")?overrides.delivery:delivery;}},
    integrationReader: {async loadForContext(){order.push("integration"); return integration;}},
    eventReader: {async loadForContext(){order.push("event"); return event;}},
    templateReader: {async loadForContext(){order.push("template"); return template;}},
    attemptReader: {async loadForDelivery(){order.push("attempt"); return [attempt];}},
    credentialReader: {async loadForContext(){order.push("credential"); if(overrides.parentError) throw overrides.parentError; return credential;}},
    definitionReader: {async loadById(){order.push("definition"); return definition;}},
    capabilityReader: {async loadExact(){order.push("capability"); return capability;}},
    eventCatalogReader: {async loadExact(){order.push("catalog"); return catalog;}},
    residencyReader: {
      async loadCurrentForContext(input) {
        order.push("residency");
        calls.residency.push(input);
        if (overrides.residencyError) throw overrides.residencyError;
        return Object.hasOwn(overrides,"residency") ? overrides.residency : residency;
      },
    },
  };
}

async function load(p, input = Object.freeze({
  requestContext,
  notificationDeliveryId: ids.delivery,
  evaluatedAt: "2026-09-30T12:00:00.000Z",
})) {
  return loadNotificationDeliverySourceEventCurrentResidencyEvidence(
    input,
    p.deliveryReader,
    p.integrationReader,
    p.eventReader,
    p.templateReader,
    p.attemptReader,
    p.credentialReader,
    p.definitionReader,
    p.capabilityReader,
    p.eventCatalogReader,
    p.residencyReader,
  );
}

function sourceEnvelope(overrides = {}) {
  return Object.freeze({
    event: Object.freeze({...event, ...overrides.event}),
    catalog: Object.freeze({...catalog, ...overrides.catalog}),
    envelopeJson: overrides.envelopeJson ?? event.envelopeJson,
  });
}

test("NOTIF-EVTRES-FLOOR-001 exact TENANT_CORE/TENANT_INDUSTRY current Tenant residency equality passes", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventCurrentResidencyFloors(
      sourceEnvelope(),
      residency,
    ),
    true,
  );
  const coreEvent = Object.freeze({
    ...event,
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
    envelopeJson: envelope({
      scopeClass: "TENANT_CORE",
      industryContextId: undefined,
    }),
  });
  assert.equal(
    matchesNotificationDeliverySourceEventCurrentResidencyFloors(
      Object.freeze({event: coreEvent, catalog: {...catalog, scopeClass: "TENANT_CORE"}, envelopeJson: coreEvent.envelopeJson}),
      residency,
    ),
    true,
  );
});

test("NOTIF-EVTRES-FLOOR-002 wrong Tenant/region, invalid scope or invalid parent envelope evidence fails closed", () => {
  for (const [candidate, current] of [
    [sourceEnvelope(), {...residency, tenantId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd"}],
    [sourceEnvelope(), {...residency, residencyRegionCode: "EU-WEST"}],
    [sourceEnvelope(), {...residency, residencyRegionCode: ""}],
    [sourceEnvelope({event: {scopeClass: "EXPLICIT_CROSS_CONTEXT", industryContextId: undefined}}), residency],
    [sourceEnvelope({envelopeJson: envelope({residencyRegion: "EU-WEST"})}), residency],
  ]) {
    assert.equal(
      matchesNotificationDeliverySourceEventCurrentResidencyFloors(candidate, current),
      false,
    );
  }
});

test("NOTIF-EVTRES-BASE-001 DD-327 parent evidence is established before residency read", async () => {
  const p = ports();
  const result = await load(p);
  assert.ok(result);
  assert.ok(p.order.indexOf("residency") > p.order.indexOf("catalog"));
  assert.ok(p.order.indexOf("residency") > p.order.indexOf("credential"));
});

test("NOTIF-EVTRES-BASE-002 parent null/error returns null/propagates and residency is not read", async () => {
  const p1 = ports({delivery: null});
  assert.equal(await load(p1), null);
  assert.deepEqual(p1.calls.residency, []);

  const failure = new Error("parent-failed");
  const p2 = ports({parentError: failure});
  await assert.rejects(load(p2), (error) => error === failure);
  assert.deepEqual(p2.calls.residency, []);
});

test("NOTIF-EVTRES-UNBOUND-001 unbound source event succeeds without residency read/evidence", async () => {
  const p = ports({delivery: Object.freeze({...delivery, sourceEventId: undefined})});
  const result = await load(p);
  assert.ok(result);
  assert.equal(Object.hasOwn(result, "currentResidency"), false);
  assert.deepEqual(p.calls.residency, []);
  assert.equal(Object.isFrozen(result), true);
});

test("NOTIF-EVTRES-READ-001 bound source event forwards exact RequestContext + event Tenant id exactly once", async () => {
  const p = ports();
  const input = Object.freeze({requestContext, notificationDeliveryId: ids.delivery, evaluatedAt: "2026-09-30T12:00:00.000Z"});
  const result = await load(p, input);
  assert.ok(result);
  assert.deepEqual(p.calls.residency, [{requestContext, tenantId: ids.tenant}]);
});

test("NOTIF-EVTRES-READ-002 null residency returns null and reader error propagates unchanged", async () => {
  const p1 = ports({residency: null});
  assert.equal(await load(p1), null);
  assert.equal(p1.calls.residency.length, 1);

  const failure = new Error("residency-failed");
  const p2 = ports({residencyError: failure});
  await assert.rejects(load(p2), (error) => error === failure);
  assert.equal(p2.calls.residency.length, 1);
});

test("NOTIF-EVTRES-EVID-001 success preserves exact parent/residency identities, immutability and no forbidden authority", async () => {
  const input = Object.freeze({requestContext, notificationDeliveryId: ids.delivery, evaluatedAt: "2026-09-30T12:00:00.000Z"});
  const before = JSON.stringify(input);
  const p = ports();
  const result = await load(p, input);
  assert.ok(result);
  assert.equal(result.currentResidency, residency);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(JSON.stringify(input), before);
  for (const forbidden of [
    "historicalResidency",
    "payloadSchemaValid",
    "catalogActive",
    "dispatchable",
    "retryable",
    "provider",
    "rendered",
    "sendAuthorized",
    "mutation",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
