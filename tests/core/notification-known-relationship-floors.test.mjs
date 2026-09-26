import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesKnownNotificationDeliveryRelationshipFloors,
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
  principal: "99999999-9999-4999-8999-999999999999",
});

const baseDelivery = Object.freeze({
  id: ids.delivery,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  scopeClass: "TENANT_INDUSTRY",
  templateId: ids.template,
  templateVersion: 2,
  recipientPrincipalId: ids.principal,
  channel: "EMAIL",
  tenantIntegrationId: ids.integration,
  correlationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  sourceEventId: ids.event,
  status: "QUEUED",
  queuedAt: "2026-09-24T07:00:00.000Z",
  rowVersion: 1,
});

const baseIntegration = Object.freeze({
  id: ids.integration,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  integrationDefinitionId: ids.definition,
  scopeClass: "TENANT_INDUSTRY",
  displayName: "Email",
  status: "ACTIVE",
  credentialReferenceId: ids.credential,
  config: Object.freeze({opaque: true}),
  enabledCapabilities: Object.freeze([]),
  healthState: "UNAVAILABLE",
  version: 1,
  createdAt: "2026-09-24T06:00:00.000Z",
  updatedAt: "2026-09-24T06:30:00.000Z",
});

const baseEvent = Object.freeze({
  id: ids.event,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  scopeClass: "TENANT_INDUSTRY",
  eventType: "notification.requested",
  eventVersion: 1,
  aggregateType: "Notification",
  aggregateId: ids.delivery,
  envelopeJson: Object.freeze({opaque: true}),
  status: "DEAD",
  attemptCount: 99,
  availableAt: "not-interpreted",
  createdAt: "not-interpreted",
});

const baseTemplate = Object.freeze({
  id: ids.template,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  code: "opaque",
  channel: "EMAIL",
  localeCode: "en-IN",
  version: 2,
  status: "ACTIVE",
  bodyTemplate: "opaque",
  variableSchema: Object.freeze({}),
  createdBy: ids.principal,
  createdAt: "not-interpreted",
  updatedAt: "not-interpreted",
});

function delivery(overrides = {}) { return Object.freeze({...baseDelivery, ...overrides}); }
function integration(overrides = {}) { return Object.freeze({...baseIntegration, ...overrides}); }
function event(overrides = {}) { return Object.freeze({...baseEvent, ...overrides}); }
function template(overrides = {}) { return Object.freeze({...baseTemplate, ...overrides}); }

test("NOTIF-REL-CUR-001 all known relationship floors true returns true", () => {
  assert.equal(
    matchesKnownNotificationDeliveryRelationshipFloors(
      delivery(), integration(), event(), template(),
    ),
    true,
  );
});

test("NOTIF-REL-CUR-002 integration floor failure fails composition", () => {
  assert.equal(
    matchesKnownNotificationDeliveryRelationshipFloors(
      delivery(), integration({status: "REVOKED"}), event(), template(),
    ),
    false,
  );
});

test("NOTIF-REL-CUR-003 source-event floor failure fails composition", () => {
  assert.equal(
    matchesKnownNotificationDeliveryRelationshipFloors(
      delivery(), integration(), event({industryContextId: undefined}), template(),
    ),
    false,
  );
});

test("NOTIF-REL-CUR-004 template floor failure fails composition", () => {
  assert.equal(
    matchesKnownNotificationDeliveryRelationshipFloors(
      delivery(), integration(), event(), template({status: "RETIRED"}),
    ),
    false,
  );
});

test("NOTIF-REL-CUR-005 multiple failed floors have no fallback", () => {
  assert.equal(
    matchesKnownNotificationDeliveryRelationshipFloors(
      delivery({templateVersion: 7}),
      integration({tenantId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}),
      event({id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc"}),
      template(),
    ),
    false,
  );
});

test("NOTIF-REL-CUR-006 independently unbound optional relationships remain valid", () => {
  assert.equal(
    matchesKnownNotificationDeliveryRelationshipFloors(
      delivery({
        tenantIntegrationId: undefined,
        sourceEventId: undefined,
        templateId: undefined,
        templateVersion: undefined,
      }),
      undefined,
      undefined,
      undefined,
    ),
    true,
  );
});

test("NOTIF-REL-CUR-007 recipient/lifecycle/render/runtime evidence is uninterpreted and inputs remain unchanged", () => {
  const d = delivery({
    recipientPrincipalId: "not-a-uuid",
    recipientReference: "",
    status: "FAILED",
    lastErrorCode: "UNINTERPRETED",
    sentAt: "not-interpreted",
    deliveredAt: "not-interpreted",
  });
  const i = integration({
    healthState: "POLICY_BLOCKED",
    permissionProfileId: undefined,
  });
  const e = event({
    status: "DEAD",
    attemptCount: 999,
    lockedBy: "uninterpreted",
    lastErrorCode: "UNINTERPRETED",
  });
  const t = template({
    localeCode: "",
    bodyTemplate: "",
    createdBy: "",
    approvedBy: undefined,
  });

  const before = [d, i, e, t].map((value) => JSON.stringify(value));

  assert.equal(
    matchesKnownNotificationDeliveryRelationshipFloors(d, i, e, t),
    true,
  );
  assert.deepEqual(
    [d, i, e, t].map((value) => JSON.stringify(value)),
    before,
  );
});
