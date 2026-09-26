import test from "node:test";
import assert from "node:assert/strict";
import { SessionSecurityService } from "../../dist/server/identity/session-security-service.js";
import { ContextResolutionError } from "../../dist/core/context/errors.js";

const human = Object.freeze({
  kind: "HUMAN",
  evidence: Object.freeze({
    principalId: "11111111-1111-1111-1111-111111111111",
    principalType: "HUMAN",
    providerSubject: "user-1",
    providerSessionId: "sess-1",
    providerSessionCreatedAtMs: 2000,
    authEpoch: 1,
    authStrength: "MFA",
    deviceId: "22222222-2222-2222-2222-222222222222",
  }),
});

function store(overrides = {}) {
  return {
    async getSessionVersion() { return { version: 4, changedAtMs: 1000 }; },
    async getDeviceRegistration() {
      return {
        id: "22222222-2222-2222-2222-222222222222",
        tenantId: "33333333-3333-3333-3333-333333333333",
        principalId: "11111111-1111-1111-1111-111111111111",
        status: "TRUSTED", riskLevel: "MEDIUM", registrationVersion: 7,
      };
    },
    ...overrides,
  };
}

test("session security rejects a provider session created before the internal scope epoch", async () => {
  const service = new SessionSecurityService(store({
    async getSessionVersion() { return { version: 5, changedAtMs: 3000 }; },
  }));
  await assert.rejects(service.validateAndResolve({
    authentication: human, tenantId: "33333333-3333-3333-3333-333333333333",
  }), (error) => error instanceof ContextResolutionError && error.code === "SESSION_INVALID");
});

test("trusted exact-tenant device and current session epoch produce server-owned security context", async () => {
  const service = new SessionSecurityService(store());
  const result = await service.validateAndResolve({
    authentication: human, tenantId: "33333333-3333-3333-3333-333333333333",
  });
  assert.equal(result.authStrength, "MFA");
  assert.equal(result.deviceTrust, "TRUSTED");
  assert.equal(result.riskLevel, "MEDIUM");
  assert.equal(result.sessionVersion, 4);
  assert.equal(result.attributes.deviceRegistrationVersion, 7);
});

test("revoked/pending/missing device fails closed and risk hold requires step-up", async () => {
  for (const status of ["REVOKED", "PENDING", null]) {
    const service = new SessionSecurityService(store({
      async getDeviceRegistration() {
        if (status === null) return null;
        return {
          id: human.evidence.deviceId,
          tenantId: "33333333-3333-3333-3333-333333333333",
          principalId: human.evidence.principalId,
          status, riskLevel: "HIGH", registrationVersion: 8,
        };
      },
    }));
    await assert.rejects(service.validateAndResolve({
      authentication: human, tenantId: "33333333-3333-3333-3333-333333333333",
    }), (error) => error instanceof ContextResolutionError && error.code === "DEVICE_UNTRUSTED");
  }

  const held = new SessionSecurityService(store({
    async getDeviceRegistration() {
      return {
        id: human.evidence.deviceId,
        tenantId: "33333333-3333-3333-3333-333333333333",
        principalId: human.evidence.principalId,
        status: "RISK_HOLD", riskLevel: "HIGH", registrationVersion: 9,
      };
    },
  }));
  await assert.rejects(held.validateAndResolve({
    authentication: human, tenantId: "33333333-3333-3333-3333-333333333333",
  }), (error) => error instanceof ContextResolutionError && error.code === "STEP_UP_REQUIRED");
});

test("absence of a device selector is not silently promoted to trusted device", async () => {
  const service = new SessionSecurityService(store());
  const result = await service.validateAndResolve({
    authentication: {
      ...human,
      evidence: { ...human.evidence, deviceId: undefined },
    },
    tenantId: "33333333-3333-3333-3333-333333333333",
  });
  assert.equal(result.deviceTrust, "NOT_APPLICABLE");
  assert.equal(result.sessionVersion, 4);
});

test("identity security store outage fails closed as dependency unavailable", async () => {
  const service = new SessionSecurityService(store({
    async getSessionVersion() { throw new Error("unavailable"); },
  }));
  await assert.rejects(service.validateAndResolve({
    authentication: human, tenantId: "33333333-3333-3333-3333-333333333333",
  }), (error) => error instanceof ContextResolutionError && error.code === "DEPENDENCY_UNAVAILABLE");
});

test("machine security remains credential-scoped and does not invent human device/session state", async () => {
  const service = new SessionSecurityService(store());
  const result = await service.validateAndResolve({
    authentication: {
      kind: "MACHINE",
      evidence: {
        principalId: "service-1", principalType: "SERVICE",
        credentialId: "cred-1", credentialVersion: 3,
        allowedIndustryContextIds: [], allowedScopeClasses: ["PLATFORM_GLOBAL"],
      },
    },
  });
  assert.equal(result.deviceTrust, "NOT_APPLICABLE");
  assert.equal(result.attributes.credentialVersion, 3);
});
