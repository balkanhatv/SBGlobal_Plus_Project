import test from "node:test";
import assert from "node:assert/strict";

import {
  loadNotificationDeliveryIntegrationCurrentIntegrityEvidence,
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
  };
}

async function load(p, input = Object.freeze({
  requestContext,
  notificationDeliveryId: ids.delivery,
  evaluatedAt,
})) {
  return loadNotificationDeliveryIntegrationCurrentIntegrityEvidence(
    input,
    p.deliveryReader,
    p.integrationReader,
    p.eventReader,
    p.templateReader,
    p.attemptReader,
    p.credentialReader,
    p.definitionReader,
    p.capabilityReader,
  );
}

test("NOTIF-INTCUR-BASE-001 DD-312 executes first with exact RequestContext/id before current-integrity reads", async () => {
  const p = ports();
  const result = await load(p);
  assert.ok(result);
  assert.equal(p.calls.delivery[0].requestContext, requestContext);
  assert.equal(p.calls.delivery[0].notificationDeliveryId, ids.delivery);
  assert.ok(p.order.indexOf("credential") > p.order.indexOf("attempt"));
  assert.ok(p.order.indexOf("definition") > p.order.indexOf("attempt"));
  assert.ok(p.order.indexOf("capability") > p.order.indexOf("attempt"));
});

test("NOTIF-INTCUR-BASE-002 DD-312 null returns null and no current-integrity reader is called", async () => {
  const p = ports({delivery: null});
  assert.equal(await load(p), null);
  assert.deepEqual(p.calls.credential, []);
  assert.deepEqual(p.calls.definition, []);
  assert.deepEqual(p.calls.capability, []);
});

test("NOTIF-INTCUR-BASE-003 DD-312 error propagates unchanged and no current-integrity reader is called", async () => {
  const failure = new Error("attempt-reader-failed");
  const p = ports({attemptError: failure});
  await assert.rejects(load(p), (error) => error === failure);
  assert.deepEqual(p.calls.credential, []);
  assert.deepEqual(p.calls.definition, []);
  assert.deepEqual(p.calls.capability, []);
});

test("NOTIF-INTCUR-UNBOUND-001 unbound Delivery succeeds without Integration-currentness reads/evidence", async () => {
  const unboundDelivery = Object.freeze({...delivery, tenantIntegrationId: undefined});
  const p = ports({delivery: unboundDelivery});
  const result = await load(p);
  assert.ok(result);
  assert.equal(result.composed.relationships.delivery, unboundDelivery);
  assert.equal(Object.hasOwn(result, "integrationCurrentIntegrity"), false);
  assert.deepEqual(p.calls.integration, []);
  assert.deepEqual(p.calls.credential, []);
  assert.deepEqual(p.calls.definition, []);
  assert.deepEqual(p.calls.capability, []);
});

test("NOTIF-INTCUR-CRED-001 forwards exact RequestContext and credentialReferenceId", async () => {
  const p = ports();
  assert.ok(await load(p));
  assert.equal(p.calls.credential.length, 1);
  assert.equal(p.calls.credential[0].requestContext, requestContext);
  assert.equal(p.calls.credential[0].credentialReferenceId, ids.credential);
});

test("NOTIF-INTCUR-DEF-001 forwards exact integrationDefinitionId", async () => {
  const p = ports();
  assert.ok(await load(p));
  assert.deepEqual(p.calls.definition, [ids.definition]);
});

test("NOTIF-INTCUR-CAP-001 reads each persisted enabled capability in persisted order and none for empty set", async () => {
  const p = ports();
  assert.ok(await load(p));
  assert.deepEqual(p.calls.capability, [
    {integrationDefinitionId: ids.definition, capabilityCode: "notify.email"},
    {integrationDefinitionId: ids.definition, capabilityCode: "notify.track"},
  ]);

  const emptyIntegration = Object.freeze({...integration, enabledCapabilities: Object.freeze([])});
  const p2 = ports({integration: emptyIntegration});
  const result2 = await load(p2);
  assert.ok(result2);
  assert.deepEqual(p2.calls.capability, []);
  assert.deepEqual(result2.integrationCurrentIntegrity.capabilities, []);
});

test("NOTIF-INTCUR-DEP-001 required null Credential/Definition/Capability evidence fails closed", async () => {
  for (const override of [
    {credential: null},
    {definition: null},
    {capabilityNullCode: "notify.track"},
  ]) {
    const p = ports(override);
    assert.equal(await load(p), null);
  }
});

test("NOTIF-INTCUR-DEP-002 current-integrity reader errors propagate unchanged", async () => {
  for (const key of ["credentialError", "definitionError", "capabilityError"]) {
    const failure = new Error(key);
    const p = ports({[key]: failure});
    await assert.rejects(load(p), (error) => error === failure);
  }
});

test("NOTIF-INTCUR-FLOOR-001 DD-167 true returns immutable evidence preserving exact child refs and evaluatedAt", async () => {
  const p = ports();
  const result = await load(p);
  assert.ok(result);
  const current = result.integrationCurrentIntegrity;
  assert.ok(current);
  assert.equal(current.integration, integration);
  assert.equal(current.credential, credential);
  assert.equal(current.definition, definition);
  assert.equal(current.capabilities[0], capEmail);
  assert.equal(current.capabilities[1], capTrack);
  assert.equal(current.evaluatedAt, evaluatedAt);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(current), true);
  assert.equal(Object.isFrozen(current.capabilities), true);
});

test("NOTIF-INTCUR-FLOOR-002 DD-167 false returns null without fallback", async () => {
  const p = ports({credential: Object.freeze({...credential, status: "REVOKED"})});
  assert.equal(await load(p), null);
  assert.equal(p.calls.credential.length, 1);
  assert.equal(p.calls.definition.length, 1);
  assert.equal(p.calls.capability.length, 2);
});

test("NOTIF-INTCUR-BOUND-001 inputs remain unchanged and output adds no send/provider/secret/retry authority", async () => {
  const input = Object.freeze({requestContext, notificationDeliveryId: ids.delivery, evaluatedAt});
  const before = JSON.stringify(input);
  const p = ports();
  const result = await load(p, input);
  assert.ok(result);
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(Object.keys(result).sort(), ["composed", "integrationCurrentIntegrity"]);
  assert.deepEqual(
    Object.keys(result.integrationCurrentIntegrity).sort(),
    ["capabilities", "credential", "definition", "evaluatedAt", "integration"],
  );
  for (const forbidden of [
    "sendable",
    "executable",
    "healthApproved",
    "fallback",
    "provider",
    "providerAdapter",
    "secretReference",
    "secretMaterial",
    "retryable",
    "dispatchDecision",
    "scheduledAt",
    "sendAuthorized",
    "mutation",
  ]) {
    assert.equal(forbidden in result, false);
    assert.equal(forbidden in result.integrationCurrentIntegrity, false);
  }
});
