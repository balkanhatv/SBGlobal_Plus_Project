import test from "node:test";
import assert from "node:assert/strict";
import {
  ClerkIdentityAdapter,
  ClerkProviderError,
  inferClerkAuthStrength,
} from "../../dist/server/identity/clerk-identity-adapter.js";
import { ContextResolutionError } from "../../dist/core/context/errors.js";

function makeAdapter(overrides = {}) {
  const calls = [];
  const clerk = {
    async verifySessionToken() {
      calls.push("verify");
      return { subject: "user-1", sessionId: "sess-1", factorVerificationAgeMinutes: [3, 1] };
    },
    async getSession() {
      calls.push("session");
      return { id: "sess-1", userId: "user-1", status: "active", createdAtMs: 1000 };
    },
    async revokeSession(id) { calls.push(`revoke:${id}`); },
    ...overrides.clerk,
  };
  const store = {
    async resolveHumanProviderIdentity() {
      calls.push("directory");
      return { principalId: "11111111-1111-1111-1111-111111111111", principalType: "HUMAN", authEpoch: 4 };
    },
    ...overrides.store,
  };
  const machine = {
    async verifyMachineCredential() {
      calls.push("machine");
      return {
        principalId: "service-1", principalType: "SERVICE",
        credentialId: "cred-1", credentialVersion: 2,
        allowedIndustryContextIds: [], allowedScopeClasses: ["PLATFORM_GLOBAL"],
      };
    },
    ...overrides.machine,
  };
  return { adapter: new ClerkIdentityAdapter(clerk, store, machine), calls };
}

test("Clerk session maps signed provider identity to internal principal and carries only a device selector", async () => {
  const { adapter, calls } = makeAdapter();
  const evidence = await adapter.verifyHumanSession("opaque-token", "22222222-2222-2222-2222-222222222222");
  assert.equal(evidence.providerSubject, "user-1");
  assert.equal(evidence.providerSessionId, "sess-1");
  assert.equal(evidence.providerSessionCreatedAtMs, 1000);
  assert.equal(evidence.principalType, "HUMAN");
  assert.equal(evidence.authStrength, "MFA");
  assert.equal(evidence.deviceId, "22222222-2222-2222-2222-222222222222");
  assert.deepEqual(calls, ["verify", "session", "directory"]);
});

test("Clerk factor age is interpreted conservatively and never invents SSO/phishing-resistant strength", () => {
  assert.equal(inferClerkAuthStrength([4, 0]), "MFA");
  assert.equal(inferClerkAuthStrength([4, -1]), "PASSWORD");
  assert.equal(inferClerkAuthStrength(undefined), "PASSWORD");
});

test("invalid/inactive/mismatched provider sessions fail closed as SESSION_INVALID", async () => {
  for (const overrides of [
    { clerk: { async verifySessionToken() { throw new ClerkProviderError("TOKEN_INVALID"); } } },
    { clerk: { async getSession() { return { id: "sess-1", userId: "user-1", status: "revoked", createdAtMs: 1000 }; } } },
    { clerk: { async getSession() { return { id: "sess-1", userId: "other-user", status: "active", createdAtMs: 1000 }; } } },
  ]) {
    const { adapter } = makeAdapter(overrides);
    await assert.rejects(adapter.verifyHumanSession("bad"),
      (error) => error instanceof ContextResolutionError && error.code === "SESSION_INVALID");
  }
});

test("Clerk or identity-directory outage never falls back to weaker identity truth", async () => {
  for (const overrides of [
    { clerk: { async getSession() { throw new ClerkProviderError("DEPENDENCY_UNAVAILABLE"); } } },
    { store: { async resolveHumanProviderIdentity() { throw new Error("database unavailable"); } } },
  ]) {
    const { adapter } = makeAdapter(overrides);
    await assert.rejects(adapter.verifyHumanSession("opaque"),
      (error) => error instanceof ContextResolutionError && error.code === "DEPENDENCY_UNAVAILABLE");
  }
});

test("machine credentials remain on their separate verifier and provider revocation uses session id", async () => {
  const { adapter, calls } = makeAdapter();
  const machine = await adapter.verifyMachineCredential("machine-secret");
  assert.equal(machine.principalType, "SERVICE");
  await adapter.revokeProviderSession("sess-1");
  assert.deepEqual(calls, ["machine", "revoke:sess-1"]);
});
