import test from "node:test";
import assert from "node:assert/strict";

import {
  loadWebhookDeliveryEventCurrentResidencyEvidence,
  matchesPersistedOutboxEventCurrentTenantResidencyFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  delivery: "11111111-1111-4111-8111-111111111111",
  subscription: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  foreignTenant: "34343434-3434-4434-8434-343434343434",
  industry: "44444444-4444-4444-8444-444444444444",
  siblingIndustry: "45454545-4545-4545-8545-454545454545",
  principal: "55555555-5555-4555-8555-555555555555",
  event: "66666666-6666-4666-8666-666666666666",
  correlation: "77777777-7777-4777-8777-777777777777",
});

function requestContext(overrides = {}) {
  return Object.freeze({
    requestId: "request-1",
    correlationId: "correlation-1",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    principalId: ids.principal,
    principalType: "HUMAN",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    permissionVersion: 1,
    entitlementSnapshotVersion: 1,
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function envelope(overrides = {}) {
  return Object.freeze({
    eventId: ids.event,
    eventType: "order.created",
    eventVersion: 1,
    scopeClass: "TENANT_INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    actorType: "SERVICE",
    sourceModule: "Orders",
    sourceResourceType: "Order",
    sourceResourceId: "ORDER-1",
    correlationId: ids.correlation,
    occurredAt: "2026-10-05T05:00:00.000Z",
    dataSensitivity: "INTERNAL",
    residencyRegion: "IN-CENTRAL",
    payloadSchema: "order.created.v1",
    payload: Object.freeze({orderId: "ORDER-1"}),
    ...overrides,
  });
}

function delivery(overrides = {}) {
  return Object.freeze({
    id: ids.delivery,
    subscriptionId: ids.subscription,
    eventId: ids.event,
    attemptNo: 1,
    endpointSnapshot: "https://example.invalid/webhook",
    payloadDigest: "sha256:raw",
    status: "RAW_PENDING",
    httpStatus: undefined,
    startedAt: "2026-10-05T05:00:00.000Z",
    completedAt: undefined,
    nextAttemptAt: undefined,
    errorClass: undefined,
    correlationId: ids.correlation,
    createdAt: "2026-10-05T05:00:00.000Z",
    ...overrides,
  });
}

function subscription(overrides = {}) {
  return Object.freeze({
    id: ids.subscription,
    tenantId: ids.tenant,
    name: "Webhook",
    endpointUrl: "https://example.invalid/webhook",
    status: "ACTIVE",
    secretVersion: 1,
    eventFilterJson: Object.freeze({raw: true}),
    allowedIndustryContextIds: Object.freeze([ids.industry]),
    createdBy: ids.principal,
    verifiedAt: "2026-10-05T04:00:00.000Z",
    createdAt: "2026-10-05T03:00:00.000Z",
    updatedAt: "2026-10-05T04:00:00.000Z",
    ...overrides,
  });
}

function event(overrides = {}) {
  return Object.freeze({
    id: ids.event,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    eventType: "order.created",
    eventVersion: 1,
    aggregateType: "Order",
    aggregateId: "ORDER-1",
    envelopeJson: envelope(),
    status: "DEAD",
    attemptCount: 99,
    availableAt: "2026-10-05T05:00:00.000Z",
    lastErrorCode: "RAW",
    createdAt: "2026-10-05T05:00:00.000Z",
    ...overrides,
  });
}

function catalog(overrides = {}) {
  return Object.freeze({
    eventType: "order.created",
    eventVersion: 1,
    producerModule: "Orders",
    scopeClass: "TENANT_INDUSTRY",
    sensitivityClass: "INTERNAL",
    payloadSchema: Object.freeze({type: "object"}),
    consumerClassesJson: Object.freeze([]),
    retentionAuditPosture: "STANDARD",
    webhookEligible: true,
    backwardCompatibility: "RAW",
    status: "RETIRED",
    createdAt: "2026-10-05T03:00:00.000Z",
    ...overrides,
  });
}

function residency(overrides = {}) {
  return Object.freeze({
    tenantId: ids.tenant,
    residencyRegionCode: "IN-CENTRAL",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {residency: []};
  const values = {
    delivery: Object.hasOwn(overrides, "delivery") ? overrides.delivery : delivery(),
    subscription: Object.hasOwn(overrides, "subscription") ? overrides.subscription : subscription(),
    event: Object.hasOwn(overrides, "event") ? overrides.event : event(),
    catalog: Object.hasOwn(overrides, "catalog") ? overrides.catalog : catalog(),
    residency: Object.hasOwn(overrides, "residency") ? overrides.residency : residency(),
  };
  return {
    order,
    calls,
    values,
    deliveryReader: {async loadForContext(){order.push("delivery"); if(overrides.deliveryError) throw overrides.deliveryError; return values.delivery;}},
    subscriptionReader: {async loadForContext(){order.push("subscription"); if(overrides.subscriptionError) throw overrides.subscriptionError; return values.subscription;}},
    eventReader: {async loadForContext(){order.push("event"); if(overrides.eventError) throw overrides.eventError; return values.event;}},
    catalogReader: {async loadExact(){order.push("catalog"); if(overrides.catalogError) throw overrides.catalogError; return values.catalog;}},
    residencyReader: {
      async loadCurrentForContext(input) {
        order.push("residency");
        calls.residency.push(input);
        if (overrides.residencyError) throw overrides.residencyError;
        return values.residency;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadWebhookDeliveryEventCurrentResidencyEvidence(
    {
      requestContext: requestContext(),
      deliveryId: ids.delivery,
      ...inputOverrides,
    },
    f.deliveryReader,
    f.subscriptionReader,
    f.eventReader,
    f.catalogReader,
    f.residencyReader,
  );
}

test("WH-EVTRES-BASE-001 exact DD-517 parent evidence executes first and residency is read only after success", async () => {
  const f = fixture();
  const context = requestContext();
  const result = await load(f, {requestContext: context});
  assert.ok(result);
  assert.deepEqual(f.order, ["delivery", "subscription", "event", "catalog", "residency"]);
  assert.deepEqual(f.calls.residency, [{requestContext: context, tenantId: ids.tenant}]);
});

test("WH-EVTRES-BASE-002 DD-517 null/error short-circuits or propagates before residency access", async () => {
  const hidden = fixture({delivery: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["delivery"]);
  assert.deepEqual(hidden.calls.residency, []);

  const expected = new Error("parent-failed");
  const broken = fixture({catalogError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.calls.residency, []);
});

test("WH-EVTRES-READ-001 exact preserved event Tenant id and RequestContext are forwarded once", async () => {
  const f = fixture();
  const context = requestContext();
  assert.ok(await load(f, {requestContext: context}));
  assert.deepEqual(f.calls.residency, [{requestContext: context, tenantId: ids.tenant}]);
});

test("WH-EVTRES-READ-002 null residency returns null and residency-reader errors propagate unchanged", async () => {
  const missing = fixture({residency: null});
  assert.equal(await load(missing), null);
  assert.equal(missing.calls.residency.length, 1);

  const expected = new Error("residency-failed");
  const broken = fixture({residencyError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.equal(broken.calls.residency.length, 1);
});

test("WH-EVTRES-FLOOR-001 exact Tenant-Core/Tenant-Industry current residency equality passes", () => {
  assert.equal(
    matchesPersistedOutboxEventCurrentTenantResidencyFloors(
      event(),
      catalog(),
      residency(),
    ),
    true,
  );

  const coreEvent = event({
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
    envelopeJson: envelope({
      industryContextId: undefined,
      scopeClass: "TENANT_CORE",
    }),
  });
  assert.equal(
    matchesPersistedOutboxEventCurrentTenantResidencyFloors(
      coreEvent,
      catalog({scopeClass: "TENANT_CORE"}),
      residency(),
    ),
    true,
  );
});

test("WH-EVTRES-FLOOR-002 wrong Tenant/region, invalid scope or invalid persisted envelope evidence fails closed", () => {
  const cases = [
    [event(), catalog(), residency({tenantId: ids.foreignTenant})],
    [event(), catalog(), residency({residencyRegionCode: "EU-WEST"})],
    [event(), catalog(), residency({residencyRegionCode: ""})],
    [event({scopeClass: "EXPLICIT_CROSS_CONTEXT", industryContextId: undefined}), catalog({scopeClass: "EXPLICIT_CROSS_CONTEXT"}), residency()],
    [event({envelopeJson: envelope({residencyRegion: "EU-WEST"})}), catalog(), residency()],
    [event({envelopeJson: envelope({tenantId: ids.foreignTenant})}), catalog(), residency()],
  ];
  for (const [candidateEvent, candidateCatalog, current] of cases) {
    assert.equal(
      matchesPersistedOutboxEventCurrentTenantResidencyFloors(
        candidateEvent,
        candidateCatalog,
        current,
      ),
      false,
    );
  }
});

test("WH-EVTRES-EVID-001 success preserves exact DD-517 parent/current-residency identities and immutable unchanged evidence", async () => {
  const f = fixture();
  const before = JSON.stringify(f.values);
  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.parent.parent.delivery, f.values.delivery);
  assert.equal(result.parent.parent.subscription, f.values.subscription);
  assert.equal(result.parent.parent.event, f.values.event);
  assert.equal(result.parent.parent.catalog, f.values.catalog);
  assert.equal(result.parent.envelopeJson, f.values.event.envelopeJson);
  assert.equal(result.currentResidency, f.values.residency);
  assert.equal(JSON.stringify(f.values), before);
});

test("WH-EVTRES-BOUND-001 current residency evidence grants no historical payload filter endpoint signing retry cross-context dispatch network or mutation authority", async () => {
  const result = await load(fixture());
  assert.ok(result);
  for (const forbidden of [
    "historicalResidency",
    "payloadSchemaValid",
    "catalogActive",
    "filterMatched",
    "endpointSafe",
    "endpointVerified",
    "signed",
    "secretMaterial",
    "retryable",
    "deliverable",
    "crossContextAuthorized",
    "dispatchAuthorized",
    "networkAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
