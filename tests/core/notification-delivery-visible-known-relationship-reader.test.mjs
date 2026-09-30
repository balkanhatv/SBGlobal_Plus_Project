import test from "node:test";
import assert from "node:assert/strict";

import {
  loadVisibleNotificationDeliveryKnownRelationshipEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  delivery: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  integration: "44444444-4444-4444-8444-444444444444",
  event: "55555555-5555-4555-8555-555555555555",
  template: "66666666-6666-4666-8666-666666666666",
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
  recipientPrincipalId: "principal-2",
  channel: "EMAIL",
  tenantIntegrationId: ids.integration,
  correlationId: "notification-correlation-1",
  sourceEventId: ids.event,
  status: "QUEUED",
  queuedAt: "2026-09-30T00:00:00.000Z",
  rowVersion: 1,
});

const integration = Object.freeze({
  id: ids.integration,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  integrationDefinitionId: "77777777-7777-4777-8777-777777777777",
  scopeClass: "TENANT_INDUSTRY",
  displayName: "Email Provider",
  status: "ACTIVE",
  credentialReferenceId: "88888888-8888-4888-8888-888888888888",
  config: Object.freeze({}),
  enabledCapabilities: Object.freeze(["NOTIFY.EMAIL"]),
  healthState: "HEALTHY",
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
  code: "ORDER_READY",
  channel: "EMAIL",
  localeCode: "en-IN",
  version: 3,
  status: "ACTIVE",
  subjectTemplate: "Ready",
  bodyTemplate: "Your order is ready.",
  variableSchema: Object.freeze({}),
  createdBy: "principal-admin",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-30T00:00:00.000Z",
});

function ports(overrides = {}) {
  const calls = {delivery: [], integration: [], event: [], template: []};
  return {
    calls,
    deliveryReader: {
      async loadForContext(input) {
        calls.delivery.push(input);
        if (overrides.deliveryError) throw overrides.deliveryError;
        return Object.hasOwn(overrides, "delivery") ? overrides.delivery : delivery;
      },
    },
    integrationReader: {
      async loadForContext(input) {
        calls.integration.push(input);
        if (overrides.integrationError) throw overrides.integrationError;
        return Object.hasOwn(overrides, "integration") ? overrides.integration : integration;
      },
    },
    eventReader: {
      async loadForContext(input) {
        calls.event.push(input);
        if (overrides.eventError) throw overrides.eventError;
        return Object.hasOwn(overrides, "event") ? overrides.event : event;
      },
    },
    templateReader: {
      async loadForContext(input) {
        calls.template.push(input);
        if (overrides.templateError) throw overrides.templateError;
        return Object.hasOwn(overrides, "template") ? overrides.template : template;
      },
    },
  };
}

test("NOTIF-VRELREAD-PARENT-001 exact RequestContext/id reach the Delivery reader first", async () => {
  const p = ports();
  const result = await loadVisibleNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, notificationDeliveryId: ids.delivery},
    p.deliveryReader,
    p.integrationReader,
    p.eventReader,
    p.templateReader,
  );
  assert.ok(result);
  assert.equal(p.calls.delivery.length, 1);
  assert.equal(p.calls.delivery[0].requestContext, requestContext);
  assert.equal(p.calls.delivery[0].notificationDeliveryId, ids.delivery);
  assert.equal(p.calls.integration.length > 0, true);
});

test("NOTIF-VRELREAD-PARENT-002 hidden/absent Delivery returns null and no relationship reader is called", async () => {
  const p = ports({delivery: null});
  const result = await loadVisibleNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, notificationDeliveryId: ids.delivery},
    p.deliveryReader,
    p.integrationReader,
    p.eventReader,
    p.templateReader,
  );
  assert.equal(result, null);
  assert.deepEqual(p.calls.integration, []);
  assert.deepEqual(p.calls.event, []);
  assert.deepEqual(p.calls.template, []);
});

test("NOTIF-VRELREAD-PARENT-003 Delivery-reader dependency error propagates unchanged and no relationship reader is called", async () => {
  const failure = new Error("delivery-read-failed");
  const p = ports({deliveryError: failure});
  await assert.rejects(
    loadVisibleNotificationDeliveryKnownRelationshipEvidence(
      {requestContext, notificationDeliveryId: ids.delivery},
      p.deliveryReader,
      p.integrationReader,
      p.eventReader,
      p.templateReader,
    ),
    (error) => error === failure,
  );
  assert.deepEqual(p.calls.integration, []);
  assert.deepEqual(p.calls.event, []);
  assert.deepEqual(p.calls.template, []);
});

test("NOTIF-VRELREAD-DELEG-001 visible parent delegates exact RequestContext and exact returned Delivery reference into DD-302", async () => {
  const p = ports();
  const result = await loadVisibleNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, notificationDeliveryId: ids.delivery},
    p.deliveryReader,
    p.integrationReader,
    p.eventReader,
    p.templateReader,
  );
  assert.ok(result);
  assert.equal(result.delivery, delivery);
  assert.equal(p.calls.integration[0].requestContext, requestContext);
  assert.equal(p.calls.event[0].requestContext, requestContext);
  assert.equal(p.calls.template[0].requestContext, requestContext);
});

test("NOTIF-VRELREAD-DELEG-002 parent is read once and unbound relationships remain skipped through DD-302", async () => {
  const unbound = Object.freeze({
    ...delivery,
    tenantIntegrationId: undefined,
    sourceEventId: undefined,
    templateId: undefined,
    templateVersion: undefined,
  });
  const p = ports({delivery: unbound});
  const result = await loadVisibleNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, notificationDeliveryId: ids.delivery},
    p.deliveryReader,
    p.integrationReader,
    p.eventReader,
    p.templateReader,
  );
  assert.ok(result);
  assert.equal(p.calls.delivery.length, 1);
  assert.deepEqual(p.calls.integration, []);
  assert.deepEqual(p.calls.event, []);
  assert.deepEqual(p.calls.template, []);
  assert.equal(result.delivery, unbound);
});

test("NOTIF-VRELREAD-EVID-001 valid known relationships return immutable exact-reference evidence", async () => {
  const p = ports();
  const result = await loadVisibleNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, notificationDeliveryId: ids.delivery},
    p.deliveryReader,
    p.integrationReader,
    p.eventReader,
    p.templateReader,
  );
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.delivery, delivery);
  assert.equal(result.integration, integration);
  assert.equal(result.event, event);
  assert.equal(result.template, template);
});

test("NOTIF-VRELREAD-EVID-002 DD-302 relationship mismatch or missing bound evidence remains null", async () => {
  for (const override of [
    {integration: null},
    {event: null},
    {template: null},
    {template: Object.freeze({...template, version: 4})},
  ]) {
    const p = ports(override);
    const result = await loadVisibleNotificationDeliveryKnownRelationshipEvidence(
      {requestContext, notificationDeliveryId: ids.delivery},
      p.deliveryReader,
      p.integrationReader,
      p.eventReader,
      p.templateReader,
    );
    assert.equal(result, null);
  }
});

test("NOTIF-VRELREAD-ERR-001 invoked DD-302 relationship-reader dependency error propagates unchanged", async () => {
  const failure = new Error("relationship-read-failed");
  const p = ports({eventError: failure});
  await assert.rejects(
    loadVisibleNotificationDeliveryKnownRelationshipEvidence(
      {requestContext, notificationDeliveryId: ids.delivery},
      p.deliveryReader,
      p.integrationReader,
      p.eventReader,
      p.templateReader,
    ),
    (error) => error === failure,
  );
});

test("NOTIF-VRELREAD-BOUND-001 inputs remain unchanged and output exposes no recipient-currentness/send/runtime/mutation authority", async () => {
  const input = Object.freeze({
    requestContext,
    notificationDeliveryId: ids.delivery,
  });
  const before = JSON.stringify(input);
  const p = ports();
  const result = await loadVisibleNotificationDeliveryKnownRelationshipEvidence(
    input,
    p.deliveryReader,
    p.integrationReader,
    p.eventReader,
    p.templateReader,
  );
  assert.ok(result);
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(Object.keys(result).sort(), [
    "delivery",
    "event",
    "integration",
    "template",
  ]);
  for (const forbidden of [
    "recipientValid",
    "completeDeliveryValid",
    "lifecycleDecision",
    "renderedContent",
    "providerSelection",
    "credential",
    "retryDecision",
    "dispatchDecision",
    "scheduledAt",
    "sendAuthorized",
    "mutation",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
