import test from "node:test";
import assert from "node:assert/strict";

import {
  loadNotificationDeliveryAttemptHistoryEvidence,
} from "../../dist/core/index.js";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const otherDeliveryId = "22222222-2222-4222-8222-222222222222";

const requestContext = Object.freeze({
  requestId: "request-1",
  correlationId: "correlation-1",
  tenantId: "33333333-3333-4333-8333-333333333333",
  principalId: "44444444-4444-4444-8444-444444444444",
  principalType: "HUMAN",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  scopeClass: "TENANT_CORE",
});

const delivery = Object.freeze({
  id: deliveryId,
  tenantId: requestContext.tenantId,
  scopeClass: "TENANT_CORE",
  recipientReference: "recipient-safe-ref",
  channel: "EMAIL",
  correlationId: "55555555-5555-4555-8555-555555555555",
  status: "QUEUED",
  queuedAt: "2026-09-30T00:00:00.000Z",
  rowVersion: 1,
});

function attempt(input = {}) {
  return Object.freeze({
    id: "66666666-6666-4666-8666-666666666666",
    deliveryId,
    attemptNo: 1,
    providerMessageRef: "provider-ref-1",
    normalizedStatus: "RAW_STATUS",
    normalizedErrorCode: "RAW_ERROR",
    startedAt: "2026-09-30T00:01:00.000Z",
    completedAt: "2026-09-30T00:01:01.000Z",
    ...input,
  });
}

test("NOTIF-ATTHIST-READ-001 Delivery reader receives exact RequestContext/id before attempt access", async () => {
  const events = [];
  let deliveryInput;
  const deliveryReader = {
    async loadForContext(input) {
      events.push("delivery");
      deliveryInput = input;
      return delivery;
    },
  };
  const attemptReader = {
    async loadForDelivery() {
      events.push("attempts");
      return [];
    },
  };

  const result = await loadNotificationDeliveryAttemptHistoryEvidence(
    {requestContext, notificationDeliveryId: deliveryId},
    deliveryReader,
    attemptReader,
  );

  assert.ok(result);
  assert.deepEqual(events, ["delivery", "attempts"]);
  assert.equal(deliveryInput.requestContext, requestContext);
  assert.equal(deliveryInput.notificationDeliveryId, deliveryId);
});

test("NOTIF-ATTHIST-READ-002 null or hidden Delivery returns null and attempt reader is not called", async () => {
  let attemptCalls = 0;
  const result = await loadNotificationDeliveryAttemptHistoryEvidence(
    {requestContext, notificationDeliveryId: deliveryId},
    {async loadForContext() { return null; }},
    {async loadForDelivery() { attemptCalls += 1; return []; }},
  );
  assert.equal(result, null);
  assert.equal(attemptCalls, 0);
});

test("NOTIF-ATTHIST-READ-003 Delivery-reader error propagates unchanged and attempt reader is not called", async () => {
  const failure = new Error("delivery-read-failed");
  let attemptCalls = 0;
  await assert.rejects(
    loadNotificationDeliveryAttemptHistoryEvidence(
      {requestContext, notificationDeliveryId: deliveryId},
      {async loadForContext() { throw failure; }},
      {async loadForDelivery() { attemptCalls += 1; return []; }},
    ),
    (error) => error === failure,
  );
  assert.equal(attemptCalls, 0);
});

test("NOTIF-ATTHIST-ATT-001 visible parent causes attempt reader to receive exact same RequestContext/id", async () => {
  let attemptInput;
  const result = await loadNotificationDeliveryAttemptHistoryEvidence(
    {requestContext, notificationDeliveryId: deliveryId},
    {async loadForContext() { return delivery; }},
    {
      async loadForDelivery(input) {
        attemptInput = input;
        return [];
      },
    },
  );
  assert.ok(result);
  assert.equal(attemptInput.requestContext, requestContext);
  assert.equal(attemptInput.notificationDeliveryId, deliveryId);
});

test("NOTIF-ATTHIST-ATT-002 attempt-reader error propagates unchanged", async () => {
  const failure = new Error("attempt-read-failed");
  await assert.rejects(
    loadNotificationDeliveryAttemptHistoryEvidence(
      {requestContext, notificationDeliveryId: deliveryId},
      {async loadForContext() { return delivery; }},
      {async loadForDelivery() { throw failure; }},
    ),
    (error) => error === failure,
  );
});

test("NOTIF-ATTHIST-EVID-001 valid attempt rows compose to canonical DD-292 history/latest evidence", async () => {
  const a1 = attempt();
  const a3 = attempt({
    id: "77777777-7777-4777-8777-777777777777",
    attemptNo: 3,
    normalizedStatus: "RAW_STATUS_3",
  });
  const a2 = attempt({
    id: "88888888-8888-4888-8888-888888888888",
    attemptNo: 2,
    normalizedStatus: "RAW_STATUS_2",
  });
  const result = await loadNotificationDeliveryAttemptHistoryEvidence(
    {requestContext, notificationDeliveryId: deliveryId},
    {async loadForContext() { return delivery; }},
    {async loadForDelivery() { return [a3, a1, a2]; }},
  );
  assert.ok(result);
  assert.equal(result.delivery, delivery);
  assert.deepEqual(result.history.map((entry) => entry.attemptNo), [1, 2, 3]);
  assert.equal(result.latest.attemptNo, 3);
  assert.equal(result.latest.normalizedStatus, "RAW_STATUS_3");
  assert.equal(Object.isFrozen(result.history), true);
  assert.equal(result.history.every(Object.isFrozen), true);
});

test("NOTIF-ATTHIST-EVID-002 valid empty attempt rows return immutable empty-history envelope without latest", async () => {
  const result = await loadNotificationDeliveryAttemptHistoryEvidence(
    {requestContext, notificationDeliveryId: deliveryId},
    {async loadForContext() { return delivery; }},
    {async loadForDelivery() { return []; }},
  );
  assert.ok(result);
  assert.equal(result.delivery, delivery);
  assert.deepEqual(result.history, []);
  assert.equal(Object.isFrozen(result.history), true);
  assert.equal("latest" in result, false);
});

test("NOTIF-ATTHIST-EVID-003 malformed or cross-parent attempt evidence returned by a port fails closed as null", async () => {
  for (const attempts of [
    [attempt({deliveryId: otherDeliveryId})],
    [attempt(), attempt({attemptNo: 2})],
    [attempt({id: "bad"})],
  ]) {
    const result = await loadNotificationDeliveryAttemptHistoryEvidence(
      {requestContext, notificationDeliveryId: deliveryId},
      {async loadForContext() { return delivery; }},
      {async loadForDelivery() { return attempts; }},
    );
    assert.equal(result, null);
  }
});

test("NOTIF-ATTHIST-BOUND-001 inputs remain unchanged and output exposes no runtime decision authority", async () => {
  const input = Object.freeze({requestContext, notificationDeliveryId: deliveryId});
  const attempts = [attempt()];
  const beforeInput = JSON.stringify(input);
  const beforeAttempts = JSON.stringify(attempts);
  const result = await loadNotificationDeliveryAttemptHistoryEvidence(
    input,
    {async loadForContext() { return delivery; }},
    {async loadForDelivery() { return attempts; }},
  );
  assert.ok(result);
  assert.equal(JSON.stringify(input), beforeInput);
  assert.equal(JSON.stringify(attempts), beforeAttempts);
  for (const forbidden of [
    "retryable",
    "terminal",
    "nextAttemptNo",
    "backoff",
    "providerSelection",
    "credentialRef",
    "dispatch",
    "workerLease",
    "scheduleAt",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
