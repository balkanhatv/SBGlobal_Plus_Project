import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesCurrentTenantIntegrationDefinitionCapabilityFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  integration: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  definitionA: "44444444-4444-4444-8444-444444444444",
  definitionB: "55555555-5555-4555-8555-555555555555",
  credential: "66666666-6666-4666-8666-666666666666",
  profile: "77777777-7777-4777-8777-777777777777",
  capabilityA: "88888888-8888-4888-8888-888888888888",
  capabilityB: "99999999-9999-4999-8999-999999999999",
});

const baseIntegration = Object.freeze({
  id: ids.integration,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  integrationDefinitionId: ids.definitionA,
  scopeClass: "TENANT_INDUSTRY",
  displayName: "Orders connector",
  status: "ACTIVE",
  credentialReferenceId: ids.credential,
  config: Object.freeze({mode: "safe-config"}),
  enabledCapabilities: Object.freeze(["orders.sync"]),
  permissionProfileId: ids.profile,
  healthState: "HEALTHY",
  version: 7,
  createdAt: "2026-09-24T04:00:00.000Z",
  updatedAt: "2026-09-24T05:00:00.000Z",
});

const baseDefinition = Object.freeze({
  id: ids.definitionA,
  code: "orders",
  name: "Orders",
  providerFamily: "example",
  capabilityCodes: Object.freeze(["orders.sync", "orders.write"]),
  adapterContractVersion: "v1",
  ownerScope: "PLATFORM",
  status: "ACTIVE",
  dataTransferClass: "INTERNAL",
  residencyMetadata: Object.freeze({}),
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-24T00:00:00.000Z",
});

const baseCapability = Object.freeze({
  id: ids.capabilityA,
  integrationDefinitionId: ids.definitionA,
  capabilityCode: "orders.sync",
  direction: "BIDIRECTIONAL",
  operationContractId: "core.orders.sync",
  eventTypes: Object.freeze(["order.changed"]),
  dataClass: "INTERNAL",
  idempotencyClass: "STANDARD",
  rateClass: "AUTH_STANDARD",
  status: "ACTIVE",
});

function integration(overrides = {}) {
  return Object.freeze({...baseIntegration, ...overrides});
}

function definition(overrides = {}) {
  return Object.freeze({...baseDefinition, ...overrides});
}

function capability(overrides = {}) {
  return Object.freeze({...baseCapability, ...overrides});
}

test("INT-SET-CUR-001 exact ACTIVE definition, object config and enabled ACTIVE capability matches", () => {
  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      integration(),
      definition(),
      Object.freeze([capability()]),
    ),
    true,
  );
});

test("INT-SET-CUR-002 empty enabled-capability set matches with ACTIVE definition and object config", () => {
  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      integration({enabledCapabilities: Object.freeze([])}),
      definition(),
      Object.freeze([]),
    ),
    true,
  );
});

test("INT-SET-CUR-003 wrong definition identity or non-ACTIVE definition fails closed", () => {
  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      integration(),
      definition({id: ids.definitionB}),
      Object.freeze([capability()]),
    ),
    false,
  );
  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      integration(),
      definition({status: "RETIRED"}),
      Object.freeze([capability()]),
    ),
    false,
  );
});

test("INT-SET-CUR-004 null, array or primitive integration config fails closed", () => {
  for (const config of [null, Object.freeze([]), "config", 7, true]) {
    assert.equal(
      matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
        integration({config}),
        definition(),
        Object.freeze([capability()]),
      ),
      false,
    );
  }
});

test("INT-SET-CUR-005 duplicate enabled codes or definition-membership absence fails closed", () => {
  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      integration({
        enabledCapabilities: Object.freeze(["orders.sync", "orders.sync"]),
      }),
      definition(),
      Object.freeze([capability()]),
    ),
    false,
  );
  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      integration(),
      definition({capabilityCodes: Object.freeze(["orders.write"])}),
      Object.freeze([capability()]),
    ),
    false,
  );
});

test("INT-SET-CUR-006 missing, inactive, wrong-tuple or ambiguous matching capability evidence fails", () => {
  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      integration(),
      definition(),
      Object.freeze([]),
    ),
    false,
  );
  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      integration(),
      definition(),
      Object.freeze([capability({status: "RETIRED"})]),
    ),
    false,
  );
  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      integration(),
      definition(),
      Object.freeze([capability({integrationDefinitionId: ids.definitionB})]),
    ),
    false,
  );
  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      integration(),
      definition(),
      Object.freeze([capability({capabilityCode: "orders.write"})]),
    ),
    false,
  );
  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      integration(),
      definition(),
      Object.freeze([
        capability(),
        capability({id: ids.capabilityB}),
      ]),
    ),
    false,
  );
});

test("INT-SET-CUR-007 unrelated integration/capability semantics and extra non-enabled evidence remain uninterpreted without mutation", () => {
  const candidateIntegration = integration({
    status: "REVOKED",
    credentialReferenceId: ids.capabilityB,
    healthState: "UNAVAILABLE",
    permissionProfileId: undefined,
  });
  const candidateDefinition = definition({
    ownerScope: "INDUSTRY",
    providerFamily: "uninterpreted-provider-family",
    dataTransferClass: "REGULATED",
  });
  const enabled = capability({
    direction: "OUTBOUND",
    operationContractId: "uninterpreted.operation",
    eventTypes: Object.freeze(["uninterpreted.event"]),
    dataClass: "REGULATED",
    idempotencyClass: "UNINTERPRETED",
    rateClass: "UNINTERPRETED",
  });
  const extra = capability({
    id: ids.capabilityB,
    capabilityCode: "orders.write",
    status: "RETIRED",
  });
  const candidates = Object.freeze([enabled, extra]);

  const beforeIntegration = JSON.stringify(candidateIntegration);
  const beforeDefinition = JSON.stringify(candidateDefinition);
  const beforeCapabilities = JSON.stringify(candidates);

  assert.equal(
    matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
      candidateIntegration,
      candidateDefinition,
      candidates,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateIntegration), beforeIntegration);
  assert.equal(JSON.stringify(candidateDefinition), beforeDefinition);
  assert.equal(JSON.stringify(candidates), beforeCapabilities);
});
