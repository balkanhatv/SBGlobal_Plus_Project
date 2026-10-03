import test from "node:test";
import assert from "node:assert/strict";
import { PostgresAuthorizationContextAdapter } from "../../dist/server/authorization/postgres-authorization-context.js";

function baseInput(overrides = {}) {
  return {
    requestId: "request-1",
    correlationId: "correlation-1",
    tenantId: "tenant-a",
    principalId: "principal-1",
    membershipId: "membership-1",
    orgUnitPath: [],
    dataHomeId: "home-1",
    regionCode: "IN-CENTRAL",
    scopeClass: "TENANT_CORE",
    ...overrides,
  };
}

test("PostgresAuthorizationContextAdapter rejects malformed scope before scoped SQL use", async () => {
  const calls = [];
  const adapter = new PostgresAuthorizationContextAdapter({
    async withContext(context, work) {
      calls.push({ context, work });
      assert.fail("malformed Authorization context must not reach scoped SQL");
    },
  });

  for (const input of [
    baseInput({ industryContextId: "" }),
    baseInput({ tenantId: "" }),
    baseInput({ scopeClass: "TENANT_INDUSTRY", industryContextId: undefined }),
    baseInput({ scopeClass: "EXPLICIT_CROSS_CONTEXT", industryContextId: "industry-a" }),
    baseInput({ scopeClass: "PUBLIC" }),
  ]) {
    await assert.rejects(
      adapter.loadRoleContext(input),
      (error) => error?.code === "DEPENDENCY_UNAVAILABLE",
    );
  }

  assert.deepEqual(calls, []);
});
