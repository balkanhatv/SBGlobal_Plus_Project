import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesCurrentTenantIntegrationIntegrityFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  integration: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  definition: "44444444-4444-4444-8444-444444444444",
  credential: "55555555-5555-4555-8555-555555555555",
  capability: "66666666-6666-4666-8666-666666666666",
  profile: "77777777-7777-4777-8777-777777777777",
});

const baseIntegration = Object.freeze({
  id: ids.integration,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  integrationDefinitionId: ids.definition,
  scopeClass: "TENANT_INDUSTRY",
  displayName: "Orders connector",
  status: "PAUSED",
  credentialReferenceId: ids.credential,
  config: Object.freeze({mode: "safe"}),
  enabledCapabilities: Object.freeze(["orders.sync"]),
  permissionProfileId: ids.profile,
  healthState: "UNAVAILABLE",
  version: 3,
  createdAt: "2026-09-24T04:00:00.000Z",
  updatedAt: "2026-09-24T05:00:00.000Z",
});

const baseCredential = Object.freeze({
  id: ids.credential,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  secretStoreProvider: "vault",
  credentialType: "API_KEY",
  keyVersion: 5,
  status: "ACTIVE",
  expiresAt: "2026-09-25T00:00:00.000Z",
  createdAt: "2026-09-20T00:00:00.000Z",
});

const baseDefinition = Object.freeze({
  id: ids.definition,
  code: "orders",
  name: "Orders",
  providerFamily: "example",
  capabilityCodes: Object.freeze(["orders.sync"]),
  adapterContractVersion: "v1",
  ownerScope: "PLATFORM",
  status: "ACTIVE",
  dataTransferClass: "INTERNAL",
  residencyMetadata: Object.freeze({}),
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-24T00:00:00.000Z",
});

const baseCapability = Object.freeze({
  id: ids.capability,
  integrationDefinitionId: ids.definition,
  capabilityCode: "orders.sync",
  direction: "BIDIRECTIONAL",
  operationContractId: "orders.sync",
  eventTypes: Object.freeze(["order.changed"]),
  dataClass: "INTERNAL",
  idempotencyClass: "STANDARD",
  rateClass: "AUTH_STANDARD",
  status: "ACTIVE",
});

function integration(overrides = {}) { return Object.freeze({...baseIntegration, ...overrides}); }
function credential(overrides = {}) { return Object.freeze({...baseCredential, ...overrides}); }
function definition(overrides = {}) { return Object.freeze({...baseDefinition, ...overrides}); }
function capability(overrides = {}) { return Object.freeze({...baseCapability, ...overrides}); }

const evaluatedAt = "2026-09-24T06:00:00.000Z";

test("INT-INTEGRITY-001 both DD-165 and DD-166 floors true returns true", () => {
  assert.equal(
    matchesCurrentTenantIntegrationIntegrityFloors(
      integration(), credential(), evaluatedAt, definition(), Object.freeze([capability()]),
    ),
    true,
  );
});

test("INT-INTEGRITY-002 credential floor failure fails composition", () => {
  assert.equal(
    matchesCurrentTenantIntegrationIntegrityFloors(
      integration(), credential({status: "REVOKED"}), evaluatedAt,
      definition(), Object.freeze([capability()]),
    ),
    false,
  );
});

test("INT-INTEGRITY-003 Definition/capability floor failure fails composition", () => {
  assert.equal(
    matchesCurrentTenantIntegrationIntegrityFloors(
      integration(), credential(), evaluatedAt,
      definition({status: "RETIRED"}), Object.freeze([capability()]),
    ),
    false,
  );
});

test("INT-INTEGRITY-004 both failed floors have no fallback", () => {
  assert.equal(
    matchesCurrentTenantIntegrationIntegrityFloors(
      integration({config: null}),
      credential({tenantId: "88888888-8888-4888-8888-888888888888"}),
      evaluatedAt,
      definition({status: "RETIRED"}),
      Object.freeze([]),
    ),
    false,
  );
});

test("INT-INTEGRITY-005 Tenant-Core and Tenant-Industry success preserve underlying scope rules", () => {
  assert.equal(
    matchesCurrentTenantIntegrationIntegrityFloors(
      integration({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      credential({industryContextId: undefined}),
      evaluatedAt,
      definition(),
      Object.freeze([capability()]),
    ),
    true,
  );
  assert.equal(
    matchesCurrentTenantIntegrationIntegrityFloors(
      integration(),
      credential({industryContextId: undefined}),
      evaluatedAt,
      definition(),
      Object.freeze([capability()]),
    ),
    true,
  );
});

test("INT-INTEGRITY-006 expired credential cannot be overridden by valid Definition/capability evidence", () => {
  assert.equal(
    matchesCurrentTenantIntegrationIntegrityFloors(
      integration(),
      credential({expiresAt: evaluatedAt}),
      evaluatedAt,
      definition(),
      Object.freeze([capability()]),
    ),
    false,
  );
});

test("INT-INTEGRITY-007 lifecycle/health/profile/provider/runtime evidence remains uninterpreted and inputs unchanged", () => {
  const candidateIntegration = integration({
    status: "REVOKED",
    healthState: "POLICY_BLOCKED",
    permissionProfileId: undefined,
  });
  const candidateCredential = credential({
    secretStoreProvider: "",
    credentialType: "",
    keyVersion: -1,
  });
  const candidateDefinition = definition({
    providerFamily: "uninterpreted-provider",
    dataTransferClass: "REGULATED",
  });
  const candidateCapabilities = Object.freeze([
    capability({
      direction: "OUTBOUND",
      operationContractId: "uninterpreted.operation",
      eventTypes: Object.freeze(["uninterpreted.event"]),
      dataClass: "REGULATED",
      idempotencyClass: "UNINTERPRETED",
      rateClass: "UNINTERPRETED",
    }),
  ]);

  const before = JSON.stringify([
    candidateIntegration,
    candidateCredential,
    candidateDefinition,
    candidateCapabilities,
  ]);

  assert.equal(
    matchesCurrentTenantIntegrationIntegrityFloors(
      candidateIntegration,
      candidateCredential,
      evaluatedAt,
      candidateDefinition,
      candidateCapabilities,
    ),
    true,
  );
  assert.equal(
    JSON.stringify([
      candidateIntegration,
      candidateCredential,
      candidateDefinition,
      candidateCapabilities,
    ]),
    before,
  );
});
