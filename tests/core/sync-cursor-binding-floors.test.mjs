import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesCurrentSyncCursorBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  cursor: "11111111-1111-4111-8111-111111111111",
  integration: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  industryA: "44444444-4444-4444-8444-444444444444",
  industryB: "55555555-5555-4555-8555-555555555555",
  definitionA: "66666666-6666-4666-8666-666666666666",
  definitionB: "77777777-7777-4777-8777-777777777777",
  credential: "88888888-8888-4888-8888-888888888888",
  capability: "99999999-9999-4999-8999-999999999999",
});

const baseIntegration = Object.freeze({
  id: ids.integration,
  tenantId: ids.tenant,
  industryContextId: ids.industryA,
  integrationDefinitionId: ids.definitionA,
  scopeClass: "TENANT_INDUSTRY",
  displayName: "Orders connector",
  status: "ACTIVE",
  credentialReferenceId: ids.credential,
  config: Object.freeze({mode: "opaque"}),
  enabledCapabilities: Object.freeze(["orders.sync"]),
  healthState: "HEALTHY",
  version: 7,
  createdAt: "2026-09-24T04:00:00.000Z",
  updatedAt: "2026-09-24T05:00:00.000Z",
});

const baseCapability = Object.freeze({
  id: ids.capability,
  integrationDefinitionId: ids.definitionA,
  capabilityCode: "orders.sync",
  direction: "INBOUND",
  eventTypes: Object.freeze(["order.changed"]),
  dataClass: "INTERNAL",
  idempotencyClass: "STANDARD",
  rateClass: "AUTH_STANDARD",
  status: "ACTIVE",
});

const baseCursor = Object.freeze({
  id: ids.cursor,
  tenantIntegrationId: ids.integration,
  capabilityCode: "orders.sync",
  industryContextId: ids.industryA,
  cursorEncryptedOrOpaque: "opaque:v1:abc",
  watermarkTime: "2026-09-24T05:00:00.000Z",
  sourceVersion: "source-17",
  updatedAt: "2026-09-24T05:01:00.000Z",
});

function integration(overrides = {}) {
  return Object.freeze({...baseIntegration, ...overrides});
}

function capability(overrides = {}) {
  return Object.freeze({...baseCapability, ...overrides});
}

function cursor(overrides = {}) {
  return Object.freeze({...baseCursor, ...overrides});
}

test("SYNC-BIND-001 exact active Tenant-Industry parent/capability/cursor binding matches", () => {
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor(),
      integration(),
      capability(),
    ),
    true,
  );
});

test("SYNC-BIND-002 exact active Tenant-Core null-Industry binding matches", () => {
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor({industryContextId: undefined}),
      integration({
        scopeClass: "TENANT_CORE",
        industryContextId: undefined,
      }),
      capability(),
    ),
    true,
  );
});

test("SYNC-BIND-003 non-ACTIVE TenantIntegration states fail closed", () => {
  for (const status of ["PENDING", "PAUSED", "ERROR", "REVOKED"]) {
    assert.equal(
      matchesCurrentSyncCursorBindingFloors(
        cursor(),
        integration({status}),
        capability(),
      ),
      false,
      status,
    );
  }
});

test("SYNC-BIND-004 definition/capability mismatch, disabled capability or non-ACTIVE capability fails", () => {
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor(),
      integration(),
      capability({integrationDefinitionId: ids.definitionB}),
    ),
    false,
  );
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor(),
      integration(),
      capability({capabilityCode: "other.sync"}),
    ),
    false,
  );
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor(),
      integration({enabledCapabilities: Object.freeze(["other.sync"])}),
      capability(),
    ),
    false,
  );
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor(),
      integration(),
      capability({status: "RETIRED"}),
    ),
    false,
  );
});

test("SYNC-BIND-005 sibling, missing or unexpected Industry Context fails closed", () => {
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor({industryContextId: ids.industryB}),
      integration(),
      capability(),
    ),
    false,
  );
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor({industryContextId: undefined}),
      integration(),
      capability(),
    ),
    false,
  );
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor(),
      integration({
        scopeClass: "TENANT_CORE",
        industryContextId: undefined,
      }),
      capability(),
    ),
    false,
  );
});

test("SYNC-BIND-006 malformed identity and duplicate enabled-capability evidence fails closed", () => {
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor({id: "not-a-uuid"}),
      integration(),
      capability(),
    ),
    false,
  );
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor(),
      integration({
        enabledCapabilities: Object.freeze(["orders.sync", "orders.sync"]),
      }),
      capability(),
    ),
    false,
  );
  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      cursor({capabilityCode: "   "}),
      integration(),
      capability(),
    ),
    false,
  );
});

test("SYNC-BIND-007 cursor contents, freshness, health/config and direction remain uninterpreted without mutation", () => {
  const candidateCursor = cursor({
    cursorEncryptedOrOpaque: "not-interpreted",
    watermarkTime: "also-not-interpreted",
    sourceVersion: "opaque-source",
    updatedAt: "not-interpreted",
  });
  const candidateIntegration = integration({
    healthState: "UNAVAILABLE",
    config: Object.freeze({unknownProviderConfig: Object.freeze({anything: true})}),
    permissionProfileId: ids.capability,
  });
  const candidateCapability = capability({
    direction: "OUTBOUND",
    operationContractId: ids.cursor,
    eventTypes: Object.freeze(["uninterpreted.event"]),
    dataClass: "REGULATED",
    idempotencyClass: "UNKNOWN_TO_THIS_FLOOR",
    rateClass: "UNKNOWN_TO_THIS_FLOOR",
  });

  const beforeCursor = JSON.stringify(candidateCursor);
  const beforeIntegration = JSON.stringify(candidateIntegration);
  const beforeCapability = JSON.stringify(candidateCapability);

  assert.equal(
    matchesCurrentSyncCursorBindingFloors(
      candidateCursor,
      candidateIntegration,
      candidateCapability,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateCursor), beforeCursor);
  assert.equal(JSON.stringify(candidateIntegration), beforeIntegration);
  assert.equal(JSON.stringify(candidateCapability), beforeCapability);
});
