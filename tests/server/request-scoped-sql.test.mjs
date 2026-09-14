import test from "node:test";
import assert from "node:assert/strict";

import {
  DatabaseScopeError,
  RequestScopedSql,
} from "../../dist/server/database/request-scoped-sql.js";

function makeDatabase() {
  const events = [];
  const transaction = {
    async query(text, parameters = []) {
      events.push({ type: "query", text, parameters });
      return { rows: [], rowCount: 0 };
    },
  };

  return {
    events,
    database: {
      async transaction(work) {
        events.push({ type: "transaction.start" });
        try {
          const result = await work(transaction);
          events.push({ type: "transaction.commit" });
          return result;
        } catch (error) {
          events.push({ type: "transaction.rollback" });
          throw error;
        }
      },
    },
  };
}

const industryContext = Object.freeze({
  requestId: "request-db-1",
  correlationId: "correlation-db-1",
  tenantId: "tenant-a",
  industryContextId: "industry-retail",
  principalId: "principal-1",
  principalType: "HUMAN",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  scopeClass: "TENANT_INDUSTRY",
});

test("INF-015: transaction-local Tenant/Industry/principal scope is set before business query", async () => {
  const { database, events } = makeDatabase();
  const scoped = new RequestScopedSql(database);

  await scoped.withContext(industryContext, async (tx) => {
    await tx.query("SELECT 1");
  });

  assert.equal(events[0].type, "transaction.start");
  assert.equal(events[1].type, "query");
  assert.match(events[1].text, /set_config\('app\.tenant_id'/);
  assert.deepEqual(events[1].parameters, [
    "tenant-a",
    "industry-retail",
    "TENANT_INDUSTRY",
    "principal-1",
    "",
  ]);
  assert.equal(events[2].text, "SELECT 1");
  assert.equal(events.at(-1).type, "transaction.commit");
});

test("TENANT_CORE explicitly resets Industry Context to empty transaction-local value", async () => {
  const { database, events } = makeDatabase();
  const scoped = new RequestScopedSql(database);

  await scoped.withContext({
    ...industryContext,
    scopeClass: "TENANT_CORE",
    industryContextId: undefined,
  }, async () => undefined);

  assert.deepEqual(events[1].parameters, [
    "tenant-a",
    "",
    "TENANT_CORE",
    "principal-1",
    "",
  ]);
});

test("PLATFORM_GLOBAL requires authenticated principal and carries no Tenant/Industry Context", async () => {
  const { database, events } = makeDatabase();
  const scoped = new RequestScopedSql(database);

  await scoped.withContext({
    requestId: "request-platform-1",
    correlationId: "correlation-platform-1",
    principalId: "operator-1",
    principalType: "PLATFORM_OPERATOR",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "PLATFORM_GLOBAL",
  }, async () => undefined);

  assert.deepEqual(events[1].parameters, [
    "",
    "",
    "PLATFORM_GLOBAL",
    "operator-1",
    "",
  ]);
});

test("PUBLIC scope is rejected before opening a private DB transaction", async () => {
  const { database, events } = makeDatabase();
  const scoped = new RequestScopedSql(database);

  await assert.rejects(
    scoped.withContext({
      requestId: "request-public-1",
      correlationId: "correlation-public-1",
      orgUnitPath: Object.freeze([]),
      roleIds: Object.freeze([]),
      scopeClass: "PUBLIC",
    }, async () => undefined),
    (error) => error instanceof DatabaseScopeError
      && error.code === "DATABASE_PUBLIC_SCOPE_FORBIDDEN",
  );

  assert.deepEqual(events, []);
});

test("EXPLICIT_CROSS_CONTEXT cannot use generic repository path", async () => {
  const { database, events } = makeDatabase();
  const scoped = new RequestScopedSql(database);

  await assert.rejects(
    scoped.withContext({
      ...industryContext,
      scopeClass: "EXPLICIT_CROSS_CONTEXT",
    }, async () => undefined),
    (error) => error instanceof DatabaseScopeError
      && error.code === "DATABASE_CROSS_CONTEXT_REQUIRES_DEDICATED_PATH",
  );

  assert.deepEqual(events, []);
});

test("TENANT_INDUSTRY missing Industry Context fails before pooled connection use", async () => {
  const { database, events } = makeDatabase();
  const scoped = new RequestScopedSql(database);

  await assert.rejects(
    scoped.withContext({
      ...industryContext,
      industryContextId: undefined,
    }, async () => undefined),
    (error) => error instanceof DatabaseScopeError
      && error.code === "DB_ROUTE_CONTEXT_MISMATCH",
  );

  assert.deepEqual(events, []);
});

test("work failure propagates and transaction wrapper observes rollback path", async () => {
  const { database, events } = makeDatabase();
  const scoped = new RequestScopedSql(database);

  await assert.rejects(
    scoped.withContext(industryContext, async () => {
      throw new Error("domain-failure");
    }),
    /domain-failure/,
  );

  assert.equal(events.at(-1).type, "transaction.rollback");
});
