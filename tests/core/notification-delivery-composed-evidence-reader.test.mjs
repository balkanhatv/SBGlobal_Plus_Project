import test from "node:test";
import assert from "node:assert/strict";

import {
  loadNotificationDeliveryComposedEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  delivery: "11111111-1111-4111-8111-111111111111",
  otherDelivery: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  integration: "55555555-5555-4555-8555-555555555555",
  event: "66666666-6666-4666-8666-666666666666",
  template: "77777777-7777-4777-8777-777777777777",
  attempt1: "88888888-8888-4888-8888-888888888888",
  attempt2: "99999999-9999-4999-8999-999999999999",
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
  integrationDefinitionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  scopeClass: "TENANT_INDUSTRY",
  displayName: "Email Provider",
  status: "ACTIVE",
  credentialReferenceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
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

const attempt1 = Object.freeze({
  id: ids.attempt1,
  deliveryId: ids.delivery,
  attemptNo: 1,
  providerMessageRef: "provider-ref-1",
  normalizedStatus: "RAW_ACCEPTED",
  normalizedErrorCode: "RAW_NONE",
  startedAt: "2026-09-30T00:01:00.000Z",
  completedAt: "2026-09-30T00:01:01.000Z",
});

const attempt2 = Object.freeze({
  id: ids.attempt2,
  deliveryId: ids.delivery,
  attemptNo: 2,
  providerMessageRef: "provider-ref-2",
  normalizedStatus: "RAW_DELIVERED",
  startedAt: "2026-09-30T00:02:00.000Z",
  completedAt: "2026-09-30T00:02:01.000Z",
});

function ports(overrides = {}) {
  const order = [];
  const calls = {
    delivery: [],
    integration: [],
    event: [],
    template: [],
    attempt: [],
  };

  return {
    order,
    calls,
    deliveryReader: {
      async loadForContext(input) {
        order.push("delivery");
        calls.delivery.push(input);
        if (overrides.deliveryError) throw overrides.deliveryError;
        return Object.hasOwn(overrides, "delivery")
          ? overrides.delivery
          : delivery;
      },
    },
    integrationReader: {
      async loadForContext(input) {
        order.push("integration");
        calls.integration.push(input);
        if (overrides.integrationError) throw overrides.integrationError;
        return Object.hasOwn(overrides, "integration")
          ? overrides.integration
          : integration;
      },
    },
    eventReader: {
      async loadForContext(input) {
        order.push("event");
        calls.event.push(input);
        if (overrides.eventError) throw overrides.eventError;
        return Object.hasOwn(overrides, "event")
          ? overrides.event
          : event;
      },
    },
    templateReader: {
      async loadForContext(input) {
        order.push("template");
        calls.template.push(input);
        if (overrides.templateError) throw overrides.templateError;
        return Object.hasOwn(overrides, "template")
          ? overrides.template
          : template;
      },
    },
    attemptReader: {
      async loadForDelivery(input) {
        order.push("attempt");
        calls.attempt.push(input);
        if (overrides.attemptError) throw overrides.attemptError;
        return Object.hasOwn(overrides, "attempts")
          ? overrides.attempts
          : [attempt2, attempt1];
      },
    },
  };
}

async function load(p, input = {requestContext, notificationDeliveryId: ids.delivery}) {
  return loadNotificationDeliveryComposedEvidence(
    input,
    p.deliveryReader,
    p.integrationReader,
    p.eventReader,
    p.templateReader,
    p.attemptReader,
  );
}

test("NOTIF-COMPEVID-REL-001 DD-307 path executes before attempt access and receives exact RequestContext/id", async () => {
  const p = ports();
  const result = await load(p);
  assert.ok(result);
  assert.equal(p.calls.delivery[0].requestContext, requestContext);
  assert.equal(p.calls.delivery[0].notificationDeliveryId, ids.delivery);
  assert.equal(p.order.at(-1), "attempt");
  assert.ok(p.order.indexOf("attempt") > p.order.indexOf("template"));
});

test("NOTIF-COMPEVID-REL-002 hidden/absent or mismatched relationship evidence returns null and attempt reader is not called", async () => {
  for (const override of [
    {delivery: null},
    {integration: null},
    {template: Object.freeze({...template, version: 4})},
  ]) {
    const p = ports(override);
    assert.equal(await load(p), null);
    assert.deepEqual(p.calls.attempt, []);
  }
});

test("NOTIF-COMPEVID-REL-003 DD-307 dependency error propagates unchanged and attempt reader is not called", async () => {
  const failure = new Error("relationship-read-failed");
  const p = ports({eventError: failure});
  await assert.rejects(load(p), (error) => error === failure);
  assert.deepEqual(p.calls.attempt, []);
});

test("NOTIF-COMPEVID-ATT-001 after DD-307 success attempt reader receives exact same RequestContext/id", async () => {
  const p = ports();
  const result = await load(p);
  assert.ok(result);
  assert.equal(p.calls.attempt.length, 1);
  assert.equal(p.calls.attempt[0].requestContext, requestContext);
  assert.equal(p.calls.attempt[0].notificationDeliveryId, ids.delivery);
});

test("NOTIF-COMPEVID-ATT-002 attempt-reader dependency error propagates unchanged", async () => {
  const failure = new Error("attempt-read-failed");
  const p = ports({attemptError: failure});
  await assert.rejects(load(p), (error) => error === failure);
  assert.equal(p.calls.attempt.length, 1);
});

test("NOTIF-COMPEVID-HIST-001 valid attempt evidence composes canonical DD-292 history/latest under exact DD-307 Delivery", async () => {
  const p = ports({attempts: [attempt2, attempt1]});
  const result = await load(p);
  assert.ok(result);
  assert.equal(result.relationships.delivery, delivery);
  assert.equal(result.attemptHistory.delivery, delivery);
  assert.deepEqual(result.attemptHistory.history.map((entry) => entry.attemptNo), [1, 2]);
  assert.equal(result.attemptHistory.latest, result.attemptHistory.history[1]);
  assert.equal(result.attemptHistory.latest.attemptNo, 2);
});

test("NOTIF-COMPEVID-HIST-002 valid empty attempts produce immutable empty attempt-history success", async () => {
  const p = ports({attempts: []});
  const result = await load(p);
  assert.ok(result);
  assert.deepEqual(result.attemptHistory.history, []);
  assert.equal(Object.isFrozen(result.attemptHistory), true);
  assert.equal(Object.isFrozen(result.attemptHistory.history), true);
  assert.equal(Object.hasOwn(result.attemptHistory, "latest"), false);
});

test("NOTIF-COMPEVID-HIST-003 malformed cross-parent or duplicate attempt evidence remains null", async () => {
  for (const attempts of [
    [{...attempt1, deliveryId: ids.otherDelivery}],
    [attempt1, {...attempt1, attemptNo: 2}],
    [attempt1, {...attempt2, attemptNo: 1}],
  ]) {
    const p = ports({attempts});
    assert.equal(await load(p), null);
    assert.equal(p.calls.attempt.length, 1);
  }
});

test("NOTIF-COMPEVID-BOUND-001 combined envelope is immutable, preserves child evidence refs and exposes no runtime/send/mutation authority", async () => {
  const input = Object.freeze({
    requestContext,
    notificationDeliveryId: ids.delivery,
  });
  const before = JSON.stringify(input);
  const p = ports();
  const result = await load(p, input);
  assert.ok(result);
  assert.equal(JSON.stringify(input), before);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.relationships), true);
  assert.equal(Object.isFrozen(result.attemptHistory), true);
  assert.equal(result.relationships.delivery, delivery);
  assert.equal(result.relationships.integration, integration);
  assert.equal(result.relationships.event, event);
  assert.equal(result.relationships.template, template);
  assert.equal(result.attemptHistory.delivery, delivery);
  assert.deepEqual(Object.keys(result).sort(), ["attemptHistory", "relationships"]);
  for (const forbidden of [
    "recipientValid",
    "completeDeliveryValid",
    "lifecycleDecision",
    "retryable",
    "terminal",
    "nextAttemptNo",
    "renderedContent",
    "providerSelection",
    "credential",
    "dispatchDecision",
    "scheduledAt",
    "sendAuthorized",
    "mutation",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
