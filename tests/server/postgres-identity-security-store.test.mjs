import test from "node:test";
import assert from "node:assert/strict";
import { PostgresIdentitySecurityStore } from "../../dist/server/identity/postgres-identity-security-store.js";

function database(rowsByNeed) {
  return {
    async transaction(work) {
      return work({
        async query(text, parameters) {
          if (text.includes("identity_provider_link")) return { rows: rowsByNeed.identity ?? [], rowCount: (rowsByNeed.identity ?? []).length };
          if (text.includes("session_version")) return { rows: rowsByNeed.session ?? [], rowCount: (rowsByNeed.session ?? []).length };
          if (text.includes("device_registration")) return { rows: rowsByNeed.device ?? [], rowCount: (rowsByNeed.device ?? []).length };
          throw new Error(`unexpected query ${text} ${parameters}`);
        },
      });
    },
  };
}

test("identity store resolves only active provider-link and human/platform principal projection", async () => {
  const store = new PostgresIdentitySecurityStore(database({
    identity: [{ principal_id: "p1", principal_type: "HUMAN", auth_epoch: "7" }],
  }));
  assert.deepEqual(await store.resolveHumanProviderIdentity({ provider: "CLERK", providerSubject: "user-1" }), {
    principalId: "p1", principalType: "HUMAN", authEpoch: 7,
  });
});

test("identity store reads the exact nullable-tenant session-version row", async () => {
  const store = new PostgresIdentitySecurityStore(database({
    session: [{ version: "4", changed_at_ms: "1700000000000" }],
  }));
  assert.deepEqual(await store.getSessionVersion({ principalId: "p1" }), {
    version: 4, changedAtMs: 1700000000000,
  });
});

test("identity store returns exact device ownership/security fields", async () => {
  const store = new PostgresIdentitySecurityStore(database({
    device: [{
      id: "d1", tenant_id: "t1", principal_id: "p1",
      status: "TRUSTED", risk_level: "LOW", registration_version: "3",
    }],
  }));
  assert.deepEqual(await store.getDeviceRegistration({ deviceId: "d1", principalId: "p1", tenantId: "t1" }), {
    id: "d1", tenantId: "t1", principalId: "p1",
    status: "TRUSTED", riskLevel: "LOW", registrationVersion: 3,
  });
});
