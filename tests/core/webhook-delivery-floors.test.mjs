import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesWebhookDeliveryNecessaryFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  subscription: "11111111-1111-4111-8111-111111111111",
  tenantA: "22222222-2222-4222-8222-222222222222",
  tenantB: "33333333-3333-4333-8333-333333333333",
  industryA: "44444444-4444-4444-8444-444444444444",
  industryB: "55555555-5555-4555-8555-555555555555",
  principal: "66666666-6666-4666-8666-666666666666",
  event: "77777777-7777-4777-8777-777777777777",
  correlation: "88888888-8888-4888-8888-888888888888",
  profile: "99999999-9999-4999-8999-999999999999",
});

const baseSubscription = Object.freeze({
  id: ids.subscription,
  tenantId: ids.tenantA,
  name: "Orders webhook",
  endpointUrl: "https://example.invalid/hooks",
  status: "ACTIVE",
  secretVersion: 1,
  eventFilterJson: Object.freeze({eventTypes: Object.freeze(["order.created"])}),
  allowedIndustryContextIds: Object.freeze([ids.industryA]),
  createdBy: ids.principal,
  verifiedAt: "2026-09-24T05:00:00.000Z",
  createdAt: "2026-09-24T04:00:00.000Z",
  updatedAt: "2026-09-24T05:00:00.000Z",
});

const baseEvent = Object.freeze({
  id: ids.event,
  tenantId: ids.tenantA,
  scopeClass: "TENANT_CORE",
  eventType: "order.created",
  eventVersion: 1,
  aggregateType: "Order",
  aggregateId: "ORD-1",
  envelopeJson: Object.freeze({fixture: true}),
  status: "PENDING",
  attemptCount: 0,
  availableAt: "2026-09-24T05:01:00.000Z",
  createdAt: "2026-09-24T05:00:00.000Z",
});

const baseCatalog = Object.freeze({
  eventType: "order.created",
  eventVersion: 1,
  producerModule: "Orders",
  scopeClass: "TENANT_CORE",
  sensitivityClass: "INTERNAL",
  payloadSchema: Object.freeze({type: "object"}),
  consumerClassesJson: Object.freeze([]),
  retentionAuditPosture: "STANDARD",
  webhookEligible: true,
  backwardCompatibility: "ADDITIVE",
  status: "ACTIVE",
  createdAt: "2026-09-24T04:00:00.000Z",
});

function subscription(overrides = {}) {
  return Object.freeze({...baseSubscription, ...overrides});
}

function event(overrides = {}) {
  return Object.freeze({...baseEvent, ...overrides});
}

function catalog(overrides = {}) {
  return Object.freeze({...baseCatalog, ...overrides});
}

test("WH-FLOOR-001 ACTIVE verified same-Tenant Tenant-Core event with exact webhook-eligible catalog returns true", () => {
  assert.equal(
    matchesWebhookDeliveryNecessaryFloors(
      subscription(),
      event(),
      catalog(),
    ),
    true,
  );
});

test("WH-FLOOR-002 non-ACTIVE or missing/malformed verification evidence fails closed", () => {
  for (const status of ["PENDING_VERIFICATION", "PAUSED", "REVOKED"]) {
    assert.equal(
      matchesWebhookDeliveryNecessaryFloors(
        subscription({status}),
        event(),
        catalog(),
      ),
      false,
    );
  }

  assert.equal(
    matchesWebhookDeliveryNecessaryFloors(
      subscription({verifiedAt: undefined}),
      event(),
      catalog(),
    ),
    false,
  );
  assert.equal(
    matchesWebhookDeliveryNecessaryFloors(
      subscription({verifiedAt: "not-a-time"}),
      event(),
      catalog(),
    ),
    false,
  );
});

test("WH-FLOOR-003 foreign-Tenant and Platform-Global events fail closed", () => {
  assert.equal(
    matchesWebhookDeliveryNecessaryFloors(
      subscription(),
      event({tenantId: ids.tenantB}),
      catalog(),
    ),
    false,
  );

  assert.equal(
    matchesWebhookDeliveryNecessaryFloors(
      subscription(),
      event({
        tenantId: undefined,
        scopeClass: "PLATFORM_GLOBAL",
      }),
      catalog({scopeClass: "PLATFORM_GLOBAL"}),
    ),
    false,
  );
});

test("WH-FLOOR-004 Tenant-Industry requires the exact Industry Context in the subscription allowlist", () => {
  const industryEvent = event({
    scopeClass: "TENANT_INDUSTRY",
    industryContextId: ids.industryA,
  });
  const industryCatalog = catalog({scopeClass: "TENANT_INDUSTRY"});

  assert.equal(
    matchesWebhookDeliveryNecessaryFloors(
      subscription(),
      industryEvent,
      industryCatalog,
    ),
    true,
  );

  assert.equal(
    matchesWebhookDeliveryNecessaryFloors(
      subscription({allowedIndustryContextIds: Object.freeze([ids.industryB])}),
      industryEvent,
      industryCatalog,
    ),
    false,
  );

  assert.equal(
    matchesWebhookDeliveryNecessaryFloors(
      subscription(),
      event({scopeClass: "TENANT_INDUSTRY", industryContextId: undefined}),
      industryCatalog,
    ),
    false,
  );
});

test("WH-FLOOR-005 catalog identity mismatch or webhook-ineligible catalog fails closed", () => {
  for (const mismatched of [
    catalog({eventType: "other.event"}),
    catalog({eventVersion: 2}),
    catalog({scopeClass: "TENANT_INDUSTRY"}),
    catalog({webhookEligible: false}),
  ]) {
    assert.equal(
      matchesWebhookDeliveryNecessaryFloors(
        subscription(),
        event(),
        mismatched,
      ),
      false,
    );
  }
});

test("WH-FLOOR-006 explicit cross-context remains outside the bounded helper", () => {
  assert.equal(
    matchesWebhookDeliveryNecessaryFloors(
      subscription({allowedIndustryContextIds: Object.freeze([ids.industryA, ids.industryB])}),
      event({
        scopeClass: "EXPLICIT_CROSS_CONTEXT",
        industryContextId: undefined,
        envelopeJson: Object.freeze({
          sourceIndustryContextId: ids.industryA,
          targetIndustryContextId: ids.industryB,
        }),
      }),
      catalog({scopeClass: "EXPLICIT_CROSS_CONTEXT"}),
    ),
    false,
  );
});

test("WH-FLOOR-007 filters, endpoint, profile, secret version, dispatch state and catalog lifecycle stay uninterpreted without mutation", () => {
  const candidateSubscription = subscription({
    endpointUrl: "http://127.0.0.1/internal",
    secretVersion: -99,
    permissionProfileId: ids.profile,
    eventFilterJson: Object.freeze({
      unknownFilterGrammar: Object.freeze({anything: true}),
    }),
  });
  const candidateEvent = event({
    status: "DEAD",
    attemptCount: 999,
    availableAt: "not-interpreted",
    lastErrorCode: "ANYTHING",
  });
  const candidateCatalog = catalog({
    status: "RETIRED",
    backwardCompatibility: "not-interpreted",
  });
  const beforeSubscription = JSON.stringify(candidateSubscription);
  const beforeEvent = JSON.stringify(candidateEvent);
  const beforeCatalog = JSON.stringify(candidateCatalog);

  assert.equal(
    matchesWebhookDeliveryNecessaryFloors(
      candidateSubscription,
      candidateEvent,
      candidateCatalog,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateSubscription), beforeSubscription);
  assert.equal(JSON.stringify(candidateEvent), beforeEvent);
  assert.equal(JSON.stringify(candidateCatalog), beforeCatalog);
  assert.equal(Object.isFrozen(candidateSubscription), true);
  assert.equal(Object.isFrozen(candidateEvent), true);
  assert.equal(Object.isFrozen(candidateCatalog), true);
});
