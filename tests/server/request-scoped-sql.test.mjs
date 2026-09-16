import test from "node:test";
import assert from "node:assert/strict";

test("validated route and context cannot change while awaiting a pooled connection", async () => {
  const { database, events } = makeDatabase();
  let resume;
  const deferred = { transaction: (work) => new Promise((resolve, reject) => {
    resume = () => database.transaction(work).then(resolve, reject);
  }) };
  const route = { dataHomeId: "home-in", regionCode: "IN" };
  const scoped = new RequestScopedSql(deferred, route);
  const request = { ...industryContext };
  const pending = scoped.withContext(request, async () => {});
  request.tenantId = "tenant-foreign";
  request.industryContextId = "industry-foreign";
  route.regionCode = "foreign-region";
  await resume();
  await pending;
  assert.deepEqual(events[1].parameters, ["tenant-a", "industry-retail", "TENANT_INDUSTRY", "principal-1", ""]);
  const second = scoped.withContext(industryContext, async () => {});
  await resume();
  await second;
});

test("unknown runtime scope, missing/wrong data home, region and dedicated Tenant fail before checkout", async () => {
  for (const changes of [
    { scopeClass: "TENANT_ALL" }, { dataHomeId: undefined },
    { dataHomeId: "foreign-home" }, { regionCode: "foreign-region" },
    { tenantId: "tenant-b" },
  ]) {
    const { database, events } = makeDatabase();
    const scoped = new RequestScopedSql(database, {
      dataHomeId: "home-in", regionCode: "IN", dedicatedTenantId: "tenant-a",
    });
    await assert.rejects(scoped.withContext({ ...industryContext, ...changes }, async () => {}),
      (error) => error.code === "DB_ROUTE_CONTEXT_MISMATCH");
    assert.deepEqual(events, []);
  }
});

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
  dataHomeId: "home-in",
  regionCode: "IN",
  industryContextId: "industry-retail",
  principalId: "principal-1",
  principalType: "HUMAN",
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  scopeClass: "TENANT_INDUSTRY",
});

test("INF-015: transaction-local Tenant/Industry/principal scope is set before business query", async () => {
  const { database, events } = makeDatabase();
  const scoped = new RequestScopedSql(database, { dataHomeId: "home-in", regionCode: "IN" });

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
  const scoped = new RequestScopedSql(database, { dataHomeId: "home-in", regionCode: "IN" });

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
  const scoped = new RequestScopedSql(database, { dataHomeId: "home-in", regionCode: "IN" });

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
  const scoped = new RequestScopedSql(database, { dataHomeId: "home-in", regionCode: "IN" });

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
  const scoped = new RequestScopedSql(database, { dataHomeId: "home-in", regionCode: "IN" });

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
  const scoped = new RequestScopedSql(database, { dataHomeId: "home-in", regionCode: "IN" });

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
  const scoped = new RequestScopedSql(database, { dataHomeId: "home-in", regionCode: "IN" });

  await assert.rejects(
    scoped.withContext(industryContext, async () => {
      throw new Error("domain-failure");
    }),
    /domain-failure/,
  );

  assert.equal(events.at(-1).type, "transaction.rollback");
});


test("RequestScopedSql rejects ordinary human/API client PLATFORM_GLOBAL SQL context before route/pool use", async () => {
  const db = {
    async transaction() { throw new Error("transaction must not be reached"); },
  };
  const routes = {
    async resolveDataHomeRoute() { throw new Error("route must not be reached"); },
  };
  const scoped = new RequestScopedSql(db, routes);
  for (const principalType of ["HUMAN", "API_CLIENT"]) {
    await assert.rejects(scoped.withRequestContext({
      tenantId: undefined,
      industryContextId: undefined,
      principalId: "tenant-principal",
      principalType,
      operatorElevationId: undefined,
      scopeClass: "PLATFORM_GLOBAL",
      dataHome: undefined,
    }, async () => null), (error) => error instanceof SafeDatabaseError
      && error.code === "DATABASE_CONTEXT_INVALID");
  }
});

test("RequestScopedSql permits only trusted PLATFORM_OPERATOR/SERVICE principal types for PLATFORM_GLOBAL", async () => {
  const observed = [];
  const db = {
    async transaction(options, callback) {
      observed.push(options);
      return callback({ query: async () => ({ rows: [], rowCount: 0 }) });
    },
  };
  const routes = { async resolveDataHomeRoute() { return null; } };
  const scoped = new RequestScopedSql(db, routes);
  for (const principalType of ["PLATFORM_OPERATOR", "SERVICE"]) {
    await scoped.withRequestContext({
      principalId: principalType.toLowerCase(),
      principalType,
      scopeClass: "PLATFORM_GLOBAL",
    }, async () => null);
  }
  assert.equal(observed.length, 2);
  assert.equal(observed.every(x => x.context.scopeClass === "PLATFORM_GLOBAL"), true);
});
