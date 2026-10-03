import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesNotificationDeliverySourceEventBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  delivery: "11111111-1111-4111-8111-111111111111",
  tenantA: "22222222-2222-4222-8222-222222222222",
  tenantB: "33333333-3333-4333-8333-333333333333",
  industryA: "44444444-4444-4444-8444-444444444444",
  industryB: "55555555-5555-4555-8555-555555555555",
  event: "66666666-6666-4666-8666-666666666666",
  otherEvent: "77777777-7777-4777-8777-777777777777",
});

const baseDelivery = Object.freeze({
  id: ids.delivery,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  scopeClass: "TENANT_INDUSTRY",
  recipientReference: "opaque-recipient",
  channel: "EMAIL",
  correlationId: "88888888-8888-4888-8888-888888888888",
  sourceEventId: ids.event,
  status: "QUEUED",
  queuedAt: "2026-09-24T06:00:00.000Z",
  rowVersion: 1,
});

const baseEvent = Object.freeze({
  id: ids.event,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  scopeClass: "TENANT_INDUSTRY",
  eventType: "notification.requested",
  eventVersion: 1,
  aggregateType: "Notification",
  aggregateId: ids.delivery,
  envelopeJson: Object.freeze({opaque: true}),
  status: "PENDING",
  attemptCount: 0,
  availableAt: "2026-09-24T06:00:00.000Z",
  createdAt: "2026-09-24T06:00:00.000Z",
});

function delivery(overrides = {}) {
  return Object.freeze({...baseDelivery, ...overrides});
}

function event(overrides = {}) {
  return Object.freeze({...baseEvent, ...overrides});
}

test("NOTIF-EVT-CUR-001 unbound delivery with no event evidence matches", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery({sourceEventId: undefined}),
      undefined,
    ),
    true,
  );
});

test("NOTIF-EVT-CUR-002 exact same-Tenant TENANT_CORE source event matches", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery({
        scopeClass: "TENANT_CORE",
        industryContextId: undefined,
      }),
      event({
        scopeClass: "TENANT_CORE",
        industryContextId: undefined,
      }),
    ),
    true,
  );
});

test("NOTIF-EVT-CUR-003 exact Tenant-Industry event matches and sibling Industry fails", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(delivery(), event()),
    true,
  );
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery(),
      event({industryContextId: ids.industryB}),
    ),
    false,
  );
});

test("NOTIF-EVT-CUR-004 wrong event id, foreign Tenant or scope mismatch fails closed", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery(),
      event({id: ids.otherEvent}),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery(),
      event({tenantId: ids.tenantB}),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery(),
      event({scopeClass: "TENANT_CORE", industryContextId: undefined}),
    ),
    false,
  );
});

test("NOTIF-EVT-CUR-005 PLATFORM_GLOBAL and EXPLICIT_CROSS_CONTEXT events cannot satisfy delivery binding", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery(),
      event({
        tenantId: undefined,
        industryContextId: undefined,
        scopeClass: "PLATFORM_GLOBAL",
      }),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery(),
      event({scopeClass: "EXPLICIT_CROSS_CONTEXT"}),
    ),
    false,
  );
});

test("NOTIF-EVT-CUR-006 malformed ownership or unexpected event evidence fails closed", () => {
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery({id: "not-a-uuid"}),
      event(),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery({scopeClass: "TENANT_CORE"}),
      event({scopeClass: "TENANT_CORE", industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery({scopeClass: "TENANT_INDUSTRY", industryContextId: undefined}),
      event(),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      delivery({sourceEventId: undefined}),
      event(),
    ),
    false,
  );
});

test("NOTIF-EVT-CUR-007 event dispatcher/payload and delivery semantics remain uninterpreted without mutation", () => {
  const candidateDelivery = delivery({
    channel: "WHATSAPP",
    status: "FAILED",
    templateVersion: 99,
    lastErrorCode: "UNINTERPRETED",
    sentAt: "not-interpreted",
    deliveredAt: "also-not-interpreted",
  });
  const candidateEvent = event({
    eventType: "",
    eventVersion: -99,
    aggregateType: "",
    aggregateId: "",
    envelopeJson: Object.freeze({anything: Object.freeze({goes: true})}),
    status: "DEAD",
    attemptCount: 999,
    availableAt: "not-interpreted",
    lockedAt: "not-interpreted",
    lockedBy: "",
    dispatchedAt: "not-interpreted",
    lastErrorCode: "UNINTERPRETED",
    createdAt: "not-interpreted",
  });

  const beforeDelivery = JSON.stringify(candidateDelivery);
  const beforeEvent = JSON.stringify(candidateEvent);

  assert.equal(
    matchesNotificationDeliverySourceEventBindingFloors(
      candidateDelivery,
      candidateEvent,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateDelivery), beforeDelivery);
  assert.equal(JSON.stringify(candidateEvent), beforeEvent);
});
