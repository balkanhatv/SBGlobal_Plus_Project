import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesApiCredentialCurrentLifecycleFloor,
} from "../../dist/server/identity/api-credential-current-lifecycle.js";

const base = Object.freeze({
  id: "11111111-1111-4111-8111-111111111111",
  tenantId: "22222222-2222-4222-8222-222222222222",
  principalId: "33333333-3333-4333-8333-333333333333",
  keyPrefix: "prefix",
  secretHash: "opaque-verifier-material",
  status: "ACTIVE",
  permissionProfileId: "44444444-4444-4444-8444-444444444444",
  lastUsedAt: "2026-09-23T23:00:00.000Z",
  allowedCidrs: Object.freeze(["10.0.0.0/8"]),
  credentialVersion: "7",
  createdAt: "2026-09-20T00:00:00.000Z",
  allowedIndustryContextIds: Object.freeze([
    "55555555-5555-4555-8555-555555555555",
  ]),
});

function material(overrides = {}) {
  return Object.freeze({...base, ...overrides});
}

test("APICRED-LIFE-001 ACTIVE credential with no expiry matches", () => {
  assert.equal(
    matchesApiCredentialCurrentLifecycleFloor(
      material(),
      "2026-09-24T03:30:00.000Z",
    ),
    true,
  );
});

test("APICRED-LIFE-002 ACTIVE credential before future expiry matches", () => {
  assert.equal(
    matchesApiCredentialCurrentLifecycleFloor(
      material({expiresAt: "2026-09-24T04:00:00.000Z"}),
      "2026-09-24T03:30:00.000Z",
    ),
    true,
  );
});

test("APICRED-LIFE-003 exact expiry boundary fails", () => {
  assert.equal(
    matchesApiCredentialCurrentLifecycleFloor(
      material({expiresAt: "2026-09-24T03:30:00.000Z"}),
      "2026-09-24T03:30:00.000Z",
    ),
    false,
  );
});

test("APICRED-LIFE-004 after expiry fails", () => {
  assert.equal(
    matchesApiCredentialCurrentLifecycleFloor(
      material({expiresAt: "2026-09-24T03:00:00.000Z"}),
      "2026-09-24T03:30:00.000Z",
    ),
    false,
  );
});

test("APICRED-LIFE-005 SUSPENDED, REVOKED and EXPIRED statuses fail regardless of expiry", () => {
  for (const status of ["SUSPENDED", "REVOKED", "EXPIRED"]) {
    assert.equal(
      matchesApiCredentialCurrentLifecycleFloor(
        material({
          status,
          expiresAt: "2026-09-25T03:30:00.000Z",
        }),
        "2026-09-24T03:30:00.000Z",
      ),
      false,
    );
  }
});

test("APICRED-LIFE-006 malformed evaluation or persisted expiry fails closed", () => {
  assert.equal(
    matchesApiCredentialCurrentLifecycleFloor(
      material(),
      "not-an-instant",
    ),
    false,
  );
  assert.equal(
    matchesApiCredentialCurrentLifecycleFloor(
      material({expiresAt: "not-an-expiry"}),
      "2026-09-24T03:30:00.000Z",
    ),
    false,
  );
});

test("APICRED-LIFE-007 hash, CIDR, profile, scope, version and use metadata are ignored and material is not mutated", () => {
  const candidate = material({
    secretHash: "",
    permissionProfileId: undefined,
    lastUsedAt: "not-used-for-currentness",
    allowedCidrs: Object.freeze(["192.0.2.0/24"]),
    credentialVersion: "-9223372036854775808",
    allowedIndustryContextIds: Object.freeze([]),
    revokedAt: "not-used-when-status-is-active",
  });
  const before = JSON.stringify(candidate);

  assert.equal(
    matchesApiCredentialCurrentLifecycleFloor(
      candidate,
      "2026-09-24T03:30:00.000Z",
    ),
    true,
  );
  assert.equal(JSON.stringify(candidate), before);
  assert.equal(Object.isFrozen(candidate), true);
});
