import test from "node:test";
import assert from "node:assert/strict";
import { PostgresEffectiveRoleReadAdapter } from "../../dist/server/authorization/postgres-authorization-context.js";

test("PostgresEffectiveRoleReadAdapter refuses Tenant-Core Industry evidence before scoped SQL use", async () => {
  const calls = [];
  const adapter = new PostgresEffectiveRoleReadAdapter({
    async withContext(context, work) {
      calls.push({ context, work });
      assert.fail("malformed Tenant-Core scope must not reach scoped SQL");
    },
  });

  const result = await adapter.listEffective({
    requestContext: {
      requestId: "req-1",
      correlationId: "corr-1",
      tenantId: "tenant-a",
      industryContextId: "",
      dataHomeId: "home-1",
      regionCode: "IN-CENTRAL",
      principalId: "principal-1",
      principalType: "HUMAN",
      membershipId: "membership-1",
      orgUnitPath: [],
      roleIds: [],
      scopeClass: "TENANT_CORE",
    },
    principalId: "principal-1",
    membershipId: "membership-1",
  });

  assert.equal(result, null);
  assert.deepEqual(calls, []);
});
