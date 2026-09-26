import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PostgresAuthorizationReadStore } from "../../dist/server/authorization/postgres-authorization-read-store.js";

function tenantContext(overrides = {}) {
  return {
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: randomUUID(),
    industryContextId: randomUUID(),
    dataHomeId: randomUUID(),
    regionCode: "IN-TEST",
    principalId: randomUUID(),
    principalType: "HUMAN",
    membershipId: randomUUID(),
    orgUnitId: randomUUID(),
    orgUnitPath: [],
    roleIds: [],
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  };
}

function fakeScopedSql(snapshotRow, policyRows, seen = []) {
  return {
    async withContext(context, work) {
      seen.push(context);
      return work({
        async query(text, parameters = []) {
          seen.push({ text, parameters });
          if (text.includes("compiled_platform_permission_subject")
            || text.includes("compiled_permission_subject subject")) {
            return snapshotRow
              ? { rowCount: 1, rows: [snapshotRow] }
              : { rowCount: 0, rows: [] };
          }
          if (text.includes("FROM core_authz.abac_policy")) {
            return { rowCount: policyRows.length, rows: policyRows };
          }
          throw new Error("unexpected query");
        },
      });
    },
  };
}

const validSnapshot = {
  permission_version: "7",
  role_ids: [randomUUID()],
  permission_schema_version: 1,
  permission_set_json: {
    permissions: [
      { code: "rtl.pos.sale.view", effect: "ALLOW" },
      { code: "rtl.pos.sale.void", effect: "DENY" },
    ],
  },
  source_fingerprint: "0123456789abcdef-reader-v1",
};

test("tenant read store parses current compiled permissions and only applicable ABAC v1 policies", async () => {
  const context = tenantContext();
  const policies = [
    {
      id: randomUUID(),
      code: "TENANT-BASELINE",
      tenant_id: context.tenantId,
      industry_context_id: null,
      applies_to_permission_pattern: "rtl.*",
      priority: 10,
      effect: "DENY",
      expression_version: 1,
      expression_ast_json: { op: "eq", attribute: "environment.risk", value: "HIGH" },
    },
    {
      id: randomUUID(),
      code: "UNRELATED-FUTURE",
      tenant_id: context.tenantId,
      industry_context_id: context.industryContextId,
      applies_to_permission_pattern: "mfg.*",
      priority: 20,
      effect: "DENY",
      expression_version: 99,
      expression_ast_json: { executable: "must-not-be-read" },
    },
    {
      id: randomUUID(),
      code: "INDUSTRY-EXACT",
      tenant_id: context.tenantId,
      industry_context_id: context.industryContextId,
      applies_to_permission_pattern: "rtl.pos.sale.view",
      priority: 30,
      effect: "RESTRICT",
      expression_version: 1,
      expression_ast_json: { op: "contains", attribute: "subject.roles", value: "CASHIER" },
    },
  ];
  const seen = [];
  const store = new PostgresAuthorizationReadStore(fakeScopedSql(validSnapshot, policies, seen));

  const state = await store.load({ requestContext: context, permissionCode: "rtl.pos.sale.view" });

  assert.equal(state.permissionSnapshot.scopeClass, "TENANT_INDUSTRY");
  assert.equal(state.permissionSnapshot.permissionVersion, 7);
  assert.deepEqual(state.permissionSnapshot.permissionSet.permissions, [
    { code: "rtl.pos.sale.view", effect: "ALLOW" },
    { code: "rtl.pos.sale.void", effect: "DENY" },
  ]);
  assert.deepEqual(state.policies.map((policy) => policy.code), ["TENANT-BASELINE", "INDUSTRY-EXACT"]);
  assert.ok(seen.some((entry) => entry?.text?.includes("subject.industry_context_id IS NOT DISTINCT FROM $2::uuid")));
});

test("platform read store uses only the dedicated platform compiled snapshot path", async () => {
  const context = {
    requestId: randomUUID(),
    correlationId: randomUUID(),
    principalId: randomUUID(),
    principalType: "PLATFORM_OPERATOR",
    orgUnitPath: [],
    roleIds: [],
    scopeClass: "PLATFORM_GLOBAL",
  };
  const seen = [];
  const store = new PostgresAuthorizationReadStore(fakeScopedSql(validSnapshot, [], seen));

  const state = await store.load({ requestContext: context, permissionCode: "rtl.pos.sale.view" });

  assert.equal(state.permissionSnapshot.scopeClass, "PLATFORM_GLOBAL");
  const snapshotQuery = seen.find((entry) => entry?.text?.includes("compiled_platform_permission_subject"));
  assert.ok(snapshotQuery);
  assert.equal(snapshotQuery.text.includes("core_authz.compiled_permission_subject subject"), false);
});

test("applicable malformed or unsupported persisted Authorization state fails closed", async () => {
  const context = tenantContext();
  const badPolicy = {
    id: randomUUID(),
    code: "BAD",
    tenant_id: context.tenantId,
    industry_context_id: null,
    applies_to_permission_pattern: "rtl.*",
    priority: 1,
    effect: "DENY",
    expression_version: 2,
    expression_ast_json: { op: "exists", attribute: "subject.principalId" },
  };
  const store = new PostgresAuthorizationReadStore(fakeScopedSql(validSnapshot, [badPolicy]));

  await assert.rejects(
    store.load({ requestContext: context, permissionCode: "rtl.pos.sale.view" }),
    (error) => error.code === "AUTHORIZATION_STATE_INVALID",
  );
});

test("missing current snapshot and unsupported scopes fail closed", async () => {
  const context = tenantContext();
  const missing = new PostgresAuthorizationReadStore(fakeScopedSql(null, []));
  await assert.rejects(
    missing.load({ requestContext: context, permissionCode: "rtl.pos.sale.view" }),
    (error) => error.code === "AUTHORIZATION_STATE_UNAVAILABLE",
  );

  const unsupported = new PostgresAuthorizationReadStore(fakeScopedSql(validSnapshot, []));
  await assert.rejects(
    unsupported.load({
      requestContext: {
        requestId: randomUUID(), correlationId: randomUUID(), orgUnitPath: [], roleIds: [], scopeClass: "PUBLIC",
      },
      permissionCode: "rtl.pos.sale.view",
    }),
    (error) => error.code === "AUTHORIZATION_SCOPE_UNSUPPORTED",
  );
});
