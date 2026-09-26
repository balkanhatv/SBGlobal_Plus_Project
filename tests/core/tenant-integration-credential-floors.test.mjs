import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesCurrentTenantIntegrationCredentialFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  integration: "11111111-1111-4111-8111-111111111111",
  tenantA: "22222222-2222-4222-8222-222222222222",
  tenantB: "33333333-3333-4333-8333-333333333333",
  industryA: "44444444-4444-4444-8444-444444444444",
  industryB: "55555555-5555-4555-8555-555555555555",
  definition: "66666666-6666-4666-8666-666666666666",
  credential: "77777777-7777-4777-8777-777777777777",
  otherCredential: "88888888-8888-4888-8888-888888888888",
  profile: "99999999-9999-4999-8999-999999999999",
});

const baseIntegration = Object.freeze({
  id: ids.integration,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  integrationDefinitionId: ids.definition,
  scopeClass: "TENANT_INDUSTRY",
  displayName: "Orders connector",
  status: "ACTIVE",
  credentialReferenceId: ids.credential,
  config: Object.freeze({mode: "opaque"}),
  enabledCapabilities: Object.freeze(["orders.sync"]),
  permissionProfileId: ids.profile,
  healthState: "HEALTHY",
  lastHealthAt: "2026-09-24T05:00:00.000Z",
  version: 7,
  createdAt: "2026-09-24T04:00:00.000Z",
  updatedAt: "2026-09-24T05:00:00.000Z",
});

const baseCredential = Object.freeze({
  id: ids.credential,
  tenantId: ids.tenantA,
  secretStoreProvider: "vault",
  credentialType: "API_KEY",
  keyVersion: 4,
  status: "ACTIVE",
  rotatedAt: "2026-09-23T00:00:00.000Z",
  createdAt: "2026-09-20T00:00:00.000Z",
});

function integration(overrides = {}) {
  return Object.freeze({...baseIntegration, ...overrides});
}

function credential(overrides = {}) {
  return Object.freeze({...baseCredential, ...overrides});
}

test("INT-CRED-CUR-001 exact ACTIVE non-expiring Tenant-Core credential binding matches", () => {
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      credential(),
      "2026-09-24T05:30:00.000Z",
    ),
    true,
  );
});

test("INT-CRED-CUR-002 Tenant-wide ACTIVE credential may bind exact Tenant-Industry integration", () => {
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration(),
      credential(),
      "2026-09-24T05:30:00.000Z",
    ),
    true,
  );
});

test("INT-CRED-CUR-003 exact Industry credential binds only its exact Tenant-Industry target", () => {
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration(),
      credential({industryContextId: ids.industryA}),
      "2026-09-24T05:30:00.000Z",
    ),
    true,
  );
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration(),
      credential({industryContextId: ids.industryB}),
      "2026-09-24T05:30:00.000Z",
    ),
    false,
  );
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      credential({industryContextId: ids.industryA}),
      "2026-09-24T05:30:00.000Z",
    ),
    false,
  );
});

test("INT-CRED-CUR-004 wrong credential identity or foreign Tenant fails closed", () => {
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration(),
      credential({id: ids.otherCredential}),
      "2026-09-24T05:30:00.000Z",
    ),
    false,
  );
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration(),
      credential({tenantId: ids.tenantB}),
      "2026-09-24T05:30:00.000Z",
    ),
    false,
  );
});

test("INT-CRED-CUR-005 non-ACTIVE CredentialReference status fails", () => {
  for (const status of ["PENDING", "PAUSED", "REVOKED", "EXPIRED"]) {
    assert.equal(
      matchesCurrentTenantIntegrationCredentialFloors(
        integration(),
        credential({status}),
        "2026-09-24T05:30:00.000Z",
      ),
      false,
      status,
    );
  }
});

test("INT-CRED-CUR-006 strict expiry currentness and malformed time evidence fail closed", () => {
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration(),
      credential({expiresAt: "2026-09-24T06:00:00.000Z"}),
      "2026-09-24T05:30:00.000Z",
    ),
    true,
  );
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration(),
      credential({expiresAt: "2026-09-24T05:30:00.000Z"}),
      "2026-09-24T05:30:00.000Z",
    ),
    false,
  );
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration(),
      credential({expiresAt: "2026-09-24T05:00:00.000Z"}),
      "2026-09-24T05:30:00.000Z",
    ),
    false,
  );
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration(),
      credential({expiresAt: "not-an-expiry"}),
      "2026-09-24T05:30:00.000Z",
    ),
    false,
  );
  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      integration(),
      credential(),
      "not-an-instant",
    ),
    false,
  );
});

test("INT-CRED-CUR-007 unrelated Integration and credential metadata remains uninterpreted without mutation", () => {
  const candidateIntegration = integration({
    status: "REVOKED",
    config: Object.freeze({uninterpreted: Object.freeze({anything: true})}),
    enabledCapabilities: Object.freeze(["duplicate", "duplicate"]),
    healthState: "UNAVAILABLE",
    lastHealthAt: "not-interpreted",
    permissionProfileId: undefined,
  });
  const candidateCredential = credential({
    secretStoreProvider: "",
    credentialType: "",
    keyVersion: -99,
    rotatedAt: "not-interpreted",
  });
  const beforeIntegration = JSON.stringify(candidateIntegration);
  const beforeCredential = JSON.stringify(candidateCredential);

  assert.equal(
    matchesCurrentTenantIntegrationCredentialFloors(
      candidateIntegration,
      candidateCredential,
      "2026-09-24T05:30:00.000Z",
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateIntegration), beforeIntegration);
  assert.equal(JSON.stringify(candidateCredential), beforeCredential);
  assert.equal(Object.isFrozen(candidateIntegration), true);
  assert.equal(Object.isFrozen(candidateCredential), true);
});
