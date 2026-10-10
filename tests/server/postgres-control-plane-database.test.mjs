import test from "node:test";
import assert from "node:assert/strict";

import {
  PostgresControlPlaneDatabase,
} from "../../dist/server/database/postgres-control-plane-database.js";

function fixture({fail = () => false, safe = true} = {}) {
  const calls = [];
  const client = {
    async query(text, parameters) {
      calls.push({text, parameters});
      if (fail(text)) throw new Error("private control-plane SQL/credential diagnostics");
      if (text.includes("FROM pg_roles")) {
        return {rows: [{safe}], rowCount: 1};
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
    client,
    database: new PostgresControlPlaneDatabase({connect: async () => client}),
  };
}

function scopeClear(calls) {
  return calls.find((call) =>
    typeof call.text === "string"
      && /set_config\('app\.operator_elevation_id'\s*,\s*''\s*,\s*true\)/.test(call.text));
}

function scopeReset(calls) {
  return calls.find((call) =>
    typeof call.text === "string"
      && call.text.includes("RESET app.operator_elevation_id"));
}

test("OPELEV-CP-SQL-001 Control Plane transaction pins fixed role and RLS before delegated work", async () => {
  const {database, calls} = fixture();
  await database.transaction(async (tx) => {
    await tx.query("SELECT control_plane_work");
  });

  const roleIndex = calls.findIndex((call) => call.text === "SET LOCAL ROLE sbg_control_plane_rw");
  const rlsIndex = calls.findIndex((call) => call.text === "SET LOCAL row_security = on");
  const workIndex = calls.findIndex((call) => call.text === "SELECT control_plane_work");

  assert.ok(roleIndex >= 0 && roleIndex < workIndex);
  assert.ok(rlsIndex >= 0 && rlsIndex < workIndex);
});

test("OPELEV-CP-SQL-002 startup clear removes Tenant, Industry, scope, principal and elevation settings before work", async () => {
  const {database, calls} = fixture();
  await database.transaction(async (tx) => {
    await tx.query("SELECT control_plane_work");
  });

  const clear = scopeClear(calls);
  const clearIndex = calls.indexOf(clear);
  const workIndex = calls.findIndex((call) => call.text === "SELECT control_plane_work");

  assert.ok(clear);
  assert.ok(clearIndex >= 0 && clearIndex < workIndex);
  for (const name of [
    "app.tenant_id",
    "app.industry_context_id",
    "app.scope_class",
    "app.principal_id",
    "app.operator_elevation_id",
  ]) {
    assert.match(clear.text, new RegExp(name.replaceAll(".", "\\.")));
  }
});

test("OPELEV-CP-SQL-003 unsafe role verification fails closed before delegated work", async () => {
  const {database, calls} = fixture({safe: false});
  let delegated = false;

  await assert.rejects(
    database.transaction(async () => {
      delegated = true;
    }),
    (error) => error.code === "DATABASE_ROLE_UNSAFE"
      && !error.message.includes("control-plane")
      && error.cause === undefined,
  );

  assert.equal(delegated, false);
  assert.equal(calls.some((call) => call.text === "COMMIT"), false);
});

test("OPELEV-CP-SQL-004 cleanup RESET includes elevation scope before reusable release", async () => {
  const {database, calls} = fixture();
  assert.equal(await database.transaction(async () => "ok"), "ok");

  const reset = scopeReset(calls);
  const resetIndex = calls.indexOf(reset);
  const releaseIndex = calls.findIndex((call) => Object.hasOwn(call, "release"));

  assert.ok(reset);
  assert.ok(resetIndex >= 0 && resetIndex < releaseIndex);
  assert.deepEqual(calls.at(-1), {release: false});
});

test("OPELEV-CP-SQL-005 elevation RESET cleanup failure destroys the pooled connection after commit", async () => {
  const {database, calls} = fixture({
    fail: (text) => text.includes("RESET app.operator_elevation_id"),
  });

  assert.equal(await database.transaction(async () => "committed"), "committed");
  assert.equal(calls.filter((call) => call.text === "COMMIT").length, 1);
  assert.deepEqual(calls.at(-1), {release: true});
});

test("OPELEV-CP-SQL-006 leaked transaction handle is closed before pooled release", async () => {
  const {database, calls} = fixture();
  let leaked;

  await database.transaction(async (tx) => {
    leaked = tx;
  });
  const count = calls.length;

  await assert.rejects(
    leaked.query("SELECT should_not_run"),
    (error) => error.code === "DATABASE_TRANSACTION_CLOSED",
  );
  assert.equal(calls.length, count);
});

test("OPELEV-CP-SQL-007 connect, setup and delegated query failures expose only safe database errors", async () => {
  const broken = new PostgresControlPlaneDatabase({
    connect: async () => {
      throw new Error("postgres://private-control-plane-secret");
    },
  });
  await assert.rejects(
    broken.transaction(async () => undefined),
    (error) => error.code === "DATABASE_UNAVAILABLE"
      && !error.message.includes("private")
      && error.cause === undefined,
  );

  for (const failingText of [
    "SET LOCAL ROLE sbg_control_plane_rw",
    "SELECT private_control_plane_data",
  ]) {
    const {database, calls} = fixture({
      fail: (text) => text === failingText,
    });
    await assert.rejects(
      database.transaction((tx) => tx.query("SELECT private_control_plane_data")),
      (error) => error.code.startsWith("DATABASE_")
        && !error.message.includes("private")
        && error.cause === undefined,
    );
    assert.equal(calls.at(-1).release, false);
  }
});
