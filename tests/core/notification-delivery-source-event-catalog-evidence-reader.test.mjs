import test from "node:test";
import assert from "node:assert/strict";

import {
  loadNotificationDeliverySourceEventCatalogEvidence,
  matchesOutboxEventCatalogTupleFloors,
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
  cap1: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  cap2: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
});

const requestContext = Object.freeze({
  requestId: "request-1",
  correlationId: "correlation-1",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  principalId: "principal-1",
  principalType: "HUMAN",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  permissionVersion: 1,
  entitlementSnapshotId: "entitlement-1",
  entitlementSnapshotVersion: 1,
  scopeClass: "TENANT_INDUSTRY",
});

const delivery = Object.freeze({
  id: ids.delivery,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  scopeClass: "TENANT_INDUSTRY",
  templateId: ids.template,
  templateVersion: 3,
  recipientReference: "recipient@example.test",
  channel: "EMAIL",
  tenantIntegrationId: ids.integration,
  correlationId: "12121212-1212-4212-8212-121212121212",
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
  displayName: "Notification provider",
  status: "ACTIVE",
  credentialReferenceId: ids.credential,
  config: Object.freeze({mode: "safe"}),
  enabledCapabilities: Object.freeze(["notify.email", "notify.track"]),
  healthState: "UNAVAILABLE",
  version: 2,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-30T00:00:00.000Z",
});

const event = Object.freeze({
  id: ids.event,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  scopeClass: "TENANT_INDUSTRY",
  eventType: "NOTIFICATION.REQUESTED",
  eventVersion: 1,
  aggregateType: "Notification",
  aggregateId: ids.delivery,
  envelopeJson: Object.freeze({}),
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
  version: 3,
  status: "ACTIVE",
  bodyTemplate: "Body",
  variableSchema: Object.freeze({}),
  createdBy: "principal-admin",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-30T00:00:00.000Z",
});

const attempt = Object.freeze({
  id: ids.attempt,
  deliveryId: ids.delivery,
  attemptNo: 1,
  normalizedStatus: "RAW_ACCEPTED",
  startedAt: "2026-09-30T00:01:00.000Z",
});

const credential = Object.freeze({
  id: ids.credential,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  secretStoreProvider: "vault",
  credentialType: "API_KEY",
  keyVersion: 5,
  status: "ACTIVE",
  expiresAt: "2026-10-02T00:00:00.000Z",
  createdAt: "2026-09-20T00:00:00.000Z",
});

const definition = Object.freeze({
  id: ids.definition,
  code: "notification-provider",
  name: "Notification Provider",
  providerFamily: "example",
  capabilityCodes: Object.freeze(["notify.email", "notify.track"]),
  adapterContractVersion: "v1",
  ownerScope: "PLATFORM",
  status: "ACTIVE",
  dataTransferClass: "INTERNAL",
  residencyMetadata: Object.freeze({}),
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-30T00:00:00.000Z",
});

const capEmail = Object.freeze({
  id: ids.cap1,
  integrationDefinitionId: ids.definition,
  capabilityCode: "notify.email",
  direction: "OUTBOUND",
  eventTypes: Object.freeze([]),
  dataClass: "INTERNAL",
  idempotencyClass: "STANDARD",
  rateClass: "AUTH_STANDARD",
  status: "ACTIVE",
});

const capTrack = Object.freeze({
  id: ids.cap2,
  integrationDefinitionId: ids.definition,
  capabilityCode: "notify.track",
  direction: "INBOUND",
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

const evaluatedAt = "2026-09-30T12:00:00.000Z";

function ports(overrides = {}) {
  const order = [];
  const calls = {
    delivery: [],
    integration: [],
    event: [],
    template: [],
    attempt: [],
    credential: [],
    definition: [],
    capability: [],
    catalog: [],
  };
  const capabilities = overrides.capabilities ?? {
    "notify.email": capEmail,
    "notify.track": capTrack,
  };

  return {
    order,
    calls,
    deliveryReader: {
      async loadForContext(input) {
        order.push("delivery");
        calls.delivery.push(input);
        if (overrides.deliveryError) throw overrides.deliveryError;
        return Object.hasOwn(overrides, "delivery") ? overrides.delivery : delivery;
      },
    },
    integrationReader: {
      async loadForContext(input) {
        order.push("integration");
        calls.integration.push(input);
        if (overrides.integrationError) throw overrides.integrationError;
        return Object.hasOwn(overrides, "integration") ? overrides.integration : integration;
      },
    },
    eventReader: {
      async loadForContext(input) {
        order.push("event");
        calls.event.push(input);
        if (overrides.eventError) throw overrides.eventError;
        return Object.hasOwn(overrides, "event") ? overrides.event : event;
      },
    },
    templateReader: {
      async loadForContext(input) {
        order.push("template");
        calls.template.push(input);
        if (overrides.templateError) throw overrides.templateError;
        return Object.hasOwn(overrides, "template") ? overrides.template : template;
      },
    },
    attemptReader: {
      async loadForDelivery(input) {
        order.push("attempt");
        calls.attempt.push(input);
        if (overrides.attemptError) throw overrides.attemptError;
        return Object.hasOwn(overrides, "attempts") ? overrides.attempts : [attempt];
      },
    },
    credentialReader: {
      async loadForContext(input) {
        order.push("credential");
        calls.credential.push(input);
        if (overrides.credentialError) throw overrides.credentialError;
        return Object.hasOwn(overrides, "credential") ? overrides.credential : credential;
      },
    },
    definitionReader: {
      async loadById(id) {
        order.push("definition");
        calls.definition.push(id);
        if (overrides.definitionError) throw overrides.definitionError;
        return Object.hasOwn(overrides, "definition") ? overrides.definition : definition;
      },
    },
    capabilityReader: {
      async loadExact(input) {
        order.push("capability");
        calls.capability.push(input);
        if (overrides.capabilityError) throw overrides.capabilityError;
        if (overrides.capabilityNullCode === input.capabilityCode) return null;
        return capabilities[input.capabilityCode] ?? null;
      },
    },
    eventCatalogReader: {
      async loadExact(input) {
        order.push("catalog");
        calls.catalog.push(input);
        if (overrides.catalogError) throw overrides.catalogError;
        return Object.hasOwn(overrides, "catalog") ? overrides.catalog : catalog;
      },
    },
  };
}

async function load(p, input = Object.freeze({
  requestContext,
  notificationDeliveryId: ids.delivery,
  evaluatedAt,
})) {
  return loadNotificationDeliverySourceEventCatalogEvidence(
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
  );
}

test("NOTIF-EVTCAT-BASE-001 DD-317 executes first with exact supplied parent inputs before EventCatalog access", async () => {
  const p = ports();
  const input = Object.freeze({requestContext, notificationDeliveryId: ids.delivery, evaluatedAt});
  const result = await load(p, input);
  assert.ok(result);
  assert.equal(p.calls.delivery[0].requestContext, requestContext);
  assert.equal(p.calls.delivery[0].notificationDeliveryId, ids.delivery);
  assert.ok(p.order.indexOf("catalog") > p.order.indexOf("credential"));
  assert.ok(p.order.indexOf("catalog") > p.order.indexOf("capability"));
});

test("NOTIF-EVTCAT-BASE-002 DD-317 null returns null and EventCatalog is not read", async () => {
  const p = ports({delivery: null});
  assert.equal(await load(p), null);
  assert.deepEqual(p.calls.catalog, []);
});

test("NOTIF-EVTCAT-BASE-003 DD-317 error propagates unchanged and EventCatalog is not read", async () => {
  const failure = new Error("dd317-failed");
  const p = ports({credentialError: failure});
  await assert.rejects(load(p), (error) => error === failure);
  assert.deepEqual(p.calls.catalog, []);
});

test("NOTIF-EVTCAT-UNBOUND-001 no source event succeeds with exact DD-317 evidence and no catalog read/evidence", async () => {
  const unboundDelivery = Object.freeze({...delivery, sourceEventId: undefined});
  const p = ports({delivery: unboundDelivery});
  const result = await load(p);
  assert.ok(result);
  assert.equal(Object.hasOwn(result, "sourceEventCatalog"), false);
  assert.equal(result.integrationEvidence.composed.relationships.delivery, unboundDelivery);
  assert.deepEqual(p.calls.event, []);
  assert.deepEqual(p.calls.catalog, []);
});

test("NOTIF-EVTCAT-READ-001 bound source event forwards exact type/version/scope tuple exactly once", async () => {
  const p = ports();
  const result = await load(p);
  assert.ok(result);
  assert.deepEqual(p.calls.catalog, [{
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    scopeClass: event.scopeClass,
  }]);
});

test("NOTIF-EVTCAT-READ-002 null catalog returns null and reader error propagates unchanged", async () => {
  const p1 = ports({catalog: null});
  assert.equal(await load(p1), null);
  assert.equal(p1.calls.catalog.length, 1);

  const failure = new Error("catalog-failed");
  const p2 = ports({catalogError: failure});
  await assert.rejects(load(p2), (error) => error === failure);
  assert.equal(p2.calls.catalog.length, 1);
});

test("NOTIF-EVTCAT-TUPLE-001 exact tuple match passes regardless of ACTIVE or RETIRED catalog status", () => {
  assert.equal(matchesOutboxEventCatalogTupleFloors(event, catalog), true);
  assert.equal(matchesOutboxEventCatalogTupleFloors(
    event,
    {...catalog, status: "ACTIVE"},
  ), true);
});

test("NOTIF-EVTCAT-TUPLE-002 type/version/scope mismatch or malformed event tuple fails closed", () => {
  for (const [candidateEvent, candidateCatalog] of [
    [event, {...catalog, eventType: "OTHER"}],
    [event, {...catalog, eventVersion: 2}],
    [event, {...catalog, scopeClass: "TENANT_CORE"}],
    [{...event, eventType: ""}, catalog],
    [{...event, eventVersion: 0}, catalog],
    [{...event, eventVersion: Number.MAX_SAFE_INTEGER + 1}, catalog],
    [{...event, scopeClass: "INVALID"}, catalog],
  ]) {
    assert.equal(matchesOutboxEventCatalogTupleFloors(candidateEvent, candidateCatalog), false);
  }
});

test("NOTIF-EVTCAT-EVID-001 success preserves exact DD-317/Event/Catalog identities in immutable evidence", async () => {
  const p = ports();
  const result = await load(p);
  assert.ok(result);
  assert.equal(result.sourceEventCatalog.event, event);
  assert.equal(result.sourceEventCatalog.catalog, catalog);
  assert.equal(
    result.integrationEvidence.composed.relationships.event,
    result.sourceEventCatalog.event,
  );
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.sourceEventCatalog), true);
});

test("NOTIF-EVTCAT-BOUND-001 inputs remain unchanged and output exposes no catalog lifecycle/readiness/dispatch/send authority", async () => {
  const input = Object.freeze({requestContext, notificationDeliveryId: ids.delivery, evaluatedAt});
  const before = JSON.stringify(input);
  const p = ports();
  const result = await load(p, input);
  assert.ok(result);
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(Object.keys(result).sort(), ["integrationEvidence", "sourceEventCatalog"]);
  assert.deepEqual(Object.keys(result.sourceEventCatalog).sort(), ["catalog", "event"]);
  for (const forbidden of [
    "catalogActive",
    "dispatchable",
    "ready",
    "payloadValid",
    "webhookEligible",
    "consumerSelected",
    "retryable",
    "provider",
    "secretMaterial",
    "sendAuthorized",
    "mutation",
  ]) {
    assert.equal(forbidden in result, false);
    assert.equal(forbidden in result.sourceEventCatalog, false);
  }
});

test("NOTIF-EVTCAT-BOUND-002 no fallback/alternate catalog lookup occurs after null or tuple mismatch", async () => {
  const p1 = ports({catalog: null});
  assert.equal(await load(p1), null);
  assert.equal(p1.calls.catalog.length, 1);

  const p2 = ports({catalog: {...catalog, eventVersion: 2}});
  assert.equal(await load(p2), null);
  assert.equal(p2.calls.catalog.length, 1);
});
