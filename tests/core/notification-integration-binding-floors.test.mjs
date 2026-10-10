import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesNotificationDeliveryIntegrationBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  delivery: "11111111-1111-4111-8111-111111111111",
  tenantA: "22222222-2222-4222-8222-222222222222",
  tenantB: "33333333-3333-4333-8333-333333333333",
  industryA: "44444444-4444-4444-8444-444444444444",
  industryB: "55555555-5555-4555-8555-555555555555",
  integration: "66666666-6666-4666-8666-666666666666",
  otherIntegration: "77777777-7777-4777-8777-777777777777",
  definition: "88888888-8888-4888-8888-888888888888",
  credential: "99999999-9999-4999-8999-999999999999",
});

const baseDelivery = Object.freeze({
  id: ids.delivery,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  scopeClass: "TENANT_INDUSTRY",
  recipientReference: "opaque-recipient",
  channel: "EMAIL",
  tenantIntegrationId: ids.integration,
  correlationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  status: "QUEUED",
  queuedAt: "2026-09-24T06:00:00.000Z",
  rowVersion: 1,
});

const baseIntegration = Object.freeze({
  id: ids.integration,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  integrationDefinitionId: ids.definition,
  scopeClass: "TENANT_INDUSTRY",
  displayName: "Email connector",
  status: "ACTIVE",
  credentialReferenceId: ids.credential,
  config: Object.freeze({provider: "opaque"}),
  enabledCapabilities: Object.freeze(["notification.send"]),
  healthState: "UNAVAILABLE",
  version: 3,
  createdAt: "2026-09-24T04:00:00.000Z",
  updatedAt: "2026-09-24T05:00:00.000Z",
});

function delivery(overrides = {}) {
  return Object.freeze({...baseDelivery, ...overrides});
}

function integration(overrides = {}) {
  return Object.freeze({...baseIntegration, ...overrides});
}

test("NOTIF-INT-CUR-001 unbound delivery with no integration evidence matches", () => {
  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(
      delivery({tenantIntegrationId: undefined}),
      undefined,
    ),
    true,
  );
});

test("NOTIF-INT-CUR-002 same-Tenant ACTIVE Tenant-wide integration may bind Core and Industry delivery", () => {
  const tenantWide = integration({
    scopeClass: "TENANT_CORE",
    industryContextId: undefined,
  });

  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(
      delivery({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      tenantWide,
    ),
    true,
  );
  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(delivery(), tenantWide),
    true,
  );
});

test("NOTIF-INT-CUR-003 Industry integration binds only exact Industry delivery", () => {
  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(delivery(), integration()),
    true,
  );
  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(
      delivery({industryContextId: ids.industryB}),
      integration(),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(
      delivery({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      integration(),
    ),
    false,
  );
});

test("NOTIF-INT-CUR-004 wrong integration identity or foreign Tenant fails closed", () => {
  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(
      delivery(),
      integration({id: ids.otherIntegration}),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(
      delivery(),
      integration({tenantId: ids.tenantB}),
    ),
    false,
  );
});

test("NOTIF-INT-CUR-005 non-ACTIVE integration states fail", () => {
  for (const status of ["PENDING", "PAUSED", "ERROR", "REVOKED"]) {
    assert.equal(
      matchesNotificationDeliveryIntegrationBindingFloors(
        delivery(),
        integration({status}),
      ),
      false,
      status,
    );
  }
});

test("NOTIF-INT-CUR-006 malformed ownership or unexpected integration evidence fails closed", () => {
  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(
      delivery({id: "not-a-uuid"}),
      integration(),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(
      delivery({scopeClass: "TENANT_CORE"}),
      integration({scopeClass: "TENANT_CORE", industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(
      delivery({scopeClass: "TENANT_INDUSTRY", industryContextId: undefined}),
      integration(),
    ),
    false,
  );
  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(
      delivery({tenantIntegrationId: undefined}),
      integration(),
    ),
    false,
  );
});

test("NOTIF-INT-CUR-007 unrelated delivery/integration semantics remain uninterpreted without mutation", () => {
  const candidateDelivery = delivery({
    templateId: ids.definition,
    templateVersion: 99,
    recipientReference: "uninterpreted-recipient",
    channel: "WHATSAPP",
    status: "FAILED",
    lastErrorCode: "UNINTERPRETED",
    sentAt: "not-interpreted",
    deliveredAt: "also-not-interpreted",
  });
  const candidateIntegration = integration({
    integrationDefinitionId: ids.otherIntegration,
    credentialReferenceId: ids.otherIntegration,
    config: Object.freeze({anything: Object.freeze({goes: true})}),
    enabledCapabilities: Object.freeze([]),
    permissionProfileId: ids.definition,
    healthState: "POLICY_BLOCKED",
    lastHealthAt: "not-interpreted",
  });

  const beforeDelivery = JSON.stringify(candidateDelivery);
  const beforeIntegration = JSON.stringify(candidateIntegration);

  assert.equal(
    matchesNotificationDeliveryIntegrationBindingFloors(
      candidateDelivery,
      candidateIntegration,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateDelivery), beforeDelivery);
  assert.equal(JSON.stringify(candidateIntegration), beforeIntegration);
});
