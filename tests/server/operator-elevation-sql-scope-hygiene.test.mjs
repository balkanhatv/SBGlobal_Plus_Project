import test from "node:test";
import assert from "node:assert/strict";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import {
  PostgresContextBootstrapDatabase,
} from "../../dist/server/database/postgres-context-bootstrap-database.js";
import {
  RequestScopedSql,
} from "../../dist/server/database/request-scoped-sql.js";

function databaseFixture(DatabaseClass, fail = () => false) {
  const calls = [];
  const client = {
    async query(text, parameters) {
      calls.push({text, parameters});
      if (fail(text)) throw new Error("simulated private database failure");
      if (text.includes("FROM pg_roles")) {
        return {rows: [{safe: true}], rowCount: 1};
      }
      return {
        command: text === "COMMIT" ? "COMMIT" : "SELECT",
        rows: [],
        rowCount: 0,
      };
    },
    release(destroy) {
      calls.push({release: destroy});
    },
  };
  return {
    calls,
    database: new DatabaseClass({connect: async () => client}),
  };
}

function findScopeClear(calls) {
  return calls.find((call) =>
    typeof call.text === "string"
      && /set_config\('app\.operator_elevation_id'\s*,\s*''\s*,\s*true\)/.test(call.text));
}

function findScopeReset(calls) {
  return calls.find((call) =>
    typeof call.text === "string"
      && call.text.includes("RESET app.operator_elevation_id"));
}

test("OPELEV-SQL-001 application PostgresDatabase clears elevation scope before work", async () => {
  const {database, calls} = databaseFixture(PostgresDatabase);
  await database.transaction(async (tx) => {
    await tx.query("SELECT application_work");
  });

  const clear = findScopeClear(calls);
  const workIndex = calls.findIndex((call) => call.text === "SELECT application_work");
  const clearIndex = calls.indexOf(clear);

  assert.ok(clear);
  assert.ok(clearIndex >= 0 && clearIndex < workIndex);
  assert.match(clear.text, /set_config\('app\.operator_elevation_id','',true\)/);
});

test("OPELEV-SQL-002 application cleanup RESET includes elevation scope before reusable release", async () => {
  const {database, calls} = databaseFixture(PostgresDatabase);
  assert.equal(await database.transaction(async () => "ok"), "ok");

  const reset = findScopeReset(calls);
  const resetIndex = calls.indexOf(reset);
  const releaseIndex = calls.findIndex((call) => Object.hasOwn(call, "release"));

  assert.ok(reset);
  assert.ok(resetIndex >= 0 && resetIndex < releaseIndex);
  assert.deepEqual(calls.at(-1), {release: false});
});

test("OPELEV-SQL-003 application elevation RESET cleanup failure destroys the pooled connection", async () => {
  const {database, calls} = databaseFixture(
    PostgresDatabase,
    (text) => text.includes("RESET app.operator_elevation_id"),
  );

  assert.equal(await database.transaction(async () => "committed"), "committed");
  assert.deepEqual(calls.at(-1), {release: true});
});

test("OPELEV-SQL-004 bootstrap PostgresContextBootstrapDatabase clears elevation scope before work", async () => {
  const {database, calls} = databaseFixture(PostgresContextBootstrapDatabase);
  await database.transaction(async (tx) => {
    await tx.query("SELECT bootstrap_work");
  });

  const clear = findScopeClear(calls);
  const workIndex = calls.findIndex((call) => call.text === "SELECT bootstrap_work");
  const clearIndex = calls.indexOf(clear);

  assert.ok(clear);
  assert.ok(clearIndex >= 0 && clearIndex < workIndex);
});

test("OPELEV-SQL-005 bootstrap cleanup RESET includes elevation scope before reusable release", async () => {
  const {database, calls} = databaseFixture(PostgresContextBootstrapDatabase);
  assert.equal(await database.transaction(async () => "ok"), "ok");

  const reset = findScopeReset(calls);
  const resetIndex = calls.indexOf(reset);
  const releaseIndex = calls.findIndex((call) => Object.hasOwn(call, "release"));

  assert.ok(reset);
  assert.ok(resetIndex >= 0 && resetIndex < releaseIndex);
  assert.deepEqual(calls.at(-1), {release: false});
});

test("OPELEV-SQL-006 bootstrap elevation RESET cleanup failure destroys the pooled connection", async () => {
  const {database, calls} = databaseFixture(
    PostgresContextBootstrapDatabase,
    (text) => text.includes("RESET app.operator_elevation_id"),
  );

  assert.equal(await database.transaction(async () => "committed"), "committed");
  assert.deepEqual(calls.at(-1), {release: true});
});

test("OPELEV-SQL-007 RequestScopedSql ignores smuggled operatorElevationId and keeps fifth setting empty", async () => {
  const events = [];
  const transaction = {
    async query(text, parameters = []) {
      events.push({text, parameters});
      return {rows: [], rowCount: 0};
    },
  };
  const database = {
    async transaction(work) {
      return work(transaction);
    },
  };
  const scoped = new RequestScopedSql(database, {
    dataHomeId: "home-in",
    regionCode: "IN",
  });

  await scoped.withContext({
    requestId: "dd155-request",
    correlationId: "dd155-correlation",
    tenantId: "tenant-a",
    industryContextId: "industry-a",
    dataHomeId: "home-in",
    regionCode: "IN",
    principalId: "operator-a",
    principalType: "PLATFORM_OPERATOR",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
    operatorElevationId: "11111111-1111-4111-8111-111111111111",
  }, async () => undefined);

  assert.equal(events.length, 1);
  assert.match(events[0].text, /set_config\('app\.operator_elevation_id'/);
  assert.deepEqual(events[0].parameters, [
    "tenant-a",
    "industry-a",
    "TENANT_INDUSTRY",
    "operator-a",
    "",
  ]);
});
