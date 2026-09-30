import test from "node:test";
import assert from "node:assert/strict";

import {
  buildNotificationDeliveryAttemptHistoryEvidence,
  matchesNotificationDeliveryAttemptHistoryEvidenceFloor,
  matchesNotificationDeliveryAttemptParentFloor,
  projectLatestNotificationDeliveryAttemptEvidence,
  projectNotificationDeliveryAttemptHistory,
} from "../../dist/core/index.js";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const otherDeliveryId = "22222222-2222-4222-8222-222222222222";

const delivery = Object.freeze({
  id: deliveryId,
  tenantId: "33333333-3333-4333-8333-333333333333",
  scopeClass: "TENANT_CORE",
  recipientReference: "recipient-safe-ref",
  channel: "EMAIL",
  correlationId: "44444444-4444-4444-8444-444444444444",
  status: "QUEUED",
  queuedAt: "2026-09-30T00:00:00.000Z",
  rowVersion: 1,
});

function attempt(input = {}) {
  return Object.freeze({
    id: "55555555-5555-4555-8555-555555555555",
    deliveryId,
    attemptNo: 1,
    providerMessageRef: "provider-ref-1",
    normalizedStatus: "RAW_PROVIDER_ACCEPTED",
    normalizedErrorCode: "RAW_NONE",
    startedAt: "2026-09-30T00:01:00.000Z",
    completedAt: "2026-09-30T00:01:01.000Z",
    ...input,
  });
}

test("NOTIF-ATT-PARENT-001 exact parent id and positive attempt number pass", () => {
  assert.equal(matchesNotificationDeliveryAttemptParentFloor(attempt(), delivery), true);
  assert.equal(matchesNotificationDeliveryAttemptParentFloor(
    attempt({attemptNo: 9}),
    delivery,
  ), true);
});

test("NOTIF-ATT-PARENT-002 wrong malformed parent or non-positive/non-integer attempt number fails", () => {
  for (const [candidate, parent] of [
    [attempt({deliveryId: otherDeliveryId}), delivery],
    [attempt({id: "bad"}), delivery],
    [attempt({deliveryId: "bad"}), delivery],
    [attempt({attemptNo: 0}), delivery],
    [attempt({attemptNo: 1.5}), delivery],
    [attempt(), {...delivery, id: "bad"}],
  ]) {
    assert.equal(matchesNotificationDeliveryAttemptParentFloor(candidate, parent), false);
  }
});

test("NOTIF-ATT-SET-001 valid same-Delivery unique attempt ids and numbers pass", () => {
  const attempts = [
    attempt(),
    attempt({
      id: "66666666-6666-4666-8666-666666666666",
      attemptNo: 3,
    }),
  ];
  assert.equal(
    matchesNotificationDeliveryAttemptHistoryEvidenceFloor(delivery, attempts),
    true,
  );
});

test("NOTIF-ATT-SET-002 duplicate attempt id or duplicate attempt number fails closed", () => {
  const secondId = "66666666-6666-4666-8666-666666666666";
  assert.equal(matchesNotificationDeliveryAttemptHistoryEvidenceFloor(delivery, [
    attempt(),
    attempt({attemptNo: 2}),
  ]), false);
  assert.equal(matchesNotificationDeliveryAttemptHistoryEvidenceFloor(delivery, [
    attempt(),
    attempt({id: secondId, attemptNo: 1}),
  ]), false);
});

test("NOTIF-ATT-SET-003 cross-Delivery sparse or malformed evidence fails closed", () => {
  const sparse = [attempt()];
  sparse.length = 2;
  for (const attempts of [
    [attempt({deliveryId: otherDeliveryId})],
    sparse,
    [attempt({id: "bad"})],
  ]) {
    assert.equal(
      matchesNotificationDeliveryAttemptHistoryEvidenceFloor(delivery, attempts),
      false,
    );
  }
});

test("NOTIF-ATT-SET-004 valid empty history passes", () => {
  assert.equal(
    matchesNotificationDeliveryAttemptHistoryEvidenceFloor(delivery, []),
    true,
  );
});

test("NOTIF-ATT-HIST-001 unsorted valid evidence projects immutable canonical attemptNo/id order", () => {
  const a1 = attempt();
  const a2 = attempt({
    id: "66666666-6666-4666-8666-666666666666",
    attemptNo: 2,
  });
  const a4 = attempt({
    id: "77777777-7777-4777-8777-777777777777",
    attemptNo: 4,
  });
  const result = projectNotificationDeliveryAttemptHistory(delivery, [a4, a1, a2]);
  assert.ok(result);
  assert.deepEqual(result.map((entry) => entry.attemptNo), [1, 2, 4]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.every(Object.isFrozen), true);
});

test("NOTIF-ATT-HIST-002 raw provider status error and timestamp evidence is preserved without interpretation", () => {
  const raw = attempt({
    providerMessageRef: "opaque-provider-message",
    normalizedStatus: "VENDOR_STATUS_X",
    normalizedErrorCode: "VENDOR_ERROR_Y",
    startedAt: "raw-start-evidence",
    completedAt: "raw-complete-evidence",
  });
  const result = projectNotificationDeliveryAttemptHistory(delivery, [raw]);
  assert.ok(result);
  assert.deepEqual(result[0], raw);
  assert.notEqual(result[0], raw);
});

test("NOTIF-ATT-LATEST-001 non-empty history returns highest attempt-number raw evidence", () => {
  const result = projectLatestNotificationDeliveryAttemptEvidence(delivery, [
    attempt({id: "77777777-7777-4777-8777-777777777777", attemptNo: 7}),
    attempt(),
    attempt({id: "66666666-6666-4666-8666-666666666666", attemptNo: 3}),
  ]);
  assert.ok(result);
  assert.equal(result.attemptNo, 7);
  assert.equal(result.normalizedStatus, "RAW_PROVIDER_ACCEPTED");
});

test("NOTIF-ATT-LATEST-002 valid empty history returns undefined while malformed history is null", () => {
  assert.equal(projectLatestNotificationDeliveryAttemptEvidence(delivery, []), undefined);
  assert.equal(projectLatestNotificationDeliveryAttemptEvidence(
    delivery,
    [attempt({deliveryId: otherDeliveryId})],
  ), null);
});

test("NOTIF-ATT-ENV-001 combined envelope preserves exact Delivery identity plus immutable history and latest evidence", () => {
  const a1 = attempt();
  const a2 = attempt({
    id: "66666666-6666-4666-8666-666666666666",
    attemptNo: 2,
  });
  const result = buildNotificationDeliveryAttemptHistoryEvidence(delivery, [a2, a1]);
  assert.ok(result);
  assert.equal(result.delivery, delivery);
  assert.deepEqual(result.history.map((entry) => entry.attemptNo), [1, 2]);
  assert.equal(result.latest, result.history[1]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.history), true);
});

test("NOTIF-ATT-BOUND-001 inputs remain unchanged and output exposes no retry finality backoff provider dispatch or scheduling authority", () => {
  const attempts = [
    attempt(),
    attempt({
      id: "66666666-6666-4666-8666-666666666666",
      attemptNo: 2,
    }),
  ];
  const deliveryBefore = JSON.stringify(delivery);
  const attemptsBefore = JSON.stringify(attempts);
  const result = buildNotificationDeliveryAttemptHistoryEvidence(delivery, attempts);
  assert.ok(result);
  assert.equal(JSON.stringify(delivery), deliveryBefore);
  assert.equal(JSON.stringify(attempts), attemptsBefore);
  for (const forbidden of [
    "retryable",
    "terminal",
    "nextAttemptNo",
    "backoff",
    "providerSelection",
    "credentialRef",
    "dispatch",
    "scheduleAt",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
