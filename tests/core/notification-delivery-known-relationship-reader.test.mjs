import test from "node:test";
import assert from "node:assert/strict";

import {
  loadNotificationDeliveryKnownRelationshipEvidence,
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

function readers(overrides = {}) {
  const calls = {integration: [], event: [], template: []};
  return {
    calls,
    integrationReader: {
      async loadForContext(input) {
        calls.integration.push(input);
        return overrides.integration === undefined ? integration : overrides.integration;
      },
    },
    eventReader: {
      async loadForContext(input) {
        calls.event.push(input);
        return overrides.event === undefined ? event : overrides.event;
      },
    },
    templateReader: {
      async loadForContext(input) {
        calls.template.push(input);
        return overrides.template === undefined ? template : overrides.template;
      },
    },
  };
}

test("NOTIF-RELREAD-INT-001 bound Integration forwards exact context/id and preserves reference", async () => {
  const r = readers();
  const result = await loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery},
    r.integrationReader,
    r.eventReader,
    r.templateReader,
  );
  assert.ok(result);
  assert.deepEqual(r.calls.integration, [{
    requestContext,
    tenantIntegrationId: ids.integration,
  }]);
  assert.equal(result.integration, integration);
});

test("NOTIF-RELREAD-INT-002 unbound Integration skips reader; bound null fails closed", async () => {
  const unboundDelivery = Object.freeze({...delivery, tenantIntegrationId: undefined});
  const a = readers();
  const ok = await loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery: unboundDelivery},
    a.integrationReader,
    a.eventReader,
    a.templateReader,
  );
  assert.ok(ok);
  assert.deepEqual(a.calls.integration, []);
  assert.equal("integration" in ok, false);

  const b = readers({integration: null});
  assert.equal(await loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery},
    b.integrationReader,
    b.eventReader,
    b.templateReader,
  ), null);
});

test("NOTIF-RELREAD-EVT-001 bound source Event forwards exact context/id and preserves reference", async () => {
  const r = readers();
  const result = await loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery},
    r.integrationReader,
    r.eventReader,
    r.templateReader,
  );
  assert.ok(result);
  assert.deepEqual(r.calls.event, [{requestContext, eventId: ids.event}]);
  assert.equal(result.event, event);
});

test("NOTIF-RELREAD-EVT-002 unbound source Event skips reader; bound null fails closed", async () => {
  const unboundDelivery = Object.freeze({...delivery, sourceEventId: undefined});
  const a = readers();
  const ok = await loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery: unboundDelivery},
    a.integrationReader,
    a.eventReader,
    a.templateReader,
  );
  assert.ok(ok);
  assert.deepEqual(a.calls.event, []);
  assert.equal("event" in ok, false);

  const b = readers({event: null});
  assert.equal(await loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery},
    b.integrationReader,
    b.eventReader,
    b.templateReader,
  ), null);
});

test("NOTIF-RELREAD-TPL-001 bound Template forwards exact context/id and preserves reference", async () => {
  const r = readers();
  const result = await loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery},
    r.integrationReader,
    r.eventReader,
    r.templateReader,
  );
  assert.ok(result);
  assert.deepEqual(r.calls.template, [{
    requestContext,
    notificationTemplateId: ids.template,
  }]);
  assert.equal(result.template, template);
});

test("NOTIF-RELREAD-TPL-002 unbound Template skips reader; bound null fails closed", async () => {
  const unboundDelivery = Object.freeze({
    ...delivery,
    templateId: undefined,
    templateVersion: undefined,
  });
  const a = readers();
  const ok = await loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery: unboundDelivery},
    a.integrationReader,
    a.eventReader,
    a.templateReader,
  );
  assert.ok(ok);
  assert.deepEqual(a.calls.template, []);
  assert.equal("template" in ok, false);

  const b = readers({template: null});
  assert.equal(await loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery},
    b.integrationReader,
    b.eventReader,
    b.templateReader,
  ), null);
});

test("NOTIF-RELREAD-REL-001 valid loaded relationships return immutable evidence envelope", async () => {
  const r = readers();
  const result = await loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery},
    r.integrationReader,
    r.eventReader,
    r.templateReader,
  );
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.delivery, delivery);
  assert.equal(result.integration, integration);
  assert.equal(result.event, event);
  assert.equal(result.template, template);
});

test("NOTIF-RELREAD-REL-002 any DD-172 mismatch returns null with no fallback selection", async () => {
  const wrongTemplate = Object.freeze({...template, version: 4});
  const r = readers({template: wrongTemplate});
  const result = await loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery},
    r.integrationReader,
    r.eventReader,
    r.templateReader,
  );
  assert.equal(result, null);
  assert.equal(r.calls.template.length, 1);
});

test("NOTIF-RELREAD-ERR-001 invoked reader dependency error propagates unchanged", async () => {
  const failure = new Error("integration-read-failed");
  const r = readers();
  r.integrationReader.loadForContext = async () => { throw failure; };
  await assert.rejects(
    loadNotificationDeliveryKnownRelationshipEvidence(
      {requestContext, delivery},
      r.integrationReader,
      r.eventReader,
      r.templateReader,
    ),
    (error) => error === failure,
  );
});

test("NOTIF-RELREAD-BOUND-001 inputs remain unchanged and output grants no send/runtime authority", async () => {
  const r = readers();
  const input = {requestContext, delivery};
  const before = JSON.stringify(input);
  const result = await loadNotificationDeliveryKnownRelationshipEvidence(
    input,
    r.integrationReader,
    r.eventReader,
    r.templateReader,
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
    "lifecycleDecision",
    "renderedContent",
    "providerSelection",
    "credential",
    "retryDecision",
    "dispatchDecision",
    "scheduledAt",
    "sendAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
